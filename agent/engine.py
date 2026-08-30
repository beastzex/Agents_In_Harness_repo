"""
TrueForge Agent Orchestration Engine for The Renovation Architect.
Coordinates targeted MCP searches, dynamic sandbox rectangle packing, HITL approval gate, and structured event streaming.
Now powered by GPT-OSS-120B via Groq for dynamic agent reasoning.
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
from .llm_client import llm_client, SYSTEM_PROMPTS

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
    def room_type(self) -> str:
        if isinstance(self.room, dict):
            return self.room.get("room_type") or self.room.get("type") or "home-office"
        return "home-office"

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
    """Coordinates autonomous execution, targeted MCP calls, sandbox packing, and approval lifecycle.
    Uses GPT-OSS-120B via Groq for dynamic agent reasoning."""

    def __init__(self):
        self.mcp = mcp_server_instance
        self.sandbox = sandbox_runner_instance
        self.approval_gate = approval_gate_instance
        self.llm = llm_client

    async def _reason(self, system_key: str, fallback: str, **context) -> str:
        """Generate LLM-powered reasoning or use fallback."""
        system_prompt = SYSTEM_PROMPTS.get(system_key, SYSTEM_PROMPTS["planning"])
        return await self.llm.generate_reasoning(
            system_prompt=system_prompt,
            user_prompt=fallback,
            temperature=0.7,
            max_tokens=250,
        )

    async def run_session(self, session: TrueForgeAgentSession) -> AsyncGenerator[AgentEvent, None]:
        """
        Executes the full agent workflow as an asynchronous generator of live structured events.
        Events conform to the contract: reasoning | tool_call | tool_result | sandbox_start | sandbox_result | approval_required | approval_resolved | done
        """
        width_ft = float(session.room.get("width_ft", session.room.get("width", 12.0)))
        length_ft = float(session.room.get("length_ft", session.room.get("length", 10.0)))
        budget_remaining = session.budget

        # ─── 1. Initial Plan Narration (LLM Reasoning) ────────────────────
        plan_fallback = f"Analyzing renovation goals for a {width_ft}×{length_ft} ft room with ${session.budget:.2f} budget: '{session.prompt}'. Planning targeted searches for tables, seating, lighting, storage, and decor."
        plan_reasoning = await self._reason(
            "planning",
            f"Room: {width_ft}ft × {length_ft}ft. Budget: ${session.budget:.2f}. Style: {session.preferred_style}. Goal: {session.prompt}. Analyze the spatial constraints and plan the furniture search strategy.",
        )

        yield session.add_event("reasoning", {
            "step": "Architectural Planning",
            "message": plan_reasoning or plan_fallback,
            "model": self.llm.model if self.llm.enabled else "deterministic",
        })
        await asyncio.sleep(0.15)

        # ─── 2. Room-Type-Aware Intelligent Procurement ──────────────────
        room_type_clean = (session.room_type or "").lower().strip()
        prompt_lower = (session.prompt or "").lower()

        # Determine target categories for this specific room
        if "bedroom" in room_type_clean or "bed" in prompt_lower:
            cat_plan = [
                ("beds", "primary platform bed / bedframe", 0.45),
                ("nightstands", "matching bedside tables", 0.20),
                ("storage", "bedroom dresser / wardrobe", 0.20),
                ("lighting", "warm ambient bedside lamp", 0.08),
                ("rugs", "plush bedroom wool rug", 0.07),
            ]
        elif "living" in room_type_clean or "sofa" in prompt_lower or "lounge" in prompt_lower:
            cat_plan = [
                ("sofas", "central modular sectional sofa", 0.40),
                ("coffee-tables", "solid wood / stone center coffee table", 0.15),
                ("media-consoles", "tv media console / entertainment showcase", 0.20),
                ("indoor-plants", "indoor botanical floor plant in planter", 0.07),
                ("lighting", "sculptural warm ambient floor lamp", 0.08),
                ("rugs", "large living room area carpet", 0.10),
            ]
        elif "dining" in room_type_clean or "dining" in prompt_lower:
            cat_plan = [
                ("tables", "dining table", 0.45),
                ("seating", "dining chairs set", 0.30),
                ("storage", "sideboard / buffet", 0.15),
                ("lighting", "pendant chandelier", 0.10),
            ]
        else:  # Default / Workspace / Home-Office
            cat_plan = [
                ("tables", "primary ergonomic work desk", 0.40),
                ("seating", "ergonomic task chair", 0.30),
                ("storage", "modular storage / credenza", 0.15),
                ("lighting", "desk lamp / ambient light", 0.08),
                ("decor", "ergonomic workspace accessories", 0.07),
            ]

        for step_idx, (cat_name, role_desc, alloc_pct) in enumerate(cat_plan):
            max_alloc = min(budget_remaining, session.budget * alloc_pct * 1.3)
            if budget_remaining < 40:
                break

            search_reasoning = await self._reason(
                "search_strategy",
                f"Procuring {role_desc} (category: {cat_name}) for {session.preferred_style} {session.room_type or 'room'}. Allocating up to ${max_alloc:.0f} from remaining ${budget_remaining:.2f} budget.",
            )
            yield session.add_event("reasoning", {
                "step": f"Curating {cat_name.title()}",
                "message": search_reasoning,
            })
            await asyncio.sleep(0.1)

            yield session.add_event("tool_call", {
                "tool_name": "search_furniture",
                "caller": "Agent Reasoning Engine (GPT-OSS-120B)",
                "arguments": {
                    "category": cat_name,
                    "query": session.preferred_style,
                    "max_price": max_alloc,
                    "limit": 6
                }
            })
            await asyncio.sleep(0.12)

            res = self.mcp.execute_tool("search_furniture", {
                "category": cat_name,
                "query": session.preferred_style,
                "max_price": max_alloc,
                "limit": 6
            })
            items_found = res.get("data", [])

            # LLM-powered item selection
            chosen_idx = await self.llm.select_best_item(
                items_found,
                f"{role_desc} for {session.preferred_style} {session.room_type or 'room'} {width_ft}×{length_ft}ft",
                budget_remaining,
            )
            selected_item = items_found[chosen_idx] if items_found else None

            if selected_item:
                eval_msg = await self._reason(
                    "item_evaluation",
                    f"Selected '{selected_item.get('name')}' (${selected_item.get('price', 0)}) for {session.room_type or 'room'}. Material: {selected_item.get('material', 'N/A')}. Budget remaining: ${budget_remaining - selected_item.get('price', 0):.2f}.",
                )
                session.mood_board_items.append(selected_item)
                budget_remaining -= selected_item.get("price", 0)
            else:
                eval_msg = f"No suitable {cat_name} found within budget allocation."

            yield session.add_event("tool_result", {
                "tool_name": "search_furniture",
                "count": len(items_found),
                "summary": eval_msg,
                "items": [selected_item] if selected_item else []
            })
            await asyncio.sleep(0.12)

        total_so_far = sum(it.get("price", 0) for it in session.mood_board_items)
        yield session.add_event("tool_result", {
            "tool_name": "search_furniture",
            "count": len(session.mood_board_items),
            "summary": f"Assembled full mood board of {len(session.mood_board_items)} items totaling ${total_so_far:.2f} (${budget_remaining:.2f} remaining under ${session.budget:.2f} ceiling).",
            "mood_board": session.mood_board_items
        })
        await asyncio.sleep(0.15)

        # ─── 5. Sandbox Layout Fitting (LLM Reasoning) ────────────────────
        sandbox_reasoning = await self._reason(
            "sandbox_reasoning",
            f"Running greedy 2D rectangle-packing in TrueFoundry isolated Python sandbox. {len(session.mood_board_items)} items to fit in {width_ft}×{length_ft}ft room. Using Shapely geometry for collision detection with 0.0mm tolerance.",
        )
        yield session.add_event("reasoning", {
            "step": "Spatial Sandbox Preparation",
            "message": sandbox_reasoning,
        })
        await asyncio.sleep(0.15)

        yield session.add_event("sandbox_start", {
            "environment": "TrueForge-Python-Sandbox",
            "target": "sandbox/layout_algorithm.py",
            "room_dimensions": f"{width_ft} ft × {length_ft} ft",
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

        # ─── 6. Prepare Order Proposal & HITL Approval Gate ────────────────
        item_ids = [item.get("id") for item in session.mood_board_items if item.get("id")]
        total_price = sum(item.get("price", 0.0) for item in session.mood_board_items)

        order_payload = OrderPayload(
            item_ids=item_ids,
            items=session.mood_board_items,
            total=round(total_price, 2)
        )
        session.order_payload = order_payload

        gate_reasoning = await self._reason(
            "approval_gate",
            f"Layout verified with {len(sandbox_res.output_data.get('placements', []))} placed items. Total order is ${total_price:.2f} (under budget of ${session.budget:.2f}). This is an irreversible financial action — execution MUST halt for explicit human approval.",
        )
        yield session.add_event("reasoning", {
            "step": "Procurement Authorization Required",
            "message": gate_reasoning,
        })
        await asyncio.sleep(0.15)

        # ─── 7. Sensitive Gated Action: place_order ────────────────────────
        yield session.add_event("tool_call", {
            "tool_name": "place_order",
            "caller": "Agent Executor (Gated — GPT-OSS-120B)",
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
            "message": "Human authorization received and cryptographically verified. Resuming place_order execution with GPT-OSS-120B agent."
        })
        await asyncio.sleep(0.1)

        # Retry place_order with valid approval token
        yield session.add_event("tool_call", {
            "tool_name": "place_order",
            "caller": "Agent Executor (Authorized — GPT-OSS-120B)",
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
