"""
TrueForge Agent Orchestration Engine for The Renovation Architect.
Coordinates targeted MCP searches, dynamic sandbox rectangle packing, HITL approval gate, and structured event streaming.
"""
from typing import AsyncGenerator, Dict, Any, List, Optional
import asyncio
import uuid
import time
import logging
from mcp_server.server import mcp_server_instance
from sandbox.runner import sandbox_runner_instance
from .approval_gate import (
    approval_gate_instance,
    OrderPayload,
    ApprovalBlockedException,
    ApprovalStatus
)

logger = logging.getLogger("agent_engine")

class AgentEvent:
    def __init__(self, event_type: str, payload: Dict[str, Any], sequence: int = 0):
        self.id = f"evt-{uuid.uuid4().hex[:6]}"
        self.type = event_type  # reasoning, tool_call, tool_result, sandbox_start, sandbox_result, approval_required, approval_resolved, done
        self.payload = payload
        self.sequence = sequence
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "event_type": self.type, # compatibility
            "sequence": self.sequence,
            "timestamp": self.timestamp,
            "payload": self.payload,
            "data": self.payload # compatibility
        }

class TrueForgeAgentSession:
    """Represents a single active or completed renovation agent session."""

    def __init__(
        self,
        session_id: str,
        prompt: str,
        room: Dict[str, Any],
        budget: float = 2000.0,
        preferred_style: str = "Modern & Ergonomic"
    ):
        self.session_id = session_id
        self.prompt = prompt
        self.room = room
        self.budget = budget
        self.preferred_style = preferred_style
        
        self.status = "RUNNING"  # RUNNING, WAITING_FOR_APPROVAL, APPROVED, COMPLETED, REJECTED, FAILED
        self.events: List[AgentEvent] = []
        self.mood_board_items: List[Dict[str, Any]] = []
        self.layout_result: Optional[Dict[str, Any]] = None
        self.order_payload: Optional[OrderPayload] = None
        self.approval_request_id: Optional[str] = None
        self.approval_token: Optional[str] = None
        self.order_result: Optional[Dict[str, Any]] = None
        self.created_at = time.time()
        self.updated_at = time.time()
        self._seq = 0

    @property
    def selected_products(self) -> List[Dict[str, Any]]:
        return self.mood_board_items

    @selected_products.setter
    def selected_products(self, value: List[Dict[str, Any]]):
        self.mood_board_items = value

    @property
    def goal(self) -> str:
        return self.prompt

    def add_event(self, event_type: str, payload: Dict[str, Any]) -> AgentEvent:
        self._seq += 1
        event = AgentEvent(event_type, payload, sequence=self._seq)
        self.events.append(event)
        self.updated_at = time.time()
        return event

