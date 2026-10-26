import React, { useState, useEffect, useRef } from 'react';
import { computeHistogram } from '../utils/tonalAdjustmentUtils';

export default function LevelsModal({
  isOpen,
  onClose,
  activeLayerCanvas,
  onPreview,
  onApply
}) {
  const [inBlack, setInBlack] = useState(0);
  const [gamma, setGamma] = useState(1.0);
  const [inWhite, setInWhite] = useState(255);
  const [outBlack, setOutBlack] = useState(0);
  const [outWhite, setOutWhite] = useState(255);
  const [preview, setPreview] = useState(true);

  const canvasRef = useRef(null);
  const [histogramBins, setHistogramBins] = useState(null);

  // Compute histogram whenever modal opens or canvas changes
  useEffect(() => {
    if (isOpen && activeLayerCanvas) {
      try {
        const ctx = activeLayerCanvas.getContext('2d', { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, activeLayerCanvas.width, activeLayerCanvas.height);
        const bins = computeHistogram(imgData);
        setHistogramBins(bins);
      } catch (e) {
        console.error('Failed to compute histogram:', e);
      }

      setInBlack(0);
      setGamma(1.0);
      setInWhite(255);
      setOutBlack(0);
      setOutWhite(255);
      setPreview(true);
    }
  }, [isOpen, activeLayerCanvas]);

  // Draw histogram on canvas
  useEffect(() => {
    if (!histogramBins || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, w, h);

    // Find peak (excluding pure black/white outlier if needed)
    let max = 1;
    for (let i = 1; i < 255; i++) {
      if (histogramBins[i] > max) max = histogramBins[i];
    }

    // Draw bars
    ctx.fillStyle = '#777777';
    for (let i = 0; i < 256; i++) {
      const barH = Math.min(h, Math.round((histogramBins[i] / max) * (h - 4)));
      const x = Math.round((i / 255) * (w - 1));
      ctx.fillRect(x, h - barH, 1, barH);
    }

    // Grid marks
    ctx.strokeStyle = '#2d2d2d';
    ctx.strokeRect(0, 0, w, h);
  }, [histogramBins]);

  // Trigger live preview
  useEffect(() => {
    if (isOpen && preview && onPreview) {
      onPreview({ inBlack, gamma, inWhite, outBlack, outWhite });
    } else if (isOpen && !preview && onPreview) {
      // Revert preview to original
      onPreview(null);
    }
  }, [isOpen, inBlack, gamma, inWhite, outBlack, outWhite, preview, onPreview]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (onApply) {
      onApply({ inBlack, gamma, inWhite, outBlack, outWhite });
    }
    onClose();
  };

  const handleCancel = () => {
    if (onPreview) onPreview(null); // Revert live preview
    onClose();
  };

  const handleReset = () => {
    setInBlack(0);
    setGamma(1.0);
    setInWhite(255);
    setOutBlack(0);
    setOutWhite(255);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-md bg-[#282828] border border-[#3a3a3a] rounded-[2px] shadow-2xl p-4 text-zinc-200 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a]">
          <span className="text-zinc-100 font-semibold text-xs">Levels</span>
          <button
            type="button"
            onClick={handleCancel}
            className="w-5 h-5 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Histogram & Input Levels */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-300">
            <span>Input Levels:</span>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <input
                type="number"
                min="0"
                max={inWhite - 1}
                value={inBlack}
                onChange={(e) => setInBlack(Math.max(0, Math.min(inWhite - 1, Number(e.target.value))))}
                className="w-10 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-center text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="9.9"
                value={gamma}
                onChange={(e) => setGamma(Math.max(0.1, Math.min(9.9, Number(e.target.value))))}
                className="w-12 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-center text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <input
                type="number"
                min={inBlack + 1}
                max="255"
                value={inWhite}
                onChange={(e) => setInWhite(Math.max(inBlack + 1, Math.min(255, Number(e.target.value))))}
                className="w-10 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-center text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
            </div>
          </div>

          {/* Histogram Canvas */}
          <div className="relative border border-[#3a3a3a] rounded-[2px] overflow-hidden bg-[#181818]">
            <canvas
              ref={canvasRef}
              width={256}
              height={100}
              className="w-full h-24 block"
            />
          </div>

          {/* Input Levels Slider Range */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
              <span>Shadow: {inBlack}</span>
              <span>Gamma: {gamma}</span>
              <span>Highlight: {inWhite}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="range"
                min="0"
                max={Math.max(0, inWhite - 1)}
                value={inBlack}
                onChange={(e) => setInBlack(Number(e.target.value))}
                className="accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
                title="Input Black Point"
              />
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.05"
                value={gamma}
                onChange={(e) => setGamma(Number(e.target.value))}
                className="accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
                title="Input Gamma Midtone"
              />
              <input
                type="range"
                min={Math.min(255, inBlack + 1)}
                max="255"
                value={inWhite}
                onChange={(e) => setInWhite(Number(e.target.value))}
                className="accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
                title="Input White Point"
              />
            </div>
          </div>
        </div>

        {/* Output Levels */}
        <div className="space-y-2 pt-2 border-t border-[#3a3a3a]">
          <div className="flex items-center justify-between text-[11px] text-zinc-300">
            <span>Output Levels:</span>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <input
                type="number"
                min="0"
                max="255"
                value={outBlack}
                onChange={(e) => setOutBlack(Math.max(0, Math.min(255, Number(e.target.value))))}
                className="w-10 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-center text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
              <span className="text-zinc-500">—</span>
              <input
                type="number"
                min="0"
                max="255"
                value={outWhite}
                onChange={(e) => setOutWhite(Math.max(0, Math.min(255, Number(e.target.value))))}
                className="w-10 bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-1 py-0.5 text-center text-zinc-100 focus:outline-none focus:border-[#1473e6]"
              />
            </div>
          </div>

          {/* Output Gradient Bar */}
          <div
            className="w-full h-3 border border-[#3a3a3a] rounded-[1px]"
            style={{
              background: `linear-gradient(to right, rgb(${outBlack},${outBlack},${outBlack}), rgb(${outWhite},${outWhite},${outWhite}))`
            }}
          />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <input
              type="range"
              min="0"
              max="255"
              value={outBlack}
              onChange={(e) => setOutBlack(Number(e.target.value))}
              className="accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
              title="Output Black Level"
            />
            <input
              type="range"
              min="0"
              max="255"
              value={outWhite}
              onChange={(e) => setOutWhite(Number(e.target.value))}
              className="accent-[#1473e6] h-1.5 bg-[#3a3a3a] rounded cursor-pointer"
              title="Output White Level"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3a3a3a]">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[11px] hover:text-white">
              <input
                type="checkbox"
                checked={preview}
                onChange={(e) => setPreview(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[1px] accent-[#1473e6] cursor-pointer"
              />
              <span>Preview</span>
            </label>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              Reset
            </button>
          </div>

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
