/**
 * The Renovation Architect - Interactive Frontend Controller
 * Consumes TrueForge REST & SSE stream: reasoning, tool_call, tool_result, sandbox_start, sandbox_result, approval_required, approval_resolved, done.
 */

let currentSessionId = null;
let eventSource = null;
let lastSequence = 0;
let currentRoom = { width_ft: 12.0, length_ft: 10.0, door_wall: "south", door_position: 3.0, door_width: 3.0 };
let moodBoardItems = [];
let placedItems = [];
let unplacedItems = [];
let pendingApproval = null;

// Presets for quick judge demo
const PRESETS = {
  ergonomic: {
    goal: "Design a high-productivity ergonomic workstation with motorized standing desk, mesh chair, arc floor lamp, and acoustic wall panels.",
    width: 12,
    length: 10,
    budget: 1600,
    doorWall: "south"
  },
  minimalist: {
    goal: "Nordic minimalist home office with solid oak desk, fabric armchair, travertine table, and terracotta plant.",
    width: 10,
    length: 9,
    budget: 1100,
    doorWall: "south"
  },
  executive: {
    goal: "Executive corner suite with walnut desk, Italian leather lounge chair, fluted sideboard credenza, and brass task lighting.",
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

// Canvas Initialization
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

// Live Terminal Logging
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

// Start Session: calls POST /session
async function startNewSession() {
  const prompt = document.getElementById("promptGoal").value || "Design modern ergonomic workspace under $1600";
  const width = parseFloat(document.getElementById("roomWidth").value) || 12.0;
  const length = parseFloat(document.getElementById("roomLength").value) || 10.0;
  const budget = parseFloat(document.getElementById("budgetLimit").value) || 1600.0;
  const doorWall = document.getElementById("doorWall").value || "south";

  currentRoom = {
    width_ft: width,
    length_ft: length,
    door_wall: doorWall,
    door_position: width * 0.25,
    door_width: 3.0
  };

  moodBoardItems = [];
  placedItems = [];
  unplacedItems = [];
  lastSequence = 0;
  pendingApproval = null;
  document.getElementById("approvalBanner").style.display = "none";
  document.getElementById("canvasDimLabel").innerText = `${width} ft × ${length} ft Room`;
  document.getElementById("metricBudgetSub").innerText = `Budget cap: $${budget.toLocaleString()}`;
  updateStatusBadge("RUNNING", "purple");

  clearLogs();
  appendLog("system", "INITIALIZING", `Creating session for ${width}x${length}ft space with $${budget} budget...`);

  try {
    const res = await fetch("/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
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

// Connect to GET /session/:id/events SSE Stream
function connectEventStream(sessionId, fromSeq = 0) {
  if (eventSource) {
    eventSource.close();
  }

  appendLog("system", "STREAM CONNECTED", `Subscribing to /session/${sessionId}/events (resuming from seq: ${fromSeq})...`);

  eventSource = new EventSource(`/session/${sessionId}/events?from_seq=${fromSeq}`);

  eventSource.onmessage = (e) => {
    // SSE heartbeat
  };

  // Structured events: reasoning | tool_call | tool_result | sandbox_start | sandbox_result | approval_required | approval_resolved | done
  eventSource.addEventListener("reasoning", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const msg = ev.payload?.message || ev.data?.message || ev.payload?.thought || "Agent analyzing...";
    appendLog("thought", "AGENT REASONING", msg);
  });

  eventSource.addEventListener("tool_call", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const p = ev.payload || ev.data || {};
    const argsStr = p.arguments ? JSON.stringify(p.arguments, null, 2) : "";
    appendLog("tool", `MCP TOOL: ${p.tool_name}`, `Caller: ${p.caller || 'Agent'}`, argsStr);
  });

  eventSource.addEventListener("tool_result", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const p = ev.payload || ev.data || {};
    appendLog("success", `MCP RESULT: ${p.tool_name}`, p.summary || p.result_summary || "Tool execution completed.");
    if (p.mood_board) {
      moodBoardItems = p.mood_board;
    }
  });

  eventSource.addEventListener("sandbox_start", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const p = ev.payload || ev.data || {};
    appendLog("sandbox", "SANDBOX RUNNER", `Executing ${p.target || 'layout algorithm'} for ${p.items_to_place || p.item_count || 0} items...`, p.script_preview);
  });

  eventSource.addEventListener("sandbox_result", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const p = ev.payload || ev.data || {};

    placedItems = p.placements || [];
    unplacedItems = p.unplaced_item_ids || [];
    const totalCost = p.total_cost || 0.0;
    const utilPct = p.space_utilization_pct || 0.0;

    document.getElementById("metricUtil").innerText = `${utilPct}%`;
    document.getElementById("metricCost").innerText = `$${totalCost.toFixed(2)}`;
    document.getElementById("metricCollisions").innerText = unplacedItems.length;

    const ergoVal = Math.max(70, Math.min(100, Math.round(98 - unplacedItems.length * 15)));
    document.getElementById("metricErgo").innerText = `${ergoVal}/100`;

    renderRoomLayout();
    appendLog("success", "SANDBOX COMPLETED", `Greedy packing computed ${placedItems.length} placements (${unplacedItems.length} unplaced, Fits: ${p.fits}). Execution time: ${p.execution_time_ms} ms`);
  });

  eventSource.addEventListener("approval_required", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const p = ev.payload || ev.data || {};
    pendingApproval = p;

    updateStatusBadge("WAITING APPROVAL", "amber");
    appendLog("approval", "HITL APPROVAL GATE", `Deterministic gate blocked 'place_order'. Order Total: $${p.order_summary?.total_amount || p.total || 0}`);
    showApprovalBanner(p);
  });

  eventSource.addEventListener("approval_resolved", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const p = ev.payload || ev.data || {};
    document.getElementById("approvalBanner").style.display = "none";
    if (p.approved) {
      appendLog("success", "APPROVAL VERIFIED", `Signed authorization token verified. Resuming order execution.`);
      updateStatusBadge("APPROVED", "emerald");
    } else {
      appendLog("approval", "ORDER REJECTED", `Order declined by user.`);
      updateStatusBadge("REJECTED", "rose");
    }
  });

  eventSource.addEventListener("done", (e) => {
    const ev = JSON.parse(e.data);
    lastSequence = ev.sequence;
    const p = ev.payload || ev.data || {};
    if (p.status === "COMPLETED") {
      appendLog("success", "SESSION COMPLETED", `Order ID: ${p.order_id || 'N/A'} confirmed. Total: $${p.total_cost || p.total || 0.0}`);
      updateStatusBadge("COMPLETED", "emerald");
    } else {
      appendLog("system", "SESSION HALTED", `Status: ${p.status}`);
    }
    eventSource.close();
  });

  eventSource.onerror = (err) => {
    // Stream closed or error
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

// Show Approval Banner for HITL Action
function showApprovalBanner(approvalData) {
  const banner = document.getElementById("approvalBanner");
  const tbody = document.getElementById("orderItemsBody");
  const totalCost = document.getElementById("approvalTotalCost");

  tbody.innerHTML = "";
  const items = approvalData.order_summary?.items || approvalData.items || [];
  let sumTotal = 0;

  items.forEach(item => {
    const tr = document.createElement("tr");
    const p = Number(item.price || 0);
    sumTotal += p;
    tr.innerHTML = `
      <td style="font-weight: 600;">${escapeHtml(item.name)}</td>
      <td><span class="badge" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">${escapeHtml(item.category)}</span></td>
      <td>1</td>
      <td style="text-align: right; font-weight: 600;">$${p.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  const finalTotal = approvalData.order_summary?.total_amount || sumTotal;
  totalCost.innerText = `$${Number(finalTotal).toFixed(2)}`;
  banner.style.display = "flex";
}

// Approve order: POST /session/:id/approve with { approved: true }
async function approveCurrentOrder() {
  if (!currentSessionId) return;
  try {
    const res = await fetch(`/session/${currentSessionId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true, notes: "Approved by user in dashboard" })
    });
    const data = await res.json();
    appendLog("system", "APPROVE DISPATCHED", `Cryptographic token: ${data.token ? data.token.slice(0, 16) : 'N/A'}...`);
  } catch (err) {
    appendLog("system", "ERROR", `Failed to approve order: ${err.message}`);
  }
}

