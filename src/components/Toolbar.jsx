import React from 'react';
import DualColorSwatch from './DualColorSwatch';

export default function Toolbar({
  activeTool,
  setActiveTool,
  foregroundColor,
  backgroundColor,
  onSwapColors,
  onResetDefaultColors,
  onOpenColorPicker,
  brushSize,
  isQuickMaskMode = false,
  onToggleQuickMask
}) {
  const tools = [
    {
      id: 'select',
      name: 'Move Tool',
      shortcut: 'V',
      hasFlyout: false,
      icon: (
        <>
          <path d="M4 4l6.5 15.5 2.5-6.5 6.5-2.5L4 4z" />
          <path d="M15 15h6m-3-3v6" />
        </>
      )
    },
    {
      id: 'marquee',
      name: 'Marquee Tool',
      shortcut: 'M',
      hasFlyout: true,
      icon: (
        <rect x="3.5" y="4.5" width="17" height="15" rx="1" strokeDasharray="3 3" />
      )
    },
    {
      id: 'lasso',
      name: activeTool === 'polygonal_lasso' ? 'Polygonal Lasso Tool' : 'Lasso Tool',
      shortcut: 'L',
      hasFlyout: true,
      icon: activeTool === 'polygonal_lasso' ? (
        <polygon points="4,18 9,5 19,8 16,19 9,15" strokeDasharray="2 2" />
      ) : (
        <path d="M7 15c-3-1.5-3.5-5.5-1.5-8C7.5 4.5 13 4 17 6.5s4 6.5 2 9c-2.5 3-7 3.5-10 1.5l-5 5" />
      )
    },
    {
      id: 'magic_wand',
      name: 'Magic Wand Tool',
      shortcut: 'W',
      hasFlyout: true,
      icon: (
        <>
          <path d="M15 4l5 5L7 22H2v-5L15 4z" />
          <path d="M18.5 2.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" />
          <path d="M9 2.5l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" />
        </>
      )
    },
    {
      id: 'crop',
      name: 'Crop Tool',
      shortcut: 'C',
      hasFlyout: false,
      icon: (
        <>
          <path d="M6 2v14a2 2 0 002 2h14" />
          <path d="M2 6h14a2 2 0 012 2v14" />
        </>
      )
    },
    {
      id: 'eyedropper',
      name: 'Eyedropper Tool',
      shortcut: 'I',
      hasFlyout: false,
      icon: (
        <>
          <path d="M19.4 4.6a2 2 0 00-2.8 0l-1.8 1.8 3.8 3.8 1.8-1.8a2 2 0 000-2.8z" />
          <path d="M13.4 7.8L5 16.2V20h3.8l8.4-8.4-3.8-3.8z" />
          <path d="M4 20l-1.5 1.5" />
        </>
      )
    },
    {
      id: 'spot_healing',
      name: 'Spot Healing Brush Tool',
      shortcut: 'J',
      hasFlyout: false,
      icon: (
        <>
          <path d="M4.5 15.5l10-10a3.18 3.18 0 014.5 4.5l-10 10a3.18 3.18 0 01-4.5-4.5z" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <line x1="8.5" y1="15.5" x2="15.5" y2="8.5" strokeDasharray="1.5 1.5" />
        </>
      )
    },
    {
      id: 'brush',
      name: 'Brush Tool',
      shortcut: 'B',
      hasFlyout: true,
      icon: (
        <>
          <path d="M18.375 2.625a3.875 3.875 0 00-5.48 0L3.5 12.02v4.48h4.48l9.395-9.395a3.875 3.875 0 000-5.48z" />
          <path d="M15.5 5.5l3 3" />
          <path d="M9 19.5c1.5.5 3 0 4-1" />
        </>
      )
    },
    {
      id: 'clone',
      name: 'Clone Stamp Tool',
      shortcut: 'S',
      hasFlyout: false,
      icon: (
        <>
          <path d="M12 3a2.5 2.5 0 00-2.5 2.5v2.8A5 5 0 006 13v2h12v-2a5 5 0 00-3.5-4.7V5.5A2.5 2.5 0 0012 3z" />
          <path d="M4 19h16v2H4z" />
        </>
      )
    },
    {
      id: 'eraser',
      name: activeTool === 'magic_eraser' ? 'Magic Eraser Tool' : 'Eraser Tool',
      shortcut: 'E',
      hasFlyout: true,
      icon: activeTool === 'magic_eraser' ? (
        <>
          <path d="M18 13l-6 6M2 20h20M5 16l8-8 6 6-8 8H5v-6z" />
          <path d="M19 4l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" />
        </>
      ) : (
        <path d="M18 13l-6 6M2 20h20M5 16l8-8 6 6-8 8H5v-6z" />
      )
    },
    {
      id: 'bucket',
      name: activeTool === 'gradient' ? 'Gradient Tool' : 'Paint Bucket Tool',
      shortcut: 'G',
      hasFlyout: true,
      icon: activeTool === 'gradient' ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="3 2" />
        </>
      ) : (
        <>
          <path d="M19 11l-8-8-8.5 8.5a2.5 2.5 0 000 3.54l3.46 3.46a2.5 2.5 0 003.54 0L17 11" />
          <path d="M19 11v5a2 2 0 01-2 2h-1" />
          <path d="M21 16a2 2 0 11-4 0c0-1.5 2-3 2-3s2 1.5 2 3z" />
        </>
      )
    },
    {
      id: 'dodge',
      name:
        activeTool === 'burn'
          ? 'Burn Tool'
          : activeTool === 'sponge'
          ? 'Sponge Tool'
          : 'Dodge Tool',
      shortcut: 'O',
      hasFlyout: true,
      icon:
        activeTool === 'burn' ? (
          <>
            <path d="M10 4a2 2 0 012 2v2a2 2 0 012-2 2 2 0 012 2v4.5a3.5 3.5 0 01-7 0V6a2 2 0 012-2z" />
            <path d="M5 14a6 6 0 0012 0v-2H5v2z" />
          </>
        ) : activeTool === 'sponge' ? (
          <>
            <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
            <circle cx="10" cy="10" r="1" />
            <circle cx="14" cy="11" r="1" />
            <circle cx="11" cy="14" r="1" />
          </>
        ) : (
          <>
            <circle cx="12" cy="8" r="5" />
            <path d="M12 13v8" />
          </>
        )
    },
    {
      id: 'text',
      name: 'Horizontal Type Tool',
      shortcut: 'T',
      hasFlyout: false,
      icon: (
        <>
          <path d="M4 7V4h16v3" />
          <path d="M12 4v16" />
          <path d="M8 20h8" />
        </>
      )
    },
    {
      id: 'shapes',
      name: 'Shape Tool',
      shortcut: 'U',
      hasFlyout: true,
      icon: (
        <rect x="4" y="4" width="16" height="16" rx="2" />
      )
    },
    {
      id: 'hand',
      name: 'Hand Tool',
      shortcut: 'H',
      hasFlyout: false,
      icon: (
        <path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      )
    },
    {
      id: 'zoom',
      name: 'Zoom Tool',
      shortcut: 'Z',
      hasFlyout: false,
      icon: (
        <>
          <path d="M21 21l-4.35-4.35" />
          <circle cx="10.5" cy="10.5" r="7.5" />
          <path d="M10.5 7.5v6" />
          <path d="M7.5 10.5h6" />
        </>
      )
    }
  ];

  const handleToolClick = (toolId) => {
    if (toolId === 'marquee') {
      setActiveTool(activeTool === 'marquee-ellipse' ? 'marquee-rect' : 'marquee-ellipse');
    } else if (toolId === 'lasso') {
      setActiveTool(activeTool === 'polygonal_lasso' ? 'lasso' : 'polygonal_lasso');
    } else if (toolId === 'eraser') {
      setActiveTool(activeTool === 'eraser' ? 'magic_eraser' : 'eraser');
    } else if (toolId === 'bucket') {
      setActiveTool(activeTool === 'gradient' ? 'bucket' : 'gradient');
    } else if (toolId === 'dodge') {
      if (activeTool === 'dodge') setActiveTool('burn');
      else if (activeTool === 'burn') setActiveTool('sponge');
      else setActiveTool('dodge');
    } else if (toolId === 'shapes') {
      if (activeTool === 'rectangle') setActiveTool('circle');
      else if (activeTool === 'circle') setActiveTool('line');
      else setActiveTool('rectangle');
    } else {
      setActiveTool(toolId);
    }
  };

  return (
    <aside className="w-[36px] bg-[#282828] border-r border-[#1a1a1a] flex flex-col items-center py-1 gap-0.5 z-20 select-none shrink-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tools.map((tool) => {
        const isActive =
          activeTool === tool.id ||
          (tool.id === 'marquee' &&
            (activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse' || activeTool === 'marquee')) ||
          (tool.id === 'lasso' &&
            (activeTool === 'lasso' || activeTool === 'polygonal_lasso')) ||
          (tool.id === 'eraser' &&
            (activeTool === 'eraser' || activeTool === 'magic_eraser')) ||
          (tool.id === 'bucket' &&
            (activeTool === 'bucket' || activeTool === 'gradient')) ||
          (tool.id === 'dodge' &&
            (activeTool === 'dodge' || activeTool === 'burn' || activeTool === 'sponge')) ||
          (tool.id === 'shapes' &&
            (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'shapes'));

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.name} (${tool.shortcut})`}
            className={`w-[28px] h-[28px] flex items-center justify-center rounded-[2px] transition group relative shrink-0 ${
              isActive
                ? 'bg-[#383838] text-white border-l-2 border-[#1473e6] shadow-sm'
                : 'text-[#9c9c9c] hover:text-[#ffffff] hover:bg-[#343434]'
            }`}
          >
            <svg
              className="w-[17px] h-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {tool.icon}
            </svg>

            {/* Small corner triangle indicator for tools with sub-tools */}
            {tool.hasFlyout && (
              <svg
                className={`absolute bottom-[2px] right-[2px] w-[5px] h-[5px] fill-current ${
                  isActive ? 'text-[#1473e6]' : 'text-zinc-500'
                }`}
                viewBox="0 0 6 6"
              >
                <polygon points="6,0 6,6 0,6" />
              </svg>
            )}

            {/* Photoshop Desktop Tooltip */}
            <span className="absolute left-8 px-2 py-0.5 rounded-[2px] bg-[#1c1c1c] border border-[#383838] text-[10px] text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition duration-100 z-50 shadow-2xl font-sans">
              {tool.name} <span className="text-[#888]">({tool.shortcut})</span>
            </span>
          </button>
        );
      })}

      <div className="w-5 h-[1px] bg-[#3a3a3a] my-1 shrink-0" />

      {/* Dual Color Swatch */}
      <DualColorSwatch
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        onSwapColors={onSwapColors}
        onResetDefaultColors={onResetDefaultColors}
        onOpenColorPicker={onOpenColorPicker}
      />

      {/* Quick Mask Mode Toggle Button (Hotkey Q) */}
      <button
        type="button"
        onClick={onToggleQuickMask}
        title={`Edit in ${isQuickMaskMode ? 'Standard Mode (Q)' : 'Quick Mask Mode (Q)'}`}
        className={`w-[26px] h-[24px] mt-1 flex items-center justify-center rounded-[2px] transition group relative shrink-0 ${
          isQuickMaskMode
            ? 'bg-[#b71c1c] text-white border border-[#ff5252] shadow-sm'
            : 'text-[#9c9c9c] hover:text-[#ffffff] hover:bg-[#343434] border border-[#383838]'
        }`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isQuickMaskMode ? (
            <>
              <rect x="2" y="2" width="20" height="20" rx="3" />
              <circle cx="12" cy="12" r="5" fill="#ff5252" stroke="#ffffff" />
            </>
          ) : (
            <>
              <rect x="2" y="2" width="20" height="20" rx="3" />
              <circle cx="12" cy="12" r="5" strokeDasharray="3 2" />
            </>
          )}
        </svg>
        <span className="absolute left-8 px-2 py-0.5 rounded-[2px] bg-[#1c1c1c] border border-[#383838] text-[10px] text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition duration-100 z-50 shadow-2xl font-sans">
          {isQuickMaskMode ? 'Standard Mode (Q)' : 'Quick Mask Mode (Q)'}
        </span>
      </button>

      {/* Brush Size Indicator */}
      <div
        className="w-5 h-3.5 rounded-[1px] bg-[#1c1c1c] border border-[#383838] flex items-center justify-center text-[9px] text-zinc-400 font-mono mt-0.5 shrink-0"
        title={`Brush Size: ${brushSize}px`}
      >
        {brushSize}
      </div>
    </aside>
  );
}
