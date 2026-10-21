import React from 'react';
import {
  DEFAULT_ADJUSTMENTS,
  FILTER_PRESETS,
  isAdjustmentsActive
} from '../utils/filterUtils';

export default function AdjustmentsPanel({
  adjustments,
  setAdjustments,
  onApplyAdjustments,
  onResetAdjustments
}) {
  const isDirty = isAdjustmentsActive(adjustments);

  const updateField = (field, value) => {
    setAdjustments((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const resetField = (field) => {
    setAdjustments((prev) => ({
      ...prev,
      [field]: DEFAULT_ADJUSTMENTS[field]
    }));
  };

  const applyPreset = (preset) => {
    setAdjustments({ ...preset.values });
  };

  return (
    <div className="flex flex-col gap-5 text-xs select-none">
      {/* Live Preview Status Header */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
        <div>
          <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-300">
            Live Adjustments
          </span>
          <p className="text-[10px] text-zinc-500">Non-destructive GPU preview</p>
        </div>
        {isDirty ? (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-medium animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Unbaked
          </span>
        ) : (
          <span className="text-[10px] text-zinc-500">Default</span>
        )}
      </div>

      {/* Preset Filter Chips */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          Style Presets
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="py-1 px-2 rounded bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/70 text-zinc-300 hover:text-zinc-100 text-[11px] font-medium transition text-center truncate"
              title={`Apply ${preset.name} preset`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Adjustment Sliders */}
      <div className="space-y-4">
        {/* Brightness */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-zinc-400">
            <span
              className="cursor-pointer hover:text-zinc-200"
              title="Double click to reset"
              onDoubleClick={() => resetField('brightness')}
            >
              Brightness
            </span>
            <span className="font-mono text-[11px] text-indigo-400 font-medium">
              {adjustments.brightness}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={adjustments.brightness}
            onChange={(e) => updateField('brightness', Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-zinc-500">
            <span>0%</span>
            <span className="text-zinc-400">100%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Contrast */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-zinc-400">
            <span
              className="cursor-pointer hover:text-zinc-200"
              title="Double click to reset"
              onDoubleClick={() => resetField('contrast')}
            >
              Contrast
            </span>
            <span className="font-mono text-[11px] text-indigo-400 font-medium">
              {adjustments.contrast}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={adjustments.contrast}
            onChange={(e) => updateField('contrast', Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-zinc-500">
            <span>0%</span>
            <span className="text-zinc-400">100%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Saturation */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-zinc-400">
            <span
              className="cursor-pointer hover:text-zinc-200"
              title="Double click to reset"
              onDoubleClick={() => resetField('saturation')}
            >
              Saturation
            </span>
            <span className="font-mono text-[11px] text-indigo-400 font-medium">
              {adjustments.saturation}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={adjustments.saturation}
            onChange={(e) => updateField('saturation', Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-zinc-500">
            <span>0%</span>
            <span className="text-zinc-400">100%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Blur */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-zinc-400">
            <span
              className="cursor-pointer hover:text-zinc-200"
              title="Double click to reset"
              onDoubleClick={() => resetField('blur')}
            >
              Blur
            </span>
            <span className="font-mono text-[11px] text-indigo-400 font-medium">
              {adjustments.blur}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={adjustments.blur}
            onChange={(e) => updateField('blur', Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-zinc-500">
            <span>0px</span>
            <span>10px</span>
            <span>20px</span>
          </div>
        </div>

        {/* Grayscale Toggle & Slider */}
        <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <div className="flex justify-between items-center text-zinc-300">
            <span className="font-medium">Grayscale</span>
            <button
              onClick={() => updateField('grayscale', adjustments.grayscale > 0 ? 0 : 100)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                adjustments.grayscale > 0
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {adjustments.grayscale > 0 ? 'ON' : 'OFF'}
            </button>
          </div>
          {adjustments.grayscale > 0 && (
            <div className="pt-1">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={adjustments.grayscale}
                onChange={(e) => updateField('grayscale', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>0%</span>
                <span className="font-mono text-zinc-400">{adjustments.grayscale}%</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>

        {/* Invert Toggle & Slider */}
        <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <div className="flex justify-between items-center text-zinc-300">
            <span className="font-medium">Invert Colors</span>
            <button
              onClick={() => updateField('invert', adjustments.invert > 0 ? 0 : 100)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                adjustments.invert > 0
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {adjustments.invert > 0 ? 'ON' : 'OFF'}
            </button>
          </div>
          {adjustments.invert > 0 && (
            <div className="pt-1">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={adjustments.invert}
                onChange={(e) => updateField('invert', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>0%</span>
                <span className="font-mono text-zinc-400">{adjustments.invert}%</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>

        {/* Bonus: Sepia & Hue Rotate Collapsible / Additional sliders */}
        <div className="pt-1 space-y-3 border-t border-zinc-800/80">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span
                className="cursor-pointer hover:text-zinc-200"
                title="Double click to reset"
                onDoubleClick={() => resetField('sepia')}
              >
                Sepia Tone
              </span>
              <span className="font-mono text-[11px] text-indigo-400 font-medium">
                {adjustments.sepia}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={adjustments.sepia}
              onChange={(e) => updateField('sepia', Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span
                className="cursor-pointer hover:text-zinc-200"
                title="Double click to reset"
                onDoubleClick={() => resetField('hueRotate')}
              >
                Hue Rotate
              </span>
              <span className="font-mono text-[11px] text-indigo-400 font-medium">
                {adjustments.hueRotate}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={adjustments.hueRotate}
              onChange={(e) => updateField('hueRotate', Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-zinc-800" />

      {/* Action Buttons: Apply & Reset */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={onApplyAdjustments}
          disabled={!isDirty}
          className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition shadow-md ${
            isDirty
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
              : 'bg-zinc-800/80 text-zinc-500 border border-zinc-800 cursor-not-allowed'
          }`}
          title={isDirty ? 'Bake adjustments into canvas pixels' : 'Adjust sliders to enable'}
        >
          <svg className="w-4 h-4 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Apply Adjustments (Bake)
        </button>

        <button
          onClick={onResetAdjustments}
          disabled={!isDirty}
          className={`w-full py-2 px-3 rounded-lg text-xs font-medium border transition ${
            isDirty
              ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer'
              : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          Reset Adjustments
        </button>

        <p className="text-[10px] text-zinc-500 text-center pt-0.5">
          Applying bakes filters into canvas & records an Undo snapshot.
        </p>
      </div>
    </div>
  );
}
