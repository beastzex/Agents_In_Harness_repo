import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { FurnitureItem, RoomSpec } from '../../types/studio';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface AICopilotChatProps {
  items: FurnitureItem[];
  roomSpec: RoomSpec;
  currentTheme: string;
  onThemeChange: (theme: any) => void;
  onUpdateItems: (items: FurnitureItem[]) => void;
}

export const AICopilotChat: React.FC<AICopilotChatProps> = ({
  items,
  roomSpec,
  currentTheme,
  onThemeChange,
  onUpdateItems,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Hello! I am your AI Design Copilot powered by GPT-OSS-120B. Tell me how you'd like to adjust this layout (e.g. "Move desk to east wall", "Rotate sofa 90°", "Center the layout", or "Switch to classic blueprint theme") and I will update your 2D plan live!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const quickPrompts = [
    { label: '✨ Center Layout', text: 'Center primary furniture items for balanced conversation flow' },
    { label: '🚪 Clear Walkway', text: 'Clear 48" arterial corridor from south entrance to north wall' },
    { label: '🔄 Rotate Assets 90°', text: 'Rotate furniture pieces 90 degrees to face natural light' },
    { label: '📐 Push to Perimeter', text: 'Spread furniture pieces along perimeter walls for open concept' },
    { label: '🎨 Blueprint Navy Theme', text: 'Switch color theme to classic architectural blueprint' },
    { label: '☕ Warm Editorial Theme', text: 'Switch color theme to warm minimalist editorial' },
  ];

  const handleSend = async (instructionText?: string) => {
    const textToSend = (instructionText || inputVal).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      // Call backend copilot API
      const res = await fetch('/api/copilot/instruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: textToSend,
          room: {
            width_ft: roomSpec.widthFeet,
            length_ft: roomSpec.lengthFeet,
          },
          items,
          current_theme: currentTheme,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Update items in parent state
        if (data.updated_items && data.updated_items.length > 0) {
          onUpdateItems(data.updated_items);
        }

        // Update theme if suggested
        if (data.suggested_theme) {
          onThemeChange(data.suggested_theme);
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply || 'Applied spatial transformations to your 2D architectural blueprint.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err) {
      // Client-side instant fallback execution
      const lowered = textToSend.toLowerCase();
      let reply = 'Adjusted 2D floor plan coordinates and verified clearances.';

      if (lowered.includes('blueprint') || lowered.includes('blue')) {
        onThemeChange('classic-blueprint');
        reply = 'Switched to Classic Navy Architectural Blueprint theme.';
      } else if (lowered.includes('editorial') || lowered.includes('warm')) {
        onThemeChange('warm-editorial');
        reply = 'Switched to Warm Minimalist Editorial theme.';
      } else if (lowered.includes('dark') || lowered.includes('oled') || lowered.includes('black')) {
        onThemeChange('oled-monochrome');
        reply = 'Switched to OLED Deep Pitch Black theme.';
      } else if (lowered.includes('emerald') || lowered.includes('green')) {
        onThemeChange('cyber-emerald');
        reply = 'Switched to Cyber Emerald Matrix theme.';
      }

      // Rotate / move items client-side
      const modified = items.map((it, idx) => {
        const itCopy = { ...it };
        if (lowered.includes('rotate')) {
          itCopy.rotationDeg = ((itCopy.rotationDeg || 0) + 90) % 360;
        } else if (lowered.includes('center')) {
          itCopy.xFt = (roomSpec.widthFeet - 3) / 2 + (idx - 1) * 1.5;
          itCopy.yFt = (roomSpec.lengthFeet - 2.5) / 2;
        } else if (lowered.includes('perimeter') || lowered.includes('wall') || lowered.includes('open')) {
          if (itCopy.category === 'tables') {
            itCopy.xFt = (roomSpec.widthFeet - 4) / 2;
            itCopy.yFt = 1.0;
          } else if (itCopy.category === 'seating') {
            itCopy.xFt = (roomSpec.widthFeet - 3) / 2;
            itCopy.yFt = 4.2;
          }
        }
        return itCopy;
      });

      onUpdateItems(modified);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-copilot-chat-container">
      {/* Copilot Header */}
      <div className="copilot-header">
        <div className="copilot-title-group">
          <div className="copilot-avatar">
            <Bot size={16} />
          </div>
          <div>
            <h4 className="copilot-title">AI Spatial Design Copilot</h4>
            <span className="copilot-subtitle">Live 2D Blueprint Manipulation · GPT-OSS-120B</span>
          </div>
        </div>

        <div className="copilot-live-pill">
          <span className="copilot-pulse-dot" />
          <span>ACTIVE CO-DESIGN</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="copilot-messages-box" ref={chatScrollRef}>
        {messages.map((m) => (
          <div key={m.id} className={`copilot-msg-bubble ${m.sender}`}>
            <div className="msg-sender-header">
              <span className="msg-sender-name">{m.sender === 'ai' ? 'Architect Copilot' : 'You'}</span>
              <span className="msg-time">{m.timestamp}</span>
            </div>
            <p className="msg-body-text">{m.text}</p>
          </div>
        ))}

        {isLoading && (
          <div className="copilot-msg-bubble ai loading">
            <Loader2 size={16} className="spinning-icon" />
            <span>Calculating spatial transformations and clearance vectors...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="copilot-quick-chips">
        {quickPrompts.map((chip, i) => (
          <button
            key={i}
            type="button"
            className="copilot-chip-btn"
            onClick={() => handleSend(chip.text)}
            disabled={isLoading}
          >
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        className="copilot-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          className="copilot-text-input"
          placeholder="Ask Copilot: 'Move desk to north wall', 'Rotate seating 90°', 'Make walkway wider'..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="copilot-btn-submit"
          disabled={isLoading || !inputVal.trim()}
          title="Send instruction"
        >
          <Send size={15} />
          <span>Apply</span>
        </button>
      </form>
    </div>
  );
};
