import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsb,
  hsbToRgb,
  hsbToHex,
  hexToHsb
} from '../utils/colorUtils';

export default function ColorPickerModal({
  isOpen,
  onClose,
  initialColor = '#6366f1',
  onSelectColor,
  title = 'Color Picker (Foreground Color)'
}) {
  const [hex, setHex] = useState(initialColor);
  const [rgb, setRgb] = useState({ r: 99, g: 102, b: 241 });
  const [hsb, setHsb] = useState({ h: 239, s: 59, b: 95 });

  const spectrumRef = useRef(null);
  const hueSliderRef = useRef(null);
  const isDraggingSpectrum = useRef(false);
  const isDraggingHue = useRef(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHex(initialColor);
      const rgbVal = hexToRgb(initialColor);
      setRgb(rgbVal);
      setHsb(rgbToHsb(rgbVal.r, rgbVal.g, rgbVal.b));
    }
  }, [isOpen, initialColor]);

  // Update from HSB
  const updateFromHsb = useCallback((h, s, b) => {
    const clampedH = Math.max(0, Math.min(360, Math.round(h)));
    const clampedS = Math.max(0, Math.min(100, Math.round(s)));
    const clampedB = Math.max(0, Math.min(100, Math.round(b)));

    const newHsb = { h: clampedH, s: clampedS, b: clampedB };
    const newRgb = hsbToRgb(clampedH, clampedS, clampedB);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);

    setHsb(newHsb);
    setRgb(newRgb);
    setHex(newHex);
  }, []);

  // Update from RGB
  const updateFromRgb = useCallback((r, g, b) => {
    const clampedR = Math.max(0, Math.min(255, Math.round(r)));
    const clampedG = Math.max(0, Math.min(255, Math.round(g)));
    const clampedB = Math.max(0, Math.min(255, Math.round(b)));

    const newRgb = { r: clampedR, g: clampedG, b: clampedB };
    const newHex = rgbToHex(clampedR, clampedG, clampedB);
    const newHsb = rgbToHsb(clampedR, clampedG, clampedB);

    setRgb(newRgb);
    setHex(newHex);
    setHsb(newHsb);
  }, []);

  // Update from HEX input
  const handleHexChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    setHex(val);

    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const newRgb = hexToRgb(val);
      setRgb(newRgb);
      setHsb(rgbToHsb(newRgb.r, newRgb.g, newRgb.b));
    }
  };

  // 2D Spectrum Interaction
  const handleSpectrumPointerDown = (e) => {
    isDraggingSpectrum.current = true;
    handleSpectrumMove(e);
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handleSpectrumMove = (e) => {
    if (!isDraggingSpectrum.current || !spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const b = Math.round((1 - y / rect.height) * 100);

    updateFromHsb(hsb.h, s, b);
  };

  const handleSpectrumPointerUp = () => {
    isDraggingSpectrum.current = false;
  };

  // 1D Hue Bar Interaction
  const handleHuePointerDown = (e) => {
    isDraggingHue.current = true;
    handleHueMove(e);
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handleHueMove = (e) => {
    if (!isDraggingHue.current || !hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const h = Math.round((y / rect.height) * 360);

    updateFromHsb(h, hsb.s, hsb.b);
  };

  const handleHuePointerUp = () => {
    isDraggingHue.current = false;
  };

  const handleConfirm = () => {
    onSelectColor(hex);
    onClose();
  };

  if (!isOpen) return null;

  const pureHueHex = hsbToHex(hsb.h, 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#22252e] border border-zinc-700/80 rounded-xl shadow-2xl p-5 text-zinc-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-700/70">
          <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
            <span>🎨</span>
            <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Main Spectrum & Color Controls */}
        <div className="flex gap-4">
          {/* 1. 2D Saturation / Brightness Spectrum Box */}
          <div
            ref={spectrumRef}
            onPointerDown={handleSpectrumPointerDown}
            onPointerMove={handleSpectrumMove}
            onPointerUp={handleSpectrumPointerUp}
            className="relative w-64 h-64 rounded-lg cursor-crosshair border border-zinc-700 overflow-hidden shadow-inner flex-shrink-0"
            style={{ backgroundColor: pureHueHex }}
          >
            {/* White-to-transparent horizontal gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, #ffffff, transparent)'
              }}
            />
            {/* Transparent-to-black vertical gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent, #000000)'
              }}
            />
            {/* Draggable Circle Picker Indicator */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${hsb.s}%`,
                top: `${100 - hsb.b}%`,
                backgroundColor: hex
              }}
            />
          </div>

          {/* 2. 1D Hue Vertical Rainbow Slider */}
          <div
            ref={hueSliderRef}
            onPointerDown={handleHuePointerDown}
            onPointerMove={handleHueMove}
            onPointerUp={handleHuePointerUp}
            className="relative w-8 h-64 rounded-lg cursor-pointer border border-zinc-700 overflow-hidden shadow-inner flex-shrink-0"
            style={{
              background: `linear-gradient(to bottom, 
                #ff0000 0%, 
                #ffff00 17%, 
                #00ff00 33%, 
                #00ffff 50%, 
                #0000ff 67%, 
                #ff00ff 83%, 
                #ff0000 100%)`
            }}
          >
            {/* Slider arrows */}
            <div
              className="absolute left-0 right-0 h-2 border-y-2 border-white shadow-sm pointer-events-none -translate-y-1/2"
              style={{ top: `${(hsb.h / 360) * 100}%` }}
            />
          </div>

          {/* 3. Color Comparison & Numeric Inputs Column */}
          <div className="flex-1 flex flex-col justify-between text-xs space-y-3">
            {/* Comparison Swatch (New vs Current) */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 font-medium">Comparison</span>
              <div className="w-full h-14 rounded-lg border border-zinc-700 overflow-hidden flex flex-col shadow-inner">
                <div
                  className="flex-1 flex items-center justify-end px-2 text-[10px] font-medium text-white/90 drop-shadow"
                  style={{ backgroundColor: hex }}
                  title="New Selected Color"
                >
                  New
                </div>
                <div
                  className="flex-1 flex items-center justify-end px-2 text-[10px] font-medium text-white/90 drop-shadow"
                  style={{ backgroundColor: initialColor }}
                  title="Original Color"
                >
                  Current
                </div>
              </div>
            </div>

            {/* HSB & RGB Numeric Fields */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* HSB */}
              <div className="space-y-1.5 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">H:</span>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={hsb.h}
                    onChange={(e) => updateFromHsb(Number(e.target.value), hsb.s, hsb.b)}
                    className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-right text-zinc-200"
                  />
                  <span className="text-zinc-500 text-[10px]">°</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">S:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={hsb.s}
                    onChange={(e) => updateFromHsb(hsb.h, Number(e.target.value), hsb.b)}
                    className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-right text-zinc-200"
                  />
                  <span className="text-zinc-500 text-[10px]">%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">B:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={hsb.b}
                    onChange={(e) => updateFromHsb(hsb.h, hsb.s, Number(e.target.value))}
                    className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-right text-zinc-200"
                  />
                  <span className="text-zinc-500 text-[10px]">%</span>
                </div>
              </div>

              {/* RGB */}
              <div className="space-y-1.5 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">R:</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.r}
                    onChange={(e) => updateFromRgb(Number(e.target.value), rgb.g, rgb.b)}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-right text-zinc-200"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">G:</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.g}
                    onChange={(e) => updateFromRgb(rgb.r, Number(e.target.value), rgb.b)}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-right text-zinc-200"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">B:</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.b}
                    onChange={(e) => updateFromRgb(rgb.r, rgb.g, Number(e.target.value))}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-right text-zinc-200"
                  />
                </div>
              </div>
            </div>

            {/* Hex Input */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <span className="text-zinc-400 text-[11px] font-mono">Hex:</span>
              <input
                type="text"
                value={hex.toUpperCase()}
                onChange={handleHexChange}
                maxLength={7}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 font-mono text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-700/70">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
