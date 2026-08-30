import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ViewTransitionProps {
  isTransitioning: boolean;
  onMidpoint: () => void;
  onComplete: () => void;
}

export const ViewTransition: React.FC<ViewTransitionProps> = ({
  isTransitioning,
  onMidpoint,
  onComplete,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const midpointRef = useRef(onMidpoint);
  const completeRef = useRef(onComplete);
  const isRunningRef = useRef(false);

  midpointRef.current = onMidpoint;
  completeRef.current = onComplete;

  useEffect(() => {
    if (!isTransitioning || !panelRef.current || isRunningRef.current) return;

    isRunningRef.current = true;
    const panel = panelRef.current;
    const text = textRef.current;

    // Reset panel position below viewport
    gsap.set(panel, { yPercent: 100, display: 'flex' });
    if (text) gsap.set(text, { opacity: 0, y: 30 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(panel, { display: 'none', yPercent: 100 });
        isRunningRef.current = false;
        completeRef.current();
      },
    });

    // 1. Wipe upward to cover viewport (~450ms)
    tl.to(panel, {
      yPercent: 0,
      duration: 0.45,
      ease: 'power3.inOut',
    })
    // Text pulse in the center of the terracotta wipe
    .to(
      text,
      {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: 'power2.out',
      },
      '-=0.15'
    )
    // 2. Midpoint callback: switches view underneath exactly once
    .call(() => {
      midpointRef.current();
    })
    // Slight pause for intentional tactile feeling
    .to(text, {
      opacity: 0,
      y: -20,
      duration: 0.15,
      delay: 0.05,
      ease: 'power2.in',
    })
    // 3. Panel continues past upward revealing the new view (~380ms)
    .to(panel, {
      yPercent: -100,
      duration: 0.38,
      ease: 'power3.inOut',
    });

    return () => {
      tl.kill();
      isRunningRef.current = false;
    };
  }, [isTransitioning]);

  return (
    <div
      ref={panelRef}
      className="view-transition-panel"
      style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--accent-terracotta)',
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        pointerEvents: isTransitioning ? 'all' : 'none',
      }}
    >
      <div ref={textRef} style={{ textAlign: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            display: 'block',
          }}
        >
          ReDessIo Studio
        </span>
        <span
          style={{
            fontSize: '0.85rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: 0.85,
            fontWeight: 600,
            marginTop: '0.5rem',
            display: 'block',
          }}
        >
          Initializing TrueForge Autonomous Runtime
        </span>
      </div>
    </div>
  );
};
