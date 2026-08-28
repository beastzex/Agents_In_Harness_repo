/**
 * TrueForge Agent Harness - Interactive Dashboard Controller
 * Handles SSE streaming, real-time tool logs, 2D floorplan rendering, and HITL approval gate.
 */

let currentSessionId = null;
let eventSource = null;
let lastSequence = 0;
let currentRoom = { width: 12.0, length: 10.0, door_wall: "south", door_position: 3.0, door_width: 3.0 };
let placedItems = [];
let pendingApproval = null;

// Presets
const PRESETS = {
  ergonomic: {
    goal: "Setup an ergonomic developer workstation with motorized standing desk, mesh task chair, curved ultrawide monitor, and ambient lightbar.",
    width: 12,
    length: 10,
    budget: 1600,
    doorWall: "south"
  },
  minimalist: {
    goal: "Nordic minimalist home office with solid oak desk, breathable chair, and floor reading lamp.",
    width: 10,
    length: 8.5,
    budget: 950,
    doorWall: "south"
  },
  executive: {
    goal: "Executive suite with dual 4K monitors, leather lounge chair, oak credenza bookshelf, and standing floor lamp.",
    width: 15,
    length: 12,
    budget: 2200,
    doorWall: "south"
  }
};

function applyPreset(presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;
  document.getElementById("promptGoal").value = p.goal;
  document.getElementById("roomWidth").value = p.width;
  document.getElementById("roomLength").value = p.length;
  document.getElementById("budgetLimit").value = p.budget;
  document.getElementById("doorWall").value = p.doorWall;
}

// Initialize Canvas
const canvas = document.getElementById("roomCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = (rect.height || 420) * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  renderRoomLayout();
}
window.addEventListener("resize", resizeCanvas);

// Security utility to prevent XSS
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Logs Terminal
function appendLog(type, tag, content, extra = null) {
  const logsContainer = document.getElementById("terminalLogs");
  const entry = document.createElement("div");
  entry.className = `log-entry log-${type}`;

  const timeStr = new Date().toLocaleTimeString();
  let extraHtml = "";
  if (extra) {
    extraHtml = `<pre style="font-size: 0.72rem; opacity: 0.85; margin-top: 4px; overflow-x: auto;">${escapeHtml(extra)}</pre>`;
  }

  entry.innerHTML = `
    <div class="log-header">
      <span class="log-tag">${escapeHtml(tag)}</span>
      <span class="log-time">${escapeHtml(timeStr)}</span>
    </div>
    <div class="log-content">${escapeHtml(content)}</div>
    ${extraHtml}
  `;

  logsContainer.appendChild(entry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearLogs() {
  document.getElementById("terminalLogs").innerHTML = "";
}

// Start Session
async function startNewSession() {
  const goal = document.getElementById("promptGoal").value || "Ergonomic office setup";
  const width = parseFloat(document.getElementById("roomWidth").value) || 12.0;
  const length = parseFloat(document.getElementById("roomLength").value) || 10.0;
  const budget = parseFloat(document.getElementById("budgetLimit").value) || 1600.0;
  const doorWall = document.getElementById("doorWall").value || "south";

  currentRoom = {
    width: width,
    length: length,
    door_wall: doorWall,
    door_position: width * 0.25,
    door_width: 3.0
  };

  placedItems = [];
  lastSequence = 0;
  pendingApproval = null;
  document.getElementById("approvalBanner").style.display = "none";
  document.getElementById("canvasDimLabel").innerText = `${width} ft × ${length} ft Room`;
  document.getElementById("metricBudgetSub").innerText = `Budget cap: $${budget.toLocaleString()}`;
  updateStatusBadge("RUNNING", "purple");

  clearLogs();
  appendLog("system", "INITIALIZING", `Starting new agent session for ${width}x${length}ft space...`);

  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: goal,
        room: currentRoom,
        budget: budget,
        auto_start: true
      })
    });

    const data = await res.json();
    currentSessionId = data.session_id;
    document.getElementById("terminalSessionId").innerText = `session: ${currentSessionId}`;

    connectEventStream(currentSessionId, 0);
  } catch (err) {
    appendLog("system", "ERROR", `Failed to create session: ${err.message}`);
    updateStatusBadge("ERROR", "rose");
  }
}

