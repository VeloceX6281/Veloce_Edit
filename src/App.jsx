import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import ToolOptionsBar from './components/ToolOptionsBar';
import CanvasViewport from './components/CanvasViewport';
import RightSidebar from './components/RightSidebar';
import ImportImageModal from './components/ImportImageModal';
import ExportModal from './components/ExportModal';
import ColorPickerModal from './components/ColorPickerModal';
import ImageSizeModal from './components/ImageSizeModal';
import CanvasSizeModal from './components/CanvasSizeModal';
import FillModal from './components/FillModal';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { DEFAULT_ADJUSTMENTS, getFilterCSSString } from './utils/filterUtils';
import {
  createInitialBackgroundLayer,
  createNewLayer,
  cloneCanvas,
  extractSelectionPixels,
  clearSelectionPixels,
  resampleCanvas,
  anchorCanvas,
  compositeAllVisibleLayers,
  applySelectionPathToContext,
  getCompositeOperation
} from './utils/layerUtils';
import { cropCanvas } from './utils/transformUtils';

export default function App() {
  // Canvas Dimensions
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(500);

  // Viewport Navigation (Pan & Zoom)
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Rulers & Alignment Guides
  const [showRulers, setShowRulers] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [guides, setGuides] = useState([
    { id: 'g_default_1', type: 'horizontal', pos: 250 },
    { id: 'g_default_2', type: 'vertical', pos: 400 }
  ]);

  // Marquee Selection State
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
  const [brushSize, setBrushSize] = useState(12);
  const [shapeFillEnabled, setShapeFillEnabled] = useState(false);
  const [shapeFillColor, setShapeFillColor] = useState('#1473e6');

  // Tool Options States
  const [autoSelectLayer, setAutoSelectLayer] = useState(true);
  const [showTransformControls, setShowTransformControls] = useState(true);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushFlow, setBrushFlow] = useState(100);
  const [cloneSampleMode, setCloneSampleMode] = useState('current');
  const [wandTolerance, setWandTolerance] = useState(32);
  const [wandContiguous, setWandContiguous] = useState(true);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(32);
  const [fontStyle, setFontStyle] = useState('Regular');
  const [textAlign, setTextAlign] = useState('left');

  // Filter & Adjustment Pipeline State
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);

  // Modals State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImageMeta, setPendingImageMeta] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImageSizeModalOpen, setIsImageSizeModalOpen] = useState(false);
  const [isCanvasSizeModalOpen, setIsCanvasSizeModalOpen] = useState(false);
  const [isFillModalOpen, setIsFillModalOpen] = useState(false);

  // Internal Clipboard Engine
  const clipboardRef = useRef(null);

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
    duplicateLayer.type = activeLayer.type;
    duplicateLayer.textData = activeLayer.textData ? { ...activeLayer.textData } : undefined;
    duplicateLayer.blendMode = activeLayer.blendMode;
    duplicateLayer.opacity = activeLayer.opacity;

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

  // Layer Operations: Layer via Copy (Ctrl+J)
  const handleLayerViaCopy = useCallback(() => {
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer) return;

    if (marqueeSelection && marqueeSelection.width > 0 && marqueeSelection.height > 0) {
      const sourceCanvas = layerCanvasesRef.current[activeLayerId];
      if (!sourceCanvas) return;

      const extractedCanvas = extractSelectionPixels(sourceCanvas, marqueeSelection, canvasWidth, canvasHeight);
      const newLayer = createNewLayer(`${activeLayer.name} Copy`);
      newLayer.blendMode = activeLayer.blendMode;
      newLayer.opacity = activeLayer.opacity;

      const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
      const newLayers = [...layers];
      newLayers.splice(activeIndex + 1, 0, newLayer);

      setLayers(newLayers);
      setActiveLayerId(newLayer.id);

      setTimeout(() => {
        layerCanvasesRef.current[newLayer.id] = extractedCanvas;
        pushSnapshot(
          { layers: newLayers, activeLayerId: newLayer.id },
          'Layer via Copy',
          'layer'
        );
      }, 40);
    } else {
      handleDuplicateLayer();
    }
  }, [layers, activeLayerId, marqueeSelection, canvasWidth, canvasHeight, handleDuplicateLayer, pushSnapshot]);

  // Layer Operations: Layer via Cut (Shift+Ctrl+J)
  const handleLayerViaCut = useCallback(() => {
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer) return;

    if (marqueeSelection && marqueeSelection.width > 0 && marqueeSelection.height > 0) {
      const sourceCanvas = layerCanvasesRef.current[activeLayerId];
      if (!sourceCanvas) return;

      const extractedCanvas = extractSelectionPixels(sourceCanvas, marqueeSelection, canvasWidth, canvasHeight);
      clearSelectionPixels(
        sourceCanvas,
        marqueeSelection,
        canvasWidth,
        canvasHeight,
        activeLayer.isBackground,
        backgroundColor
      );

      const newLayer = createNewLayer(`${activeLayer.name} Cut`);
      newLayer.blendMode = activeLayer.blendMode;
      newLayer.opacity = activeLayer.opacity;

      const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
      const newLayers = [...layers];
      newLayers.splice(activeIndex + 1, 0, newLayer);

      setLayers(newLayers);
      setActiveLayerId(newLayer.id);

      setTimeout(() => {
        layerCanvasesRef.current[newLayer.id] = extractedCanvas;
        pushSnapshot(
          { layers: newLayers, activeLayerId: newLayer.id },
          'Layer via Cut',
          'layer'
        );
      }, 40);
    }
  }, [layers, activeLayerId, marqueeSelection, canvasWidth, canvasHeight, backgroundColor, pushSnapshot]);

  // Layer Operations: Arrange Stack (Bring to Front, Forward, Backward, Back)
  const handleArrangeLayer = useCallback((action) => {
    const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
    if (activeIndex < 0) return;
    if (layers[activeIndex].isBackground) return; // Cannot rearrange background

    const newLayers = [...layers];
    const [layer] = newLayers.splice(activeIndex, 1);
    const minIdx = newLayers[0]?.isBackground ? 1 : 0;

    if (action === 'front') {
      newLayers.push(layer);
    } else if (action === 'forward') {
      const targetIdx = Math.min(newLayers.length, activeIndex + 1);
      newLayers.splice(targetIdx, 0, layer);
    } else if (action === 'backward') {
      const targetIdx = Math.max(minIdx, activeIndex - 1);
      newLayers.splice(targetIdx, 0, layer);
    } else if (action === 'back') {
      newLayers.splice(minIdx, 0, layer);
    }

    setLayers(newLayers);
    pushSnapshot({ layers: newLayers, activeLayerId: layer.id }, `Arrange Layer (${action})`, 'layer');
  }, [layers, activeLayerId, pushSnapshot]);

  // Layer Operations: Toggle Lock Transparency (/)
  const handleToggleLockTransparency = useCallback((targetLayerId = null) => {
    const id = targetLayerId || activeLayerId;
    setLayers((prev) => {
      const updated = prev.map((l) => {
        if (l.id === id) {
          const isLocked = !l.locks?.transparent;
          return {
            ...l,
            locks: {
              ...(l.locks || {}),
              transparent: isLocked
            }
          };
        }
        return l;
      });
      pushSnapshot({ layers: updated }, 'Toggle Lock Transparency', 'layer');
      return updated;
    });
  }, [activeLayerId, pushSnapshot]);

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

  // Layer Operations: Rename Layer
  const handleChangeLayerName = useCallback((layerId, newName) => {
    setLayers((prev) => {
      const updated = prev.map((l) => (l.id === layerId ? { ...l, name: newName } : l));
      pushSnapshot({ layers: updated }, `Rename Layer: ${newName}`, 'layer');
      return updated;
    });
  }, [pushSnapshot]);

  // Layer Operations: Create / Release Clipping Mask (Ctrl+Alt+G)
  const handleToggleClippingMask = useCallback((targetLayerId = null) => {
    const idToToggle = targetLayerId || activeLayerId;
    const targetIndex = layers.findIndex((l) => l.id === idToToggle);
    if (targetIndex <= 0) return; // Cannot clip bottom / background layer

    const updatedLayers = layers.map((l, idx) => {
      if (idx === targetIndex) {
        return { ...l, isClippingMask: !l.isClippingMask };
      }
      return l;
    });

    const isNowClipping = updatedLayers[targetIndex].isClippingMask;
    setLayers(updatedLayers);
    pushSnapshot(
      { layers: updatedLayers },
      isNowClipping ? 'Create Clipping Mask' : 'Release Clipping Mask',
      'layer'
    );
  }, [layers, activeLayerId, pushSnapshot]);

  // Layer Operations: Merge Down (Ctrl+E)
  const handleMergeDown = useCallback(() => {
    const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
    if (activeIndex <= 0) return; // Cannot merge bottom layer down

    const targetIndex = activeIndex - 1;
    const activeLayer = layers[activeIndex];
    const targetLayer = layers[targetIndex];

    const topCanvas = layerCanvasesRef.current[activeLayer.id];
    const bottomCanvas = layerCanvasesRef.current[targetLayer.id];

    if (topCanvas && bottomCanvas) {
      const bCtx = bottomCanvas.getContext('2d');
      bCtx.save();
      bCtx.globalAlpha = activeLayer.opacity / 100;
      bCtx.globalCompositeOperation = getCompositeOperation(activeLayer.blendMode);
      bCtx.drawImage(topCanvas, 0, 0);
      bCtx.restore();
    }

    delete layerCanvasesRef.current[activeLayer.id];

    const newLayers = layers.filter((l) => l.id !== activeLayer.id);
    setLayers(newLayers);
    setActiveLayerId(targetLayer.id);

    pushSnapshot(
      { layers: newLayers, activeLayerId: targetLayer.id },
      'Merge Down',
      'layer'
    );
  }, [layers, activeLayerId, pushSnapshot]);

  // Layer Operations: Flatten Image
  const handleFlattenImage = useCallback(() => {
    if (layers.length <= 1) return;

    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = canvasWidth;
    bgCanvas.height = canvasHeight;
    const ctx = bgCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    layers.forEach((l) => {
      if (!l.visible) return;
      const lCanvas = layerCanvasesRef.current[l.id];
      if (lCanvas) {
        ctx.save();
        ctx.globalAlpha = l.opacity / 100;
        ctx.globalCompositeOperation = getCompositeOperation(l.blendMode);
        ctx.drawImage(lCanvas, 0, 0);
        ctx.restore();
      }
    });

    const flattenedBg = createInitialBackgroundLayer();
    Object.keys(layerCanvasesRef.current).forEach((k) => {
      if (k !== flattenedBg.id) delete layerCanvasesRef.current[k];
    });

    const destCanvas = layerCanvasesRef.current[flattenedBg.id] || document.createElement('canvas');
    destCanvas.width = canvasWidth;
    destCanvas.height = canvasHeight;
    const dCtx = destCanvas.getContext('2d');
    dCtx.drawImage(bgCanvas, 0, 0);
    layerCanvasesRef.current[flattenedBg.id] = destCanvas;

    const newLayers = [flattenedBg];
    setLayers(newLayers);
    setActiveLayerId(flattenedBg.id);

    pushSnapshot(
      { layers: newLayers, activeLayerId: flattenedBg.id },
      'Flatten Image',
      'layer'
    );
  }, [layers, canvasWidth, canvasHeight, pushSnapshot]);

  // Layer Operations: Merge Visible (Shift+Ctrl+E)
  const handleMergeVisible = useCallback(() => {
    const visibleLayers = layers.filter((l) => l.visible);
    if (visibleLayers.length <= 1) return;

    const compCanvas = compositeAllVisibleLayers(layers, layerCanvasesRef, canvasWidth, canvasHeight);

    const mergedLayer = createNewLayer('Merged Visible');
    mergedLayer.blendMode = 'normal';
    mergedLayer.opacity = 100;

    let highestVisibleIndex = -1;
    layers.forEach((l, idx) => {
      if (l.visible) highestVisibleIndex = idx;
    });

    const newLayers = [];
    layers.forEach((l, idx) => {
      if (idx === highestVisibleIndex) {
        newLayers.push(mergedLayer);
      } else if (!l.visible) {
        newLayers.push(l);
      } else {
        delete layerCanvasesRef.current[l.id];
      }
    });

    layerCanvasesRef.current[mergedLayer.id] = compCanvas;

    setLayers(newLayers);
    setActiveLayerId(mergedLayer.id);

    pushSnapshot(
      { layers: newLayers, activeLayerId: mergedLayer.id },
      'Merge Visible',
      'layer'
    );
  }, [layers, canvasWidth, canvasHeight, pushSnapshot]);

  // Advanced Clipboard Engine: Copy (Ctrl+C) and Copy Merged (Shift+Ctrl+C)
  const handleCopy = useCallback((isMerged = false) => {
    let sourceCanvas;
    if (isMerged) {
      sourceCanvas = compositeAllVisibleLayers(layers, layerCanvasesRef, canvasWidth, canvasHeight);
    } else {
      sourceCanvas = layerCanvasesRef.current[activeLayerId];
    }
    if (!sourceCanvas) return;

    if (marqueeSelection && marqueeSelection.width > 0 && marqueeSelection.height > 0) {
      const extracted = extractSelectionPixels(sourceCanvas, marqueeSelection, canvasWidth, canvasHeight);
      clipboardRef.current = {
        canvas: extracted,
        x: marqueeSelection.x,
        y: marqueeSelection.y,
        width: canvasWidth,
        height: canvasHeight,
        hasCoordinates: true,
        isMerged
      };
    } else {
      clipboardRef.current = {
        canvas: cloneCanvas(sourceCanvas),
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        hasCoordinates: false,
        isMerged
      };
    }
  }, [layers, activeLayerId, marqueeSelection, canvasWidth, canvasHeight]);

  // Advanced Clipboard Engine: Paste (Ctrl+V) and Paste in Place (Shift+Ctrl+V)
  const handlePaste = useCallback((inPlace = false) => {
    if (!clipboardRef.current?.canvas) return;

    const clip = clipboardRef.current;
    const newLayer = createNewLayer(inPlace ? 'Pasted in Place' : 'Pasted Layer');
    const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : layers.length;

    const newLayers = [...layers];
    newLayers.splice(insertIndex, 0, newLayer);

    const pastedCanvas = document.createElement('canvas');
    pastedCanvas.width = canvasWidth;
    pastedCanvas.height = canvasHeight;
    const ctx = pastedCanvas.getContext('2d');
    ctx.drawImage(clip.canvas, 0, 0);

    setLayers(newLayers);
    setActiveLayerId(newLayer.id);

    setTimeout(() => {
      layerCanvasesRef.current[newLayer.id] = pastedCanvas;
      pushSnapshot(
        { layers: newLayers, activeLayerId: newLayer.id },
        inPlace ? 'Paste in Place' : 'Paste Layer',
        'layer'
      );
    }, 40);
  }, [layers, activeLayerId, canvasWidth, canvasHeight, pushSnapshot]);

  // Image Size Dialog Commit (Alt+Ctrl+I)
  const handleCommitImageSize = useCallback(({ width, height, resolution, resampleMethod }) => {
    const newW = Math.round(width);
    const newH = Math.round(height);
    if (newW <= 0 || newH <= 0) return;

    const resampledCanvases = {};
    layers.forEach((l) => {
      const src = layerCanvasesRef.current[l.id];
      if (src) {
        resampledCanvases[l.id] = resampleCanvas(src, newW, newH);
      }
    });

    setCanvasWidth(newW);
    setCanvasHeight(newH);

    setTimeout(() => {
      layers.forEach((l) => {
        if (resampledCanvases[l.id]) {
          layerCanvasesRef.current[l.id] = resampledCanvases[l.id];
        }
      });

      pushSnapshot(
        { canvasWidth: newW, canvasHeight: newH },
        `Image Size: ${newW}×${newH}`,
        'transform'
      );
    }, 40);
  }, [layers, pushSnapshot]);

  // Canvas Size Dialog Commit (Alt+Ctrl+C)
  const handleCommitCanvasSize = useCallback(({ width, height, anchor, extensionColor }) => {
    const newW = Math.round(width);
    const newH = Math.round(height);
    if (newW <= 0 || newH <= 0) return;

    const anchoredCanvases = {};
    layers.forEach((l) => {
      const src = layerCanvasesRef.current[l.id];
      const res = anchorCanvas(
        src,
        canvasWidth,
        canvasHeight,
        newW,
        newH,
        anchor,
        l.isBackground,
        extensionColor
      );
      anchoredCanvases[l.id] = res.canvas;
    });

    setCanvasWidth(newW);
    setCanvasHeight(newH);

    setTimeout(() => {
      layers.forEach((l) => {
        if (anchoredCanvases[l.id]) {
          layerCanvasesRef.current[l.id] = anchoredCanvases[l.id];
        }
      });

      pushSnapshot(
        { canvasWidth: newW, canvasHeight: newH },
        `Canvas Size: ${newW}×${newH}`,
        'crop'
      );
    }, 40);
  }, [layers, canvasWidth, canvasHeight, pushSnapshot]);

  // Fill Dialog Commit (Shift+F5)
  const handleCommitFill = useCallback(({ color, blendMode, opacity, preserveTransparency }) => {
    const canvas = layerCanvasesRef.current[activeLayerId];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.save();

    if (marqueeSelection && marqueeSelection.width > 0 && marqueeSelection.height > 0) {
      applySelectionPathToContext(ctx, marqueeSelection, canvasWidth, canvasHeight);
    }

    ctx.globalAlpha = opacity / 100;
    if (preserveTransparency) {
      ctx.globalCompositeOperation = 'source-atop';
    } else {
      ctx.globalCompositeOperation = getCompositeOperation(blendMode);
    }

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    pushSnapshot({}, 'Fill', 'bucket');
  }, [activeLayerId, marqueeSelection, canvasWidth, canvasHeight, pushSnapshot]);

  // Project: Save Project (.psd.json)
  const handleSaveProject = useCallback(() => {
    const projectData = {
      appName: 'VeloceEdit',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      canvasWidth,
      canvasHeight,
      layers: layers.map((l) => {
        const c = layerCanvasesRef.current[l.id];
        return {
          ...l,
          dataUrl: c ? c.toDataURL('image/png') : null
        };
      })
    };

    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Untitled-1.psd.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasWidth, canvasHeight, layers]);

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      // 1. Ctrl + Alt shortcuts
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        if (e.key.toLowerCase() === 'g') {
          e.preventDefault();
          handleToggleClippingMask();
        } else if (e.key.toLowerCase() === 'i') {
          e.preventDefault();
          setIsImageSizeModalOpen(true);
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setIsCanvasSizeModalOpen(true);
        }
        return;
      }

      // 2. Ctrl + Shift shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key.toLowerCase() === 'j') {
          e.preventDefault();
          handleLayerViaCut();
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          handleCopy(true);
        } else if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          handlePaste(true);
        } else if (e.key.toLowerCase() === 'e') {
          e.preventDefault();
          handleMergeVisible();
        } else if (e.key === ']' || e.code === 'BracketRight') {
          e.preventDefault();
          handleArrangeLayer('front');
        } else if (e.key === '[' || e.code === 'BracketLeft') {
          e.preventDefault();
          handleArrangeLayer('back');
        } else if (e.key.toLowerCase() === 'i') {
          e.preventDefault();
          handleInvertMarquee();
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          handleAddLayer();
        }
        return;
      }

      // 3. Ctrl shortcuts (without Shift / Alt)
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'j') {
          e.preventDefault();
          handleLayerViaCopy();
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          handleCopy(false);
        } else if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          handlePaste(false);
        } else if (e.key.toLowerCase() === 'e') {
          e.preventDefault();
          handleMergeDown();
        } else if (e.key === ']' || e.code === 'BracketRight') {
          e.preventDefault();
          handleArrangeLayer('forward');
        } else if (e.key === '[' || e.code === 'BracketLeft') {
          e.preventDefault();
          handleArrangeLayer('backward');
        } else if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          setActiveTool('select');
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSaveProject();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          setShowRulers((prev) => !prev);
        } else if (e.key === ';' || e.code === 'Semicolon') {
          e.preventDefault();
          setShowGuides((prev) => !prev);
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setMarqueeSelection(null);
        } else if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setMarqueeSelection({
            type: 'rect',
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            inverted: false
          });
        }
        return;
      }

      // 4. Shift shortcuts (e.g. Shift + F5 for Fill dialog)
      if (e.shiftKey) {
        if (e.key === 'F5' || e.code === 'F5') {
          e.preventDefault();
          setIsFillModalOpen(true);
          return;
        }
      }

      if (e.altKey) return;

      // 5. Lock Transparency shortcut (/)
      if (e.key === '/' || e.code === 'Slash') {
        e.preventDefault();
        handleToggleLockTransparency();
        return;
      }

      // 6. Delete / Backspace when selection exists triggers Fill dialog, or clears active layer
      if ((e.key === 'Backspace' || e.key === 'Delete') && marqueeSelection && marqueeSelection.width > 0 && marqueeSelection.height > 0) {
        e.preventDefault();
        setIsFillModalOpen(true);
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        handleClearActiveLayer();
        return;
      }

      // 7. Single-key tool shortcuts
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
        case 'w':
          setActiveTool('magic_wand');
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
  }, [
    handleInvertMarquee,
    handleResetDefaultColors,
    handleSwapColors,
    handleToggleClippingMask,
    handleMergeDown,
    handleMergeVisible,
    handleLayerViaCopy,
    handleLayerViaCut,
    handleArrangeLayer,
    handleToggleLockTransparency,
    handleCopy,
    handlePaste,
    handleClearActiveLayer,
    handleSaveProject,
    handleAddLayer,
    marqueeSelection,
    canvasWidth,
    canvasHeight,
    undo,
    redo
  ]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-zinc-200 select-none overflow-hidden font-sans">
      {/* Studio Header Bar (Photoshop Native Menu Bar, Height 28px) */}
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
        onDuplicateLayer={handleDuplicateLayer}
        onLayerViaCopy={handleLayerViaCopy}
        onLayerViaCut={handleLayerViaCut}
        onArrangeLayer={handleArrangeLayer}
        onToggleClippingMask={handleToggleClippingMask}
        onMergeDown={handleMergeDown}
        onMergeVisible={handleMergeVisible}
        onFlattenImage={handleFlattenImage}
        onToggleLockTransparency={handleToggleLockTransparency}
        isTransparencyLocked={Boolean(layers.find((l) => l.id === activeLayerId)?.locks?.transparent)}
        onCopy={handleCopy}
        onCopyMerged={() => handleCopy(true)}
        onPaste={handlePaste}
        onPasteInPlace={() => handlePaste(true)}
        onOpenFillModal={() => setIsFillModalOpen(true)}
        onOpenImageSize={() => setIsImageSizeModalOpen(true)}
        onOpenCanvasSize={() => setIsCanvasSizeModalOpen(true)}
        onSaveProject={handleSaveProject}
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
        documentName="Untitled-1.psd"
      />

      {/* Contextual Tool Options Bar (Height 30px) */}
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
        autoSelectLayer={autoSelectLayer}
        setAutoSelectLayer={setAutoSelectLayer}
        showTransformControls={showTransformControls}
        setShowTransformControls={setShowTransformControls}
        brushHardness={brushHardness}
        setBrushHardness={setBrushHardness}
        brushOpacity={brushOpacity}
        setBrushOpacity={setBrushOpacity}
        brushFlow={brushFlow}
        setBrushFlow={setBrushFlow}
        cloneSampleMode={cloneSampleMode}
        setCloneSampleMode={setCloneSampleMode}
        wandTolerance={wandTolerance}
        setWandTolerance={setWandTolerance}
        wandContiguous={wandContiguous}
        setWandContiguous={setWandContiguous}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontStyle={fontStyle}
        setFontStyle={setFontStyle}
        textAlign={textAlign}
        setTextAlign={setTextAlign}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar (Width 36px) with Dual Color Swatch */}
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

        {/* Center Multi-Layer Canvas Viewport with 1:1 Photoshop Presentation */}
        <CanvasViewport
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          brushColor={foregroundColor}
          setBrushColor={setForegroundColor}
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
          setLayers={setLayers}
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          layerCanvasesRef={layerCanvasesRef}
          pushSnapshot={pushSnapshot}
          initHistory={initHistory}
          onCommitCrop={handleCommitCrop}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          showRulers={showRulers}
          showGuides={showGuides}
          guides={guides}
          setGuides={setGuides}
          marqueeSelection={marqueeSelection}
          setMarqueeSelection={setMarqueeSelection}
          documentName="Untitled-1.psd"
          autoSelectLayer={autoSelectLayer}
          showTransformControls={showTransformControls}
          brushHardness={brushHardness}
          brushOpacity={brushOpacity}
          brushFlow={brushFlow}
          cloneSampleMode={cloneSampleMode}
          wandTolerance={wandTolerance}
          wandContiguous={wandContiguous}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontStyle={fontStyle}
          textAlign={textAlign}
        />

        {/* Right Dock Panels (Width 280px) */}
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
          onChangeLayerName={handleChangeLayerName}
          onToggleClippingMask={handleToggleClippingMask}
          onMergeDown={handleMergeDown}
          onMergeVisible={handleMergeVisible}
          onToggleLockTransparency={handleToggleLockTransparency}
          onLayerViaCopy={handleLayerViaCopy}
          onLayerViaCut={handleLayerViaCut}
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

      {/* Phase 6A: Image Size Dialog (Alt+Ctrl+I) */}
      <ImageSizeModal
        isOpen={isImageSizeModalOpen}
        onClose={() => setIsImageSizeModalOpen(false)}
        currentWidth={canvasWidth}
        currentHeight={canvasHeight}
        onCommitImageSize={handleCommitImageSize}
      />

      {/* Phase 6A: Canvas Size Dialog (Alt+Ctrl+C) */}
      <CanvasSizeModal
        isOpen={isCanvasSizeModalOpen}
        onClose={() => setIsCanvasSizeModalOpen(false)}
        currentWidth={canvasWidth}
        currentHeight={canvasHeight}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        onCommitCanvasSize={handleCommitCanvasSize}
      />

      {/* Phase 6A: Fill Dialog (Shift+F5) */}
      <FillModal
        isOpen={isFillModalOpen}
        onClose={() => setIsFillModalOpen(false)}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        isTransparencyLocked={Boolean(layers.find((l) => l.id === activeLayerId)?.locks?.transparent)}
        hasSelection={Boolean(marqueeSelection && marqueeSelection.width > 0 && marqueeSelection.height > 0)}
        onCommitFill={handleCommitFill}
      />
    </div>
  );
}