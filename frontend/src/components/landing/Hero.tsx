import React, { useEffect, useRef } from 'react';
import { ArrowDown, Sparkles, ShieldCheck, Terminal, Layers, ArrowUpRight, CheckCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  onLaunchStudio: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onLaunchStudio }) => {
  const heroRef = useRef<HTMLElement>(null);
  const visualStageRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Line-by-line text reveal
      gsap.fromTo(
        '.hero-line-inner',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.15,
        }
      );

      // 2. Subtitle and actions entrance
      gsap.fromTo(
        ['.hero-eyebrow', '.hero-editorial-desc', '.hero-action-group', '.hero-stats-strip'],
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.45,
        }
      );

      // 3. Staggered entrance for floating visual cards on the right stage
      gsap.fromTo(
        ['.hero-float-card-1', '.hero-float-card-2', '.hero-float-card-3'],
        { scale: 0.88, opacity: 0, y: 40 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: 'back.out(1.3)',
          delay: 0.5,
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

    // 5. Interactive Mouse Parallax over the Hero container
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      if (card1Ref.current) {
        gsap.to(card1Ref.current, {
          x: x * 28,
          y: y * 24,
          rotate: x * 2.5,
          duration: 0.7,
          ease: 'power2.out',
        });
      }
      if (card2Ref.current) {
        gsap.to(card2Ref.current, {
          x: -x * 32,
          y: -y * 30,
          rotate: -x * 3,
          duration: 0.8,
          ease: 'power2.out',
        });
      }
      if (card3Ref.current) {
        gsap.to(card3Ref.current, {
          x: x * 20,
          y: -y * 22,
          rotate: y * 2.5,
          duration: 0.75,
          ease: 'power2.out',
        });
      }
    };

    const heroEl = heroRef.current;
    if (heroEl) {
      heroEl.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      ctx.revert();
      if (heroEl) {
        heroEl.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

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

        {/* Right Column: Dedicated Interactive Visual Canvas */}
        <div className="hero-right-column" ref={visualStageRef}>
          <div className="hero-stage-cards-cluster">
            {/* Card 1: Top Right - Sandbox Python Execution */}
            <div className="hero-float-card hero-float-card-1" ref={card1Ref}>
              <div className="float-card-inner">
                <div className="float-card-image-wrap">
                  <img 
                    src="/images/four_moves_sandbox.jpg" 
                    alt="Spatial Blueprint Grid"
                    className="float-card-img" 
                  />
                  <div className="float-image-badge">SANDBOX RUNTIME</div>
                </div>
                <div className="float-card-meta">
                  <div className="float-meta-tag tag-blue">
                    <Terminal size={12} />
                    <span>TRUEFOUNDRY DOCKER</span>
                  </div>
                  <span className="float-meta-title">Spatial Clearance: 0.0mm Error</span>
                </div>
              </div>
            </div>

            {/* Card 2: Center Left - Inventory MCP Tooling */}
            <div className="hero-float-card hero-float-card-2" ref={card2Ref}>
              <div className="float-card-inner">
                <div className="float-card-image-wrap">
                  <img 
                    src="/images/four_moves_search.jpg" 
                    alt="Catalog Swatch Flat-lay"
                    className="float-card-img" 
                  />
                  <div className="float-image-badge">MCP INVENTORY</div>
                </div>
                <div className="float-card-meta">
                  <div className="float-meta-tag tag-orange">
                    <Layers size={12} />
                    <span>MODEL CONTEXT PROTOCOL</span>
                  </div>
                  <span className="float-meta-title">Live Stock · 100+ Dimensioned Items</span>
                </div>
              </div>
            </div>

            {/* Card 3: Bottom Right - Hold-to-Approve Safety Gate */}
            <div className="hero-float-card hero-float-card-3" ref={card3Ref}>
              <div className="float-card-inner">
                <div className="float-card-image-wrap">
                  <img 
                    src="/images/anchor_image.png" 
                    alt="Sunlit Finished Room"
                    className="float-card-img" 
                  />
                  <div className="float-image-badge">ZERO TRUST</div>
                </div>
                <div className="float-card-meta">
                  <div className="float-meta-tag tag-green">
                    <ShieldCheck size={12} />
                    <span>HOLD-TO-APPROVE GATE</span>
                  </div>
                  <span className="float-meta-title">$0 Spent Without User Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