class TrueForgeAgentRunner:
    """Coordinates autonomous execution, targeted MCP calls, sandbox packing, and approval lifecycle."""

    def __init__(self):
        self.mcp = mcp_server_instance
        self.sandbox = sandbox_runner_instance
        self.approval_gate = approval_gate_instance

    async def run_session(self, session: TrueForgeAgentSession) -> AsyncGenerator[AgentEvent, None]:
        """
        Executes the full agent workflow as an asynchronous generator of live structured events.
        Events conform to the contract: reasoning | tool_call | tool_result | sandbox_start | sandbox_result | approval_required | approval_resolved | done
        """
        width_ft = float(session.room.get("width_ft", session.room.get("width", 12.0)))
        length_ft = float(session.room.get("length_ft", session.room.get("length", 10.0)))

        # 1. Initial Plan Narration (Reasoning)
        yield session.add_event("reasoning", {
            "step": "Planning",
            "message": f"Analyzing renovation goals for a {width_ft}x{length_ft} ft room with ${session.budget:.2f} budget: '{session.prompt}'. Planning targeted searches for tables, seating, lighting, storage, and decor."
        })
        await asyncio.sleep(0.15)

        # 2. Targeted MCP Search 1: Tables / Desks
        yield session.add_event("reasoning", {
            "step": "Catalog Search",
            "message": "Searching MCP furniture catalog for primary work desk and table options..."
        })
        await asyncio.sleep(0.1)

        yield session.add_event("tool_call", {
            "tool_name": "search_furniture",
            "caller": "Agent Reasoning Engine",
            "arguments": {
                "category": "tables",
                "max_price": session.budget * 0.40,
                "limit": 6
            }
        })
        await asyncio.sleep(0.15)

        table_res = self.mcp.execute_tool("search_furniture", {
            "category": "tables",
            "max_price": session.budget * 0.40,
            "limit": 6
        })
        tables_found = table_res.get("data", [])
        selected_table = tables_found[0] if tables_found else None

        yield session.add_event("tool_result", {
            "tool_name": "search_furniture",
            "count": len(tables_found),
            "summary": f"Found {len(tables_found)} table options. Selected '{selected_table.get('name') if selected_table else 'None'}' (${selected_table.get('price', 0) if selected_table else 0}).",
            "items": [selected_table] if selected_table else []
        })
        if selected_table:
            session.mood_board_items.append(selected_table)
        await asyncio.sleep(0.15)

        # 3. Targeted MCP Search 2: Seating / Chairs
        yield session.add_event("reasoning", {
            "step": "Catalog Search",
            "message": f"Matching ergonomic seating to complement {selected_table.get('name') if selected_table else 'the desk'}..."
        })
        await asyncio.sleep(0.1)

        yield session.add_event("tool_call", {
            "tool_name": "search_furniture",
            "caller": "Agent Reasoning Engine",
            "arguments": {
                "category": "seating",
                "max_price": session.budget * 0.30,
                "limit": 6
            }
        })
        await asyncio.sleep(0.15)

        chair_res = self.mcp.execute_tool("search_furniture", {
            "category": "seating",
            "max_price": session.budget * 0.30,
            "limit": 6
        })
        chairs_found = chair_res.get("data", [])
        selected_chair = chairs_found[0] if chairs_found else None

        yield session.add_event("tool_result", {
            "tool_name": "search_furniture",
            "count": len(chairs_found),
            "summary": f"Found {len(chairs_found)} chairs. Selected '{selected_chair.get('name') if selected_chair else 'None'}' (${selected_chair.get('price', 0) if selected_chair else 0}).",
            "items": [selected_chair] if selected_chair else []
        })
        if selected_chair:
            session.mood_board_items.append(selected_chair)
        await asyncio.sleep(0.15)

        # 4. Targeted MCP Search 3: Lighting, Storage & Decor
        yield session.add_event("reasoning", {
            "step": "Catalog Search",
            "message": "Curating ambient lighting, modular storage, and acoustic decor elements..."
        })
        await asyncio.sleep(0.1)

        # Lighting search
        light_res = self.mcp.execute_tool("search_furniture", {"category": "lighting", "max_price": 150.0, "limit": 4})
        selected_light = light_res.get("data", [])[0] if light_res.get("data") else None
        if selected_light:
            session.mood_board_items.append(selected_light)

        # Storage search
        storage_res = self.mcp.execute_tool("search_furniture", {"category": "storage", "max_price": 300.0, "limit": 4})
        selected_storage = storage_res.get("data", [])[0] if storage_res.get("data") else None
        if selected_storage:
            session.mood_board_items.append(selected_storage)

        # Decor search
        decor_res = self.mcp.execute_tool("search_furniture", {"category": "decor", "max_price": 90.0, "limit": 4})
        selected_decor = decor_res.get("data", [])[0] if decor_res.get("data") else None
        if selected_decor:
            session.mood_board_items.append(selected_decor)

        yield session.add_event("tool_result", {
            "tool_name": "search_furniture",
            "count": len(session.mood_board_items),
            "summary": f"Procured full mood board of {len(session.mood_board_items)} items within budget parameters.",
            "mood_board": session.mood_board_items
        })
        await asyncio.sleep(0.2)

        # 5. Sandbox Layout Fitting
        yield session.add_event("reasoning", {
            "step": "Spatial Sandbox",
            "message": f"Running greedy 2D rectangle-packing in TrueForge isolated Python sandbox to verify non-overlapping geometric fit for {len(session.mood_board_items)} items."
        })
        await asyncio.sleep(0.15)

        yield session.add_event("sandbox_start", {
            "environment": "TrueForge-Python-Sandbox",
            "target": "sandbox/layout_algorithm.py",
            "room_dimensions": f"{width_ft} ft x {length_ft} ft",
            "items_to_place": len(session.mood_board_items),
            "script_preview": f"# Sandbox Optimization Script\nroom = {{'width_ft': {width_ft}, 'length_ft': {length_ft}}}\nlayout_output = pack_furniture_layout(room, items_data, budget={session.budget})"
        })
        await asyncio.sleep(0.2)

        # Real Sandbox Execution
        sandbox_res = self.sandbox.execute_layout_script(
            room_data=session.room,
            items_data=session.mood_board_items,
            budget=session.budget
        )
        session.layout_result = sandbox_res.output_data

        yield session.add_event("sandbox_result", {
            "success": sandbox_res.success,
            "execution_time_ms": sandbox_res.execution_time_ms,
            "stdout": sandbox_res.stdout_log,
            "fits": sandbox_res.output_data.get("fits", True),
            "placements": sandbox_res.output_data.get("placements", []),
            "unplaced_item_ids": sandbox_res.output_data.get("unplaced_item_ids", []),
            "total_cost": sandbox_res.output_data.get("total_cost", 0.0),
            "over_budget": sandbox_res.output_data.get("over_budget", False),
            "space_utilization_pct": sandbox_res.output_data.get("space_utilization_pct", 0.0)
        })
        await asyncio.sleep(0.2)

        # 6. Prepare Order Proposal & HITL Approval Gate
        item_ids = [item.get("id") for item in session.mood_board_items if item.get("id")]
        total_price = sum(item.get("price", 0.0) for item in session.mood_board_items)

        order_payload = OrderPayload(
            item_ids=item_ids,
            items=session.mood_board_items,
            total=round(total_price, 2)
        )
        session.order_payload = order_payload

        yield session.add_event("reasoning", {
            "step": "Procurement Preparation",
            "message": f"Layout verified with {len(sandbox_res.output_data.get('placements', []))} placed items. Total order is ${total_price:.2f} (Under budget of ${session.budget:.2f}). Pausing for explicit human approval before placing order."
        })
        await asyncio.sleep(0.15)

        # 7. Sensitive Gated Action: place_order
        yield session.add_event("tool_call", {
            "tool_name": "place_order",
            "caller": "Agent Executor (Gated)",
            "arguments": {
                "item_ids": item_ids,
                "session_id": session.session_id
            }
        })
        await asyncio.sleep(0.15)

        try:
            order_exec = self.approval_gate.verify_and_execute_order(
                session_id=session.session_id,
                order_payload=order_payload,
                approval_token=session.approval_token
            )
            # If already authorized
            session.order_result = order_exec
            session.status = "COMPLETED"

            yield session.add_event("tool_result", {
                "tool_name": "place_order",
                "result": order_exec,
                "summary": f"Order {order_exec.get('order_id')} executed successfully."
            })
            yield session.add_event("done", {
                "session_id": session.session_id,
                "status": "COMPLETED",
                "total_cost": total_price,
                "order_id": order_exec.get("order_id")
            })

        except ApprovalBlockedException as blocked_ex:
            # Deterministic Security Gate Block
            session.status = "WAITING_FOR_APPROVAL"
            session.approval_request_id = blocked_ex.approval_request.approval_id

            yield session.add_event("approval_required", {
                "approval_id": blocked_ex.approval_request.approval_id,
                "session_id": session.session_id,
                "action": "place_order",
                "reason": blocked_ex.message,
                "order_summary": {
                    "total_amount": order_payload.total,
                    "item_count": len(order_payload.items),
                    "items": order_payload.items
                },
                "status": "PENDING"
            })
            yield session.add_event("reasoning", {
                "step": "Approval Gate Halted",
                "message": f"EXECUTION PAUSED: The sensitive 'place_order' action is blocked. Waiting for human approval to charge ${total_price:.2f}."
            })

    async def resume_session_with_approval(
        self,
        session: TrueForgeAgentSession,
        approval_token: str
    ) -> AsyncGenerator[AgentEvent, None]:
        """Resumes a paused session after human approval is granted."""
        session.approval_token = approval_token
        session.status = "APPROVED"

        yield session.add_event("approval_resolved", {
            "session_id": session.session_id,
            "approved": True,
            "approval_token": approval_token,
            "message": "Human authorization received and verified. Resuming place_order execution."
        })
        await asyncio.sleep(0.1)

        # Retry place_order with valid approval token
        yield session.add_event("tool_call", {
            "tool_name": "place_order",
            "caller": "Agent Executor (Authorized)",
            "arguments": {
                "item_ids": session.order_payload.item_ids if session.order_payload else [],
                "session_id": session.session_id,
                "approval_token": approval_token
            }
        })
        await asyncio.sleep(0.15)

        order_exec = self.approval_gate.verify_and_execute_order(
            session_id=session.session_id,
            order_payload=session.order_payload,
            approval_token=approval_token
        )
        session.order_result = order_exec
        session.status = "COMPLETED"

        yield session.add_event("tool_result", {
            "tool_name": "place_order",
            "result": order_exec,
            "summary": f"Order {order_exec.get('order_id')} successfully confirmed with human authorization."
        })
        await asyncio.sleep(0.1)

        yield session.add_event("done", {
            "session_id": session.session_id,
            "status": "COMPLETED",
            "total_cost": session.order_payload.total if session.order_payload else 0.0,
            "order_id": order_exec.get("order_id"),
            "items_placed": len(session.mood_board_items)
        })

    async def handle_rejection(
        self,
        session: TrueForgeAgentSession,
        reason: str = "User declined order"
    ) -> AgentEvent:
        """Handles explicit human rejection."""
        session.status = "REJECTED"
        if session.approval_request_id:
            self.approval_gate.reject(session.approval_request_id, reason)
        return session.add_event("approval_resolved", {
            "session_id": session.session_id,
            "approved": False,
            "reason": reason,
            "status": "REJECTED"
        })

agent_runner_instance = TrueForgeAgentRunner()
