"""
Automated Proof Tests for Human-in-the-Loop (HITL) Security Approval Gate.
Provably verifies that 'place_order' cannot execute without verified human authorization.
"""
import pytest
from agent.approval_gate import (
    ApprovalGate,
    OrderPayload,
    OrderItem,
    ApprovalBlockedException,
    ApprovalStatus
)

@pytest.fixture
def fresh_gate():
    return ApprovalGate(secret_key="test-secret-gate-token-2026")

@pytest.fixture
def sample_order():
    return OrderPayload(
        order_id="ord-test-8899",
        items=[
            OrderItem(product_id="desk-apex", name="Apex Desk", price=499.0, category="desk"),
            OrderItem(product_id="chair-mesh", name="Ergo Chair", price=349.0, category="chair")
        ],
        total_amount=848.0,
        budget_limit=1000.0
    )

def test_place_order_provably_blocked_without_prior_approval(fresh_gate, sample_order):
    """
    CRITICAL PROOF TEST:
    Verifies that calling verify_and_execute_order on an unapproved session
    PROVABLY FAILS and raises ApprovalBlockedException.
    """
    session_id = "sess-unauthorized-001"

    with pytest.raises(ApprovalBlockedException) as exc_info:
        fresh_gate.verify_and_execute_order(
            session_id=session_id,
            order_payload=sample_order,
            approval_token=None
        )

    # Verify exception details
    err = exc_info.value
    assert "SECURITY GATE BLOCKED" in err.message
    assert err.approval_request.session_id == session_id
    assert err.approval_request.status == ApprovalStatus.PENDING
    assert err.approval_request.order_payload.total_amount == 848.0

    # Verify order was not executed
    pending_req = fresh_gate.get_pending_request(session_id)
    assert pending_req is not None
    assert pending_req.status == ApprovalStatus.PENDING
    assert pending_req.approval_token is None

def test_place_order_provably_blocked_with_tampered_or_invalid_token(fresh_gate, sample_order):
    """
    CRITICAL PROOF TEST:
    Verifies that presenting a forged or fabricated token fails security validation.
    """
    session_id = "sess-forgery-002"

    # Trigger request creation
    with pytest.raises(ApprovalBlockedException) as exc_info:
        fresh_gate.verify_and_execute_order(session_id=session_id, order_payload=sample_order)

    approval_id = exc_info.value.approval_request.approval_id

    # Try executing with forged token
    with pytest.raises(ApprovalBlockedException) as forge_exc:
        fresh_gate.verify_and_execute_order(
            session_id=session_id,
            order_payload=sample_order,
            approval_token="forged-hacker-token-xyz-12345"
        )

    assert "SECURITY GATE BLOCKED" in forge_exc.value.message

def test_place_order_provably_blocked_when_user_rejects(fresh_gate, sample_order):
    """
    CRITICAL PROOF TEST:
    Verifies that explicitly rejected orders cannot be executed.
    """
    session_id = "sess-reject-003"

    with pytest.raises(ApprovalBlockedException) as exc_info:
        fresh_gate.verify_and_execute_order(session_id=session_id, order_payload=sample_order)

    approval_id = exc_info.value.approval_request.approval_id
    fresh_gate.reject(approval_id, reason="Price exceeds user discretionary target")

    with pytest.raises(RuntimeError) as rej_exc:
        fresh_gate.verify_and_execute_order(
            session_id=session_id,
            order_payload=sample_order,
            approval_token="any-token"
        )

    assert "Order rejected by user" in str(rej_exc.value)

def test_place_order_succeeds_only_after_valid_human_authorization(fresh_gate, sample_order):
    """
    CRITICAL PROOF TEST:
    Verifies the end-to-end authorized approval lifecycle:
    1. Attempt without token -> BLOCKED
    2. Explicit human approval -> Generates verifiable cryptographic token
    3. Attempt with valid token -> PROVABLY SUCCEEDS
    """
    session_id = "sess-authorized-004"

    # Step 1: Initial invocation is blocked
    with pytest.raises(ApprovalBlockedException) as exc_info:
        fresh_gate.verify_and_execute_order(session_id=session_id, order_payload=sample_order)

    req = exc_info.value.approval_request
    assert req.status == ApprovalStatus.PENDING

    # Step 2: Human grants explicit approval
    approved_req = fresh_gate.approve(req.approval_id)
    assert approved_req.status == ApprovalStatus.APPROVED
    assert approved_req.approval_token is not None

    # Step 3: Execution with valid token now succeeds
    result = fresh_gate.verify_and_execute_order(
        session_id=session_id,
        order_payload=sample_order,
        approval_token=approved_req.approval_token
    )

    assert result["status"] == "success"
    assert result["approval_status"] == "APPROVED"
    assert result["total_charged"] == 848.0
    assert result["order_id"] == sample_order.order_id
    assert len(result["items"]) == 2
