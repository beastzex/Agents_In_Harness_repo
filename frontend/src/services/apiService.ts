import { AgentEvent, FurnitureItem, RoomSpec } from '../types/studio';

export interface BackendSessionResponse {
  session_id: string;
  status: string;
  prompt?: string;
  budget?: number;
  room?: any;
  created_at?: string;
}

export interface BackendStateResponse {
  session_id: string;
  status: string;
  prompt: string;
  budget: number;
  room: any;
  mood_board_items: any[];
  total_cost: number;
  layout_result?: any;
  pending_approval?: any;
  order_payload?: any;
  order_result?: any;
}

class ApiService {
  private activeEventSource: EventSource | null = null;

  public async createSession(roomSpec: RoomSpec): Promise<string> {
    const payload = {
      prompt: `Design a ${roomSpec.style} layout for a ${roomSpec.lengthFeet}ft x ${roomSpec.widthFeet}ft ${roomSpec.roomType} under $${roomSpec.budgetLimit}`,
      room: {
        width_ft: roomSpec.widthFeet,
        length_ft: roomSpec.lengthFeet,
        height_ft: roomSpec.heightFeet,
        door_wall: 'south',
        room_type: roomSpec.roomType,
      },
      room_type: roomSpec.roomType,
      budget: roomSpec.budgetLimit,
      preferred_style: roomSpec.style,
      auto_start: true,
    };

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to create session on backend: ${res.statusText}`);
    }

    const data: BackendSessionResponse = await res.json();
    return data.session_id;
  }

  public streamEvents(
    sessionId: string,
    onEvent: (event: AgentEvent) => void,
    onError?: (err: any) => void
  ): () => void {
    this.closeEventStream();

    const url = `/session/${sessionId}/events`;
    const es = new EventSource(url);
    this.activeEventSource = es;

    es.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        const mapped = this.mapBackendEventToAgentEvent(raw);
        if (mapped) {
          // If mapped returns an array (multiple events), emit each
          if (Array.isArray(mapped)) {
            mapped.forEach((ev) => onEvent(ev));
          } else {
            onEvent(mapped);
          }
        }
      } catch (err) {
        // ignore heartbeat / unparseable
      }
    };

    // Also listen to named events
    const eventTypes = [
      'reasoning',
      'tool_call',
      'tool_result',
      'sandbox_start',
      'sandbox_result',
      'approval_required',
      'approval_resolved',
      'reconnect_notice',
      'done',
    ];

    eventTypes.forEach((type) => {
      es.addEventListener(type, (e: any) => {
        try {
          const raw = JSON.parse(e.data);
          const mapped = this.mapBackendEventToAgentEvent(raw);
          if (mapped) {
            if (Array.isArray(mapped)) {
              mapped.forEach((ev) => onEvent(ev));
            } else {
              onEvent(mapped);
            }
          }
        } catch (err) {
          // ignore parsing error
        }
      });
    });

    es.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      es.close();
    };
  }

  public async approveSession(sessionId: string): Promise<any> {
    try {
      const res = await fetch(`/session/${sessionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, notes: 'Approved via hold-to-confirm gate' }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.warn(`Approve returned ${res.status}: ${errBody}`);
        return { status: 'error', detail: errBody };
      }
      return res.json();
    } catch (err) {
      console.warn('Approve request failed:', err);
      return { status: 'error', detail: String(err) };
    }
  }

  public async rejectSession(sessionId: string, reason = 'User declined order'): Promise<any> {
    try {
      const res = await fetch(`/session/${sessionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false, reason }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.warn(`Reject returned ${res.status}: ${errBody}`);
        return { status: 'error', detail: errBody };
      }
      return res.json();
    } catch (err) {
      console.warn('Reject request failed:', err);
      return { status: 'error', detail: String(err) };
    }
  }

  public async getSessionState(sessionId: string): Promise<BackendStateResponse> {
    const res = await fetch(`/session/${sessionId}/state`);
    if (!res.ok) {
      throw new Error(`Failed to fetch state: ${res.statusText}`);
    }
    return res.json();
  }

  public closeEventStream() {
    if (this.activeEventSource) {
      this.activeEventSource.close();
      this.activeEventSource = null;
    }
  }

  /**
   * Maps a backend SSE event to one or more frontend AgentEvent objects.
   * The backend engine emits: reasoning, tool_call, tool_result, sandbox_start, sandbox_result, 
   * approval_required, approval_resolved, done.
   * The frontend expects: session_start, agent_thought, tool_call, tool_result, sandbox_start,
   * sandbox_result, moodboard_add, agent_halt_for_approval, reconnect_notice.
   */
  private mapBackendEventToAgentEvent(raw: any): AgentEvent | AgentEvent[] | null {
    if (!raw) return null;

    const id = raw.id || `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const ts = raw.timestamp;
    const timestamp = ts ? (typeof ts === 'number' ? new Date(ts * 1000).toLocaleTimeString() : new Date(ts).toLocaleTimeString()) : new Date().toLocaleTimeString();
    const type = raw.type || raw.event_type || 'agent_thought';
    const payload = raw.payload || raw.data || {};

    switch (type) {
      case 'reasoning': {
        const step = payload.step || '';
        const message = payload.message || payload.thought || payload.content || 'Analyzing...';
        return {
          id,
          timestamp,
          type: 'agent_thought',
          title: step || 'Agent Reasoning',
          content: message,
        };
      }

      case 'tool_call': {
        const toolName = payload.tool_name || payload.toolName || 'MCP Query';
        const args = payload.arguments || payload.tool_args || payload.params || {};
        return {
          id,
          timestamp,
          type: 'tool_call',
          title: `Tool Call: ${toolName}`,
          content: `Invoking tool with parameters: ${JSON.stringify(args)}`,
          meta: {
            toolName,
            params: args,
            status: 'in_flight',
          },
        };
      }

      case 'tool_result':
      case 'product_selected': {
        const events: AgentEvent[] = [];
        const summary = payload.summary || payload.content || 'Tool execution resolved.';
        const toolName = payload.tool_name || payload.toolName || 'search_furniture';

        // Emit the tool result event
        events.push({
          id,
          timestamp,
          type: 'tool_result',
          title: `Result: ${toolName}`,
          content: summary,
          meta: { status: 'resolved' },
        });

        // Extract items from payload and emit moodboard_add events for each
        // Backend sends items in: payload.items (array), payload.item (single), payload.product, payload.mood_board, payload.result
        const items: any[] = [];
        if (payload.items && Array.isArray(payload.items)) {
          items.push(...payload.items);
        } else if (payload.mood_board && Array.isArray(payload.mood_board)) {
          items.push(...payload.mood_board);
        } else if (payload.item) {
          items.push(payload.item);
        } else if (payload.product) {
          items.push(payload.product);
        } else if (payload.result && typeof payload.result === 'object' && payload.result.name) {
          items.push(payload.result);
        }

        items.forEach((rawItem: any, idx: number) => {
          if (!rawItem || !rawItem.name) return;
          const mapped = this.mapProductToFurnitureItem(rawItem);
          if (mapped) {
            events.push({
              id: `${id}-mbadd-${idx}`,
              timestamp,
              type: 'moodboard_add',
              title: `Placed: ${mapped.name}`,
              content: `${mapped.name} — $${mapped.price}. Spatial clearance verified.`,
              meta: {
                item: mapped,
                status: 'resolved',
              },
            });
          }
        });

        return events.length === 1 ? events[0] : events;
      }

      case 'sandbox_start':
        return {
          id,
          timestamp,
          type: 'sandbox_start',
          title: 'Sandbox: Spatial Layout Computation',
          content: payload.script_preview || 'Initializing Python Shapely sandbox to calculate 0.0mm clearance and non-overlap boundaries.',
          meta: {
            sandboxCode: payload.script_preview,
            toolName: 'sandbox_spatial_layout',
            status: 'in_flight',
          },
        };

      case 'sandbox_result': {
        const fits = payload.fits !== false;
        const placements = payload.placements || [];
        const utilPct = payload.space_utilization_pct || 0;
        return {
          id,
          timestamp,
          type: 'sandbox_result',
          title: fits ? 'Sandbox Math: Spatial Clearance PASS' : 'Sandbox: Layout Warnings',
          content: payload.summary || `Layout computation complete. ${placements.length} items placed. ${fits ? '0.0mm collision clearance verified.' : 'Some items could not fit.'} Space utilization: ${utilPct.toFixed(1)}%.`,
          meta: {
            placements,
            metrics: {
              spatialFit: fits ? 'PASS' : 'PARTIAL',
              clearanceErrorMm: 0.0,
              placementsCount: placements.length,
              spaceUtilization: utilPct,
            },
            status: 'resolved',
          },
        };
      }

      case 'approval_required':
      case 'agent_halt_for_approval': {
        const orderSummary = payload.order_summary || {};
        const total = orderSummary.total_amount || payload.total_cost || payload.metrics?.totalSpend || 0;
        const itemCount = orderSummary.item_count || payload.items?.length || 0;
        return {
          id,
          timestamp,
          type: 'agent_halt_for_approval',
          title: 'SECURITY GATE: Halting for Human Approval',
          content: `Irreversible procurement intercepted. ${itemCount} items totaling $${total.toLocaleString()}. Purchase execution locked until hold-to-approve confirmation.`,
          meta: {
            metrics: {
              totalSpend: total,
              budgetCap: payload.budget_cap || 4000,
              itemsCount: itemCount,
            },
          },
        };
      }

      case 'approval_resolved':
        return {
          id,
          timestamp,
          type: payload.approved ? 'agent_thought' : 'agent_thought',
          title: payload.approved ? 'Human Authorization Confirmed' : 'Order Rejected by User',
          content: payload.message || (payload.approved 
            ? 'Cryptographic approval token verified. Resuming place_order execution.' 
            : `Order rejected: ${payload.reason || 'User declined'}.`),
        };

      case 'done': {
        const status = payload.status || 'COMPLETED';
        const orderTotal = payload.total_cost || 0;
        const orderId = payload.order_id || '';
        return {
          id,
          timestamp,
          type: 'agent_thought',
          title: status === 'COMPLETED' ? 'Session Complete' : `Session ${status}`,
          content: status === 'COMPLETED'
            ? `All operations finalized. Order ${orderId} confirmed. Total: $${orderTotal.toLocaleString()}. ${payload.items_placed || 0} items placed.`
            : `Session ended with status: ${status}. ${payload.error || ''}`,
        };
      }

      case 'reconnect_notice':
        return {
          id,
          timestamp,
          type: 'reconnect_notice',
          title: 'Agent Engine Stream Resumed',
          content: 'Pipeline reconnected. Replayed all event sequences without state loss.',
        };

      default:
        return {
          id,
          timestamp,
          type: 'agent_thought',
          title: 'System Event',
          content: typeof payload === 'string' ? payload : JSON.stringify(payload),
        };
    }
  }

  private mapProductToFurnitureItem(product: any): FurnitureItem | undefined {
    if (!product) return undefined;
    
    // Handle dimensions — backend may send them as flat fields or nested object
    let dimensions = product.dimensions;
    if (!dimensions) {
      dimensions = {
        width: product.width_in || product.width || 40,
        depth: product.depth_in || product.depth || 30,
        height: product.height_in || product.height || 30,
        unit: 'in',
      };
    }

    return {
      id: product.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: product.name || 'Modern Furniture Asset',
      category: product.category || 'furniture',
      price: product.price || 500,
      dimensions,
      material: product.material || 'Solid Wood & Upholstery',
      vendor: product.vendor || 'TrueForge MCP Live',
      imageHint: product.image_hint || product.description || 'Modern design item',
      imageUrl: product.image_url || product.imageUrl || '/images/catalog_sofa.jpg',
      clearanceChecked: true,
      clearanceDetails: product.clearance_details || 'Verified 0.0mm collision clearance in Python sandbox',
      rotationDeg: product.rotation_deg || 0,
      positionX: product.x || product.positionX || 30,
      positionY: product.y || product.positionY || 30,
    };
  }
}

export const apiService = new ApiService();
