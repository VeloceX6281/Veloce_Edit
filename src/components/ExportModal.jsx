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
  const [format, setFormat] = useState('png'); // 'png' | 'jpeg' | 'webp'
  const [scale, setScale] = useState(1);       // 1 | 2 | 3
  const [quality, setQuality] = useState(92);   // 10 - 100
  const [fileName, setFileName] = useState('Untitled-1');
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
    let mimeType = 'image/png';
    if (format === 'jpeg') mimeType = 'image/jpeg';
    else if (format === 'webp') mimeType = 'image/webp';

    const qualityParam = format === 'jpeg' || format === 'webp' ? quality / 100 : undefined;

    const dataUrl = exportCanvas.toDataURL(mimeType, qualityParam);
    const link = document.createElement('a');
    link.download = `${fileName.trim() || 'veloce-artwork'}.${format}`;
    link.href = dataUrl;
    link.click();

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-md bg-[#282828] border border-[#3a3a3a] rounded-[2px] shadow-2xl p-5 text-zinc-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[2px] bg-[#1473e6]/20 border border-[#1473e6]/40 flex items-center justify-center text-[#31a8ff]">
              💾
            </div>
            <div>
              <h3 className="font-semibold text-xs text-zinc-100">Export As (Photoshop Web)</h3>
              <p className="text-[10px] text-zinc-400">Flatten visible layers & high-resolution render</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-3.5 text-xs">
          {/* File Name */}
          <div className="flex flex-col gap-1">
            <span className="text-zinc-400 font-medium text-[11px]">File Name</span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-[#181818] border border-[#3a3a3a] rounded-[2px] px-2.5 py-1 text-zinc-100 text-xs focus:outline-none focus:border-[#1473e6]"
            />
          </div>

          {/* Format Selector: PNG, JPEG, WebP */}
          <div className="flex flex-col gap-1">
            <span className="text-zinc-400 font-medium text-[11px]">Image Format</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`py-1.5 px-2.5 rounded-[2px] border text-left transition flex flex-col gap-0.5 ${
                  format === 'png'
                    ? 'border-[#1473e6] bg-[#1473e6]/20 text-white font-medium shadow-sm'
                    : 'border-[#3a3a3a] bg-[#181818] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="font-semibold text-xs">PNG</span>
                <span className="text-[9px] text-zinc-500">Lossless alpha</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`py-1.5 px-2.5 rounded-[2px] border text-left transition flex flex-col gap-0.5 ${
                  format === 'jpeg'
                    ? 'border-[#1473e6] bg-[#1473e6]/20 text-white font-medium shadow-sm'
                    : 'border-[#3a3a3a] bg-[#181818] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="font-semibold text-xs">JPEG</span>
                <span className="text-[9px] text-zinc-500">Compact size</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('webp')}
                className={`py-1.5 px-2.5 rounded-[2px] border text-left transition flex flex-col gap-0.5 ${
                  format === 'webp'
                    ? 'border-[#1473e6] bg-[#1473e6]/20 text-white font-medium shadow-sm'
                    : 'border-[#3a3a3a] bg-[#181818] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="font-semibold text-xs">WebP</span>
                <span className="text-[9px] text-zinc-500">Modern web</span>
              </button>
            </div>
          </div>

          {/* Scale / Resolution Selection */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-zinc-400 text-[11px]">
              <span className="font-medium">Resolution Scale</span>
              <span className="font-mono text-[#31a8ff] font-medium">
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
                  className={`py-1 px-2 rounded-[2px] border text-center transition text-[10px] font-medium ${
                    scale === opt.s
                      ? 'border-[#1473e6] bg-[#1473e6] text-white shadow-sm'
                      : 'border-[#3a3a3a] bg-[#181818] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (JPEG & WebP) */}
          {(format === 'jpeg' || format === 'webp') && (
            <div className="flex flex-col gap-1 p-2 rounded-[2px] bg-[#181818] border border-[#3a3a3a]">
              <div className="flex justify-between items-center text-zinc-400 text-[10px]">
                <span>Compression Quality</span>
                <span className="font-mono text-zinc-200 font-medium">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-[#1473e6] cursor-pointer h-1 bg-[#3a3a3a] rounded"
              />
            </div>
          )}

          {/* Background Toggle (PNG / WebP) */}
          {format !== 'jpeg' && (
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 pt-0.5">
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={(e) => setIncludeBackground(e.target.checked)}
                className="rounded-[1px] accent-[#1473e6] w-3 h-3 cursor-pointer"
              />
              <span className="text-[10px]">Include solid white background (uncheck for alpha transparency)</span>
            </label>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3a3a3a]">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-[2px] text-xs text-zinc-300 hover:text-white hover:bg-[#383838] transition border border-[#3a3a3a]"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-1 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
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
