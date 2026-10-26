import React, { useState, useEffect } from 'react';

const ANCHOR_CELLS = [
  { id: 'TL', label: 'Top-Left' },
  { id: 'TC', label: 'Top' },
  { id: 'TR', label: 'Top-Right' },
  { id: 'CL', label: 'Left' },
  { id: 'C',  label: 'Center' },
  { id: 'CR', label: 'Right' },
  { id: 'BL', label: 'Bottom-Left' },
  { id: 'BC', label: 'Bottom' },
  { id: 'BR', label: 'Bottom-Right' }
];

export default function CanvasSizeModal({
  isOpen,
  onClose,
  currentWidth,
  currentHeight,
  foregroundColor = '#000000',
  backgroundColor = '#ffffff',
  onCommitCanvasSize
}) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [anchor, setAnchor] = useState('C');
  const [extensionColor, setExtensionColor] = useState('white');

  useEffect(() => {
    if (isOpen) {
      setWidth(currentWidth);
      setHeight(currentHeight);
      setAnchor('C');
      setExtensionColor('white');
    }
  }, [isOpen, currentWidth, currentHeight]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (width > 0 && height > 0) {
      let resolvedColor = '#ffffff';
      if (extensionColor === 'black') resolvedColor = '#000000';
      else if (extensionColor === 'gray') resolvedColor = '#808080';
      else if (extensionColor === 'foreground') resolvedColor = foregroundColor;
      else if (extensionColor === 'background') resolvedColor = backgroundColor;

      onCommitCanvasSize({
        width: Math.round(width),
        height: Math.round(height),
        anchor,
        extensionColor: resolvedColor
      });
      onClose();
    }
  };

  // Helper to get arrow icon or symbol for anchor cell based on active anchor
  const getAnchorIcon = (cellId) => {
    if (cellId === anchor) {
      return <span className="w-2 h-2 rounded-full bg-[#1473e6] shadow-sm inline-block" />;
    }

    // Directional arrows relative to current anchor
    const rowMap = { TL: 0, TC: 0, TR: 0, CL: 1, C: 1, CR: 1, BL: 2, BC: 2, BR: 2 };
    const colMap = { TL: 0, TC: 1, TR: 2, CL: 0, C: 1, CR: 2, BL: 0, BC: 1, BR: 2 };

    const activeR = rowMap[anchor];
    const activeC = colMap[anchor];
    const cellR = rowMap[cellId];
    const cellC = colMap[cellId];

    const dr = cellR - activeR;
    const dc = cellC - activeC;

    if (dr < 0 && dc === 0) return '↑';
    if (dr > 0 && dc === 0) return '↓';
    if (dr === 0 && dc < 0) return '←';
    if (dr === 0 && dc > 0) return '→';
    if (dr < 0 && dc < 0) return '↖';
    if (dr < 0 && dc > 0) return '↗';
    if (dr > 0 && dc < 0) return '↙';
    if (dr > 0 && dc > 0) return '↘';
    return '•';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-sm bg-[#282828] border border-[#3a3a3a] rounded-[2px] shadow-2xl p-4 text-zinc-200 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a]">
          <span className="text-zinc-100 font-semibold text-xs">Canvas Size</span>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Current Size Info */}
        <div className="bg-[#1c1c1c] p-2 rounded-[2px] border border-[#3a3a3a] text-[10px] space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span>Current Size:</span>
            <span className="font-mono text-zinc-200 font-medium">{currentWidth} × {currentHeight} px</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>New Size:</span>
            <span className="font-mono text-[#31a8ff] font-medium">{width} × {height} px</span>
          </div>
        </div>

        {/* Dimension Inputs */}
        <div className="space-y-2.5 text-[11px]">
          <div className="flex items-center justify-between">
            <label className="text-zinc-300">Width:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="8000"
                value={width}
                onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-2 py-0.5 text-right font-mono text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-zinc-500 text-[10px] w-6">Pixels</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-zinc-300">Height:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="8000"
                value={height}
                onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-2 py-0.5 text-right font-mono text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-zinc-500 text-[10px] w-6">Pixels</span>
            </div>
          </div>

          {/* 3x3 Anchor Grid */}
          <div className="pt-1 flex items-center justify-between">
            <label className="text-zinc-300">Anchor:</label>
            <div className="grid grid-cols-3 gap-1 bg-[#181818] p-1 rounded-[2px] border border-[#3a3a3a]">
              {ANCHOR_CELLS.map((cell) => (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => setAnchor(cell.id)}
                  className={`w-7 h-7 flex items-center justify-center text-xs rounded-[1px] border transition ${
                    anchor === cell.id
                      ? 'border-[#1473e6] bg-[#1473e6]/20 text-[#31a8ff] font-bold'
                      : 'border-[#2d2d2d] bg-[#222] hover:bg-[#333] text-zinc-400'
                  }`}
                  title={`Anchor: ${cell.label}`}
                >
                  {getAnchorIcon(cell.id)}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Extension Color */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-zinc-300">Extension Color:</label>
            <select
              value={extensionColor}
              onChange={(e) => setExtensionColor(e.target.value)}
              className="w-40 bg-[#181818] text-zinc-200 border border-[#3a3a3a] px-2 py-0.5 rounded-[2px] text-[10px] focus:outline-none focus:border-[#1473e6] cursor-pointer"
            >
              <option value="white">White (#ffffff)</option>
              <option value="black">Black (#000000)</option>
              <option value="gray">50% Gray (#808080)</option>
              <option value="foreground">Foreground Color</option>
              <option value="background">Background Color</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-[#3a3a3a]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 rounded-[2px] border border-[#3a3a3a] bg-[#1c1c1c] hover:bg-[#383838] text-zinc-300 text-[11px] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white font-medium text-[11px] shadow-sm transition cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
