import React, { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FinalCTAProps {
  onLaunchStudio: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onLaunchStudio }) => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Ken Burns zoom on background image
      gsap.to('.cta-bg-image', {
        scale: 1.08,
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // 2. Dramatic Climax Reveal on Scroll Entry
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        defaults: { ease: 'power3.out' },
      });

      tl.fromTo(
        '.cta-badge',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55 }
      )
      .fromTo(
        '.final-cta-headline',
        { scale: 0.92, y: 35, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.8 },
        '-=0.35'
      )
      .fromTo(
        '.final-cta-description',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65 },
        '-=0.45'
      )
      .fromTo(
        '#final-cta-launch-btn',
        { scale: 0.85, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.5)' },
        '-=0.3'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="final-cta-section" id="launch" ref={sectionRef}>
      <div className="final-cta-backdrop">
        <img 
          src="/images/final_cta_bg.jpg" 
          alt="Warm finished living room at golden hour" 
          className="cta-bg-image"
        />
        <div className="final-cta-scrim"></div>
      </div>

      <div className="final-cta-container">
        <div className="final-cta-content">
          <div className="cta-badge">
            <Sparkles size={14} />
            <span>INSTANT SESSION · NO REGISTRATION NEEDED</span>
          </div>

          <h2 className="final-cta-headline">
            Give it your room dimensions.<br />
            Watch it design in real-time.
          </h2>

          <p className="final-cta-description">
            Experience the full autonomous loop: live catalog discovery, sandboxed clearance mathematics, and your explicit hold-to-approve signature.
          </p>

          <div className="final-cta-actions">
            <button 
              type="button" 
              className="btn-launch-heroic"
              onClick={onLaunchStudio}
              id="final-cta-launch-btn"
            >
              <span>Launch Studio</span>
              <ArrowRight size={20} className="btn-arrow" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
