import React from 'react';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#18181b', // Black / Dark
  '#ffffff'  // White
];

export default function ToolOptionsBar({
  activeTool,
  setActiveTool,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  shapeFillEnabled,
  setShapeFillEnabled,
  shapeFillColor,
  setShapeFillColor,
  onFitToScreen,
  marqueeSelection,
  onDeselectMarquee,
  onInvertMarquee,
  showRulers,
  onToggleRulers,
  showGuides,
  onToggleGuides
}) {
  return (
    <div className="h-10 bg-[#161820] border-b border-zinc-800/90 px-4 flex items-center justify-between text-xs text-zinc-300 z-10 select-none">
      <div className="flex items-center gap-4">
        {/* Tool Badge */}
        <div className="flex items-center gap-1.5 font-medium text-zinc-200">
          <span className="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Tool:</span>
          <span className="capitalize">{activeTool.replace('marquee-', '')}</span>
        </div>

        <div className="w-[1px] h-4 bg-zinc-800" />

        {/* Marquee Selection Tool Options */}
        {(activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse') && (
          <div className="flex items-center gap-3 text-zinc-300 text-[11px]">
            {/* Shape Sub-tool Selector */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded p-0.5">
              <button
                type="button"
                onClick={() => setActiveTool('marquee-rect')}
                className={`px-2 py-0.5 rounded transition ${
                  activeTool === 'marquee-rect'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Rectangle
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('marquee-ellipse')}
                className={`px-2 py-0.5 rounded transition ${
                  activeTool === 'marquee-ellipse'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ellipse
              </button>
            </div>

            <div className="w-[1px] h-4 bg-zinc-800" />

            <button
              onClick={onDeselectMarquee}
              disabled={!marqueeSelection}
              className={`px-2 py-1 rounded border text-[11px] transition ${
                marqueeSelection
                  ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer'
                  : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
              title="Deselect Marquee (Ctrl+D)"
            >
              Deselect (Ctrl+D)
            </button>

            <button
              onClick={onInvertMarquee}
              disabled={!marqueeSelection}
              className={`px-2 py-1 rounded border text-[11px] transition ${
                marqueeSelection
                  ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer'
                  : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
              title="Invert Selection (Ctrl+Shift+I)"
            >
              Invert (Ctrl+Shift+I)
            </button>

            <span className="text-[10px] text-indigo-400">
              {marqueeSelection ? 'Active Marching Ants' : 'Drag to select area'}
            </span>
          </div>
        )}

        {/* Move & Free Transform Tool Options */}
        {activeTool === 'select' && (
          <div className="flex items-center gap-3 text-zinc-300 text-[11px]">
            <span>
              Drag bounding box to move active layer content. Use 8 handles to scale (Shift locks ratio).
            </span>
            <div className="w-[1px] h-4 bg-zinc-800" />
            <span className="text-indigo-400 font-medium">Enter to Apply • Esc to Cancel</span>
          </div>
        )}

        {/* Crop Tool Options */}
        {activeTool === 'crop' && (
          <div className="flex items-center gap-3 text-zinc-300 text-[11px]">
            <span>
              Drag handles to adjust crop box. Double-click or press Enter to crop all layers.
            </span>
            <div className="w-[1px] h-4 bg-zinc-800" />
            <span className="text-emerald-400 font-medium">Enter to Crop • Esc to Cancel</span>
          </div>
        )}

        {/* Hand Tool Options */}
        {activeTool === 'hand' && (
          <div className="flex items-center gap-3 text-zinc-300 text-[11px]">
            <span>Click & drag to pan the canvas artboard.</span>
            <div className="w-[1px] h-4 bg-zinc-800" />
            <button
              onClick={onFitToScreen}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-indigo-400 border border-zinc-700 transition"
            >
              Fit to Screen
            </button>
          </div>
        )}

        {/* Brush & Eraser Options */}
        {(activeTool === 'brush' || activeTool === 'eraser') && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-[11px]">Size:</span>
              <input
                type="range"
                min="1"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-28 accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
              />
              <span className="w-8 font-mono text-[11px] text-zinc-200 text-right">{brushSize}px</span>
            </div>

            {activeTool === 'brush' && (
              <>
                <div className="w-[1px] h-4 bg-zinc-800" />
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-[11px]">Color:</span>
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                      title="Brush Color"
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-zinc-600 shadow-sm transition hover:scale-110"
                      style={{ backgroundColor: brushColor }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-zinc-400">{brushColor.toUpperCase()}</span>
                </div>

                {/* Preset Swatches */}
                <div className="flex items-center gap-1 ml-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrushColor(c)}
                      className={`w-4 h-4 rounded-full border transition hover:scale-125 ${
                        brushColor.toLowerCase() === c.toLowerCase()
                          ? 'border-indigo-400 scale-110 shadow-sm'
                          : 'border-zinc-700'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Select ${c}`}
                    />
                  ))}
                </div>
              </>
            )}

            {activeTool === 'eraser' && (
              <span className="text-[11px] text-zinc-400 italic">
                Cleanly erases strokes from active layer
              </span>
            )}
          </div>
        )}

        {/* Shape Options (Rectangle & Circle) */}
        {(activeTool === 'rectangle' || activeTool === 'shapes' || activeTool === 'circle') && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-[11px]">Stroke:</span>
              <input
                type="range"
                min="1"
                max="40"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
              />
              <span className="w-7 font-mono text-[11px] text-zinc-200 text-right">{brushSize}px</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-[11px]">Border Color:</span>
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                  title="Stroke Color"
                />
                <div
                  className="w-5 h-5 rounded border border-zinc-600 shadow-sm"
                  style={{ backgroundColor: brushColor }}
                />
              </div>
            </div>

            <div className="w-[1px] h-4 bg-zinc-800" />

            {/* Shape Fill Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-300">
              <input
                type="checkbox"
                checked={shapeFillEnabled}
                onChange={(e) => setShapeFillEnabled(e.target.checked)}
                className="rounded accent-indigo-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Fill Shape</span>
            </label>

            {shapeFillEnabled && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 text-[11px]">Fill:</span>
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={shapeFillColor}
                    onChange={(e) => setShapeFillColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                    title="Fill Color"
                  />
                  <div
                    className="w-5 h-5 rounded border border-zinc-600 shadow-sm"
                    style={{ backgroundColor: shapeFillColor }}
                  />
                </div>
              </div>
            )}

            <div className="w-[1px] h-4 bg-zinc-800" />

            <span className="text-[11px] text-indigo-400 font-medium">
              Tip: Hold Shift for 1:1 Aspect Ratio
            </span>
          </div>
        )}

        {/* Text Tool Options */}
        {activeTool === 'text' && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-300">
              Click anywhere on the canvas to place text on the active layer.
            </span>
            <div className="w-[1px] h-4 bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-[11px]">Default Color:</span>
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                  title="Text Default Color"
                />
                <div
                  className="w-4 h-4 rounded border border-zinc-600 shadow-sm"
                  style={{ backgroundColor: brushColor }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Paint Bucket Options */}
        {activeTool === 'bucket' && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400">Fill Color:</span>
            <div className="relative flex items-center">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                title="Canvas Fill Color"
              />
              <div
                className="w-5 h-5 rounded border border-zinc-600 shadow-sm"
                style={{ backgroundColor: brushColor }}
              />
            </div>
            <span className="text-[11px] text-zinc-400">Click canvas to fill active layer</span>
          </div>
        )}
      </div>

      {/* Right Quick Toggles: Rulers & Guides */}
      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
        <button
          onClick={onToggleRulers}
          className={`px-1.5 py-0.5 rounded transition ${
            showRulers ? 'text-indigo-400 bg-zinc-800 font-medium' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle Pixel Rulers (Ctrl+R)"
        >
          Rulers
        </button>
        <button
          onClick={onToggleGuides}
          className={`px-1.5 py-0.5 rounded transition ${
            showGuides ? 'text-cyan-400 bg-zinc-800 font-medium' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle Guides (Ctrl+;)"
        >
          Guides
        </button>
      </div>
    </div>
  );
}
