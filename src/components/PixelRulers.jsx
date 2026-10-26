import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function PixelRulers({
  viewportRef,
  canvasWidth,
  canvasHeight,
  zoom,
  pan,
  cursorPos,
  showRulers = true,
  showGuides = true,
  guides = [],
  setGuides,
  lockGuides = false
}) {
  const topRulerRef = useRef(null);
  const leftRulerRef = useRef(null);
  const [draggedGuide, setDraggedGuide] = useState(null); // { id, type, pos }

  const rulerSize = 20; // 20px ruler width / height
  const scale = zoom / 100;

  // Calculate canvas (0,0) screen origin relative to viewport
  const getCanvasOrigin = useCallback(() => {
    if (!viewportRef.current) return { originX: 0, originY: 0 };
    const rect = viewportRef.current.getBoundingClientRect();
    const cx = rect.width / 2 + pan.x;
    const cy = rect.height / 2 + pan.y;
    return {
      originX: cx - (canvasWidth * scale) / 2,
      originY: cy - (canvasHeight * scale) / 2
    };
  }, [viewportRef, pan, canvasWidth, canvasHeight, scale]);

  // Determine optimal ruler tick step based on zoom
  const getTickStep = useCallback(() => {
    if (scale >= 3) return { step: 20, minor: 4 };
    if (scale >= 1.5) return { step: 50, minor: 10 };
    if (scale >= 0.75) return { step: 100, minor: 20 };
    if (scale >= 0.35) return { step: 200, minor: 50 };
    return { step: 500, minor: 100 };
  }, [scale]);

  // Render Top Horizontal Ruler
  useEffect(() => {
    if (!showRulers || !topRulerRef.current || !viewportRef.current) return;
    const canvas = topRulerRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    canvas.width = width;
    canvas.height = rulerSize;

    // Background
    ctx.fillStyle = '#262626';
    ctx.fillRect(0, 0, width, rulerSize);

    // Border
    ctx.strokeStyle = '#383838';
    ctx.beginPath();
    ctx.moveTo(0, rulerSize - 0.5);
    ctx.lineTo(width, rulerSize - 0.5);
    ctx.stroke();

    const { originX } = getCanvasOrigin();
    const { step, minor } = getTickStep();

    ctx.fillStyle = '#8e8e8e';
    ctx.strokeStyle = '#484848';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Visible canvas coordinate range
    const startCanvasX = Math.floor((0 - originX) / scale / minor) * minor;
    const endCanvasX = Math.ceil((width - originX) / scale / minor) * minor;

    for (let cX = startCanvasX; cX <= endCanvasX; cX += minor) {
      const sX = Math.round(originX + cX * scale);
      if (sX < rulerSize) continue;

      const isMajor = cX % step === 0;
      const tickH = isMajor ? 10 : 5;

      ctx.beginPath();
      ctx.moveTo(sX + 0.5, rulerSize - tickH);
      ctx.lineTo(sX + 0.5, rulerSize);
      ctx.stroke();

      if (isMajor && sX + 30 < width) {
        ctx.fillText(`${cX}`, sX + 3, 2);
      }
    }

    // Mouse position indicator tick mark
    if (cursorPos.inside) {
      const mouseScreenX = Math.round(originX + cursorPos.x * scale);
      if (mouseScreenX >= rulerSize && mouseScreenX <= width) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mouseScreenX + 0.5, 0);
        ctx.lineTo(mouseScreenX + 0.5, rulerSize);
        ctx.stroke();
      }
    }
  }, [showRulers, zoom, pan, canvasWidth, canvasHeight, cursorPos, getCanvasOrigin, getTickStep]);

  // Render Left Vertical Ruler
  useEffect(() => {
    if (!showRulers || !leftRulerRef.current || !viewportRef.current) return;
    const canvas = leftRulerRef.current;
    const ctx = canvas.getContext('2d');
    const height = canvas.parentElement.clientHeight;
    canvas.width = rulerSize;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#262626';
    ctx.fillRect(0, 0, rulerSize, height);

    // Border
    ctx.strokeStyle = '#383838';
    ctx.beginPath();
    ctx.moveTo(rulerSize - 0.5, 0);
    ctx.lineTo(rulerSize - 0.5, height);
    ctx.stroke();

    const { originY } = getCanvasOrigin();
    const { step, minor } = getTickStep();

    ctx.fillStyle = '#8e8e8e';
    ctx.strokeStyle = '#484848';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const startCanvasY = Math.floor((0 - originY) / scale / minor) * minor;
    const endCanvasY = Math.ceil((height - originY) / scale / minor) * minor;

    for (let cY = startCanvasY; cY <= endCanvasY; cY += minor) {
      const sY = Math.round(originY + cY * scale);
      if (sY < rulerSize) continue;

      const isMajor = cY % step === 0;
      const tickW = isMajor ? 10 : 5;

      ctx.beginPath();
      ctx.moveTo(rulerSize - tickW, sY + 0.5);
      ctx.lineTo(rulerSize, sY + 0.5);
      ctx.stroke();

      if (isMajor && sY + 10 < height) {
        ctx.save();
        ctx.translate(2, sY + 3);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${cY}`, 0, 0);
        ctx.restore();
      }
    }

    // Mouse position indicator tick mark
    if (cursorPos.inside) {
      const mouseScreenY = Math.round(originY + cursorPos.y * scale);
      if (mouseScreenY >= rulerSize && mouseScreenY <= height) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, mouseScreenY + 0.5);
        ctx.lineTo(rulerSize, mouseScreenY + 0.5);
        ctx.stroke();
      }
    }
  }, [showRulers, zoom, pan, canvasWidth, canvasHeight, cursorPos, getCanvasOrigin, getTickStep]);

  // Start dragging new guide from rulers
  const handleTopRulerPointerDown = (e) => {
    e.preventDefault();
    const { originY } = getCanvasOrigin();
    const canvasY = Math.round((e.clientY - originY) / scale);
    const newGuide = {
      id: `guide_h_${Date.now()}`,
      type: 'horizontal',
      pos: canvasY
    };
    setDraggedGuide(newGuide);
  };

  const handleLeftRulerPointerDown = (e) => {
    e.preventDefault();
    const { originX } = getCanvasOrigin();
    const canvasX = Math.round((e.clientX - originX) / scale);
    const newGuide = {
      id: `guide_v_${Date.now()}`,
      type: 'vertical',
      pos: canvasX
    };
    setDraggedGuide(newGuide);
  };

  // Dragging Guide Move
  const handleGuidePointerMove = useCallback((e) => {
    if (!draggedGuide) return;
    const { originX, originY } = getCanvasOrigin();

    if (draggedGuide.type === 'horizontal') {
      const newPos = Math.round((e.clientY - originY) / scale);
      setDraggedGuide((prev) => ({ ...prev, pos: newPos }));
    } else {
      const newPos = Math.round((e.clientX - originX) / scale);
      setDraggedGuide((prev) => ({ ...prev, pos: newPos }));
    }
  }, [draggedGuide, getCanvasOrigin, scale]);

  // Finish dragging Guide
  const handleGuidePointerUp = useCallback((e) => {
    if (!draggedGuide) return;

    // Remove guide if dragged into ruler area
    if (
      (draggedGuide.type === 'horizontal' && e.clientY < rulerSize + 40) ||
      (draggedGuide.type === 'vertical' && e.clientX < rulerSize + 40)
    ) {
      setGuides((prev) => prev.filter((g) => g.id !== draggedGuide.id));
    } else {
      setGuides((prev) => {
        const filtered = prev.filter((g) => g.id !== draggedGuide.id);
        return [...filtered, draggedGuide];
      });
    }
    setDraggedGuide(null);
  }, [draggedGuide, setGuides]);

  useEffect(() => {
    if (draggedGuide) {
      window.addEventListener('pointermove', handleGuidePointerMove);
      window.addEventListener('pointerup', handleGuidePointerUp);
      return () => {
        window.removeEventListener('pointermove', handleGuidePointerMove);
        window.removeEventListener('pointerup', handleGuidePointerUp);
      };
    }
  }, [draggedGuide, handleGuidePointerMove, handleGuidePointerUp]);

  if (!showRulers) return null;

  const { originX, originY } = getCanvasOrigin();
  const allGuides = draggedGuide
    ? [...guides.filter((g) => g.id !== draggedGuide.id), draggedGuide]
    : guides;

  return (
    <>
      {/* Top Ruler */}
      <div
        className="absolute top-0 left-0 right-0 h-5 z-30 cursor-ns-resize overflow-hidden"
        style={{ paddingLeft: `${rulerSize}px` }}
        onPointerDown={handleTopRulerPointerDown}
        title="Click & drag down to create Horizontal Guide (Ctrl+R toggles rulers)"
      >
        <canvas ref={topRulerRef} className="block w-full h-full pointer-events-none" />
      </div>

      {/* Left Ruler */}
      <div
        className="absolute top-0 bottom-0 left-0 w-5 z-30 cursor-ew-resize overflow-hidden"
        style={{ paddingTop: `${rulerSize}px` }}
        onPointerDown={handleLeftRulerPointerDown}
        title="Click & drag right to create Vertical Guide (Ctrl+R toggles rulers)"
      >
        <canvas ref={leftRulerRef} className="block w-full h-full pointer-events-none" />
      </div>

      {/* Top-Left Corner Box */}
      <div
        className="absolute top-0 left-0 w-5 h-5 bg-[#262626] border-r border-b border-[#383838] z-40 flex items-center justify-center text-[8px] font-mono text-zinc-400 select-none"
        title="Pixels (px)"
      >
        px
      </div>

      {/* Alignment Guide Lines Overlay (Cyan Lines) */}
      {showGuides && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {allGuides.map((guide) => {
            if (guide.type === 'horizontal') {
              const screenY = originY + guide.pos * scale;
              return (
                <div
                  key={guide.id}
                  style={{ top: `${screenY}px` }}
                  className={`absolute left-0 right-0 h-[1px] bg-cyan-400 border-b border-cyan-400/50 shadow-sm pointer-events-auto ${lockGuides ? 'cursor-default' : 'cursor-ns-resize'} group`}
                  onPointerDown={() => !lockGuides && setDraggedGuide(guide)}
                  title={`Horizontal Guide: Y = ${guide.pos}px ${lockGuides ? '(Locked)' : '(Drag to ruler to remove)'}`}
                >
                  <span className="absolute left-6 -top-4 px-1 rounded bg-zinc-900 border border-cyan-500 text-[9px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition shadow">
                    Y: {guide.pos}px {lockGuides ? '(Locked)' : ''}
                  </span>
                </div>
              );
            } else {
              const screenX = originX + guide.pos * scale;
              return (
                <div
                  key={guide.id}
                  style={{ left: `${screenX}px` }}
                  className={`absolute top-0 bottom-0 w-[1px] bg-cyan-400 border-r border-cyan-400/50 shadow-sm pointer-events-auto ${lockGuides ? 'cursor-default' : 'cursor-ew-resize'} group`}
                  onPointerDown={() => !lockGuides && setDraggedGuide(guide)}
                  title={`Vertical Guide: X = ${guide.pos}px ${lockGuides ? '(Locked)' : '(Drag to ruler to remove)'}`}
                >
                  <span className="absolute top-6 left-1 px-1 rounded bg-zinc-900 border border-cyan-500 text-[9px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition shadow">
                    X: {guide.pos}px {lockGuides ? '(Locked)' : ''}
                  </span>
                </div>
              );
            }
          })}
        </div>
      )}
    </>
  );
}
