# ⚡ TrueFoundry / TrueForge Integration Architecture

ReDessIo leverages **TrueFoundry / TrueForge** primitives across three core pillars:
1. **Isolated Code Execution Sandboxes**
2. **Model Hosting & Fast LLM Inference (GPT-OSS-120B)**
3. **Agent Orchestration Harness & State Persistence**

---

## 🛠️ 1. TrueForge Isolated Python Sandbox (`sandbox/`)
In autonomous spatial reasoning, mathematical verification must be deterministic and safe. ReDessIo executes layout packing scripts inside an isolated TrueForge Python execution container.

```python
# Execution inside TrueForge Sandbox
sandbox_res = self.sandbox.execute_layout_script(
    room_data=session.room,
    items_data=session.mood_board_items,
    budget=session.budget
)
```

### Why TrueForge Sandbox is Essential:
- **Zero-Tolerance Collision Math**: Uses Python `shapely` geometry algorithms to calculate spatial boundaries, wall margins, and door-swing clearances.
- **Resource & Security Isolation**: Untrusted LLM-generated packing code runs sandboxed without access to host filesystem or network sockets.
- **Performance Profiling**: Captures millisecond-level execution metrics (`execution_time_ms`, stdout logs, and memory utilization).

---

## 🧠 2. TrueForge Model Serving (GPT-OSS-120B via Groq)
- **High-Throughput Reasoning**: Powered by open-weights `openai/gpt-oss-120b` running on Groq LPU infrastructure.
- **Sub-Second Token Latency**: Delivers real-time conversational streaming and architectural step-by-step rationale directly into the Activity Feed.

---

## 🔄 3. TrueForge Agent Harness & Reconnection Bus (`api/session_manager.py`)
- **Event-Driven Pub/Sub**: Multi-subscriber broadcast bus ensuring live SSE streaming to frontend clients.
- **State Reconnection & Replay**: If the browser drops connection, client queries `/session/{id}/state` or reconnects to the event stream, instantly replaying missed events with zero data loss.
- **Provable Approval Gates**: Blocks unauthorized execution of financial actions, enforcing a strict Human-in-the-Loop policy.
