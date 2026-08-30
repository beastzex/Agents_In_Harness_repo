# 📡 ReDessIo API Reference

The FastAPI backend exposes REST endpoints and Server-Sent Events (SSE) streams under `/api` and `/session`.

---

## 🚀 Endpoints

### 1. `POST /api/session` or `POST /session`
Initialize a new autonomous spatial design agent session.

**Request Payload**:
```json
{
  "prompt": "Design a warm-minimalist 16ft x 12ft living room under $4000",
  "room": {
    "width_ft": 16.0,
    "length_ft": 12.0,
    "height_ft": 9.0,
    "door_wall": "south",
    "room_type": "living-room"
  },
  "room_type": "living-room",
  "budget": 4000.0,
  "preferred_style": "warm-minimalist",
  "auto_start": true
}
```

**Response**:
```json
{
  "session_id": "sess-a1b2c3d4",
  "status": "RUNNING",
  "created_at": 1725000000.0
}
```

---

### 2. `GET /session/{session_id}/events`
Server-Sent Events (SSE) stream delivering real-time agent thoughts, MCP tool calls, sandbox layout results, and approval prompts.

**Event Types Emitted**:
- `session_start`
- `reasoning` (Agent thought steps)
- `tool_call` (MCP catalog search / details)
- `tool_result` (Catalog items returned & evaluated)
- `sandbox_start` (Spatial calculation start)
- `sandbox_result` (Non-overlapping placements with coordinates)
- `approval_required` (HITL gate halt)
- `approval_resolved` (Order placed or rejected)
- `done` (Session completion)

---

### 3. `POST /session/{session_id}/approve`
Approve the proposed furniture order and authorize the agent to execute `place_order`.

**Request Payload**:
```json
{
  "approved": true,
  "notes": "Approved via hold-to-confirm gate"
}
```

---

### 4. `POST /session/{session_id}/reject`
Reject the proposed order and cancel execution.

---

### 5. `GET /session/{session_id}/state`
Retrieve a point-in-time state snapshot (used for reconnection and state recovery).

---

### 6. `POST /api/copilot/instruct`
Instruct the live AI Spatial Copilot to adjust coordinates in real-time.

**Request Payload**:
```json
{
  "instruction": "move sofa towards north wall and rotate coffee table 90 degrees",
  "room": {
    "width_ft": 16.0,
    "length_ft": 12.0
  },
  "items": [
    {
      "id": "item-sofa-01",
      "name": "Klint Modular Sectional",
      "category": "seating",
      "xFt": 3.0,
      "yFt": 1.8,
      "rotationDeg": 0
    }
  ],
  "current_theme": "cad-architectural"
}
```

**Response**:
```json
{
  "success": true,
  "reply": "Anchored the sectional sofa against the north wall and rotated the coffee table 90°.",
  "updated_items": [...],
  "suggested_theme": null,
  "instruction": "move sofa towards north wall and rotate coffee table 90 degrees"
}
```

---

### 7. `GET /health`
Service health check verifying status of the agent harness, MCP server, sandbox runner, and approval gate.
