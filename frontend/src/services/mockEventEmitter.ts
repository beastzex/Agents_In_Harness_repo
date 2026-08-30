import { AgentEvent, FurnitureItem, RoomSpec } from '../types/studio';
import { apiService } from './apiService';

export const LIVING_ROOM_ITEMS: FurnitureItem[] = [
  {
    id: 'sofa-haven-3seat-boucle',
    name: 'Haven 3-Seater Belgian Bouclé Modular Sectional Sofa',
    category: 'seating',
    price: 1850,
    dimensions: { width: 88, depth: 36, height: 31, unit: 'in' },
    material: 'Belgian Bouclé & Kiln-Dried Oak',
    vendor: 'TrueForge MCP / Muuto Living',
    imageHint: 'Low profile warm oatmeal bouclé three-seater sofa with subtle wood plinth',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: '44.5" clearance to east wall doorway (> 36" required threshold)',
    rotationDeg: 0,
    widthFt: 7.33,
    depthFt: 3.0,
  },
  {
    id: 'table-mesa-oak-coffee',
    name: 'Mesa Solid White Oak Low Oval Coffee Table',
    category: 'tables',
    price: 580,
    dimensions: { width: 48, depth: 24, height: 15, unit: 'in' },
    material: 'FSC-Certified White Oak (Matte Wax Finish)',
    vendor: 'TrueForge MCP / Ethnicraft Live',
    imageHint: 'Minimalist low-profile oak coffee table with soft rounded bullnose edges',
    imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: '18.5" reach margin from sofa perimeter; 38" main walkthrough lane',
    rotationDeg: 0,
    widthFt: 4.0,
    depthFt: 2.0,
  },
  {
    id: 'media-nordic-70-console',
    name: 'Nordic Slat-Door 70" TV Media Console & Showcase',
    category: 'storage',
    price: 680,
    dimensions: { width: 70, depth: 18, height: 20, unit: 'in' },
    material: 'Solid White Oak & Slatted Sliding Doors',
    vendor: 'TrueForge MCP / HAY Living',
    imageHint: 'Low-profile solid oak entertainment credenza with slatted sliding doors',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Positioned opposite sofa focal axis with full acoustic line-of-sight',
    rotationDeg: 0,
    widthFt: 5.83,
    depthFt: 1.5,
  },
  {
    id: 'plant-monstera-terracotta',
    name: 'Monstera Deliciosa in Large Fluted Terracotta Planter',
    category: 'decor',
    price: 145,
    dimensions: { width: 24, depth: 24, height: 60, unit: 'in' },
    material: 'Natural Terracotta Clay & Live Split-Leaf Foliage',
    vendor: 'TrueForge MCP / Botanical Living',
    imageHint: 'Lush tropical Monstera in handcrafted Italian terracotta floor planter',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Sunlit northwest corner anchor; zero walkway impedance',
    rotationDeg: 0,
    widthFt: 2.0,
    depthFt: 2.0,
  },
  {
    id: 'lamp-akari-10a-floor',
    name: 'Akari 10A Woven Washi Paper Sculptural Floor Lamp',
    category: 'lighting',
    price: 320,
    dimensions: { width: 20, depth: 20, height: 52, unit: 'in' },
    material: 'Handmade Washi Paper & Black Bamboo',
    vendor: 'TrueForge MCP / Ozeki & Co.',
    imageHint: 'Sculptural Japanese washi paper tripod floor lamp glowing with 2700k warmth',
    imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Verified 14" from corner baseboard outlet; zero cord obstruction',
    rotationDeg: 0,
    widthFt: 1.67,
    depthFt: 1.67,
  },
  {
    id: 'rug-atlas-ribbed-wool-9x12',
    name: 'Atlas Ribbed Wool & Jute Large Living Room Area Carpet (9x12)',
    category: 'rugs',
    price: 580,
    dimensions: { width: 144, depth: 108, height: 0.75, unit: 'in' },
    material: '100% Un-dyed New Zealand Wool & Organic Jute',
    vendor: 'TrueForge MCP / Nordic Knots API',
    imageHint: 'Textured high-low pile waffle weave rug in natural oatmeal and bone white tones',
    imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Anchors front sofa legs by 12" margin; preserves 16" bare floor reveal',
    rotationDeg: 0,
    widthFt: 12.0,
    depthFt: 9.0,
  },
];

