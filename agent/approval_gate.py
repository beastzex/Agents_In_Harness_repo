"""
Deterministic Approval Gate for Sensitive Tools (place_order).
Enforces strict Human-in-the-Loop (HITL) policies, blocking any unauthorized or unapproved financial transactions.
"""
from typing import Dict, Any, List, Optional
import os
import uuid
import time
import datetime
import hashlib
import hmac
import logging
from enum import Enum
from pydantic import BaseModel, Field

logger = logging.getLogger("approval_gate")

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

class OrderItemSummary(BaseModel):
    id: str
    name: str
    category: str
    price: float
    image_url: Optional[str] = None
    width_in: Optional[float] = None
    depth_in: Optional[float] = None

class OrderPayload(BaseModel):
    order_id: str = Field(default_factory=lambda: f"ord-{uuid.uuid4().hex[:8]}")
    item_ids: List[str]
    items: List[Dict[str, Any]]
    total: float
    placed_at: Optional[str] = None
    currency: str = "USD"
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

class AuditLogEntry(BaseModel):
    timestamp: str
    session_id: str
    action: str
    status: str
    details: Dict[str, Any]

class ApprovalGate:
    """Manages sensitive tool approvals and enforces non-bypassable security barriers."""

    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = secret_key or os.getenv("TRUEFORGE_SECRET_KEY", "trueforge-sec-gate-token-key-2026")
        self._requests: Dict[str, ApprovalRequest] = {}
        self._session_approvals: Dict[str, str] = {}
        self.audit_log: List[AuditLogEntry] = []

    def _log_attempt(self, session_id: str, status: str, details: Dict[str, Any]):
        entry = AuditLogEntry(
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            session_id=session_id,
            action="place_order",
            status=status,
            details=details
        )
        self.audit_log.append(entry)
        logger.info(f"[HITL GATE AUDIT] Session {session_id} - place_order attempt: {status} - {details.get('message', '')}")

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
        self._log_attempt(req.session_id, "APPROVED", {
            "approval_id": approval_id,
            "message": f"Human approval granted for order total ${req.order_payload.total:.2f}"
        })
        return req

    def reject(self, approval_id: str, reason: str = "User declined order proposal") -> ApprovalRequest:
        """User explicitly rejects order."""
        if approval_id not in self._requests:
            raise ValueError(f"Approval request '{approval_id}' does not exist.")
        req = self._requests[approval_id]
        req.status = ApprovalStatus.REJECTED
        req.rejection_reason = reason
        req.resolved_at = time.time()
        self._log_attempt(req.session_id, "REJECTED", {
            "approval_id": approval_id,
            "reason": reason
        })
        return req

    def verify_and_execute_order(
        self,
        session_id: str,
        order_payload: OrderPayload,
        approval_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Guarded execution gate:
        - If approval_token is missing or invalid: BLOCKS execution, logs attempt, and raises ApprovalBlockedException.
        - If valid approval_token is supplied: Executes order and returns exact contract output.
        """
        existing_req_id = self._session_approvals.get(session_id)
        req = self._requests.get(existing_req_id) if existing_req_id else None

        if not req:
            new_req = self.create_request(session_id, order_payload)
            self._log_attempt(session_id, "BLOCKED", {
                "approval_id": new_req.approval_id,
                "message": f"Initial unapproved attempt to place order of {len(order_payload.item_ids)} items (${order_payload.total:.2f}). Paused for human approval."
            })
            raise ApprovalBlockedException(
                message=f"SECURITY GATE BLOCKED: 'place_order' (Total: ${order_payload.total:.2f}) requires explicit human approval before execution.",
                approval_request=new_req
            )

        if req.status == ApprovalStatus.REJECTED:
            self._log_attempt(session_id, "BLOCKED_REJECTED", {
                "approval_id": req.approval_id,
                "reason": req.rejection_reason
            })
            raise RuntimeError(f"Order rejected by user: {req.rejection_reason}")

        if req.status != ApprovalStatus.APPROVED:
            self._log_attempt(session_id, "BLOCKED_PENDING", {
                "approval_id": req.approval_id,
                "status": req.status
            })
            raise ApprovalBlockedException(
                message=f"SECURITY GATE BLOCKED: 'place_order' is in {req.status} status and has not been approved.",
                approval_request=req
            )

        expected_token = self.generate_token(req.approval_id, req.session_id)
        if not approval_token or not hmac.compare_digest(approval_token, expected_token):
            self._log_attempt(session_id, "BLOCKED_FORGERY", {
                "approval_id": req.approval_id,
                "message": "Invalid or forged approval token presented."
            })
            raise ApprovalBlockedException(
                message="SECURITY GATE BLOCKED: Invalid or missing cryptographic approval token.",
                approval_request=req
            )

        # Approved & Verified!
        placed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        order_payload.placed_at = placed_at

        self._log_attempt(session_id, "EXECUTED", {
            "order_id": order_payload.order_id,
            "total": order_payload.total,
            "items_count": len(order_payload.item_ids),
            "placed_at": placed_at
        })

        # Exact output contract specified in Section 3:
        # { order_id: string, items: [...], total: number, placed_at: ISO timestamp }
        return {
            "order_id": order_payload.order_id,
            "items": order_payload.items,
            "total": round(order_payload.total, 2),
            "placed_at": placed_at
        }

    def get_pending_request(self, session_id: str) -> Optional[ApprovalRequest]:
        req_id = self._session_approvals.get(session_id)
        if req_id and req_id in self._requests:
            return self._requests[req_id]
        return None

# Global Singleton Approval Gate
approval_gate_instance = ApprovalGate()
