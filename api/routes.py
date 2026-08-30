"""
FastAPI Route Handlers for The Renovation Architect.
Implements the exact REST and SSE streaming contract defined for the frontend integration.
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
router = APIRouter()

class RoomInput(BaseModel):
    width_ft: Optional[float] = Field(default=12.0, gt=0, le=100)
    length_ft: Optional[float] = Field(default=10.0, gt=0, le=100)
    width: Optional[float] = Field(default=None, gt=0, le=100)
    length: Optional[float] = Field(default=None, gt=0, le=100)
    door_wall: Optional[str] = "south"
    door_position: Optional[float] = Field(default=3.0, ge=0)
    door_width: Optional[float] = Field(default=3.0, gt=0, le=20)

class CreateSessionRequest(BaseModel):
    prompt: Optional[str] = Field(default="Setup modern ergonomic workspace under $1600", max_length=1000)
    goal: Optional[str] = Field(default=None, max_length=1000)  # Compatibility alias
    room: Optional[Dict[str, Any]] = None
    budget: Optional[float] = Field(default=2000.0, gt=0, le=500000)
    preferred_style: Optional[str] = "Modern & Ergonomic"
    auto_start: Optional[bool] = True

class ApproveSessionRequest(BaseModel):
    approved: Optional[bool] = True
    notes: Optional[str] = None
    reason: Optional[str] = "User declined order proposal"

# -------------------------------------------------------------
# Core Contract Endpoints: POST /session, GET /session/:id/events,
# POST /session/:id/approve, GET /session/:id/state
# -------------------------------------------------------------

@router.post("/session")
@router.post("/api/session")
@router.post("/api/sessions")
async def create_session(payload: CreateSessionRequest):
    """
    POST /session -> { room: {width_ft, length_ft}, prompt: string } -> returns { session_id }
    """
    user_prompt = payload.prompt or payload.goal or "Setup modern ergonomic workspace under $1600"
    room_data = payload.room or {"width_ft": 12.0, "length_ft": 10.0, "door_wall": "south"}
    
    session = session_manager_instance.create_session(
        prompt=user_prompt,
        room_data=room_data,
        budget=payload.budget or 2000.0,
        preferred_style=payload.preferred_style or "Modern & Ergonomic"
    )

    if payload.auto_start:
        session_manager_instance.start_session_task(session.session_id)

    return {
        "session_id": session.session_id,
        "status": session.status,
        "prompt": session.prompt,
        "budget": session.budget,
        "room": session.room,
        "created_at": session.created_at
    }

@router.get("/session/{session_id}/state")
@router.get("/api/session/{session_id}/state")
@router.get("/api/sessions/{session_id}")
async def get_session_state(session_id: str):
    """
    GET /session/:id/state -> full current state (for reconnect/resume):
    current mood board items, budget so far, layout result if computed, pending approval if any
    """
    session = session_manager_instance.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    approval_req = approval_gate_instance.get_pending_request(session_id)
    total_cost = sum(it.get("price", 0.0) for it in session.mood_board_items)

    return {
        "session_id": session.session_id,
        "status": session.status,
        "prompt": session.prompt,
        "goal": session.prompt, # compatibility
        "budget": session.budget,
        "room": session.room,
        "mood_board_items": session.mood_board_items,
        "selected_products": session.mood_board_items, # compatibility
        "total_cost": round(total_cost, 2),
        "layout_result": session.layout_result,
        "pending_approval": approval_req.model_dump() if approval_req else None,
        "approval_request": approval_req.model_dump() if approval_req else None, # compatibility
        "order_payload": session.order_payload.model_dump() if session.order_payload else None,
        "order_result": session.order_result,
        "event_count": len(session.events),
        "created_at": session.created_at,
        "updated_at": session.updated_at
    }

@router.post("/session/{session_id}/approve")
@router.post("/api/session/{session_id}/approve")
@router.post("/api/sessions/{session_id}/approve")
async def approve_session_order(session_id: str, payload: Optional[ApproveSessionRequest] = None):
    """
    POST /session/:id/approve -> { approved: boolean } -> resolves a pending place_order approval
    """
    is_approved = True if (payload is None or payload.approved is None or payload.approved is True) else False

    try:
        if is_approved:
            res = await session_manager_instance.approve_and_resume(session_id)
            return res
        else:
            reason = payload.reason if payload else "User declined order proposal"
            res = await session_manager_instance.reject_session(session_id, reason)
            return res
    except ValueError as e:
        error_msg = str(e)
        # If session already completed or has no pending approval, return graceful response
        if "no pending approval" in error_msg.lower() or "not found" in error_msg.lower():
            session = session_manager_instance.get_session(session_id)
            if session and session.status in ("COMPLETED", "APPROVED"):
                return {
                    "status": session.status,
                    "session_id": session_id,
                    "message": "Session already completed successfully."
                }
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Error resolving session approval: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/{session_id}/reject")
@router.post("/api/sessions/{session_id}/reject")
async def reject_session_order(session_id: str, payload: Optional[ApproveSessionRequest] = None):
    """Explicit rejection endpoint."""
    reason = payload.reason if payload else "User declined order proposal"
    try:
        res = await session_manager_instance.reject_session(session_id, reason)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/session/{session_id}/start")
@router.post("/api/sessions/{session_id}/start")
async def start_session(session_id: str):
    """Manually start or trigger session execution."""
    session = session_manager_instance.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    
    session_manager_instance.start_session_task(session_id)
    return {"status": "started", "session_id": session_id}

@router.get("/session/{session_id}/events")
@router.get("/session/{session_id}/stream")
@router.get("/api/session/{session_id}/events")
@router.get("/api/sessions/{session_id}/stream")
async def stream_session_events(
    session_id: str,
    request: Request,
    from_seq: int = Query(default=0, description="Replay events starting from sequence number for reload/reconnect resilience")
):
    """
    GET /session/:id/events -> Server-Sent Events stream of structured events:
    { type: "reasoning" | "tool_call" | "tool_result" | "sandbox_start" | "sandbox_result" | "approval_required" | "approval_resolved" | "done", payload: {...}, timestamp }
    """
    session = session_manager_instance.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    q = session_manager_instance.subscribe(session_id)

    async def event_generator():
        try:
            # 1. Replay historical events up to now (zero state loss on reload/reconnect)
            existing_events = [ev for ev in session.events if ev.sequence > from_seq]
            for ev in existing_events:
                yield f"event: {ev.type}\nid: {ev.sequence}\ndata: {json.dumps(ev.to_dict())}\n\n"

            # 2. Stream live incoming events
            while True:
                if await request.is_disconnected():
                    break

                try:
                    event = await asyncio.wait_for(q.get(), timeout=2.0)
                    yield f"event: {event.type}\nid: {event.sequence}\ndata: {json.dumps(event.to_dict())}\n\n"

                    # If session reaches final terminal state, short grace then terminate stream
                    if event.type in ["done"]:
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

@router.get("/sessions")
@router.get("/api/sessions")
async def list_sessions():
    """List all sessions."""
    return {"sessions": session_manager_instance.list_sessions()}

# Direct MCP Tool endpoints
@router.get("/mcp/tools")
@router.get("/api/mcp/tools")
async def get_mcp_tools():
    """List all MCP tools provided by the catalog server."""
    return {"tools": mcp_server_instance.list_tools()}

@router.post("/mcp/call")
@router.post("/api/mcp/call")
async def call_mcp_tool(payload: Dict[str, Any]):
    """Execute an MCP tool directly via API."""
    tool_name = payload.get("name") or payload.get("tool")
    arguments = payload.get("arguments", {})
    if not tool_name:
        raise HTTPException(status_code=400, detail="Missing tool 'name'")
    
    result = mcp_server_instance.execute_tool(tool_name, arguments)
    return result

# Live AI Design Copilot Endpoints
@router.post("/session/{session_id}/copilot")
@router.post("/api/session/{session_id}/copilot")
@router.post("/api/copilot/instruct")
async def run_copilot_instruction(payload: Dict[str, Any], session_id: Optional[str] = None):
    """
    Accepts natural language design instructions and calculates live 2D architectural coordinates using GPT-OSS-120B.
    """
    from agent.copilot import live_copilot_instance
    instruction = payload.get("instruction", "")
    if not instruction:
        raise HTTPException(status_code=400, detail="Missing 'instruction' text.")

    room = payload.get("room", {"width_ft": 14.0, "length_ft": 18.0})
    items = payload.get("items", [])
    current_theme = payload.get("current_theme", "cyber-emerald")

    result = await live_copilot_instance.process_instruction(
        instruction=instruction,
        room=room,
        items=items,
        current_theme=current_theme
    )

    # If active session exists, broadcast a copilot reasoning event into the live stream
    if session_id:
        session = session_manager_instance.get_session(session_id)
        if session:
            evt = session.add_event("reasoning", {
                "step": "AI Copilot Live Redesign",
                "message": f"Instruction '{instruction}': {result.get('reply')}"
            })
            await session_manager_instance.broadcast_event(session_id, evt)

    return result

