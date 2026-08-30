import React, { useState } from 'react';
import { ArrowRight, DollarSign, Image as ImageIcon, Check, ShieldCheck, Layers, Ruler, Box, Palette } from 'lucide-react';
import { RoomSpec, RoomStyle, RoomType } from '../../types/studio';

interface SetupScreenProps {
  onStartDesign: (spec: RoomSpec) => void;
  onBackToLanding: () => void;
}

const STYLES: { id: RoomStyle; title: string; desc: string; palette: string[] }[] = [
  {
    id: 'warm-minimalist',
    title: 'Warm Minimalist',
    desc: 'Bouclé textures, unlacquered brass, travertine, natural white oak',
    palette: ['#F5F1EA', '#D9532F', '#5E5B54', '#FFFFFF'],
  },
  {
    id: 'japandi',
    title: 'Japandi & Wabi-Sabi',
    desc: 'Washi paper diffusion, black bamboo accents, organic stoneware',
    palette: ['#ECE6DB', '#384A36', '#8C877E', '#2B2A27'],
  },
  {
    id: 'mid-century',
    title: 'Mid-Century Editorial',
    desc: 'Warm walnut grains, tailored olive upholstery, sculpted silhouettes',
    palette: ['#EADBC8', '#9E351E', '#4A5B48', '#191817'],
  },
  {
    id: 'organic-modern',
    title: 'Organic Earth',
    desc: 'Unbleached linen, raw terracotta, fluted stone, textured jute',
    palette: ['#F7F3EC', '#D9532F', '#A39281', '#403B35'],
  },
];