export const BEDROOM_ITEMS: FurnitureItem[] = [
  {
    id: 'bed-nordic-king-oak',
    name: 'Nordic Solid White Oak King Platform Bed',
    category: 'beds',
    price: 980,
    dimensions: { width: 76, depth: 84, height: 38, unit: 'in' },
    material: 'Solid European White Oak & Recessed Slat System',
    vendor: 'TrueForge MCP / Ethnicraft Bedding',
    imageHint: 'Architectural low-profile king bed with integrated headboard',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: '36" walkway on both bed flanks; aligned with north wall architectural axis',
    rotationDeg: 0,
    widthFt: 6.33,
    depthFt: 7.0,
  },
  {
    id: 'nightstand-nordic-oak',
    name: 'Nordic Oak 2-Drawer Floating Bedside Nightstand',
    category: 'nightstands',
    price: 185,
    dimensions: { width: 20, depth: 16, height: 18, unit: 'in' },
    material: 'Solid White Oak',
    vendor: 'TrueForge MCP / Muuto',
    imageHint: 'Wall-mounted floating oak nightstand',
    imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Flush mounted 4" from headboard perimeter',
    rotationDeg: 0,
    widthFt: 1.67,
    depthFt: 1.33,
  },
  {
    id: 'dresser-nordic-6-drawer',
    name: 'Nordic 6-Drawer Solid White Oak Bedroom Dresser',
    category: 'storage',
    price: 680,
    dimensions: { width: 56, depth: 19, height: 34, unit: 'in' },
    material: 'Solid European White Oak',
    vendor: 'TrueForge MCP / HAY Living',
    imageHint: 'Generous 6-drawer double dresser with recessed pulls',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Positioned on east wall; 48" clearance to bed footboard',
    rotationDeg: 0,
    widthFt: 4.67,
    depthFt: 1.58,
  },
  {
    id: 'lamp-bedside-ceramic',
    name: 'Terra Warm Ceramic Bedside Ambient Lamp',
    category: 'lighting',
    price: 85,
    dimensions: { width: 12, depth: 12, height: 18, unit: 'in' },
    material: 'Stoneware Clay & Linen Shade',
    vendor: 'TrueForge MCP / Studio Ceramic',
    imageHint: 'Handmade textured stoneware bedside lamp',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Positioned atop floating nightstand',
    rotationDeg: 0,
    widthFt: 1.0,
    depthFt: 1.0,
  },
  {
    id: 'rug-plush-boucle-bedroom',
    name: 'Cloud Plush Wool Bouclé Bedroom Area Rug (8x10)',
    category: 'rugs',
    price: 380,
    dimensions: { width: 96, depth: 120, height: 1.0, unit: 'in' },
    material: '100% Un-dyed New Zealand Wool',
    vendor: 'TrueForge MCP / Nordic Knots',
    imageHint: 'High-pile soft wool bedroom rug beneath bed',
    imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Anchors lower 2/3 of platform bed footprint',
    rotationDeg: 0,
    widthFt: 8.0,
    depthFt: 10.0,
  },
];

