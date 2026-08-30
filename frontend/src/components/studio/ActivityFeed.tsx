import React, { useEffect, useRef } from 'react';
import { Terminal, Cpu, Box, Sparkles, CheckCircle2, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { AgentEvent } from '../../types/studio';

interface ActivityFeedProps {
  events: AgentEvent[];
  activeFilter: 'all' | 'thoughts' | 'tools' | 'sandbox';
  onFilterChange: (filter: 'all' | 'thoughts' | 'tools' | 'sandbox') => void;
  isStreaming: boolean;
  onFastTrack?: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  events,
  activeFilter,
  onFilterChange,
  isStreaming,
  onFastTrack,
}) => {
  const feedEndRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // Smooth auto-scroll to bottom on new event arrival
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [events]);

  const filteredEvents = events.filter((ev) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'thoughts') return ev.type === 'agent_thought';
    if (activeFilter === 'tools') return ev.type === 'tool_call' || ev.type === 'tool_result';
    if (activeFilter === 'sandbox') return ev.type === 'sandbox_start' || ev.type === 'sandbox_result';
    return true;
  });

  const renderEventIcon = (ev: AgentEvent) => {
    switch (ev.type) {
      case 'agent_thought':
        return <Sparkles size={16} className="event-icon icon-thought" />;
      case 'tool_call':
      case 'tool_result':
        return <Terminal size={16} className="event-icon icon-tool" />;
      case 'sandbox_start':
      case 'sandbox_result':
        return <Cpu size={16} className="event-icon icon-sandbox" />;
      case 'moodboard_add':
        return <Box size={16} className="event-icon icon-placed" />;
      case 'agent_halt_for_approval':
        return <ShieldAlert size={16} className="event-icon icon-gate" />;
      default:
        return <CheckCircle2 size={16} className="event-icon icon-default" />;
    }
  };

  return (
    <div className="activity-feed-panel">
      {/* Activity Feed Header */}
      <div className="feed-header">
        <div className="feed-title-row">
          <div className="live-indicator-dot">
            {isStreaming && <span className="ping-wave" />}
            <span className="dot" />
          </div>
          <h3 className="feed-title">Agent Runtime Stream</h3>
          <span className="event-count-badge">{events.length} events</span>
        </div>

        {/* Filter Pills */}
        <div className="feed-filter-bar">
          <button
            type="button"
            className={`feed-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`feed-filter-pill ${activeFilter === 'thoughts' ? 'active' : ''}`}
            onClick={() => onFilterChange('thoughts')}
          >
            Thoughts
          </button>
          <button
            type="button"
            className={`feed-filter-pill ${activeFilter === 'tools' ? 'active' : ''}`}
            onClick={() => onFilterChange('tools')}
          >
            MCP Tools
          </button>
          <button
            type="button"
            className={`feed-filter-pill ${activeFilter === 'sandbox' ? 'active' : ''}`}
            onClick={() => onFilterChange('sandbox')}
          >
            Sandbox Math
          </button>
        </div>
      </div>

      {/* Events List Container */}
      <div className="feed-scroll-container" ref={feedContainerRef}>
        {filteredEvents.length === 0 ? (
          <div className="feed-empty-state">
            <Loader2 size={24} className="spinning-icon" />
            <p>Awaiting first agent thought...</p>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isInFlight = ev.meta?.status === 'in_flight';
            const isResolved = ev.meta?.status === 'resolved';

            return (
              <div
                key={ev.id}
                className={`feed-event-card type-${ev.type} ${isInFlight ? 'in-flight' : ''} ${isResolved ? 'resolved' : ''}`}
              >
                <div className="event-card-header">
                  <div className="event-type-badge">
                    {renderEventIcon(ev)}
                    <span className="event-type-label">{ev.type.replace('_', ' ')}</span>
                  </div>

                  {isInFlight && (
                    <div className="inflight-badge">
                      <span className="inflight-pulse-dot" />
                      <span>IN FLIGHT</span>
                    </div>
                  )}

                  {isResolved && (
                    <div className="resolved-badge">
                      <CheckCircle2 size={12} />
                      <span>VERIFIED</span>
                    </div>
                  )}

                  <span className="event-timestamp">{ev.timestamp}</span>
                </div>

                <div className="event-card-body">
                  <h4 className="event-card-title">{ev.title}</h4>
                  <p className="event-card-text">{ev.content}</p>

                  {/* Sandbox Code Preview */}
                  {ev.meta?.sandboxCode && (
                    <div className="event-code-snippet">
                      <div className="code-header">
                        <Terminal size={12} />
                        <span>python_sandbox_exec.py</span>
                      </div>
                      <pre><code>{ev.meta.sandboxCode}</code></pre>
                    </div>
                  )}

                  {/* Item Price Pill if Placed */}
                  {ev.meta?.item && (
                    <div className="event-item-meta-row">
                      <span className="item-meta-name">{ev.meta.item.name}</span>
                      <span className="item-meta-price">${ev.meta.item.price.toLocaleString()}</span>
                      <span className="item-meta-vendor">{ev.meta.item.vendor}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={feedEndRef} style={{ height: '1px' }} />
      </div>

      {/* Stream Control Bar */}
      {isStreaming && onFastTrack && (
        <div className="feed-footer-controls">
          <button type="button" className="btn-fast-track" onClick={onFastTrack}>
            <span>Fast-track Stream to Approval Gate</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
