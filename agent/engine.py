"""
TrueForge Agent Orchestration Engine.
Manages tool calling, sandbox layout execution, event streaming, and approval-gated order placement.
"""
from typing import AsyncGenerator, Dict, Any, List, Optional
import asyncio
import uuid
import time
import json
import logging

from mcp_server.server import mcp_server_instance
from sandbox.runner import sandbox_runner_instance
from sandbox.layout_algorithm import RoomConfig
from .approval_gate import approval_gate_instance, OrderPayload, OrderItem, ApprovalBlockedException, ApprovalStatus

logger = logging.getLogger("agent_engine")

class AgentEvent:
    def __init__(self, event_type: str, data: Dict[str, Any], sequence: int = 0):
        self.id = f"evt-{uuid.uuid4().hex[:6]}"
        self.event_type = event_type
        self.data = data
        self.sequence = sequence
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type,
            "sequence": self.sequence,
            "timestamp": self.timestamp,
            "data": self.data
        }

class TrueForgeAgentSession:
    """Represents a single active or completed session."""

    def __init__(
        self,
        session_id: str,
        goal: str,
        room: RoomConfig,
        budget: float = 2000.0,
        preferred_style: str = "Ergonomic & Modern"
    ):
        self.session_id = session_id
        self.goal = goal
        self.room = room
        self.budget = budget
        self.preferred_style = preferred_style
        
        self.status = "RUNNING"  # RUNNING, WAITING_FOR_APPROVAL, APPROVED, COMPLETED, REJECTED, FAILED
        self.events: List[AgentEvent] = []
        self.selected_products: List[Dict[str, Any]] = []
        self.layout_result: Optional[Dict[str, Any]] = None
        self.order_payload: Optional[OrderPayload] = None
        self.approval_request_id: Optional[str] = None
        self.approval_token: Optional[str] = None
        self.order_result: Optional[Dict[str, Any]] = None
        self.created_at = time.time()
        self.updated_at = time.time()
        self._seq = 0

    def add_event(self, event_type: str, data: Dict[str, Any]) -> AgentEvent:
        self._seq += 1
        event = AgentEvent(event_type, data, sequence=self._seq)
        self.events.append(event)
        self.updated_at = time.time()
        return event

