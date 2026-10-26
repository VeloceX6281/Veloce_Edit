import React, { useState, useEffect } from 'react';
import { BLEND_MODES } from '../utils/layerUtils';

export default function FillModal({
  isOpen,
  onClose,
  foregroundColor = '#000000',
  backgroundColor = '#ffffff',
  isTransparencyLocked = false,
  hasSelection = false,
  onCommitFill
}) {
  const [contentType, setContentType] = useState('foreground');
  const [blendMode, setBlendMode] = useState('normal');
  const [opacity, setOpacity] = useState(100);
  const [preserveTransparency, setPreserveTransparency] = useState(isTransparencyLocked);

  useEffect(() => {
    if (isOpen) {
      setContentType('foreground');
      setBlendMode('normal');
      setOpacity(100);
      setPreserveTransparency(isTransparencyLocked);
    }
  }, [isOpen, isTransparencyLocked]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let resolvedColor = foregroundColor;
    if (contentType === 'background') resolvedColor = backgroundColor;
    else if (contentType === 'gray') resolvedColor = '#808080';
    else if (contentType === 'white') resolvedColor = '#ffffff';
    else if (contentType === 'black') resolvedColor = '#000000';

    onCommitFill({
      contentType,
      color: resolvedColor,
      blendMode,
      opacity: Math.max(0, Math.min(100, Number(opacity))),
      preserveTransparency
    });
    onClose();
  };

  const getColorPreview = () => {
    if (contentType === 'foreground') return foregroundColor;
    if (contentType === 'background') return backgroundColor;
    if (contentType === 'gray') return '#808080';
    if (contentType === 'white') return '#ffffff';
    if (contentType === 'black') return '#000000';
    return foregroundColor;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-xs bg-[#282828] border border-[#3a3a3a] rounded-[2px] shadow-2xl p-4 text-zinc-200 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a]">
          <div className="flex items-center gap-2">
            <span className="text-zinc-100 font-semibold text-xs">Fill</span>
            {hasSelection && (
              <span className="text-[10px] text-[#31a8ff] bg-[#1473e6]/10 px-1.5 py-0.2 rounded border border-[#1473e6]/30">
                Selection Active
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* 1. Contents Section */}
        <div className="space-y-1.5 border border-[#383838] bg-[#222] p-2.5 rounded-[2px] text-[11px]">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Contents</span>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-zinc-300">Use:</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div
                className="w-3.5 h-3.5 rounded-[1px] border border-[#3a3a3a] shadow-sm shrink-0"
                style={{ backgroundColor: getColorPreview() }}
              />
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="bg-[#181818] text-zinc-200 border border-[#3a3a3a] px-2 py-0.5 rounded-[2px] text-[10px] focus:outline-none focus:border-[#1473e6] cursor-pointer flex-1 max-w-[150px]"
              >
                <option value="foreground">Foreground Color</option>
                <option value="background">Background Color</option>
                <option value="gray">50% Gray</option>
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Blending Section */}
        <div className="space-y-2 border border-[#383838] bg-[#222] p-2.5 rounded-[2px] text-[11px]">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Blending</span>

          {/* Mode */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Mode:</span>
            <select
              value={blendMode}
              onChange={(e) => setBlendMode(e.target.value)}
              className="w-36 bg-[#181818] text-zinc-200 border border-[#3a3a3a] px-2 py-0.5 rounded-[2px] text-[10px] focus:outline-none focus:border-[#1473e6] cursor-pointer"
            >
              {BLEND_MODES.map((bm) => (
                <option key={bm.id} value={bm.id}>
                  {bm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Opacity */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Opacity:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="w-14 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1.5 py-0.5 text-right font-mono text-zinc-100 text-[10px] focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-zinc-500 text-[10px]">%</span>
            </div>
          </div>

          {/* Preserve Transparency */}
          <div className="pt-1 border-t border-[#333]">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-[10px] hover:text-white">
              <input
                type="checkbox"
                checked={preserveTransparency}
                onChange={(e) => setPreserveTransparency(e.target.checked)}
                className="w-3 h-3 rounded-[1px] accent-[#1473e6] cursor-pointer"
              />
              <span>Preserve Transparency</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#3a3a3a]">
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
