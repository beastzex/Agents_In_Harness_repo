import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Cpu, Activity, ShieldCheck, Zap } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ProjectsSplitProps {
  onLaunchStudio: () => void;
}

const AGENT_MODULES = [
  {
    id: 'spatial-engine-ai',
    number: '01',
    title: 'Spatial_EngineAI',
    subtitle: 'Sandboxed 2D/3D Layout & Clearance Math Validator',
    category: 'CORE SPATIAL ENGINE',
    description: 'An autonomous agent harness that executes Python geometric scripts in isolated TrueFoundry sandboxes to calculate exact furniture footprint placement, walkway clearances, and collision-free spatial orientations.',
    techStack: ['TrueFoundry Sandboxes', 'Python Shapely / NumPy', 'Collision Solver', '0.0mm Error Threshold'],
    imageUrl: '/images/four_moves_sandbox.jpg',
    metric: '99.4%',
    metricLabel: 'Spatial Accuracy',
    icon: Zap,
    accentColor: '#FF5B35',
  },
  {
    id: 'catalog-discovery-ai',
    number: '02',
    title: 'Catalog_DiscoveryAI',
    subtitle: 'Autonomous MCP Tool Calling & Live Inventory Search',
    category: 'MCP TOOL INTEGRATION',
    description: 'Standardized Model Context Protocol (MCP) tool integration querying live dimensioned furniture inventory. Evaluates real-time vendor pricing, physical dimensions, material swatches, and stock availability.',
    techStack: ['Model Context Protocol (MCP)', 'Live Inventory Database', 'Vector Search', 'Budget Balancer'],
    imageUrl: '/images/four_moves_search.jpg',
    metric: '100+',
    metricLabel: 'Live Dimensioned Items',
    icon: Cpu,
    accentColor: '#D2C2F8',
  },
  {
    id: 'financial-guard-ai',
    number: '03',
    title: 'Financial_GuardAI',
    subtitle: 'Zero-Trust Approval Gate & Irreversible Execution Authorization',
    category: 'SAFETY & CONTROL HARNESS',
    description: 'Deterministic security gate guaranteeing zero financial outflow without explicit, physical hold-to-approve user confirmation. Locks checkout tools until the human signs the itemized audit breakdown.',
    techStack: ['Hold-to-Approve SVG', 'Zero-Trust Gate', 'Audit Trail Ledger', 'Human-in-the-Loop'],
    imageUrl: '/images/four_moves_approve.jpg',
    metric: '$0',
    metricLabel: 'Spent Without Approval',
    icon: ShieldCheck,
    accentColor: '#CDE3D5',
  },
];

export const ProjectsSplit: React.FC<ProjectsSplitProps> = ({ onLaunchStudio }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const leftStickyRef = useRef<HTMLDivElement>(null);
  const [activeModule, setActiveModule] = useState<number>(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Text Line-by-line reveal for sticky left header
      gsap.fromTo(
        '.projects-reveal-line',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        }
      );

      // 2. Parallax and active module tracking on scroll
      const cards = gsap.utils.toArray<HTMLElement>('.project-card-item');
      cards.forEach((card, index) => {
        // Inner image parallax inside its container
        const img = card.querySelector<HTMLElement>('.project-image-inner');
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -12 },
            {
              yPercent: 12,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
        }

        // Active module counter update
        ScrollTrigger.create({
          trigger: card,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveModule(index),
          onEnterBack: () => setActiveModule(index),
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="projects-split-section" id="projects" ref={sectionRef}>
      <div className="projects-split-container">
        {/* Left Sticky 50% Column */}
        <div className="projects-sticky-left" ref={leftStickyRef}>
          <div className="sticky-content-inner">
            <div className="sticky-eyebrow-box">
              <span className="sticky-num-badge">01</span>
              <span className="sticky-eyebrow-text">AGENT HARNESS ARCHITECTURE</span>
            </div>

            <h2 className="sticky-main-title">
              <span className="line-wrapper">
                <span className="projects-reveal-line">Three autonomous</span>
              </span>
              <span className="line-wrapper">
                <span className="projects-reveal-line">sub-agents under</span>
              </span>
              <span className="line-wrapper">
                <span className="projects-reveal-line">deterministic control.</span>
              </span>
            </h2>

            <p className="sticky-description">
              ReDessIo is built for the Agent Harness Hackathon. We replace speculative hallucination with live MCP tool querying, sandboxed TrueFoundry Python geometry validation, and a strict hold-to-approve financial gate.
            </p>

            {/* Active Status Tracker */}
            <div className="sticky-active-indicator">
              <div className="indicator-header">
                <Activity size={14} className="indicator-pulse" />
                <span className="indicator-label">ACTIVE SUB-AGENT ({activeModule + 1}/3)</span>
              </div>
              <div className="indicator-name">
                {AGENT_MODULES[activeModule].title}
              </div>
            </div>

            <div className="sticky-action-wrap">
              <button 
                type="button" 
                className="btn-sticky-cta"
                onClick={onLaunchStudio}
              >
                <span>Launch in ReDessIo Studio</span>
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Scrolling 50% Column */}
        <div className="projects-scrolling-right">
          {AGENT_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.id} className="project-card-item" id={module.id}>
                <div className="project-card-top">
                  <div className="project-index-badge">
                    <span className="card-number-text">{module.number}</span>
                    <span className="card-category-text">{module.category}</span>
                  </div>
                  <div className="project-icon-box" style={{ borderColor: module.accentColor }}>
                    <Icon size={20} />
                  </div>
                </div>

                {/* Parallax Image Container with 4-5% custom hover scale */}
                <div className="project-image-container">
                  <img 
                    src={module.imageUrl} 
                    alt={module.title}
                    className="project-image-inner" 
                  />
                  <div className="image-overlay-badge">
                    <span className="metric-bold">{module.metric}</span>
                    <span className="metric-desc">{module.metricLabel}</span>
                  </div>
                </div>

                <div className="project-card-body">
                  <h3 className="project-title-text">{module.title}</h3>
                  <h4 className="project-subtitle-text">{module.subtitle}</h4>
                  <p className="project-paragraph-text">{module.description}</p>

                  <div className="project-tags-row">
                    {module.techStack.map((tech, idx) => (
                      <span key={idx} className="project-tech-pill">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    className="project-card-action"
                    onClick={onLaunchStudio}
                  >
                    <span>Test Sub-Agent in Studio</span>
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