// Reject order: POST /session/:id/approve with { approved: false }
async function rejectCurrentOrder() {
  if (!currentSessionId) return;
  try {
    await fetch(`/session/${currentSessionId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false, reason: "User declined order in dashboard" })
    });
  } catch (err) {
    appendLog("system", "ERROR", `Failed to reject order: ${err.message}`);
  }
}

// Simulate Mid-Session Reconnect (resumes same session ID)
async function simulateReconnect() {
  if (!currentSessionId) {
    alert("Please start an agent session first!");
    return;
  }
  appendLog("system", "RECONNECT", `Simulating mid-session reload/reconnect for session ${currentSessionId}...`);

  // Fetch full state from GET /session/:id/state
  try {
    const res = await fetch(`/session/${currentSessionId}/state`);
    const state = await res.json();
    appendLog("system", "STATE REHYDRATED", `Session status: ${state.status}, Events: ${state.event_count}`);
    
    if (state.layout_result?.placements) {
      placedItems = state.layout_result.placements;
      unplacedItems = state.layout_result.unplaced_item_ids || [];
      renderRoomLayout();
    }
    if (state.pending_approval) {
      showApprovalBanner(state.pending_approval);
    }
  } catch (err) {
    console.error("Error rehydrating state:", err);
  }

  // Re-subscribe to SSE stream from seq 0 or lastSequence
  connectEventStream(currentSessionId, 0);
}

// 2D Spatial Floorplan Renderer
function renderRoomLayout() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  ctx.clearRect(0, 0, w, h);

  const roomW = currentRoom.width_ft || 12.0;
  const roomL = currentRoom.length_ft || 10.0;

  const padding = 45;
  const scale = Math.min((w - padding * 2) / roomW, (h - padding * 2) / roomL);

  const offsetX = (w - roomW * scale) / 2;
  const offsetY = (h - roomL * scale) / 2;

  // 1. Grid Background
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  const gridSize = scale; // 1 ft grid lines
  for (let x = offsetX; x <= offsetX + roomW * scale + 1; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + roomL * scale);
    ctx.stroke();
  }
  for (let y = offsetY; y <= offsetY + roomL * scale + 1; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + roomW * scale, y);
    ctx.stroke();
  }

  // 2. Room Outer Perimeter Walls
  ctx.strokeStyle = "rgba(99, 102, 241, 0.7)";
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

  ctx.fillStyle = "#38bdf8";
  ctx.font = "10px Inter, sans-serif";
  ctx.fillText("WINDOW", winX + winW / 2 - 22, offsetY - 8);

  // 4. Door Entry & Swing Corridor (South Wall)
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
  ctx.strokeStyle = "#0b0f19";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(doorX, doorY);
  ctx.lineTo(doorX + doorW, doorY);
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.font = "10px Inter, sans-serif";
  ctx.fillText("DOOR ENTRY", doorX + 8, doorY + 18);

  // Category Color Map
  const catColors = {
    tables: { fill: "rgba(59, 130, 246, 0.28)", stroke: "#3b82f6" },
    seating: { fill: "rgba(16, 185, 129, 0.28)", stroke: "#10b981" },
    lighting: { fill: "rgba(236, 72, 153, 0.28)", stroke: "#ec4899" },
    storage: { fill: "rgba(245, 158, 11, 0.28)", stroke: "#f59e0b" },
    decor: { fill: "rgba(139, 92, 246, 0.28)", stroke: "#8b5cf6" }
  };

  // 5. Render Placed Furniture Rectangles
  placedItems.forEach((item) => {
    const ix = offsetX + (item.x || 0) * scale;
    const itemW = item.width_ft || 2.0;
    const itemD = item.depth_ft || 2.0;
    const iy = offsetY + (roomL - (item.y || 0) - itemD) * scale; // Invert Y for canvas
    const iw = itemW * scale;
    const id = itemD * scale;

    const cat = (item.category || "decor").toLowerCase();
    const style = catColors[cat] || catColors.decor;

    ctx.save();
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(ix, iy, iw, id, 5);
    ctx.fill();
    ctx.stroke();

    // Item label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Inter, sans-serif";
    const shortName = (item.name || item.item_id).split(" ").slice(0, 2).join(" ");
    ctx.fillText(shortName, ix + 6, iy + Math.min(id / 2, 16));

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "9px Inter, sans-serif";
    ctx.fillText(`${itemW}' × ${itemD}'`, ix + 6, iy + Math.min(id / 2 + 14, id - 6));

    ctx.restore();
  });
}

// Initial setup
applyPreset("ergonomic");
setTimeout(resizeCanvas, 100);