const ROOM_TYPES: { id: RoomType; label: string }[] = [
  { id: 'living-room', label: 'Living Room' },
  { id: 'bedroom', label: 'Primary Bedroom' },
  { id: 'home-office', label: 'Creative Studio' },
  { id: 'dining-room', label: 'Dining Space' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartDesign, onBackToLanding }) => {
  const [lengthFeet, setLengthFeet] = useState<number>(14);
  const [widthFeet, setWidthFeet] = useState<number>(18);
  const [heightFeet, setHeightFeet] = useState<number>(9);
  const [budgetLimit, setBudgetLimit] = useState<number>(4000);
  const [style, setStyle] = useState<RoomStyle>('warm-minimalist');
  const [roomType, setRoomType] = useState<RoomType>('living-room');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartDesign({
      lengthFeet,
      widthFeet,
      heightFeet,
      budgetLimit,
      style,
      roomType,
      beforePhotoUrl: '/images/default_before_room.jpg',
    });
  };

  return (
    <div className="setup-screen-container">
      {/* Studio Header */}
      <header className="setup-nav-header">
        <div className="setup-nav-inner">
          <div className="setup-brand-row">
            <div className="bar-brand">
              <span className="brand-primary">ReDessIo</span>
              <span className="brand-badge">STUDIO</span>
            </div>
            <button type="button" className="btn-setup-back" onClick={onBackToLanding}>
              ← Return to Landing Page
            </button>
          </div>

          <div className="setup-badge-security">
            <ShieldCheck size={14} />
            <span>SAFETY GATE ACTIVE ($0 AUTO-PURCHASE)</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="setup-main-content">
        <div className="setup-intro-box">
          <div className="setup-step-pill">
            <Layers size={14} />
            <span>STEP 01 OF 02 · ROOM DEFINITION</span>
          </div>
          <h1 className="setup-main-title">Configure your space parameters.</h1>
          <p className="setup-subtitle">
            Provide your exact room footprint, financial ceiling, and aesthetic direction. The autonomous agent will compute physical clearances and stream live inventory matching your criteria.
          </p>
        </div>

        <form className="setup-form-grid" onSubmit={handleStart}>
          {/* Left Column: Dimensions & Budget */}
          <div className="setup-col-card">
            <div className="setup-card-header">
              <Ruler size={20} className="card-header-icon" />
              <div>
                <h3 className="setup-card-title">Room Dimensions &amp; Footprint</h3>
                <p className="setup-card-desc">Accurate bounds are required for spatial collision testing in sandbox.</p>
              </div>
            </div>

            <div className="dimensions-input-row">
              <div className="dimension-field">
                <label htmlFor="dim-length">Length</label>
                <div className="input-with-unit">
                  <input
                    id="dim-length"
                    type="number"
                    min={8}
                    max={60}
                    value={lengthFeet}
                    onChange={(e) => setLengthFeet(Number(e.target.value))}
                    required
                  />
                  <span className="unit-label">ft</span>
                </div>
              </div>

              <div className="dimension-field">
                <label htmlFor="dim-width">Width</label>
                <div className="input-with-unit">
                  <input
                    id="dim-width"
                    type="number"
                    min={8}
                    max={60}
                    value={widthFeet}
                    onChange={(e) => setWidthFeet(Number(e.target.value))}
                    required
                  />
                  <span className="unit-label">ft</span>
                </div>
              </div>

              <div className="dimension-field">
                <label htmlFor="dim-height">Height</label>
                <div className="input-with-unit">
                  <input
                    id="dim-height"
                    type="number"
                    min={7}
                    max={24}
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(Number(e.target.value))}
                    required
                  />
                  <span className="unit-label">ft</span>
                </div>
              </div>
            </div>

            <div className="dimension-summary-calc">
              <span>Total Usable Floor Footprint:</span>
              <strong>{lengthFeet * widthFeet} sq. ft. ({((lengthFeet * widthFeet) * 0.092903).toFixed(1)} m²)</strong>
            </div>

            {/* Room Type Selector */}
            <div className="room-type-group">
              <label className="field-label">Space Type</label>
              <div className="room-type-chips">
                {ROOM_TYPES.map((rt) => (
                  <button
                    key={rt.id}
                    type="button"
                    className={`type-chip ${roomType === rt.id ? 'active' : ''}`}
                    onClick={() => setRoomType(rt.id)}
                  >
                    <Box size={14} />
                    <span>{rt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Limit Slider */}
            <div className="budget-slider-section">
              <div className="budget-label-row">
                <label htmlFor="budget-slider" className="field-label">
                  <DollarSign size={14} />
                  <span>Maximum Budget Ceiling</span>
                </label>
                <span className="budget-value-display">${budgetLimit.toLocaleString()}</span>
              </div>

              <input
                id="budget-slider"
                type="range"
                min={1500}
                max={15000}
                step={250}
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                className="budget-range-input"
              />

              <div className="budget-preset-chips">
                {[2500, 4000, 7500, 12000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset-btn ${budgetLimit === preset ? 'selected' : ''}`}
                    onClick={() => setBudgetLimit(preset)}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Style & Before Photo */}
          <div className="setup-col-card">
            <div className="setup-card-header">
              <Palette size={20} className="card-header-icon" />
              <div>
                <h3 className="setup-card-title">Aesthetic Direction &amp; Style</h3>
                <p className="setup-card-desc">Guides the agent's MCP vector retrieval algorithm.</p>
              </div>
            </div>

            <div className="style-cards-grid">
              {STYLES.map((st) => (
                <div
                  key={st.id}
                  className={`style-selection-card ${style === st.id ? 'selected-style' : ''}`}
                  onClick={() => setStyle(st.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="style-card-top">
                    <h4 className="style-title">{st.title}</h4>
                    {style === st.id && (
                      <div className="style-check-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                  <p className="style-desc">{st.desc}</p>
                  <div className="style-palette-swatches">
                    {st.palette.map((color, i) => (
                      <span key={i} className="swatch" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Before Photo Preview Slot */}
            <div className="before-photo-slot">
              <div className="photo-preview-box">
                <img
                  src="/images/default_before_room.jpg"
                  alt="Room before renovation"
                  className="before-photo-img"
                />
                <div className="photo-tag-overlay">
                  <ImageIcon size={13} />
                  <span>Default Reference Room: {lengthFeet}' × {widthFeet}' Space</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="setup-action-row">
              <button type="submit" className="btn-launch-autonomous-loop" id="btn-start-agent-session">
                <span>Start Autonomous Design Loop</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