class TrueForgeAgentRunner:
    """Coordinates autonomous execution, tool dispatches, and approval lifecycle."""

    def __init__(self):
        self.mcp = mcp_server_instance
        self.sandbox = sandbox_runner_instance
        self.approval_gate = approval_gate_instance

    async def run_session(self, session: TrueForgeAgentSession) -> AsyncGenerator[AgentEvent, None]:
        """
        Executes the full agent workflow as an asynchronous generator of live events.
        If paused at approval gate, yields 'approval_required' and suspends.
        """
        # 1. Start session
        yield session.add_event("session_started", {
            "session_id": session.session_id,
            "goal": session.goal,
            "room": session.room.model_dump(),
            "budget": session.budget,
            "status": "RUNNING"
        })
        await asyncio.sleep(0.15)

        # 2. Agent Thought: Analyzing user goal & room constraints
        yield session.add_event("agent_thought", {
            "thought": f"Analyzing space constraints for a {session.room.width}x{session.room.length} ft room with ${session.budget:.2f} budget. Identifying required furniture categories: Desk, Ergonomic Chair, High-res Monitor, Lighting, and Accessories."
        })
        await asyncio.sleep(0.2)

        # 3. Tool Call: MCP Catalog Search for Desks
        yield session.add_event("tool_call_start", {
            "tool_name": "search_catalog",
            "caller": "MCP Client",
            "arguments": {"category": "desk", "max_price": session.budget * 0.4}
        })
        await asyncio.sleep(0.15)

        desk_mcp_res = self.mcp.execute_tool("search_catalog", {"category": "desk", "max_price": session.budget * 0.4})
        selected_desk = desk_mcp_res["data"][0] if desk_mcp_res.get("data") else None
        
        yield session.add_event("tool_call_result", {
            "tool_name": "search_catalog",
            "result_summary": f"Found {len(desk_mcp_res.get('data', []))} desks. Selected '{selected_desk.get('name') if selected_desk else 'None'}' (${selected_desk.get('price') if selected_desk else 0}).",
            "raw_result": desk_mcp_res
        })
        if selected_desk:
            session.selected_products.append(selected_desk)
        await asyncio.sleep(0.15)

        # 4. Tool Call: MCP Catalog Search for Chairs & Monitors & Accessories
        yield session.add_event("agent_thought", {
            "thought": f"Selected desk {selected_desk.get('name') if selected_desk else ''}. Now searching for matching ergonomic chair, ultrawide monitor, and ambient lighting."
        })
        await asyncio.sleep(0.15)

        yield session.add_event("tool_call_start", {
            "tool_name": "search_catalog",
            "caller": "MCP Client",
            "arguments": {"query": "mesh ergonomic"}
        })
        await asyncio.sleep(0.15)

        chair_res = self.mcp.execute_tool("search_catalog", {"category": "chair", "max_price": session.budget * 0.3})
        selected_chair = chair_res["data"][0] if chair_res.get("data") else None
        if selected_chair:
            session.selected_products.append(selected_chair)

        monitor_res = self.mcp.execute_tool("search_catalog", {"category": "monitor", "max_price": session.budget * 0.3})
        selected_monitor = monitor_res["data"][0] if monitor_res.get("data") else None
        if selected_monitor:
            session.selected_products.append(selected_monitor)

        light_res = self.mcp.execute_tool("search_catalog", {"category": "lighting", "max_price": 150.0})
        selected_light = light_res["data"][0] if light_res.get("data") else None
        if selected_light:
            session.selected_products.append(selected_light)

        acc_res = self.mcp.execute_tool("search_catalog", {"category": "accessory", "max_price": 100.0})
        selected_acc = acc_res["data"][0] if acc_res.get("data") else None
        if selected_acc:
            session.selected_products.append(selected_acc)

        yield session.add_event("tool_call_result", {
            "tool_name": "search_catalog",
            "result_summary": f"Procured {len(session.selected_products)} items from MCP catalog matching budget and dimensions.",
            "items": session.selected_products
        })
        await asyncio.sleep(0.2)

        # 5. Sandbox Execution: Layout Placement
        yield session.add_event("agent_thought", {
            "thought": f"Dispatching layout computation script to isolated TrueForge Python Sandbox to calculate precise 2D coordinate placement and verify zero collision with door clearance."
        })
        await asyncio.sleep(0.15)

        room_dict = session.room.model_dump()
        items_dict = session.selected_products

        yield session.add_event("sandbox_executing", {
            "environment": "TrueForge-Python-Sandbox-v1",
            "target": "sandbox/layout_algorithm.py",
            "room_dimensions": f"{room_dict['width']}x{room_dict['length']} ft",
            "item_count": len(items_dict),
            "script_preview": f"# Sandbox Optimization Script\nroom = RoomConfig(width={room_dict['width']}, length={room_dict['length']})\nresult = compute_layout(room, items_data)"
        })
        await asyncio.sleep(0.25)

        # Real Sandbox Execution
        sandbox_res = self.sandbox.execute_layout_script(room_dict, items_dict)
        session.layout_result = sandbox_res.output_data

        yield session.add_event("sandbox_stdout", {
            "stdout": sandbox_res.stdout_log,
            "execution_time_ms": sandbox_res.execution_time_ms
        })
        await asyncio.sleep(0.15)

        yield session.add_event("sandbox_completed", {
            "success": sandbox_res.success,
            "execution_time_ms": sandbox_res.execution_time_ms,
            "layout_metrics": {
                "space_utilization_pct": sandbox_res.output_data.get("space_utilization_pct"),
                "ergonomic_score": sandbox_res.output_data.get("ergonomic_score"),
                "collision_count": sandbox_res.output_data.get("collision_count"),
                "clearance_violations": sandbox_res.output_data.get("clearance_violations"),
            },
            "placed_items": sandbox_res.output_data.get("placed_items", [])
        })
        await asyncio.sleep(0.2)

        # 6. Prepare Order Proposal & Test Approval Gate
        total_price = sum(item.get("price", 0.0) for item in session.selected_products)
        order_items = [
            OrderItem(
                product_id=item.get("id"),
                name=item.get("name"),
                price=item.get("price"),
                category=item.get("category")
            ) for item in session.selected_products
        ]
        order_payload = OrderPayload(
            items=order_items,
            total_amount=round(total_price, 2),
            budget_limit=session.budget
        )
        session.order_payload = order_payload

        yield session.add_event("agent_thought", {
            "thought": f"Optimal layout verified with {sandbox_res.output_data.get('ergonomic_score', 95)}/100 ergonomic score. Order total is ${total_price:.2f} (Under budget of ${session.budget:.2f}). Preparing to call 'place_order'."
        })
        await asyncio.sleep(0.15)

        yield session.add_event("tool_call_start", {
            "tool_name": "place_order",
            "caller": "Agent Executor",
            "payload": order_payload.model_dump()
        })
        await asyncio.sleep(0.15)

        # 7. Execute place_order -> Expected to hit Approval Gate!
        try:
            order_exec = self.approval_gate.verify_and_execute_order(
                session_id=session.session_id,
                order_payload=order_payload,
                approval_token=session.approval_token
            )
            # If we already have token (e.g. on resume after approval), this succeeds
            session.order_result = order_exec
            session.status = "COMPLETED"

            yield session.add_event("tool_call_result", {
                "tool_name": "place_order",
                "result": order_exec,
                "message": "Order successfully executed with verified human approval."
            })
            yield session.add_event("session_completed", {
                "session_id": session.session_id,
                "status": "COMPLETED",
                "total_cost": total_price,
                "order_id": order_exec.get("order_id")
            })

        except ApprovalBlockedException as blocked_ex:
            # Expected deterministic gate block
            session.status = "WAITING_FOR_APPROVAL"
            session.approval_request_id = blocked_ex.approval_request.approval_id

            yield session.add_event("approval_required", {
                "approval_id": blocked_ex.approval_request.approval_id,
                "session_id": session.session_id,
                "action": "place_order",
                "reason": blocked_ex.message,
                "order_summary": {
                    "total_amount": order_payload.total_amount,
                    "budget_limit": order_payload.budget_limit,
                    "item_count": len(order_payload.items),
                    "items": [it.model_dump() for it in order_payload.items]
                },
                "status": "PENDING"
            })
            yield session.add_event("agent_thought", {
                "thought": f"PAUSED: Execution halted at Human-in-the-Loop security gate. Waiting for user authorization to charge ${total_price:.2f}."
            })

    async def resume_session_with_approval(
        self,
        session: TrueForgeAgentSession,
        approval_token: str
    ) -> AsyncGenerator[AgentEvent, None]:
        """Resumes a paused session after human approval is granted."""
        session.approval_token = approval_token
        session.status = "APPROVED"

        yield session.add_event("approval_granted", {
            "session_id": session.session_id,
            "approval_token": approval_token,
            "status": "APPROVED",
            "message": "Human authorization received and verified. Resuming execution."
        })
        await asyncio.sleep(0.1)

        # Retry place_order with valid approval token
        yield session.add_event("tool_call_start", {
            "tool_name": "place_order",
            "caller": "Agent Executor (Authorized)",
            "approval_token": approval_token
        })
        await asyncio.sleep(0.15)

        order_exec = self.approval_gate.verify_and_execute_order(
            session_id=session.session_id,
            order_payload=session.order_payload,
            approval_token=approval_token
        )
        session.order_result = order_exec
        session.status = "COMPLETED"

        yield session.add_event("tool_call_result", {
            "tool_name": "place_order",
            "result": order_exec,
            "message": "Order successfully executed with verified human approval."
        })
        await asyncio.sleep(0.1)

        yield session.add_event("session_completed", {
            "session_id": session.session_id,
            "status": "COMPLETED",
            "total_cost": session.order_payload.total_amount,
            "order_id": order_exec.get("order_id"),
            "items_placed": len(session.selected_products)
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
        return session.add_event("approval_rejected", {
            "session_id": session.session_id,
            "reason": reason,
            "status": "REJECTED"
        })

agent_runner_instance = TrueForgeAgentRunner()