// Connect SSE Stream
function connectEventStream(sessionId, fromSeq = 0) {
  if (eventSource) {
    eventSource.close();
  }

  appendLog("system", "SSE STREAM", `Connected to event stream (resuming from seq: ${fromSeq})...`);

  eventSource = new EventSource(`/api/sessions/${sessionId}/stream?from_seq=${fromSeq}`);

  eventSource.onmessage = (e) => {
    // SSE heartbeat / default message
  };

  eventSource.addEventListener("session_started", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    appendLog("system", "SESSION START", `Goal: "${ev.data.goal}" (Budget: $${ev.data.budget})`);
    updateStatusBadge("RUNNING", "purple");
  });

  eventSource.addEventListener("agent_thought", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    appendLog("thought", "AGENT REASONING", ev.data.thought);
  });

  eventSource.addEventListener("tool_call_start", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const payloadStr = ev.data.arguments ? JSON.stringify(ev.data.arguments, null, 2) : (ev.data.payload ? JSON.stringify(ev.data.payload, null, 2) : "");
    appendLog("tool", `TOOL CALL: ${ev.data.tool_name}`, `Caller: ${ev.data.caller}`, payloadStr);
  });

  eventSource.addEventListener("tool_call_result", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    appendLog("success", `TOOL RESULT: ${ev.data.tool_name}`, ev.data.result_summary || ev.data.message || "Completed");
  });

  eventSource.addEventListener("sandbox_executing", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    appendLog("sandbox", "SANDBOX EXECUTION", `Isolated Runtime: ${ev.data.environment}\nExecuting ${ev.data.target} with ${ev.data.item_count} items.`, ev.data.script_preview);
  });

  eventSource.addEventListener("sandbox_stdout", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    appendLog("sandbox", "SANDBOX STDOUT", `Execution duration: ${ev.data.execution_time_ms} ms`, ev.data.stdout);
  });

  eventSource.addEventListener("sandbox_completed", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const metrics = ev.data.layout_metrics || {};
    document.getElementById("metricErgo").innerText = `${metrics.ergonomic_score || 95}/100`;
    document.getElementById("metricUtil").innerText = `${metrics.space_utilization_pct || 0}%`;
    document.getElementById("metricCollisions").innerText = metrics.collision_count || 0;

    placedItems = ev.data.placed_items || [];
    const totalCost = placedItems.reduce((sum, it) => sum + (it.price || 0), 0);
    document.getElementById("metricCost").innerText = `$${totalCost.toFixed(2)}`;

    renderRoomLayout();
    appendLog("success", "SANDBOX COMPLETED", `Spatial layout solver computed ${placedItems.length} placements with ${metrics.collision_count} collisions.`);
  });

  eventSource.addEventListener("approval_required", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    pendingApproval = ev.data;

    updateStatusBadge("WAITING APPROVAL", "amber");
    appendLog("approval", "APPROVAL GATE BLOCKED", `Deterministic security gate intercepted 'place_order'. Total: $${ev.data.order_summary.total_amount}`);

    // Show approval banner
    showApprovalBanner(ev.data);
  });

  eventSource.addEventListener("approval_granted", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    document.getElementById("approvalBanner").style.display = "none";
    appendLog("success", "APPROVAL VERIFIED", `Signed authorization token verified. Resuming execution.`);
    updateStatusBadge("APPROVED", "emerald");
  });

  eventSource.addEventListener("approval_rejected", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    document.getElementById("approvalBanner").style.display = "none";
    appendLog("approval", "ORDER REJECTED", `Reason: ${ev.data.reason}`);
    updateStatusBadge("REJECTED", "rose");
    eventSource.close();
  });

  eventSource.addEventListener("session_completed", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    appendLog("success", "SESSION COMPLETED", `Run completed successfully! Order ID: ${ev.data.order_id} (Total: $${ev.data.total_cost})`);
    updateStatusBadge("COMPLETED", "emerald");
    eventSource.close();
  });

  eventSource.onerror = (err) => {
    // SSE stream ended or closed
  };
}

function updateStatusBadge(text, color) {
  const badge = document.getElementById("sessionStatusBadge");
  badge.innerText = text;
  badge.className = `badge`;
  if (color === "amber") badge.style.color = "var(--accent-amber)";
  else if (color === "emerald") badge.style.color = "var(--accent-emerald)";
  else if (color === "purple") badge.style.color = "var(--accent-purple)";
  else if (color === "rose") badge.style.color = "var(--accent-rose)";
}

