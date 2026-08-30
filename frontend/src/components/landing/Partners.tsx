import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Partners: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.partners-header',
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 82%',
          },
        }
      );

      gsap.fromTo(
        '.partner-slot',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.partners-grid',
            start: 'top 82%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="partners-section" id="partners" ref={sectionRef}>
      <div className="partners-container">
        <div className="partners-header">
          <span className="partners-eyebrow">OUR SPONSORS &amp; RUNTIME ECOSYSTEM</span>
        </div>

        <div className="partners-grid">
          {/* TrueFoundry Logo Slot */}
          <div className="partner-slot" id="partner-truefoundry-slot">
            <span className="partner-name">TrueFoundry</span>
            <span className="partner-badge">ORCHESTRATION</span>
            <p className="partner-caption">Model serving, agent orchestration &amp; sandboxed execution runtime</p>
          </div>

          {/* Divider */}
          <div className="partner-divider" aria-hidden="true" />

          {/* Qodo Logo Slot */}
          <div className="partner-slot" id="partner-qodo-slot">
            <span className="partner-name">Qodo</span>
            <span className="partner-badge">INTELLIGENCE</span>
            <p className="partner-caption">Code intelligence, automated testing &amp; pull request review</p>
          </div>
        </div>
      </div>

      {/* Inflection Point Editorial Block matching AiID 26 inspiration */}
      <div className="inflection-box">
        <div className="inflection-eyebrow">AN INFLECTION POINT</div>
        <h2 className="inflection-headline">
          In 2025, design tools hallucinated mockups. In 2026, autonomous agents build with real tools and physical safety.
        </h2>
      </div>
    </section>
  );
};
