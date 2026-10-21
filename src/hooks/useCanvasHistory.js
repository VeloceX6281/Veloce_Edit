import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Hook to manage Multi-Layer Canvas Undo / Redo history state stack with Visual Action Log.
 * Tracks layer structure, dimensions, pixel buffers, and human-readable action names.
 */
export function useCanvasHistory({
  layers,
  activeLayerId,
  canvasWidth,
  canvasHeight,
  layerCanvasesRef,
  onRestoreSnapshot
}) {
  const historyStackRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyList, setHistoryList] = useState([]); // Visual list for History Panel
  const maxHistory = 30;

  const updateState = useCallback(() => {
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(currentIndexRef.current < historyStackRef.current.length - 1);
    setHistoryList(
      historyStackRef.current.map((s, idx) => ({
        id: s.id,
        action: s.action || 'Canvas Action',
        icon: s.icon || 'palette',
        timestamp: s.timestamp,
        index: idx
      }))
    );
  }, []);

  /**
   * Captures a complete snapshot of all layers and their pixel buffers
   */
  const pushSnapshot = useCallback((overrideData = {}, actionName = 'Canvas Action', icon = 'edit') => {
    const currentLayers = overrideData.layers || layers;
    const currentActiveId = overrideData.activeLayerId || activeLayerId;
    const w = overrideData.canvasWidth || canvasWidth;
    const h = overrideData.canvasHeight || canvasHeight;

    const layerPixelData = {};

    currentLayers.forEach((layer) => {
      const canvas = layerCanvasesRef.current[layer.id];
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          try {
            layerPixelData[layer.id] = ctx.getImageData(0, 0, canvas.width, canvas.height);
          } catch (e) {
            console.error(`Error reading pixel data for ${layer.name}:`, e);
          }
        }
      }
    });

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const snapshot = {
      id: `state_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: actionName,
      icon,
      timestamp: timeStr,
      layers: currentLayers.map((l) => ({ ...l })),
      activeLayerId: currentActiveId,
      canvasWidth: w,
      canvasHeight: h,
      layerPixelData
    };

    // Discard redo history beyond current index
    const newStack = historyStackRef.current.slice(0, currentIndexRef.current + 1);
    newStack.push(snapshot);

    if (newStack.length > maxHistory) {
      newStack.shift();
    }

    historyStackRef.current = newStack;
    currentIndexRef.current = newStack.length - 1;
    updateState();
  }, [layers, activeLayerId, canvasWidth, canvasHeight, layerCanvasesRef, updateState]);

  /**
   * Initializes the history stack with the initial blank canvas state
   */
  const initHistory = useCallback((initialLayers, initialActiveId, w, h) => {
    const targetLayers = initialLayers || layers;
    const targetActiveId = initialActiveId || activeLayerId;
    const targetW = w || canvasWidth;
    const targetH = h || canvasHeight;

    const layerPixelData = {};
    targetLayers.forEach((layer) => {
      const canvas = layerCanvasesRef.current[layer.id];
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          layerPixelData[layer.id] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
      }
    });

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const snapshot = {
      id: `state_init_${Date.now()}`,
      action: 'Open Document',
      icon: 'file',
      timestamp: timeStr,
      layers: targetLayers.map((l) => ({ ...l })),
      activeLayerId: targetActiveId,
      canvasWidth: targetW,
      canvasHeight: targetH,
      layerPixelData
    };

    historyStackRef.current = [snapshot];
    currentIndexRef.current = 0;
    updateState();
  }, [layers, activeLayerId, canvasWidth, canvasHeight, layerCanvasesRef, updateState]);

  /**
   * Applies a snapshot back onto the canvas elements
   */
  const applySnapshotToCanvases = useCallback((snapshot) => {
    if (!snapshot) return;

    if (onRestoreSnapshot) {
      onRestoreSnapshot(snapshot);
    }

    setTimeout(() => {
      Object.entries(snapshot.layerPixelData).forEach(([layerId, imageData]) => {
        const canvas = layerCanvasesRef.current[layerId];
        if (canvas && imageData) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.putImageData(imageData, 0, 0);
          }
        }
      });
    }, 20);
  }, [layerCanvasesRef, onRestoreSnapshot]);

  const undo = useCallback(() => {
    if (currentIndexRef.current <= 0) return;
    currentIndexRef.current -= 1;
    const snapshot = historyStackRef.current[currentIndexRef.current];
    applySnapshotToCanvases(snapshot);
    updateState();
  }, [applySnapshotToCanvases, updateState]);

  const redo = useCallback(() => {
    if (currentIndexRef.current >= historyStackRef.current.length - 1) return;
    currentIndexRef.current += 1;
    const snapshot = historyStackRef.current[currentIndexRef.current];
    applySnapshotToCanvases(snapshot);
    updateState();
  }, [applySnapshotToCanvases, updateState]);

  /**
   * Jump directly to any previous history state (Photoshop Visual History)
   */
  const jumpToIndex = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= historyStackRef.current.length) return;
    currentIndexRef.current = targetIndex;
    const snapshot = historyStackRef.current[targetIndex];
    applySnapshotToCanvases(snapshot);
    updateState();
  }, [applySnapshotToCanvases, updateState]);

  // Global Keyboard shortcuts: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    canUndo,
    canRedo,
    pushSnapshot,
    initHistory,
    undo,
    redo,
    jumpToIndex,
    historyList,
    currentIndex: currentIndexRef.current
  };
}
