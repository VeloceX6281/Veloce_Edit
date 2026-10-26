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
  onCancelCrop,
  // Auto-Select & Transform Controls props
  autoSelectLayer = true,
  setAutoSelectLayer,
  showTransformControls = true,
  setShowTransformControls,
  // Retouching props
  brushHardness = 100,
  setBrushHardness,
  brushOpacity = 100,
  setBrushOpacity,
  brushFlow = 100,
  setBrushFlow,
  cloneSampleMode = 'current',
  setCloneSampleMode,
  wandTolerance = 32,
  setWandTolerance,
  wandContiguous = true,
  setWandContiguous,
  // Text Options props
  fontFamily = 'Arial',
  setFontFamily,
  fontSize = 28,
  setFontSize,
  fontStyle = 'Regular',
  setFontStyle,
  textAlign = 'left',
  setTextAlign,
  // Gradient props
  gradientStyle = 'linear',
  setGradientStyle,
  gradientBlendMode = 'normal',
  setGradientBlendMode,
  gradientOpacity = 100,
  setGradientOpacity,
  gradientReverse = false,
  setGradientReverse,
  foregroundColor = '#000000',
  backgroundColor = '#ffffff',
  // Dodge, Burn & Sponge props
  dodgeBurnRange = 'midtones',
  setDodgeBurnRange,
  dodgeBurnExposure = 50,
  setDodgeBurnExposure,
  spongeMode = 'desaturate',
  setSpongeMode,
  spongeFlow = 50,
  setSpongeFlow,
  // Polygonal Lasso props
  polyPointsCount = 0,
  onClosePolygonalLasso,
  onCancelPolygonalLasso
}) {
  // Local fallback states if not controlled
  const [localHardness, setLocalHardness] = useState(100);
  const [localOpacity, setLocalOpacity] = useState(100);
  const [localFlow, setLocalFlow] = useState(100);
  const [localBrushMode, setLocalBrushMode] = useState('normal');
  const [localAutoSelect, setLocalAutoSelect] = useState(true);
  const [localShowTransform, setLocalShowTransform] = useState(true);
  const [localCropPreset, setLocalCropPreset] = useState('original');
  const [localTolerance, setLocalTolerance] = useState(32);
  const [localContiguous, setLocalContiguous] = useState(true);
  const [localCloneSample, setLocalCloneSample] = useState('current');
  const [localFontFamily, setLocalFontFamily] = useState('Arial');
  const [localFontSize, setLocalFontSize] = useState(28);
  const [localFontStyle, setLocalFontStyle] = useState('Regular');
  const [localTextAlign, setLocalTextAlign] = useState('left');

  const curAutoSelect = setAutoSelectLayer ? autoSelectLayer : localAutoSelect;
  const toggleAutoSelect = (val) => (setAutoSelectLayer ? setAutoSelectLayer(val) : setLocalAutoSelect(val));

  const curTransformControls = setShowTransformControls ? showTransformControls : localShowTransform;
  const toggleTransformControls = (val) => (setShowTransformControls ? setShowTransformControls(val) : setLocalShowTransform(val));

  const curHardness = setBrushHardness ? brushHardness : localHardness;
  const changeHardness = (val) => (setBrushHardness ? setBrushHardness(val) : setLocalHardness(val));

  const curOpacity = setBrushOpacity ? brushOpacity : localOpacity;
  const changeOpacity = (val) => (setBrushOpacity ? setBrushOpacity(val) : setLocalOpacity(val));

  const curFlow = setBrushFlow ? brushFlow : localFlow;
  const changeFlow = (val) => (setBrushFlow ? setBrushFlow(val) : setLocalFlow(val));

  const curTolerance = setWandTolerance ? wandTolerance : localTolerance;
  const changeTolerance = (val) => (setWandTolerance ? setWandTolerance(val) : setLocalTolerance(val));

  const curContiguous = setWandContiguous ? wandContiguous : localContiguous;
  const changeContiguous = (val) => (setWandContiguous ? setWandContiguous(val) : setLocalContiguous(val));

  const curCloneSample = setCloneSampleMode ? cloneSampleMode : localCloneSample;
  const changeCloneSample = (val) => (setCloneSampleMode ? setCloneSampleMode(val) : setLocalCloneSample(val));

  const curFontFamily = setFontFamily ? fontFamily : localFontFamily;
  const changeFontFamily = (val) => (setFontFamily ? setFontFamily(val) : setLocalFontFamily(val));

  const curFontSize = setFontSize ? fontSize : localFontSize;
  const changeFontSize = (val) => (setFontSize ? setFontSize(val) : setLocalFontSize(val));

  const curFontStyle = setFontStyle ? fontStyle : localFontStyle;
  const changeFontStyle = (val) => (setFontStyle ? setFontStyle(val) : setLocalFontStyle(val));

  const curTextAlign = setTextAlign ? textAlign : localTextAlign;
  const changeTextAlign = (val) => (setTextAlign ? setTextAlign(val) : setLocalTextAlign(val));

  // Compute gradient preview CSS
  const gradLeft = gradientReverse ? backgroundColor : foregroundColor;
  const gradRight = gradientReverse ? foregroundColor : backgroundColor;

  const toolDisplayNames = {
    select: 'Move',
    magic_wand: 'Magic Wand',
    clone: 'Clone Stamp',
    gradient: 'Gradient Tool',
    bucket: 'Paint Bucket',
    dodge: 'Dodge Tool',
    burn: 'Burn Tool',
    sponge: 'Sponge Tool',
    polygonal_lasso: 'Polygonal Lasso',
    lasso: 'Lasso',
    brush: 'Brush',
    eraser: 'Eraser',
    crop: 'Crop',
    text: 'Type',
    shapes: 'Shape',
    rectangle: 'Rectangle',
    circle: 'Ellipse',
    hand: 'Hand',
    zoom: 'Zoom',
    eyedropper: 'Eyedropper'
  };

  return (
    <div className="h-[30px] bg-[#282828] border-b border-[#181818] px-2 flex items-center justify-between text-[11px] text-zinc-300 z-20 select-none font-sans overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
      <div className="flex items-center gap-2.5">
        {/* Tool Name Badge */}
        <div className="flex items-center gap-1.5 text-zinc-200 font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1473e6]" />
          <span className="capitalize font-semibold text-zinc-100">
            {toolDisplayNames[activeTool] || activeTool.replace('marquee-', 'Marquee ')}
          </span>
        </div>

        <div className="w-[1px] h-3.5 bg-[#3a3a3a] shrink-0" />

        {/* 1. MOVE TOOL OPTIONS */}
        {activeTool === 'select' && (
          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1 cursor-pointer text-zinc-300 hover:text-white">
              <input
                type="checkbox"
                checked={curAutoSelect}
                onChange={(e) => toggleAutoSelect(e.target.checked)}
                className="w-3 h-3 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Auto-Select: Layer</span>
            </label>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            <label className="flex items-center gap-1 cursor-pointer text-zinc-300 hover:text-white">
              <input
                type="checkbox"
                checked={curTransformControls}
                onChange={(e) => toggleTransformControls(e.target.checked)}
                className="w-3 h-3 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Show Transform Controls</span>
            </label>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            {/* Photoshop Alignment Buttons */}
            <div className="flex items-center gap-0.5 text-zinc-400">
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px] text-xs"
                title="Align Top Edges"
              >
                ⫠
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px] text-xs"
                title="Align Vertical Centers"
              >
                ╪
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px] text-xs"
                title="Align Bottom Edges"
              >
                ⫡
              </button>
              <div className="w-[1px] h-3 bg-[#3a3a3a] mx-0.5" />
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px] text-xs"
                title="Align Left Edges"
              >
                ⊢
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px] text-xs"
                title="Align Horizontal Centers"
              >
                ╫
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#383838] hover:text-white rounded-[2px] text-xs"
                title="Align Right Edges"
              >
                ⊣
              </button>
            </div>
          </div>
        )}

        {/* 2. BRUSH & ERASER OPTIONS */}
        {(activeTool === 'brush' || activeTool === 'eraser') && (
          <div className="flex items-center gap-2.5">
            {/* Brush Tip Preview & Size Picker */}
            <div className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px]">
              <div
                className="w-3.5 h-3.5 rounded-full bg-zinc-300 flex items-center justify-center shrink-0 border border-zinc-600"
                style={{
                  transform: `scale(${Math.max(0.3, Math.min(1, brushSize / 40))})`
                }}
              />
              <span className="font-mono text-zinc-200 text-[10px] w-5 text-right">{brushSize}</span>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-14 accent-[#1473e6] cursor-pointer h-1 bg-[#3a3a3a] rounded"
                title={`Brush Size: ${brushSize}px`}
              />
              <span className="text-zinc-500 text-[10px]">px</span>
            </div>

            {/* Hardness */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Hardness:</span>
              <select
                value={curHardness}
                onChange={(e) => changeHardness(Number(e.target.value))}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
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
                value={localBrushMode}
                onChange={(e) => setLocalBrushMode(e.target.value)}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
              </select>
            </div>

            {/* Opacity Input */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Opacity:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={curOpacity}
                  onChange={(e) => changeOpacity(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            {/* Flow Input */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Flow:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={curFlow}
                  onChange={(e) => changeFlow(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            {/* Color Swatch */}
            {activeTool === 'brush' && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">Color:</span>
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-4 h-4 opacity-0 absolute inset-0 cursor-pointer"
                    title="Change Brush Color"
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-[1px] border border-[#3a3a3a]"
                    style={{ backgroundColor: brushColor }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. GRADIENT TOOL OPTIONS */}
        {activeTool === 'gradient' && (
          <div className="flex items-center gap-2.5">
            {/* Gradient Preview Bar */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-16 h-4 rounded-[2px] border border-[#3a3a3a] shadow-inner"
                style={{
                  background: `linear-gradient(to right, ${gradLeft}, ${gradRight})`
                }}
                title={`Gradient: ${gradLeft} -> ${gradRight}`}
              />
            </div>

            {/* Style: Linear vs Radial */}
            <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] rounded-[2px] p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setGradientStyle && setGradientStyle('linear')}
                className={`px-1.5 py-0.5 rounded-[2px] transition flex items-center gap-1 ${
                  gradientStyle === 'linear'
                    ? 'bg-[#1473e6] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Linear Gradient"
              >
                <span>Linear</span>
              </button>
              <button
                type="button"
                onClick={() => setGradientStyle && setGradientStyle('radial')}
                className={`px-1.5 py-0.5 rounded-[2px] transition flex items-center gap-1 ${
                  gradientStyle === 'radial'
                    ? 'bg-[#1473e6] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Radial Gradient"
              >
                <span>Radial</span>
              </button>
            </div>

            {/* Mode Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Mode:</span>
              <select
                value={gradientBlendMode}
                onChange={(e) => setGradientBlendMode && setGradientBlendMode(e.target.value)}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
              </select>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Opacity:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={gradientOpacity}
                  onChange={(e) => setGradientOpacity && setGradientOpacity(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            {/* Reverse Checkbox */}
            <label className="flex items-center gap-1 cursor-pointer text-zinc-300 hover:text-white">
              <input
                type="checkbox"
                checked={gradientReverse}
                onChange={(e) => setGradientReverse && setGradientReverse(e.target.checked)}
                className="w-3 h-3 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Reverse</span>
            </label>

            <span className="text-[#888] text-[10px] italic">Drag on canvas to draw gradient</span>
          </div>
        )}

        {/* 4. DODGE & BURN OPTIONS */}
        {(activeTool === 'dodge' || activeTool === 'burn') && (
          <div className="flex items-center gap-2.5">
            {/* Brush Size */}
            <div className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px]">
              <span className="text-zinc-400">Size:</span>
              <span className="font-mono text-zinc-200 text-[10px] w-5 text-right">{brushSize}</span>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-14 accent-[#1473e6] cursor-pointer h-1 bg-[#3a3a3a] rounded"
                title={`Size: ${brushSize}px`}
              />
              <span className="text-zinc-500 text-[10px]">px</span>
            </div>

            {/* Range: Shadows, Midtones, Highlights */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Range:</span>
              <select
                value={dodgeBurnRange}
                onChange={(e) => setDodgeBurnRange && setDodgeBurnRange(e.target.value)}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
              >
                <option value="shadows">Shadows</option>
                <option value="midtones">Midtones</option>
                <option value="highlights">Highlights</option>
              </select>
            </div>

            {/* Exposure */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Exposure:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={dodgeBurnExposure}
                  onChange={(e) => setDodgeBurnExposure && setDodgeBurnExposure(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            <span className="text-[#888] text-[10px] italic">
              {activeTool === 'dodge' ? 'Lightens pixels on stroke' : 'Darkens pixels on stroke'}
            </span>
          </div>
        )}

        {/* 5. SPONGE OPTIONS */}
        {activeTool === 'sponge' && (
          <div className="flex items-center gap-2.5">
            {/* Brush Size */}
            <div className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px]">
              <span className="text-zinc-400">Size:</span>
              <span className="font-mono text-zinc-200 text-[10px] w-5 text-right">{brushSize}</span>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-14 accent-[#1473e6] cursor-pointer h-1 bg-[#3a3a3a] rounded"
                title={`Size: ${brushSize}px`}
              />
              <span className="text-zinc-500 text-[10px]">px</span>
            </div>

            {/* Mode: Desaturate / Saturate */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Mode:</span>
              <select
                value={spongeMode}
                onChange={(e) => setSpongeMode && setSpongeMode(e.target.value)}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
              >
                <option value="desaturate">Desaturate</option>
                <option value="saturate">Saturate</option>
              </select>
            </div>

            {/* Flow */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Flow:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={spongeFlow}
                  onChange={(e) => setSpongeFlow && setSpongeFlow(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            <span className="text-[#888] text-[10px] italic">
              {spongeMode === 'saturate' ? 'Increases saturation under stroke' : 'Decreases saturation under stroke'}
            </span>
          </div>
        )}

        {/* 6. CLONE STAMP OPTIONS */}
        {activeTool === 'clone' && (
          <div className="flex items-center gap-2.5">
            {/* Size Picker */}
            <div className="flex items-center gap-1 bg-[#1c1c1c] border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px]">
              <span className="text-zinc-400">Size:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Math.max(1, Number(e.target.value)))}
                className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
              />
              <span className="text-zinc-500 text-[10px]">px</span>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Opacity:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={curOpacity}
                  onChange={(e) => changeOpacity(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            {/* Flow */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Flow:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={curFlow}
                  onChange={(e) => changeFlow(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
              </div>
            </div>

            {/* Sample Mode */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Sample:</span>
              <select
                value={curCloneSample}
                onChange={(e) => changeCloneSample(e.target.value)}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
              >
                <option value="current">Current Layer</option>
                <option value="all">All Layers</option>
              </select>
            </div>

            <span className="text-[#888] text-[10px] italic">Alt+Click to set source anchor</span>
          </div>
        )}

        {/* 7. MAGIC WAND OPTIONS */}
        {activeTool === 'magic_wand' && (
          <div className="flex items-center gap-2.5">
            {/* Tolerance Input */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Tolerance:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={curTolerance}
                  onChange={(e) => changeTolerance(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-6 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
              </div>
            </div>

            {/* Contiguous Checkbox */}
            <label className="flex items-center gap-1 cursor-pointer text-zinc-300 hover:text-white">
              <input
                type="checkbox"
                checked={curContiguous}
                onChange={(e) => changeContiguous(e.target.checked)}
                className="w-3 h-3 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Contiguous</span>
            </label>

            {/* Anti-alias Checkbox */}
            <label className="flex items-center gap-1 cursor-pointer text-zinc-300 hover:text-white">
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-3 h-3 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Anti-alias</span>
            </label>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            <button
              type="button"
              onClick={onDeselectMarquee}
              disabled={!marqueeSelection}
              className={`px-2 py-0.5 rounded-[2px] border text-[10px] transition ${
                marqueeSelection
                  ? 'border-[#3a3a3a] bg-[#1c1c1c] hover:bg-[#383838] text-zinc-200 cursor-pointer'
                  : 'border-[#262626] text-zinc-600 cursor-not-allowed'
              }`}
              title="Deselect (Ctrl+D)"
            >
              Deselect (Ctrl+D)
            </button>
          </div>
        )}

        {/* 8. CROP OPTIONS */}
        {activeTool === 'crop' && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Ratio:</span>
              <select
                value={localCropPreset}
                onChange={(e) => setLocalCropPreset(e.target.value)}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-2 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
              >
                <option value="original">Original Ratio</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="freeform">Freeform</option>
              </select>
            </div>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCommitCrop}
                className="px-2 py-0.5 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white flex items-center gap-1 font-medium transition"
                title="Commit Current Crop (Enter)"
              >
                <span>✔</span>
                <span>Commit</span>
              </button>

              <button
                type="button"
                onClick={onCancelCrop}
                className="px-2 py-0.5 rounded-[2px] bg-[#1c1c1c] hover:bg-[#383838] text-zinc-300 border border-[#3a3a3a] flex items-center gap-1 transition"
                title="Cancel Crop (Esc)"
              >
                <span>✖</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* 9. TEXT OPTIONS */}
        {activeTool === 'text' && (
          <div className="flex items-center gap-2.5">
            {/* Font Family */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Font:</span>
              <select
                value={curFontFamily}
                onChange={(e) => changeFontFamily(e.target.value)}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Impact">Impact</option>
              </select>
            </div>

            {/* Font Style */}
            <div className="flex items-center gap-1">
              <select
                value={curFontStyle}
                onChange={(e) => changeFontStyle(e.target.value)}
                className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px]"
              >
                <option value="Regular">Regular</option>
                <option value="Bold">Bold</option>
                <option value="Italic">Italic</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Size:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
                <input
                  type="number"
                  min="8"
                  max="144"
                  value={curFontSize}
                  onChange={(e) => changeFontSize(Number(e.target.value))}
                  className="w-7 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
                />
                <span className="text-zinc-500 text-[10px] ml-0.5">pt</span>
              </div>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center gap-0.5 bg-[#1c1c1c] border border-[#3a3a3a] rounded-[2px] p-0.5">
              <button
                type="button"
                onClick={() => changeTextAlign('left')}
                className={`px-1.5 py-0.5 rounded-[1px] ${
                  curTextAlign === 'left' ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Align Left"
              >
                Left
              </button>
              <button
                type="button"
                onClick={() => changeTextAlign('center')}
                className={`px-1.5 py-0.5 rounded-[1px] ${
                  curTextAlign === 'center' ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Align Center"
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => changeTextAlign('right')}
                className={`px-1.5 py-0.5 rounded-[1px] ${
                  curTextAlign === 'right' ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Align Right"
              >
                Right
              </button>
            </div>

            {/* Color Swatch */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Color:</span>
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-4 h-4 opacity-0 absolute inset-0 cursor-pointer"
                  title="Text Color"
                />
                <div
                  className="w-3.5 h-3.5 rounded-[1px] border border-[#3a3a3a]"
                  style={{ backgroundColor: brushColor }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 10. MARQUEE & LASSO OPTIONS */}
        {(activeTool === 'marquee-rect' || activeTool === 'marquee-ellipse' || activeTool === 'marquee' || activeTool === 'lasso' || activeTool === 'polygonal_lasso') && (
          <div className="flex items-center gap-2.5">
            {activeTool !== 'lasso' && activeTool !== 'polygonal_lasso' && (
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] rounded-[2px] p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTool('marquee-rect')}
                  className={`px-1.5 py-0.5 rounded-[2px] transition ${
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
                  className={`px-1.5 py-0.5 rounded-[2px] transition ${
                    activeTool === 'marquee-ellipse'
                      ? 'bg-[#1473e6] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Elliptical
                </button>
              </div>
            )}

            {/* Polygonal Lasso Specific Helpers */}
            {activeTool === 'polygonal_lasso' && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">
                  {polyPointsCount > 0 ? (
                    <span className="text-cyan-400 font-mono font-medium">{polyPointsCount} points placed</span>
                  ) : (
                    'Click to add vertices. Enter / Double-click to close'
                  )}
                </span>
                {polyPointsCount >= 3 && (
                  <button
                    type="button"
                    onClick={onClosePolygonalLasso}
                    className="px-2 py-0.5 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white font-medium text-[10px] transition"
                    title="Close Polygon and create selection (Enter)"
                  >
                    Close Polygon (Enter)
                  </button>
                )}
                {polyPointsCount > 0 && (
                  <button
                    type="button"
                    onClick={onCancelPolygonalLasso}
                    className="px-1.5 py-0.5 rounded-[2px] bg-[#1c1c1c] hover:bg-[#383838] border border-[#3a3a3a] text-zinc-300 text-[10px] transition"
                    title="Cancel current polygon (Esc)"
                  >
                    Cancel (Esc)
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onDeselectMarquee}
              disabled={!marqueeSelection}
              className={`px-2 py-0.5 rounded-[2px] border text-[10px] transition ${
                marqueeSelection
                  ? 'border-[#3a3a3a] bg-[#1c1c1c] hover:bg-[#383838] text-zinc-200 cursor-pointer'
                  : 'border-[#262626] text-zinc-600 cursor-not-allowed'
              }`}
              title="Deselect (Ctrl+D)"
            >
              Deselect (Ctrl+D)
            </button>

            <button
              type="button"
              onClick={onInvertMarquee}
              disabled={!marqueeSelection}
              className={`px-2 py-0.5 rounded-[2px] border text-[10px] transition ${
                marqueeSelection
                  ? 'border-[#3a3a3a] bg-[#1c1c1c] hover:bg-[#383838] text-zinc-200 cursor-pointer'
                  : 'border-[#262626] text-zinc-600 cursor-not-allowed'
              }`}
              title="Inverse Selection (Ctrl+Shift+I)"
            >
              Inverse (Ctrl+Shift+I)
            </button>
          </div>
        )}

        {/* 11. SHAPES OPTIONS */}
        {(activeTool === 'rectangle' || activeTool === 'shapes' || activeTool === 'circle') && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] rounded-[2px] p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setActiveTool('rectangle')}
                className={`px-1.5 py-0.5 rounded-[2px] transition ${
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
                className={`px-1.5 py-0.5 rounded-[2px] transition ${
                  activeTool === 'circle'
                    ? 'bg-[#1473e6] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ellipse
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Stroke:</span>
              <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
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

            <div className="flex items-center gap-1">
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-4 h-4 opacity-0 absolute inset-0 cursor-pointer"
                  title="Stroke Color"
                />
                <div
                  className="w-3.5 h-3.5 rounded-[1px] border border-[#3a3a3a]"
                  style={{ backgroundColor: brushColor }}
                />
              </div>
            </div>

            <div className="w-[1px] h-3 bg-[#3a3a3a]" />

            <label className="flex items-center gap-1 cursor-pointer text-zinc-300 hover:text-white">
              <input
                type="checkbox"
                checked={shapeFillEnabled}
                onChange={(e) => setShapeFillEnabled(e.target.checked)}
                className="w-3 h-3 rounded-[2px] accent-[#1473e6] cursor-pointer"
              />
              <span>Fill</span>
            </label>

            {shapeFillEnabled && (
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={shapeFillColor}
                  onChange={(e) => setShapeFillColor(e.target.value)}
                  className="w-4 h-4 opacity-0 absolute inset-0 cursor-pointer"
                  title="Shape Fill Color"
                />
                <div
                  className="w-3.5 h-3.5 rounded-[1px] border border-[#3a3a3a]"
                  style={{ backgroundColor: shapeFillColor }}
                />
              </div>
            )}
          </div>
        )}

        {/* 12. EYEDROPPER OPTIONS */}
        {activeTool === 'eyedropper' && (
          <div className="flex items-center gap-2.5">
            <span className="text-zinc-400">Sample Size:</span>
            <span className="text-zinc-200 bg-[#1c1c1c] border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px]">Point Sample (9×9 Loupe)</span>
            <span className="text-zinc-500 text-[10px]">Click anywhere to sample color</span>
          </div>
        )}

        {/* 13. HAND & ZOOM OPTIONS */}
        {(activeTool === 'hand' || activeTool === 'zoom') && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFitToScreen}
              className="px-2 py-0.5 rounded-[2px] bg-[#1c1c1c] hover:bg-[#383838] border border-[#3a3a3a] text-[#31a8ff] transition"
            >
              Fit on Screen (Ctrl+0)
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
              : 'border-[#3a3a3a] bg-[#1c1c1c] text-zinc-400 hover:text-zinc-200'
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
              : 'border-[#3a3a3a] bg-[#1c1c1c] text-zinc-400 hover:text-zinc-200'
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
