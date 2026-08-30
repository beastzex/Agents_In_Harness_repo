import React, { useEffect, useRef } from 'react';
import { Award, ShieldCheck, Code, CheckCircle, Terminal } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const ExperienceGrid: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Line-by-line reveal for title
      gsap.fromTo(
        '.grid-reveal-line',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        }
      );

      // 2. Staggered card entrance with subtle scale
      gsap.fromTo(
        '.masonry-card',
        { y: 60, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.masonry-grid-wrapper',
            start: 'top 75%',
          },
        }
      );

      // 3. Image parallax inside grid containers
      const gridImgs = gsap.utils.toArray<HTMLElement>('.masonry-img-inner');
      gridImgs.forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -10 },
          {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: {
              trigger: img.closest('.masonry-card'),
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="experience-grid-section" id="experience" ref={sectionRef}>
      <div className="experience-container">
        {/* Header */}
        <div className="experience-header">
          <div className="section-eyebrow">02 / BENCHMARKS &amp; HACKATHON INNOVATIONS</div>
          <h2 className="experience-title">
            <span className="line-wrapper">
              <span className="grid-reveal-line">Sandboxed execution,</span>
            </span>
            <span className="line-wrapper">
              <span className="grid-reveal-line">tool integrity &amp; benchmarks.</span>
            </span>
          </h2>
          <p className="experience-subtitle">
            Built specifically for the Agent Harness Hackathon. Engineered to eliminate stochastic hallucination through sandboxed Python validation, Qodo tool testing, and deterministic human safety gates.
          </p>
        </div>

        {/* Asymmetrical Masonry Grid */}
        <div className="masonry-grid-wrapper">
          {/* Card 1 (Large Featured - TrueFoundry Sandboxed Agent Execution) */}
          <div className="masonry-card card-span-2 card-highlight">
            <div className="masonry-card-top">
              <div className="masonry-badge">
                <Terminal size={14} />
                <span>TRUEFOUNDRY INTEGRATION</span>
              </div>
              <span className="masonry-year">ISOLATED DOCKER RUNTIME</span>
            </div>

            <div className="masonry-split-layout">
              <div className="masonry-text-col">
                <h3 className="masonry-card-title">Sandboxed Spatial Math</h3>
                <h4 className="masonry-card-role">Python Geometry Execution in TrueFoundry Containers</h4>
                <p className="masonry-card-desc">
                  The ReDessIo agent does not guess spatial fit. It dynamically writes and executes Python scripts using Shapely and NumPy inside TrueFoundry isolated Docker sandboxes to compute door clearance arcs, walkway envelopes, and exact boundary fits.
                </p>

                <ul className="masonry-bullets">
                  <li>
                    <CheckCircle size={14} className="bullet-check" />
                    <span>Executes automated collision testing on all 3D furniture dimensions.</span>
                  </li>
                  <li>
                    <CheckCircle size={14} className="bullet-check" />
                    <span>Returns mathematical verification logs directly to the live activity feed.</span>
                  </li>
                </ul>
              </div>

              {/* Parallax Image Container */}
              <div className="masonry-image-col">
                <div className="masonry-image-container">
                  <img 
                    src="/images/pillar_safe_exec.jpg" 
                    alt="TrueFoundry Sandbox Execution" 
                    className="masonry-img-inner"
                  />
                  <div className="masonry-img-tag">SANDBOX VALIDATION</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 (Qodo Code & Tool Verification) */}
          <div className="masonry-card card-span-1 card-accent-lilac">
            <div className="masonry-card-top">
              <div className="masonry-badge badge-dark">
                <Code size={14} />
                <span>QODO INTEGRATION</span>
              </div>
              <span className="masonry-year">TOOL INTEGRITY</span>
            </div>

            <h3 className="masonry-card-title">Qodo Code Intelligence</h3>
            <h4 className="masonry-card-role">Automated Tool Call &amp; Payload Verification</h4>
            <p className="masonry-card-desc">
              Leveraged Qodo automated code intelligence to validate MCP tool schemas, verify agent decision branching, and ensure deterministic payload delivery during cyclic execution.
            </p>

            <div className="masonry-image-container image-compact">
              <img 
                src="/images/pillar_real_tools.jpg" 
                alt="Qodo Tool Verification" 
                className="masonry-img-inner"
              />
            </div>
          </div>

          {/* Card 3 (Agent Harness Hackathon Benchmark Results) */}
          <div className="masonry-card card-span-1 card-accent-mint">
            <div className="masonry-card-top">
              <div className="masonry-badge badge-dark">
                <Award size={14} />
                <span>HACKATHON BENCHMARK</span>
              </div>
              <span className="masonry-year">100+ ROOM TESTS</span>
            </div>

            <h3 className="masonry-card-title">Spatial Precision Benchmark</h3>
            <h4 className="masonry-card-role">Autonomous Layout Evaluation</h4>
            <p className="masonry-card-desc">
              Evaluated across 100 procedural rooms with varied aspect ratios and budget limits ($2,000–$10,000), achieving flawless clearance accuracy and zero budget overruns.
            </p>

            <div className="masonry-metric-box">
              <span className="masonry-metric-val">99.4%</span>
              <span className="masonry-metric-lbl">Spatial clearance accuracy across all simulated test configurations</span>
            </div>
          </div>

          {/* Card 4 (Zero-Trust Financial Gate Guarantee) */}
          <div className="masonry-card card-span-2 card-dark">
            <div className="masonry-card-top">
              <div className="masonry-badge badge-orange">
                <ShieldCheck size={14} />
                <span>SAFETY HARNESS STANDARD</span>
              </div>
              <span className="masonry-year">ZERO-TRUST PROTOCOL</span>
            </div>

            <div className="masonry-footer-quote">
              <blockquote className="masonry-quote-text">
                "Autonomous AI interior agents should have the power to search and design with real tools, but never the permission to spend money without explicit human authorization."
              </blockquote>
              <div className="masonry-quote-author">
                <strong>ReDessIo Architecture Team</strong> — Agent Harness Hackathon 2026 (TrueFoundry &amp; Qodo)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
