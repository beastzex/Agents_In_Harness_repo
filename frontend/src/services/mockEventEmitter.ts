import { AgentEvent, FurnitureItem, RoomSpec } from '../types/studio';

export const SAMPLE_CATALOG_ITEMS: FurnitureItem[] = [
  {
    id: 'item-sofa-01',
    name: 'Klint Modular 3-Seat Sectional',
    category: 'seating',
    price: 1850,
    dimensions: { width: 88, depth: 36, height: 31, unit: 'in' },
    material: 'Belgian Bouclé & Kiln-Dried Oak',
    vendor: 'TrueForge MCP / Muuto Catalog',
    imageHint: 'Low profile warm oatmeal bouclé three-seater sofa with subtle wood plinth',
    imageUrl: '/images/catalog_sofa.jpg',
    clearanceChecked: true,
    clearanceDetails: '44.5" clearance to east wall doorway (> 36" required threshold)',
    rotationDeg: -1.5,
    positionX: 20,
    positionY: 28,
  },
  {
    id: 'item-lamp-02',
    name: 'Akari 10A Woven Floor Light',
    category: 'lighting',
    price: 320,
    dimensions: { width: 21, depth: 21, height: 48, unit: 'in' },
    material: 'Handmade Washi Paper & Black Bamboo',
    vendor: 'TrueForge MCP / Ozeki & Co.',
    imageHint: 'Sculptural Japanese washi paper tripod floor lamp glowing with 2700k warmth',
    imageUrl: '/images/catalog_lamp.jpg',
    clearanceChecked: true,
    clearanceDetails: 'Verified 14" from corner baseboard outlet; zero cord obstruction',
    rotationDeg: 2.2,
    positionX: 72,
    positionY: 18,
  },
  {
    id: 'item-table-03',
    name: 'Mesa Solid White Oak Low Coffee Table',
    category: 'tables',
    price: 640,
    dimensions: { width: 48, depth: 24, height: 15, unit: 'in' },
    material: 'FSC-Certified White Oak (Matte Wax Finish)',
    vendor: 'TrueForge MCP / Ethnicraft Live',
    imageHint: 'Minimalist low-profile oak coffee table with soft rounded bullnose edges',
    imageUrl: '/images/catalog_table.jpg',
    clearanceChecked: true,
    clearanceDetails: '18.5" reach margin from sofa perimeter; 38" main walkthrough lane',
    rotationDeg: -0.8,
    positionX: 28,
    positionY: 62,
  },
  {
    id: 'item-rug-04',
    name: 'Atlas Textured Wool & Jute Area Rug (8x10)',
    category: 'rugs',
    price: 580,
    dimensions: { width: 120, depth: 96, height: 0.75, unit: 'in' },
    material: '100% Un-dyed New Zealand Wool & Organic Jute',
    vendor: 'TrueForge MCP / Nordic Knots API',
    imageHint: 'Textured high-low pile waffle weave rug in natural oatmeal and bone white tones',
    imageUrl: '/images/four_moves_search.jpg',
    clearanceChecked: true,
    clearanceDetails: 'Anchors front sofa legs by 12" margin; preserves 16" bare floor reveal',
    rotationDeg: 0.5,
    positionX: 45,
    positionY: 40,
  },
];

export class MockAgentSessionEmitter {
  private listeners: ((event: AgentEvent) => void)[] = [];
  private isRunning: boolean = false;
  private timerIds: ReturnType<typeof setTimeout>[] = [];

