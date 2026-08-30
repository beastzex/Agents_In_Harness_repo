import React from 'react';

const HACKATHON_STACK = [
  { name: 'TrueFoundry', category: 'Agent Orchestration & Sandboxed Runtime', tag: 'OFFICIAL SPONSOR' },
  { name: 'Qodo', category: 'Code Verification & Automated Tool Testing', tag: 'OFFICIAL SPONSOR' },
  { name: 'Anthropic Claude 3.7', category: 'Agent Reasoning & Planning Core', tag: 'LLM ENGINE' },
  { name: 'Model Context Protocol', category: 'MCP Tool Integration & Standard APIs', tag: 'TOOL PROTOCOL' },
  { name: 'Docker Sandboxes', category: 'Isolated Python Clearance Math Execution', tag: 'RUNTIME SANDBOX' },
  { name: 'LangGraph', category: 'Cyclic State & Human-in-the-Loop Harness', tag: 'AGENT FRAMEWORK' },
  { name: 'FastAPI Runtime', category: 'Real-time Event Streaming & WebSockets', tag: 'BACKEND' },
  { name: 'Vector Catalog DB', category: 'Dimensioned Furniture Inventory & Specs', tag: 'EMBEDDINGS' },
];

export const Marquee: React.FC = () => {
  return (
    <section className="marquee-section" id="marquee">
      <div className="marquee-label-bar">
        <span className="marquee-eyebrow">AGENT HARNESS HACKATHON TECH STACK &amp; SPONSORS</span>
      </div>

      <div className="marquee-track-wrapper">
        <div className="marquee-track">
          {/* First sequence */}
          {HACKATHON_STACK.map((item, index) => (
            <div key={`s1-${index}`} className="marquee-item">
              <span className="marquee-item-name">{item.name}</span>
              <span className="marquee-item-badge">{item.tag}</span>
              <span className="marquee-item-category">{item.category}</span>
              <div className="marquee-item-dot" />
            </div>
          ))}

          {/* Duplicate sequence for seamless infinite loop */}
          {HACKATHON_STACK.map((item, index) => (
            <div key={`s2-${index}`} className="marquee-item">
              <span className="marquee-item-name">{item.name}</span>
              <span className="marquee-item-badge">{item.tag}</span>
              <span className="marquee-item-category">{item.category}</span>
              <div className="marquee-item-dot" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
