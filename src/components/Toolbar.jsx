import React from 'react';

export default function Toolbar({
  activeTool,
  setActiveTool,
  brushColor,
  setBrushColor,
  brushSize
}) {
  const tools = [
    {
      id: 'select',
      name: 'Select / Move',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l7 17 2.5-6.5L20 12 4 4z" />
      ),
      shortcut: 'V'
    },
    {
      id: 'brush',
      name: 'Smooth Brush (Freehand)',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 2.625a3.875 3.875 0 00-5.48 0L3.5 12.02v4.48h4.48l9.395-9.395a3.875 3.875 0 000-5.48z" />
      ),
      shortcut: 'B'
    },
    {
      id: 'eraser',
      name: 'Eraser Tool',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11L13 5 4.5 13.5a2.12 2.12 0 000 3L7.5 19.5a2.12 2.12 0 003 0L19 11z" />
      ),
      shortcut: 'E'
    },
    {
      id: 'rectangle',
      name: 'Rectangle Tool',
      icon: (
        <rect x="4" y="5" width="16" height="14" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ),
      shortcut: 'U'
    },
    {
      id: 'circle',
      name: 'Circle / Ellipse Tool',
      icon: (
        <ellipse cx="12" cy="12" rx="8" ry="7" strokeLinecap="round" strokeLinejoin="round" />
      ),
      shortcut: 'O'
    },
    {
      id: 'text',
      name: 'Text Tool (Click to place)',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 4v3h5.5v12h3V7H19V4H5z" />
      ),
      shortcut: 'T'
    },
    {
      id: 'bucket',
      name: 'Paint Bucket (Fill)',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11l-8-8-8.5 8.5a2.5 2.5 0 000 3.54l3.46 3.46a2.5 2.5 0 003.54 0L17 11.04" />
      ),
      shortcut: 'G'
    }
  ];

  return (
    <aside className="w-14 bg-[#14161d] border-r border-zinc-800 flex flex-col items-center py-3 gap-2 z-10 select-none">
      {tools.map((tool) => {
        const isActive = activeTool === tool.id || (tool.id === 'rectangle' && activeTool === 'shapes');
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.name} (${tool.shortcut})`}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition group relative ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <svg className="w-4 h-4 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              {tool.icon}
            </svg>

            {/* Custom Tooltip */}
            <span className="absolute left-12 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 z-50 shadow-xl">
              {tool.name} <span className="text-zinc-400">({tool.shortcut})</span>
            </span>
          </button>
        );
      })}

      <div className="w-8 h-[1px] bg-zinc-800 my-2" />

      {/* Primary Color Picker Swatch */}
      <div className="relative group">
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="w-7 h-7 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
          title="Foreground Color"
        />
        <div
          className="w-7 h-7 rounded-full border-2 border-zinc-600 shadow-md group-hover:scale-105 transition"
          style={{ backgroundColor: brushColor }}
        />
        <span className="absolute left-12 top-0 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 z-50 shadow-xl">
          Color: {brushColor}
        </span>
      </div>

      {/* Brush Size Indicator */}
      <div
        className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-[10px] text-zinc-300 font-mono"
        title={`Current Size: ${brushSize}px`}
      >
        {brushSize}
      </div>
    </aside>
  );
}
