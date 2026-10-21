import React from 'react';
import AdjustmentsPanel from './AdjustmentsPanel';
import LayersPanel from './LayersPanel';
import HistoryPanel from './HistoryPanel';

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
  '#18181b', '#52525b', '#a1a1aa', '#ffffff'
];

export default function RightSidebar({
  activeTab,
  setActiveTab,
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
  // Visual History props
  historyList,
  currentIndex,
  onJumpToIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) {
  return (
    <aside className="w-72 bg-[#14161d] border-l border-zinc-800 flex flex-col z-10 select-none">
      {/* Top Tab Bar: Layers, History, Adjustments, Properties */}
      <div className="h-10 border-b border-zinc-800 flex text-xs">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 font-medium border-b-2 transition flex items-center justify-center gap-1 ${
            activeTab === 'layers'
              ? 'border-indigo-500 text-zinc-100 bg-[#181a22]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Layers</span>
          <span className="text-[10px] text-zinc-500 font-mono">({layers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 font-medium border-b-2 transition flex items-center justify-center gap-1 ${
            activeTab === 'history'
              ? 'border-indigo-500 text-zinc-100 bg-[#181a22]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>History</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`flex-1 font-medium border-b-2 transition flex items-center justify-center gap-1 ${
            activeTab === 'adjustments'
              ? 'border-indigo-500 text-zinc-100 bg-[#181a22]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Filters</span>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 font-medium border-b-2 transition flex items-center justify-center gap-1 ${
            activeTab === 'properties'
              ? 'border-indigo-500 text-zinc-100 bg-[#181a22]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Props</span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-5">
        {/* TAB 1: Layers Stack */}
        {activeTab === 'layers' && (
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
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
          />
        )}

        {/* TAB 2: Visual Action History */}
        {activeTab === 'history' && (
          <HistoryPanel
            historyList={historyList}
            currentIndex={currentIndex}
            onJumpToIndex={onJumpToIndex}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
          />
        )}

        {/* TAB 3: Adjustments & Filter Pipeline */}
        {activeTab === 'adjustments' && (
          <AdjustmentsPanel
            adjustments={adjustments}
            setAdjustments={setAdjustments}
            onApplyAdjustments={onApplyAdjustments}
            onResetAdjustments={onResetAdjustments}
          />
        )}

        {/* TAB 4: Tool Properties */}
        {activeTab === 'properties' && (
          <div className="flex flex-col gap-5 text-xs">
            {/* Tool Specific Sliders */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-zinc-400">
                <span className="font-medium text-zinc-300">
                  {activeTool === 'eraser' ? 'Eraser Size' : 'Brush / Stroke Size'}
                </span>
                <span className="font-mono text-indigo-400 font-semibold">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-zinc-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>1px</span>
                <span>40px</span>
                <span>80px</span>
              </div>
            </div>

            {/* Live Color Picker */}
            <div className="flex flex-col gap-2">
              <span className="font-medium text-zinc-300">Color Palette</span>
              <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                <div className="relative">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer opacity-0 absolute inset-0 z-10"
                    title="Choose Color"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-zinc-700 shadow-md"
                    style={{ backgroundColor: brushColor }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-zinc-200">{brushColor.toUpperCase()}</span>
                  <span className="text-[10px] text-zinc-500">Click swatch to customize</span>
                </div>
              </div>

              {/* Swatch Grid */}
              <div className="grid grid-cols-8 gap-1.5 pt-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    className={`w-6 h-6 rounded-md border transition hover:scale-110 ${
                      brushColor.toLowerCase() === c.toLowerCase()
                        ? 'border-indigo-400 scale-110 shadow-md'
                        : 'border-zinc-700/80'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Shape Fill Controls if active */}
            {(activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'shapes') && (
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col gap-2.5">
                <span className="font-medium text-zinc-300 text-[11px]">Shape Properties</span>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={shapeFillEnabled}
                    onChange={(e) => setShapeFillEnabled(e.target.checked)}
                    className="rounded accent-indigo-500 w-3.5 h-3.5"
                  />
                  <span>Enable Solid Fill</span>
                </label>

                {shapeFillEnabled && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-zinc-400 text-[11px]">Fill Color:</span>
                    <input
                      type="color"
                      value={shapeFillColor}
                      onChange={(e) => setShapeFillColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-zinc-700"
                    />
                    <span className="font-mono text-[11px] text-zinc-400">{shapeFillColor}</span>
                  </div>
                )}
              </div>
            )}

            <div className="h-[1px] bg-zinc-800 my-1" />

            {/* Quick Canvas Actions */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Artboard Actions
              </span>
              <button
                onClick={onClearCanvas}
                className="w-full py-2 px-3 rounded bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/80 text-zinc-300 transition text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5"
              >
                Clear Active Layer
              </button>
              <button
                onClick={() => onFillCanvas(brushColor)}
                className="w-full py-2 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5"
              >
                Fill Active Layer with Foreground
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
