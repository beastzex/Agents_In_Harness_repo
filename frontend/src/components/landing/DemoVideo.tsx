import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Terminal, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const DemoVideo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Thumbnail container scales/fades in on scroll entry
      gsap.fromTo(
        '.demo-video-wrapper',
        { scale: 0.94, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.demo-video-wrapper',
            start: 'top 80%',
          },
        }
      );

      // 2. Play button slow, subtle pulse
      gsap.to('.btn-play-trigger', {
        scale: 1.08,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // 3. Lightbox animation on open
  useEffect(() => {
    if (isPlaying && lightboxRef.current && modalContentRef.current) {
      gsap.fromTo(
        lightboxRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalContentRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', delay: 0.05 }
      );
    }
  }, [isPlaying]);

  const handleCloseLightbox = () => {
    if (lightboxRef.current && modalContentRef.current) {
      gsap.to(modalContentRef.current, {
        scale: 0.92,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      });
      gsap.to(lightboxRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => setIsPlaying(false),
      });
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <section className="demo-section" id="demo" ref={sectionRef}>
      <div className="demo-container">
        <div className="demo-header">
          <span className="section-eyebrow">AGENT WORKFLOW WALKTHROUGH</span>
          <h2 className="demo-title">See ReDessIo run a real room renovation live.</h2>
          <p className="demo-subtitle">
            From initial dimensional ingestion through sandboxed constraint solver runs to final human checkout confirmation.
          </p>
        </div>

        {/* Video Frame Slot */}
        <div className="demo-video-wrapper">
          <div className="demo-video-frame">
            <div className="demo-poster" onClick={() => setIsPlaying(true)}>
              <div className="demo-poster-backdrop">
                <div className="mock-studio-preview">
                  <div className="preview-terminal-bar">
                    <Terminal size={14} />
                    <span>ReDessIo Autonomous Engine · Session #8492</span>
                    <span className="badge-live">LIVE EXECUTION</span>
                  </div>
                  <div className="preview-body-mock">
                    <div className="mock-stream-line">
                      <span className="mock-time">[00:01.42]</span>
                      <span className="mock-event">agent_thought:</span> Analyzing 14ft x 18ft living space geometry...
                    </div>
                    <div className="mock-stream-line">
                      <span className="mock-time">[00:03.18]</span>
                      <span className="mock-tool">tool_call (mcp_catalog):</span> searching query "warm minimalist sofa" &lt; $2,200
                    </div>
                    <div className="mock-stream-line">
                      <span className="mock-time">[00:05.90]</span>
                      <span className="mock-sandbox">sandbox_exec:</span> constraint solver verifying 42in clearance path... PASS
                    </div>
                  </div>
                </div>
              </div>

              <div className="play-button-overlay">
                <button type="button" className="btn-play-trigger" aria-label="Play Walkthrough Video">
                  <Play size={28} fill="currentColor" />
                </button>
                <span className="play-caption">Watch 2-Minute Architecture Walkthrough</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isPlaying && (
        <div className="demo-lightbox-overlay" ref={lightboxRef} onClick={handleCloseLightbox}>
          <div 
            className="demo-lightbox-modal" 
            ref={modalContentRef} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-top-bar">
              <span className="lightbox-title">ReDessIo System Architecture Walkthrough</span>
              <button 
                type="button" 
                className="btn-lightbox-close" 
                onClick={handleCloseLightbox}
                aria-label="Close walkthrough video"
              >
                <X size={20} />
              </button>
            </div>

            <div className="lightbox-video-area">
              <div className="video-placeholder-playing">
                <Sparkles size={40} className="spinning-icon" />
                <h3>Architecture Walkthrough Session</h3>
                <p>Live stream presentation illustrating tool loop &amp; human gate.</p>
                <span className="video-note">Ready to embed full MP4 or YouTube embed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
