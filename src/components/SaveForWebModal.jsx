import React, { useState, useEffect, useRef, useCallback } from 'react';
import { compositeAllVisibleLayers } from '../utils/layerUtils';

export default function SaveForWebModal({
  isOpen,
  onClose,
  layers,
  canvasWidth,
  canvasHeight,
  layerCanvasesRef,
  filterString = 'none'
}) {
  const [viewTab, setViewTab] = useState('2-up'); // 'original' | 'optimized' | '2-up'
  const [format, setFormat] = useState('JPEG'); // 'JPEG' | 'PNG-24' | 'PNG-8' | 'WEBP'
  const [quality, setQuality] = useState(80); // 1 - 100
  const [outWidth, setOutWidth] = useState(canvasWidth);
  const [outHeight, setOutHeight] = useState(canvasHeight);
  const [constrainAspect, setConstrainAspect] = useState(true);
  const [fileSizeStr, setFileSizeStr] = useState('Calculating...');
  const [downloadBlob, setDownloadBlob] = useState(null);

  const originalCanvasRef = useRef(null);
  const optimizedCanvasRef = useRef(null);

  // Initialize dimensions on open
  useEffect(() => {
    if (isOpen) {
      setOutWidth(canvasWidth);
      setOutHeight(canvasHeight);
    }
  }, [isOpen, canvasWidth, canvasHeight]);

  // Compute composite image and generate optimized blob
  const updateOptimizedPreview = useCallback(() => {
    if (!isOpen) return;

    // 1. Composite all visible layers
    const composite = compositeAllVisibleLayers(layers, layerCanvasesRef, canvasWidth, canvasHeight);

    // 2. Scale to output dimensions
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = Math.max(1, outWidth);
    scaledCanvas.height = Math.max(1, outHeight);
    const sCtx = scaledCanvas.getContext('2d');
    if (filterString !== 'none') sCtx.filter = filterString;
    sCtx.drawImage(composite, 0, 0, outWidth, outHeight);

    // Update Original preview canvas
    if (originalCanvasRef.current) {
      const oc = originalCanvasRef.current;
      oc.width = outWidth;
      oc.height = outHeight;
      const ocCtx = oc.getContext('2d');
      ocCtx.clearRect(0, 0, outWidth, outHeight);
      ocCtx.drawImage(composite, 0, 0, outWidth, outHeight);
    }

    // Determine mime type and encoding quality
    let mime = 'image/jpeg';
    let q = quality / 100;
    if (format === 'PNG-24' || format === 'PNG-8') {
      mime = 'image/png';
    } else if (format === 'WEBP') {
      mime = 'image/webp';
    }

    // Export blob and compute file size
    scaledCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        setDownloadBlob(blob);

        const bytes = blob.size;
        if (bytes < 1024) {
          setFileSizeStr(`${bytes} B`);
        } else if (bytes < 1024 * 1024) {
          setFileSizeStr(`${(bytes / 1024).toFixed(1)} KB`);
        } else {
          setFileSizeStr(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
        }

        // Draw onto optimized preview canvas
        if (optimizedCanvasRef.current) {
          const optCanvas = optimizedCanvasRef.current;
          optCanvas.width = outWidth;
          optCanvas.height = outHeight;
          const optCtx = optCanvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            optCtx.clearRect(0, 0, outWidth, outHeight);
            optCtx.drawImage(img, 0, 0);
          };
          img.src = URL.createObjectURL(blob);
        }
      },
      mime,
      q
    );
  }, [isOpen, layers, layerCanvasesRef, canvasWidth, canvasHeight, outWidth, outHeight, format, quality, filterString]);

  useEffect(() => {
    updateOptimizedPreview();
  }, [updateOptimizedPreview]);

  if (!isOpen) return null;

  // Handle Dimension changes
  const handleWidthChange = (val) => {
    const w = Math.max(1, Number(val) || 1);
    setOutWidth(w);
    if (constrainAspect && canvasWidth > 0) {
      const ratio = canvasHeight / canvasWidth;
      setOutHeight(Math.round(w * ratio));
    }
  };

  const handleHeightChange = (val) => {
    const h = Math.max(1, Number(val) || 1);
    setOutHeight(h);
    if (constrainAspect && canvasHeight > 0) {
      const ratio = canvasWidth / canvasHeight;
      setOutWidth(Math.round(h * ratio));
    }
  };

  // Download action
  const handleSaveDownload = () => {
    if (!downloadBlob) return;
    const ext = format === 'PNG-24' || format === 'PNG-8' ? 'png' : format === 'WEBP' ? 'webp' : 'jpg';
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-art.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 select-none font-sans p-4">
      <div className="w-[850px] h-[580px] bg-[#2b2b2b] border border-[#3a3a3a] rounded-[3px] shadow-2xl flex flex-col overflow-hidden text-[11px] text-zinc-300">
        {/* Title Bar */}
        <div className="h-7 bg-[#222222] border-b border-[#181818] px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-100">Save for Web</span>
            <span className="text-zinc-500 text-[10px]">({canvasWidth} × {canvasHeight} px)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 rounded-[1px] hover:bg-[#383838] hover:text-white flex items-center justify-center text-xs text-zinc-400"
          >
            ×
          </button>
        </div>

        {/* View Mode Selector Bar */}
        <div className="h-7 bg-[#262626] border-b border-[#181818] px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 bg-[#1c1c1c] border border-[#3a3a3a] rounded-[2px] p-0.5">
            <button
              type="button"
              onClick={() => setViewTab('original')}
              className={`px-2 py-0.5 rounded-[1px] ${
                viewTab === 'original' ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => setViewTab('optimized')}
              className={`px-2 py-0.5 rounded-[1px] ${
                viewTab === 'optimized' ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Optimized
            </button>
            <button
              type="button"
              onClick={() => setViewTab('2-up')}
              className={`px-2 py-0.5 rounded-[1px] ${
                viewTab === '2-up' ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              2-Up (Side by Side)
            </button>
          </div>

          <div className="text-[10px] text-zinc-400 font-mono">
            {format} • <strong className="text-cyan-400">{fileSizeStr}</strong>
          </div>
        </div>

        {/* Main Content: Split Preview + Controls Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Viewport Preview */}
          <div className="flex-1 bg-[#1a1a1a] overflow-auto p-4 flex items-center justify-center relative">
            {viewTab === '2-up' ? (
              <div className="flex items-start gap-4 max-w-full max-h-full">
                {/* Original View */}
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[10px] text-zinc-400 font-medium">Original</div>
                  <div className="border border-[#333333] bg-[#232323] shadow-md max-w-[280px] max-h-[360px] overflow-hidden flex items-center justify-center">
                    <canvas ref={originalCanvasRef} className="max-w-full max-h-[350px] object-contain block" />
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">Uncompressed</div>
                </div>

                {/* Optimized View */}
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[10px] text-zinc-400 font-medium">Optimized ({format})</div>
                  <div className="border border-[#333333] bg-[#232323] shadow-md max-w-[280px] max-h-[360px] overflow-hidden flex items-center justify-center">
                    <canvas ref={optimizedCanvasRef} className="max-w-full max-h-[350px] object-contain block" />
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono font-medium">{fileSizeStr}</div>
                </div>
              </div>
            ) : viewTab === 'original' ? (
              <div className="border border-[#333333] bg-[#232323] shadow-md max-w-full max-h-full overflow-hidden flex items-center justify-center">
                <canvas ref={originalCanvasRef} className="max-w-full max-h-[400px] object-contain block" />
              </div>
            ) : (
              <div className="border border-[#333333] bg-[#232323] shadow-md max-w-full max-h-full overflow-hidden flex items-center justify-center">
                <canvas ref={optimizedCanvasRef} className="max-w-full max-h-[400px] object-contain block" />
              </div>
            )}
          </div>

          {/* Right: Compression & Dimension Controls */}
          <div className="w-[230px] bg-[#242424] border-l border-[#181818] p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              {/* Preset / Format */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium block">File Format:</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-2 py-1 rounded-[2px] focus:outline-none cursor-pointer"
                >
                  <option value="JPEG">JPEG (Photo / Web)</option>
                  <option value="PNG-24">PNG-24 (High Quality / Alpha)</option>
                  <option value="PNG-8">PNG-8 (Indexed Color)</option>
                  <option value="WEBP">WebP (Modern Compact)</option>
                </select>
              </div>

              {/* Quality Slider (for JPEG & WebP) */}
              {(format === 'JPEG' || format === 'WEBP') && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Quality:</span>
                    <span className="font-mono text-zinc-200">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-[#1473e6] cursor-pointer h-1.5 bg-[#3a3a3a] rounded"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>Max</span>
                  </div>
                </div>
              )}

              {/* Image Dimensions Scaler */}
              <div className="space-y-2 pt-2 border-t border-[#333333]">
                <div className="text-zinc-400 font-medium">Image Size:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500">Width:</span>
                    <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px]">
                      <input
                        type="number"
                        min="1"
                        value={outWidth}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className="w-full bg-transparent text-zinc-200 text-right font-mono focus:outline-none"
                      />
                      <span className="text-zinc-500 text-[10px] ml-1">px</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500">Height:</span>
                    <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px]">
                      <input
                        type="number"
                        min="1"
                        value={outHeight}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className="w-full bg-transparent text-zinc-200 text-right font-mono focus:outline-none"
                      />
                      <span className="text-zinc-500 text-[10px] ml-1">px</span>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 pt-1">
                  <input
                    type="checkbox"
                    checked={constrainAspect}
                    onChange={(e) => setConstrainAspect(e.target.checked)}
                    className="w-3 h-3 rounded-[2px] accent-[#1473e6] cursor-pointer"
                  />
                  <span>Constrain Proportions</span>
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-3 border-t border-[#333333]">
              <button
                type="button"
                onClick={handleSaveDownload}
                className="w-full py-1.5 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white font-semibold text-center transition shadow-sm"
              >
                Save...
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1 rounded-[2px] bg-[#1c1c1c] hover:bg-[#383838] border border-[#3a3a3a] text-zinc-300 text-center transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
