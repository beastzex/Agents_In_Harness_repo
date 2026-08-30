import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Compass, Layers, Info, ZoomIn, ZoomOut, RotateCcw, 
  Maximize2, Minimize2, SlidersHorizontal, BookOpen 
} from 'lucide-react';
import { FurnitureItem, RoomSpec } from '../../types/studio';
import { AICopilotChat } from './AICopilotChat';

export type BlueprintTheme = 'classic-blueprint' | 'cyber-emerald' | 'warm-editorial' | 'oled-monochrome' | 'cad-architectural';

interface ArchitecturalPlanViewProps {
  items: FurnitureItem[];
  roomSpec: RoomSpec;
  renderMode?: 'cad-realistic' | 'blueprint-grid';
  onUpdateItems?: (items: FurnitureItem[]) => void;
}

export const ArchitecturalPlanView: React.FC<ArchitecturalPlanViewProps> = ({
  items,
  roomSpec,
  renderMode = 'cad-realistic',
  onUpdateItems,
}) => {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [theme, setTheme] = useState<BlueprintTheme>('cad-architectural');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'cad-realistic' | 'blueprint-grid'>(renderMode);

  // Keyboard escape listener for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const roomWidthFt = roomSpec.widthFeet || 16;
  const roomLengthFt = roomSpec.lengthFeet || 12;
  const roomAreaSqFt = roomWidthFt * roomLengthFt;

  // Generous scale & padding around the room so all 4 wall dimension labels and door swing are large and 100% visible
  const padTop = 60;
  const padBottom = 80;
  const padLeft = 85;
  const padRight = 60;
  const scale = 36; // 36px per foot for high-definition CAD architectural display

  const canvasWidth = roomWidthFt * scale;
  const canvasHeight = roomLengthFt * scale;
  const svgWidth = canvasWidth + padLeft + padRight;
  const svgHeight = canvasHeight + padTop + padBottom;

  // Door parameters (South wall entry or custom wall)
  const doorWidthFt = 3.0;
  const doorPosFt = 3.0; // position along south wall from left
  const doorStartX = padLeft + doorPosFt * scale;
  const doorEndX = padLeft + (doorPosFt + doorWidthFt) * scale;
  const doorY = padTop + canvasHeight;
  const doorArcRadius = doorWidthFt * scale;

  // Theme palettes configuration
  const themeStyles: Record<BlueprintTheme, any> = {
    'cad-architectural': {
      wrapperBg: '#FFFFFF',
      containerBg: '#FAFAF9',
      borderColor: '#D6D3D1',
      wallColor: '#1C1917',
      wallCavity: '#FFFFFF',
      wallGlow: '#44403C',
      gridColor: '#E7E5E4',
      textColor: '#292524',
      itemFill: '#FFFFFF',
      itemStroke: '#1C1917',
      itemSecondaryStroke: '#78716C',
      itemHoverFill: '#F5F5F4',
      doorColor: '#1C1917',
      walkwayColor: '#78716C',
      badgeBg: '#F5F5F4',
      badgeText: '#1C1917',
      cushionFill: '#FFFFFF',
      pillowFill: '#F5F5F4',
    },
    'classic-blueprint': {
      wrapperBg: '#0A2540',
      containerBg: '#0F2C59',
      borderColor: '#1D4E89',
      wallColor: '#FFFFFF',
      wallCavity: '#0A2540',
      wallGlow: '#8DA9C4',
      gridColor: '#1D4E89',
      textColor: '#EEF4F8',
      itemFill: '#0D2F60',
      itemStroke: '#FFFFFF',
      itemSecondaryStroke: '#8DA9C4',
      itemHoverFill: '#1A4D8C',
      doorColor: '#F4A261',
      walkwayColor: '#8DA9C4',
      badgeBg: 'rgba(255, 255, 255, 0.15)',
      badgeText: '#FFFFFF',
      cushionFill: '#0E356C',
      pillowFill: '#134080',
    },
    'cyber-emerald': {
      wrapperBg: '#091510',
      containerBg: '#0D1B16',
      borderColor: '#1F3F35',
      wallColor: '#5ED989',
      wallCavity: '#091510',
      wallGlow: '#5ED989',
      gridColor: '#1F3F35',
      textColor: '#A3C9B6',
      itemFill: '#122820',
      itemStroke: '#5ED989',
      itemSecondaryStroke: '#3D7A5C',
      itemHoverFill: '#1E3B2F',
      doorColor: '#E88F74',
      walkwayColor: '#3D7A5C',
      badgeBg: 'rgba(94, 217, 137, 0.12)',
      badgeText: '#5ED989',
      cushionFill: '#153127',
      pillowFill: '#1B3D31',
    },
    'warm-editorial': {
      wrapperBg: '#F7F4EE',
      containerBg: '#EFECE6',
      borderColor: '#D5CEC2',
      wallColor: '#2B2A27',
      wallCavity: '#F7F4EE',
      wallGlow: '#D9532F',
      gridColor: '#E3DDD2',
      textColor: '#6E695E',
      itemFill: '#FFFFFF',
      itemStroke: '#2B2A27',
      itemSecondaryStroke: '#8C857B',
      itemHoverFill: '#F0ECE1',
      doorColor: '#D9532F',
      walkwayColor: '#A8A29E',
      badgeBg: 'rgba(217, 83, 47, 0.12)',
      badgeText: '#D9532F',
      cushionFill: '#FAF8F5',
      pillowFill: '#ECE6DC',
    },
    'oled-monochrome': {
      wrapperBg: '#000000',
      containerBg: '#0A0A0A',
      borderColor: '#262626',
      wallColor: '#FFFFFF',
      wallCavity: '#000000',
      wallGlow: '#D4AF37',
      gridColor: '#1C1C1C',
      textColor: '#D4D4D4',
      itemFill: '#121212',
      itemStroke: '#FFFFFF',
      itemSecondaryStroke: '#737373',
      itemHoverFill: '#222222',
      doorColor: '#D4AF37',
      walkwayColor: '#737373',
      badgeBg: 'rgba(255, 255, 255, 0.1)',
      badgeText: '#FFFFFF',
      cushionFill: '#171717',
      pillowFill: '#1F1F1F',
    },
  };

  const activeTheme = themeStyles[theme] || themeStyles['cad-architectural'];

  // Calculate furniture footprints & realistic placements
  const placements = items.map((item, index) => {
    const wFt = item.widthFt || (item.dimensions?.width ? item.dimensions.width / 12 : 3.5);
    const dFt = item.depthFt || (item.dimensions?.depth ? item.dimensions.depth / 12 : 2.5);
    const rot = item.rotationDeg || (index % 2 === 0 ? 0 : 90);

    let xFt = item.xFt;
    let yFt = item.yFt;

    if (xFt === undefined || yFt === undefined) {
      const lower = (item.name || '').toLowerCase();
      const roomType = (roomSpec.roomType || '').toLowerCase();
      const isLivingRoom = roomType.includes('living') || lower.includes('sofa') || lower.includes('sectional') || lower.includes('coffee') || lower.includes('tv') || lower.includes('plant');
      const isBedroom = roomType.includes('bed') || lower.includes('bed') || lower.includes('nightstand') || lower.includes('dresser');

      if (isLivingRoom && !isBedroom) {
        // Industry-Standard Living Room Layout Hierarchy
        if (item.category === 'seating' || lower.includes('sofa') || lower.includes('couch') || lower.includes('sectional')) {
          // 1. Primary Sectional Sofa anchored against North wall
          xFt = Math.max(1.0, (roomWidthFt - wFt) / 2);
          yFt = 1.0;
        } else if (item.category === 'tables' && (lower.includes('coffee') || lower.includes('center') || lower.includes('oval') || lower.includes('round'))) {
          // 2. Coffee Table placed 18"-24" in front of sofa
          xFt = Math.max(1.0, (roomWidthFt - wFt) / 2);
          yFt = 4.4;
        } else if (item.category === 'storage' || lower.includes('media') || lower.includes('tv') || lower.includes('credenza') || lower.includes('console') || lower.includes('showcase')) {
          // 3. TV Media Console / Showcase along South wall (away from door swing)
          xFt = Math.max(doorEndX / scale + 0.5, (roomWidthFt - wFt) / 2);
          yFt = Math.max(1.0, roomLengthFt - dFt - 1.0);
        } else if (item.category === 'decor' || lower.includes('plant') || lower.includes('monstera') || lower.includes('fig') || lower.includes('tree')) {
          // 4. Botanical Indoor Plant in sunlit northwest corner near window
          xFt = 1.2;
          yFt = 1.2;
        } else if (item.category === 'lighting' || lower.includes('lamp') || lower.includes('light')) {
          // 5. Sculptural Floor Lamp flanking the sofa corner
          xFt = Math.min(roomWidthFt - wFt - 1.2, (roomWidthFt + 7.5) / 2 + 0.8);
          yFt = 1.2;
        } else if (item.category === 'rugs' || lower.includes('rug') || lower.includes('carpet')) {
          // 6. Large Living Room Area Carpet anchoring the seating group
          xFt = Math.max(0.5, (roomWidthFt - wFt) / 2);
          yFt = 1.2;
        } else {
          xFt = (index * 3.0) % Math.max(1, roomWidthFt - wFt - 2) + 1.5;
          yFt = ((index * 2.5) % Math.max(1, roomLengthFt - dFt - 3)) + 1.5;
        }
      } else if (isBedroom) {
        // Bedroom Layout Hierarchy
        if (item.category === 'beds' || lower.includes('bed')) {
          xFt = Math.max(1.0, (roomWidthFt - wFt) / 2);
          yFt = 1.0;
        } else if (item.category === 'nightstands' || lower.includes('nightstand')) {
          if (index % 2 === 0) {
            xFt = Math.max(1.0, (roomWidthFt - 6.5) / 2 - wFt - 0.3);
          } else {
            xFt = Math.min(roomWidthFt - wFt - 1.0, (roomWidthFt + 6.5) / 2 + 0.3);
          }
          yFt = 1.0;
        } else if (item.category === 'storage' || lower.includes('dresser')) {
          xFt = Math.max(1.0, roomWidthFt - wFt - 1.2);
          yFt = 2.5;
        } else if (item.category === 'lighting') {
          xFt = Math.max(1.0, (roomWidthFt - 6.5) / 2 - wFt - 0.3);
          yFt = 1.0;
        } else if (item.category === 'rugs') {
          xFt = Math.max(0.5, (roomWidthFt - wFt) / 2);
          yFt = 2.5;
        } else {
          xFt = (index * 3.0) % Math.max(1, roomWidthFt - wFt - 2) + 1.5;
          yFt = ((index * 2.5) % Math.max(1, roomLengthFt - dFt - 3)) + 1.5;
        }
      } else {
        // Home-Office Layout Hierarchy
        if (item.category === 'tables' || lower.includes('desk')) {
          xFt = 1.2;
          yFt = 1.2;
        } else if (item.category === 'seating' || lower.includes('chair')) {
          xFt = 2.2;
          yFt = 3.6;
        } else if (item.category === 'storage' || lower.includes('shelf') || lower.includes('credenza')) {
          xFt = Math.max(1.0, roomWidthFt - wFt - 1.2);
          yFt = 2.0;
        } else if (item.category === 'lighting') {
          xFt = 1.4;
          yFt = 1.4;
        } else if (item.category === 'rugs') {
          xFt = Math.max(0.5, (roomWidthFt - wFt) / 2);
          yFt = Math.max(0.5, (roomLengthFt - dFt) / 2);
        } else {
          xFt = (index * 3.5) % Math.max(1, roomWidthFt - wFt - 2) + 1.5;
          yFt = ((index * 2.8) % Math.max(1, roomLengthFt - dFt - 3)) + 1.5;
        }
      }
    }

    // Keep strictly within boundaries
    xFt = Math.max(0.8, Math.min(roomWidthFt - wFt - 0.8, xFt));
    yFt = Math.max(0.8, Math.min(roomLengthFt - dFt - 0.8, yFt));

    return {
      ...item,
      xFt,
      yFt,
      wFt,
      dFt,
      rot,
      pixelX: padLeft + xFt * scale,
      pixelY: padTop + yFt * scale,
      pixelW: wFt * scale,
      pixelD: dFt * scale,
    };
  });

  const totalPlacedAreaSqFt = placements.reduce((acc, p) => acc + p.wFt * p.dFt, 0);
  const utilizationPct = Math.min(100, Math.round((totalPlacedAreaSqFt / roomAreaSqFt) * 100));
  const circulationAreaSqFt = Math.max(0, Math.round(roomAreaSqFt - totalPlacedAreaSqFt));

  const hoveredItem = placements.find((p) => p.id === hoveredItemId);

  const handleUpdateItems = (updated: FurnitureItem[]) => {
    if (onUpdateItems) {
      onUpdateItems(updated);
    }
  };

  /**
   * Renders high-fidelity architectural CAD top-down furniture symbols matching real architectural blueprints
   */
  const renderCADFurnitureSymbol = (item: any, isHovered: boolean) => {
    const { pixelX: x, pixelY: y, pixelW: w, pixelD: d, name, category } = item;
    const lowerName = (name || '').toLowerCase();
    const isPlant = lowerName.includes('plant') || lowerName.includes('monstera') || lowerName.includes('fig') || lowerName.includes('tree') || category === 'plants' || (category === 'decor' && lowerName.includes('planter'));
    const isMediaConsole = !isPlant && (lowerName.includes('tv') || lowerName.includes('media') || lowerName.includes('console') || lowerName.includes('showcase') || lowerName.includes('credenza') || lowerName.includes('entertainment'));
    const isBed = !isPlant && !isMediaConsole && (lowerName.includes('bed') && !lowerName.includes('bedside') && !lowerName.includes('sofa') && !lowerName.includes('plant')) || category === 'beds';
    const isNightstand = !isPlant && !isBed && (lowerName.includes('nightstand') || category === 'nightstands' || lowerName.includes('bedside'));
    const isSofa = !isBed && !isMediaConsole && !isPlant && (lowerName.includes('sofa') || lowerName.includes('couch') || lowerName.includes('sectional') || (category === 'seating' && !lowerName.includes('chair') && !lowerName.includes('stool')));
    const isCoffeeTable = !isBed && !isMediaConsole && !isPlant && (lowerName.includes('coffee') || lowerName.includes('center table') || lowerName.includes('oval') || lowerName.includes('travertine') || (category === 'tables' && w < 4.8 * scale && !lowerName.includes('desk') && !lowerName.includes('standing')));
    const isDesk = !isBed && !isCoffeeTable && !isPlant && (category === 'tables' || lowerName.includes('desk'));
    const isBookshelf = !isMediaConsole && !isPlant && (category === 'storage' || lowerName.includes('shelf') || lowerName.includes('cabinet') || lowerName.includes('dresser'));
    const isLamp = category === 'lighting' || lowerName.includes('lamp') || lowerName.includes('light');
    const isRug = category === 'rugs' || lowerName.includes('rug') || lowerName.includes('carpet');

    // 0. INDOOR BOTANICAL PLANT SYMBOL (Terracotta planter pot + 8-petal green foliage)
    if (isPlant) {
      const cx = x + w / 2;
      const cy = y + d / 2;
      const r = Math.min(w, d) / 2 - 4;
      return (
        <g className="cad-plant-symbol">
          {/* Planter Pot Base */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={activeTheme.doorColor || '#D9532F'}
            fillOpacity="0.25"
            stroke={activeTheme.itemStroke}
            strokeWidth="1.8"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r * 0.75}
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemSecondaryStroke}
            strokeWidth="1.0"
          />
          {/* 8 Botanical Split-Leaf Fronds */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, leafIdx) => {
            const rad = (angle * Math.PI) / 180;
            const lx = cx + Math.cos(rad) * (r * 1.15);
            const ly = cy + Math.sin(rad) * (r * 1.15);
            return (
              <g key={leafIdx}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={lx}
                  y2={ly}
                  stroke="#2D6A4F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <ellipse
                  cx={lx}
                  cy={ly}
                  rx={r * 0.35}
                  ry={r * 0.2}
                  transform={`rotate(${angle} ${lx} ${ly})`}
                  fill="#52B788"
                  fillOpacity="0.85"
                  stroke="#1B4332"
                  strokeWidth="1"
                />
              </g>
            );
          })}
          {/* Pot Center Soil Core */}
          <circle cx={cx} cy={cy} r="4" fill="#1B4332" stroke={activeTheme.itemStroke} strokeWidth="1" />
          <text
            x={cx}
            y={cy + r + 13}
            textAnchor="middle"
            fill={activeTheme.textColor}
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="800"
          >
            INDOOR PLANT
          </text>
        </g>
      );
    }

    // 0.2. TV MEDIA CONSOLE & SHOWCASE SYMBOL (Console + TV Bezel + Speakers)
    if (isMediaConsole) {
      return (
        <g className="cad-media-console-symbol">
          {/* Console Cabinet Body */}
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            rx="2"
            fill={isHovered ? activeTheme.itemHoverFill : activeTheme.itemFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.8"
          />
          {/* Acoustic Speaker Slats left & right */}
          <rect x={x + 4} y={y + 3} width={Math.min(20, w * 0.14)} height={d - 6} rx="1" fill={activeTheme.pillowFill} stroke={activeTheme.itemSecondaryStroke} strokeWidth="0.8" />
          <rect x={x + w - Math.min(20, w * 0.14) - 4} y={y + 3} width={Math.min(20, w * 0.14)} height={d - 6} rx="1" fill={activeTheme.pillowFill} stroke={activeTheme.itemSecondaryStroke} strokeWidth="0.8" />
          
          {/* Ultra-Slim TV Screen Top-Down Monolith */}
          <rect
            x={x + w * 0.14}
            y={y + d * 0.25}
            width={w * 0.72}
            height={Math.max(5, d * 0.16)}
            rx="1"
            fill="#0F172A"
            stroke={activeTheme.itemStroke}
            strokeWidth="1.2"
          />
          {/* Soundbar / Media Component Center Tray */}
          <rect
            x={x + w * 0.25}
            y={y + d * 0.6}
            width={w * 0.5}
            height={Math.max(3, d * 0.14)}
            rx="1"
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemSecondaryStroke}
            strokeWidth="0.8"
          />
          <text
            x={x + w / 2}
            y={y + d / 2 + 3}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="900"
            letterSpacing="0.05em"
          >
            TV MEDIA SHOWCASE
          </text>
        </g>
      );
    }

    // 0. PLATFORM BED / KING / QUEEN BED SYMBOL (Headboard, 2 Pillows, Duvet Fold Line)
    if (isBed) {
      const headboardDepth = Math.min(16, d * 0.16);
      const pillowW = Math.min(48, (w - 24) / 2);
      const pillowD = Math.min(26, d * 0.26);

      return (
        <g className="cad-bed-symbol">
          {/* Main Mattress & Bedframe */}
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            rx="4"
            fill={isHovered ? activeTheme.itemHoverFill : activeTheme.cushionFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="2"
          />

          {/* Solid Architectural Headboard */}
          <rect
            x={x - 2}
            y={y}
            width={w + 4}
            height={headboardDepth}
            rx="2"
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.5"
          />

          {/* Left Pillow */}
          <rect
            x={x + 8}
            y={y + headboardDepth + 4}
            width={pillowW}
            height={pillowD}
            rx="5"
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.2"
          />
          {/* Left Pillow Inner Indentation */}
          <line
            x1={x + 14}
            y1={y + headboardDepth + 4 + pillowD / 2}
            x2={x + 8 + pillowW - 6}
            y2={y + headboardDepth + 4 + pillowD / 2}
            stroke={activeTheme.itemSecondaryStroke}
            strokeWidth="0.8"
          />

          {/* Right Pillow */}
          <rect
            x={x + w - pillowW - 8}
            y={y + headboardDepth + 4}
            width={pillowW}
            height={pillowD}
            rx="5"
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.2"
          />
          {/* Right Pillow Inner Indentation */}
          <line
            x1={x + w - pillowW - 2}
            y1={y + headboardDepth + 4 + pillowD / 2}
            x2={x + w - 14}
            y2={y + headboardDepth + 4 + pillowD / 2}
            stroke={activeTheme.itemSecondaryStroke}
            strokeWidth="0.8"
          />

          {/* Duvet / Quilt Comforter Fold Line */}
          <path
            d={`M ${x} ${y + d * 0.48} Q ${x + w / 2} ${y + d * 0.52} ${x + w} ${y + d * 0.48}`}
            fill="none"
            stroke={activeTheme.itemStroke}
            strokeWidth="1.5"
          />
          {/* Duvet Quilt Texture Lines */}
          <line
            x1={x + 12}
            y1={y + d * 0.72}
            x2={x + w - 12}
            y2={y + d * 0.72}
            stroke={activeTheme.itemSecondaryStroke}
            strokeWidth="0.8"
            strokeDasharray="4 3"
          />

          {/* Architectural Bed Title */}
          <text
            x={x + w / 2}
            y={y + d * 0.82}
            textAnchor="middle"
            fill={activeTheme.textColor}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="900"
            letterSpacing="0.08em"
          >
            {w > 170 ? 'KING PLATFORM BED' : 'QUEEN BED'}
          </text>
        </g>
      );
    }

    // 0.5. NIGHTSTAND / BEDSIDE TABLE SYMBOL
    if (isNightstand) {
      return (
        <g className="cad-nightstand-symbol">
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            rx="2"
            fill={isHovered ? activeTheme.itemHoverFill : activeTheme.itemFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.6"
          />
          {/* Bedside Lamp Shade on Top */}
          <circle
            cx={x + w / 2}
            cy={y + d / 2}
            r={Math.min(w, d) / 2 - 4}
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.2"
          />
          <circle
            cx={x + w / 2}
            cy={y + d / 2}
            r="3"
            fill={activeTheme.doorColor}
            stroke={activeTheme.itemStroke}
            strokeWidth="0.8"
          />
        </g>
      );
    }

    // 1. SOFA / SECTIONAL SYMBOL (Cushion seams, backrest bar, armrests)
    if (isSofa && w >= 50 && d >= 40) {
      const armWidth = Math.min(16, w * 0.12);
      const backDepth = Math.min(16, d * 0.22);
      const seatW = w - armWidth * 2;
      const numCushions = Math.max(2, Math.min(4, Math.round(seatW / 35)));
      const cushionW = seatW / numCushions;

      return (
        <g className="cad-sofa-symbol">
          {/* Main outer boundary */}
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            rx="4"
            fill={isHovered ? activeTheme.itemHoverFill : activeTheme.cushionFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.8"
          />

          {/* Backrest bar */}
          <rect
            x={x + armWidth}
            y={y}
            width={seatW}
            height={backDepth}
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.2"
          />

          {/* Left Armrest */}
          <rect
            x={x}
            y={y}
            width={armWidth}
            height={d}
            rx="3"
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.2"
          />

          {/* Right Armrest */}
          <rect
            x={x + w - armWidth}
            y={y}
            width={armWidth}
            height={d}
            rx="3"
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.2"
          />

          {/* Seat Cushion Divisions */}
          {Array.from({ length: numCushions }).map((_, cIdx) => (
            <g key={cIdx}>
              <rect
                x={x + armWidth + cIdx * cushionW}
                y={y + backDepth}
                width={cushionW}
                height={d - backDepth}
                fill={activeTheme.cushionFill}
                stroke={activeTheme.itemSecondaryStroke}
                strokeWidth="1"
              />
              {/* Pillow cushion top contour */}
              <path
                d={`M ${x + armWidth + cIdx * cushionW + 4} ${y + backDepth + 3} Q ${x + armWidth + cIdx * cushionW + cushionW / 2} ${y + backDepth + 7} ${x + armWidth + (cIdx + 1) * cushionW - 4} ${y + backDepth + 3}`}
                fill="none"
                stroke={activeTheme.itemSecondaryStroke}
                strokeWidth="0.8"
              />
            </g>
          ))}

          {/* Architectural Text Label */}
          <text
            x={x + w / 2}
            y={y + d / 2 + 3}
            textAnchor="middle"
            fill={activeTheme.textColor}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="800"
            letterSpacing="0.08em"
          >
            {w > 120 ? 'SECTIONAL SOFA' : 'SOFA'}
          </text>
        </g>
      );
    }

    // 2. COFFEE TABLE SYMBOL (Double chamfer border with central architectural label)
    if (isCoffeeTable) {
      return (
        <g className="cad-coffee-table-symbol">
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            rx="2"
            fill={isHovered ? activeTheme.itemHoverFill : activeTheme.itemFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.8"
          />
          {/* Inner Inlay Bevel Line */}
          <rect
            x={x + 5}
            y={y + 5}
            width={w - 10}
            height={d - 10}
            rx="1"
            fill="none"
            stroke={activeTheme.itemSecondaryStroke}
            strokeWidth="0.8"
          />
          <text
            x={x + w / 2}
            y={y + d / 2 - 2}
            textAnchor="middle"
            fill={activeTheme.textColor}
            fontSize="9"
            fontFamily="monospace"
            fontWeight="800"
          >
            COFFEE
          </text>
          <text
            x={x + w / 2}
            y={y + d / 2 + 10}
            textAnchor="middle"
            fill={activeTheme.textColor}
            fontSize="9"
            fontFamily="monospace"
            fontWeight="800"
          >
            TABLE
          </text>
        </g>
      );
    }

    // 3. WORK DESK / TABLE SYMBOL (Surface with chamfer, monitor footprint, leg posts)
    if (isDesk) {
      return (
        <g className="cad-desk-symbol">
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            rx="2"
            fill={isHovered ? activeTheme.itemHoverFill : activeTheme.itemFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.8"
          />
          {/* Desk Cable Grommet */}
          <circle
            cx={x + w - 12}
            cy={y + 12}
            r="4"
            fill={activeTheme.itemSecondaryStroke}
            stroke={activeTheme.itemStroke}
            strokeWidth="0.8"
          />
          {/* Monitor / Laptop Screen Footprint on Desk */}
          <rect
            x={x + w / 2 - 22}
            y={y + 6}
            width={44}
            height={10}
            rx="1"
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1"
          />
          <text
            x={x + w / 2}
            y={y + d / 2 + 8}
            textAnchor="middle"
            fill={activeTheme.textColor}
            fontSize="9.5"
            fontFamily="monospace"
            fontWeight="800"
          >
            WORK DESK
          </text>
        </g>
      );
    }

    // 4. BOOKSHELF / CREDENZA / STORAGE SYMBOL (Vertical bay compartments with shelf lines)
    if (isBookshelf) {
      const isVertical = d > w;
      const numBays = isVertical ? Math.max(2, Math.round(d / 30)) : Math.max(2, Math.round(w / 30));
      const baySize = (isVertical ? d : w) / numBays;

      return (
        <g className="cad-bookshelf-symbol">
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            fill={isHovered ? activeTheme.itemHoverFill : activeTheme.itemFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.8"
          />
          {/* Shelf divider lines */}
          {Array.from({ length: numBays }).map((_, bIdx) => {
            if (isVertical) {
              return (
                <g key={bIdx}>
                  <line
                    x1={x}
                    y1={y + bIdx * baySize}
                    x2={x + w}
                    y2={y + bIdx * baySize}
                    stroke={activeTheme.itemStroke}
                    strokeWidth="1.2"
                  />
                  {/* Shelf depth divider */}
                  <line
                    x1={x + 4}
                    y1={y + bIdx * baySize + 4}
                    x2={x + w - 4}
                    y2={y + (bIdx + 1) * baySize - 4}
                    stroke={activeTheme.itemSecondaryStroke}
                    strokeWidth="0.6"
                    strokeDasharray="2 2"
                  />
                </g>
              );
            } else {
              return (
                <g key={bIdx}>
                  <line
                    x1={x + bIdx * baySize}
                    y1={y}
                    x2={x + bIdx * baySize}
                    y2={y + d}
                    stroke={activeTheme.itemStroke}
                    strokeWidth="1.2"
                  />
                </g>
              );
            }
          })}
          {/* Label along spine */}
          <text
            x={x + w / 2}
            y={y + d / 2}
            textAnchor="middle"
            fill={activeTheme.textColor}
            fontSize="9"
            fontFamily="monospace"
            fontWeight="800"
            transform={isVertical ? `rotate(-90 ${x + w / 2} ${y + d / 2})` : undefined}
          >
            BOOKSHELF
          </text>
        </g>
      );
    }

    // 5. LIGHTING / SIDE TABLE WITH LAMP SYMBOL (Concentric circle lamp shade on stand)
    if (isLamp) {
      const radius = Math.min(w, d) / 2 - 4;
      return (
        <g className="cad-lamp-symbol">
          {/* Base nightstand box */}
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            rx="2"
            fill={isHovered ? activeTheme.itemHoverFill : activeTheme.itemFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.5"
          />
          {/* Lamp shade concentric ring */}
          <circle
            cx={x + w / 2}
            cy={y + d / 2}
            r={radius}
            fill={activeTheme.pillowFill}
            stroke={activeTheme.itemStroke}
            strokeWidth="1.2"
          />
          {/* Inner bulb finial */}
          <circle
            cx={x + w / 2}
            cy={y + d / 2}
            r="4"
            fill={activeTheme.doorColor}
            stroke={activeTheme.itemStroke}
            strokeWidth="0.8"
          />
          {/* Radial shade cross-ribs */}
          <line
            x1={x + w / 2 - radius}
            y1={y + d / 2}
            x2={x + w / 2 + radius}
            y2={y + d / 2}
            stroke={activeTheme.itemSecondaryStroke}
            strokeWidth="0.6"
          />
        </g>
      );
    }

    // 6. RUG SYMBOL (Woven hatched texture with fringe lines)
    if (isRug) {
      return (
        <g className="cad-rug-symbol">
          <rect
            x={x}
            y={y}
            width={w}
            height={d}
            fill="none"
            stroke={activeTheme.doorColor}
            strokeWidth="1.2"
            strokeDasharray="4 2"
          />
          <text
            x={x + w / 2}
            y={y + d / 2}
            textAnchor="middle"
            fill={activeTheme.doorColor}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="700"
          >
            AREA RUG ({Math.round(item.wFt)}' × {Math.round(item.dFt)}')
          </text>
        </g>
      );
    }

    // DEFAULT CAD FURNITURE FOOTPRINT
    return (
      <g className="cad-default-symbol">
        <rect
          x={x}
          y={y}
          width={w}
          height={d}
          rx="3"
          fill={isHovered ? activeTheme.itemHoverFill : activeTheme.itemFill}
          stroke={activeTheme.itemStroke}
          strokeWidth="1.5"
        />
        <text
          x={x + w / 2}
          y={y + d / 2}
          textAnchor="middle"
          fill={activeTheme.textColor}
          fontSize="9"
          fontFamily="monospace"
          fontWeight="700"
        >
          {name.slice(0, 14)}
        </text>
      </g>
    );
  };

  /**
   * SVG Canvas Content (Shared between regular card and Fullscreen Modal)
   */
  const renderSVGCanvas = () => (
    <svg
      className="blueprint-svg-canvas"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      height={svgHeight}
      style={{
        width: '100%',
        minHeight: `${Math.min(svgHeight, 640)}px`,
        display: 'block',
      }}
    >
      <defs>
        {/* Architectural 1ft Grid Pattern */}
        <pattern id={`cad-grid-1ft-${theme}`} width={scale} height={scale} patternUnits="userSpaceOnUse">
          <rect width={scale} height={scale} fill="none" stroke={activeTheme.gridColor} strokeWidth="0.5" strokeOpacity="0.7" />
          <circle cx={scale} cy={scale} r="0.8" fill={activeTheme.wallGlow} fillOpacity="0.4" />
        </pattern>

        {/* 5ft Major Grid */}
        <pattern id={`cad-grid-5ft-${theme}`} width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse">
          <rect width={scale * 5} height={scale * 5} fill={`url(#cad-grid-1ft-${theme})`} stroke={activeTheme.borderColor} strokeWidth="1" strokeOpacity="0.8" />
        </pattern>

        {/* Wall Cavity Hatching Pattern */}
        <pattern id={`wall-cavity-${theme}`} width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke={activeTheme.wallColor} strokeWidth="1" strokeOpacity="0.4" />
        </pattern>
      </defs>

      {/* Background Grid */}
      <rect
        x={padLeft}
        y={padTop}
        width={canvasWidth}
        height={canvasHeight}
        fill={displayMode === 'blueprint-grid' ? `url(#cad-grid-5ft-${theme})` : activeTheme.wrapperBg}
      />

      {/* Dotted Walkway Circulation Corridors (Flowing smoothly between doorway and furniture) */}
      <g className="walkway-clearance-corridors">
        {/* Main entry circulation pathway */}
        <path
          d={`M ${doorStartX + 30} ${doorY - 5} C ${doorStartX + 30} ${doorY - 90}, ${padLeft + canvasWidth / 2 - 60} ${padTop + canvasHeight - 80}, ${padLeft + canvasWidth / 2} ${padTop + canvasHeight / 2 + 40}`}
          fill="none"
          stroke={activeTheme.walkwayColor}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        {/* Sofa to bookshelf circulation pathway */}
        <path
          d={`M ${padLeft + canvasWidth / 2 + 20} ${padTop + canvasHeight / 2 + 40} C ${padLeft + canvasWidth - 100} ${padTop + canvasHeight / 2 + 40}, ${padLeft + canvasWidth - 80} ${padTop + 140}, ${padLeft + canvasWidth - 40} ${padTop + 120}`}
          fill="none"
          stroke={activeTheme.walkwayColor}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
      </g>

      {/* Architectural Double Outer Walls */}
      {/* Outer Wall Boundary */}
      <rect
        x={padLeft - 6}
        y={padTop - 6}
        width={canvasWidth + 12}
        height={canvasHeight + 12}
        fill="none"
        stroke={activeTheme.wallColor}
        strokeWidth="3.5"
      />
      {/* Inner Wall Boundary */}
      <rect
        x={padLeft}
        y={padTop}
        width={canvasWidth}
        height={canvasHeight}
        fill="none"
        stroke={activeTheme.wallColor}
        strokeWidth="1.5"
      />

      {/* Wall Windows (North Wall Window and South Wall Window) */}
      {/* North Wall Window */}
      <g className="architectural-window-north">
        <rect
          x={padLeft + canvasWidth / 2 - 50}
          y={padTop - 8}
          width={100}
          height={6}
          fill={activeTheme.wrapperBg}
          stroke={activeTheme.wallColor}
          strokeWidth="1.5"
        />
        <line
          x1={padLeft + canvasWidth / 2 - 50}
          y1={padTop - 5}
          x2={padLeft + canvasWidth / 2 + 50}
          y2={padTop - 5}
          stroke={activeTheme.wallGlow}
          strokeWidth="1.5"
        />
      </g>

      {/* West Wall Window */}
      <g className="architectural-window-west">
        <rect
          x={padLeft - 8}
          y={padTop + 40}
          width={6}
          height={80}
          fill={activeTheme.wrapperBg}
          stroke={activeTheme.wallColor}
          strokeWidth="1.5"
        />
        <line
          x1={padLeft - 5}
          y1={padTop + 40}
          x2={padLeft - 5}
          y2={padTop + 120}
          stroke={activeTheme.wallGlow}
          strokeWidth="1.5"
        />
      </g>

      {/* All 4 Wall Dimension Callout Dimension Lines & Labels */}
      {/* North Wall Dimension Line */}
      <g className="dimension-north">
        <line x1={padLeft} y1={padTop - 25} x2={padLeft + canvasWidth} y2={padTop - 25} stroke={activeTheme.textColor} strokeWidth="1" />
        <line x1={padLeft} y1={padTop - 32} x2={padLeft} y2={padTop - 18} stroke={activeTheme.textColor} strokeWidth="1" />
        <line x1={padLeft + canvasWidth} y1={padTop - 32} x2={padLeft + canvasWidth} y2={padTop - 18} stroke={activeTheme.textColor} strokeWidth="1" />
        <text x={padLeft + canvasWidth / 2} y={padTop - 32} textAnchor="middle" fill={activeTheme.textColor} fontSize="12" fontFamily="monospace" fontWeight="800">
          {roomWidthFt} FT ({roomWidthFt * 12}")
        </text>
      </g>

      {/* South Wall Dimension Line */}
      <g className="dimension-south">
        <line x1={padLeft} y1={padTop + canvasHeight + 35} x2={padLeft + canvasWidth} y2={padTop + canvasHeight + 35} stroke={activeTheme.textColor} strokeWidth="1" />
        <line x1={padLeft} y1={padTop + canvasHeight + 28} x2={padLeft} y2={padTop + canvasHeight + 42} stroke={activeTheme.textColor} strokeWidth="1" />
        <line x1={padLeft + canvasWidth} y1={padTop + canvasHeight + 28} x2={padLeft + canvasWidth} y2={padTop + canvasHeight + 42} stroke={activeTheme.textColor} strokeWidth="1" />
        <text x={padLeft + canvasWidth / 2} y={padTop + canvasHeight + 52} textAnchor="middle" fill={activeTheme.textColor} fontSize="11" fontFamily="monospace" fontWeight="800">
          SOUTH WALL: {roomWidthFt} FT · MAIN ENTRANCE
        </text>
      </g>

      {/* West Wall Dimension Line */}
      <g className="dimension-west">
        <line x1={padLeft - 28} y1={padTop} x2={padLeft - 28} y2={padTop + canvasHeight} stroke={activeTheme.textColor} strokeWidth="1" />
        <line x1={padLeft - 35} y1={padTop} x2={padLeft - 21} y2={padTop} stroke={activeTheme.textColor} strokeWidth="1" />
        <line x1={padLeft - 35} y1={padTop + canvasHeight} x2={padLeft - 21} y2={padTop + canvasHeight} stroke={activeTheme.textColor} strokeWidth="1" />
        <text
          x={padLeft - 38}
          y={padTop + canvasHeight / 2}
          textAnchor="middle"
          fill={activeTheme.textColor}
          fontSize="11"
          fontFamily="monospace"
          fontWeight="800"
          transform={`rotate(-90 ${padLeft - 38} ${padTop + canvasHeight / 2})`}
        >
          {roomLengthFt} FT ({roomLengthFt * 12}")
        </text>
      </g>

      {/* East Wall Dimension Line */}
      <g className="dimension-east">
        <line x1={padLeft + canvasWidth + 28} y1={padTop} x2={padLeft + canvasWidth + 28} y2={padTop + canvasHeight} stroke={activeTheme.textColor} strokeWidth="1" />
        <line x1={padLeft + canvasWidth + 21} y1={padTop} x2={padLeft + canvasWidth + 35} y2={padTop} stroke={activeTheme.textColor} strokeWidth="1" />
        <line x1={padLeft + canvasWidth + 21} y1={padTop + canvasHeight} x2={padLeft + canvasWidth + 35} y2={padTop + canvasHeight} stroke={activeTheme.textColor} strokeWidth="1" />
        <text
          x={padLeft + canvasWidth + 40}
          y={padTop + canvasHeight / 2}
          textAnchor="middle"
          fill={activeTheme.textColor}
          fontSize="11"
          fontFamily="monospace"
          fontWeight="800"
          transform={`rotate(90 ${padLeft + canvasWidth + 40} ${padTop + canvasHeight / 2})`}
        >
          {roomLengthFt} FT ({roomLengthFt * 12}")
        </text>
      </g>

      {/* South Wall Entry Door Opening & 90-Degree Swing Arc */}
      <g className="door-clearance-group">
        {/* Wall break */}
        <line x1={doorStartX} y1={doorY} x2={doorEndX} y2={doorY} stroke={activeTheme.wrapperBg} strokeWidth="8" />
        {/* Door Leaf (Open 90°) */}
        <line x1={doorStartX} y1={doorY} x2={doorStartX} y2={doorY - doorArcRadius} stroke={activeTheme.doorColor} strokeWidth="2.5" />
        {/* Door Arc */}
        <path
          d={`M ${doorStartX} ${doorY - doorArcRadius} A ${doorArcRadius} ${doorArcRadius} 0 0 1 ${doorEndX} ${doorY}`}
          fill="none"
          stroke={activeTheme.doorColor}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x={doorStartX + 10} y={doorY - doorArcRadius / 2} fill={activeTheme.doorColor} fontSize="9" fontFamily="monospace" fontWeight="700">
          36" ENTRY
        </text>
      </g>

      {/* Central Architectural Room Title (e.g. LIVING ROOM / BEDROOM) */}
      <text
        x={padLeft + canvasWidth / 2}
        y={padTop + canvasHeight / 2 + 18}
        textAnchor="middle"
        fill={activeTheme.textColor}
        fontSize="14"
        fontFamily="sans-serif"
        fontWeight="800"
        letterSpacing="0.12em"
        opacity="0.85"
      >
        {roomSpec.roomType.replace('-', ' ').toUpperCase()}
      </text>

      {/* Placed Furniture CAD Realistic Symbols */}
      {placements.map((item, idx) => {
        const isHovered = hoveredItemId === item.id;

        return (
          <g
            key={`${item.id}-${idx}`}
            className={`furniture-cad-node ${isHovered ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredItemId(item.id)}
            onMouseLeave={() => setHoveredItemId(null)}
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          >
            {renderCADFurnitureSymbol(item, isHovered)}

            {/* Item Number Badge */}
            <circle
              cx={item.pixelX + 12}
              cy={item.pixelY + 12}
              r="7"
              fill={activeTheme.wrapperBg}
              stroke={activeTheme.itemStroke}
              strokeWidth="1"
            />
            <text
              x={item.pixelX + 12}
              y={item.pixelY + 15}
              textAnchor="middle"
              fill={activeTheme.textColor}
              fontSize="8"
              fontFamily="monospace"
              fontWeight="900"
            >
              {idx + 1}
            </text>

            {/* Clearance Verified Checkmark */}
            <circle
              cx={item.pixelX + item.pixelW - 10}
              cy={item.pixelY + 10}
              r="5"
              fill="#16A34A"
            />
            <text
              x={item.pixelX + item.pixelW - 10}
              y={item.pixelY + 13}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="7"
              fontWeight="900"
            >
              ✓
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <>
      {/* 1. Regular Inline Studio Blueprint Container */}
      <div className={`architectural-plan-container theme-${theme}`} style={{ background: activeTheme.containerBg, borderColor: activeTheme.borderColor }}>
        {/* Toolbar Header */}
        <div className="blueprint-meta-bar" style={{ background: activeTheme.wrapperBg, borderColor: activeTheme.borderColor }}>
          <div className="blueprint-info-group">
            <div className="blueprint-badge" style={{ background: activeTheme.badgeBg, color: activeTheme.badgeText, borderColor: activeTheme.borderColor }}>
              <Compass size={14} />
              <span>2D ARCHITECTURAL CAD PLAN</span>
            </div>
            <span className="blueprint-room-dim" style={{ color: activeTheme.textColor }}>
              {roomWidthFt}'-0" W × {roomLengthFt}'-0" L · {roomAreaSqFt} SQ FT
            </span>
            <div className="blueprint-stat-chip" style={{ background: activeTheme.containerBg, borderColor: activeTheme.borderColor, color: activeTheme.textColor }}>
              <Layers size={12} />
              <span>Footprint: {totalPlacedAreaSqFt.toFixed(1)} sq ft ({utilizationPct}%) · Circulation: {circulationAreaSqFt} sq ft</span>
            </div>
          </div>

          {/* Theme Palette Buttons, Render Mode Switcher, Zoom & Fullscreen Controls */}
          <div className="blueprint-toolbar-controls">
            {/* Display Mode Toggle */}
            <div className="display-mode-selector">
              <button
                type="button"
                className={`mode-btn ${displayMode === 'cad-realistic' ? 'active' : ''}`}
                onClick={() => setDisplayMode('cad-realistic')}
                title="CAD Architectural Realistic Furniture Symbols"
              >
                <BookOpen size={12} />
                <span>CAD Symbols</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${displayMode === 'blueprint-grid' ? 'active' : ''}`}
                onClick={() => setDisplayMode('blueprint-grid')}
                title="Spatial Physics 1ft Grid"
              >
                <SlidersHorizontal size={12} />
                <span>Grid</span>
              </button>
            </div>

            {/* Theme Selector */}
            <div className="blueprint-theme-selector">
              <span className="theme-label" style={{ color: activeTheme.textColor }}>Theme:</span>
              <button
                type="button"
                className={`theme-dot-btn ${theme === 'cad-architectural' ? 'active' : ''}`}
                onClick={() => setTheme('cad-architectural')}
                title="Architectural Black & White CAD Drafting"
                style={{ background: '#FFFFFF', border: '1px solid #1C1917' }}
              />
              <button
                type="button"
                className={`theme-dot-btn ${theme === 'classic-blueprint' ? 'active' : ''}`}
                onClick={() => setTheme('classic-blueprint')}
                title="Classic Navy Blueprint Theme"
                style={{ background: '#0F2C59', border: '1px solid #FFFFFF' }}
              />
              <button
                type="button"
                className={`theme-dot-btn ${theme === 'cyber-emerald' ? 'active' : ''}`}
                onClick={() => setTheme('cyber-emerald')}
                title="Cyber Emerald Matrix Theme"
                style={{ background: '#5ED989' }}
              />
              <button
                type="button"
                className={`theme-dot-btn ${theme === 'warm-editorial' ? 'active' : ''}`}
                onClick={() => setTheme('warm-editorial')}
                title="Warm Editorial Theme"
                style={{ background: '#EFECE6', border: '1px solid #D5CEC2' }}
              />
              <button
                type="button"
                className={`theme-dot-btn ${theme === 'oled-monochrome' ? 'active' : ''}`}
                onClick={() => setTheme('oled-monochrome')}
                title="OLED Deep Black Theme"
                style={{ background: '#000000', border: '1px solid #D4AF37' }}
              />
            </div>

            {/* Zoom Controls */}
            <div className="blueprint-zoom-controls">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.1))}
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="zoom-text" style={{ color: activeTheme.textColor }}>{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel(1.0)}
                title="Reset Zoom"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Fullscreen Trigger Button */}
            <button
              type="button"
              className="btn-fullscreen-trigger"
              onClick={() => setIsFullscreen(true)}
              title="Open Fullscreen Studio Mode with Side-by-Side AI Copilot"
            >
              <Maximize2 size={13} />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Blueprint Canvas Body */}
        <div className="blueprint-canvas-wrapper" style={{ background: activeTheme.wrapperBg }}>
          <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s ease', width: '100%', display: 'flex', justifyContent: 'center' }}>
            {renderSVGCanvas()}
          </div>
        </div>

        {/* Blueprint Footer / Hover Details Card */}
        <div className="blueprint-footer-row" style={{ background: activeTheme.wrapperBg, borderColor: activeTheme.borderColor }}>
          <div className="blueprint-legend-items">
            <div className="legend-chip">
              <span className="chip-color green" style={{ background: activeTheme.itemFill, borderColor: activeTheme.itemStroke }} />
              <span style={{ color: activeTheme.textColor }}>Architectural CAD Symbols</span>
            </div>
            <div className="legend-chip">
              <span className="chip-color orange" style={{ background: 'rgba(217, 83, 47, 0.3)', borderColor: activeTheme.doorColor }} />
              <span style={{ color: activeTheme.textColor }}>36" Entry Door Swing</span>
            </div>
            <div className="legend-chip">
              <span className="chip-color grid" style={{ borderColor: activeTheme.walkwayColor }} />
              <span style={{ color: activeTheme.textColor }}>Dotted Circulation Path</span>
            </div>
          </div>

          {hoveredItem ? (
            <div className="hovered-asset-card" style={{ background: activeTheme.containerBg, borderColor: activeTheme.borderColor }}>
              <div className="asset-card-mini-title">
                <CheckCircle2 size={13} className="text-success" />
                <strong style={{ color: activeTheme.textColor }}>{hoveredItem.name}</strong>
                <span className="price-tag">${hoveredItem.price}</span>
              </div>
              <div className="asset-card-mini-meta">
                <span>{Math.round(hoveredItem.wFt * 12)}"W × {Math.round(hoveredItem.dFt * 12)}"D</span>
                <span className="bullet">·</span>
                <span>Coords: ({hoveredItem.xFt.toFixed(1)}', {hoveredItem.yFt.toFixed(1)}')</span>
                <span className="bullet">·</span>
                <span className="clearance-text">0.0mm Collision Clear</span>
              </div>
            </div>
          ) : (
            <div className="hovered-asset-card placeholder" style={{ color: activeTheme.textColor, borderColor: activeTheme.borderColor }}>
              <Info size={14} />
              <span>Hover over any furniture CAD symbol to inspect exact measurements.</span>
            </div>
          )}
        </div>

        {/* Embedded Live AI Copilot Chat Assistant */}
        <AICopilotChat
          items={items}
          roomSpec={roomSpec}
          currentTheme={theme}
          onThemeChange={(newTheme) => setTheme(newTheme)}
          onUpdateItems={handleUpdateItems}
        />
      </div>

      {/* 2. Fullscreen Studio Overlay with Side-by-Side Live AI Copilot */}
      {isFullscreen && (
        <div className="fullscreen-studio-modal-overlay">
          <div className="fullscreen-studio-container" style={{ background: activeTheme.containerBg }}>
            {/* Fullscreen Header */}
            <div className="fullscreen-modal-header" style={{ background: activeTheme.wrapperBg, borderColor: activeTheme.borderColor }}>
              <div className="fullscreen-header-left">
                <div className="blueprint-badge" style={{ background: activeTheme.badgeBg, color: activeTheme.badgeText }}>
                  <Compass size={16} />
                  <span>FULLSCREEN 2D ARCHITECTURAL STUDIO</span>
                </div>
                <h3 className="fullscreen-room-title" style={{ color: activeTheme.textColor }}>
                  {roomWidthFt}' × {roomLengthFt}' {roomSpec.roomType.replace('-', ' ').toUpperCase()} · {roomSpec.style.toUpperCase()}
                </h3>
              </div>

              <div className="fullscreen-header-right">
                {/* Theme Selector */}
                <div className="blueprint-theme-selector">
                  <span className="theme-label" style={{ color: activeTheme.textColor }}>Theme:</span>
                  <button
                    type="button"
                    className={`theme-dot-btn ${theme === 'cad-architectural' ? 'active' : ''}`}
                    onClick={() => setTheme('cad-architectural')}
                    title="Architectural Black & White CAD"
                    style={{ background: '#FFFFFF', border: '1px solid #1C1917' }}
                  />
                  <button
                    type="button"
                    className={`theme-dot-btn ${theme === 'classic-blueprint' ? 'active' : ''}`}
                    onClick={() => setTheme('classic-blueprint')}
                    title="Classic Navy Blueprint"
                    style={{ background: '#0F2C59', border: '1px solid #FFFFFF' }}
                  />
                  <button
                    type="button"
                    className={`theme-dot-btn ${theme === 'cyber-emerald' ? 'active' : ''}`}
                    onClick={() => setTheme('cyber-emerald')}
                    title="Cyber Emerald Matrix"
                    style={{ background: '#5ED989' }}
                  />
                  <button
                    type="button"
                    className={`theme-dot-btn ${theme === 'warm-editorial' ? 'active' : ''}`}
                    onClick={() => setTheme('warm-editorial')}
                    title="Warm Editorial"
                    style={{ background: '#EFECE6', border: '1px solid #D5CEC2' }}
                  />
                  <button
                    type="button"
                    className={`theme-dot-btn ${theme === 'oled-monochrome' ? 'active' : ''}`}
                    onClick={() => setTheme('oled-monochrome')}
                    title="OLED Deep Black"
                    style={{ background: '#000000', border: '1px solid #D4AF37' }}
                  />
                </div>

                <button
                  type="button"
                  className="btn-exit-fullscreen"
                  onClick={() => setIsFullscreen(false)}
                  title="Close Fullscreen (ESC)"
                >
                  <Minimize2 size={15} />
                  <span>Exit Fullscreen (ESC)</span>
                </button>
              </div>
            </div>

            {/* Fullscreen Split Layout: Large Canvas on Left, Live AI Copilot on Right */}
            <div className="fullscreen-split-body">
              <div className="fullscreen-canvas-col" style={{ background: activeTheme.wrapperBg }}>
                <div style={{ transform: `scale(${zoomLevel * 1.15})`, transformOrigin: 'center center', transition: 'transform 0.2s ease', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {renderSVGCanvas()}
                </div>
              </div>

              <div className="fullscreen-copilot-col">
                <AICopilotChat
                  items={items}
                  roomSpec={roomSpec}
                  currentTheme={theme}
                  onThemeChange={(newTheme) => setTheme(newTheme)}
                  onUpdateItems={handleUpdateItems}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
