"""
Session Manager and Event Bus for TrueForge Agent.
Maintains state persistence, event history, and multi-subscriber broadcast for live streaming and seamless reconnection.
"""
from typing import Dict, List, Optional, Set, Any
import asyncio
import uuid
import logging
from agent.engine import TrueForgeAgentSession, AgentEvent, agent_runner_instance
from agent.approval_gate import approval_gate_instance

logger = logging.getLogger("session_manager")

class SessionManager:
    """Manages agent session lifecycles, event logs, and pub/sub broadcaster."""

    def __init__(self):
        self._sessions: Dict[str, TrueForgeAgentSession] = {}
        # session_id -> Set of asyncio.Queue for SSE subscribers
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        # Track background run tasks
        self._running_tasks: Dict[str, asyncio.Task] = {}

    def create_session(
        self,
        prompt: str,
        room_data: Optional[Dict[str, Any]] = None,
        budget: float = 2000.0,
        preferred_style: str = "Modern & Ergonomic"
    ) -> TrueForgeAgentSession:
        session_id = f"sess-{uuid.uuid4().hex[:8]}"
        room_dict = room_data or {"width_ft": 12.0, "length_ft": 10.0, "door_wall": "south", "door_position": 3.0, "door_width": 3.0}
        
        # Ensure width_ft and length_ft are present
        if "width" in room_dict and "width_ft" not in room_dict:
            room_dict["width_ft"] = room_dict["width"]
        if "length" in room_dict and "length_ft" not in room_dict:
            room_dict["length_ft"] = room_dict["length"]

        session = TrueForgeAgentSession(
            session_id=session_id,
            prompt=prompt,
            room=room_dict,
            budget=budget,
            preferred_style=preferred_style
        )
        self._sessions[session_id] = session
        self._subscribers[session_id] = set()
        return session

    def get_session(self, session_id: str) -> Optional[TrueForgeAgentSession]:
        return self._sessions.get(session_id)

    def list_sessions(self) -> List[Dict[str, Any]]:
        return [
            {
                "session_id": s.session_id,
                "prompt": s.prompt,
                "status": s.status,
                "created_at": s.created_at,
                "event_count": len(s.events)
            }
            for s in self._sessions.values()
        ]

    def subscribe(self, session_id: str) -> asyncio.Queue:
        """Register a subscriber queue for live SSE streaming."""
        if session_id not in self._subscribers:
            self._subscribers[session_id] = set()
        q = asyncio.Queue()
        self._subscribers[session_id].add(q)
        return q

    def unsubscribe(self, session_id: str, q: asyncio.Queue):
        """Remove subscriber queue when client disconnects."""
        if session_id in self._subscribers:
            self._subscribers[session_id].discard(q)

    async def broadcast_event(self, session_id: str, event: AgentEvent):
        """Broadcast event to all connected streaming clients for this session."""
        if session_id in self._subscribers:
            for q in list(self._subscribers[session_id]):
                try:
                    await q.put(event)
                except Exception as e:
                    logger.warning(f"Failed to push event to queue: {e}")

    def start_session_task(self, session_id: str):
        """Start running the session in background if not already executing."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        if session_id in self._running_tasks and not self._running_tasks[session_id].done():
            return

        async def _run():
            try:
                async for event in agent_runner_instance.run_session(session):
                    await self.broadcast_event(session_id, event)
            except Exception as e:
                logger.error(f"Error in session run: {e}", exc_info=True)
                err_evt = session.add_event("done", {
                    "session_id": session_id,
                    "status": "FAILED",
                    "error": str(e)
                })
                await self.broadcast_event(session_id, err_evt)

        task = asyncio.create_task(_run())
        self._running_tasks[session_id] = task

    async def approve_and_resume(self, session_id: str) -> Dict[str, Any]:
        """Approve pending gate and resume agent execution."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        if session.status in ("APPROVED", "COMPLETED"):
            return {
                "status": session.status,
                "session_id": session_id,
                "message": "Session already approved/completed."
            }

        if not session.approval_request_id:
            raise ValueError(f"Session {session_id} has no pending approval request")

        approved_req = approval_gate_instance.approve(session.approval_request_id)
        token = approved_req.approval_token

        async def _resume():
            try:
                async for event in agent_runner_instance.resume_session_with_approval(session, token):
                    await self.broadcast_event(session_id, event)
            except Exception as e:
                logger.error(f"Error in session resume: {e}", exc_info=True)
                err_evt = session.add_event("done", {
                    "session_id": session_id,
                    "status": "FAILED",
                    "error": str(e)
                })
                await self.broadcast_event(session_id, err_evt)

        task = asyncio.create_task(_resume())
        self._running_tasks[session_id] = task

        return {
            "status": "APPROVED",
            "approval_id": approved_req.approval_id,
            "token": token,
            "session_id": session_id
        }

    async def reject_session(self, session_id: str, reason: str = "User declined order") -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        reject_evt = await agent_runner_instance.handle_rejection(session, reason)
        await self.broadcast_event(session_id, reject_evt)
        return {
            "status": "REJECTED",
            "session_id": session_id,
            "reason": reason
        }

# Global Singleton Session Manager
session_manager_instance = SessionManager()
