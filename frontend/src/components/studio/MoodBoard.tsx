import React, { useEffect, useRef, useState } from 'react';
import { Layers, CheckCircle2, ShieldCheck, Ruler, Sparkles, Tag, Compass, LayoutGrid } from 'lucide-react';
import gsap from 'gsap';
import { FurnitureItem, RoomSpec } from '../../types/studio';
import { BudgetTracker } from './BudgetTracker';
import { ArchitecturalPlanView } from './ArchitecturalPlanView';

interface MoodBoardProps {
  items: FurnitureItem[];
  roomSpec: RoomSpec;
  currentSpend: number;
  onOpenApproval: () => void;
  isHaltedForApproval: boolean;
  onUpdateItems?: (items: FurnitureItem[]) => void;
}

export const MoodBoard: React.FC<MoodBoardProps> = ({
  items,
  roomSpec,
  currentSpend,
  onOpenApproval,
  isHaltedForApproval,
  onUpdateItems,
}) => {
  const [activeTab, setActiveTab] = useState<'cad' | 'grid' | 'gallery'>('cad');
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Animate newly placed items: scale 0.8 -> 1 + fade + slight rotation settle like laying a physical photo down
  useEffect(() => {
    if (items.length > 0) {
      const latestItem = items[items.length - 1];
      const el = cardRefs.current[latestItem.id];
      if (el) {
        gsap.fromTo(
          el,
          {
            scale: 0.8,
            opacity: 0,
            rotation: (latestItem.rotationDeg || 0) - 4,
            y: 25,
          },
          {
            scale: 1,
            opacity: 1,
            rotation: latestItem.rotationDeg || 0,
            y: 0,
            duration: 0.6,
            ease: 'back.out(1.4)',
          }
        );
      }
    }
  }, [items]);

  return (
    <div className="mood-board-panel" ref={boardRef}>
      {/* Board Header Bar */}
      <div className="mood-board-header">
        <div className="board-title-col">
          <div className="board-pill-meta">
            <Layers size={14} />
            <span>{roomSpec.lengthFeet}' × {roomSpec.widthFeet}' {roomSpec.roomType.replace('-', ' ').toUpperCase()}</span>
            <span className="bullet-sep">·</span>
            <span className="board-style-tag">{roomSpec.style.toUpperCase()}</span>
          </div>
          <h2 className="mood-board-title">Spatial Design &amp; Architectural Layout</h2>
        </div>

        <div className="board-header-right-cluster">
          {/* 3-View Mode Switcher */}
          <div className="view-mode-pill-toggle">
            <button
              type="button"
              className={`btn-mode-tab ${activeTab === 'cad' ? 'active' : ''}`}
              onClick={() => setActiveTab('cad')}
              title="View 2D Architectural CAD Plan with realistic furniture symbols & walkways"
            >
              <Compass size={14} />
              <span>🏛️ 2D CAD Plan</span>
            </button>
            <button
              type="button"
              className={`btn-mode-tab ${activeTab === 'grid' ? 'active' : ''}`}
              onClick={() => setActiveTab('grid')}
              title="View 1ft Blueprint Spatial Grid"
            >
              <Layers size={14} />
              <span>📐 Blueprint Grid</span>
            </button>
            <button
              type="button"
              className={`btn-mode-tab ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
              title="View Mood Board photo cards with materials & specs"
            >
              <LayoutGrid size={14} />
              <span>🖼️ Mood Board ({items.length})</span>
            </button>
          </div>

          {isHaltedForApproval && (
            <button
              type="button"
              className="btn-trigger-approval-gate-header"
              onClick={onOpenApproval}
            >
              <ShieldCheck size={16} />
              <span>Review &amp; Approve (${currentSpend.toLocaleString()})</span>
            </button>
          )}
        </div>
      </div>

      {/* Running Budget Tracker (B3 component) */}
      <BudgetTracker
        currentSpend={currentSpend}
        budgetLimit={roomSpec.budgetLimit}
        items={items}
      />

      {/* Main Content Area: Switch between 2D CAD Plan, Blueprint Grid, and Mood Board Cards */}
      {activeTab === 'cad' ? (
        <ArchitecturalPlanView items={items} roomSpec={roomSpec} renderMode="cad-realistic" onUpdateItems={onUpdateItems} />
      ) : activeTab === 'grid' ? (
        <ArchitecturalPlanView items={items} roomSpec={roomSpec} renderMode="blueprint-grid" onUpdateItems={onUpdateItems} />
      ) : (
        <div className="mood-board-canvas">
          {items.length === 0 ? (
            <div className="canvas-empty-state">
              <Sparkles size={32} className="spinning-icon" />
              <h3>Agent Searching &amp; Computing Clearances...</h3>
              <p>Matched catalog items will settle onto the board once spatial physics check passes.</p>
            </div>
          ) : (
            <div className="placed-cards-grid">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  ref={(el) => (cardRefs.current[item.id] = el)}
                  className="placed-item-card"
                  style={{
                    transform: `rotate(${item.rotationDeg || 0}deg)`,
                  }}
                >
                  <div className="placed-card-top-row">
                    <span className="item-placement-index">0{index + 1}</span>
                    <div className="item-vendor-badge">
                      <Tag size={11} />
                      <span>{item.vendor.split('/')[1] || item.vendor}</span>
                    </div>
                  </div>

                  {/* Media Image Slot */}
                  <div className="placed-card-media">
                    <img 
                      src={item.imageUrl || '/images/anchor_image.png'} 
                      alt={item.name}
                      className="placed-card-img"
                    />
                    <div className="placed-card-overlay">
                      <span className="item-category-tag">{item.category}</span>
                    </div>
                  </div>

                  <div className="placed-card-info">
                    <div className="placed-card-title-price">
                      <h4 className="placed-item-name">{item.name}</h4>
                      <span className="placed-item-price">${item.price.toLocaleString()}</span>
                    </div>

                    <p className="placed-item-material">{item.material}</p>

                    <div className="placed-dimension-pill">
                      <Ruler size={12} />
                      <span>
                        {item.dimensions.width}"W × {item.dimensions.depth}"D × {item.dimensions.height}"H
                      </span>
                    </div>

                    {item.clearanceChecked && (
                      <div className="clearance-verified-pill">
                        <CheckCircle2 size={12} />
                        <span>{item.clearanceDetails}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
