import React, { useRef, useEffect, useCallback, useState } from 'react';
import TextOverlay from './TextOverlay';
import TransformOverlay from './TransformOverlay';
import CropOverlay from './CropOverlay';
import PixelRulers from './PixelRulers';
import MarchingAntsOverlay from './MarchingAntsOverlay';
import EyedropperLoupe from './EyedropperLoupe';
import { getLayerContentBounds } from '../utils/transformUtils';
import { computeMagicWandSelection } from '../utils/selectionUtils';
import { getClippingBaseIndex, getCompositeOperation, createLiveTextLayer } from '../utils/layerUtils';
import { rgbToHex } from '../utils/colorUtils';

export default function CanvasViewport({
  activeTool,
  setActiveTool,
  brushColor,
  setBrushColor,
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
  setLayers,
  activeLayerId,
  setActiveLayerId,
  layerCanvasesRef,
  pushSnapshot,
  initHistory,
  onCommitCrop,
  canvasWidth = 800,
  canvasHeight = 500,
  showRulers = true,
  showGuides = true,
  guides = [],
  setGuides,
  marqueeSelection,
  setMarqueeSelection,
  documentName = 'Untitled-1.psd',
  // Tool options
  autoSelectLayer = true,
  showTransformControls = true,
  brushHardness = 100,
  brushOpacity = 100,
  brushFlow = 100,
  cloneSampleMode = 'current',
  wandTolerance = 32,
  wandContiguous = true,
  fontFamily = 'Arial',
  fontSize = 28,
  fontStyle = 'Regular',
  textAlign = 'left',
  // Gradient props
  foregroundColor = '#000000',
  backgroundColor = '#ffffff',
  gradientStyle = 'linear',
  gradientBlendMode = 'normal',
  gradientOpacity = 100,
  gradientReverse = false,
  // Dodge / Burn / Sponge props
  dodgeBurnRange = 'midtones',
  dodgeBurnExposure = 50,
  spongeMode = 'desaturate',
  spongeFlow = 50,
  // Polygonal Lasso props
  polyPointsCount = 0,
  setPolyPointsCount,
  onClosePolygonalLassoRef,
  onCancelPolygonalLassoRef
}) {
  const previewCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const rawLayerBuffersRef = useRef({}); // Unclipped raw buffers for clipping masks

  // Drawing state
  const isDrawingRef = useRef(false);
  const pointsRef = useRef([]);
  const lastMidPointRef = useRef({ x: 0, y: 0 });

  // Shape state
  const isDrawingShapeRef = useRef(false);
  const shapeStartRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Marquee Drag State
  const isDrawingMarqueeRef = useRef(false);
  const marqueeStartRef = useRef({ x: 0, y: 0 });

  // Freehand Lasso State
  const isDrawingLassoRef = useRef(false);
  const lassoPointsRef = useRef([]);

  // Polygonal Lasso State
  const polyPointsRef = useRef([]);

  // Gradient Drag State
  const isDrawingGradientRef = useRef(false);
  const gradientStartRef = useRef({ x: 0, y: 0 });

  // Retouching State (Dodge, Burn, Sponge)
  const isRetouchingRef = useRef(false);

  // Clone Stamp State
  const [cloneAnchor, setCloneAnchor] = useState(null); // { x, y }
  const cloneOffsetRef = useRef({ dx: 0, dy: 0 });
  const cloneSourceCanvasRef = useRef(null);

  // Eyedropper State
  const [eyedropperData, setEyedropperData] = useState(null); // { x, y, data, hex }

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

  // Sync / Refresh Clipping Masks compositing across layers
  const refreshClippingMasks = useCallback(() => {
    layers.forEach((layer, index) => {
      if (!layer.isClippingMask) return;

      const baseIndex = getClippingBaseIndex(layers, index);
      if (baseIndex === null) return;

      const baseLayer = layers[baseIndex];
      const baseCanvas = layerCanvasesRef.current[baseLayer.id];
      const displayCanvas = layerCanvasesRef.current[layer.id];
      const rawBuffer = rawLayerBuffersRef.current[layer.id] || displayCanvas;

      if (!baseCanvas || !displayCanvas || !rawBuffer) return;

      // Keep raw buffer stored
      if (!rawLayerBuffersRef.current[layer.id]) {
        const off = document.createElement('canvas');
        off.width = displayCanvas.width;
        off.height = displayCanvas.height;
        const oCtx = off.getContext('2d');
        oCtx.drawImage(displayCanvas, 0, 0);
        rawLayerBuffersRef.current[layer.id] = off;
      }

      const ctx = displayCanvas.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      // 1. Draw base layer's alpha shape:
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(baseCanvas, 0, 0);
      // 2. Draw clipping content strictly into alpha letterforms/shape:
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(rawLayerBuffersRef.current[layer.id], 0, 0);
      ctx.restore();
    });
  }, [layers, canvasWidth, canvasHeight, layerCanvasesRef]);

  // Trigger clipping mask refresh on layer structure updates
  useEffect(() => {
    refreshClippingMasks();
  }, [layers, refreshClippingMasks]);

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

  // Polygonal Lasso: Close Polygon
  const closePolygon = useCallback(() => {
    const pts = polyPointsRef.current;
    if (pts.length < 3) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const pathString = 'M ' + pts[0].x + ' ' + pts[0].y + ' ' + pts.slice(1).map((p) => 'L ' + p.x + ' ' + p.y).join(' ') + ' Z';

    setMarqueeSelection({
      type: 'path',
      pathString,
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      inverted: false
    });

    polyPointsRef.current = [];
    if (setPolyPointsCount) setPolyPointsCount(0);

    const pCanvas = previewCanvasRef.current;
    if (pCanvas) {
      const pCtx = pCanvas.getContext('2d');
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    }
  }, [setMarqueeSelection, setPolyPointsCount]);

  // Polygonal Lasso: Cancel
  const cancelPolygon = useCallback(() => {
    polyPointsRef.current = [];
    if (setPolyPointsCount) setPolyPointsCount(0);
    const pCanvas = previewCanvasRef.current;
    if (pCanvas) {
      const pCtx = pCanvas.getContext('2d');
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    }
  }, [setPolyPointsCount]);

  // Expose close & cancel to ref callbacks from ToolOptionsBar
  useEffect(() => {
    if (onClosePolygonalLassoRef) onClosePolygonalLassoRef.current = closePolygon;
    if (onCancelPolygonalLassoRef) onCancelPolygonalLassoRef.current = cancelPolygon;
  });

  // Cancel polygonal lasso if tool switched
  useEffect(() => {
    if (activeTool !== 'polygonal_lasso' && polyPointsRef.current.length > 0) {
      cancelPolygon();
    }
  }, [activeTool, cancelPolygon]);

  // Render Polygonal Lasso live preview
  const renderPolyPreview = useCallback((currentCursor) => {
    const pCanvas = previewCanvasRef.current;
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    const pts = polyPointsRef.current;
    if (pts.length === 0) return;

    pCtx.save();

    // 1. Draw existing vertices lines
    if (pts.length > 1) {
      pCtx.strokeStyle = '#000000';
      pCtx.lineWidth = 1.5;
      pCtx.beginPath();
      pCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        pCtx.lineTo(pts[i].x, pts[i].y);
      }
      pCtx.stroke();

      pCtx.strokeStyle = '#ffffff';
      pCtx.setLineDash([4, 4]);
      pCtx.stroke();
      pCtx.setLineDash([]);
    }

    // 2. Draw rubberband line to currentCursor
    if (currentCursor) {
      const lastPt = pts[pts.length - 1];
      pCtx.strokeStyle = '#000000';
      pCtx.lineWidth = 1.5;
      pCtx.beginPath();
      pCtx.moveTo(lastPt.x, lastPt.y);
      pCtx.lineTo(currentCursor.x, currentCursor.y);
      pCtx.stroke();

      pCtx.strokeStyle = '#00e5ff';
      pCtx.setLineDash([3, 3]);
      pCtx.stroke();
      pCtx.setLineDash([]);
    }

    // 3. Draw anchor vertices (small square boxes)
    pts.forEach((pt, i) => {
      pCtx.fillStyle = '#ffffff';
      pCtx.strokeStyle = '#000000';
      pCtx.lineWidth = 1;
      pCtx.fillRect(pt.x - 2.5, pt.y - 2.5, 5, 5);
      pCtx.strokeRect(pt.x - 2.5, pt.y - 2.5, 5, 5);
    });

    // 4. If near origin and >= 3 points, highlight origin closing loop
    if (pts.length >= 3 && currentCursor) {
      const dist = Math.hypot(currentCursor.x - pts[0].x, currentCursor.y - pts[0].y);
      if (dist <= 12) {
        pCtx.strokeStyle = '#ffff00';
        pCtx.lineWidth = 2;
        pCtx.beginPath();
        pCtx.arc(pts[0].x, pts[0].y, 6, 0, Math.PI * 2);
        pCtx.stroke();
      }
    }

    pCtx.restore();
  }, []);

  // Spacebar hotkey listener for Hand pan and Polygonal Lasso hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      if (activeTool === 'polygonal_lasso') {
        if (e.key === 'Enter') {
          e.preventDefault();
          closePolygon();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelPolygon();
          return;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          polyPointsRef.current.pop();
          if (setPolyPointsCount) setPolyPointsCount(polyPointsRef.current.length);
          if (polyPointsRef.current.length > 0) {
            renderPolyPreview(lastMousePosRef.current);
          } else if (previewCanvasRef.current) {
            const pCanvas = previewCanvasRef.current;
            pCanvas.getContext('2d').clearRect(0, 0, pCanvas.width, pCanvas.height);
          }
          return;
        }
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
  }, [activeTool, closePolygon, cancelPolygon, renderPolyPreview, setPolyPointsCount]);

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

  // Apply marquee or Magic Wand clipping path to active canvas context
  const applyMarqueeClip = useCallback((ctx) => {
    if (!marqueeSelection || marqueeSelection.width === 0 || marqueeSelection.height === 0) return;

    ctx.save();
    ctx.beginPath();

    if (marqueeSelection.type === 'path' && marqueeSelection.pathString) {
      try {
        const p2d = new Path2D(marqueeSelection.pathString);
        ctx.clip(p2d);
        return;
      } catch (err) {
        // Fallback to bounding box clip
      }
    }

    const rx = Math.min(marqueeSelection.x, marqueeSelection.x + marqueeSelection.width);
    const ry = Math.min(marqueeSelection.y, marqueeSelection.y + marqueeSelection.height);
    const rw = Math.abs(marqueeSelection.width);
    const rh = Math.abs(marqueeSelection.height);

    if (marqueeSelection.type === 'rect' || marqueeSelection.type === 'path') {
      if (marqueeSelection.inverted) {
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.rect(rx, ry, rw, rh);
        ctx.clip('evenodd');
      } else {
        ctx.rect(rx, ry, rw, rh);
        ctx.clip();
      }
    } else {
      const cx = rx + rw / 2;
      const cy = ry + rh / 2;
      const radX = Math.max(0.1, rw / 2);
      const radY = Math.max(0.1, rh / 2);

      if (marqueeSelection.inverted) {
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2);
        ctx.clip('evenodd');
      } else {
        ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2);
        ctx.clip();
      }
    }
  }, [marqueeSelection, canvasWidth, canvasHeight]);

  // Composite 9x9 pixels across all visible layers for Eyedropper
  const sampleCompositeAt = useCallback((cx, cy, size = 9) => {
    const half = Math.floor(size / 2);
    const sx = cx - half;
    const sy = cy - half;

    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const oCtx = off.getContext('2d', { willReadFrequently: true });

    layers.forEach((l) => {
      if (!l.visible) return;
      const lCanvas = layerCanvasesRef.current[l.id];
      if (lCanvas) {
        oCtx.save();
        oCtx.globalAlpha = l.opacity / 100;
        oCtx.globalCompositeOperation = getCompositeOperation(l.blendMode);
        oCtx.drawImage(lCanvas, sx, sy, size, size, 0, 0, size, size);
        oCtx.restore();
      }
    });

    const imgData = oCtx.getImageData(0, 0, size, size);
    const centerIdx = (half * size + half) * 4;
    const r = imgData.data[centerIdx];
    const g = imgData.data[centerIdx + 1];
    const b = imgData.data[centerIdx + 2];
    const hex = rgbToHex(r, g, b);

    return { imgData, hex };
  }, [layers, layerCanvasesRef]);

  // Retouching (Dodge, Burn, Sponge) Application Helper
  const applyRetouch = useCallback((x, y) => {
    const activeCanvas = getActiveCanvas();
    if (!activeCanvas) return;
    const ctx = activeCanvas.getContext('2d', { willReadFrequently: true });
    const radius = Math.max(2, Math.round(brushSize / 2));
    const minX = Math.max(0, x - radius);
    const minY = Math.max(0, y - radius);
    const maxX = Math.min(canvasWidth, x + radius);
    const maxY = Math.min(canvasHeight, y + radius);
    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0 || height <= 0) return;

    const imgData = ctx.getImageData(minX, minY, width, height);
    const data = imgData.data;

    let selectionPath = null;
    if (marqueeSelection && marqueeSelection.type === 'path' && marqueeSelection.pathString) {
      try {
        selectionPath = new Path2D(marqueeSelection.pathString);
      } catch (e) {}
    }

    const currentLayerObj = layers.find((l) => l.id === activeLayerId);
    const isTransparentLocked = currentLayerObj?.locks?.transparent;

    for (let py = 0; py < height; py++) {
      const canvasY = minY + py;
      for (let px = 0; px < width; px++) {
        const canvasX = minX + px;
        const distSq = (canvasX - x) * (canvasX - x) + (canvasY - y) * (canvasY - y);
        if (distSq > radius * radius) continue;

        // Selection boundary check
        if (marqueeSelection) {
          if (selectionPath) {
            if (!ctx.isPointInPath(selectionPath, canvasX, canvasY)) continue;
          } else {
            const inX = canvasX >= marqueeSelection.x && canvasX <= marqueeSelection.x + marqueeSelection.width;
            const inY = canvasY >= marqueeSelection.y && canvasY <= marqueeSelection.y + marqueeSelection.height;
            const inside = inX && inY;
            if (marqueeSelection.inverted ? inside : !inside) continue;
          }
        }

        const idx = (py * width + px) * 4;
        const a = data[idx + 3];
        if (a === 0 && !currentLayerObj?.isBackground) continue;
        if (isTransparentLocked && a === 0) continue;

        const dist = Math.sqrt(distSq);
        const falloff = 1 - dist / radius; // 1 at center, 0 at outer edge

        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        if (activeTool === 'dodge' || activeTool === 'burn') {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          let rangeWeight = 1.0;
          if (dodgeBurnRange === 'shadows') {
            rangeWeight = Math.max(0, 1 - lum / 160);
          } else if (dodgeBurnRange === 'highlights') {
            rangeWeight = Math.max(0, (lum - 95) / 160);
          } else {
            // Midtones
            rangeWeight = Math.max(0, 1 - Math.abs(lum - 128) / 128);
          }

          const strength = (dodgeBurnExposure / 100) * falloff * rangeWeight * 0.25;

          if (activeTool === 'dodge') {
            r = Math.min(255, r + (255 - r) * strength);
            g = Math.min(255, g + (255 - g) * strength);
            b = Math.min(255, b + (255 - b) * strength);
          } else {
            r = Math.max(0, r - r * strength);
            g = Math.max(0, g - g * strength);
            b = Math.max(0, b - b * strength);
          }
        } else if (activeTool === 'sponge') {
          const strength = (spongeFlow / 100) * falloff * 0.25;
          const rn = r / 255, gn = g / 255, bn = b / 255;
          const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
          let h = 0, s = 0, l = (max + min) / 2;

          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
              case gn: h = (bn - rn) / d + 2; break;
              case bn: h = (rn - gn) / d + 4; break;
            }
            h /= 6;
          }

          if (spongeMode === 'saturate') {
            s = Math.min(1, s + strength);
          } else {
            s = Math.max(0, s - strength);
          }

          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };

          if (s === 0) {
            r = g = b = Math.round(l * 255);
          } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
            g = Math.round(hue2rgb(p, q, h) * 255);
            b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
          }
        }

        data[idx] = Math.round(r);
        data[idx + 1] = Math.round(g);
        data[idx + 2] = Math.round(b);
      }
    }

    ctx.putImageData(imgData, minX, minY);
  }, [
    getActiveCanvas,
    brushSize,
    canvasWidth,
    canvasHeight,
    marqueeSelection,
    activeTool,
    dodgeBurnRange,
    dodgeBurnExposure,
    spongeMode,
    spongeFlow,
    layers,
    activeLayerId
  ]);

  // Move Tool Hit-Testing for Auto-Select: Layer
  const hitTestLayer = useCallback((x, y) => {
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (!l.visible) continue;

      // Text layer bounds test
      if (l.type === 'text' && l.textData) {
        const td = l.textData;
        const tw = td.width || 220;
        const th = (td.fontSize || 28) * 1.5;
        if (x >= td.x - 5 && x <= td.x + tw + 5 && y >= td.y - 5 && y <= td.y + th + 5) {
          return l;
        }
      }

      // Pixel layer non-transparent test (alpha > 10)
      const lCanvas = rawLayerBuffersRef.current[l.id] || layerCanvasesRef.current[l.id];
      if (lCanvas) {
        try {
          const ctx = lCanvas.getContext('2d', { willReadFrequently: true });
          const alpha = ctx.getImageData(x, y, 1, 1).data[3];
          if (alpha > 10) {
            return l;
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return null;
  }, [layers, layerCanvasesRef]);

  // Initialize Move & Free Transform on active layer
  const startTransform = useCallback(() => {
    const activeCanvas = getActiveCanvas();
    if (!activeCanvas) return;

    const bounds = getLayerContentBounds(activeCanvas);
    if (!bounds) return;

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

  // Auto-start transform if Move Tool and showTransformControls is active
  useEffect(() => {
    if (activeTool === 'select' && showTransformControls && !transformState) {
      startTransform();
    } else if (activeTool !== 'select' && transformState) {
      commitTransform();
    }
  }, [activeTool, showTransformControls]);

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
      refreshClippingMasks();
      pushSnapshot({}, 'Free Transform', 'transform');
    }

    setTransformState(null);
  }, [transformState, getActiveCanvas, pushSnapshot, refreshClippingMasks]);

  // Cancel Free Transform
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
      refreshClippingMasks();
    }

    setTransformState(null);
  }, [transformState, getActiveCanvas, refreshClippingMasks]);

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
    applyMarqueeClip(ctx);

    const activeLayerObj = layers.find((l) => l.id === activeLayerId);
    if (activeLayerObj?.locks?.transparent) {
      ctx.globalCompositeOperation = 'source-atop';
    }

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

    if (marqueeSelection) ctx.restore();
    ctx.restore();
  }, [activeTool, brushColor, brushSize, shapeFillEnabled, shapeFillColor, applyMarqueeClip, marqueeSelection, layers, activeLayerId]);

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

    // 1. MOVE TOOL ('select' / 'V'): Auto-select layer
    if (activeTool === 'select') {
      if (autoSelectLayer) {
        const hit = hitTestLayer(coords.x, coords.y);
        if (hit && hit.id !== activeLayerId) {
          if (transformState) commitTransform();
          setActiveLayerId(hit.id);
        }
      }
      return;
    }

    // 2. EYEDROPPER TOOL ('eyedropper' / 'I')
    if (activeTool === 'eyedropper') {
      const { hex } = sampleCompositeAt(coords.x, coords.y);
      setBrushColor(hex);
      return;
    }

    // 3. MAGIC WAND TOOL ('magic_wand' / 'W')
    if (activeTool === 'magic_wand') {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;
      const ctx = activeCanvas.getContext('2d', { willReadFrequently: true });
      const imgData = ctx.getImageData(0, 0, activeCanvas.width, activeCanvas.height);
      const wandSel = computeMagicWandSelection({
        imageData: imgData,
        startX: coords.x,
        startY: coords.y,
        tolerance: wandTolerance,
        contiguous: wandContiguous
      });
      setMarqueeSelection(wandSel);
      return;
    }

    // 4. FREEHAND LASSO TOOL ('lasso')
    if (activeTool === 'lasso') {
      isDrawingLassoRef.current = true;
      lassoPointsRef.current = [coords];
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    // 5. POLYGONAL LASSO TOOL ('polygonal_lasso')
    if (activeTool === 'polygonal_lasso') {
      const pts = polyPointsRef.current;
      if (pts.length >= 3) {
        const p0 = pts[0];
        const dist = Math.hypot(coords.x - p0.x, coords.y - p0.y);
        if (dist <= 12) {
          closePolygon();
          return;
        }
      }
      pts.push(coords);
      polyPointsRef.current = pts;
      if (setPolyPointsCount) setPolyPointsCount(pts.length);
      renderPolyPreview(coords);
      return;
    }

    // 6. GRADIENT TOOL ('gradient' / 'G')
    if (activeTool === 'gradient') {
      isDrawingGradientRef.current = true;
      gradientStartRef.current = coords;
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    // 7. DODGE, BURN, SPONGE TOOLS ('dodge', 'burn', 'sponge' / 'O')
    if (activeTool === 'dodge' || activeTool === 'burn' || activeTool === 'sponge') {
      isRetouchingRef.current = true;
      applyRetouch(coords.x, coords.y);
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    // 8. CLONE STAMP TOOL ('clone' / 'S')
    if (activeTool === 'clone') {
      if (e.altKey) {
        setCloneAnchor({ x: coords.x, y: coords.y });
        const sourceCanvas = cloneSampleMode === 'all'
          ? (() => {
              const comp = document.createElement('canvas');
              comp.width = canvasWidth;
              comp.height = canvasHeight;
              const cCtx = comp.getContext('2d');
              layers.forEach((l) => {
                if (!l.visible) return;
                const lc = layerCanvasesRef.current[l.id];
                if (lc) cCtx.drawImage(lc, 0, 0);
              });
              return comp;
            })()
          : getActiveCanvas();

        cloneSourceCanvasRef.current = sourceCanvas;
        return;
      }

      if (!cloneAnchor || !cloneSourceCanvasRef.current) {
        alert('Please Alt+Click to define a source point for the Clone Stamp.');
        return;
      }

      isDrawingRef.current = true;
      cloneOffsetRef.current = {
        dx: cloneAnchor.x - coords.x,
        dy: cloneAnchor.y - coords.y
      };

      const activeCanvas = getActiveCanvas();
      if (activeCanvas && cloneSourceCanvasRef.current) {
        const ctx = activeCanvas.getContext('2d');
        ctx.save();
        applyMarqueeClip(ctx);
        ctx.globalAlpha = brushOpacity / 100;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, Math.max(1, brushSize / 2), 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          cloneSourceCanvasRef.current,
          cloneOffsetRef.current.dx,
          cloneOffsetRef.current.dy
        );
        ctx.restore();
      }

      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    // 9. ZOOM TOOL
    if (activeTool === 'zoom') {
      if (e.altKey) {
        setZoom((z) => Math.max(10, Math.round(z / 1.25)));
      } else {
        setZoom((z) => Math.min(500, Math.round(z * 1.25)));
      }
      return;
    }

    // 10. MARQUEE RECT / ELLIPSE SELECTION TOOLS
    if (activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse' || activeTool === 'marquee') {
      isDrawingMarqueeRef.current = true;
      marqueeStartRef.current = coords;
      setMarqueeSelection({
        type: activeTool === 'marquee-ellipse' ? 'ellipse' : 'rect',
        x: coords.x,
        y: coords.y,
        width: 1,
        height: 1,
        inverted: false
      });
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    // 11. TEXT TOOL
    if (activeTool === 'text') {
      const hit = hitTestLayer(coords.x, coords.y);
      if (hit && hit.type === 'text' && hit.textData) {
        setTextConfig({
          visible: true,
          layerId: hit.id,
          x: hit.textData.x,
          y: hit.textData.y,
          fontSize: hit.textData.fontSize,
          fontFamily: hit.textData.fontFamily,
          color: hit.textData.color,
          text: hit.textData.text,
          isBold: hit.textData.isBold,
          isItalic: hit.textData.isItalic
        });
      } else {
        setTextConfig({
          visible: true,
          layerId: null,
          x: coords.x,
          y: coords.y,
          fontSize: fontSize || 28,
          fontFamily: fontFamily || 'Arial',
          color: brushColor,
          text: '',
          isBold: fontStyle === 'Bold',
          isItalic: fontStyle === 'Italic'
        });
      }
      return;
    }

    if (textConfig?.visible) {
      setTextConfig(null);
    }

    // 12. SHAPES TOOL
    if (activeTool === 'rectangle' || activeTool === 'shapes' || activeTool === 'circle') {
      isDrawingShapeRef.current = true;
      shapeStartRef.current = coords;
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    // 13. PAINT BUCKET
    if (activeTool === 'bucket') {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;
      const ctx = activeCanvas.getContext('2d');
      const currentLayerObj = layers.find((l) => l.id === activeLayerId);
      const isTransparentLocked = currentLayerObj?.locks?.transparent;

      ctx.save();
      applyMarqueeClip(ctx);
      if (isTransparentLocked) {
        ctx.globalCompositeOperation = 'source-atop';
      }
      ctx.fillStyle = brushColor;
      ctx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
      if (marqueeSelection) ctx.restore();
      ctx.restore();

      refreshClippingMasks();
      pushSnapshot({}, 'Paint Bucket Fill', 'bucket');
      return;
    }

    // 14. BRUSH & ERASER
    if (activeTool === 'brush' || activeTool === 'eraser') {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;

      isDrawingRef.current = true;
      pointsRef.current = [coords];
      lastMidPointRef.current = coords;

      const ctx = activeCanvas.getContext('2d');
      ctx.save();
      applyMarqueeClip(ctx);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = (brushOpacity / 100) * (brushFlow / 100);

      const currentLayerObj = layers.find((l) => l.id === activeLayerId);
      const isBackground = currentLayerObj?.isBackground;
      const isTransparentLocked = currentLayerObj?.locks?.transparent;

      if (activeTool === 'eraser') {
        if (isBackground) {
          ctx.strokeStyle = '#ffffff';
          ctx.fillStyle = '#ffffff';
          ctx.globalCompositeOperation = 'source-over';
        } else {
          ctx.globalCompositeOperation = isTransparentLocked ? 'source-atop' : 'destination-out';
        }
      } else {
        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
        ctx.globalCompositeOperation = isTransparentLocked ? 'source-atop' : 'source-over';
      }

      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e) => {
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

    // Live Eyedropper Loupe Preview
    if (activeTool === 'eyedropper') {
      const sampled = sampleCompositeAt(coords.x, coords.y);
      setEyedropperData({
        x: coords.x,
        y: coords.y,
        data: sampled.imgData,
        hex: sampled.hex
      });
    } else if (eyedropperData) {
      setEyedropperData(null);
    }

    // Polygonal Lasso Live Rubberband Preview
    if (activeTool === 'polygonal_lasso' && polyPointsRef.current.length > 0) {
      renderPolyPreview(coords);
      return;
    }

    // Freehand Lasso Dragging
    if (isDrawingLassoRef.current && activeTool === 'lasso') {
      lassoPointsRef.current.push(coords);
      const pCanvas = previewCanvasRef.current;
      if (pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        pCtx.save();
        pCtx.strokeStyle = '#000000';
        pCtx.lineWidth = 1.5;
        pCtx.beginPath();
        pCtx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
        for (let i = 1; i < lassoPointsRef.current.length; i++) {
          pCtx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
        }
        pCtx.stroke();
        pCtx.strokeStyle = '#ffffff';
        pCtx.setLineDash([4, 4]);
        pCtx.stroke();
        pCtx.restore();
      }
      return;
    }

    // Live Gradient Vector Dragging Preview
    if (isDrawingGradientRef.current && activeTool === 'gradient') {
      const pCanvas = previewCanvasRef.current;
      if (pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        const start = gradientStartRef.current;

        pCtx.save();
        // Outer dark contrast line
        pCtx.strokeStyle = 'rgba(0,0,0,0.8)';
        pCtx.lineWidth = 3;
        pCtx.beginPath();
        pCtx.moveTo(start.x, start.y);
        pCtx.lineTo(coords.x, coords.y);
        pCtx.stroke();

        // Inner blue vector line
        pCtx.strokeStyle = '#1473e6';
        pCtx.lineWidth = 1.5;
        pCtx.beginPath();
        pCtx.moveTo(start.x, start.y);
        pCtx.lineTo(coords.x, coords.y);
        pCtx.stroke();

        // Start anchor circle
        pCtx.fillStyle = '#ffffff';
        pCtx.strokeStyle = '#1473e6';
        pCtx.lineWidth = 1.5;
        pCtx.beginPath();
        pCtx.arc(start.x, start.y, 4, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.stroke();

        // End anchor circle
        pCtx.beginPath();
        pCtx.arc(coords.x, coords.y, 4, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.stroke();
        pCtx.restore();
      }
      return;
    }

    // Retouching Stroke (Dodge, Burn, Sponge)
    if (isRetouchingRef.current && (activeTool === 'dodge' || activeTool === 'burn' || activeTool === 'sponge')) {
      applyRetouch(coords.x, coords.y);
      return;
    }

    // Marquee Dragging with Shift 1:1 Aspect Ratio constraint
    if (isDrawingMarqueeRef.current) {
      const start = marqueeStartRef.current;
      const dx = coords.x - start.x;
      const dy = coords.y - start.y;
      let w = dx;
      let h = dy;

      if (e.shiftKey) {
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        w = dx < 0 ? -size : size;
        h = dy < 0 ? -size : size;
      }

      setMarqueeSelection((prev) => ({
        ...prev,
        x: w < 0 ? start.x + w : start.x,
        y: h < 0 ? start.y + h : start.y,
        width: Math.abs(w),
        height: Math.abs(h)
      }));
      return;
    }

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

    // Clone Stamp stroke
    if (isDrawingRef.current && activeTool === 'clone' && cloneSourceCanvasRef.current) {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;
      const ctx = activeCanvas.getContext('2d');

      ctx.save();
      applyMarqueeClip(ctx);
      ctx.globalAlpha = (brushOpacity / 100) * (brushFlow / 100);
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, Math.max(1, brushSize / 2), 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        cloneSourceCanvasRef.current,
        cloneOffsetRef.current.dx,
        cloneOffsetRef.current.dy
      );
      ctx.restore();
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

    // Finish Freehand Lasso
    if (isDrawingLassoRef.current && activeTool === 'lasso') {
      isDrawingLassoRef.current = false;
      const pts = lassoPointsRef.current;
      const pCanvas = previewCanvasRef.current;
      if (pCanvas) {
        pCanvas.getContext('2d').clearRect(0, 0, pCanvas.width, pCanvas.height);
      }

      if (pts.length >= 3) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        pts.forEach((p) => {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        });

        const pathString = 'M ' + pts[0].x + ' ' + pts[0].y + ' ' + pts.slice(1).map((p) => 'L ' + p.x + ' ' + p.y).join(' ') + ' Z';
        setMarqueeSelection({
          type: 'path',
          pathString,
          x: minX,
          y: minY,
          width: Math.max(1, maxX - minX),
          height: Math.max(1, maxY - minY),
          inverted: false
        });
      }
      lassoPointsRef.current = [];
      return;
    }

    // Finish Gradient Tool Drag
    if (isDrawingGradientRef.current && activeTool === 'gradient') {
      isDrawingGradientRef.current = false;
      const pCanvas = previewCanvasRef.current;
      if (pCanvas) {
        pCanvas.getContext('2d').clearRect(0, 0, pCanvas.width, pCanvas.height);
      }

      const coords = getCanvasCoords(e);
      const p1 = gradientStartRef.current;
      const p2 = coords;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (dist >= 2) {
        const activeCanvas = getActiveCanvas();
        if (activeCanvas) {
          const ctx = activeCanvas.getContext('2d');
          ctx.save();
          applyMarqueeClip(ctx);

          const currentLayerObj = layers.find((l) => l.id === activeLayerId);
          if (currentLayerObj?.locks?.transparent) {
            ctx.globalCompositeOperation = 'source-atop';
          } else {
            ctx.globalCompositeOperation = getCompositeOperation(gradientBlendMode);
          }
          ctx.globalAlpha = gradientOpacity / 100;

          let grad;
          if (gradientStyle === 'radial') {
            grad = ctx.createRadialGradient(p1.x, p1.y, 0, p1.x, p1.y, Math.max(1, dist));
          } else {
            grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          }

          const c1 = gradientReverse ? backgroundColor : foregroundColor;
          const c2 = gradientReverse ? foregroundColor : backgroundColor;
          grad.addColorStop(0, c1);
          grad.addColorStop(1, c2);

          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          if (marqueeSelection) ctx.restore();
          ctx.restore();

          refreshClippingMasks();
          pushSnapshot({}, 'Gradient Fill', 'gradient');
        }
      }
      return;
    }

    // Finish Retouching (Dodge, Burn, Sponge)
    if (isRetouchingRef.current && (activeTool === 'dodge' || activeTool === 'burn' || activeTool === 'sponge')) {
      isRetouchingRef.current = false;
      refreshClippingMasks();
      const actionLabel = activeTool === 'dodge' ? 'Dodge Tool' : activeTool === 'burn' ? 'Burn Tool' : 'Sponge Tool';
      pushSnapshot({}, actionLabel, activeTool);
      return;
    }

    // Finish Marquee Drag
    if (isDrawingMarqueeRef.current) {
      isDrawingMarqueeRef.current = false;
      if (marqueeSelection && (marqueeSelection.width < 5 || marqueeSelection.height < 5)) {
        setMarqueeSelection(null);
      }
      return;
    }

    // Commit Clone Stamp stroke
    if (isDrawingRef.current && activeTool === 'clone') {
      isDrawingRef.current = false;
      refreshClippingMasks();
      pushSnapshot({}, 'Clone Stamp', 'clone');
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
        refreshClippingMasks();
        const actionLabel = activeTool === 'circle' ? 'Circle Shape' : 'Rectangle Shape';
        pushSnapshot({}, actionLabel, activeTool === 'circle' ? 'circle' : 'rectangle');
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

        if (marqueeSelection) ctx.restore();
        ctx.restore();

        refreshClippingMasks();
        const actionLabel = activeTool === 'eraser' ? 'Eraser Stroke' : 'Brush Stroke';
        pushSnapshot({}, actionLabel, activeTool === 'eraser' ? 'eraser' : 'brush');
      }

      isDrawingRef.current = false;
      pointsRef.current = [];
    }
  };

  // Double Click handler (Move Tool double-click opens Text Editor; Polygonal Lasso closes)
  const handleDoubleClick = (e) => {
    if (activeTool === 'polygonal_lasso') {
      closePolygon();
      return;
    }

    if (activeTool === 'select') {
      const coords = getCanvasCoords(e);
      const hit = hitTestLayer(coords.x, coords.y);
      if (hit && hit.type === 'text' && hit.textData) {
        setTextConfig({
          visible: true,
          layerId: hit.id,
          x: hit.textData.x,
          y: hit.textData.y,
          fontSize: hit.textData.fontSize,
          fontFamily: hit.textData.fontFamily,
          color: hit.textData.color,
          text: hit.textData.text,
          isBold: hit.textData.isBold,
          isItalic: hit.textData.isItalic
        });
      }
    }
  };

  // Text Commit (Creates/Updates Dedicated Live Text Layer)
  const handleCommitText = (data) => {
    const textSnippet = data.text.trim().slice(0, 16);

    if (data.layerId) {
      // Re-editing existing text layer
      const targetCanvas = layerCanvasesRef.current[data.layerId];
      if (targetCanvas) {
        const ctx = targetCanvas.getContext('2d');
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

        const stylePrefix = data.isItalic ? 'italic ' : '';
        const weightPrefix = data.isBold ? 'bold ' : '';
        ctx.font = `${stylePrefix}${weightPrefix}${data.fontSize}px ${data.fontFamily}`;
        ctx.fillStyle = data.color;
        ctx.textBaseline = 'top';

        const lines = data.text.split('\n');
        const lineHeight = data.fontSize * 1.25;
        lines.forEach((line, index) => {
          ctx.fillText(line, data.x, data.y + index * lineHeight);
        });
      }

      setLayers((prev) =>
        prev.map((l) =>
          l.id === data.layerId
            ? {
                ...l,
                name: `Text: ${textSnippet}`,
                textData: { ...l.textData, ...data }
              }
            : l
        )
      );

      refreshClippingMasks();
      pushSnapshot({}, `Edit Text: ${textSnippet}`, 'text');
    } else {
      // Creating a new dedicated Text Layer
      const newTextLayer = createLiveTextLayer(data);
      const newLayers = [...layers, newTextLayer];

      setLayers(newLayers);
      setActiveLayerId(newTextLayer.id);

      setTimeout(() => {
        const canvas = layerCanvasesRef.current[newTextLayer.id];
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const stylePrefix = data.isItalic ? 'italic ' : '';
          const weightPrefix = data.isBold ? 'bold ' : '';
          ctx.font = `${stylePrefix}${weightPrefix}${data.fontSize}px ${data.fontFamily}`;
          ctx.fillStyle = data.color;
          ctx.textBaseline = 'top';

          const lines = data.text.split('\n');
          const lineHeight = data.fontSize * 1.25;
          lines.forEach((line, index) => {
            ctx.fillText(line, data.x, data.y + index * lineHeight);
          });
        }
        refreshClippingMasks();
        pushSnapshot(
          { layers: newLayers, activeLayerId: newTextLayer.id },
          `Text: ${textSnippet}`,
          'text'
        );
      }, 40);
    }

    setTextConfig(null);
  };

  // Dynamic Viewport Cursor
  const getCursorStyle = () => {
    if (isSpacePressed || activeTool === 'hand') {
      return isPanningRef.current ? 'cursor-grabbing' : 'cursor-grab';
    }
    switch (activeTool) {
      case 'marquee':
      case 'marquee-rect':
      case 'marquee-ellipse':
      case 'lasso':
      case 'polygonal_lasso':
      case 'crop':
      case 'brush':
      case 'eraser':
      case 'rectangle':
      case 'shapes':
      case 'circle':
      case 'clone':
      case 'eyedropper':
      case 'magic_wand':
      case 'gradient':
      case 'dodge':
      case 'burn':
      case 'sponge':
        return 'cursor-crosshair';
      case 'text':
        return 'cursor-text';
      case 'bucket':
        return 'cursor-pointer';
      case 'zoom':
        return 'cursor-zoom-in';
      case 'select':
      default:
        return 'cursor-default';
    }
  };

  const activeLayerName = layers.find((l) => l.id === activeLayerId)?.name || 'Layer';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e] select-none">
      {/* 1. Authentic Photoshop Tab Strip Directly Above Artboard */}
      <div className="h-[26px] bg-[#282828] border-b border-[#181818] flex items-center px-2 z-10 shrink-0">
        <div className="flex items-center gap-2 bg-[#1e1e1e] text-zinc-200 border-t-2 border-[#1473e6] px-3 py-1 text-[11px] font-sans border-r border-[#181818] border-l border-[#181818] rounded-t-[2px] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1473e6] inline-block" />
          <span className="font-medium text-zinc-100">{documentName}</span>
          <span className="text-[#888]">@ {zoom}% (RGB/8#)</span>
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-200 ml-1.5 text-xs hover:bg-[#383838] rounded-[2px] w-4 h-4 flex items-center justify-center leading-none"
            title="Close Tab"
          >
            ×
          </button>
        </div>
      </div>

      {/* 2. Central Artboard Workbench */}
      <main
        ref={containerRef}
        onWheel={handleWheel}
        className="flex-1 bg-[#1e1e1e] relative overflow-hidden flex items-center justify-center p-8 select-none"
      >
        {/* Pixel Rulers (Framing Top & Left Viewport) */}
        <PixelRulers
          viewportRef={containerRef}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          zoom={zoom}
          pan={pan}
          cursorPos={cursorPos}
          showRulers={showRulers}
          showGuides={showGuides}
          guides={guides}
          setGuides={setGuides}
        />

        {/* Artboard Container with Authentic Photoshop Drop Shadow & Dark Checkerboard */}
        <div
          className="relative bg-[#232323] overflow-hidden transition-transform duration-75 origin-center"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            boxShadow: '0 0 25px rgba(0,0,0,0.65), 0 0 0 1px #333333'
          }}
        >
          {/* Authentic Dark Transparency Checkerboard */}
          <div
            className="absolute inset-0 bg-[#232323]"
            style={{
              backgroundImage: `linear-gradient(45deg, #181818 25%, transparent 25%), 
                                linear-gradient(-45deg, #181818 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, #181818 75%), 
                                linear-gradient(-45deg, transparent 75%, #181818 75%)`,
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

          {/* Live Preview Canvas for shapes, selections, gradients, and feedback */}
          <canvas
            ref={previewCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              filter: filterString !== 'none' ? filterString : undefined
            }}
            className="absolute inset-0 block pointer-events-none z-30"
          />

          {/* Animated Marching Ants Selection Overlay */}
          <MarchingAntsOverlay
            selection={marqueeSelection}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          {/* Clone Stamp Anchor Crosshair */}
          {activeTool === 'clone' && cloneAnchor && (
            <div
              style={{
                left: `${cloneAnchor.x}px`,
                top: `${cloneAnchor.y}px`
              }}
              className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center text-[#31a8ff] drop-shadow-md"
            >
              <div className="w-full h-[1px] bg-[#31a8ff] absolute" />
              <div className="h-full w-[1px] bg-[#31a8ff] absolute" />
              <div className="w-2.5 h-2.5 rounded-full border border-[#31a8ff] absolute" />
            </div>
          )}

          {/* Eyedropper Magnifying Loupe (9x9 grid) */}
          {activeTool === 'eyedropper' && eyedropperData && (
            <EyedropperLoupe
              x={eyedropperData.x}
              y={eyedropperData.y}
              compositeData={eyedropperData.data}
              currentColorHex={eyedropperData.hex}
              visible={cursorPos.inside}
            />
          )}

          {/* Move & Free Transform Interactive Bounding Box */}
          {activeTool === 'select' && showTransformControls && transformState && (
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
            onDoubleClick={handleDoubleClick}
            onPointerLeave={(e) => {
              setCursorPos((prev) => ({ ...prev, inside: false }));
              setEyedropperData(null);
              handlePointerUp(e);
            }}
          />

          {/* Click-to-place / Re-editable Text Overlay */}
          {textConfig && textConfig.visible && (
            <TextOverlay
              config={textConfig}
              onCommit={handleCommitText}
              onCancel={() => setTextConfig(null)}
              zoom={zoom}
            />
          )}
        </div>
      </main>

      {/* 3. Authentic Photoshop Desktop Status Bar (Height 22px at bottom) */}
      <footer className="h-[22px] bg-[#222222] border-t border-[#181818] flex items-center justify-between px-3 text-[10px] text-zinc-400 z-10 shrink-0 select-none font-sans">
        {/* Left Section: Zoom %, Dimensions, Resolution, Color Mode, Active Layer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="10"
              max="500"
              value={zoom}
              onChange={(e) => setZoom(Math.max(10, Math.min(500, Number(e.target.value))))}
              className="w-8 bg-[#181818] border border-[#3a3a3a] px-1 py-0 text-zinc-200 text-right font-mono focus:outline-none rounded-[1px]"
            />
            <span className="text-zinc-500">%</span>
          </div>

          <span className="text-[#3a3a3a]">|</span>
          <span className="font-mono text-zinc-300">{canvasWidth} × {canvasHeight} px</span>

          <span className="text-[#3a3a3a]">|</span>
          <span>72 ppi</span>

          <span className="text-[#3a3a3a]">|</span>
          <span>RGB/8</span>

          <span className="text-[#3a3a3a]">|</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1473e6]" />
            <span>Layer: <strong className="text-zinc-200 font-medium">{activeLayerName}</strong></span>
          </div>
        </div>

        {/* Right Section: Cursor coords, Selection status, Fit Button */}
        <div className="flex items-center gap-3">
          {cursorPos.inside && (
            <span className="font-mono text-zinc-400">
              X: {cursorPos.x} px, Y: {cursorPos.y} px
            </span>
          )}

          {marqueeSelection && (
            <span className="text-[#31a8ff] font-medium">
              Selection Active
            </span>
          )}

          <button
            type="button"
            onClick={onFitToScreen}
            className="text-[#31a8ff] hover:text-white font-medium cursor-pointer transition"
            title="Fit Canvas to Screen (Ctrl+0)"
          >
            Fit (Ctrl+0)
          </button>
        </div>
      </footer>
    </div>
  );
}
