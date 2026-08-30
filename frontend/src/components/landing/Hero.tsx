import React, { useEffect, useRef } from 'react';
import { ArrowDown, Sparkles, CheckCircle, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  onLaunchStudio: () => void;
  isInitialLoaded?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onLaunchStudio, isInitialLoaded = true }) => {
  const heroRef = useRef<HTMLElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isInitialLoaded) return;

    const ctx = gsap.context(() => {
      // 1. Line-by-line text reveal with smooth fluid easing
      gsap.fromTo(
        '.hero-line-inner',
        { y: 45, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.08,
        }
      );

      // 2. Subtitle, eyebrow, actions entrance
      gsap.fromTo(
        ['.hero-eyebrow', '.hero-editorial-desc', '.hero-action-group', '.hero-stats-strip'],
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.28,
        }
      );

      // 3. Collage images entrance
      gsap.fromTo(
        '.collage-cell',
        { scale: 0.94, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.35,
        }
      );

      // 4. Scroll cue continuous bounce
      gsap.to('.scroll-arrow', {
        y: 6,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }, heroRef);

    return () => {
      ctx.revert();
    };
  }, [isInitialLoaded]);

  return (
    <section className="hero-section hero-full-viewport" id="hero" ref={heroRef}>
      {/* Background Subtle Grid Layer */}
      <div className="hero-bg-layer">
        <div className="hero-grid-pattern" />
        <div className="hero-ambient-glow" />
      </div>

      <div className="hero-stage-container">
        {/* Left Column: Typography & Core Actions */}
        <div className="hero-left-column">
          <div className="hero-eyebrow-wrapper">
            <div className="hero-eyebrow">
              <Sparkles size={13} className="eyebrow-icon" />
              <span>AUTONOMOUS ARCHITECTURE &amp; FINANCIAL SAFETY HARNESS</span>
            </div>
          </div>

          <h1 className="hero-headline">
            <span className="headline-line-wrapper">
              <span className="hero-line-inner">Architecting</span>
            </span>
            <span className="headline-line-wrapper">
              <span className="hero-line-inner">the Future of</span>
            </span>
            <span className="headline-line-wrapper">
              <span className="hero-line-inner">Agentic AI.</span>
            </span>
          </h1>

          <p className="hero-editorial-desc">
            Moving beyond speculative hallucination. ReDessIo executes sandboxed Python clearance math, queries live dimensioned MCP furniture catalogs, and locks financial execution behind a deterministic human approval gate.
          </p>

          <div className="hero-action-group">
            <button 
              type="button" 
              className="btn-hero-cta"
              onClick={onLaunchStudio}
              id="hero-launch-live-studio-btn"
            >
              <span>Launch Live Studio</span>
              <ArrowUpRight size={18} />
            </button>

            <div className="hero-scroll-cue">
              <span>Scroll to explore</span>
              <ArrowDown size={14} className="scroll-arrow" />
            </div>
          </div>

          {/* Key Metric Indicators Strip */}
          <div className="hero-stats-strip">
            <div className="stat-strip-item">
              <CheckCircle size={14} className="stat-icon-green" />
              <span className="stat-strip-bold">100+</span>
              <span className="stat-strip-label">Live Catalog Items</span>
            </div>
            <div className="stat-strip-divider" />
            <div className="stat-strip-item">
              <CheckCircle size={14} className="stat-icon-green" />
              <span className="stat-strip-bold">0.0mm</span>
              <span className="stat-strip-label">Collision Tolerance</span>
            </div>
            <div className="stat-strip-divider" />
            <div className="stat-strip-item">
              <CheckCircle size={14} className="stat-icon-green" />
              <span className="stat-strip-bold">$0</span>
              <span className="stat-strip-label">Spent Without Approval</span>
            </div>
          </div>
        </div>

        {/* Right Column: Borderless Collage Grid with Hover Expansion */}
        <div className="hero-right-column" ref={collageRef}>
          <div className="hero-collage-grid">
            {/* Left: Tall vertical image */}
            <div className="collage-col collage-col-left">
              <div className="collage-cell collage-cell-1">
                <img 
                  src="/images/four_moves_sandbox.jpg" 
                  alt="Spatial Blueprint — TrueFoundry Docker Sandbox"
                  className="collage-img" 
                />
                <div className="collage-label">
                  <span className="collage-label-tag">SANDBOX</span>
                </div>
              </div>
            </div>

            {/* Right: Two horizontally stacked images */}
            <div className="collage-col collage-col-right">
              <div className="collage-cell collage-cell-2">
                <img 
                  src="/images/four_moves_search.jpg" 
                  alt="MCP Furniture Catalog Discovery"
                  className="collage-img" 
                />
                <div className="collage-label">
                  <span className="collage-label-tag">CATALOG</span>
                </div>
              </div>

              <div className="collage-cell collage-cell-3">
                <img 
                  src="/images/anchor_image.png" 
                  alt="Hold-to-Approve Human Safety Gate"
                  className="collage-img" 
                />
                <div className="collage-label">
                  <span className="collage-label-tag">APPROVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
