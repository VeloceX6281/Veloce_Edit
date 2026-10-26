import React, { useState, useEffect } from 'react';

export default function HueSaturationModal({
  isOpen,
  onClose,
  onPreview,
  onApply
}) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [isColorize, setIsColorize] = useState(false);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setHue(0);
      setSaturation(0);
      setLightness(0);
      setIsColorize(false);
      setPreview(true);
    }
  }, [isOpen]);

  // Live preview callback
  useEffect(() => {
    if (isOpen && preview && onPreview) {
      onPreview({ hue, saturation, lightness, isColorize });
    } else if (isOpen && !preview && onPreview) {
      onPreview(null);
    }
  }, [isOpen, hue, saturation, lightness, isColorize, preview, onPreview]);

  if (!isOpen) return null;

  const handleReset = () => {
    setHue(0);
    setSaturation(0);
    setLightness(0);
    setIsColorize(false);
  };

  const handleApply = () => {
    if (onApply) onApply({ hue, saturation, lightness, isColorize });
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
          <span className="text-zinc-100 font-semibold text-xs">Hue / Saturation</span>
          <button
            type="button"
            onClick={handleCancel}
            className="w-5 h-5 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-3 text-[11px]">
          {/* Hue Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300">Hue:</label>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <input
                  type="number"
                  min="-180"
                  max="180"
                  value={hue}
                  onChange={(e) => setHue(Math.max(-180, Math.min(180, Number(e.target.value))))}
                  className="w-12 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-right text-zinc-100 focus:outline-none focus:border-[#1473e6]"
                />
                <span className="text-zinc-500 text-[10px]">°</span>
              </div>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
              className="w-full accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
            />
          </div>

          {/* Saturation Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300">Saturation:</label>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <input
                  type="number"
                  min="-100"
                  max="100"
                  value={saturation}
                  onChange={(e) => setSaturation(Math.max(-100, Math.min(100, Number(e.target.value))))}
                  className="w-12 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-right text-zinc-100 focus:outline-none focus:border-[#1473e6]"
                />
                <span className="text-zinc-500 text-[10px]">%</span>
              </div>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
            />
          </div>

          {/* Lightness Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300">Lightness:</label>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <input
                  type="number"
                  min="-100"
                  max="100"
                  value={lightness}
                  onChange={(e) => setLightness(Math.max(-100, Math.min(100, Number(e.target.value))))}
                  className="w-12 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-right text-zinc-100 focus:outline-none focus:border-[#1473e6]"
                />
                <span className="text-zinc-500 text-[10px]">%</span>
              </div>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={lightness}
              onChange={(e) => setLightness(Number(e.target.value))}
              className="w-full accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
            />
          </div>

          {/* Colorize Checkbox */}
          <div className="pt-1 flex items-center justify-between border-t border-[#333]">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[11px] hover:text-white">
              <input
                type="checkbox"
                checked={isColorize}
                onChange={(e) => setIsColorize(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[1px] accent-[#1473e6] cursor-pointer"
              />
              <span>Colorize</span>
            </label>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Photoshop Spectrum Bars */}
          <div className="space-y-1 pt-1">
            <div
              className="w-full h-2.5 rounded-[1px] border border-[#3a3a3a]"
              style={{
                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
              }}
              title="Base Color Spectrum"
            />
            <div
              className="w-full h-2.5 rounded-[1px] border border-[#3a3a3a]"
              style={{
                filter: `hue-rotate(${hue}deg) saturate(${100 + saturation}%) brightness(${100 + lightness}%)`,
                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
              }}
              title="Transformed Color Spectrum"
            />
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
