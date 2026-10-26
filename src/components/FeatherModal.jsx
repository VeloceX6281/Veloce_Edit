import React, { useState, useEffect, useRef } from 'react';

export default function FeatherModal({ isOpen, onClose, onApply, currentRadius = 5 }) {
  const [radius, setRadius] = useState(currentRadius);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRadius(currentRadius);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, currentRadius]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = Math.max(0.1, Math.min(250, Number(radius) || 5));
    onApply(val);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 select-none font-sans">
      <div className="w-[300px] bg-[#2b2b2b] border border-[#3a3a3a] rounded-[3px] shadow-2xl overflow-hidden text-[11px] text-zinc-300 animate-in fade-in zoom-in-95 duration-100">
        {/* Title Bar */}
        <div className="h-7 bg-[#222222] border-b border-[#181818] px-3 flex items-center justify-between">
          <span className="font-semibold text-zinc-200">Feather Selection</span>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 rounded-[1px] hover:bg-[#383838] hover:text-white flex items-center justify-center text-xs text-zinc-400"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="featherRadiusInput" className="text-zinc-300">
              Feather Radius:
            </label>
            <div className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#3a3a3a] px-2 py-1 rounded-[2px]">
              <input
                id="featherRadiusInput"
                ref={inputRef}
                type="number"
                step="0.5"
                min="0.1"
                max="250"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-16 bg-transparent text-zinc-100 font-mono text-right focus:outline-none text-[11px]"
              />
              <span className="text-zinc-500 text-[10px]">pixels</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 italic">
            Softens selection boundary (0.1 to 250 px).
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#333333]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-[2px] bg-[#1c1c1c] hover:bg-[#383838] border border-[#3a3a3a] text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white font-medium shadow-sm transition"
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
