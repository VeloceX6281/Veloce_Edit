import React, { useState, useEffect, useCallback } from 'react';

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

export default function CropOverlay({
  canvasWidth,
  canvasHeight,
  cropBox,
  setCropBox,
  onCommitCrop,
  onCancel,
  zoom
}) {
  const [dragState, setDragState] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('free'); // 'free', '1:1', '16:9', '4:3', '9:16'

  // Pointer Down on Move or Handle
  const handlePointerDown = (e, type) => {
    e.stopPropagation();
    e.preventDefault();

    setDragState({
      type, // 'move' | handle id
      startX: e.clientX,
      startY: e.clientY,
      origBox: { ...cropBox }
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

    let ratio = null;
    if (aspectRatio === '1:1') ratio = 1;
    else if (aspectRatio === '16:9') ratio = 16 / 9;
    else if (aspectRatio === '4:3') ratio = 4 / 3;
    else if (aspectRatio === '9:16') ratio = 9 / 16;

    if (dragState.type === 'move') {
      newX = Math.max(0, Math.min(canvasWidth - orig.width, orig.x + dx));
      newY = Math.max(0, Math.min(canvasHeight - orig.height, orig.y + dy));
    } else {
      switch (dragState.type) {
        case 'se':
          newW = Math.max(20, Math.min(canvasWidth - orig.x, orig.width + dx));
          newH = ratio ? newW / ratio : Math.max(20, Math.min(canvasHeight - orig.y, orig.height + dy));
          break;
        case 's':
          newH = Math.max(20, Math.min(canvasHeight - orig.y, orig.height + dy));
          if (ratio) newW = newH * ratio;
          break;
        case 'sw':
          newW = Math.max(20, Math.min(orig.x + orig.width, orig.width - dx));
          newX = orig.x + (orig.width - newW);
          newH = ratio ? newW / ratio : Math.max(20, Math.min(canvasHeight - orig.y, orig.height + dy));
          break;
        case 'w':
          newW = Math.max(20, Math.min(orig.x + orig.width, orig.width - dx));
          newX = orig.x + (orig.width - newW);
          if (ratio) newH = newW / ratio;
          break;
        case 'nw':
          newW = Math.max(20, Math.min(orig.x + orig.width, orig.width - dx));
          newH = ratio ? newW / ratio : Math.max(20, Math.min(orig.y + orig.height, orig.height - dy));
          newX = orig.x + (orig.width - newW);
          newY = orig.y + (orig.height - newH);
          break;
        case 'n':
          newH = Math.max(20, Math.min(orig.y + orig.height, orig.height - dy));
          newY = orig.y + (orig.height - newH);
          if (ratio) newW = newH * ratio;
          break;
        case 'ne':
          newW = Math.max(20, Math.min(canvasWidth - orig.x, orig.width + dx));
          newH = ratio ? newW / ratio : Math.max(20, Math.min(orig.y + orig.height, orig.height - dy));
          newY = orig.y + (orig.height - newH);
          break;
        case 'e':
          newW = Math.max(20, Math.min(canvasWidth - orig.x, orig.width + dx));
          if (ratio) newH = newW / ratio;
          break;
        default:
          break;
      }
    }

    setCropBox({
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH)
    });
  }, [dragState, zoom, aspectRatio, canvasWidth, canvasHeight, setCropBox]);

  const handlePointerUp = () => {
    setDragState(null);
  };

  // Keyboard shortcut listeners (Enter to crop, Esc to cancel)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onCommitCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommitCrop, onCancel]);

  if (!cropBox) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-auto z-40 select-none overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Darkened backdrop overlay around the crop area */}
      <div
        className="absolute inset-0 bg-black/60 pointer-events-none"
        style={{
          clipPath: `polygon(
            0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
            ${cropBox.x}px ${cropBox.y}px,
            ${cropBox.x + cropBox.width}px ${cropBox.y}px,
            ${cropBox.x + cropBox.width}px ${cropBox.y + cropBox.height}px,
            ${cropBox.x}px ${cropBox.y + cropBox.height}px,
            ${cropBox.x}px ${cropBox.y}px
          )`
        }}
      />

      {/* Interactive Crop Box with Rule of Thirds Grid */}
      <div
        style={{
          left: `${cropBox.x}px`,
          top: `${cropBox.y}px`,
          width: `${cropBox.width}px`,
          height: `${cropBox.height}px`
        }}
        className="absolute border-2 border-white/90 shadow-2xl cursor-move"
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onDoubleClick={onCommitCrop}
        title="Double click or press Enter to crop"
      >
        {/* Rule-of-Thirds Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          <div className="border-r border-b border-white/25" />
          <div className="border-r border-b border-white/25" />
          <div className="border-b border-white/25" />
          <div className="border-r border-b border-white/25" />
          <div className="border-r border-b border-white/25" />
          <div className="border-b border-white/25" />
          <div className="border-r border-white/25" />
          <div className="border-r border-white/25" />
          <div />
        </div>

        {/* 8 Resize Handles */}
        {HANDLES.map((h) => (
          <div
            key={h.id}
            onPointerDown={(e) => handlePointerDown(e, h.id)}
            style={{ cursor: h.cursor }}
            className={`absolute w-3.5 h-3.5 bg-white border-2 border-zinc-800 rounded-sm shadow-md transition-transform hover:scale-125 z-50 ${h.position}`}
          />
        ))}

        {/* Floating Crop Control Bar */}
        <div
          className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#181a22]/95 backdrop-blur border border-zinc-700 rounded-md px-3 py-1 text-xs text-zinc-200 shadow-2xl whitespace-nowrap z-50 animate-in fade-in duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-mono text-[10px] text-zinc-300 font-semibold">
            {cropBox.width} × {cropBox.height} px
          </span>

          <div className="w-[1px] h-3 bg-zinc-700" />

          {/* Ratio Selector */}
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="bg-zinc-800 text-zinc-200 text-[10px] rounded px-1.5 py-0.5 border border-zinc-700 focus:outline-none cursor-pointer"
          >
            <option value="free">Freeform</option>
            <option value="1:1">1:1 Square</option>
            <option value="16:9">16:9 Widescreen</option>
            <option value="4:3">4:3 Photo</option>
            <option value="9:16">9:16 Story</option>
          </select>

          <div className="w-[1px] h-3 bg-zinc-700" />

          <button
            onClick={onCommitCrop}
            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-sm transition cursor-pointer"
            title="Crop Canvas (Enter)"
          >
            Crop
          </button>

          <button
            onClick={onCancel}
            className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-[11px] transition cursor-pointer"
            title="Cancel (Esc)"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
