import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import ToolOptionsBar from './components/ToolOptionsBar';
import CanvasViewport from './components/CanvasViewport';
import RightSidebar from './components/RightSidebar';
import ImportImageModal from './components/ImportImageModal';
import ExportModal from './components/ExportModal';
import ColorPickerModal from './components/ColorPickerModal';
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

  // Rulers & Alignment Guides (Phase 5B)
  const [showRulers, setShowRulers] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [guides, setGuides] = useState([
    { id: 'g_default_1', type: 'horizontal', pos: 250 },
    { id: 'g_default_2', type: 'vertical', pos: 400 }
  ]);

  // Marquee Selection State (Phase 5B)
  const [marqueeSelection, setMarqueeSelection] = useState(null);

  // Authentic Dual Color Swatches (Photoshop Default: Black & White)
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [colorPickerTarget, setColorPickerTarget] = useState(null); // 'foreground' | 'background' | null

  // Multi-Layer Architecture State
  const [layers, setLayers] = useState([createInitialBackgroundLayer()]);
  const [activeLayerId, setActiveLayerId] = useState('layer_background');
  const layerCanvasesRef = useRef({});

  // Studio & Tool State
  const [activeTool, setActiveTool] = useState('brush');
  const [activeTab, setActiveTab] = useState('layers');
  const [brushSize, setBrushSize] = useState(8);
  const [shapeFillEnabled, setShapeFillEnabled] = useState(false);
  const [shapeFillColor, setShapeFillColor] = useState('#1473e6');

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
    const availableW = window.innerWidth - 380;
    const availableH = window.innerHeight - 140;

    const scaleW = availableW / canvasWidth;
    const scaleH = availableH / canvasHeight;
    const fitScale = Math.min(scaleW, scaleH) * 0.9;

    setZoom(Math.max(10, Math.min(250, Math.round(fitScale * 100))));
    setPan({ x: 0, y: 0 });
  }, [canvasWidth, canvasHeight]);

  // History State Engine (Multi-Layer Snapshot Buffers + Visual Action Log)
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
    redo,
    jumpToIndex,
    historyList,
    currentIndex
  } = useCanvasHistory({
    layers,
    activeLayerId,
    canvasWidth,
    canvasHeight,
    layerCanvasesRef,
    onRestoreSnapshot: handleRestoreSnapshot
  });

  // Color Swatch Operations (D = Default, X = Swap)
  const handleSwapColors = useCallback(() => {
    setForegroundColor((fg) => {
      setBackgroundColor(fg);
      return backgroundColor;
    });
  }, [backgroundColor]);

  const handleResetDefaultColors = useCallback(() => {
    setForegroundColor('#000000');
    setBackgroundColor('#ffffff');
  }, []);

  // Marquee Invert
  const handleInvertMarquee = useCallback(() => {
    if (!marqueeSelection) return;
    setMarqueeSelection((prev) => ({
      ...prev,
      inverted: !prev.inverted
    }));
  }, [marqueeSelection]);

  // Execute Canvas Crop across all layers
  const handleCommitCrop = useCallback((cropBox) => {
    if (!cropBox || cropBox.width < 10 || cropBox.height < 10) return;

    const newW = Math.round(cropBox.width);
    const newH = Math.round(cropBox.height);

    const croppedBuffers = {};
    layers.forEach((layer) => {
      const srcCanvas = layerCanvasesRef.current[layer.id];
      if (srcCanvas) {
        croppedBuffers[layer.id] = cropCanvas(srcCanvas, cropBox);
      }
    });

    setCanvasWidth(newW);
    setCanvasHeight(newH);
    setPan({ x: 0, y: 0 });
    setActiveTool('select');
    setMarqueeSelection(null);

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

      pushSnapshot(
        { canvasWidth: newW, canvasHeight: newH },
        'Crop Canvas',
        'crop'
      );
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
      pushSnapshot(
        { layers: newLayers, activeLayerId: newLayer.id },
        'New Layer',
        'layer'
      );
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

    pushSnapshot(
      { layers: newLayers, activeLayerId: newActiveId },
      'Delete Layer',
      'layer'
    );
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
      pushSnapshot(
        { layers: newLayers, activeLayerId: duplicateLayer.id },
        'Duplicate Layer',
        'layer'
      );
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
    pushSnapshot({ layers: newLayers }, 'Reorder Layers', 'layer');
  }, [layers, pushSnapshot]);

  const handleMoveLayerDown = useCallback((actualIndex) => {
    if (actualIndex <= 0) return;
    const newLayers = [...layers];
    const temp = newLayers[actualIndex];
    newLayers[actualIndex] = newLayers[actualIndex - 1];
    newLayers[actualIndex - 1] = temp;

    setLayers(newLayers);
    pushSnapshot({ layers: newLayers }, 'Reorder Layers', 'layer');
  }, [layers, pushSnapshot]);

  // Layer Operations: Visibility Toggle
  const handleToggleVisibility = useCallback((layerId) => {
    setLayers((prev) => {
      const updated = prev.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      );
      pushSnapshot({ layers: updated }, 'Toggle Visibility', 'layer');
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
      pushSnapshot({ layers: updated }, 'Change Blend Mode', 'layer');
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

    pushSnapshot({}, 'Clear Layer', 'eraser');
  }, [activeLayerId, layers, pushSnapshot]);

  // Fill Active Layer
  const handleFillActiveLayer = useCallback((color) => {
    const canvas = layerCanvasesRef.current[activeLayerId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushSnapshot({}, 'Fill Layer', 'bucket');
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
      pushSnapshot(
        { layers: newLayers, activeLayerId: newLayer.id },
        'Import Image Layer',
        'image'
      );
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
      pushSnapshot(
        {
          layers: newLayers,
          activeLayerId: bgLayer.id,
          canvasWidth: newW,
          canvasHeight: newH
        },
        'Open Image Project',
        'image'
      );
      setPendingImageMeta(null);
    }, 50);
  }, [pendingImageMeta, handleFitToScreen, pushSnapshot]);

  // Apply Adjustments to Active Layer
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
    pushSnapshot({}, 'Bake Adjustments', 'filter');
  }, [activeLayerId, adjustments, pushSnapshot]);

  const handleResetAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+R = Rulers, Ctrl+; = Guides, Ctrl+D = Deselect, D = Default Colors, X = Swap)
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      // Ctrl shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          setShowRulers((prev) => !prev);
        } else if (e.key === ';' || e.code === 'Semicolon') {
          e.preventDefault();
          setShowGuides((prev) => !prev);
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setMarqueeSelection(null);
        } else if (e.shiftKey && e.key.toLowerCase() === 'i') {
          e.preventDefault();
          handleInvertMarquee();
        }
        return;
      }

      if (e.altKey) return;

      // Single-key shortcuts
      switch (e.key.toLowerCase()) {
        case 'd':
          handleResetDefaultColors();
          break;
        case 'x':
          handleSwapColors();
          break;
        case 'm':
          setActiveTool((prev) =>
            prev === 'marquee-rect' ? 'marquee-ellipse' : 'marquee-rect'
          );
          break;
        case 'v':
          setActiveTool('select');
          break;
        case 'l':
          setActiveTool('lasso');
          break;
        case 'i':
          setActiveTool('eyedropper');
          break;
        case 's':
          setActiveTool('clone');
          break;
        case 'z':
          setActiveTool('zoom');
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

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleInvertMarquee, handleResetDefaultColors, handleSwapColors]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#202020] text-zinc-200 select-none overflow-hidden font-sans">
      {/* Studio Header Bar (Photoshop Native Menu Bar) */}
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
        showRulers={showRulers}
        onToggleRulers={() => setShowRulers((r) => !r)}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides((g) => !g)}
        onSelectAll={() =>
          setMarqueeSelection({
            type: 'rect',
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            inverted: false
          })
        }
        onDeselect={() => setMarqueeSelection(null)}
        onInvertMarquee={handleInvertMarquee}
        onFreeTransform={() => setActiveTool('select')}
        documentName="Untitled-1.png"
      />

      {/* Contextual Tool Options Bar */}
      <ToolOptionsBar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        brushColor={foregroundColor}
        setBrushColor={setForegroundColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        shapeFillEnabled={shapeFillEnabled}
        setShapeFillEnabled={setShapeFillEnabled}
        shapeFillColor={shapeFillColor}
        setShapeFillColor={setShapeFillColor}
        onFitToScreen={handleFitToScreen}
        marqueeSelection={marqueeSelection}
        onDeselectMarquee={() => setMarqueeSelection(null)}
        onInvertMarquee={handleInvertMarquee}
        showRulers={showRulers}
        onToggleRulers={() => setShowRulers((r) => !r)}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides((g) => !g)}
        onCommitCrop={handleCommitCrop}
        onCancelCrop={() => setActiveTool('select')}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar with Authentic Dual Color Swatch */}
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          onSwapColors={handleSwapColors}
          onResetDefaultColors={handleResetDefaultColors}
          onOpenColorPicker={(target) => setColorPickerTarget(target)}
          brushSize={brushSize}
        />

        {/* Center Multi-Layer Canvas Viewport with Rulers, Guides & Marquee */}
        <CanvasViewport
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          brushColor={foregroundColor}
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
          // Phase 5B props
          showRulers={showRulers}
          showGuides={showGuides}
          guides={guides}
          setGuides={setGuides}
          marqueeSelection={marqueeSelection}
          setMarqueeSelection={setMarqueeSelection}
          documentName="Untitled-1.png"
        />

        {/* Right Sidebar (Layers, History, Adjustments & Properties) */}
        <RightSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeTool={activeTool}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          brushColor={foregroundColor}
          setBrushColor={setForegroundColor}
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
          // Visual History Panel props
          historyList={historyList}
          currentIndex={currentIndex}
          onJumpToIndex={jumpToIndex}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />
      </div>

      {/* Photoshop Color Picker Modal */}
      <ColorPickerModal
        isOpen={colorPickerTarget !== null}
        onClose={() => setColorPickerTarget(null)}
        initialColor={colorPickerTarget === 'background' ? backgroundColor : foregroundColor}
        title={`Color Picker (${colorPickerTarget === 'background' ? 'Background Color' : 'Foreground Color'})`}
        onSelectColor={(chosenColor) => {
          if (colorPickerTarget === 'background') {
            setBackgroundColor(chosenColor);
          } else {
            setForegroundColor(chosenColor);
          }
        }}
      />

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