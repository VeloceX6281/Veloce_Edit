import React, { useState, useRef, useEffect } from 'react';
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
  onToggleClippingMask,
  onMergeDown,
  onOpenAdjustments
}) {
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editNameText, setEditNameText] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [locks, setLocks] = useState({
    transparent: false,
    pixels: false,
    position: false,
    all: false
  });

  const renameInputRef = useRef(null);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1];

  // In Photoshop, the visual layer stack displays the top-most layer at top
  const displayLayers = [...layers]
    .map((layer, actualIndex) => ({ layer, actualIndex }))
    .reverse();

  useEffect(() => {
    if (editingLayerId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingLayerId]);

  // Close context menu on outside click
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleStartRename = (layer) => {
    setEditingLayerId(layer.id);
    setEditNameText(layer.name);
  };

  const handleCommitRename = (layerId) => {
    if (editNameText.trim() && onChangeLayerName) {
      onChangeLayerName(layerId, editNameText.trim());
    }
    setEditingLayerId(null);
  };

  const handleContextMenu = (e, layer, actualIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(window.innerWidth - 180, e.clientX),
      y: Math.min(window.innerHeight - 150, e.clientY),
      layer,
      actualIndex
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#282828] select-none text-[11px] font-sans">
      {/* Top Row: Blend Mode & Opacity */}
      <div className="p-1.5 border-b border-[#181818] bg-[#282828] flex items-center justify-between gap-1 text-[10px]">
        <select
          value={activeLayer?.blendMode || 'normal'}
          onChange={(e) => activeLayer && onChangeBlendMode && onChangeBlendMode(activeLayer.id, e.target.value)}
          className="bg-[#1c1c1c] text-zinc-200 border border-[#3a3a3a] px-1.5 py-0.5 rounded-[2px] cursor-pointer focus:outline-none text-[10px] flex-1 max-w-[120px]"
        >
          {BLEND_MODES.map((bm) => (
            <option key={bm.id} value={bm.id}>
              {bm.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <span className="text-zinc-400 text-[10px]">Opacity:</span>
          <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] px-1 py-0.5 rounded-[2px]">
            <input
              type="number"
              min="0"
              max="100"
              value={activeLayer?.opacity ?? 100}
              onChange={(e) =>
                activeLayer &&
                onChangeOpacity &&
                onChangeOpacity(activeLayer.id, Math.max(0, Math.min(100, Number(e.target.value))))
              }
              className="w-7 bg-transparent text-zinc-200 text-right font-mono focus:outline-none text-[10px]"
            />
            <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
          </div>
        </div>
      </div>

      {/* Lock Bar Row */}
      <div className="px-2 py-1 border-b border-[#181818] bg-[#242424] flex items-center justify-between text-[10px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Lock:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLocks((l) => ({ ...l, transparent: !l.transparent }))}
              className={`w-4 h-4 flex items-center justify-center rounded-[1px] transition ${
                locks.transparent ? 'bg-[#1473e6] text-white' : 'hover:bg-[#383838] text-zinc-400'
              }`}
              title="Lock transparent pixels"
            >
              ▨
            </button>
            <button
              type="button"
              onClick={() => setLocks((l) => ({ ...l, pixels: !l.pixels }))}
              className={`w-4 h-4 flex items-center justify-center rounded-[1px] transition ${
                locks.pixels ? 'bg-[#1473e6] text-white' : 'hover:bg-[#383838] text-zinc-400'
              }`}
              title="Lock image pixels (prevent painting)"
            >
              🖌
            </button>
            <button
              type="button"
              onClick={() => setLocks((l) => ({ ...l, position: !l.position }))}
              className={`w-4 h-4 flex items-center justify-center rounded-[1px] transition ${
                locks.position ? 'bg-[#1473e6] text-white' : 'hover:bg-[#383838] text-zinc-400'
              }`}
              title="Lock position"
            >
              ✛
            </button>
            <button
              type="button"
              onClick={() => setLocks((l) => ({ ...l, all: !l.all }))}
              className={`w-4 h-4 flex items-center justify-center rounded-[1px] transition ${
                locks.all ? 'bg-[#1473e6] text-white' : 'hover:bg-[#383838] text-zinc-400'
              }`}
              title="Lock all"
            >
              🔒
            </button>
          </div>
        </div>
      </div>

      {/* Layer Row List */}
      <div className="flex-1 overflow-y-auto bg-[#1e1e1e] p-0.5 space-y-0.5 [scrollbar-width:thin]">
        {displayLayers.map(({ layer, actualIndex }) => {
          const isActive = layer.id === activeLayerId;
          const isTop = actualIndex === layers.length - 1;
          const isBottom = actualIndex === 0;
          const isClipping = Boolean(layer.isClippingMask);

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              onContextMenu={(e) => handleContextMenu(e, layer, actualIndex)}
              className={`px-2 py-1 flex items-center justify-between gap-1.5 cursor-pointer border-b border-[#282828] transition select-none ${
                isActive
                  ? 'bg-[#1473e6] text-white font-medium'
                  : 'bg-[#282828] text-zinc-300 hover:bg-[#303030]'
              } ${isClipping ? 'pl-5' : ''}`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {/* Clipping Mask Arrow Indication */}
                {isClipping && (
                  <span
                    className={`font-mono text-sm leading-none shrink-0 ${
                      isActive ? 'text-white' : 'text-[#31a8ff]'
                    }`}
                    title="Clipping Mask (clipped to layer below)"
                  >
                    ↳
                  </span>
                )}

                {/* Eye Visibility Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className={`w-4 h-4 flex items-center justify-center text-xs shrink-0 ${
                    layer.visible
                      ? isActive
                        ? 'text-white'
                        : 'text-zinc-300 hover:text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? '👁' : '✕'}
                </button>

                {/* Checkerboard Thumbnail Preview */}
                <div className="w-6 h-5 rounded-[1px] border border-[#181818] bg-white overflow-hidden shrink-0 relative shadow-inner">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #e4e4e7 25%, transparent 25%), 
                                        linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), 
                                        linear-gradient(45deg, transparent 75%, #e4e4e7 75%), 
                                        linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)`,
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px'
                    }}
                  />
                  {layer.isBackground ? (
                    <div className="absolute inset-0 bg-white" />
                  ) : layer.type === 'text' ? (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-800 font-serif font-black bg-white/70">
                      T
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] text-zinc-600 font-bold">
                      ▱
                    </div>
                  )}
                </div>

                {/* Layer Name (Double click to rename) */}
                {editingLayerId === layer.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={editNameText}
                    onChange={(e) => setEditNameText(e.target.value)}
                    onBlur={() => handleCommitRename(layer.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRename(layer.id);
                      if (e.key === 'Escape') setEditingLayerId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-[#181818] text-white px-1 py-0 border border-[#3a3a3a] rounded-[1px] text-[11px] focus:outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleStartRename(layer)}
                    className="truncate text-[11px] flex-1 cursor-text"
                    title="Double-click to rename"
                  >
                    {layer.name}
                  </span>
                )}
              </div>

              {/* Reorder Buttons (Move Up / Down) */}
              <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onMoveLayerUp(actualIndex)}
                  disabled={isTop}
                  className={`w-4 h-4 rounded-[1px] flex items-center justify-center text-[9px] ${
                    !isTop
                      ? isActive
                        ? 'hover:bg-[#0d66d0] text-white'
                        : 'hover:bg-[#383838] text-zinc-400'
                      : 'opacity-30 cursor-not-allowed'
                  }`}
                  title="Move Layer Up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => onMoveLayerDown(actualIndex)}
                  disabled={isBottom}
                  className={`w-4 h-4 rounded-[1px] flex items-center justify-center text-[9px] ${
                    !isBottom
                      ? isActive
                        ? 'hover:bg-[#0d66d0] text-white'
                        : 'hover:bg-[#383838] text-zinc-400'
                      : 'opacity-30 cursor-not-allowed'
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

      {/* Bottom Action Bar */}
      <div className="h-7 bg-[#252525] border-t border-[#181818] flex items-center justify-between px-3 text-zinc-400 shrink-0">
        {/* Layer Style (fx) */}
        <button
          type="button"
          className="w-5 h-5 flex items-center justify-center font-serif text-[11px] hover:text-white transition"
          title="Add a layer style (fx)"
        >
          fx
        </button>

        {/* Add Layer Mask */}
        <button
          type="button"
          className="w-5 h-5 flex items-center justify-center text-xs hover:text-white transition"
          title="Add layer mask"
        >
          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="12" cy="12" r="5" fill="currentColor" />
          </svg>
        </button>

        {/* Adjustment Layer */}
        <button
          type="button"
          onClick={onOpenAdjustments}
          className="w-5 h-5 flex items-center justify-center text-xs hover:text-white transition"
          title="Create new adjustment layer"
        >
          ◑
        </button>

        {/* Clipping Mask Shortcut */}
        <button
          type="button"
          onClick={() => onToggleClippingMask && onToggleClippingMask()}
          className="w-5 h-5 flex items-center justify-center text-xs hover:text-white transition font-mono"
          title="Create / Release Clipping Mask (Ctrl+Alt+G)"
        >
          ↳
        </button>

        {/* New Layer (+) */}
        <button
          type="button"
          onClick={onAddLayer}
          className="w-5 h-5 flex items-center justify-center text-sm font-bold hover:text-white transition"
          title="Create a new layer (Shift+Ctrl+N)"
        >
          +
        </button>

        {/* Delete Layer (Trash) */}
        <button
          type="button"
          onClick={onDeleteLayer}
          disabled={layers.length <= 1}
          className={`w-5 h-5 flex items-center justify-center transition ${
            layers.length > 1
              ? 'text-zinc-400 hover:text-rose-400 cursor-pointer'
              : 'text-zinc-600 cursor-not-allowed'
          }`}
          title={layers.length > 1 ? 'Delete layer' : 'Cannot delete background layer'}
        >
          <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Desktop Context Menu */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed bg-[#222222] border border-[#3a3a3a] py-1 shadow-2xl z-50 text-[11px] text-zinc-200 rounded-[2px] min-w-[190px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              onToggleClippingMask && onToggleClippingMask(contextMenu.layer.id);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#1473e6] hover:text-white"
          >
            <span>{contextMenu.layer.isClippingMask ? 'Release Clipping Mask' : 'Create Clipping Mask'}</span>
            <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Alt+G</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onDuplicateLayer && onDuplicateLayer();
              setContextMenu(null);
            }}
            className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-[#1473e6] hover:text-white"
          >
            <span>Duplicate Layer...</span>
            <span className="text-[10px] text-zinc-500 font-mono">Ctrl+J</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onMergeDown && onMergeDown();
              setContextMenu(null);
            }}
            disabled={contextMenu.actualIndex === 0}
            className={`w-full px-3 py-1 text-left flex items-center justify-between ${
              contextMenu.actualIndex === 0
                ? 'text-zinc-600 cursor-not-allowed'
                : 'hover:bg-[#1473e6] hover:text-white'
            }`}
          >
            <span>Merge Down</span>
            <span className="text-[10px] text-zinc-500 font-mono">Ctrl+E</span>
          </button>

          <div className="h-[1px] bg-[#333333] my-1" />

          <button
            type="button"
            onClick={() => {
              handleStartRename(contextMenu.layer);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1 text-left hover:bg-[#1473e6] hover:text-white"
          >
            Rename Layer...
          </button>

          <button
            type="button"
            onClick={() => {
              onDeleteLayer && onDeleteLayer();
              setContextMenu(null);
            }}
            disabled={layers.length <= 1}
            className={`w-full px-3 py-1 text-left text-rose-400 hover:bg-rose-900/60 ${
              layers.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            Delete Layer
          </button>
        </div>
      )}
    </div>
  );
}
