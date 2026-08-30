import React, { useEffect, useRef } from 'react';
import { Search, Box, Palette, ShieldCheck, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface MoveItem {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  imageUrl: string;
  accentTag: string;
}

const moves: MoveItem[] = [
  {
    number: '01',
    title: 'Search',
    tagline: 'REAL FURNITURE CATALOG DISCOVERY',
    description: 'Autonomous MCP tool integration querying live dimensioned vendor stock against your exact aesthetic and budget bounds.',
    icon: <Search size={18} />,
    imageUrl: '/images/four_moves_search.jpg',
    accentTag: 'MCP SERVER',
  },
  {
    number: '02',
    title: 'Sandbox',
    tagline: 'DETERMINISTIC SPATIAL CALCULATION',
    description: 'Dynamic Python Shapely geometry execution in TrueFoundry containers to verify 0.0mm clearance and zero collision overlap.',
    icon: <Box size={18} />,
    imageUrl: '/images/four_moves_sandbox.jpg',
    accentTag: 'TRUEFOUNDRY RUNTIME',
  },
  {
    number: '03',
    title: 'Design',
    tagline: 'LIVE INCREMENTAL SYNTHESIS',
    description: 'Autonomous incremental mood board assembly with live budget ledger tracking and spatial orientation optimization.',
    icon: <Palette size={18} />,
    imageUrl: '/images/four_moves_design.jpg',
    accentTag: 'AGENT HARNESS',
  },
  {
    number: '04',
    title: 'Approve',
    tagline: 'HUMAN-IN-THE-LOOP SECURITY GATE',
    description: 'Strict cryptographic execution halt requiring physical hold-to-approve confirmation before placing orders or spending funds.',
    icon: <ShieldCheck size={18} />,
    imageUrl: '/images/four_moves_approve.jpg',
    accentTag: 'ZERO-TRUST GATE',
  },
];

export const FourMoves: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!sectionRef.current || !trackRef.current) return;

      const track = trackRef.current;

      // Reveal header line-by-line
      gsap.fromTo(
        '.moves-reveal-line',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      );

      const getScrollAmount = () => {
        const trackWidth = track.scrollWidth;
        const viewportWidth = window.innerWidth;
        return -(trackWidth - viewportWidth);
      };

      // Buttery smooth horizontal pinned track
      const pinTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          start: 'top top',
          end: () => `+=${Math.max(window.innerHeight * 1.8, 1600)}`,
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      pinTl.to(track, {
        x: getScrollAmount,
        ease: 'none',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="moves-section moves-seamless-gallery" id="moves" ref={sectionRef}>
      {/* Header Container */}
      <div className="moves-header-container">
        <div className="section-eyebrow">THE FOUR MOVES</div>
        <h2 className="moves-headline">
          <span className="line-wrapper">
            <span className="moves-reveal-line">How the autonomous design loop</span>
          </span>
          <span className="line-wrapper">
            <span className="moves-reveal-line">executes with zero-trust safety.</span>
          </span>
        </h2>
        <p className="moves-subhead">
          Four disciplined architectural moves combining live inventory tool intelligence, isolated container math, and mandatory human authorization.
        </p>
      </div>

      {/* Full-Bleed Seamless Horizontal Strip with ZERO Gap Between Images */}
      <div className="moves-seamless-viewport">
        <div className="moves-seamless-track" ref={trackRef}>
          {moves.map((move) => (
            <div key={move.number} className="move-strip-item">
              {/* Large Seamless Image Container */}
              <div className="move-strip-image-box">
                <img 
                  src={move.imageUrl} 
                  alt={move.title} 
                  className="move-strip-img" 
                />
                
                {/* Top Badge Overlay */}
                <div className="move-strip-top-overlay">
                  <span className="move-strip-num">{move.number}</span>
                  <div className="move-strip-tag-badge">
                    <span>{move.accentTag}</span>
                  </div>
                </div>

                {/* Bottom Overlay Pill */}
                <div className="move-strip-floating-icon">
                  {move.icon}
                </div>
              </div>

              {/* Seamless Editorial Description Directly Below Image */}
              <div className="move-strip-content">
                <div className="move-strip-header-row">
                  <span className="move-strip-tagline">{move.tagline}</span>
                  <span className="move-strip-step-indicator">STEP {move.number}/04</span>
                </div>

                <h3 className="move-strip-title">
                  <span>{move.number} / {move.title}</span>
                  <ArrowRight size={18} className="move-title-arrow" />
                </h3>

                <p className="move-strip-desc">{move.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
