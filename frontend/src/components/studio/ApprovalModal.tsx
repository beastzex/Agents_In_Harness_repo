import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, Check, Lock, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { FurnitureItem, RoomSpec } from '../../types/studio';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  items: FurnitureItem[];
  roomSpec: RoomSpec;
  currentSpend: number;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  items,
  roomSpec,
  currentSpend,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const ringCircleRef = useRef<SVGCircleElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [isApprovedState, setIsApprovedState] = useState<boolean>(false);

  const HOLD_DURATION_MS = 1200;
  const subtotal = currentSpend;
  const estimatedTax = Math.round(subtotal * 0.0825);
  const estimatedShipping = 145;
  const grandTotal = subtotal + estimatedTax + estimatedShipping;

  // 1. Entrance animation: backdrop blurs first, modal scales 0.95 -> 1 with weight ~150ms after
  useEffect(() => {
    if (isOpen && backdropRef.current && modalRef.current) {
      setIsApprovedState(false);
      setHoldProgress(0);

      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power2.out' }
      );

      gsap.fromTo(
        modalRef.current,
        { scale: 0.95, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: 'power3.out' }
      );
    }
  }, [isOpen]);

  // Handle Press-and-Hold 1.2s confirm interaction
  const startHold = () => {
    if (isApprovedState) return;
    setIsHolding(true);
    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);

      if (progress < 1) {
        holdTimerRef.current = requestAnimationFrame(tick);
      } else {
        // Complete approval!
        triggerApprovalSuccess();
      }
    };

    holdTimerRef.current = requestAnimationFrame(tick);
  };

  const endHold = () => {
    if (isApprovedState) return;
    setIsHolding(false);
    if (holdTimerRef.current) {
      cancelAnimationFrame(holdTimerRef.current);
    }
    // Smoothly drain progress back down
    gsap.to({ p: holdProgress }, {
      p: 0,
      duration: 0.25,
      ease: 'power2.out',
      onUpdate: function () {
        setHoldProgress(this.targets()[0].p);
      },
    });
  };

  const triggerApprovalSuccess = () => {
    setIsApprovedState(true);
    setIsHolding(false);
    if (holdTimerRef.current) {
      cancelAnimationFrame(holdTimerRef.current);
    }

    // Morph animation to checkmark success state
    gsap.fromTo(
      '.approval-success-view',
      { scale: 0.88, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
    );

    setTimeout(() => {
      onApprove();
    }, 1800);
  };

  const handleRejectAction = () => {
    if (modalRef.current && backdropRef.current) {
      gsap.to(modalRef.current, {
        y: 30,
        opacity: 0,
        scale: 0.96,
        duration: 0.3,
        ease: 'power2.in',
      });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.35,
        delay: 0.05,
        ease: 'power2.in',
        onComplete: () => onReject(),
      });
    } else {
      onReject();
    }
  };

  if (!isOpen) return null;

  // SVG circular ring properties
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - holdProgress * circumference;

  return (
    <div className="approval-modal-backdrop" ref={backdropRef} onClick={onClose}>
      <div
        className="approval-modal-container"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {!isApprovedState ? (
          <>
            {/* Modal Top Header */}
            <div className="approval-modal-header">
              <div className="approval-security-badge">
                <Lock size={15} />
                <span>EXPLICIT AUTHORIZATION GATE</span>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="approval-modal-body">
              <h3 className="approval-headline">Review and authorize order execution.</h3>
              <p className="approval-subtext">
                The TrueForge agent will <strong>never auto-purchase</strong>. All {items.length} items have passed physical spatial collision tests for your {roomSpec.lengthFeet}' × {roomSpec.widthFeet}' {roomSpec.roomType.replace('-', ' ')}.
              </p>

              {/* Itemized Order Breakdown */}
              <div className="approval-itemized-box">
                <div className="itemized-header-row">
                  <span>ITEM</span>
                  <span>DIMENSIONS</span>
                  <span>STATUS</span>
                  <span className="align-right">PRICE</span>
                </div>

                <div className="itemized-list">
                  {items.map((item) => (
                    <div key={item.id} className="itemized-row">
                      <div className="item-name-col">
                        <strong>{item.name}</strong>
                        <span className="item-vendor-small">{item.vendor}</span>
                      </div>
                      <div className="item-dim-col">
                        <span>{item.dimensions.width}" × {item.dimensions.depth}"</span>
                      </div>
                      <div className="item-status-col">
                        <span className="badge-clearance-pass">PASS</span>
                      </div>
                      <div className="item-price-col align-right">
                        ${item.price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Section */}
                <div className="itemized-totals-block">
                  <div className="totals-line">
                    <span>Furniture Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="totals-line">
                    <span>Estimated Tax (8.25%)</span>
                    <span>${estimatedTax.toLocaleString()}</span>
                  </div>
                  <div className="totals-line">
                    <span>Curbside White-Glove Freight</span>
                    <span>${estimatedShipping.toLocaleString()}</span>
                  </div>
                  <div className="totals-line grand-total-line">
                    <strong>Total Authorized Spend</strong>
                    <strong className="grand-total-amount">${grandTotal.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Press-and-Hold Confirmation Trigger */}
              <div className="hold-confirmation-section">
                <div className="hold-instructions">
                  <span>Press and hold 1.2s to sign and commit payment</span>
                  <small>Release early at any moment to cancel · Or click to sign immediately</small>
                </div>

                <div
                  className={`btn-hold-to-confirm ${isHolding ? 'holding' : ''}`}
                  onMouseDown={startHold}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={startHold}
                  onTouchEnd={endHold}
                  onClick={triggerApprovalSuccess}
                  role="button"
                  tabIndex={0}
                  title="Click or press and hold 1.2s to approve order"
                >
                  <svg className="progress-ring-svg" width="80" height="80">
                    <circle
                      className="progress-ring-bg"
                      cx="40"
                      cy="40"
                      r={radius}
                      strokeWidth="5"
                    />
                    <circle
                      ref={ringCircleRef}
                      className="progress-ring-bar"
                      cx="40"
                      cy="40"
                      r={radius}
                      strokeWidth="5"
                      style={{
                        strokeDasharray: `${circumference} ${circumference}`,
                        strokeDashoffset,
                      }}
                    />
                  </svg>

                  <div className="hold-button-center">
                    <ShieldCheck size={28} className="shield-icon" />
                  </div>
                </div>

                <div className="hold-percentage-display">
                  <span>{Math.round(holdProgress * 100)}% Complete</span>
                </div>
              </div>

              {/* Reject / Refine Action */}
              <div className="approval-footer-actions">
                <button
                  type="button"
                  className="btn-reject-refine"
                  onClick={handleRejectAction}
                >
                  Reject &amp; Refine Design Parameters
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Morph Success State */
          <div className="approval-success-view">
            <div className="success-icon-wrap">
              <Check size={48} className="check-svg" />
            </div>
            <h3 className="success-title">Order Signed &amp; Approved!</h3>
            <p className="success-subtitle">
              Transaction token emitted to TrueForge order fulfillment pipe. Total ${grandTotal.toLocaleString()} committed.
            </p>
            <div className="success-details-badge">
              <Sparkles size={14} />
              <span>Room Session Complete · Returning to Final Mood Board</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
