import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Hook to manage Canvas Undo / Redo history state stack using snapshot buffers (ImageData).
 * Supports Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) keyboard shortcuts and limits memory footprint.
 */
export function useCanvasHistory(baseCanvasRef) {
  const historyStackRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const maxHistory = 35;

  const updateState = useCallback(() => {
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(currentIndexRef.current < historyStackRef.current.length - 1);
  }, []);

  const pushSnapshot = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Discard redo stack beyond current index
      const newStack = historyStackRef.current.slice(0, currentIndexRef.current + 1);
      newStack.push(snapshot);

      // Limit memory
      if (newStack.length > maxHistory) {
        newStack.shift();
      }

      historyStackRef.current = newStack;
      currentIndexRef.current = newStack.length - 1;
      updateState();
    } catch (err) {
      console.error('Failed to capture canvas snapshot:', err);
    }
  }, [baseCanvasRef, updateState]);

  const undo = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas || currentIndexRef.current <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    currentIndexRef.current -= 1;
    const snapshot = historyStackRef.current[currentIndexRef.current];
    if (snapshot) {
      ctx.putImageData(snapshot, 0, 0);
    }
    updateState();
  }, [baseCanvasRef, updateState]);

  const redo = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas || currentIndexRef.current >= historyStackRef.current.length - 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    currentIndexRef.current += 1;
    const snapshot = historyStackRef.current[currentIndexRef.current];
    if (snapshot) {
      ctx.putImageData(snapshot, 0, 0);
    }
    updateState();
  }, [baseCanvasRef, updateState]);

  const initHistory = useCallback(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyStackRef.current = [snapshot];
      currentIndexRef.current = 0;
      updateState();
    } catch (err) {
      console.error('Failed to init canvas history:', err);
    }
  }, [baseCanvasRef, updateState]);

  const clearHistory = useCallback(() => {
    historyStackRef.current = [];
    currentIndexRef.current = -1;
    updateState();
  }, [updateState]);

  // Global Keyboard shortcuts: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an active input or textarea
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
    undo,
    redo,
    initHistory,
    clearHistory,
    historyCount: historyStackRef.current.length,
    currentIndex: currentIndexRef.current
  };
}
