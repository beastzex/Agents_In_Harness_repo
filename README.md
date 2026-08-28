# The Renovation Architect

An autonomous AI agent built on TrueFoundry's **TrueForge** harness for spatial room layout, furniture catalog discovery via **Model Context Protocol (MCP)**, dynamic sandbox layout rectangle-packing, and a deterministic **Human-in-the-Loop (HITL) approval gate** for procurement.

---

## 📡 Frontend API Contract

The backend exposes a clean REST & Server-Sent Events (SSE) API wrapping the TrueForge session.

### 1. Create a Renovation Session
```http
POST /session
Content-Type: application/json

{
  "room": {
    "width_ft": 12.0,
    "length_ft": 10.0
  },
  "prompt": "Design modern ergonomic workspace with standing desk, high-back chair, and lighting under $1600",
  "budget": 1600.0
}
```
**Response:**
```json
{
  "session_id": "sess-a1b2c3d4",
  "status": "RUNNING",
  "prompt": "Design modern ergonomic workspace...",
  "budget": 1600.0,
  "room": { "width_ft": 12.0, "length_ft": 10.0 },
  "created_at": 1724900000.0
}
```

---

### 2. Live Structured Event Stream (SSE)
```http
GET /session/:id/events?from_seq=0
Accept: text/event-stream
```
Streams structured events in real time. Mid-session reconnects pass `from_seq=N` to replay missing events without losing state or restarting the run.

**Event Structure:**
```typescript
{
  type: "reasoning" | "tool_call" | "tool_result" | "sandbox_start" | "sandbox_result" | "approval_required" | "approval_resolved" | "done",
  sequence: number,
  timestamp: number,
  payload: {
    // Event-specific data
  }
}
```

#### Event Lifecycle Flow:
1. `reasoning` — Short, 1-line judge-friendly plan narration before acting.
2. `tool_call` (`search_furniture`) — Targeted MCP catalog query.
3. `tool_result` (`search_furniture`) — Matching furniture items returned.
4. `sandbox_start` — Invocation of isolated Python geometry packing engine.
5. `sandbox_result` — Returned `{ fits: boolean, placements: [...], unplaced_item_ids: [...], total_cost: number, over_budget: boolean }`.
6. `approval_required` — **Execution halts**. Emitted when agent attempts the gated `place_order` action.
7. `approval_resolved` — Emitted when human user approves or declines the order.
8. `done` — Terminal event with final order ID and cost confirmation.

---

### 3. Resolve Human-in-the-Loop Approval Gate
```http
POST /session/:id/approve
Content-Type: application/json

{
  "approved": true
}
```
**Response:**
```json
{
  "status": "APPROVED",
  "approval_id": "appr-9f8e7d6c",
  "token": "4a7b9c... (HMAC-SHA256)",
  "session_id": "sess-a1b2c3d4"
}
```
*Note: Sending `{"approved": false}` rejects the order and halts execution.*

---

### 4. Fetch Full Current State (Resume / Reconnect)
```http
GET /session/:id/state
```
**Response:**
```json
{
  "session_id": "sess-a1b2c3d4",
  "status": "WAITING_FOR_APPROVAL",
  "prompt": "Design modern ergonomic workspace...",
  "budget": 1600.0,
  "room": { "width_ft": 12.0, "length_ft": 10.0 },
  "mood_board_items": [
    {
      "id": "table-apex-standing-60",
      "name": "ApexPro Motorized Dual-Motor Standing Desk (60x30)",
      "category": "tables",
      "price": 499.0,
      "width_in": 60.0,
      "depth_in": 30.0,
      "image_url": "https://images.unsplash.com/...",
      "style_tags": ["ergonomic", "modern"]
    }
  ],
  "total_cost": 1285.0,
  "layout_result": {
    "fits": true,
    "placements": [
      { "item_id": "table-apex-standing-60", "x": 0.5, "y": 7.0, "rotation": 0, "width_ft": 5.0, "depth_ft": 2.5 }
    ],
    "unplaced_item_ids": [],
    "total_cost": 1285.0,
    "over_budget": false
  },
  "pending_approval": {
    "approval_id": "appr-9f8e7d6c",
    "status": "PENDING",
    "order_payload": { "total": 1285.0, "item_ids": [...] }
  },
  "order_result": null,
  "event_count": 14
}
```

