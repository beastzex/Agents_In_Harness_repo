import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Plus } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface NavbarProps {
  onLaunchStudio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLaunchStudio }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Load animation: wordmark & links fade+slide down, CTA scales in with overshoot
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.brand-logo',
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, delay: 0.1 }
      )
      .fromTo(
        '.nav-links .nav-link',
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.08 },
        '-=0.45'
      )
      .fromTo(
        '#nav-launch-studio-btn',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' },
        '-=0.25'
      );

      // 2. ScrollTrigger for nav background transition past 50px
      ScrollTrigger.create({
        start: 'top -50px',
        toggleClass: {
          targets: navRef.current,
          className: 'nav-scrolled',
        },
      });
    }, navRef);

    return () => ctx.revert();
  }, []);

  // 3. Mobile menu clip-path reveal
  useEffect(() => {
    if (mobileMenuOpen && menuOverlayRef.current) {
      gsap.fromTo(
        menuOverlayRef.current,
        { clipPath: 'circle(0% at calc(100% - 36px) 36px)', opacity: 0.8 },
        { clipPath: 'circle(150% at calc(100% - 36px) 36px)', opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.mobile-nav-links > *',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, delay: 0.15, ease: 'power3.out' }
      );
    }
  }, [mobileMenuOpen]);

  const handleToggleMenu = () => {
    if (mobileMenuOpen && menuOverlayRef.current) {
      gsap.to(menuOverlayRef.current, {
        clipPath: 'circle(0% at calc(100% - 36px) 36px)',
        duration: 0.45,
        ease: 'power3.in',
        onComplete: () => setMobileMenuOpen(false),
      });
    } else {
      setMobileMenuOpen(true);
    }
  };

  return (
    <header className="site-nav" ref={navRef}>
      <div className="nav-container">
        {/* Brand Wordmark */}
        <a href="#hero" className="brand-logo">
          <span className="brand-primary">ReDessIo</span>
          <span className="brand-badge">ARCHITECT</span>
        </a>

        {/* Desktop Links */}
        <nav className="nav-links desktop-only">
          <a href="#projects" className="nav-link">Sub-Agents</a>
          <a href="#experience" className="nav-link">Benchmarks</a>
          <a href="#moves" className="nav-link">Four Moves</a>
          <a href="#pillars" className="nav-link">Architecture</a>
        </nav>

        {/* CTA Launch Studio */}
        <div className="nav-actions desktop-only">
          <button 
            type="button" 
            className="btn-launch-primary"
            onClick={onLaunchStudio}
            id="nav-launch-studio-btn"
          >
            <span>Launch Studio</span>
            <Plus className="btn-icon" size={16} />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          ref={menuToggleRef}
          type="button" 
          className="mobile-menu-toggle mobile-only"
          onClick={handleToggleMenu}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" ref={menuOverlayRef}>
          <nav className="mobile-nav-links">
            <a href="#projects" onClick={() => setMobileMenuOpen(false)}>Sub-Agents</a>
            <a href="#experience" onClick={() => setMobileMenuOpen(false)}>Benchmarks</a>
            <a href="#moves" onClick={() => setMobileMenuOpen(false)}>Four Moves</a>
            <a href="#pillars" onClick={() => setMobileMenuOpen(false)}>Architecture</a>
            <button 
              type="button" 
              className="btn-launch-primary mobile-cta"
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchStudio();
              }}
            >
              <span>Launch Studio</span>
              <Plus size={18} />
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
