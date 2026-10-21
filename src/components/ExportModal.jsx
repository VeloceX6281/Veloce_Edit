import React, { useState } from 'react';
import { getCompositeOperation } from '../utils/layerUtils';

export default function ExportModal({
  isOpen,
  onClose,
  layers,
  canvasWidth,
  canvasHeight,
  layerCanvasesRef,
  filterString = 'none'
}) {
  const [format, setFormat] = useState('png'); // 'png' | 'jpeg'
  const [scale, setScale] = useState(1);       // 1 | 2 | 3
  const [quality, setQuality] = useState(92);   // 10 - 100
  const [fileName, setFileName] = useState('veloce-edit-artwork');
  const [includeBackground, setIncludeBackground] = useState(true);

  if (!isOpen) return null;

  const exportW = Math.round(canvasWidth * scale);
  const exportH = Math.round(canvasHeight * scale);

  const handleDownload = () => {
    // 1. Create high-resolution export canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportW;
    exportCanvas.height = exportH;
    const expCtx = exportCanvas.getContext('2d');

    // High quality scaling
    expCtx.imageSmoothingEnabled = true;
    expCtx.imageSmoothingQuality = 'high';

    // Scale drawing context
    expCtx.scale(scale, scale);

    // Apply solid background if JPEG or if includeBackground is checked
    if (format === 'jpeg' || includeBackground) {
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Apply live filter if active
    if (filterString && filterString !== 'none') {
      expCtx.filter = filterString;
    }

    // 2. Flatten all visible layers from bottom (index 0) to top
    layers.forEach((layer) => {
      if (!layer.visible) return;
      const canvas = layerCanvasesRef.current[layer.id];
      if (!canvas) return;

      expCtx.save();
      expCtx.globalAlpha = layer.opacity / 100;
      expCtx.globalCompositeOperation = getCompositeOperation(layer.blendMode);
      expCtx.drawImage(canvas, 0, 0);
      expCtx.restore();
    });

    // 3. Export to file format
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const qualityParam = format === 'jpeg' ? quality / 100 : undefined;

    const dataUrl = exportCanvas.toDataURL(mimeType, qualityParam);
    const link = document.createElement('a');
    link.download = `${fileName.trim() || 'veloce-artwork'}.${format}`;
    link.href = dataUrl;
    link.click();

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#181a22] border border-zinc-700/80 rounded-xl shadow-2xl p-6 text-zinc-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              💾
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">Export Multi-Layer Artwork</h3>
              <p className="text-[11px] text-zinc-400">Flatten visible layers & high-resolution render</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          {/* File Name */}
          <div className="flex flex-col gap-1.5">
            <span className="text-zinc-400 font-medium">File Name</span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Format Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-zinc-400 font-medium">Image Format</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`py-2 px-3 rounded-lg border text-left transition flex flex-col gap-0.5 ${
                  format === 'png'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white font-medium shadow-sm'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="font-semibold text-xs">PNG</span>
                <span className="text-[10px] text-zinc-500">Supports transparency</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`py-2 px-3 rounded-lg border text-left transition flex flex-col gap-0.5 ${
                  format === 'jpeg'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white font-medium shadow-sm'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="font-semibold text-xs">JPEG</span>
                <span className="text-[10px] text-zinc-500">Smaller file size</span>
              </button>
            </div>
          </div>

          {/* Scale / Resolution Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="font-medium">Resolution Scale</span>
              <span className="font-mono text-indigo-400 font-medium">
                {exportW} × {exportH} px
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { s: 1, label: '1x (Standard)' },
                { s: 2, label: '2x (Retina)' },
                { s: 3, label: '3x (Ultra HD)' }
              ].map((opt) => (
                <button
                  key={opt.s}
                  type="button"
                  onClick={() => setScale(opt.s)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition text-[11px] font-medium ${
                    scale === opt.s
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (JPEG only) */}
          {format === 'jpeg' && (
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex justify-between items-center text-zinc-400">
                <span>JPEG Compression Quality</span>
                <span className="font-mono text-zinc-200 font-medium">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
              />
            </div>
          )}

          {/* Background Toggle (PNG only) */}
          {format === 'png' && (
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 pt-1">
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={(e) => setIncludeBackground(e.target.checked)}
                className="rounded-[1px] accent-[#1473e6] w-3.5 h-3.5"
              />
              <span className="text-[11px]">Include white background (Uncheck for transparency)</span>
            </label>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#383838]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[2px] text-xs text-zinc-300 hover:text-white hover:bg-[#383838] transition border border-[#383838]"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-1.5 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white font-medium text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
