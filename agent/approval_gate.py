"""
Deterministic Approval Gate for Sensitive Tools (place_order).
Enforces strict Human-in-the-Loop (HITL) policies, blocking any unauthorized or unapproved financial transactions.
"""
from typing import Dict, Any, List, Optional
import os
import secrets
import uuid
import time
import hashlib
import hmac
from enum import Enum
from pydantic import BaseModel, Field

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    BLOCKED = "BLOCKED"

class ApprovalBlockedException(Exception):
    """Raised when a sensitive tool is invoked without a verified approval token."""
    def __init__(self, message: str, approval_request: "ApprovalRequest"):
        super().__init__(message)
        self.message = message
        self.approval_request = approval_request

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int = 1
    category: str

class OrderPayload(BaseModel):
    order_id: str = Field(default_factory=lambda: f"ord-{uuid.uuid4().hex[:8]}")
    items: List[OrderItem]
    total_amount: float
    budget_limit: Optional[float] = None
    currency: str = "USD"
    shipping_destination: str = "Standard Home Delivery"
    requires_human_approval: bool = True

class ApprovalRequest(BaseModel):
    approval_id: str = Field(default_factory=lambda: f"appr-{uuid.uuid4().hex[:8]}")
    session_id: str
    tool_name: str = "place_order"
    order_payload: OrderPayload
    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: float = Field(default_factory=time.time)
    resolved_at: Optional[float] = None
    approval_token: Optional[str] = None
    rejection_reason: Optional[str] = None

class ApprovalGate:
    """Manages sensitive tool approvals and enforces security barriers."""

    def __init__(self, secret_key: Optional[str] = None):
        # Allow setting via environment or secure parameter; fallback to deterministic default
        self.secret_key = secret_key or os.getenv("TRUEFORGE_SECRET_KEY", "trueforge-sec-gate-token-key-2026")
        # In-memory registry of approval requests keyed by approval_id
        self._requests: Dict[str, ApprovalRequest] = {}
        # Session to active approval mapping
        self._session_approvals: Dict[str, str] = {}

    def create_request(self, session_id: str, order_payload: OrderPayload) -> ApprovalRequest:
        """Create a new pending approval requirement for an order."""
        req = ApprovalRequest(
            session_id=session_id,
            tool_name="place_order",
            order_payload=order_payload,
            status=ApprovalStatus.PENDING
        )
        self._requests[req.approval_id] = req
        self._session_approvals[session_id] = req.approval_id
        return req

    def generate_token(self, approval_id: str, session_id: str) -> str:
        """Generate a cryptographically secure HMAC-SHA256 approval token."""
        msg = f"{approval_id}:{session_id}".encode("utf-8")
        key = self.secret_key.encode("utf-8")
        return hmac.new(key, msg, hashlib.sha256).hexdigest()

    def approve(self, approval_id: str) -> ApprovalRequest:
        """User explicitly grants human approval."""
        if approval_id not in self._requests:
            raise ValueError(f"Approval request '{approval_id}' does not exist.")
        req = self._requests[approval_id]
        if req.status != ApprovalStatus.PENDING:
            raise ValueError(f"Approval request '{approval_id}' is already {req.status}.")
        
        token = self.generate_token(req.approval_id, req.session_id)
        req.status = ApprovalStatus.APPROVED
        req.approval_token = token
        req.resolved_at = time.time()
        return req

    def reject(self, approval_id: str, reason: str = "User declined order proposal") -> ApprovalRequest:
        """User explicitly rejects order."""
        if approval_id not in self._requests:
            raise ValueError(f"Approval request '{approval_id}' does not exist.")
        req = self._requests[approval_id]
        req.status = ApprovalStatus.REJECTED
        req.rejection_reason = reason
        req.resolved_at = time.time()
        return req

    def verify_and_execute_order(
        self,
        session_id: str,
        order_payload: OrderPayload,
        approval_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Guarded execution gate:
        - If approval_token is missing or invalid: BLOCKS execution and raises ApprovalBlockedException.
        - If valid approval_token is supplied: Executes mock order placement.
        """
        # Check existing approval request for this session
        existing_req_id = self._session_approvals.get(session_id)
        req = self._requests.get(existing_req_id) if existing_req_id else None

        if not req:
            # First attempt: register the pending approval request and BLOCK
            new_req = self.create_request(session_id, order_payload)
            raise ApprovalBlockedException(
                message=f"SECURITY GATE BLOCKED: 'place_order' (Total: ${order_payload.total_amount:.2f}) requires explicit human approval before execution.",
                approval_request=new_req
            )

        if req.status == ApprovalStatus.REJECTED:
            raise RuntimeError(f"Order rejected by user: {req.rejection_reason}")

        if req.status != ApprovalStatus.APPROVED:
            raise ApprovalBlockedException(
                message=f"SECURITY GATE BLOCKED: 'place_order' is currently in {req.status} status and has not been approved.",
                approval_request=req
            )

        expected_token = self.generate_token(req.approval_id, req.session_id)
        if not approval_token or not hmac.compare_digest(approval_token, expected_token):
            raise ApprovalBlockedException(
                message="SECURITY GATE BLOCKED: Invalid or missing cryptographic approval token.",
                approval_request=req
            )

        # Approved & Verified!
        return {
            "status": "success",
            "order_id": order_payload.order_id,
            "approval_id": req.approval_id,
            "approval_status": "APPROVED",
            "total_charged": order_payload.total_amount,
            "item_count": len(order_payload.items),
            "items": [item.model_dump() for item in order_payload.items],
            "message": f"Order {order_payload.order_id} successfully confirmed and placed with human authorization.",
            "timestamp": time.time()
        }

    def get_pending_request(self, session_id: str) -> Optional[ApprovalRequest]:
        req_id = self._session_approvals.get(session_id)
        if req_id and req_id in self._requests:
            return self._requests[req_id]
        return None

# Global Singleton Approval Gate
approval_gate_instance = ApprovalGate()
