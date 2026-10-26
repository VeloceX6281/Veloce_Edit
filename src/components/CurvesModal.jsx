import React, { useState, useEffect, useRef } from 'react';
import { buildCurvesLUT } from '../utils/tonalAdjustmentUtils';

export default function CurvesModal({
  isOpen,
  onClose,
  activeLayerCanvas,
  onPreview,
  onApply
}) {
  const [points, setPoints] = useState([
    { x: 0, y: 0 },
    { x: 255, y: 255 }
  ]);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [preview, setPreview] = useState(true);

  const gridCanvasRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setPoints([
        { x: 0, y: 0 },
        { x: 255, y: 255 }
      ]);
      setSelectedPointIndex(null);
      setPreview(true);
    }
  }, [isOpen]);

  // Draw 256x256 Curves grid and curve
  useEffect(() => {
    if (!isOpen || !gridCanvasRef.current) return;
    const canvas = gridCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Dark grid background
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (25%, 50%, 75%)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const pos = Math.round((i / 4) * w);
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(w, pos);
      ctx.stroke();
    }

    // Baseline diagonal (0,255) to (255,0) in canvas coords
    ctx.strokeStyle = '#383838';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Compute LUT and draw curve
    const lut = buildCurvesLUT(points);
    ctx.strokeStyle = '#31a8ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < 256; x++) {
      const y = h - (lut[x] / 255) * h;
      const canvasX = (x / 255) * w;
      if (x === 0) ctx.moveTo(canvasX, y);
      else ctx.lineTo(canvasX, y);
    }
    ctx.stroke();

    // Draw control points
    points.forEach((pt, idx) => {
      const px = (pt.x / 255) * w;
      const py = h - (pt.y / 255) * h;
      const isSelected = selectedPointIndex === idx;

      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 4.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ffffff' : '#1473e6';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#1473e6' : '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [isOpen, points, selectedPointIndex]);

  // Live preview callback
  useEffect(() => {
    if (isOpen && preview && onPreview) {
      onPreview({ points });
    } else if (isOpen && !preview && onPreview) {
      onPreview(null);
    }
  }, [isOpen, points, preview, onPreview]);

  if (!isOpen) return null;

  const getCanvasCoords = (e) => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 256 / rect.width;
    const scaleY = 256 / rect.height;

    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = 256 - (e.clientY - rect.top) * scaleY; // Invert Y for tonal curve

    return {
      x: Math.max(0, Math.min(255, Math.round(rawX))),
      y: Math.max(0, Math.min(255, Math.round(rawY)))
    };
  };

  const handlePointerDown = (e) => {
    const coords = getCanvasCoords(e);

    // Check if clicking existing point (within 10px radius)
    let hitIndex = -1;
    for (let i = 0; i < points.length; i++) {
      const d = Math.hypot(points[i].x - coords.x, points[i].y - coords.y);
      if (d <= 12) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex >= 0) {
      setSelectedPointIndex(hitIndex);
      isDraggingRef.current = true;
    } else {
      // Add new control point
      const newPts = [...points, coords].sort((a, b) => a.x - b.x);
      const newIdx = newPts.findIndex((p) => p.x === coords.x && p.y === coords.y);
      setPoints(newPts);
      setSelectedPointIndex(newIdx);
      isDraggingRef.current = true;
    }

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || selectedPointIndex === null) return;
    const coords = getCanvasCoords(e);

    setPoints((prev) => {
      const updated = [...prev];
      const pt = updated[selectedPointIndex];

      // Endpoints stay at x=0 and x=255
      let newX = coords.x;
      if (selectedPointIndex === 0 && pt.x === 0) newX = 0;
      if (selectedPointIndex === prev.length - 1 && pt.x === 255) newX = 255;

      updated[selectedPointIndex] = {
        x: newX,
        y: coords.y
      };

      // Keep sorted by x while preserving selected index reference
      return updated.sort((a, b) => a.x - b.x);
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleDeleteSelected = () => {
    if (selectedPointIndex === null || points.length <= 2) return;
    setPoints((prev) => prev.filter((_, idx) => idx !== selectedPointIndex));
    setSelectedPointIndex(null);
  };

  const handleReset = () => {
    setPoints([
      { x: 0, y: 0 },
      { x: 255, y: 255 }
    ]);
    setSelectedPointIndex(null);
  };

  const handleApply = () => {
    if (onApply) onApply({ points });
    onClose();
  };

  const handleCancel = () => {
    if (onPreview) onPreview(null);
    onClose();
  };

  const activePoint = selectedPointIndex !== null ? points[selectedPointIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-sm bg-[#282828] border border-[#3a3a3a] rounded-[2px] shadow-2xl p-4 text-zinc-200 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a]">
          <span className="text-zinc-100 font-semibold text-xs">Curves</span>
          <button
            type="button"
            onClick={handleCancel}
            className="w-5 h-5 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* 256x256 Interactive Grid */}
        <div className="flex justify-center">
          <div className="relative border border-[#3a3a3a] rounded-[2px] overflow-hidden bg-[#181818] shadow-inner">
            <canvas
              ref={gridCanvasRef}
              width={256}
              height={256}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-64 h-64 block cursor-crosshair"
            />
          </div>
        </div>

        {/* Input / Output Coordinate Readouts */}
        <div className="flex items-center justify-between text-[11px] bg-[#1c1c1c] border border-[#3a3a3a] p-1.5 rounded-[2px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Input:</span>
              <span className="font-mono text-zinc-200 text-[10px] w-7">
                {activePoint ? activePoint.x : '—'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Output:</span>
              <span className="font-mono text-[#31a8ff] text-[10px] w-7">
                {activePoint ? activePoint.y : '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedPointIndex === null || points.length <= 2}
              className={`px-2 py-0.5 rounded-[2px] border text-[10px] transition ${
                selectedPointIndex !== null && points.length > 2
                  ? 'border-[#3a3a3a] bg-[#222] hover:bg-[#383838] text-rose-300 cursor-pointer'
                  : 'border-transparent text-zinc-600 cursor-not-allowed'
              }`}
            >
              Delete Point
            </button>
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
