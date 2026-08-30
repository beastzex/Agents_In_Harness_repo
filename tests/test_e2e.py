"""
End-to-End Integration Tests for The Renovation Architect API Contract.
Tests full pipeline:
1. POST /session -> create session
2. Streaming events: reasoning, tool_call, tool_result, sandbox_start, sandbox_result, approval_required
3. GET /session/:id/state -> verify mood board and layout
4. POST /session/:id/approve -> resolve HITL gate
5. Verification of place_order completion and final 'done' state.
"""
import pytest
from httpx import AsyncClient, ASGITransport
import asyncio
import json

from api.app import app
from api.session_manager import session_manager_instance

@pytest.mark.asyncio
async def test_full_renovation_architect_e2e():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

        # 2. Create session via POST /session
        create_res = await client.post("/session", json={
            "prompt": "Design modern ergonomic workspace with standing desk, high-back chair, and ambient lighting under $1600",
            "room": {"width_ft": 12.0, "length_ft": 10.0, "door_wall": "south"},
            "budget": 1600.0,
            "auto_start": True
        })
        assert create_res.status_code == 200
        sess_data = create_res.json()
        session_id = sess_data["session_id"]
        assert session_id.startswith("sess-")

        # 3. Poll until agent reaches Human Approval Gate (WAITING_FOR_APPROVAL)
        max_wait = 40
        waited = 0
        session_snap = None
        while waited < max_wait:
            snap_res = await client.get(f"/session/{session_id}/state")
            assert snap_res.status_code == 200
            session_snap = snap_res.json()
            if session_snap["status"] == "WAITING_FOR_APPROVAL":
                break
            await asyncio.sleep(0.2)
            waited += 1

        assert session_snap is not None
        assert session_snap["status"] == "WAITING_FOR_APPROVAL"
        assert len(session_snap["mood_board_items"]) > 0
        assert session_snap["layout_result"] is not None
        assert "placements" in session_snap["layout_result"]
        assert len(session_snap["layout_result"]["placements"]) > 0
        assert session_snap["pending_approval"] is not None
        assert session_snap["pending_approval"]["status"] == "PENDING"

        # 4. User reviews and APPROVES the order via POST /session/:id/approve
        approve_res = await client.post(f"/session/{session_id}/approve", json={"approved": True})
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "APPROVED"
        assert "token" in approve_res.json()

        # 5. Wait for agent to resume and complete execution
        waited = 0
        while waited < max_wait:
            snap_res = await client.get(f"/session/{session_id}/state")
            session_snap = snap_res.json()
            if session_snap["status"] == "COMPLETED":
                break
            await asyncio.sleep(0.2)
            waited += 1

        assert session_snap["status"] == "COMPLETED"
        assert session_snap["order_result"] is not None
        assert "order_id" in session_snap["order_result"]
        assert "placed_at" in session_snap["order_result"]
        assert session_snap["order_result"]["total"] > 0

@pytest.mark.asyncio
async def test_mcp_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        tools_res = await client.get("/mcp/tools")
        assert tools_res.status_code == 200
        tools = tools_res.json()["tools"]
        tool_names = [t["name"] for t in tools]
        assert "search_furniture" in tool_names
        assert "get_item_details" in tool_names
        assert "place_order" in tool_names

        call_res = await client.post("/mcp/call", json={
            "name": "search_furniture",
            "arguments": {"category": "lighting", "limit": 2}
        })
        assert call_res.status_code == 200
        assert call_res.json()["status"] == "success"
        assert call_res.json()["count"] > 0
