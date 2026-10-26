import React, { useState, useEffect } from 'react';

export default function ImageSizeModal({
  isOpen,
  onClose,
  currentWidth,
  currentHeight,
  onCommitImageSize
}) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [resolution, setResolution] = useState(72);
  const [constrainProportions, setConstrainProportions] = useState(true);
  const [resampleMethod, setResampleMethod] = useState('bicubic');

  useEffect(() => {
    if (isOpen) {
      setWidth(currentWidth);
      setHeight(currentHeight);
      setResolution(72);
      setConstrainProportions(true);
    }
  }, [isOpen, currentWidth, currentHeight]);

  if (!isOpen) return null;

  const aspectRatio = currentWidth / currentHeight;

  const handleWidthChange = (val) => {
    const num = Math.max(1, Math.min(10000, Number(val)));
    setWidth(num);
    if (constrainProportions) {
      setHeight(Math.max(1, Math.round(num / aspectRatio)));
    }
  };

  const handleHeightChange = (val) => {
    const num = Math.max(1, Math.min(10000, Number(val)));
    setHeight(num);
    if (constrainProportions) {
      setWidth(Math.max(1, Math.round(num * aspectRatio)));
    }
  };

  const handleConfirm = () => {
    if (width > 0 && height > 0) {
      onCommitImageSize({
        width,
        height,
        resolution,
        resampleMethod
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-sm bg-[#282828] border border-[#3a3a3a] rounded-[2px] shadow-2xl p-4 text-zinc-200 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a]">
          <div className="flex items-center gap-2">
            <span className="text-zinc-100 font-semibold text-xs">Image Size</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Current Size Preview Box */}
        <div className="bg-[#1c1c1c] p-2 rounded-[2px] border border-[#3a3a3a] text-[10px] space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span>Original Dimensions:</span>
            <span className="font-mono text-zinc-200 font-medium">{currentWidth} × {currentHeight} px</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Target Dimensions:</span>
            <span className="font-mono text-[#31a8ff] font-medium">{width} × {height} px</span>
          </div>
        </div>

        {/* Pixel Dimensions Form */}
        <div className="space-y-2.5 text-[11px]">
          {/* Width Input */}
          <div className="flex items-center justify-between">
            <label className="text-zinc-300">Width:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="8000"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="w-24 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-2 py-0.5 text-right font-mono text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-zinc-500 text-[10px] w-6">Pixels</span>
            </div>
          </div>

          {/* Chain Link Indicator */}
          <div className="flex items-center justify-end pr-8">
            <button
              type="button"
              onClick={() => setConstrainProportions(!constrainProportions)}
              className={`p-1 rounded-[2px] border transition flex items-center gap-1 text-[10px] ${
                constrainProportions
                  ? 'border-[#1473e6] bg-[#1473e6]/20 text-[#31a8ff]'
                  : 'border-[#3a3a3a] text-zinc-500 hover:text-zinc-300'
              }`}
              title="Constrain Proportions"
            >
              <span>{constrainProportions ? '🔗' : '🔓'}</span>
              <span>Constrain</span>
            </button>
          </div>

          {/* Height Input */}
          <div className="flex items-center justify-between">
            <label className="text-zinc-300">Height:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="8000"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="w-24 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-2 py-0.5 text-right font-mono text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-zinc-500 text-[10px] w-6">Pixels</span>
            </div>
          </div>

          {/* Resolution Input */}
          <div className="flex items-center justify-between">
            <label className="text-zinc-300">Resolution:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="1200"
                value={resolution}
                onChange={(e) => setResolution(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-2 py-0.5 text-right font-mono text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-zinc-500 text-[10px] w-6">Pixels/Inch</span>
            </div>
          </div>

          {/* Resample Method */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-zinc-300">Resample:</label>
            <select
              value={resampleMethod}
              onChange={(e) => setResampleMethod(e.target.value)}
              className="w-40 bg-[#181818] text-zinc-200 border border-[#3a3a3a] px-2 py-0.5 rounded-[2px] text-[10px] focus:outline-none focus:border-[#1473e6] cursor-pointer"
            >
              <option value="bicubic">Bicubic (Smooth)</option>
              <option value="bilinear">Bilinear</option>
              <option value="nearest">Nearest Neighbor (Hard)</option>
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