// Show Approval Banner
function showApprovalBanner(approvalData) {
  const banner = document.getElementById("approvalBanner");
  const tbody = document.getElementById("orderItemsBody");
  const totalCost = document.getElementById("approvalTotalCost");

  tbody.innerHTML = "";
  const items = approvalData.order_summary.items || [];
  items.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight: 600;">${escapeHtml(item.name)}</td>
      <td><span class="badge" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">${escapeHtml(item.category)}</span></td>
      <td>1</td>
      <td style="text-align: right; font-weight: 600;">$${Number(item.price || 0).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  totalCost.innerText = `$${approvalData.order_summary.total_amount.toFixed(2)}`;
  banner.style.display = "flex";
}

async function approveCurrentOrder() {
  if (!currentSessionId) return;
  try {
    const res = await fetch(`/api/sessions/${currentSessionId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "User clicked Approve in dashboard" })
    });
    const data = await res.json();
    appendLog("system", "APPROVE DISPATCHED", `Approval token: ${data.token.slice(0, 16)}...`);
  } catch (err) {
    appendLog("system", "ERROR", `Failed to approve order: ${err.message}`);
  }
}

async function rejectCurrentOrder() {
  if (!currentSessionId) return;
  try {
    await fetch(`/api/sessions/${currentSessionId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "User declined order proposal" })
    });
  } catch (err) {
    appendLog("system", "ERROR", `Failed to reject order: ${err.message}`);
  }
}

// Simulate Mid-Session Reconnect
function simulateReconnect() {
  if (!currentSessionId) {
    alert("Please start a session first!");
    return;
  }
  appendLog("system", "RECONNECT", `Simulating mid-session disconnect & reconnect (Resuming from sequence ${lastSequence})...`);
  connectEventStream(currentSessionId, 0); // Replay from start or last sequence
}

// 2D Spatial Floorplan Renderer
function renderRoomLayout() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  ctx.clearRect(0, 0, w, h);

  const roomW = currentRoom.width || 12.0;
  const roomL = currentRoom.length || 10.0;

  // Scale to fit canvas with padding
  const padding = 50;
  const scale = Math.min((w - padding * 2) / roomW, (h - padding * 2) / roomL);

  const offsetX = (w - roomW * scale) / 2;
  const offsetY = (h - roomL * scale) / 2;

  // 1. Grid Background
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  const gridSize = scale; // 1 ft grid
  for (let x = offsetX; x <= offsetX + roomW * scale; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + roomL * scale);
    ctx.stroke();
  }
  for (let y = offsetY; y <= offsetY + roomL * scale; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + roomW * scale, y);
    ctx.stroke();
  }

  // 2. Room Outer Boundary
  ctx.strokeStyle = "rgba(99, 102, 241, 0.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(offsetX, offsetY, roomW * scale, roomL * scale);

  // 3. Window on North wall
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 6;
  const winX = offsetX + (roomW * 0.3) * scale;
  const winW = (roomW * 0.4) * scale;
  ctx.beginPath();
  ctx.moveTo(winX, offsetY);
  ctx.lineTo(winX + winW, offsetY);
  ctx.stroke();

  // Window label
  ctx.fillStyle = "#38bdf8";
  ctx.font = "10px Inter";
  ctx.fillText("WINDOW", winX + winW / 2 - 20, offsetY - 8);

  // 4. Door Swing Corridor (South Wall)
  const doorX = offsetX + (currentRoom.door_position || 3.0) * scale;
  const doorW = (currentRoom.door_width || 3.0) * scale;
  const doorY = offsetY + roomL * scale;

  ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(doorX, doorY, doorW, Math.PI, 1.5 * Math.PI, false);
  ctx.stroke();
  ctx.setLineDash([]);

  // Door opening cut
  ctx.strokeStyle = "var(--bg-primary)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(doorX, doorY);
  ctx.lineTo(doorX + doorW, doorY);
  ctx.stroke();

  // Door label
  ctx.fillStyle = "#f59e0b";
  ctx.font = "10px Inter";
  ctx.fillText("DOOR ENTRY", doorX + 10, doorY + 18);

  // 5. Placed Furniture Items
  placedItems.forEach((item, index) => {
    const ix = offsetX + item.x * scale;
    const iy = offsetY + (roomL - item.y - item.depth) * scale; // Invert Y for canvas coordinate system
    const iw = item.width * scale;
    const id = item.depth * scale;

    ctx.save();

    // Item fill & border
    ctx.fillStyle = item.color ? `${item.color}33` : "rgba(59, 130, 246, 0.25)";
    ctx.strokeStyle = item.color || "#3b82f6";
    ctx.lineWidth = 2;

    if (item.is_surface_mounted) {
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
    }

    ctx.beginPath();
    ctx.roundRect(ix, iy, iw, id, 4);
    ctx.fill();
    ctx.stroke();

    // Item Name and dimensions
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Inter";
    const textY = iy + id / 2 - (item.is_surface_mounted ? 4 : 0);
    ctx.fillText(item.name.split(" ")[0], ix + 6, textY);

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "9px Inter";
    ctx.fillText(`${item.width}' × ${item.depth}'`, ix + 6, textY + 12);

    ctx.restore();
  });
}

// Initial Setup
applyPreset("ergonomic");
setTimeout(resizeCanvas, 100);
