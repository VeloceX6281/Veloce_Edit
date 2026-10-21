import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import ToolOptionsBar from './components/ToolOptionsBar';
import CanvasViewport from './components/CanvasViewport';
import RightSidebar from './components/RightSidebar';
import ImportImageModal from './components/ImportImageModal';
import ExportModal from './components/ExportModal';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { DEFAULT_ADJUSTMENTS, getFilterCSSString } from './utils/filterUtils';
import {
  createInitialBackgroundLayer,
  createNewLayer
} from './utils/layerUtils';
import { cropCanvas } from './utils/transformUtils';

export default function App() {
  // Canvas Dimensions
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(500);

  // Viewport Navigation (Pan & Zoom)
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Multi-Layer Architecture State
  const [layers, setLayers] = useState([createInitialBackgroundLayer()]);
  const [activeLayerId, setActiveLayerId] = useState('layer_background');
  const layerCanvasesRef = useRef({});

  // Studio & Tool State
  const [activeTool, setActiveTool] = useState('brush');
  const [activeTab, setActiveTab] = useState('layers');
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(8);
  const [shapeFillEnabled, setShapeFillEnabled] = useState(false);
  const [shapeFillColor, setShapeFillColor] = useState('#6366f1');

  // Filter & Adjustment Pipeline State
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);

  // Modals State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImageMeta, setPendingImageMeta] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Computed live filter CSS string for non-destructive GPU preview
  const filterString = getFilterCSSString(adjustments);

  // Fit Canvas to Screen
  const handleFitToScreen = useCallback(() => {
    // Standard viewport dimensions (viewport window ~1000x650)
    const availableW = window.innerWidth - 380;
    const availableH = window.innerHeight - 140;

    const scaleW = availableW / canvasWidth;
    const scaleH = availableH / canvasHeight;
    const fitScale = Math.min(scaleW, scaleH) * 0.9;

    setZoom(Math.max(10, Math.min(250, Math.round(fitScale * 100))));
    setPan({ x: 0, y: 0 });
  }, [canvasWidth, canvasHeight]);

  // History State Engine (Multi-Layer Snapshot Buffers)
  const handleRestoreSnapshot = useCallback((snapshot) => {
    setLayers(snapshot.layers);
    setActiveLayerId(snapshot.activeLayerId);
    setCanvasWidth(snapshot.canvasWidth);
    setCanvasHeight(snapshot.canvasHeight);
  }, []);

  const {
    canUndo,
    canRedo,
    pushSnapshot,
    initHistory,
    undo,
    redo
  } = useCanvasHistory({
    layers,
    activeLayerId,
    canvasWidth,
    canvasHeight,
    layerCanvasesRef,
    onRestoreSnapshot: handleRestoreSnapshot
  });

  // Execute Canvas Crop across all layers
  const handleCommitCrop = useCallback((cropBox) => {
    if (!cropBox || cropBox.width < 10 || cropBox.height < 10) return;

    const newW = Math.round(cropBox.width);
    const newH = Math.round(cropBox.height);

    // Pre-crop all existing layer canvases into offscreen buffers
    const croppedBuffers = {};
    layers.forEach((layer) => {
      const srcCanvas = layerCanvasesRef.current[layer.id];
      if (srcCanvas) {
        croppedBuffers[layer.id] = cropCanvas(srcCanvas, cropBox);
      }
    });

    // Update canvas size
    setCanvasWidth(newW);
    setCanvasHeight(newH);
    setPan({ x: 0, y: 0 });
    setActiveTool('select');

    // Draw back cropped buffers once DOM canvas elements resize
    setTimeout(() => {
      layers.forEach((layer) => {
        const destCanvas = layerCanvasesRef.current[layer.id];
        const croppedBuffer = croppedBuffers[layer.id];
        if (destCanvas && croppedBuffer) {
          const ctx = destCanvas.getContext('2d');
          ctx.clearRect(0, 0, newW, newH);
          ctx.drawImage(croppedBuffer, 0, 0);
        }
      });

      pushSnapshot({
        canvasWidth: newW,
        canvasHeight: newH
      });
    }, 40);
  }, [layers, pushSnapshot]);

  // Layer Operations: Add New Layer
  const handleAddLayer = useCallback(() => {
    const newLayer = createNewLayer(`Layer ${layers.length}`);
    const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : layers.length;

    const newLayers = [...layers];
    newLayers.splice(insertIndex, 0, newLayer);

    setLayers(newLayers);
    setActiveLayerId(newLayer.id);

    setTimeout(() => {
      pushSnapshot({ layers: newLayers, activeLayerId: newLayer.id });
    }, 30);
  }, [layers, activeLayerId, pushSnapshot]);

  // Layer Operations: Delete Active Layer
  const handleDeleteLayer = useCallback(() => {
    if (layers.length <= 1) return;

    const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
    const newLayers = layers.filter((l) => l.id !== activeLayerId);
    const newActiveIndex = Math.max(0, activeIndex - 1);
    const newActiveId = newLayers[newActiveIndex].id;

    delete layerCanvasesRef.current[activeLayerId];

    setLayers(newLayers);
    setActiveLayerId(newActiveId);

    pushSnapshot({ layers: newLayers, activeLayerId: newActiveId });
  }, [layers, activeLayerId, pushSnapshot]);

  // Layer Operations: Duplicate Active Layer
  const handleDuplicateLayer = useCallback(() => {
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer) return;

    const duplicateLayer = createNewLayer(`${activeLayer.name} Copy`);
    const activeIndex = layers.findIndex((l) => l.id === activeLayerId);

    const newLayers = [...layers];
    newLayers.splice(activeIndex + 1, 0, duplicateLayer);

    const sourceCanvas = layerCanvasesRef.current[activeLayerId];

    setLayers(newLayers);
    setActiveLayerId(duplicateLayer.id);

    setTimeout(() => {
      const targetCanvas = layerCanvasesRef.current[duplicateLayer.id];
      if (targetCanvas && sourceCanvas) {
        const ctx = targetCanvas.getContext('2d');
        ctx.drawImage(sourceCanvas, 0, 0);
      }
      pushSnapshot({ layers: newLayers, activeLayerId: duplicateLayer.id });
    }, 40);
  }, [layers, activeLayerId, pushSnapshot]);

  // Layer Operations: Reorder Layers
  const handleMoveLayerUp = useCallback((actualIndex) => {
    if (actualIndex >= layers.length - 1) return;
    const newLayers = [...layers];
    const temp = newLayers[actualIndex];
    newLayers[actualIndex] = newLayers[actualIndex + 1];
    newLayers[actualIndex + 1] = temp;

    setLayers(newLayers);
    pushSnapshot({ layers: newLayers });
  }, [layers, pushSnapshot]);

  const handleMoveLayerDown = useCallback((actualIndex) => {
    if (actualIndex <= 0) return;
    const newLayers = [...layers];
    const temp = newLayers[actualIndex];
    newLayers[actualIndex] = newLayers[actualIndex - 1];
    newLayers[actualIndex - 1] = temp;

    setLayers(newLayers);
    pushSnapshot({ layers: newLayers });
  }, [layers, pushSnapshot]);

  // Layer Operations: Visibility Toggle
  const handleToggleVisibility = useCallback((layerId) => {
    setLayers((prev) => {
      const updated = prev.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      );
      pushSnapshot({ layers: updated });
      return updated;
    });
  }, [pushSnapshot]);

  // Layer Operations: Opacity Change
  const handleChangeOpacity = useCallback((layerId, opacity) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, opacity } : l))
    );
  }, []);

  // Layer Operations: Blend Mode Change
  const handleChangeBlendMode = useCallback((layerId, blendMode) => {
    setLayers((prev) => {
      const updated = prev.map((l) =>
        l.id === layerId ? { ...l, blendMode } : l
      );
      pushSnapshot({ layers: updated });
      return updated;
    });
  }, [pushSnapshot]);

  // Clear Active Layer
  const handleClearActiveLayer = useCallback(() => {
    const canvas = layerCanvasesRef.current[activeLayerId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (activeLayer?.isBackground) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    pushSnapshot();
  }, [activeLayerId, layers, pushSnapshot]);

  // Fill Active Layer
  const handleFillActiveLayer = useCallback((color) => {
    const canvas = layerCanvasesRef.current[activeLayerId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushSnapshot();
  }, [activeLayerId, pushSnapshot]);

  // Image Import: Open Modal
  const handleOpenImportModal = useCallback((meta) => {
    setPendingImageMeta(meta);
    setIsImportModalOpen(true);
  }, []);

  // Image Import Option A: Insert as New Layer
  const handleInsertAsNewLayer = useCallback(() => {
    if (!pendingImageMeta) return;

    const cleanName = pendingImageMeta.name.replace(/\.[^/.]+$/, '');
    const newLayer = createNewLayer(cleanName);
    const newLayers = [...layers, newLayer];

    setLayers(newLayers);
    setActiveLayerId(newLayer.id);
    setIsImportModalOpen(false);

    setTimeout(() => {
      const canvas = layerCanvasesRef.current[newLayer.id];
      if (canvas && pendingImageMeta.imgElement) {
        const ctx = canvas.getContext('2d');
        const img = pendingImageMeta.imgElement;

        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvasWidth - w) / 2;
        const y = (canvasHeight - h) / 2;

        ctx.drawImage(img, x, y, w, h);
      }
      pushSnapshot({ layers: newLayers, activeLayerId: newLayer.id });
      setPendingImageMeta(null);
    }, 50);
  }, [pendingImageMeta, layers, canvasWidth, canvasHeight, pushSnapshot]);

  // Image Import Option B: Open as New Project
  const handleOpenAsNewProject = useCallback(() => {
    if (!pendingImageMeta) return;

    const newW = pendingImageMeta.width;
    const newH = pendingImageMeta.height;

    setCanvasWidth(newW);
    setCanvasHeight(newH);

    const bgLayer = createInitialBackgroundLayer();
    const newLayers = [bgLayer];

    setLayers(newLayers);
    setActiveLayerId(bgLayer.id);
    setIsImportModalOpen(false);

    handleFitToScreen();

    setTimeout(() => {
      const canvas = layerCanvasesRef.current[bgLayer.id];
      if (canvas && pendingImageMeta.imgElement) {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(pendingImageMeta.imgElement, 0, 0, newW, newH);
      }
      pushSnapshot({
        layers: newLayers,
        activeLayerId: bgLayer.id,
        canvasWidth: newW,
        canvasHeight: newH
      });
      setPendingImageMeta(null);
    }, 50);
  }, [pendingImageMeta, handleFitToScreen, pushSnapshot]);

  // Phase 3: Apply Adjustments to Active Layer
  const handleApplyAdjustments = useCallback(() => {
    const canvas = layerCanvasesRef.current[activeLayerId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentFilter = getFilterCSSString(adjustments);
    if (currentFilter === 'none') return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(canvas, 0, 0);

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = currentFilter;
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();

    setAdjustments(DEFAULT_ADJUSTMENTS);
    pushSnapshot();
  }, [activeLayerId, adjustments, pushSnapshot]);

  const handleResetAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, []);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handleToolShortcuts = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'c':
          setActiveTool('crop');
          break;
        case 'h':
          setActiveTool('hand');
          break;
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
          setActiveTool('circle');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'g':
          setActiveTool('bucket');
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
        onFitToScreen={handleFitToScreen}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onClearCanvas={handleClearActiveLayer}
        onOpenImportModal={handleOpenImportModal}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onAddLayer={handleAddLayer}
        onDeleteLayer={handleDeleteLayer}
        layersCount={layers.length}
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
        onFitToScreen={handleFitToScreen}
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

        {/* Center Multi-Layer Canvas Viewport with Pan, Zoom, Transform & Crop */}
        <CanvasViewport
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          brushColor={brushColor}
          brushSize={brushSize}
          shapeFillEnabled={shapeFillEnabled}
          shapeFillColor={shapeFillColor}
          zoom={zoom}
          setZoom={setZoom}
          pan={pan}
          setPan={setPan}
          onFitToScreen={handleFitToScreen}
          filterString={filterString}
          layers={layers}
          activeLayerId={activeLayerId}
          layerCanvasesRef={layerCanvasesRef}
          pushSnapshot={pushSnapshot}
          initHistory={initHistory}
          onCommitCrop={handleCommitCrop}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />

        {/* Right Sidebar (Layers, Adjustments & Properties) */}
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
          onClearCanvas={handleClearActiveLayer}
          onFillCanvas={handleFillActiveLayer}
          // Multi-Layer props
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onMoveLayerUp={handleMoveLayerUp}
          onMoveLayerDown={handleMoveLayerDown}
          onToggleVisibility={handleToggleVisibility}
          onChangeOpacity={handleChangeOpacity}
          onChangeBlendMode={handleChangeBlendMode}
          // History props
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />
      </div>

      {/* Local Image Import Modal */}
      <ImportImageModal
        isOpen={isImportModalOpen}
        imageMeta={pendingImageMeta}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onInsertAsNewLayer={handleInsertAsNewLayer}
        onOpenAsNewProject={handleOpenAsNewProject}
        onCancel={() => {
          setIsImportModalOpen(false);
          setPendingImageMeta(null);
        }}
      />

      {/* High-Resolution Multi-Format Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        layers={layers}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        layerCanvasesRef={layerCanvasesRef}
        filterString={filterString}
      />
    </div>
  );
}