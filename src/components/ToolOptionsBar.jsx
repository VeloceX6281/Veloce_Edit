import React, { useState } from 'react';

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
  onToggleGuides,
  onCommitCrop,
  onCancelCrop
}) {
  // Photoshop Tool Options local states
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushMode, setBrushMode] = useState('normal');
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushFlow, setBrushFlow] = useState(100);
  const [autoSelectLayer, setAutoSelectLayer] = useState(true);
  const [showTransformControls, setShowTransformControls] = useState(true);
  const [marqueeFeather, setMarqueeFeather] = useState(0);
  const [marqueeStyle, setMarqueeStyle] = useState('normal');
  const [cropPreset, setCropPreset] = useState('original');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);

  return (
    <div className="h-[30px] bg-[#282828] border-b border-[#181818] px-2 flex items-center justify-between text-[11px] text-zinc-300 z-20 select-none font-sans overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-3">
        {/* Tool Icon / Name Badge */}
        <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1473e6]" />
          <span className="capitalize font-semibold text-zinc-100">
            {activeTool === 'select'
              ? 'Move'
              : activeTool.replace('marquee-', 'Marquee ').replace('shapes', 'Shape')}
          </span>
        </div>

        <div className="w-[1px] h-4 bg-[#3a3a3a]" />

        {/* 1. BRUSH & ERASER OPTIONS */}
        {(activeTool === 'brush' || activeTool === 'eraser') && (
          <div className="flex items-center gap-3">
            {/* Brush Tip Preview & Size Picker */}
            <div className="flex items-center gap-1.5 bg-[#202020] border border-[#383838] px-1.5 py-0.5 rounded-[2px]">
              <div
                className="w-4 h-4 rounded-full bg-zinc-400 flex items-center justify-center shrink-0 border border-zinc-600"
                style={{
                  transform: `scale(${Math.max(0.3, Math.min(1, brushSize / 40))})`
                }}
              />
              <span className="font-mono text-zinc-200 text-[10px] w-6">{brushSize}</span>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-16 accent-[#1473e6] cursor-pointer h-1 bg-[#3a3a3a] rounded"
                title={`Brush Size: ${brushSize}px`}
              />
              <span className="text-zinc-500 text-[10px]">px</span>
            </div>

            {/* Hardness */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Hardness:</span>
              <select
                value={brushHardness}
                onChange={(e) => setBrushHardness(Number(e.target.value))}
                className="bg-[#202020] text-zinc-200 border border-[#383838] px-1 py-0.5 rounded-[2px] cursor-pointer focus:outline-none"
              >
                <option value={100}>100%</option>
                <option value={80}>80%</option>
                <option value={50}>50%</option>
                <option value={0}>0% (Soft)</option>
              </select>
            </div>

            {/* Mode Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Mode:</span>
              <select
                value={brushMode}
                onChange={(e) => setBrushMode(e.target.value)}
                className="bg-[#202020] text-zinc-200 border border-[#383838] px-1 py-0.5 rounded-[2px] cursor-pointer focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
              </select>
            </div>

            {/* Opacity Input */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Opacity:</span>
              <div className="flex items-center bg-[#202020] border border-[#383838] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-7 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            {/* Flow Input */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Flow:</span>
              <div className="flex items-center bg-[#202020] border border-[#383838] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={brushFlow}
                  onChange={(e) => setBrushFlow(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-7 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            {/* Color Swatch Quick Preview */}
            {activeTool === 'brush' && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">Color:</span>
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"
                    title="Change Brush Color"
                  />
                  <div
                    className="w-4 h-4 rounded-[2px] border border-[#383838] shadow-sm"
                    style={{ backgroundColor: brushColor }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. MOVE / SELECT OPTIONS */}
        {activeTool === 'select' && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={autoSelectLayer}
                onChange={(e) => setAutoSelectLayer(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Auto-Select: Layer</span>
            </label>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={showTransformControls}
                onChange={(e) => setShowTransformControls(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Show Transform Controls</span>
            </label>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            {/* 6 Alignment Icons */}
            <div className="flex items-center gap-0.5 text-zinc-400">
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px]"
                title="Align Top Edges"
              >
                ⫠
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px]"
                title="Align Vertical Centers"
              >
                ╪
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px]"
                title="Align Bottom Edges"
              >
                ⫡
              </button>
              <div className="w-[1px] h-3 bg-[#3a3a3a] mx-0.5" />
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px]"
                title="Align Left Edges"
              >
                ⊢
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px]"
                title="Align Horizontal Centers"
              >
                ╫
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px]"
                title="Align Right Edges"
              >
                ⊣
              </button>
            </div>
          </div>
        )}

        {/* 3. MARQUEE OPTIONS */}
        {(activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse' || activeTool === 'marquee') && (
          <div className="flex items-center gap-3">
            {/* Shape Sub-tool Selector */}
            <div className="flex items-center bg-[#202020] border border-[#383838] rounded-[2px] p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setActiveTool('marquee-rect')}
                className={`px-2 py-0.5 rounded-[2px] transition ${
                  activeTool === 'marquee-rect' || activeTool === 'marquee'
                    ? 'bg-[#1473e6] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Rectangular
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('marquee-ellipse')}
                className={`px-2 py-0.5 rounded-[2px] transition ${
                  activeTool === 'marquee-ellipse'
                    ? 'bg-[#1473e6] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Elliptical
              </button>
            </div>

            {/* Feather */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Feather:</span>
              <div className="flex items-center bg-[#202020] border border-[#383838] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={marqueeFeather}
                  onChange={(e) => setMarqueeFeather(Math.max(0, Number(e.target.value)))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">px</span>
              </div>
            </div>

            {/* Style Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Style:</span>
              <select
                value={marqueeStyle}
                onChange={(e) => setMarqueeStyle(e.target.value)}
                className="bg-[#202020] text-zinc-200 border border-[#383838] px-1 py-0.5 rounded-[2px] cursor-pointer focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="fixed-ratio">Fixed Ratio</option>
                <option value="fixed-size">Fixed Size</option>
              </select>
            </div>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            <button
              type="button"
              onClick={onDeselectMarquee}
              disabled={!marqueeSelection}
              className={`px-2 py-0.5 rounded-[2px] border text-[10px] transition ${
                marqueeSelection
                  ? 'border-[#383838] bg-[#222] hover:bg-[#383838] text-zinc-200 cursor-pointer'
                  : 'border-[#262626] text-zinc-600 cursor-not-allowed'
              }`}
              title="Deselect Marquee (Ctrl+D)"
            >
              Deselect (Ctrl+D)
            </button>

            <button
              type="button"
              onClick={onInvertMarquee}
              disabled={!marqueeSelection}
              className={`px-2 py-0.5 rounded-[2px] border text-[10px] transition ${
                marqueeSelection
                  ? 'border-[#383838] bg-[#222] hover:bg-[#383838] text-zinc-200 cursor-pointer'
                  : 'border-[#262626] text-zinc-600 cursor-not-allowed'
              }`}
              title="Inverse Selection (Ctrl+Shift+I)"
            >
              Inverse (Ctrl+Shift+I)
            </button>
          </div>
        )}

        {/* 4. CROP OPTIONS */}
        {activeTool === 'crop' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Ratio:</span>
              <select
                value={cropPreset}
                onChange={(e) => setCropPreset(e.target.value)}
                className="bg-[#202020] text-zinc-200 border border-[#383838] px-2 py-0.5 rounded-[2px] cursor-pointer focus:outline-none"
              >
                <option value="original">Original Ratio</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="freeform">Freeform</option>
              </select>
            </div>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            {/* Commit Checkmark & Cancel Cross Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCommitCrop}
                className="px-2 py-0.5 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white flex items-center gap-1 font-medium transition"
                title="Commit Current Crop (Enter)"
              >
                <span>✓</span>
                <span>Commit</span>
              </button>

              <button
                type="button"
                onClick={onCancelCrop}
                className="px-2 py-0.5 rounded-[2px] bg-[#222] hover:bg-[#383838] text-zinc-300 border border-[#383838] flex items-center gap-1 transition"
                title="Cancel Crop (Esc)"
              >
                <span>✕</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. TEXT OPTIONS */}
        {activeTool === 'text' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Font:</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="bg-[#202020] text-zinc-200 border border-[#383838] px-1.5 py-0.5 rounded-[2px] cursor-pointer focus:outline-none"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Impact">Impact</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Size:</span>
              <div className="flex items-center bg-[#202020] border border-[#383838] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="8"
                  max="144"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-8 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">pt</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Color:</span>
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"
                  title="Text Color"
                />
                <div
                  className="w-4 h-4 rounded-[2px] border border-[#383838]"
                  style={{ backgroundColor: brushColor }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. SHAPES OPTIONS */}
        {(activeTool === 'rectangle' || activeTool === 'shapes' || activeTool === 'circle') && (
          <div className="flex items-center gap-3">
            {/* Shape Sub-tool Selector */}
            <div className="flex items-center bg-[#202020] border border-[#383838] rounded-[2px] p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setActiveTool('rectangle')}
                className={`px-2 py-0.5 rounded-[2px] transition ${
                  activeTool === 'rectangle' || activeTool === 'shapes'
                    ? 'bg-[#1473e6] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Rectangle
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('circle')}
                className={`px-2 py-0.5 rounded-[2px] transition ${
                  activeTool === 'circle'
                    ? 'bg-[#1473e6] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ellipse
              </button>
            </div>

            {/* Stroke Width */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Stroke:</span>
              <div className="flex items-center bg-[#202020] border border-[#383838] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Math.max(1, Number(e.target.value)))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">px</span>
              </div>
            </div>

            {/* Stroke Color */}
            <div className="flex items-center gap-1">
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"
                  title="Stroke Color"
                />
                <div
                  className="w-4 h-4 rounded-[2px] border border-[#383838]"
                  style={{ backgroundColor: brushColor }}
                />
              </div>
            </div>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            {/* Fill Toggle & Swatch */}
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={shapeFillEnabled}
                onChange={(e) => setShapeFillEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Fill</span>
            </label>

            {shapeFillEnabled && (
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={shapeFillColor}
                  onChange={(e) => setShapeFillColor(e.target.value)}
                  className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"
                  title="Shape Fill Color"
                />
                <div
                  className="w-4 h-4 rounded-[2px] border border-[#383838]"
                  style={{ backgroundColor: shapeFillColor }}
                />
              </div>
            )}
          </div>
        )}

        {/* 7. HAND & ZOOM OPTIONS */}
        {(activeTool === 'hand' || activeTool === 'zoom') && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFitToScreen}
              className="px-2 py-0.5 rounded-[2px] bg-[#202020] hover:bg-[#383838] border border-[#383838] text-[#31a8ff] transition"
            >
              Fit on Screen (Ctrl+0)
            </button>
            <button
              type="button"
              onClick={() => onFitToScreen && onFitToScreen()}
              className="px-2 py-0.5 rounded-[2px] bg-[#202020] hover:bg-[#383838] border border-[#383838] text-zinc-200 transition"
            >
              100% (Ctrl+1)
            </button>
          </div>
        )}
      </div>

      {/* Right Quick Toggles: Rulers & Guides */}
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 shrink-0">
        <button
          type="button"
          onClick={onToggleRulers}
          className={`px-1.5 py-0.5 rounded-[2px] border transition flex items-center gap-1 ${
            showRulers
              ? 'border-[#1473e6] bg-[#1473e6]/20 text-[#31a8ff] font-medium'
              : 'border-[#383838] bg-[#222] text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle Pixel Rulers (Ctrl+R)"
        >
          {showRulers && <span>✓</span>}
          <span>Rulers</span>
        </button>

        <button
          type="button"
          onClick={onToggleGuides}
          className={`px-1.5 py-0.5 rounded-[2px] border transition flex items-center gap-1 ${
            showGuides
              ? 'border-[#00e5ff] bg-[#00e5ff]/20 text-[#00e5ff] font-medium'
              : 'border-[#383838] bg-[#222] text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle Alignment Guides (Ctrl+;)"
        >
          {showGuides && <span>✓</span>}
          <span>Guides</span>
        </button>
      </div>
    </div>
  );
}
