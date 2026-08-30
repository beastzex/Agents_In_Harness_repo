import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Pillar {
  number: string;
  theme: string;
  headline: string;
  paragraph: string;
  bulletsTitle: string;
  bullets: string[];
  ctaText: string;
  imageHint: string;
  imageUrl: string;
  accentBgClass: string;
}

const pillars: Pillar[] = [
  {
    number: '01',
    theme: 'Real Tools',
    headline: "It doesn't guess. It searches.",
    paragraph:
      "Unlike conventional design tools that generate imaginary mockups with impossible products, ReDessIo queries real vendor databases via Model Context Protocol (MCP). Every piece is live in inventory, complete with verified dimensions, fabrics, stock status, and exact real-time pricing.",
    bulletsTitle: "IN THIS CHAPTER, WE'LL COVER:",
    bullets: [
      'MCP-connected live furniture inventory lookup',
      'Dynamic style matching with vector embeddings',
      'Accurate dimension validation and stock verification',
      'Real vendor pricing without synthetic estimates',
    ],
    ctaText: 'Explore MCP Tool Call Schema',
    imageHint: 'Macro shot of furniture material swatches & fabric textures',
    imageUrl: '/images/pillar_real_tools.jpg',
    accentBgClass: 'pillar-terracotta',
  },
  {
    number: '02',
    theme: 'Safe Execution',
    headline: 'The math happens where it can’t break anything.',
    paragraph:
      'Designing a room requires non-trivial spatial computing. The agent spins up an isolated sandbox to run layout-fitting algorithms, checking physical clearances, door-swing arcs, walking lanes, and wall bounds before any item enters your design.',
    bulletsTitle: "HOW THE SANDBOX GUARANTEES FIT:",
    bullets: [
      'Isolated Python sandbox executing constraint satisfaction',
      '2D/3D bounding box collision detection and clearance checks',
      'Walkway traffic lane preservation (>36 inches)',
      'Deterministic output with zero layout hallucinations',
    ],
    ctaText: 'Inspect Sandbox Algorithm',
    imageHint: 'Drafting table with graph paper, architectural scales, and a sharp pencil',
    imageUrl: '/images/pillar_safe_exec.jpg',
    accentBgClass: 'pillar-forest',
  },
  {
    number: '03',
    theme: 'Human Control',
    headline: 'It stops. You decide.',
    paragraph:
      'Autonomous systems fail when they assume permission. ReDessIo is hard-coded with an immutable security policy: creating designs is autonomous, but executing a purchase is strictly human-gated. Before placing an order, the agent halts and awaits your deliberate hold-to-approve signature.',
    bulletsTitle: 'WHY EXPLICIT APPROVAL MATTERS:',
    bullets: [
      'Full itemized price breakdown with taxes and shipping',
      'Deliberate 1.2-second press-and-hold confirmation mechanism',
      'Instant cancellation and refinement at any moment',
      'Zero risk of unintended or runaway automated checkout',
    ],
    ctaText: 'Test Approval Gate in Studio',
    imageHint: 'Sculptural brass switch or tactile toggle in warm spotlight',
    imageUrl: '/images/pillar_human_ctrl.jpg',
    accentBgClass: 'pillar-rust',
  },
];

export const Pillars: React.FC<{ onLaunchStudio: () => void }> = ({ onLaunchStudio }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate Section Intro
      gsap.fromTo(
        '.pillars-intro > *',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.pillars-intro',
            start: 'top 80%',
          },
        }
      );

      // Animate each of the 3 chapters in exact sequential order
      chapterRefs.current.forEach((chapterEl) => {
        if (!chapterEl) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: chapterEl,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
          defaults: { ease: 'power3.out' },
        });

        // 1. Eyebrow label / index column fades in
        const indexCol = chapterEl.querySelector('.pillar-index-col');
        // 2. Headline slides up + fades
        const headline = chapterEl.querySelector('.chapter-headline');
        // 3. Paragraph fades in slightly after
        const lead = chapterEl.querySelector('.chapter-lead');
        // 4. Supporting visual scales in from 0.95 -> 1 with fade
        const visual = chapterEl.querySelector('.pillar-visual-card');
        // 5. Bullet list items stagger in one by one
        const bullets = chapterEl.querySelectorAll('.bullet-item');
        // 6. CTA link fades in last
        const cta = chapterEl.querySelector('.pillar-cta-link');

        if (indexCol) tl.fromTo(indexCol, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
        if (headline) tl.fromTo(headline, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.35');
        if (lead) tl.fromTo(lead, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, '-=0.35');
        if (visual) tl.fromTo(visual, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.65 }, '-=0.3');
        if (bullets.length) tl.fromTo(bullets, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, stagger: 0.08 }, '-=0.35');
        if (cta) tl.fromTo(cta, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, '-=0.2');
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="pillars-section" id="pillars" ref={sectionRef}>
      <div className="pillars-intro">
        <span className="section-eyebrow">ARCHITECTURAL FOUNDATION</span>
        <h2 className="pillars-title">The three pillars of trustworthy design intelligence.</h2>
      </div>

      <div className="pillars-stack">
        {pillars.map((pillar, index) => (
          <div 
            key={pillar.number} 
            className={`pillar-chapter ${pillar.accentBgClass}`}
            ref={(el) => (chapterRefs.current[index] = el)}
          >
            <div className="pillar-header-row">
              <div className="pillar-index-col">
                <span className="chapter-num">{pillar.number}</span>
                <span className="chapter-theme">{pillar.theme}</span>
              </div>
              <div className="pillar-headline-col">
                <h3 className="chapter-headline">{pillar.headline}</h3>
                <p className="chapter-lead">{pillar.paragraph}</p>
              </div>
            </div>

            <div className="pillar-content-grid">
              {/* Visual Card */}
              <div className="pillar-visual-card">
                <div className="pillar-media-box">
                  <img 
                    src={pillar.imageUrl} 
                    alt={pillar.headline}
                    className="pillar-media-img"
                  />
                </div>
              </div>

              {/* Bullets & CTA */}
              <div className="pillar-details-card">
                <span className="bullets-title">{pillar.bulletsTitle}</span>
                <ul className="pillar-bullets-list">
                  {pillar.bullets.map((bullet, idx) => (
                    <li key={idx} className="bullet-item">
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  type="button" 
                  className="pillar-cta-link"
                  onClick={onLaunchStudio}
                >
                  <span>{pillar.ctaText}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
