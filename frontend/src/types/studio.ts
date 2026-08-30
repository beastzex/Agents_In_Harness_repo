export type RoomStyle = 'warm-minimalist' | 'japandi' | 'mid-century' | 'organic-modern';
export type RoomType = 'living-room' | 'bedroom' | 'home-office' | 'dining-room';

export interface RoomSpec {
  lengthFeet: number;
  widthFeet: number;
  heightFeet: number;
  budgetLimit: number;
  style: RoomStyle;
  roomType: RoomType;
  beforePhotoUrl?: string;
  specialRequests?: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: 'seating' | 'lighting' | 'tables' | 'rugs' | 'decor' | 'storage';
  price: number;
  dimensions: {
    width: number;
    depth: number;
    height: number;
    unit: 'in' | 'cm';
  };
  material: string;
  vendor: string;
  imageHint: string;
  imageUrl?: string;
  clearanceChecked: boolean;
  clearanceDetails: string;
  rotationDeg?: number;
  positionX?: number; // percentage on canvas
  positionY?: number; // percentage on canvas
}

export type AgentEventType = 
  | 'session_start'
  | 'agent_thought'
  | 'tool_call'
  | 'tool_result'
  | 'sandbox_start'
  | 'sandbox_result'
  | 'moodboard_add'
  | 'budget_update'
  | 'agent_halt_for_approval'
  | 'agent_approved'
  | 'agent_rejected'
  | 'reconnect_notice';

export interface AgentEvent {
  id: string;
  timestamp: string;
  type: AgentEventType;
  title: string;
  content: string;
  meta?: {
    toolName?: string;
    params?: Record<string, any>;
    sandboxCode?: string;
    metrics?: Record<string, any>;
    item?: FurnitureItem;
    status?: 'in_flight' | 'resolved' | 'failed';
    durationMs?: number;
  };
}

export interface StudioSessionState {
  roomSpec: RoomSpec;
  events: AgentEvent[];
  placedItems: FurnitureItem[];
  currentSpend: number;
  isStreaming: boolean;
  isHaltedForApproval: boolean;
  isApproved: boolean;
  isRejected: boolean;
  approvalCompletedAt?: string;
  activeFilter: 'all' | 'thoughts' | 'tools' | 'sandbox';
}
