"""
End-to-End Integration Tests for TrueForge Agent System.
Tests full pipeline: Session start -> Streaming Tool Calls -> Sandbox Layout -> Approval Gate -> User Approval -> Completion.
"""
import pytest
from httpx import AsyncClient, ASGITransport
import asyncio
import json

from api.app import app
from api.session_manager import session_manager_instance

@pytest.mark.asyncio
async def test_full_agent_workflow_e2e():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

        # 2. Create session without auto-start
        create_res = await client.post("/api/sessions", json={
            "goal": "Build ergonomic workspace with standing desk and curved monitor",
            "room": {"width": 12.0, "length": 10.0, "door_wall": "south", "door_position": 3.0, "door_width": 3.0},
            "budget": 1600.0,
            "auto_start": False
        })
        assert create_res.status_code == 200
        sess_data = create_res.json()
        session_id = sess_data["session_id"]
        assert session_id.startswith("sess-")

        # 3. Start execution
        start_res = await client.post(f"/api/sessions/{session_id}/start")
        assert start_res.status_code == 200

        # Wait for agent loop to reach approval gate (WAITING_FOR_APPROVAL)
        max_wait = 30
        waited = 0
        session_snap = None
        while waited < max_wait:
            snap_res = await client.get(f"/api/sessions/{session_id}")
            assert snap_res.status_code == 200
            session_snap = snap_res.json()
            if session_snap["status"] == "WAITING_FOR_APPROVAL":
                break
            await asyncio.sleep(0.2)
            waited += 1

        assert session_snap is not None
        assert session_snap["status"] == "WAITING_FOR_APPROVAL"
        assert session_snap["layout_result"] is not None
        assert len(session_snap["layout_result"]["placed_items"]) > 0
        assert session_snap["approval_request"] is not None
        assert session_snap["approval_request"]["status"] == "PENDING"

        # 4. User reviews and APPROVES the order
        approve_res = await client.post(f"/api/sessions/{session_id}/approve", json={"notes": "Approved by user"})
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "APPROVED"
        assert "token" in approve_res.json()

        # Wait for agent to resume and reach COMPLETED state
        waited = 0
        while waited < max_wait:
            snap_res = await client.get(f"/api/sessions/{session_id}")
            session_snap = snap_res.json()
            if session_snap["status"] == "COMPLETED":
                break
            await asyncio.sleep(0.2)
            waited += 1

        assert session_snap["status"] == "COMPLETED"
        assert session_snap["order_result"] is not None
        assert session_snap["order_result"]["status"] == "success"
        assert session_snap["order_result"]["approval_status"] == "APPROVED"

@pytest.mark.asyncio
async def test_mcp_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        tools_res = await client.get("/api/mcp/tools")
        assert tools_res.status_code == 200
        tools = tools_res.json()["tools"]
        assert len(tools) >= 3

        call_res = await client.post("/api/mcp/call", json={
            "name": "search_catalog",
            "arguments": {"category": "lighting"}
        })
        assert call_res.status_code == 200
        assert call_res.json()["status"] == "success"
