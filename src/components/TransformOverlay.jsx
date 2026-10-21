import React, { useState, useEffect, useRef, useCallback } from 'react';

const HANDLES = [
  { id: 'nw', cursor: 'nwse-resize', position: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' },
  { id: 'n',  cursor: 'ns-resize',   position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
  { id: 'ne', cursor: 'nesw-resize', position: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' },
  { id: 'e',  cursor: 'ew-resize',   position: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
  { id: 'se', cursor: 'nwse-resize', position: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' },
  { id: 's',  cursor: 'ns-resize',   position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
  { id: 'sw', cursor: 'nesw-resize', position: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' },
  { id: 'w',  cursor: 'ew-resize',   position: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' }
];

export default function TransformOverlay({
  box,
  setBox,
  offscreenCanvas,
  onCommit,
  onCancel,
  zoom
}) {
  const [dragState, setDragState] = useState(null);
  const [initialBox, setInitialBox] = useState(null);
  const [lockAspect, setLockAspect] = useState(false);
  const contentCanvasRef = useRef(null);

  // Render content onto the local transform preview canvas
  useEffect(() => {
    if (contentCanvasRef.current && offscreenCanvas) {
      const canvas = contentCanvasRef.current;
      canvas.width = offscreenCanvas.width;
      canvas.height = offscreenCanvas.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreenCanvas, 0, 0);
    }
  }, [offscreenCanvas]);

  // Pointer Down on Move or Handle
  const handlePointerDown = (e, type) => {
    e.stopPropagation();
    e.preventDefault();

    setDragState({
      type, // 'move' | handle id
      startX: e.clientX,
      startY: e.clientY,
      origBox: { ...box }
    });

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  // Pointer Move
  const handlePointerMove = useCallback((e) => {
    if (!dragState) return;

    const scaleFactor = zoom / 100;
    const dx = (e.clientX - dragState.startX) / scaleFactor;
    const dy = (e.clientY - dragState.startY) / scaleFactor;
    const orig = dragState.origBox;

    let newX = orig.x;
    let newY = orig.y;
    let newW = orig.width;
    let newH = orig.height;

    const isShift = e.shiftKey || lockAspect;
    const aspectRatio = orig.width / orig.height;

    if (dragState.type === 'move') {
      newX = Math.round(orig.x + dx);
      newY = Math.round(orig.y + dy);
    } else {
      // Handle resizing
      switch (dragState.type) {
        case 'se':
          newW = Math.max(10, orig.width + dx);
          newH = isShift ? newW / aspectRatio : Math.max(10, orig.height + dy);
          break;
        case 's':
          newH = Math.max(10, orig.height + dy);
          if (isShift) newW = newH * aspectRatio;
          break;
        case 'sw':
          newW = Math.max(10, orig.width - dx);
          newX = orig.x + (orig.width - newW);
          newH = isShift ? newW / aspectRatio : Math.max(10, orig.height + dy);
          break;
        case 'w':
          newW = Math.max(10, orig.width - dx);
          newX = orig.x + (orig.width - newW);
          if (isShift) newH = newW / aspectRatio;
          break;
        case 'nw':
          newW = Math.max(10, orig.width - dx);
          newH = isShift ? newW / aspectRatio : Math.max(10, orig.height - dy);
          newX = orig.x + (orig.width - newW);
          newY = orig.y + (orig.height - newH);
          break;
        case 'n':
          newH = Math.max(10, orig.height - dy);
          newY = orig.y + (orig.height - newH);
          if (isShift) newW = newH * aspectRatio;
          break;
        case 'ne':
          newW = Math.max(10, orig.width + dx);
          newH = isShift ? newW / aspectRatio : Math.max(10, orig.height - dy);
          newY = orig.y + (orig.height - newH);
          break;
        case 'e':
          newW = Math.max(10, orig.width + dx);
          if (isShift) newH = newW / aspectRatio;
          break;
        default:
          break;
      }
    }

    setBox({
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH)
    });
  }, [dragState, zoom, lockAspect, setBox]);

  const handlePointerUp = () => {
    setDragState(null);
  };

  // Keyboard shortcut listeners (Enter to commit, Esc to cancel)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onCommit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommit, onCancel]);

  if (!box) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-auto z-40 select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Interactive Transform Bounding Box */}
      <div
        style={{
          left: `${box.x}px`,
          top: `${box.y}px`,
          width: `${box.width}px`,
          height: `${box.height}px`
        }}
        className="absolute border-2 border-indigo-500 shadow-xl"
        onPointerDown={(e) => handlePointerDown(e, 'move')}
      >
        {/* Live Scaled Content Canvas */}
        <canvas
          ref={contentCanvasRef}
          className="w-full h-full block cursor-move pointer-events-none"
          style={{ imageRendering: 'auto' }}
        />

        {/* 8 Resize Handles */}
        {HANDLES.map((h) => (
          <div
            key={h.id}
            onPointerDown={(e) => handlePointerDown(e, h.id)}
            style={{ cursor: h.cursor }}
            className={`absolute w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm shadow-md transition-transform hover:scale-125 z-50 ${h.position}`}
          />
        ))}

        {/* Floating Action Bar */}
        <div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#181a22]/95 backdrop-blur border border-zinc-700 rounded-md px-2.5 py-1 text-xs text-zinc-200 shadow-2xl whitespace-nowrap z-50 animate-in fade-in duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-mono text-[10px] text-zinc-400">
            {box.width} × {box.height} px
          </span>

          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-zinc-300">
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
              className="rounded accent-indigo-500 w-3 h-3"
            />
            <span>Lock Ratio</span>
          </label>

          <div className="w-[1px] h-3 bg-zinc-700" />

          <button
            onClick={onCommit}
            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-sm transition"
            title="Commit Transformation (Enter)"
          >
            Apply
          </button>

          <button
            onClick={onCancel}
            className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-[11px] transition"
            title="Cancel (Esc)"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
