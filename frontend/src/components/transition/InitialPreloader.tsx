import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface InitialPreloaderProps {
  onLoaded?: () => void;
}

export const InitialPreloader: React.FC<InitialPreloaderProps> = ({ onLoaded }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const counterContainerRef = useRef<HTMLDivElement>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    const progress = progressRef.current;
    const counterEl = counterRef.current;
    const counterContainer = counterContainerRef.current;

    if (!overlay || !content) return;

    // Lock body scroll during initial preloader
    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline({
      onComplete: () => {
        setIsDone(true);
        document.body.style.overflow = '';
        if (onLoaded) onLoaded();
      },
    });

    // 1. Initial State
    gsap.set(overlay, { yPercent: 0, opacity: 1 });
    gsap.set(content, { opacity: 0, y: 25, scale: 0.95 });
    if (counterContainer) gsap.set(counterContainer, { opacity: 0, y: 15 });
    if (progress) gsap.set(progress, { width: '0%' });

    // 2. Content & Counter Fade In (0.45s)
    tl.to([content, counterContainer], {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.45,
      ease: 'power2.out',
    })
    // 3. Counter Number Spin 0 -> 100 & Progress Bar Fill (1.1s)
    .to(
      progress,
      {
        width: '100%',
        duration: 1.1,
        ease: 'power1.inOut',
      },
      '-=0.2'
    );

    const countObj = { val: 0 };
    tl.to(
      countObj,
      {
        val: 100,
        duration: 1.1,
        ease: 'power1.inOut',
        onUpdate: () => {
          if (counterEl) {
            const num = Math.round(countObj.val);
            counterEl.innerText = num < 10 ? `0${num}%` : `${num}%`;
          }
        },
      },
      0.3
    )
    // 4. Subtle element fade up before curtain wipe (0.2s)
    .to([content, counterContainer], {
      opacity: 0,
      y: -20,
      duration: 0.22,
      delay: 0.12,
      ease: 'power2.in',
    })
    // 5. Notify parent that reveal has started
    .call(() => {
      if (onLoaded) onLoaded();
    })
    // 6. Smooth upward curtain wipe revealing hero page (0.65s)
    .to(overlay, {
      yPercent: -100,
      duration: 0.65,
      ease: 'power3.inOut',
    });

    return () => {
      tl.kill();
      document.body.style.overflow = '';
    };
  }, [onLoaded]);

  if (isDone) return null;

  return (
    <div
      ref={overlayRef}
      className="initial-preloader-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#D95D39',
        background: 'radial-gradient(circle at center, #E06742 0%, #C44E28 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        pointerEvents: 'all',
      }}
    >
      {/* Center Branding Content */}
      <div
        ref={contentRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        {/* Brand Title */}
        <h1
          style={{
            fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
            fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            margin: 0,
            color: '#FFFFFF',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
          }}
        >
          ReDessIo
        </h1>

        {/* Loading Subtitle */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginTop: '0.75rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          <span>Loading Spatial Studio</span>
          <span className="preloader-dot-pulse">●</span>
        </div>

        {/* Minimalist Glowing Progress Line */}
        <div
          style={{
            width: '180px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '4px',
            marginTop: '1.5rem',
            overflow: 'hidden',
          }}
        >
          <div
            ref={progressRef}
            style={{
              height: '100%',
              width: '0%',
              background: '#FFFFFF',
              borderRadius: '4px',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
            }}
          />
        </div>
      </div>

      {/* Bottom-Left Smooth Number Counter (00% -> 100%) */}
      <div
        ref={counterContainerRef}
        style={{
          position: 'absolute',
          bottom: 'clamp(2rem, 5vw, 3.5rem)',
          left: 'clamp(2rem, 5vw, 3.5rem)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.2rem',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          System Ingest
        </span>
        <div
          ref={counterRef}
          style={{
            fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            fontVariantNumeric: 'tabular-nums',
            color: '#FFFFFF',
            opacity: 1,
            textShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          00%
        </div>
      </div>
    </div>
  );
};