  public onEvent(callback: (event: AgentEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private emit(event: AgentEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  public startSession(roomSpec: RoomSpec) {
    this.stopSession();
    this.isRunning = true;

    const createTimestamp = (offsetSec: number) => {
      const d = new Date(Date.now() + offsetSec * 1000);
      return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
    };

    const schedule = [
      // 1. Session start
      {
        delayMs: 300,
        event: (): AgentEvent => ({
          id: 'ev-1',
          timestamp: createTimestamp(0),
          type: 'session_start',
          title: 'Session Initialized',
          content: `Ingested ${roomSpec.lengthFeet}' × ${roomSpec.widthFeet}' ${roomSpec.roomType.replace('-', ' ')} with $${roomSpec.budgetLimit.toLocaleString()} hard budget ceiling. Style: ${roomSpec.style}.`,
        }),
      },
      // 2. Agent Thought 1
      {
        delayMs: 1400,
        event: (): AgentEvent => ({
          id: 'ev-2',
          timestamp: createTimestamp(1.4),
          type: 'agent_thought',
          title: 'Analyzing Spatial Bounds',
          content: `Calculating room surface area of ${roomSpec.lengthFeet * roomSpec.widthFeet} sq ft. Orienting primary seating anchor opposite main natural light window aperture.`,
        }),
      },
      // 3. Tool Call 1 (Catalog search)
      {
        delayMs: 2800,
        event: (): AgentEvent => ({
          id: 'ev-3',
          timestamp: createTimestamp(2.8),
          type: 'tool_call',
          title: 'MCP Catalog Query',
          content: 'Querying live furniture inventory for Belgian bouclé modular seating under $2,200.',
          meta: {
            toolName: 'mcp_furniture_catalog_search',
            params: { category: 'seating', style: 'warm-minimalist', max_price: 2200, depth_max_in: 38 },
            status: 'in_flight',
          },
        }),
      },
      // 4. Tool Result 1
      {
        delayMs: 4400,
        event: (): AgentEvent => ({
          id: 'ev-4',
          timestamp: createTimestamp(4.4),
          type: 'tool_result',
          title: 'MCP Match: Klint Modular Sectional',
          content: 'Matched SKU #MUUTO-KL-8836 ($1,850). In stock (14 units). Dimensions: 88"W × 36"D × 31"H.',
          meta: {
            toolName: 'mcp_furniture_catalog_search',
            item: SAMPLE_CATALOG_ITEMS[0],
            status: 'resolved',
          },
        }),
      },
      // 5. Sandbox Start 1
      {
        delayMs: 5600,
        event: (): AgentEvent => ({
          id: 'ev-5',
          timestamp: createTimestamp(5.6),
          type: 'sandbox_start',
          title: 'Spawning Python Sandbox',
          content: 'Executing layout constraint solver in isolated container to calculate door swing arcs & traffic clearances.',
          meta: {
            sandboxCode: `import spatial_solver as ss\nroom = ss.Room(l=${roomSpec.lengthFeet * 12}, w=${roomSpec.widthFeet * 12})\nsofa = ss.BoundingBox(88, 36, pos=(24, 36))\nclearance = room.check_clearance(sofa, min_walkway=36)\nassert clearance.is_valid, "Collision error"`,
            status: 'in_flight',
          },
        }),
      },
      // 6. Sandbox Result 1
      {
        delayMs: 7100,
        event: (): AgentEvent => ({
          id: 'ev-6',
          timestamp: createTimestamp(7.1),
          type: 'sandbox_result',
          title: 'Sandbox Physics: PASS',
          content: 'Constraint check verified: 44.5" clearance to doorway preserved (>36" standard). Zero bounding-box intersections.',
          meta: {
            metrics: { walkwayClearanceInches: 44.5, doorSwingArcConflict: false, executionTimeMs: 142 },
            status: 'resolved',
          },
        }),
      },
      // 7. Mood Board Add 1
      {
        delayMs: 8200,
        event: (): AgentEvent => ({
          id: 'ev-7',
          timestamp: createTimestamp(8.2),
          type: 'moodboard_add',
          title: 'Placed: Klint Modular 3-Seat Sectional',
          content: 'Added primary seating anchor to board. Running spend: $1,850.',
          meta: {
            item: SAMPLE_CATALOG_ITEMS[0],
          },
        }),
      },
      // 8. Agent Thought 2
      {
        delayMs: 9800,
        event: (): AgentEvent => ({
          id: 'ev-8',
          timestamp: createTimestamp(9.8),
          type: 'agent_thought',
          title: 'Diffuse Lighting Pairing',
          content: 'Seating footprint established. Now sourcing sculptural ambient lighting (2700K temperature) to soften northeast corner shadows.',
        }),
      },
      // 9. Tool Call 2
      {
        delayMs: 11200,
        event: (): AgentEvent => ({
          id: 'ev-9',
          timestamp: createTimestamp(11.2),
          type: 'tool_call',
          title: 'MCP Catalog Query',
          content: 'Searching authentic Washi paper floor lamps with compact tripod footprint under $450.',
          meta: {
            toolName: 'mcp_lighting_lookup',
            params: { style: 'japandi-sculptural', max_price: 450, socket_type: 'E26' },
            status: 'in_flight',
          },
        }),
      },
      // 10. Tool Result 2 & Moodboard Add 2
      {
        delayMs: 12800,
        event: (): AgentEvent => ({
          id: 'ev-10',
          timestamp: createTimestamp(12.8),
          type: 'tool_result',
          title: 'MCP Match: Akari 10A Floor Light',
          content: 'Found Akari 10A ($320). 21"W × 48"H. Stock verified at distributor warehouse.',
          meta: {
            item: SAMPLE_CATALOG_ITEMS[1],
            status: 'resolved',
          },
        }),
      },
      {
        delayMs: 13900,
        event: (): AgentEvent => ({
          id: 'ev-11',
          timestamp: createTimestamp(13.9),
          type: 'moodboard_add',
          title: 'Placed: Akari 10A Woven Floor Light',
          content: 'Positioned in corner reading nook. Running spend: $2,170.',
          meta: {
            item: SAMPLE_CATALOG_ITEMS[1],
          },
        }),
      },
      // 11. Tool Call 3 & Table Math
      {
        delayMs: 15400,
        event: (): AgentEvent => ({
          id: 'ev-12',
          timestamp: createTimestamp(15.4),
          type: 'tool_call',
          title: 'MCP Catalog Query',
          content: 'Querying low solid oak coffee tables under $800 with rounded corners.',
          meta: {
            toolName: 'mcp_tables_search',
            params: { material: 'white_oak', max_height_in: 16 },
            status: 'in_flight',
          },
        }),
      },
      {
        delayMs: 17000,
        event: (): AgentEvent => ({
          id: 'ev-13',
          timestamp: createTimestamp(17.0),
          type: 'sandbox_result',
          title: 'Sandbox Physics: Coffee Table Clearance PASS',
          content: 'Verified 18.5" knee-reach clearance from sofa seat edge, 38" main perimeter pathway.',
          meta: {
            metrics: { reachDistanceInches: 18.5, perimeterPathwayInches: 38 },
            status: 'resolved',
          },
        }),
      },
      {
        delayMs: 18100,
        event: (): AgentEvent => ({
          id: 'ev-14',
          timestamp: createTimestamp(18.1),
          type: 'moodboard_add',
          title: 'Placed: Mesa Solid White Oak Coffee Table',
          content: 'Central coffee table locked into layout. Running spend: $2,810.',
          meta: {
            item: SAMPLE_CATALOG_ITEMS[2],
          },
        }),
      },
      // 12. Rug Placement & Final Spend
      {
        delayMs: 19600,
        event: (): AgentEvent => ({
          id: 'ev-15',
          timestamp: createTimestamp(19.6),
          type: 'moodboard_add',
          title: 'Placed: Atlas Textured Wool & Jute Area Rug',
          content: '8ft x 10ft foundational wool rug placed beneath front legs. Running spend: $3,390.',
          meta: {
            item: SAMPLE_CATALOG_ITEMS[3],
          },
        }),
      },
      // 13. HALT FOR APPROVAL (B4 Gate)
      {
        delayMs: 21200,
        event: (): AgentEvent => ({
          id: 'ev-16',
          timestamp: createTimestamp(21.2),
          type: 'agent_halt_for_approval',
          title: 'SECURITY GATE TRIGGERED: Halting for Explicit Human Approval',
          content: `All 4 catalog assets verified with spatial math. Total order: $3,390 ($610 remaining under $${roomSpec.budgetLimit.toLocaleString()} ceiling). Purchase execution locked until hold-to-approve confirmation.`,
          meta: {
            metrics: { totalSpend: 3390, budgetCap: roomSpec.budgetLimit, itemsCount: 4 },
          },
        }),
      },
    ];

    schedule.forEach(({ delayMs, event }) => {
      const timerId = setTimeout(() => {
        if (this.isRunning) {
          this.emit(event());
        }
      }, delayMs);
      this.timerIds.push(timerId);
    });
  }

  public triggerFastTrack(roomSpec: RoomSpec) {
    this.stopSession();
    this.isRunning = true;
    SAMPLE_CATALOG_ITEMS.forEach((item, index) => {
      this.emit({
        id: `fast-${index}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'moodboard_add',
        title: `Placed: ${item.name}`,
        content: `Fast-tracked placement. $${item.price}.`,
        meta: { item },
      });
    });
    this.emit({
      id: 'fast-halt',
      timestamp: new Date().toLocaleTimeString(),
      type: 'agent_halt_for_approval',
      title: 'SECURITY GATE TRIGGERED: Halting for Explicit Human Approval',
      content: `Fast session complete. Total order: $3,390. Awaiting signature.`,
      meta: { metrics: { totalSpend: 3390, budgetCap: roomSpec.budgetLimit, itemsCount: 4 } },
    });
  }

  public simulateNetworkDropAndReconnect() {
    this.emit({
      id: `reconnect-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'reconnect_notice',
      title: 'TrueForge Agent Engine Reconnected',
      content: 'Live WebSocket pipeline re-established. Stream resumed.',
    });
  }

  public stopSession() {
    this.isRunning = false;
    this.timerIds.forEach(clearTimeout);
    this.timerIds = [];
  }
}

export const agentSessionEmitter = new MockAgentSessionEmitter();
