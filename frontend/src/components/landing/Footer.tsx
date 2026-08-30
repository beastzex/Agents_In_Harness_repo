import React, { useEffect, useRef } from 'react';
import { Sparkles, Github, ArrowUpRight } from 'lucide-react';
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
        '.footer-top-container, .footer-watermark-row, .footer-bottom-bar',
        { y: 25, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 85%',
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer className="site-footer" id="about" ref={footerRef}>
      <div className="footer-top-container">
        {/* Brand Column */}
        <div className="footer-brand-col">
          <div className="footer-brand-logo">
            <span className="brand-primary">ReDessIo</span>
            <span className="brand-badge">ARCHITECT</span>
          </div>
          <p className="footer-mission">
            The autonomous spatial renovation agent with hard-coded financial safety gates. Built with real MCP tool execution, sandboxed constraint mathematics, and human-in-the-loop governance.
          </p>
          <div className="footer-tagline">
            <Sparkles size={14} className="tagline-icon" />
            <span>Built for the Agent Harness Hackathon 2026</span>
          </div>
        </div>

        {/* Links Columns */}
        <div className="footer-links-grid">
          <div className="footer-col">
            <span className="footer-col-title">NAVIGATION</span>
            <ul className="footer-list">
              <li><a href="#hero">Overview</a></li>
              <li><a href="#moves">The Four Moves</a></li>
              <li><a href="#pillars">Three Pillars</a></li>
              <li><a href="#demo">Demo Video</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">PRODUCT</span>
            <ul className="footer-list">
              <li>
                <button type="button" onClick={onLaunchStudio} className="footer-action-link">
                  Launch Studio
                  <ArrowUpRight size={14} />
                </button>
              </li>
              <li><a href="#partners">Integrations</a></li>
              <li><a href="#stats">Benchmarks</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">COMMUNITY & REPO</span>
            <ul className="footer-list">
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-social-link">
                  <Github size={15} />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li><a href="#about">Project Documentation</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Giant Watermark Typography (like stateofaidesign.com 2026 footer watermark) */}
      <div className="footer-watermark-row" aria-hidden="true">
        <span className="footer-watermark">ReDessIo 2026</span>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-content">
          <span className="footer-copyright">
            © 2026 ReDessIo. All rights reserved.
          </span>
          <span className="footer-credits">
            Powered by TrueFoundry &amp; Qodo · Designed with Warm Light Editorial Aesthetics
          </span>
        </div>
      </div>
    </footer>
  );
};
