# The Renovation Architect

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Pytest](https://img.shields.io/badge/Pytest-23%2F23%20Passing-success?style=for-the-badge&logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![TrueForge](https://img.shields.io/badge/TrueForge-Agent%20Harness-blueviolet?style=for-the-badge)](https://truefoundry.com/)
[![MCP](https://img.shields.io/badge/MCP-JSON--RPC%202.0-orange?style=for-the-badge)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **Autonomous Room Layout & Spatial Planning Agent powered by the TrueForge Agent Harness, Model Context Protocol (MCP) Catalog Discovery, Live Isolated Python Sandbox Geometry Packing, and a Provable Human-in-the-Loop (HITL) Procurement Gate.**

The Renovation Architect transforms natural language room planning prompts (e.g., *"Design an ergonomic executive home office under $1600"*) into mathematically verified, collision-free 2D floor plans. It queries a standardized MCP furniture catalog, dynamically executes greedy rectangle-packing scripts inside an isolated code execution sandbox, streams step-by-step reasoning and telemetry over Server-Sent Events (SSE), and halts execution at a cryptographic Human-in-the-Loop gate before any order is placed.

---

## Architecture & Flow

```
┌─────────────────┐       ┌──────────────────────┐       ┌───────────────────────┐
│   User Input    │ ────> │  TrueForge Harness   │ ────> │   MCP Catalog Server  │
│  Prompt/Budget  │       │   (Agent Engine)     │       │  (search / details)   │
└─────────────────┘       └──────────┬───────────┘       └───────────┬───────────┘
                                     │                               │
                                     ▼                               ▼
                          ┌──────────────────────┐       ┌───────────────────────┐
                          │  Isolated Execution  │ <──── │  60-Item Curated      │
                          │   Python Sandbox     │       │  Furniture Catalog    │
                          │ (2D Rectangle-Pack)  │       └───────────────────────┘
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │ Human-in-the-Loop    │
                          │ Cryptographic Gate   │
                          │ (HMAC-SHA256 Token)  │
                          └──────────┬───────────┘
                                     │  [User Approved]
                                     ▼
                          ┌──────────────────────┐
                          │   Order Placement    │
                          │  (Terminal Receipt)  │
                          └──────────────────────┘
```

### High-Level Execution Lifecycle
1. **User Input**: Room dimensions (`width_ft`, `length_ft`), style prompt, and budget limit are ingested.
2. **MCP Tool Search**: The agent queries the local MCP server (`search_furniture`, `get_item_details`) for items meeting aesthetic tags, category filters, and budget limits.
3. **Sandboxed Code Rectangle-Packing**: The agent generates and executes a 2D spatial layout algorithm inside TrueForge's isolated Python sandbox, computing collision boundaries, door clearance arcs, and rotation alignments.
4. **Human Approval Gate**: If the layout fits and remains within budget, the agent attempts to trigger `place_order`. The gate halts execution immediately and generates a pending approval request.
5. **Order Placement**: Only when the user explicitly signs off via the approval endpoint does the gate mint an HMAC-SHA256 signature, releasing `place_order` execution and returning the final order receipt.

### Reality Matrix: Real vs. Mocked

| Component | Status | Implementation Specifics |
| :--- | :--- | :--- |
| **Model Context Protocol (MCP) Server** | **REAL** | Built-in JSON-RPC 2.0 MCP server exposing `search_furniture`, `get_item_details`, and `place_order` with full parameter schema validation. |
| **Dynamic Sandbox Geometric Fitting** | **REAL** | Python execution sandbox with runtime whitelist restrictions, executing a live greedy 2D rectangle-packing solver with door clearance zones and rotation checks. |
| **Session Reconnection & Event Replay** | **REAL** | In-memory pub/sub event bus with sequence-indexed event caching (`from_seq`), enabling mid-run page reloads with zero state loss. |
| **Cryptographic HITL Approval Gate** | **REAL & PROVABLE** | Non-bypassable HMAC-SHA256 signed gate. Attempting `place_order` without authorization throws `ApprovalBlockedException` and halts execution. |
| **Furniture Catalog Data** | **REAL DATASET** | 60 curated items across 5 distinct categories (`seating`, `tables`, `lighting`, `storage`, `decor`) loaded from `catalog/furniture.json`. |
| **E-Commerce Checkout & Payment** | **INTENTIONALLY MOCKED** | Simulates checkout confirmation, generating deterministic `order_id` receipts and ISO timestamps without real credit card charges. |

---

## API Contract for Frontend

The TrueForge backend exposes a standard REST & Server-Sent Events (SSE) interface.

### 1. Create a Renovation Session
Initialize a new planning agent session with room dimensions, prompt, and optional budget.

- **Endpoint:** `POST /session`
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "room": {
    "width_ft": 12.0,
    "length_ft": 10.0
  },
  "prompt": "Design modern ergonomic workspace with standing desk, high-back chair, and lighting under $1600",
  "budget": 1600.0
}
```

**Response (200 OK):**
```json
{
  "session_id": "sess-a1b2c3d4",
  "status": "RUNNING",
  "prompt": "Design modern ergonomic workspace with standing desk, high-back chair, and lighting under $1600",
  "budget": 1600.0,
  "room": {
    "width_ft": 12.0,
    "length_ft": 10.0
  },
  "created_at": 1724900000.0
}
```

---

### 2. Live Structured Event Stream (SSE)
Subscribe to the real-time Server-Sent Events (SSE) stream. Supports replay for reloads/reconnections.

- **Endpoint:** `GET /session/:id/events?from_seq=0`
- **Headers:** `Accept: text/event-stream`

**SSE Event Wire Format:**
```
event: reasoning
id: 1
data: {"type": "reasoning", "sequence": 1, "timestamp": 1724900001.2, "payload": {"text": "Analyzing room dimensions (12.0x10.0 ft) and searching catalog for ergonomic furniture..."}}
```

**Event Types & Payloads:**
| Event `type` | Description | Key `payload` Fields |
| :--- | :--- | :--- |
| `reasoning` | High-level agent plan narration | `{ "text": string }` |
| `tool_call` | Agent invoking an MCP tool | `{ "tool": string, "arguments": object }` |
| `tool_result` | Output returned by the MCP tool | `{ "tool": string, "data": object \| array, "count": number }` |
| `sandbox_start` | Code submitted to layout sandbox | `{ "code": string, "budget": number }` |
| `sandbox_result` | Spatial placement solver output | `{ "fits": boolean, "placements": array, "unplaced_item_ids": array, "total_cost": number, "space_utilization_pct": number }` |
| `approval_required` | Gate halts execution for approval | `{ "approval_id": string, "order_payload": { "total": number, "item_ids": array, "items": array } }` |
| `approval_resolved` | User decision recorded | `{ "status": "APPROVED" \| "REJECTED", "approval_id": string }` |
| `done` | Agent terminal completion | `{ "status": "COMPLETED" \| "REJECTED", "order_result": object, "total_cost": number }` |

---

### 3. Resolve Human Approval Gate
Submit human authorization to unblock the agent and execute `place_order`.

- **Endpoint:** `POST /session/:id/approve`
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "approved": true,
  "token": "optional_hmac_override_token"
}
```

**Response (200 OK):**
```json
{
  "status": "APPROVED",
  "approval_id": "appr-9f8e7d6c",
  "token": "4a7b9c1d2e3f...",
  "session_id": "sess-a1b2c3d4",
  "order_id": "ord-88bf2a01"
}
```

> **Note:** Sending `{"approved": false}` rejects the proposal, transitions the session to `REJECTED`, and halts the pipeline without placing any order.

---

### 4. Fetch Rehydrated Session State (Reconnect / Resume)
Retrieve full snapshot of the session state for UI restoration upon page reload.

- **Endpoint:** `GET /session/:id/state`
- **Headers:** `Accept: application/json`

**Response (200 OK):**
```json
{
  "session_id": "sess-a1b2c3d4",
  "status": "WAITING_FOR_APPROVAL",
  "prompt": "Design modern ergonomic workspace with standing desk, high-back chair, and lighting under $1600",
  "budget": 1600.0,
  "room": {
    "width_ft": 12.0,
    "length_ft": 10.0
  },
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
      {
        "item_id": "table-apex-standing-60",
        "name": "ApexPro Motorized Dual-Motor Standing Desk (60x30)",
        "x": 0.5,
        "y": 7.0,
        "rotation": 0,
        "width_ft": 5.0,
        "depth_ft": 2.5,
        "price": 499.0
      }
    ],
    "unplaced_item_ids": [],
    "total_cost": 1285.0,
    "over_budget": false,
    "space_utilization_pct": 28.5
  },
  "pending_approval": {
    "approval_id": "appr-9f8e7d6c",
    "status": "PENDING",
    "order_payload": {
      "order_id": "ord-88bf2a01",
      "total": 1285.0,
      "item_ids": ["table-apex-standing-60", "chair-ergomaster-pro"]
    }
  },
  "order_result": null,
  "event_count": 14,
  "created_at": 1724900000.0,
  "updated_at": 1724900005.4
}
```

---

## Setup & Execution Guide

### 1. Environment Setup & Dependencies

#### Linux / macOS
```bash
# Clone the repository
git clone https://github.com/beastzex/Agents_In_Harness_repo.git
cd Agents_In_Harness_repo

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Windows (PowerShell)
```powershell
# Clone the repository
git clone https://github.com/beastzex/Agents_In_Harness_repo.git
cd Agents_In_Harness_repo

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

---

### 2. Starting the Services

#### Start the Unified TrueForge Backend & MCP Service
```bash
# Starts FastAPI server, internal MCP JSON-RPC router, and mounts the UI visualizer
python -m uvicorn api.app:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API:** `http://127.0.0.1:8000`
- **Interactive Visualizer UI:** `http://127.0.0.1:8000/app/`
- **API Documentation (Swagger):** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

---

### 3. Running Verification & Security Tests

Run the full automated test suite containing unit, end-to-end, and cryptographic gate proof tests:

```bash
# Run pytest with verbose reporting
python -m pytest tests/ -v
```

#### Test Suite Breakdown (23/23 Passing)
- `tests/test_e2e.py` — End-to-end session creation, MCP resolution, sandbox execution, and approval stream.
- `tests/test_mcp_catalog.py` — MCP tool discovery (`tools/list`), execution (`tools/call`), schema validation, category filtering.
- `tests/test_place_order_approval_gate.py` — Provable security tests validating that unapproved orders, forged tokens, and user rejections are blocked.
- `tests/test_sandbox_layout.py` — Bounding-box collision detection, 2D rectangle packing, door swing clearance, and budget checks.
- `tests/test_session_reconnect.py` — Multi-subscriber SSE broadcasting, historical event rehydration (`from_seq`), and session state snapshotting.

---

## Sandbox Layout & MCP Tools Contract

### The 3 Core MCP Tools

The Model Context Protocol server (`mcp_server/server.py`) defines three explicit tools:

#### 1. `search_furniture`
Performs faceted catalog searches with keyword filtering, category matching, and price caps.
- **Input Schema:**
  - `query` *(string, optional)*: Search keywords (e.g., `"standing desk"`, `"mesh chair"`).
  - `category` *(string, optional)*: Category (`"seating"`, `"tables"`, `"lighting"`, `"storage"`, `"decor"`).
  - `max_price` *(number, optional)*: Maximum item price in USD.
  - `limit` *(integer, optional, default: 12)*: Result count cap.
- **Output:** Array of item summaries containing `id`, `name`, `category`, `price`, `image_url`, `width_in`, `depth_in`, and `style_tags`.

#### 2. `get_item_details`
Retrieves granular specifications and dimensional profiles for an individual item.
- **Input Schema:**
  - `id` *(string, required)*: Specific product ID (e.g., `"chair-ergomaster-pro"`).
- **Output:** Complete item record including comprehensive textual `description`.

#### 3. `place_order` *(Gated Sensitive Action)*
Submits items for procurement. Execution is strictly blocked until authorized by the Human-in-the-Loop approval gate.
- **Input Schema:**
  - `item_ids` *(array of strings, required)*: Furniture item IDs to purchase.
  - `session_id` *(string, optional)*: Active session identifier.
  - `approval_token` *(string, optional)*: Cryptographic token generated upon human sign-off.
- **Output:** `{ "order_id": string, "items": array, "total": number, "placed_at": string }`.

---

### Python Greedy Rectangle-Packing Layout Algorithm

Executed inside TrueForge's isolated Python sandbox (`sandbox/layout_algorithm.py`):

1. **Unit Conversion**: Ingests room dimensions in feet (`width_ft`, `length_ft`) and converts item catalog dimensions from inches (`width_in`, `depth_in`) to feet.
2. **Clearance Reservation**: Constructs an exclusion bounding box for the door swing arc (e.g., 3.0 ft clearance along the designated door wall) to prevent blocked entryways.
3. **Area-Descending Ordering**: Sorts candidate furniture items by footprint area descending (`w * d`), anchoring primary heavy furniture (desks, couches, shelving) before smaller secondary items (chairs, lamps).
4. **2D Coordinate Grid Walk**: Sweeps the room coordinate space in discrete 0.5-ft increments from perimeter walls inward with a 0.25-ft safety margin.
5. **Orientation & Collision Testing**: For each candidate coordinate `(x, y)`, tests $0^\circ$ and $90^\circ$ rotations against all existing bounding boxes using Axis-Aligned Bounding Box (AABB) separation:
   $$\text{Collision} = \neg \left( \text{box}_1.\max_x + \text{pad} \le \text{box}_2.\min_x \lor \text{box}_2.\max_x + \text{pad} \le \text{box}_1.\min_x \lor \text{box}_1.\max_y + \text{pad} \le \text{box}_2.\min_y \lor \text{box}_2.\max_y + \text{pad} \le \text{box}_1.\min_y \right)$$
6. **Constraint Verification**: If an item cannot fit without overlap, it is logged in `unplaced_item_ids`. Computes total cost and verifies against the budget cap.

---

## Qodo Code Review Evidence (Mandatory Hackathon Section)

### Pull Request Information
- **Pull Request Link:** `https://github.com/beastzex/Agents_In_Harness_repo/pull/1`

### Review Integration Summary
Qodo was integrated into the GitHub Pull Request workflow to perform automated static code analysis, logic verification, and security reviews before code was merged into `main`. Direct pushes to the `main` branch were restricted in favor of pull request reviews and passing CI test suites.

### Surfaced Findings & Fixes

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  QODO REVIEW FINDING #1: [HIGH SEVERITY] Cryptographic Timing Attack on Gate Token       │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  Location: agent/approval_gate.py (ApprovalGate.verify_and_execute_order)                │
│  Issue: Direct string comparison (`token == expected_token`) was susceptible to        │
│         timing side-channel attacks.                                                     │
│  Resolution: Replaced standard equality with `hmac.compare_digest(token, expected_token)`│
│              to enforce constant-time string verification.                               │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  QODO REVIEW FINDING #2: [MEDIUM SEVERITY] Bounding Box Zero-Padding Wall Collision      │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  Location: sandbox/layout_algorithm.py (pack_furniture_layout)                           │
│  Issue: Items placed exactly at `x = width_ft - w` lacked boundary margin, causing      │
│         false positive wall intersections in certain floating-point calculations.        │
│  Resolution: Added an explicit `wall_margin = 0.25` (3 inches) and normalized floating-  │
│              point coordinates with `round(val, 2)` throughout the grid search.          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  QODO REVIEW FINDING #3: [MEDIUM SEVERITY] SSE Connection Heartbeat & Hang Prevention    │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  Location: api/routes.py (stream_session_events)                                         │
│  Issue: Inactive SSE connections during long agent pauses lacked keep-alive pings,       │
│         causing client-side reverse proxy timeouts.                                      │
│  Resolution: Implemented an `asyncio.wait_for(q.get(), timeout=2.0)` handler yielding    │
│              periodic `: heartbeat\n\n` comments to maintain open connections.          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
trueforge-layout-agent/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI matrix (Python 3.10, 3.11, 3.12)
├── catalog/
│   └── furniture.json                 # Curated 60-item furniture database (5 categories)
├── mcp_server/
│   ├── catalog.py                     # Catalog querying, filtering, and data models
│   ├── server.py                      # JSON-RPC 2.0 MCP server with 3 tool contracts
│   └── __init__.py
├── sandbox/
│   ├── layout_algorithm.py            # Greedy 2D rectangle packing & collision engine
│   ├── runner.py                      # Isolated Python runtime runner with AST guards
│   └── __init__.py
├── agent/
│   ├── approval_gate.py               # Provable HMAC-SHA256 Human-in-the-Loop security gate
│   ├── prompts.py                     # Agent reasoning prompts & spatial planning guidelines
│   ├── engine.py                      # TrueForge orchestration loop & execution lifecycle
│   └── __init__.py
├── api/
│   ├── session_manager.py             # Event bus, session state persistence & reconnect replay
│   ├── routes.py                      # REST endpoints & SSE streaming handler
│   ├── app.py                         # FastAPI application entrypoint & CORS middleware
│   └── __init__.py
├── tests/
│   ├── test_e2e.py                    # End-to-end full renovation architect test cases
│   ├── test_mcp_catalog.py            # MCP protocol, discovery, and tool call tests
│   ├── test_place_order_approval_gate.py # Security proof tests for HITL approval gate
│   ├── test_sandbox_layout.py         # Computational geometry, packing & collision tests
│   └── test_session_reconnect.py      # Event bus replay & state rehydration tests
├── frontend/
│   ├── index.html                     # Responsive dark-mode dashboard interface
│   ├── styles.css                     # Design tokens, spatial canvas styling & animations
│   └── app.js                         # SSE consumer & interactive 2D floor plan visualizer
├── requirements.txt                   # Production & testing dependencies
├── LICENSE                            # MIT License
└── README.md                          # Project documentation & submission specification
```
