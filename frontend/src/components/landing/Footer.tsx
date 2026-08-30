import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FooterProps {
  onLaunchStudio: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLaunchStudio }) => {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ['.grand-footer-top', '.grand-footer-headline', '.grand-footer-bottom-split'],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 80%',
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer className="grand-editorial-footer" id="about" ref={footerRef}>
      {/* 1. Top Minimalist Bar */}
      <div className="grand-footer-top">
        <div className="grand-footer-brand-lockup">
          <div className="grand-brand-badge">
            <span>ReDessIo</span>
            <span className="brand-badge-sup">26</span>
          </div>
          <button 
            type="button" 
            className="grand-btn-cta"
            onClick={onLaunchStudio}
          >
            <span>Launch Studio</span>
            <Plus size={16} />
          </button>
        </div>

        <nav className="grand-footer-nav-top">
          <a href="#about" className="grand-top-link">About</a>
          <a href="#projects" className="grand-top-link">
            <span>Sub-Agents</span>
            <Plus size={14} />
          </a>
          <a href="#experience" className="grand-top-link">
            <span>Case Studies</span>
            <Plus size={14} />
          </a>
        </nav>
      </div>

      {/* 2. Massive Display Headline Spanning Entire Width */}
      <div className="grand-footer-headline-wrap">
        <h2 className="grand-footer-headline">
          Agents in Design
        </h2>
      </div>

      {/* 3. Bottom Split Layout: Partners & Links on Left, Huge '2026' on Right */}
      <div className="grand-footer-bottom-split">
        {/* Left Column: Partners & Navigation */}
        <div className="grand-footer-meta-cols">
          <div className="grand-meta-col">
            <span className="grand-col-eyebrow">HACKATHON PARTNERS</span>
            <div className="grand-partners-grid">
              <div className="partner-item">Anthropic</div>
              <div className="partner-item">TrueFoundry</div>
              <div className="partner-item">Qodo</div>
              <div className="partner-item">Linear</div>
              <div className="partner-item">MCP Protocol</div>
              <div className="partner-item">Docker Sandboxes</div>
            </div>
          </div>

          <div className="grand-meta-col">
            <span className="grand-col-eyebrow">HARNESS</span>
            <ul className="grand-links-list">
              <li>
                <button type="button" onClick={onLaunchStudio} className="grand-inline-link">
                  Launch Studio
                </button>
              </li>
              <li><a href="#moves">The Four Moves</a></li>
              <li><a href="#pillars">Architecture</a></li>
              <li><a href="#demo">Live Demo</a></li>
              <li>
                <a 
                  href="https://github.com/beastzex/Agents_In_Harness_repo" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Giant Year / Edition Typography */}
        <div className="grand-footer-year-col">
          <span className="grand-giant-year">2026</span>
        </div>
      </div>
    </footer>
  );
};