---

## 🌟 Reality Matrix: What is Real vs Mocked

| Component | Status | Implementation Details |
| :--- | :--- | :--- |
| **MCP Furniture Tools** | **REAL** | Built-in Model Context Protocol server exposing `search_furniture`, `get_item_details`, and `place_order` with JSON-RPC 2.0 dispatch over a 60-item curated catalog. |
| **Sandbox Layout Packing** | **REAL** | Code is generated and executed inside TrueForge's isolated Python sandbox, computing 2D greedy rectangle packing coordinates `(x, y, rotation)` and collision boundaries. |
| **HITL Security Gate** | **REAL & PROVABLE** | Cryptographically verified HMAC-SHA256 gate that strictly intercepts and blocks `place_order` unless human approval is confirmed. Verified with automated proof tests. |
| **SSE Reconnect Stream** | **REAL** | Stateful event bus with chronological replay from sequence `from_seq`, ensuring zero state loss on page reloads. |
| **Payment Gateway** | **INTENTIONALLY MOCKED** | Mocked financial order confirmation with unique `order_id` and ISO `placed_at` timestamp without live credit card processing. |

---

## 🛠️ MCP Tool Contracts

The local MCP server (`mcp_server/server.py`) exposes exactly these three tools:

### 1. `search_furniture`
- **Input:** `{ query?: string, max_price?: number, category?: string, limit?: number }`
- **Output:** Array of `{ id: string, name: string, category: string, price: number, image_url: string, width_in: number, depth_in: number, style_tags: string[] }`

### 2. `get_item_details`
- **Input:** `{ id: string }`
- **Output:** Full item object above + `description: string`

### 3. `place_order` (Gated Sensitive Action)
- **Input:** `{ item_ids: string[], session_id?: string, approval_token?: string }`
- **Output:** `{ order_id: string, items: [...], total: number, placed_at: string (ISO) }`

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
- Python 3.10+
- `pip install fastapi uvicorn pydantic pytest pytest-asyncio httpx sse-starlette`

### 2. Run Automated Proof Tests
Verify all 23 test cases (including approval gate security tests and sandbox execution):
```bash
python -m pytest tests/ -v
```

### 3. Launch Backend & Visualizer
```bash
python -m uvicorn api.app:app --host 127.0.0.1 --port 8000 --reload
```
Navigate to:
```
http://127.0.0.1:8000/app/
```

---

## 📁 Repository Structure
```
trueforge-layout-agent/
├── catalog/                     # Seeded furniture catalog (60 items across 5 categories)
│   └── furniture.json
├── mcp_server/                  # Model Context Protocol server (3 exact tools)
│   ├── catalog.py
│   ├── server.py
│   └── __init__.py
├── sandbox/                     # TrueForge computational layout sandbox
│   ├── layout_algorithm.py     # Greedy 2D rectangle packing solver
│   ├── runner.py               # Isolated Python code execution runner
│   └── __init__.py
├── agent/                       # Agent orchestration & security gate
│   ├── approval_gate.py        # Non-bypassable HMAC-SHA256 HITL approval gate
│   ├── prompts.py              # System prompts & reasoning instructions
│   ├── engine.py               # Targeted multi-step execution loop
│   └── __init__.py
├── api/                         # FastAPI REST & SSE layer
│   ├── session_manager.py      # Stateful event bus & reconnect replay
│   ├── routes.py               # Endpoints: /session, /session/:id/events, /approve
│   ├── app.py                  # App entrypoint & CORS config
│   └── __init__.py
├── tests/                       # Automated test suite (23 tests)
│   ├── test_place_order_approval_gate.py
│   ├── test_mcp_catalog.py
│   ├── test_sandbox_layout.py
│   ├── test_session_reconnect.py
│   └── test_e2e.py
├── frontend/                    # Interactive visual dashboard
│   ├── index.html              # Dark-mode UI & controls
│   ├── styles.css              # Design tokens & animations
│   └── app.js                  # SSE consumer & 2D canvas visualizer
└── README.md
```
