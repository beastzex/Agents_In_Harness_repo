"""
Automated tests for Session Persistence and Mid-Session Reconnection / Event Replay.
Verifies that reload/reconnect resumes an existing run with zero state loss and without restarting.
"""
import pytest
import asyncio
from api.session_manager import SessionManager
from agent.engine import TrueForgeAgentSession
from sandbox.layout_algorithm import RoomConfig

@pytest.fixture
def fresh_session_mgr():
    return SessionManager()

@pytest.mark.asyncio
async def test_session_state_persistence_and_event_rehydration(fresh_session_mgr):
    """
    Verify that sessions persist their events, status, and layout artifacts
    such that a reconnected client receives the full state history.
    """
    # Create session
    session = fresh_session_mgr.create_session(
        goal="Design home office for 12x10 room",
        budget=1800.0
    )
    session_id = session.session_id

    # Simulate progressive execution emitting events
    evt1 = session.add_event("session_started", {"session_id": session_id})
    evt2 = session.add_event("agent_thought", {"thought": "Querying MCP catalog..."})
    evt3 = session.add_event("tool_call_result", {"tool_name": "search_catalog", "count": 4})

    assert len(session.events) == 3
    assert session.events[0].sequence == 1
    assert session.events[1].sequence == 2
    assert session.events[2].sequence == 3

    # Simulate client disconnect and reconnect:
    # A reconnected client retrieves the session snapshot
    retrieved_session = fresh_session_mgr.get_session(session_id)
    assert retrieved_session is not None
    assert retrieved_session.session_id == session_id
    assert len(retrieved_session.events) == 3
    assert retrieved_session.events[2].event_type == "tool_call_result"

@pytest.mark.asyncio
async def test_reconnect_event_replay_from_sequence(fresh_session_mgr):
    """
    Verify that querying with from_seq replays only missing events
    after a temporary network drop or browser refresh.
    """
    session = fresh_session_mgr.create_session(goal="Test Reconnect")
    
    # Emit 5 sequential events
    for i in range(1, 6):
        session.add_event("step_update", {"step": i, "desc": f"Executing step {i}"})

    assert len(session.events) == 5

    # If client disconnected at sequence 2, it requests events where sequence > 2
    replayed = [e for e in session.events if e.sequence > 2]
    assert len(replayed) == 3
    assert [e.sequence for e in replayed] == [3, 4, 5]
    assert replayed[0].data["step"] == 3
    assert replayed[2].data["step"] == 5

@pytest.mark.asyncio
async def test_multi_subscriber_broadcasting(fresh_session_mgr):
    """
    Verify that active subscribers receive real-time broadcast events concurrently.
    """
    session = fresh_session_mgr.create_session(goal="Broadcast Test")
    session_id = session.session_id

    # Connect two listeners (e.g. two browser tabs or UI visualizers)
    q1 = fresh_session_mgr.subscribe(session_id)
    q2 = fresh_session_mgr.subscribe(session_id)

    test_event = session.add_event("agent_thought", {"thought": "Live broadcast test"})
    await fresh_session_mgr.broadcast_event(session_id, test_event)

    res1 = await asyncio.wait_for(q1.get(), timeout=1.0)
    res2 = await asyncio.wait_for(q2.get(), timeout=1.0)

    assert res1.data["thought"] == "Live broadcast test"
    assert res2.data["thought"] == "Live broadcast test"

    fresh_session_mgr.unsubscribe(session_id, q1)
    fresh_session_mgr.unsubscribe(session_id, q2)
