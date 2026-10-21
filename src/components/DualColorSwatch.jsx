import React from 'react';

export default function DualColorSwatch({
  foregroundColor = '#000000',
  backgroundColor = '#ffffff',
  onSwapColors,
  onResetDefaultColors,
  onOpenColorPicker
}) {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center select-none my-1 shrink-0">
      {/* Miniature Default Colors Button ('D') */}
      <button
        type="button"
        onClick={onResetDefaultColors}
        className="absolute -top-1 -left-1 w-3 h-3 bg-[#202020] hover:bg-[#383838] border border-[#3a3a3a] rounded-[1px] flex items-center justify-center transition z-20 group"
        title="Default Colors (Black/White - D)"
      >
        <span className="w-1.5 h-1.5 bg-black border border-white/60 block" />
      </button>

      {/* Miniature Swap Colors Button ('X') */}
      <button
        type="button"
        onClick={onSwapColors}
        className="absolute -top-1 -right-1 w-3 h-3 text-[#a0a0a0] hover:text-white hover:bg-[#383838] rounded-[1px] flex items-center justify-center text-[9px] transition z-20"
        title="Swap Colors (X)"
      >
        ⇄
      </button>

      {/* Overlapping Background Swatch (Bottom-Right) */}
      <div
        onClick={() => onOpenColorPicker('background')}
        style={{ backgroundColor }}
        className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-[1px] border border-[#181818] shadow cursor-pointer hover:border-[#888] transition z-10"
        title={`Background Color: ${backgroundColor.toUpperCase()} (Click to change)`}
      />

      {/* Overlapping Foreground Swatch (Top-Left) */}
      <div
        onClick={() => onOpenColorPicker('foreground')}
        style={{ backgroundColor: foregroundColor }}
        className="absolute top-1 left-0.5 w-4.5 h-4.5 rounded-[1px] border border-[#181818] shadow-md cursor-pointer hover:border-white transition z-20"
        title={`Foreground Color: ${foregroundColor.toUpperCase()} (Click to change)`}
      />
    </div>
  );
}
