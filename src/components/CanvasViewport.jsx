import React, { useRef, useEffect, useCallback, useState } from 'react';
import TextOverlay from './TextOverlay';
import TransformOverlay from './TransformOverlay';
import CropOverlay from './CropOverlay';
import { getLayerContentBounds } from '../utils/transformUtils';

export default function CanvasViewport({
  activeTool,
  setActiveTool,
  brushColor,
  brushSize,
  shapeFillEnabled,
  shapeFillColor,
  zoom,
  setZoom,
  pan,
  setPan,
  onFitToScreen,
  filterString = 'none',
  layers,
  activeLayerId,
  layerCanvasesRef,
  pushSnapshot,
  initHistory,
  onCommitCrop,
  canvasWidth = 800,
  canvasHeight = 500
}) {
  const previewCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const pointsRef = useRef([]);
  const lastMidPointRef = useRef({ x: 0, y: 0 });

  // Shape state
  const isDrawingShapeRef = useRef(false);
  const shapeStartRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Panning State (Spacebar or Hand Tool)
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Cursor position indicator
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, inside: false });

  // Text overlay state
  const [textConfig, setTextConfig] = useState(null);

  // Free Transform State
  const [transformState, setTransformState] = useState(null);
  // { box, offscreenCanvas, origBox }

  // Crop State
  const [cropBox, setCropBox] = useState(null);

  // Initialize Canvas & Background layer on mount
  useEffect(() => {
    const bgCanvas = layerCanvasesRef.current['layer_background'] || layerCanvasesRef.current[layers[0]?.id];
    if (bgCanvas) {
      const ctx = bgCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      }
    }
    initHistory(layers, activeLayerId, canvasWidth, canvasHeight);
  }, []);

  // Initialize Crop Box when Crop Tool is activated
  useEffect(() => {
    if (activeTool === 'crop') {
      const padX = Math.round(canvasWidth * 0.05);
      const padY = Math.round(canvasHeight * 0.05);
      setCropBox({
        x: padX,
        y: padY,
        width: Math.max(40, canvasWidth - padX * 2),
        height: Math.max(40, canvasHeight - padY * 2)
      });
    } else {
      setCropBox(null);
    }
  }, [activeTool, canvasWidth, canvasHeight]);

  // Spacebar hotkey listener for temporary Hand tool pan
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        isPanningRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Wheel listener: Ctrl + Wheel for Smooth Cursor-Centered Zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      setZoom((prevZoom) => {
        const nextZoom = Math.round(prevZoom * zoomFactor);
        return Math.max(10, Math.min(500, nextZoom));
      });
    } else if (e.shiftKey) {
      // Horizontal pan with shift+wheel
      setPan((prev) => ({ ...prev, x: prev.x - e.deltaY }));
    }
  };

  // Helper to retrieve active layer canvas
  const getActiveCanvas = useCallback(() => {
    const canvas = layerCanvasesRef.current[activeLayerId];
    if (canvas) return canvas;
    const fallbackId = layers[layers.length - 1]?.id;
    return layerCanvasesRef.current[fallbackId] || null;
  }, [activeLayerId, layers, layerCanvasesRef]);

  // Convert client mouse coordinates to canvas coordinate space
  const getCanvasCoords = useCallback((e) => {
    const canvas = getActiveCanvas();
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  }, [getActiveCanvas]);

  // Initialize Move & Free Transform on active layer
  const startTransform = useCallback(() => {
    const activeCanvas = getActiveCanvas();
    if (!activeCanvas) return;

    const bounds = getLayerContentBounds(activeCanvas);
    if (!bounds) return;

    // Snapshot content in bounds into an offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, bounds.width);
    offscreen.height = Math.max(1, bounds.height);
    const offCtx = offscreen.getContext('2d');

    offCtx.drawImage(
      activeCanvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height
    );

    // Clear content from active canvas temporarily
    const ctx = activeCanvas.getContext('2d');
    const isBackground = layers.find((l) => l.id === activeLayerId)?.isBackground;
    if (isBackground) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    } else {
      ctx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    setTransformState({
      box: { ...bounds },
      origBox: { ...bounds },
      offscreenCanvas: offscreen
    });
  }, [getActiveCanvas, layers, activeLayerId]);

  // Automatically start transform when 'select' tool is clicked
  useEffect(() => {
    if (activeTool === 'select' && !transformState) {
      startTransform();
    } else if (activeTool !== 'select' && transformState) {
      // Commit pending transform if tool changes
      commitTransform();
    }
  }, [activeTool]);

  // Commit Free Transform directly to active layer
  const commitTransform = useCallback(() => {
    if (!transformState) return;

    const activeCanvas = getActiveCanvas();
    if (activeCanvas && transformState.offscreenCanvas) {
      const ctx = activeCanvas.getContext('2d');
      ctx.drawImage(
        transformState.offscreenCanvas,
        transformState.box.x,
        transformState.box.y,
        transformState.box.width,
        transformState.box.height
      );
      pushSnapshot();
    }

    setTransformState(null);
  }, [transformState, getActiveCanvas, pushSnapshot]);

  // Cancel Free Transform (restores original pixels)
  const cancelTransform = useCallback(() => {
    if (!transformState) return;

    const activeCanvas = getActiveCanvas();
    if (activeCanvas && transformState.offscreenCanvas) {
      const ctx = activeCanvas.getContext('2d');
      ctx.drawImage(
        transformState.offscreenCanvas,
        transformState.origBox.x,
        transformState.origBox.y,
        transformState.origBox.width,
        transformState.origBox.height
      );
    }

    setTransformState(null);
  }, [transformState, getActiveCanvas]);

  // Render shape on context
  const renderShape = useCallback((ctx, startX, startY, currX, currY, isShift) => {
    const dx = currX - startX;
    const dy = currY - startY;
    let w = dx;
    let h = dy;

    if (isShift) {
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      w = dx < 0 ? -size : size;
      h = dy < 0 ? -size : size;
    }

    ctx.save();
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.fillStyle = shapeFillEnabled ? shapeFillColor : 'transparent';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'rectangle' || activeTool === 'shapes') {
      const rx = w < 0 ? startX + w : startX;
      const ry = h < 0 ? startY + h : startY;
      const rw = Math.abs(w);
      const rh = Math.abs(h);

      if (shapeFillEnabled) {
        ctx.fillRect(rx, ry, rw, rh);
      }
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (activeTool === 'circle') {
      const cx = startX + w / 2;
      const cy = startY + h / 2;
      const radiusX = Math.max(0.1, Math.abs(w) / 2);
      const radiusY = Math.max(0.1, Math.abs(h) / 2);

      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
      if (shapeFillEnabled) {
        ctx.fill();
      }
      ctx.stroke();
    }
    ctx.restore();
  }, [activeTool, brushColor, brushSize, shapeFillEnabled, shapeFillColor]);

  // Pointer Down handler
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;

    // Pan mode (Spacebar or Hand Tool)
    if (isSpacePressed || activeTool === 'hand') {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      };
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    const coords = getCanvasCoords(e);
    lastMousePosRef.current = coords;

    // Text Tool
    if (activeTool === 'text') {
      setTextConfig({
        visible: true,
        x: coords.x,
        y: coords.y,
        fontSize: Math.max(16, brushSize * 3),
        color: brushColor
      });
      return;
    }

    if (textConfig?.visible) {
      setTextConfig(null);
    }

    // Shapes Tool
    if (activeTool === 'rectangle' || activeTool === 'shapes' || activeTool === 'circle') {
      isDrawingShapeRef.current = true;
      shapeStartRef.current = coords;
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    // Paint Bucket
    if (activeTool === 'bucket') {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;
      const ctx = activeCanvas.getContext('2d');
      ctx.fillStyle = brushColor;
      ctx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
      pushSnapshot();
      return;
    }

    // Freehand Brush & Eraser
    if (activeTool === 'brush' || activeTool === 'eraser') {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;

      isDrawingRef.current = true;
      pointsRef.current = [coords];
      lastMidPointRef.current = coords;

      const ctx = activeCanvas.getContext('2d');
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;

      const currentLayerObj = layers.find((l) => l.id === activeLayerId);
      const isBackground = currentLayerObj?.isBackground;

      if (activeTool === 'eraser') {
        if (isBackground) {
          ctx.strokeStyle = '#ffffff';
          ctx.fillStyle = '#ffffff';
          ctx.globalCompositeOperation = 'source-over';
        } else {
          ctx.globalCompositeOperation = 'destination-out';
        }
      } else {
        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
        ctx.globalCompositeOperation = 'source-over';
      }

      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e) => {
    // Panning execution
    if (isPanningRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    const coords = getCanvasCoords(e);
    lastMousePosRef.current = coords;
    setCursorPos({ x: coords.x, y: coords.y, inside: true });

    // Live Shape Preview
    if (isDrawingShapeRef.current && previewCanvasRef.current) {
      const pCanvas = previewCanvasRef.current;
      const pCtx = pCanvas.getContext('2d');
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      renderShape(
        pCtx,
        shapeStartRef.current.x,
        shapeStartRef.current.y,
        coords.x,
        coords.y,
        e.shiftKey
      );
      return;
    }

    // Freehand Brush / Eraser drawing
    if (isDrawingRef.current && (activeTool === 'brush' || activeTool === 'eraser')) {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;

      const points = pointsRef.current;
      const lastPoint = points[points.length - 1];

      const dist = Math.hypot(coords.x - lastPoint.x, coords.y - lastPoint.y);
      if (dist < 1.5) return;

      points.push(coords);

      const ctx = activeCanvas.getContext('2d');
      const p1 = points[points.length - 2];
      const p2 = points[points.length - 1];
      const midPoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      };

      ctx.beginPath();
      ctx.moveTo(lastMidPointRef.current.x, lastMidPointRef.current.y);
      ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      ctx.stroke();

      lastMidPointRef.current = midPoint;
    }
  };

  // Pointer Up handler
  const handlePointerUp = (e) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    // Commit Shape
    if (isDrawingShapeRef.current) {
      const coords = getCanvasCoords(e);
      const pCanvas = previewCanvasRef.current;
      if (pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      }

      const activeCanvas = getActiveCanvas();
      if (activeCanvas) {
        const ctx = activeCanvas.getContext('2d');
        renderShape(
          ctx,
          shapeStartRef.current.x,
          shapeStartRef.current.y,
          coords.x,
          coords.y,
          e.shiftKey
        );
        pushSnapshot();
      }

      isDrawingShapeRef.current = false;
      return;
    }

    // Commit Brush / Eraser stroke
    if (isDrawingRef.current) {
      const activeCanvas = getActiveCanvas();
      if (activeCanvas) {
        const ctx = activeCanvas.getContext('2d');
        const points = pointsRef.current;

        if (points.length === 1) {
          ctx.beginPath();
          ctx.arc(points[0].x, points[0].y, Math.max(1, brushSize / 2), 0, Math.PI * 2);
          ctx.fill();
        } else if (points.length >= 2) {
          const lastPoint = points[points.length - 1];
          ctx.beginPath();
          ctx.moveTo(lastMidPointRef.current.x, lastMidPointRef.current.y);
          ctx.lineTo(lastPoint.x, lastPoint.y);
          ctx.stroke();
        }

        ctx.restore();
        pushSnapshot();
      }

      isDrawingRef.current = false;
      pointsRef.current = [];
    }
  };

  // Text Commit
  const handleCommitText = (textData) => {
    const activeCanvas = getActiveCanvas();
    if (!activeCanvas) return;
    const ctx = activeCanvas.getContext('2d');

    ctx.save();
    const stylePrefix = textData.isItalic ? 'italic ' : '';
    const weightPrefix = textData.isBold ? 'bold ' : '';
    ctx.font = `${stylePrefix}${weightPrefix}${textData.fontSize}px ${textData.fontFamily}`;
    ctx.fillStyle = textData.color;
    ctx.textBaseline = 'top';

    const lines = textData.text.split('\n');
    const lineHeight = textData.fontSize * 1.25;

    lines.forEach((line, index) => {
      ctx.fillText(line, textData.x, textData.y + index * lineHeight);
    });

    ctx.restore();
    pushSnapshot();
    setTextConfig(null);
  };

  // Dynamic Viewport Cursor
  const getCursorStyle = () => {
    if (isSpacePressed || activeTool === 'hand') {
      return isPanningRef.current ? 'cursor-grabbing' : 'cursor-grab';
    }
    switch (activeTool) {
      case 'text':
        return 'cursor-text';
      case 'brush':
      case 'eraser':
      case 'rectangle':
      case 'shapes':
      case 'circle':
        return 'cursor-crosshair';
      case 'bucket':
        return 'cursor-pointer';
      case 'select':
        return 'cursor-default';
      case 'crop':
        return 'cursor-crosshair';
      default:
        return 'cursor-default';
    }
  };

  const activeLayerName = layers.find((l) => l.id === activeLayerId)?.name || 'Layer';

  return (
    <main
      ref={containerRef}
      onWheel={handleWheel}
      className="flex-1 bg-[#090a0f] relative overflow-hidden flex items-center justify-center p-8 select-none"
    >
      {/* Canvas Viewport Container with Smooth Zoom & Pan Transforms */}
      <div
        className="relative shadow-2xl shadow-black/90 rounded border border-zinc-800 bg-[#1e2029] overflow-hidden transition-transform duration-75 origin-center"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`
        }}
      >
        {/* Subtle Checkered Transparency Background */}
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `linear-gradient(45deg, #f4f4f5 25%, transparent 25%), 
                              linear-gradient(-45deg, #f4f4f5 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #f4f4f5 75%), 
                              linear-gradient(-45deg, transparent 75%, #f4f4f5 75%)`,
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
          }}
        />

        {/* Stacked Multi-Layer Canvases */}
        {layers.map((layer) => (
          <canvas
            key={layer.id}
            ref={(el) => {
              if (el) layerCanvasesRef.current[layer.id] = el;
            }}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              display: layer.visible ? 'block' : 'none',
              opacity: layer.opacity / 100,
              mixBlendMode: layer.blendMode,
              filter: filterString !== 'none' ? filterString : undefined
            }}
            className="absolute inset-0 block pointer-events-none"
          />
        ))}

        {/* Live Preview Canvas for shapes and feedback */}
        <canvas
          ref={previewCanvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            filter: filterString !== 'none' ? filterString : undefined
          }}
          className="absolute inset-0 block pointer-events-none z-30"
        />

        {/* Move & Free Transform Interactive Bounding Box */}
        {activeTool === 'select' && transformState && (
          <TransformOverlay
            box={transformState.box}
            setBox={(newBox) =>
              setTransformState((prev) => ({ ...prev, box: newBox }))
            }
            offscreenCanvas={transformState.offscreenCanvas}
            onCommit={commitTransform}
            onCancel={cancelTransform}
            zoom={zoom}
          />
        )}

        {/* Interactive Crop Tool Overlay */}
        {activeTool === 'crop' && cropBox && (
          <CropOverlay
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            cropBox={cropBox}
            setCropBox={setCropBox}
            onCommitCrop={() => onCommitCrop(cropBox)}
            onCancel={() => setActiveTool('select')}
            zoom={zoom}
          />
        )}

        {/* Interaction Surface */}
        <div
          className={`absolute inset-0 z-20 ${getCursorStyle()}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={(e) => {
            setCursorPos((prev) => ({ ...prev, inside: false }));
            handlePointerUp(e);
          }}
        />

        {/* Click-to-place Text Overlay */}
        {textConfig && textConfig.visible && (
          <TextOverlay
            config={textConfig}
            onCommit={handleCommitText}
            onCancel={() => setTextConfig(null)}
            zoom={zoom}
          />
        )}
      </div>

      {/* Floating Canvas Status Badge */}
      <div className="absolute bottom-3 left-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-md px-3 py-1 flex items-center gap-3 text-xs text-zinc-400 shadow-lg z-20">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Active: <strong className="text-zinc-200">{activeLayerName}</strong>
          </span>
        </div>
        <span>|</span>
        <span>Tool: <strong className="text-zinc-200 capitalize">{activeTool}</strong></span>
        <span>|</span>
        <span>{canvasWidth} × {canvasHeight} px</span>
        <span>|</span>
        <span>Zoom: <strong className="text-zinc-200">{zoom}%</strong></span>
        {cursorPos.inside && (
          <>
            <span>|</span>
            <span className="font-mono text-[11px] text-zinc-300">
              X: {cursorPos.x}, Y: {cursorPos.y}
            </span>
          </>
        )}
        <button
          onClick={onFitToScreen}
          className="ml-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
        >
          Fit
        </button>
      </div>
    </main>
  );
}
