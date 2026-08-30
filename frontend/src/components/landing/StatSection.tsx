import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const StatSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [stat1, setStat1] = useState(0);
  const [stat2, setStat2] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Numbers count up from 0 to their final value once on scroll entry
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          // Animate stat 1: 0 to 100+
          const counterObj1 = { val: 0 };
          gsap.to(counterObj1, {
            val: 100,
            duration: 1.6,
            ease: 'power3.out',
            onUpdate: () => setStat1(Math.round(counterObj1.val)),
          });

          // Animate stat 2: 0 to 3
          const counterObj2 = { val: 0 };
          gsap.to(counterObj2, {
            val: 3,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: () => setStat2(Math.round(counterObj2.val)),
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="stats-section" id="stats" ref={sectionRef}>
      <div className="stats-grid">
        {/* Left: Media Shot */}
        <div className="stats-left-media">
          <img 
            src="/images/stat_section_bg.jpg" 
            alt="Warm-minimalist living room" 
            className="stats-backdrop-img"
          />
        </div>

        {/* Right: Stacked Color Blocks matching AiID 26 */}
        <div className="stats-right-stack">
          {/* Stat 1: Lilac Block */}
          <div className="stat-block block-lilac">
            <span className="stat-value">{stat1}+</span>
            <h3 className="stat-label">Furniture catalog items in live inventory</h3>
            <p className="stat-subtext">Real dimensioned items with active vendor stock and material specs.</p>
          </div>

          {/* Stat 2: Mint Block */}
          <div className="stat-block block-mint">
            <span className="stat-value">{stat2}</span>
            <h3 className="stat-label">Autonomous tool calls in loop</h3>
            <p className="stat-subtext">Querying inventory, executing sandboxed layout math, and verifying budget.</p>
          </div>

          {/* Stat 3: Dark Black Block */}
          <div className="stat-block block-dark">
            <span className="stat-value">$0</span>
            <h3 className="stat-label">Spent without explicit human approval</h3>
            <p className="stat-subtext">Every financial transaction is strictly locked behind your hold-to-confirm gate.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
