import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import ToolOptionsBar from './components/ToolOptionsBar';
import CanvasViewport from './components/CanvasViewport';
import RightSidebar from './components/RightSidebar';
import { useCanvasHistory } from './hooks/useCanvasHistory';

export default function App() {
  // Studio & Tool State
  const [activeTool, setActiveTool] = useState('brush');
  const [activeTab, setActiveTab] = useState('adjustments');
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(8);
  const [shapeFillEnabled, setShapeFillEnabled] = useState(false);
  const [shapeFillColor, setShapeFillColor] = useState('#6366f1');
  const [zoom, setZoom] = useState(100);

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
          baseCanvasRef={baseCanvasRef}
          pushSnapshot={pushSnapshot}
          initHistory={initHistory}
          canvasWidth={800}
          canvasHeight={500}
        />

        {/* Right Sidebar (Layers & Properties) */}
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