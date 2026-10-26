import React, { useState, useEffect } from 'react';

const DEFAULT_BALANCE = {
  shadows: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
  midtones: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
  highlights: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
  preserveLuminosity: true
};

export default function ColorBalanceModal({
  isOpen,
  onClose,
  onPreview,
  onApply
}) {
  const [toneRange, setToneRange] = useState('midtones'); // 'shadows' | 'midtones' | 'highlights'
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setToneRange('midtones');
      setBalance({
        shadows: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
        midtones: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
        highlights: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
        preserveLuminosity: true
      });
      setPreview(true);
    }
  }, [isOpen]);

  // Live preview callback
  useEffect(() => {
    if (isOpen && preview && onPreview) {
      onPreview(balance);
    } else if (isOpen && !preview && onPreview) {
      onPreview(null);
    }
  }, [isOpen, balance, preview, onPreview]);

  if (!isOpen) return null;

  const currentValues = balance[toneRange];

  const updateCurrentValue = (channel, value) => {
    const num = Math.max(-100, Math.min(100, Number(value)));
    setBalance((prev) => ({
      ...prev,
      [toneRange]: {
        ...prev[toneRange],
        [channel]: num
      }
    }));
  };

  const handleReset = () => {
    setBalance({
      shadows: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
      midtones: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
      highlights: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
      preserveLuminosity: true
    });
  };

  const handleApply = () => {
    if (onApply) onApply(balance);
    onClose();
  };

  const handleCancel = () => {
    if (onPreview) onPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-sm bg-[#282828] border border-[#3a3a3a] rounded-[2px] shadow-2xl p-4 text-zinc-200 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a]">
          <span className="text-zinc-100 font-semibold text-xs">Color Balance</span>
          <button
            type="button"
            onClick={handleCancel}
            className="w-5 h-5 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Tone Range Selector */}
        <div className="bg-[#1c1c1c] border border-[#3a3a3a] p-2 rounded-[2px] text-[11px] space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Tone Balance</span>
          <div className="flex items-center justify-around pt-0.5">
            {['shadows', 'midtones', 'highlights'].map((range) => (
              <label
                key={range}
                className="flex items-center gap-1.5 cursor-pointer capitalize text-zinc-300 hover:text-white"
              >
                <input
                  type="radio"
                  name="toneRange"
                  value={range}
                  checked={toneRange === range}
                  onChange={() => setToneRange(range)}
                  className="accent-[#1473e6] cursor-pointer"
                />
                <span>{range}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 3 Color Sliders */}
        <div className="space-y-3 text-[11px]">
          {/* Cyan - Red Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-[#00e5ff] font-sans">Cyan</span>
              <input
                type="number"
                min="-100"
                max="100"
                value={currentValues.cyanRed}
                onChange={(e) => updateCurrentValue('cyanRed', e.target.value)}
                className="w-10 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-center text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-[#ff5555] font-sans">Red</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={currentValues.cyanRed}
              onChange={(e) => updateCurrentValue('cyanRed', e.target.value)}
              className="w-full accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
            />
          </div>

          {/* Magenta - Green Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-[#ff55ea] font-sans">Magenta</span>
              <input
                type="number"
                min="-100"
                max="100"
                value={currentValues.magentaGreen}
                onChange={(e) => updateCurrentValue('magentaGreen', e.target.value)}
                className="w-10 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-center text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-[#55ff55] font-sans">Green</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={currentValues.magentaGreen}
              onChange={(e) => updateCurrentValue('magentaGreen', e.target.value)}
              className="w-full accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
            />
          </div>

          {/* Yellow - Blue Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-[#ffff55] font-sans">Yellow</span>
              <input
                type="number"
                min="-100"
                max="100"
                value={currentValues.yellowBlue}
                onChange={(e) => updateCurrentValue('yellowBlue', e.target.value)}
                className="w-10 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-center text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-[#5599ff] font-sans">Blue</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={currentValues.yellowBlue}
              onChange={(e) => updateCurrentValue('yellowBlue', e.target.value)}
              className="w-full accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
            />
          </div>

          {/* Preserve Luminosity Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-[#333]">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[11px] hover:text-white">
              <input
                type="checkbox"
                checked={balance.preserveLuminosity}
                onChange={(e) =>
                  setBalance((prev) => ({ ...prev, preserveLuminosity: e.target.checked }))
                }
                className="w-3.5 h-3.5 rounded-[1px] accent-[#1473e6] cursor-pointer"
              />
              <span>Preserve Luminosity</span>
            </label>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3a3a3a]">
          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[11px] hover:text-white">
            <input
              type="checkbox"
              checked={preview}
              onChange={(e) => setPreview(e.target.checked)}
              className="w-3.5 h-3.5 rounded-[1px] accent-[#1473e6] cursor-pointer"
            />
            <span>Preview</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-1 rounded-[2px] border border-[#3a3a3a] bg-[#1c1c1c] hover:bg-[#383838] text-zinc-300 text-[11px] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white font-medium text-[11px] shadow-sm transition cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