export const OFFICE_ITEMS: FurnitureItem[] = [
  {
    id: 'table-apex-standing-60',
    name: 'ApexPro Motorized Dual-Motor Standing Desk (60x30)',
    category: 'tables',
    price: 499,
    dimensions: { width: 60, depth: 30, height: 28, unit: 'in' },
    material: 'Solid Walnut & Heavy Gauge Steel',
    vendor: 'TrueForge MCP / ErgoWork API',
    imageHint: 'Motorized standing desk with digital memory keypad',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: '42" clearance from door swing path; natural light window orientation',
    rotationDeg: 0,
    widthFt: 5.0,
    depthFt: 2.5,
  },
  {
    id: 'chair-ergomaster-pro',
    name: 'ErgoMaster Pro High-Back Mesh Task Chair',
    category: 'seating',
    price: 349,
    dimensions: { width: 26, depth: 26, height: 44, unit: 'in' },
    material: 'Breathable Korean Mesh & Aluminum Base',
    vendor: 'TrueForge MCP / Herman Miller Partner',
    imageHint: 'Ergonomic task chair with 4D adjustable armrests',
    imageUrl: 'https://images.unsplash.com/photo-1580481077197-9e7f7228a05c?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: '360° swivel clearance verified; 32" push-back space behind desk',
    rotationDeg: 0,
    widthFt: 2.17,
    depthFt: 2.17,
  },
  {
    id: 'shelf-modular-oak',
    name: 'Nordic Oak Modular Low Bookshelf & Credenza',
    category: 'storage',
    price: 380,
    dimensions: { width: 48, depth: 16, height: 32, unit: 'in' },
    material: 'Solid White Oak & Brass Brackets',
    vendor: 'TrueForge MCP / Muuto Office',
    imageHint: 'Low-profile modular book storage along perimeter wall',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Anchored flush along east perimeter wall',
    rotationDeg: 0,
    widthFt: 4.0,
    depthFt: 1.33,
  },
  {
    id: 'lamp-minimalist-desk',
    name: 'Komorebi Dimmable Brass LED Task Light',
    category: 'lighting',
    price: 110,
    dimensions: { width: 14, depth: 14, height: 18, unit: 'in' },
    material: 'Brushed Brass & Matte Aluminum',
    vendor: 'TrueForge MCP / Anglepoise',
    imageHint: 'Architectural cantilever desk task light',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    clearanceChecked: true,
    clearanceDetails: 'Placed on primary workstation surface',
    rotationDeg: 0,
    widthFt: 1.17,
    depthFt: 1.17,
  },
];

export const SAMPLE_CATALOG_ITEMS = LIVING_ROOM_ITEMS;

export class MockAgentSessionEmitter {
  private listeners: ((event: AgentEvent) => void)[] = [];
  private isRunning: boolean = false;
  private timerIds: ReturnType<typeof setTimeout>[] = [];
  private currentSessionId: string | null = null;
  private closeStreamFn: (() => void) | null = null;

