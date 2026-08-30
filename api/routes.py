"""
FastAPI Route Handlers for TrueForge Agent.
Provides session creation, SSE streaming with reconnect replay, approval endpoints, and MCP tool APIs.
"""
from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import json
import asyncio
import logging

from .session_manager import session_manager_instance
from mcp_server.server import mcp_server_instance
from agent.approval_gate import approval_gate_instance

logger = logging.getLogger("api_routes")
router = APIRouter(prefix="/api")

class CreateSessionRequest(BaseModel):
    goal: str = Field(..., json_schema_extra={"example": "Setup ergonomic home office in 12x10 room with desk, chair, dual monitors under $1500"})
    room: Optional[Dict[str, Any]] = None
    budget: float = Field(default=2000.0, json_schema_extra={"example": 1500.0})
    preferred_style: str = "Ergonomic & Modern"
    auto_start: bool = True

class ApproveSessionRequest(BaseModel):
    notes: Optional[str] = None

class RejectSessionRequest(BaseModel):
    reason: str = "User declined order proposal"

@router.post("/sessions")
async def create_session(payload: CreateSessionRequest):
    """Create a new agent session and optionally start autonomous execution."""
    session = session_manager_instance.create_session(
        goal=payload.goal,
        room_data=payload.room,
        budget=payload.budget,
        preferred_style=payload.preferred_style
    )
    if payload.auto_start:
        session_manager_instance.start_session_task(session.session_id)

    return {
        "session_id": session.session_id,
        "status": session.status,
        "goal": session.goal,
        "budget": session.budget,
        "room": session.room.model_dump(),
        "created_at": session.created_at
    }

@router.get("/sessions")
async def list_sessions():
    """List all active and completed sessions."""
    return {"sessions": session_manager_instance.list_sessions()}

@router.get("/sessions/{session_id}")
async def get_session_snapshot(session_id: str):
    """Retrieve full session state, placed items, layout score, and approval status."""
    session = session_manager_instance.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    approval_req = approval_gate_instance.get_pending_request(session_id)

    return {
        "session_id": session.session_id,
        "goal": session.goal,
        "status": session.status,
        "budget": session.budget,
        "room": session.room.model_dump(),
        "selected_products": session.selected_products,
        "layout_result": session.layout_result,
        "order_payload": session.order_payload.model_dump() if session.order_payload else None,
        "order_result": session.order_result,
        "approval_request": approval_req.model_dump() if approval_req else None,
        "event_count": len(session.events),
        "created_at": session.created_at,
        "updated_at": session.updated_at
    }

@router.post("/sessions/{session_id}/start")
async def start_session(session_id: str):
    """Manually start or continue a session execution."""
    session = session_manager_instance.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    
    session_manager_instance.start_session_task(session_id)
    return {"status": "started", "session_id": session_id}

@router.post("/sessions/{session_id}/approve")
async def approve_session_order(session_id: str, payload: Optional[ApproveSessionRequest] = None):
    """
    Approve gated place_order action, generating cryptographic verification token
    and resuming agent execution.
    """
    try:
        res = await session_manager_instance.approve_and_resume(session_id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error approving session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/reject")
async def reject_session_order(session_id: str, payload: RejectSessionRequest):
    """Reject pending order action."""
    try:
        res = await session_manager_instance.reject_session(session_id, payload.reason)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sessions/{session_id}/stream")
async def stream_session_events(
    session_id: str,
    request: Request,
    from_seq: int = Query(default=0, description="Replay events starting from sequence number for reload/reconnect resilience")
):
    """
    Server-Sent Events (SSE) streaming endpoint.
    - Replays existing event log on connect/reconnect (zero state loss).
    - Streams live execution events in real-time.
    """
    session = session_manager_instance.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    q = session_manager_instance.subscribe(session_id)

    async def event_generator():
        try:
            # 1. Replay historical events up to now (handles mid-session reconnects cleanly!)
            existing_events = [ev for ev in session.events if ev.sequence > from_seq]
            for ev in existing_events:
                yield f"event: {ev.event_type}\nid: {ev.sequence}\ndata: {json.dumps(ev.to_dict())}\n\n"

            # 2. Stream live incoming events
            while True:
                if await request.is_disconnected():
                    break

                try:
                    event = await asyncio.wait_for(q.get(), timeout=2.0)
                    yield f"event: {event.event_type}\nid: {event.sequence}\ndata: {json.dumps(event.to_dict())}\n\n"

                    # If session reaches final terminal state, give a short grace period then end
                    if event.event_type in ["session_completed", "approval_rejected"]:
                        await asyncio.sleep(0.5)
                        break

                except asyncio.TimeoutError:
                    # Send periodic SSE ping/heartbeat to keep connection alive
                    yield ": heartbeat\n\n"

        except asyncio.CancelledError:
            pass
        finally:
            session_manager_instance.unsubscribe(session_id, q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# Direct MCP Tool endpoints
@router.get("/mcp/tools")
async def get_mcp_tools():
    """List all MCP tools provided by the catalog server."""
    return {"tools": mcp_server_instance.list_tools()}

@router.post("/mcp/call")
async def call_mcp_tool(payload: Dict[str, Any]):
    """Execute an MCP tool directly via API."""
    tool_name = payload.get("name")
    arguments = payload.get("arguments", {})
    if not tool_name:
        raise HTTPException(status_code=400, detail="Missing tool 'name'")
    
    result = mcp_server_instance.execute_tool(tool_name, arguments)
    return result
