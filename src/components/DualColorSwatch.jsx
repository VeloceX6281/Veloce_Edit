import React from 'react';

export default function DualColorSwatch({
  foregroundColor = '#6366f1',
  backgroundColor = '#ffffff',
  onSwapColors,
  onResetDefaultColors,
  onOpenColorPicker
}) {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center select-none my-1">
      {/* Miniature Default Colors Button ('D') */}
      <button
        type="button"
        onClick={onResetDefaultColors}
        className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-sm flex items-center justify-center text-[7px] text-zinc-300 transition z-20 group"
        title="Default Colors (Black/White - D)"
      >
        <span className="w-1.5 h-1.5 bg-black border border-white/50 block" />
      </button>

      {/* Miniature Swap Colors Button ('X') */}
      <button
        type="button"
        onClick={onSwapColors}
        className="absolute -top-1 -right-1 w-3.5 h-3.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded flex items-center justify-center text-[10px] transition z-20"
        title="Swap Colors (X)"
      >
        ⇄
      </button>

      {/* Overlapping Background Swatch (Bottom-Right) */}
      <div
        onClick={() => onOpenColorPicker('background')}
        style={{ backgroundColor }}
        className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-md border-2 border-zinc-700 shadow-md cursor-pointer hover:border-zinc-400 transition hover:scale-105 z-10"
        title={`Background Color: ${backgroundColor.toUpperCase()} (Click to change)`}
      />

      {/* Overlapping Foreground Swatch (Top-Left) */}
      <div
        onClick={() => onOpenColorPicker('foreground')}
        style={{ backgroundColor: foregroundColor }}
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-md border-2 border-zinc-300 shadow-lg cursor-pointer hover:border-white transition hover:scale-105 z-20"
        title={`Foreground Color: ${foregroundColor.toUpperCase()} (Click to change)`}
      />
    </div>
  );
}