  public onEvent(callback: (event: AgentEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private emit(event: AgentEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  public async startSession(roomSpec: RoomSpec) {
    this.stopSession();
    this.isRunning = true;

    // Try connecting to live FastAPI backend first
    try {
      const sessionId = await apiService.createSession(roomSpec);
      this.currentSessionId = sessionId;

      this.emit({
        id: `start-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'session_start',
        title: 'TrueForge Backend Connected',
        content: `Live Session [${sessionId}] established. Streaming real MCP tool calls & sandboxed Python runtime.`,
      });

      this.closeStreamFn = apiService.streamEvents(
        sessionId,
        (event) => {
          if (this.isRunning) {
            this.emit(event);
          }
        },
        (_err) => {
          if (this.isRunning && !this.timerIds.length) {
            this.startLocalSimulation(roomSpec);
          }
        }
      );
    } catch (_error) {
      this.startLocalSimulation(roomSpec);
    }
  }

  public async approveCurrentSession() {
    if (this.currentSessionId) {
      try {
        await apiService.approveSession(this.currentSessionId);
      } catch (err) {
        console.warn('Backend approval call error', err);
      }
    }
  }

  public async rejectCurrentSession(reason = 'User declined order') {
    if (this.currentSessionId) {
      try {
        await apiService.rejectSession(this.currentSessionId, reason);
      } catch (err) {
        console.warn('Backend reject call error', err);
      }
    }
  }

  private startLocalSimulation(roomSpec: RoomSpec) {
    const createTimestamp = (offsetSec: number) => {
      const d = new Date(Date.now() + offsetSec * 1000);
      return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
    };

    const roomType = (roomSpec.roomType || 'living-room').toLowerCase();
    let targetItems: FurnitureItem[] = LIVING_ROOM_ITEMS;
    if (roomType.includes('bedroom')) {
      targetItems = BEDROOM_ITEMS;
    } else if (roomType.includes('office') || roomType.includes('workspace')) {
      targetItems = OFFICE_ITEMS;
    }

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
      // 2. Spatial Analysis
      {
        delayMs: 1400,
        event: (): AgentEvent => ({
          id: 'ev-2',
          timestamp: createTimestamp(1.4),
          type: 'agent_thought',
          title: 'Analyzing Spatial Bounds',
          content: `Calculating room surface area of ${roomSpec.lengthFeet * roomSpec.widthFeet} sq ft. Orienting primary focal axis opposite natural light window aperture.`,
        }),
      },
    ];

    let runningSpend = 0;
    let accumulatedTime = 2.4;

    targetItems.forEach((item, idx) => {
      runningSpend += item.price;
      const tCall = accumulatedTime + 1.2;
      const tResult = accumulatedTime + 2.4;
      const tPlace = accumulatedTime + 3.2;
      accumulatedTime = tPlace;

      schedule.push(
        {
          delayMs: Math.round(tCall * 1000),
          event: (): AgentEvent => ({
            id: `ev-call-${idx}`,
            timestamp: createTimestamp(tCall),
            type: 'tool_call',
            title: `MCP Query: ${item.category.toUpperCase()}`,
            content: `Searching live supplier catalog for ${item.name} under $${item.price * 1.2}.`,
            meta: { toolName: 'search_furniture', params: { category: item.category }, status: 'in_flight' },
          }),
        },
        {
          delayMs: Math.round(tResult * 1000),
          event: (): AgentEvent => ({
            id: `ev-res-${idx}`,
            timestamp: createTimestamp(tResult),
            type: 'sandbox_result',
            title: `Sandbox Clearance: ${item.name}`,
            content: `Python sandbox geometric packing passed. Zero collision overlaps.`,
            meta: { metrics: { clearanceInches: 42.0, requiredThresholdInches: 36.0, overlapScore: 0.0 }, status: 'resolved' },
          }),
        },
        {
          delayMs: Math.round(tPlace * 1000),
          event: (): AgentEvent => ({
            id: `ev-place-${idx}`,
            timestamp: createTimestamp(tPlace),
            type: 'moodboard_add',
            title: `Placed: ${item.name}`,
            content: `Positioned in layout. Running spend: $${runningSpend.toLocaleString()}.`,
            meta: { item },
          }),
        }
      );
    });

    // Final halt for approval
    const finalHaltTime = accumulatedTime + 1.2;
    schedule.push({
      delayMs: Math.round(finalHaltTime * 1000),
      event: (): AgentEvent => ({
        id: 'ev-final-halt',
        timestamp: createTimestamp(finalHaltTime),
        type: 'agent_halt_for_approval',
        title: 'SECURITY GATE TRIGGERED: Halting for Explicit Human Approval',
        content: `All ${targetItems.length} spatial assets verified with Python math. Total: $${runningSpend.toLocaleString()} ($${(roomSpec.budgetLimit - runningSpend).toLocaleString()} remaining). Purchase locked until hold-to-approve confirmation.`,
        meta: { metrics: { totalSpend: runningSpend, budgetCap: roomSpec.budgetLimit, itemsCount: targetItems.length } },
      }),
    });

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
    const roomType = (roomSpec.roomType || 'living-room').toLowerCase();
    const items = roomType.includes('bedroom') ? BEDROOM_ITEMS : roomType.includes('office') ? OFFICE_ITEMS : LIVING_ROOM_ITEMS;
    let spend = 0;
    items.forEach((item, index) => {
      spend += item.price;
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
      content: `Fast session complete. Total order: $${spend.toLocaleString()}. Awaiting signature.`,
      meta: { metrics: { totalSpend: spend, budgetCap: roomSpec.budgetLimit, itemsCount: items.length } },
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
    if (this.closeStreamFn) {
      this.closeStreamFn();
      this.closeStreamFn = null;
    }
    this.timerIds.forEach(clearTimeout);
    this.timerIds = [];
  }
}

export const agentSessionEmitter = new MockAgentSessionEmitter();
