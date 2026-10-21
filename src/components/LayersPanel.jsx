import React from 'react';
import { BLEND_MODES } from '../utils/layerUtils';

export default function LayersPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onToggleVisibility,
  onChangeOpacity,
  onChangeBlendMode,
  onChangeLayerName,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) {
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1];

  // In Photoshop / Figma, the visual layer list displays the top-most layer at the top!
  // In our array, index 0 is bottom (background), index length-1 is top.
  // We reverse the array for display while retaining correct actual array indices.
  const displayLayers = [...layers].map((layer, actualIndex) => ({
    layer,
    actualIndex
  })).reverse();

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-300">
            Layers Stack
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-mono">
            {layers.length}
          </span>
        </div>

        {/* Layer Stack Actions: Add, Duplicate, Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={onAddLayer}
            className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
            title="Add New Transparent Layer"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            onClick={onDuplicateLayer}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition border border-zinc-700"
            title="Duplicate Active Layer"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </button>

          <button
            onClick={onDeleteLayer}
            disabled={layers.length <= 1}
            className={`p-1 rounded transition border ${
              layers.length > 1
                ? 'bg-zinc-800 hover:bg-rose-950/70 hover:text-rose-400 text-zinc-400 border-zinc-700 cursor-pointer'
                : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
            }`}
            title={layers.length > 1 ? 'Delete Active Layer' : 'Cannot delete the only remaining layer'}
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Layer Controls (Opacity & Blend Mode) */}
      {activeLayer && (
        <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-[11px] font-medium truncate max-w-[140px]">
              {activeLayer.name}
            </span>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
              Active Layer
            </span>
          </div>

          {/* Opacity Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Opacity</span>
              <span className="font-mono text-[11px] text-zinc-200">{activeLayer.opacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={activeLayer.opacity}
              onChange={(e) => onChangeOpacity(activeLayer.id, Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
            />
          </div>

          {/* Blend Mode Selector */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
            <span className="text-zinc-400 text-[11px]">Blend Mode:</span>
            <select
              value={activeLayer.blendMode}
              onChange={(e) => onChangeBlendMode(activeLayer.id, e.target.value)}
              className="bg-zinc-800 text-zinc-200 text-[11px] rounded px-2 py-1 border border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {BLEND_MODES.map((bm) => (
                <option key={bm.id} value={bm.id}>
                  {bm.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Visual Layer Stack List (Top Layer to Bottom Layer) */}
      <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-0.5">
        {displayLayers.map(({ layer, actualIndex }) => {
          const isActive = layer.id === activeLayerId;
          const isTop = actualIndex === layers.length - 1;
          const isBottom = actualIndex === 0;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`p-2 rounded-lg border transition flex items-center justify-between gap-2 cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Visibility Toggle Eye */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className={`w-6 h-6 rounded flex items-center justify-center transition text-xs ${
                    layer.visible
                      ? 'text-zinc-300 hover:text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? '👁' : '✕'}
                </button>

                {/* Layer Thumbnail / Symbol */}
                <div
                  className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] shadow-inner ${
                    layer.isBackground
                      ? 'bg-white border-zinc-400 text-zinc-800'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {layer.isBackground ? '📄' : '▱'}
                </div>

                {/* Layer Name (Double click or click to edit) */}
                <span
                  className={`text-xs truncate font-medium ${
                    isActive ? 'text-zinc-100' : 'text-zinc-300'
                  }`}
                >
                  {layer.name}
                </span>
              </div>

              {/* Reorder Buttons (Move Up / Down) */}
              <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onMoveLayerUp(actualIndex)}
                  disabled={isTop}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition ${
                    !isTop
                      ? 'hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100'
                      : 'text-zinc-700 cursor-not-allowed'
                  }`}
                  title="Move Layer Up"
                >
                  ▲
                </button>

                <button
                  type="button"
                  onClick={() => onMoveLayerDown(actualIndex)}
                  disabled={isBottom}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition ${
                    !isBottom
                      ? 'hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100'
                      : 'text-zinc-700 cursor-not-allowed'
                  }`}
                  title="Move Layer Down"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* History State Card */}
      <div className="mt-2 p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs space-y-2">
        <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
          History State
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex-1 py-1 px-2 rounded border text-[11px] transition ${
              canUndo
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer'
                : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Undo (Ctrl+Z)
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex-1 py-1 px-2 rounded border text-[11px] transition ${
              canRedo
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer'
                : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Redo (Ctrl+Y)
          </button>
        </div>
      </div>
    </div>
  );
}
