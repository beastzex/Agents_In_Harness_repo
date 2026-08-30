import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, ShieldCheck, Wifi } from 'lucide-react';
import { AgentEvent, FurnitureItem, RoomSpec } from '../../types/studio';
import { agentSessionEmitter } from '../../services/mockEventEmitter';
import { ActivityFeed } from './ActivityFeed';
import { MoodBoard } from './MoodBoard';
import { ApprovalModal } from './ApprovalModal';
import { ReconnectToast } from './ReconnectToast';

interface StudioWorkspaceProps {
  roomSpec: RoomSpec;
  onBackToSetup: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  roomSpec,
  onBackToSetup,
}) => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [placedItems, setPlacedItems] = useState<FurnitureItem[]>([]);
  const [currentSpend, setCurrentSpend] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isHaltedForApproval, setIsHaltedForApproval] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'thoughts' | 'tools' | 'sandbox'>('all');

  // Start Agent Session on mount
  useEffect(() => {
    const unsubscribe = agentSessionEmitter.onEvent((event: AgentEvent) => {
      setEvents((prev) => [...prev, event]);

      if (event.type === 'moodboard_add' && event.meta?.item) {
        const newItem = event.meta.item;
        setPlacedItems((prev) => {
          if (prev.some((p) => p.id === newItem.id)) {
            return prev;
          }
          return [...prev, newItem];
        });
        setCurrentSpend((prev) => {
          return prev + (newItem.price || 0);
        });
      }

      if (event.type === 'sandbox_result' && (event.meta as any)?.placements) {
        const placementsList = (event.meta as any).placements as any[];
        if (Array.isArray(placementsList) && placementsList.length > 0) {
          const placementMap = new Map(
            placementsList.map((p) => [p.item_id || p.id, p])
          );
          setPlacedItems((prev) =>
            prev.map((item) => {
              const p = placementMap.get(item.id);
              if (p) {
                return {
                  ...item,
                  xFt: p.x,
                  yFt: p.y,
                  rotationDeg: p.rotation || 0,
                  widthFt: p.width_ft || item.widthFt,
                  depthFt: p.depth_ft || item.depthFt,
                };
              }
              return item;
            })
          );
        }
      }

      if (event.type === 'agent_halt_for_approval') {
        setIsHaltedForApproval(true);
        setIsStreaming(false);
        setIsModalOpen(true);
      }

      if (event.type === 'reconnect_notice') {
        setIsToastVisible(true);
      }
    });

    agentSessionEmitter.startSession(roomSpec);

    return () => {
      unsubscribe();
      agentSessionEmitter.stopSession();
    };
  }, [roomSpec]);

  const handleRestart = () => {
    setEvents([]);
    setPlacedItems([]);
    setCurrentSpend(0);
    setIsStreaming(true);
    setIsHaltedForApproval(false);
    setIsModalOpen(false);
    setIsApproved(false);
    agentSessionEmitter.startSession(roomSpec);
  };

  const handleFastTrack = () => {
    agentSessionEmitter.triggerFastTrack(roomSpec);
  };

  const handleSimulateDrop = () => {
    agentSessionEmitter.simulateNetworkDropAndReconnect();
  };

  const handleApprove = () => {
    setIsApproved(true);
    setIsHaltedForApproval(false);
    setIsModalOpen(false);
    agentSessionEmitter.approveCurrentSession();
  };

  const handleReject = () => {
    setIsModalOpen(false);
    agentSessionEmitter.rejectCurrentSession();
  };

  return (
    <div className="studio-workspace-container">
      {/* Top Status Bar */}
      <header className="workspace-top-bar">
        <div className="bar-left-cluster">
          <button type="button" className="btn-bar-nav" onClick={onBackToSetup}>
            <ArrowLeft size={16} />
            <span>Setup Screen</span>
          </button>

          <div className="bar-divider" />

          <div className="bar-brand">
            <span className="brand-primary">ReDessIo</span>
            <span className="brand-badge">STUDIO</span>
          </div>

          <div className="session-tag">
            <span>Room: {roomSpec.lengthFeet}' × {roomSpec.widthFeet}' {roomSpec.roomType.replace('-', ' ')}</span>
          </div>
        </div>

        <div className="bar-right-cluster">
          <button
            type="button"
            className="btn-toolbar-action"
            onClick={handleSimulateDrop}
            title="Simulate network disconnect and reconnect toast (B5)"
          >
            <Wifi size={14} />
            <span>Simulate Reconnect</span>
          </button>

          <button
            type="button"
            className="btn-toolbar-action"
            onClick={handleRestart}
            title="Restart Agent Session"
          >
            <RefreshCw size={14} />
            <span>Restart Session</span>
          </button>

          {isApproved ? (
            <div className="status-pill approved">
              <ShieldCheck size={14} />
              <span>ORDER COMMITTED &amp; APPROVED</span>
            </div>
          ) : isHaltedForApproval ? (
            <button
              type="button"
              className="status-pill approval-needed"
              onClick={() => setIsModalOpen(true)}
            >
              <ShieldCheck size={14} />
              <span>AWAITING SIGNATURE (${currentSpend.toLocaleString()})</span>
            </button>
          ) : (
            <div className="status-pill streaming">
              <span className="dot-live" />
              <span>AUTONOMOUS STREAM ACTIVE</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Split-Screen Workspace (B2 Activity Feed Left, B3 Mood Board Right) */}
      <main className="workspace-split-layout">
        {/* Left: Activity Feed (B2) */}
        <section className="split-col-feed">
          <ActivityFeed
            events={events}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            isStreaming={isStreaming}
            onFastTrack={isStreaming ? handleFastTrack : undefined}
          />
        </section>

        {/* Right: Mood Board & Budget (B3) */}
        <section className="split-col-board">
          <MoodBoard
            items={placedItems}
            roomSpec={roomSpec}
            currentSpend={currentSpend}
            onOpenApproval={() => setIsModalOpen(true)}
            isHaltedForApproval={isHaltedForApproval && !isApproved}
            onUpdateItems={setPlacedItems}
          />
        </section>
      </main>

      {/* B4: Approval Modal Gate */}
      <ApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        items={placedItems}
        roomSpec={roomSpec}
        currentSpend={currentSpend}
      />

      {/* B5: Reconnect Toast */}
      <ReconnectToast
        isVisible={isToastVisible}
        onDismiss={() => setIsToastVisible(false)}
      />
    </div>
  );
};
