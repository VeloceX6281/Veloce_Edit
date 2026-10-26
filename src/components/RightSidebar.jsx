import React, { useState } from 'react';
import { hexToRgb, rgbToHex } from '../utils/colorUtils';
import LayersPanel from './LayersPanel';

const SWATCHES = [
  '#000000', '#1f1f1f', '#404040', '#666666', '#8c8c8c', '#b3b3b3', '#d9d9d9', '#ffffff',
  '#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#00ffff', '#007fff', '#0000ff', '#7f00ff',
  '#800000', '#804000', '#808000', '#008000', '#008080', '#004080', '#000080', '#400080',
  '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e8baff', '#ffd1dc', '#c1e1c1'
];

const ACTION_ICONS = {
  file: '📄',
  brush: '🖌️',
  eraser: '🧹',
  rectangle: '▭',
  circle: '◯',
  text: '𝐓',
  bucket: '🪣',
  layer: '📑',
  transform: '⛶',
  crop: '✂️',
  filter: '⚡',
  image: '🖼️',
  edit: '✏️'
};

export default function RightSidebar({
  activeTool,
  brushSize,
  setBrushSize,
  brushColor,
  setBrushColor,
  shapeFillEnabled,
  setShapeFillEnabled,
  shapeFillColor,
  setShapeFillColor,
  adjustments,
  setAdjustments,
  onApplyAdjustments,
  onResetAdjustments,
  onClearCanvas,
  onFillCanvas,
  // Multi-Layer props
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
  onToggleClippingMask,
  onMergeDown,
  onMergeVisible,
  onToggleLockTransparency,
  onLayerViaCopy,
  onLayerViaCut,
  // Visual History props
  historyList = [],
  currentIndex = 0,
  onJumpToIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) {
  // Dock Panel Tabs
  const [topTab, setTopTab] = useState('color'); // 'color' | 'swatches'
  const [midTab, setMidTab] = useState('history'); // 'history' | 'adjustments'
  const [bottomTab, setBottomTab] = useState('layers'); // 'layers' | 'channels' | 'paths'

  // Current RGB for color sliders
  const currentRgb = hexToRgb(brushColor);

  const handleRgbChange = (channel, val) => {
    const updated = { ...currentRgb, [channel]: Number(val) };
    const newHex = rgbToHex(updated.r, updated.g, updated.b);
    setBrushColor(newHex);
  };

  const updateAdjustment = (field, val) => {
    setAdjustments((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <aside className="w-[280px] bg-[#282828] border-l border-[#181818] flex flex-col h-full overflow-hidden select-none text-[11px] font-sans shrink-0">
      {/* ──────────────────────────────────────────────────────────
          1. TOP PANEL: COLOR / SWATCHES DOCK
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-[#181818] shrink-0 bg-[#2b2b2b]">
        {/* Top Tab Header */}
        <div className="h-6 bg-[#242424] border-b border-[#181818] flex items-center px-1 text-[10px]">
          <button
            type="button"
            onClick={() => setTopTab('color')}
            className={`px-3 py-1 font-medium transition rounded-t-[2px] ${
              topTab === 'color'
                ? 'bg-[#282828] text-white border-t-2 border-[#1473e6]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Color
          </button>
          <button
            type="button"
            onClick={() => setTopTab('swatches')}
            className={`px-3 py-1 font-medium transition rounded-t-[2px] ${
              topTab === 'swatches'
                ? 'bg-[#282828] text-white border-t-2 border-[#1473e6]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Swatches
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-2 bg-[#282828]">
          {topTab === 'color' ? (
            <div className="space-y-2">
              {/* Foreground / Background Color Preview & Hex input */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-[2px] border border-[#181818] shadow-inner"
                    style={{ backgroundColor: brushColor }}
                    title={`Foreground Color: ${brushColor}`}
                  />
                  <span className="font-mono text-zinc-300 font-semibold">{brushColor.toUpperCase()}</span>
                </div>
                <div className="relative">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"
                    title="Open Color Wheel"
                  />
                  <div className="w-5 h-5 rounded-[2px] border border-[#383838] bg-[#1c1c1c] hover:bg-[#383838] flex items-center justify-center text-[10px] cursor-pointer">
                    🎨
                  </div>
                </div>
              </div>

              {/* RGB Sliders */}
              <div className="space-y-1 pt-1">
                {/* R Slider */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 text-red-400 font-bold text-[10px]">R</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={currentRgb.r}
                    onChange={(e) => handleRgbChange('r', e.target.value)}
                    className="flex-1 h-1.5 rounded cursor-pointer accent-[#1473e6]"
                    style={{
                      background: `linear-gradient(to right, rgb(0, ${currentRgb.g}, ${currentRgb.b}), rgb(255, ${currentRgb.g}, ${currentRgb.b}))`
                    }}
                  />
                  <span className="w-6 text-right font-mono text-[10px] text-zinc-300">{currentRgb.r}</span>
                </div>

                {/* G Slider */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 text-green-400 font-bold text-[10px]">G</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={currentRgb.g}
                    onChange={(e) => handleRgbChange('g', e.target.value)}
                    className="flex-1 h-1.5 rounded cursor-pointer accent-[#1473e6]"
                    style={{
                      background: `linear-gradient(to right, rgb(${currentRgb.r}, 0, ${currentRgb.b}), rgb(${currentRgb.r}, 255, ${currentRgb.b}))`
                    }}
                  />
                  <span className="w-6 text-right font-mono text-[10px] text-zinc-300">{currentRgb.g}</span>
                </div>

                {/* B Slider */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 text-blue-400 font-bold text-[10px]">B</span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={currentRgb.b}
                    onChange={(e) => handleRgbChange('b', e.target.value)}
                    className="flex-1 h-1.5 rounded cursor-pointer accent-[#1473e6]"
                    style={{
                      background: `linear-gradient(to right, rgb(${currentRgb.r}, ${currentRgb.g}, 0), rgb(${currentRgb.r}, ${currentRgb.g}, 255))`
                    }}
                  />
                  <span className="w-6 text-right font-mono text-[10px] text-zinc-300">{currentRgb.b}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Swatches Grid */
            <div className="grid grid-cols-8 gap-1 py-1">
              {SWATCHES.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBrushColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-5 rounded-[1px] border transition hover:scale-110 ${
                    brushColor.toLowerCase() === color.toLowerCase()
                      ? 'border-[#1473e6] shadow-sm'
                      : 'border-[#181818]'
                  }`}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. MIDDLE PANEL: HISTORY / ADJUSTMENTS DOCK
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-[#181818] h-[190px] shrink-0 bg-[#2b2b2b]">
        {/* Middle Tab Header */}
        <div className="h-6 bg-[#242424] border-b border-[#181818] flex items-center px-1 text-[10px]">
          <button
            type="button"
            onClick={() => setMidTab('history')}
            className={`px-3 py-1 font-medium transition rounded-t-[2px] ${
              midTab === 'history'
                ? 'bg-[#282828] text-white border-t-2 border-[#1473e6]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => setMidTab('adjustments')}
            className={`px-3 py-1 font-medium transition rounded-t-[2px] ${
              midTab === 'adjustments'
                ? 'bg-[#282828] text-white border-t-2 border-[#1473e6]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Adjustments
          </button>

          {/* Quick Undo/Redo Icons */}
          <div className="ml-auto flex items-center gap-1 pr-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-0.5 rounded-[1px] ${canUndo ? 'text-zinc-300 hover:text-white' : 'text-zinc-600'}`}
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-0.5 rounded-[1px] ${canRedo ? 'text-zinc-300 hover:text-white' : 'text-zinc-600'}`}
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-[#1e1e1e] p-1 [scrollbar-width:thin]">
          {midTab === 'history' ? (
            <div className="space-y-0.5">
              {historyList.map((item) => {
                const isActive = item.index === currentIndex;
                const isUndone = item.index > currentIndex;
                const icon = ACTION_ICONS[item.icon] || '✏️';

                return (
                  <div
                    key={item.id}
                    onClick={() => onJumpToIndex && onJumpToIndex(item.index)}
                    className={`px-2 py-1 rounded-[1px] flex items-center justify-between cursor-pointer transition ${
                      isActive
                        ? 'bg-[#1473e6] text-white font-medium'
                        : isUndone
                        ? 'text-zinc-500 opacity-60 hover:bg-[#282828]'
                        : 'text-zinc-300 hover:bg-[#2e2e2e]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs">{icon}</span>
                      <span className="truncate text-[10px]">{item.action}</span>
                    </div>
                    <span className="text-[9px] font-mono opacity-70">{item.timestamp}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Adjustments Controls */
            <div className="space-y-2 p-1">
              {/* Brightness */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Brightness</span>
                  <span className="font-mono text-zinc-200">{adjustments.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.brightness}
                  onChange={(e) => updateAdjustment('brightness', Number(e.target.value))}
                  className="w-full h-1 bg-[#181818] rounded accent-[#1473e6] cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Contrast</span>
                  <span className="font-mono text-zinc-200">{adjustments.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.contrast}
                  onChange={(e) => updateAdjustment('contrast', Number(e.target.value))}
                  className="w-full h-1 bg-[#181818] rounded accent-[#1473e6] cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Saturation</span>
                  <span className="font-mono text-zinc-200">{adjustments.saturate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.saturate}
                  onChange={(e) => updateAdjustment('saturate', Number(e.target.value))}
                  className="w-full h-1 bg-[#181818] rounded accent-[#1473e6] cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Blur</span>
                  <span className="font-mono text-zinc-200">{adjustments.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={adjustments.blur}
                  onChange={(e) => updateAdjustment('blur', Number(e.target.value))}
                  className="w-full h-1 bg-[#181818] rounded accent-[#1473e6] cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={onApplyAdjustments}
                  className="flex-1 py-1 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white text-[10px] font-medium transition shadow-sm"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={onResetAdjustments}
                  className="flex-1 py-1 rounded-[2px] bg-[#1c1c1c] hover:bg-[#383838] border border-[#3a3a3a] text-zinc-300 text-[10px] transition"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          3. BOTTOM PANEL: LAYERS DOCK (Photoshop Parity)
         ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#282828]">
        {/* Layers Tab Header */}
        <div className="h-6 bg-[#242424] border-b border-[#181818] flex items-center px-1 text-[10px]">
          <button
            type="button"
            onClick={() => setBottomTab('layers')}
            className={`px-3 py-1 font-medium transition rounded-t-[2px] ${
              bottomTab === 'layers'
                ? 'bg-[#282828] text-white border-t-2 border-[#1473e6]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Layers ({layers.length})
          </button>
          <button
            type="button"
            onClick={() => setBottomTab('channels')}
            className={`px-3 py-1 font-medium transition rounded-t-[2px] ${
              bottomTab === 'channels'
                ? 'bg-[#282828] text-white border-t-2 border-[#1473e6]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Channels
          </button>
          <button
            type="button"
            onClick={() => setBottomTab('paths')}
            className={`px-3 py-1 font-medium transition rounded-t-[2px] ${
              bottomTab === 'paths'
                ? 'bg-[#282828] text-white border-t-2 border-[#1473e6]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Paths
          </button>
        </div>

        {/* Embedded Photoshop Layers Panel */}
        <LayersPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectLayer={onSelectLayer}
          onAddLayer={onAddLayer}
          onDeleteLayer={onDeleteLayer}
          onDuplicateLayer={onDuplicateLayer}
          onMoveLayerUp={onMoveLayerUp}
          onMoveLayerDown={onMoveLayerDown}
          onToggleVisibility={onToggleVisibility}
          onChangeOpacity={onChangeOpacity}
          onChangeBlendMode={onChangeBlendMode}
          onChangeLayerName={onChangeLayerName}
          onToggleClippingMask={onToggleClippingMask}
          onMergeDown={onMergeDown}
          onMergeVisible={onMergeVisible}
          onToggleLockTransparency={onToggleLockTransparency}
          onLayerViaCopy={onLayerViaCopy}
          onLayerViaCut={onLayerViaCut}
          onOpenAdjustments={() => setMidTab('adjustments')}
        />
      </div>
    </aside>
  );
}
