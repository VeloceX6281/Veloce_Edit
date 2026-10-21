import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import ToolOptionsBar from './components/ToolOptionsBar';
import CanvasViewport from './components/CanvasViewport';
import RightSidebar from './components/RightSidebar';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { DEFAULT_ADJUSTMENTS, getFilterCSSString } from './utils/filterUtils';

export default function App() {
  // Studio & Tool State
  const [activeTool, setActiveTool] = useState('brush');
  const [activeTab, setActiveTab] = useState('adjustments');
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(8);
  const [shapeFillEnabled, setShapeFillEnabled] = useState(false);
  const [shapeFillColor, setShapeFillColor] = useState('#6366f1');
  const [zoom, setZoom] = useState(100);

  // Phase 3: Filter & Adjustment Pipeline State
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);

  // Canvas Reference
  const baseCanvasRef = useRef(null);

  // History State Engine (Undo / Redo with snapshot buffers)
  const {
    canUndo,
    canRedo,
    pushSnapshot,
    undo,
    redo,
    initHistory
  } = useCanvasHistory(baseCanvasRef);

  // Computed live filter CSS string for non-destructive GPU preview
  const filterString = getFilterCSSString(adjustments);

  // Clear Canvas back to clean white artboard with history snapshot
  const handleClearCanvas = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushSnapshot();
  }, [baseCanvasRef, pushSnapshot]);

  // Fill canvas with solid color
  const handleFillCanvas = useCallback((color) => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushSnapshot();
  }, [baseCanvasRef, pushSnapshot]);

  // Phase 3: Commit / Bake Adjustments into canvas pixels and record in history
  const handleApplyAdjustments = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentFilter = getFilterCSSString(adjustments);
    if (currentFilter === 'none') return;

    // 1. Create an offscreen buffer of the current artwork
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(canvas, 0, 0);

    // 2. Clear the base canvas and draw back through native 2D context filter
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = currentFilter;
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();

    // 3. Reset live sliders back to default so there is no double-filter
    setAdjustments(DEFAULT_ADJUSTMENTS);

    // 4. Record new pixel state into history stack for Undo / Redo
    pushSnapshot();
  }, [baseCanvasRef, adjustments, pushSnapshot]);

  // Phase 3: Reset Adjustments back to default without touching canvas pixels
  const handleResetAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, []);

  // Keyboard shortcuts for tools (B = Brush, E = Eraser, U = Rectangle, O = Circle, T = Text, G = Bucket, V = Select)
  useEffect(() => {
    const handleToolShortcuts = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'b':
          setActiveTool('brush');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 'u':
        case 'r':
          setActiveTool('rectangle');
          break;
        case 'o':
        case 'c':
          setActiveTool('circle');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'g':
          setActiveTool('bucket');
          break;
        case 'v':
          setActiveTool('select');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleToolShortcuts);
    return () => window.removeEventListener('keydown', handleToolShortcuts);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f1117] text-zinc-200 select-none overflow-hidden font-sans">
      {/* Studio Header Bar */}
      <Header
        zoom={zoom}
        setZoom={setZoom}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onClearCanvas={handleClearCanvas}
        baseCanvasRef={baseCanvasRef}
        pushSnapshot={pushSnapshot}
        filterString={filterString}
      />

      {/* Contextual Tool Options Bar */}
      <ToolOptionsBar
        activeTool={activeTool}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        shapeFillEnabled={shapeFillEnabled}
        setShapeFillEnabled={setShapeFillEnabled}
        shapeFillColor={shapeFillColor}
        setShapeFillColor={setShapeFillColor}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
        />

        {/* Center Canvas Viewport */}
        <CanvasViewport
          activeTool={activeTool}
          brushColor={brushColor}
          brushSize={brushSize}
          shapeFillEnabled={shapeFillEnabled}
          shapeFillColor={shapeFillColor}
          zoom={zoom}
          filterString={filterString}
          baseCanvasRef={baseCanvasRef}
          pushSnapshot={pushSnapshot}
          initHistory={initHistory}
          canvasWidth={800}
          canvasHeight={500}
        />

        {/* Right Sidebar (Adjustments, Properties & Layers) */}
        <RightSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeTool={activeTool}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          shapeFillEnabled={shapeFillEnabled}
          setShapeFillEnabled={setShapeFillEnabled}
          shapeFillColor={shapeFillColor}
          setShapeFillColor={setShapeFillColor}
          adjustments={adjustments}
          setAdjustments={setAdjustments}
          onApplyAdjustments={handleApplyAdjustments}
          onResetAdjustments={handleResetAdjustments}
          onClearCanvas={handleClearCanvas}
          onFillCanvas={handleFillCanvas}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />
      </div>
    </div>
  );
}