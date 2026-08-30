import React, { useEffect, useRef } from 'react';
import { Wifi, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';

interface ReconnectToastProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const ReconnectToast: React.FC<ReconnectToastProps> = ({ isVisible, onDismiss }) => {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && toastRef.current) {
      // Slide down in from top
      gsap.fromTo(
        toastRef.current,
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }
      );

      // Auto dismiss after 3.5s
      const timer = setTimeout(() => {
        if (toastRef.current) {
          gsap.to(toastRef.current, {
            y: -60,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.in',
            onComplete: onDismiss,
          });
        }
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="reconnect-toast-wrapper" ref={toastRef}>
      <div className="reconnect-toast-content">
        <div className="toast-icon-badge">
          <Wifi size={14} />
        </div>
        <div className="toast-text-col">
          <strong>Agent Stream Reconnected</strong>
          <span>Live WebSocket connection to TrueForge restored.</span>
        </div>
        <CheckCircle2 size={16} className="toast-check-icon" />
      </div>
    </div>
  );
};
