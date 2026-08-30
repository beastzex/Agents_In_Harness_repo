import React, { useEffect, useRef } from 'react';
import { Search, Box, Palette, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface MoveCard {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  placeholderHint: string;
  imageUrl: string;
}

const moves: MoveCard[] = [
  {
    number: '01',
    title: 'Search',
    tagline: 'Real furniture catalog search',
    description: 'It searches real furniture against your style and budget via live MCP integrations.',
    icon: <Search size={22} />,
    placeholderHint: 'Image: Flat-lay of furniture swatches & reference photos in bright natural light',
    imageUrl: '/images/four_moves_search.jpg',
  },
  {
    number: '02',
    title: 'Sandbox',
    tagline: 'Deterministic spatial calculation',
    description: 'It runs the layout math live, in a sandbox, to see what actually fits your exact room dimensions.',
    icon: <Box size={22} />,
    placeholderHint: 'Image: Architectural floor plan blueprint with soft glowing measurement grid',
    imageUrl: '/images/four_moves_sandbox.jpg',
  },
  {
    number: '03',
    title: 'Design',
    tagline: 'Live incremental generation',
    description: 'It builds your mood board in front of you, one piece at a time, calculating budget with each step.',
    icon: <Palette size={22} />,
    placeholderHint: 'Image: Mood board pinned to wall with fabric swatches & sketches',
    imageUrl: '/images/four_moves_design.jpg',
  },
  {
    number: '04',
    title: 'Approve',
    tagline: 'The human-in-the-loop gate',
    description: 'Before it spends a single cent, it stops and asks for your deliberate, explicit hold-to-approve signature.',
    icon: <ShieldCheck size={22} />,
    placeholderHint: 'Image: Close-up of hand near a softly glowing tactile button in warm light',
    imageUrl: '/images/four_moves_approve.jpg',
  },
];

export const FourMoves: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!sectionRef.current || !trackRef.current) return;

      const track = trackRef.current;
      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];

      const updateCardScales = () => {
        const viewportCenter = window.innerWidth / 2;
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const distFromCenter = Math.abs(viewportCenter - cardCenter);
          const maxDist = window.innerWidth * 0.45;
          const progress = Math.min(distFromCenter / maxDist, 1);

          const scale = 1 - progress * 0.08; // 1.0 -> 0.92
          const opacity = 1 - progress * 0.4; // 1.0 -> 0.6

          gsap.set(card, { scale, opacity, overwrite: 'auto' });
        });
      };

      const getScrollAmount = () => {
        const trackWidth = track.scrollWidth;
        const viewportWidth = window.innerWidth;
        return -(trackWidth - viewportWidth + 160);
      };

      const pinTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          start: 'top top',
          end: () => `+=${Math.max(window.innerHeight * 1.5, 1400)}`,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: updateCardScales,
          onEnter: updateCardScales,
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
    <section className="moves-section" id="moves" ref={sectionRef}>
      <div className="moves-header-container">
        <div className="section-eyebrow">THE FOUR MOVES</div>
        <h2 className="moves-headline">How the autonomous design loop executes safely.</h2>
        <p className="moves-subhead">
          Four disciplined steps combining live inventory intelligence, isolated physics math, and mandatory human authorization.
        </p>
      </div>

      {/* Pinned Horizontal Track Viewport */}
      <div className="moves-track-viewport">
        <div className="moves-cards-track" ref={trackRef}>
          {moves.map((move, index) => (
            <div 
              key={move.number} 
              className="move-card"
              ref={(el) => (cardsRef.current[index] = el)}
            >
              <div className="card-top-bar">
                <span className="card-number">{move.number}</span>
                <div className="card-icon-badge">{move.icon}</div>
              </div>

              <div className="card-media-box">
                <img 
                  src={move.imageUrl} 
                  alt={move.title}
                  className="card-media-img"
                />
              </div>

              <div className="card-body">
                <span className="card-tagline">{move.tagline}</span>
                <h3 className="card-title">{move.title}</h3>
                <p className="card-description">{move.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
