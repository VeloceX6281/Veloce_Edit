import React, { useRef, useState } from 'react';

export default function Header({
  zoom,
  setZoom,
  onFitToScreen,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearCanvas,
  onOpenImportModal,
  onOpenExportModal,
  onAddLayer,
  onDeleteLayer,
  layersCount
}) {
  const fileInputRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null);

  // File chosen via input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        onOpenImportModal({
          name: file.name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          dataUrl,
          imgElement: img
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <header className="h-12 bg-[#181a20] border-b border-zinc-800 flex items-center justify-between px-4 z-20 select-none">
      {/* Hidden File Input for Image Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Brand & Studio Menus */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-indigo-500/20">
            V
          </div>
          <span className="font-semibold tracking-wide text-sm text-zinc-100">VeloceEdit</span>
        </div>

        {/* Studio Menus */}
        <nav className="relative flex items-center gap-1 text-xs text-zinc-400">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded transition ${
                activeMenu === 'file' ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div
                className="absolute left-0 top-8 w-48 bg-[#1f222b] border border-zinc-700/80 rounded-md py-1 shadow-2xl z-50 text-xs flex flex-col"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setActiveMenu(null);
                  }}
                  className="px-3 py-1.5 text-left text-zinc-200 hover:bg-indigo-600 hover:text-white flex items-center justify-between"
                >
                  <span>Import Image...</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+O</span>
                </button>
                <button
                  onClick={() => {
                    onOpenExportModal();
                    setActiveMenu(null);
                  }}
                  className="px-3 py-1.5 text-left text-zinc-200 hover:bg-indigo-600 hover:text-white flex items-center justify-between"
                >
                  <span>Export Artwork...</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+E</span>
                </button>
                <div className="h-[1px] bg-zinc-700/60 my-1" />
                <button
                  onClick={() => {
                    onClearCanvas();
                    setActiveMenu(null);
                  }}
                  className="px-3 py-1.5 text-left text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-between"
                >
                  <span>Clear Active Layer</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={`px-2.5 py-1 rounded transition ${
                activeMenu === 'edit' ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div
                className="absolute left-0 top-8 w-44 bg-[#1f222b] border border-zinc-700/80 rounded-md py-1 shadow-2xl z-50 text-xs flex flex-col"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  disabled={!canUndo}
                  onClick={() => {
                    onUndo();
                    setActiveMenu(null);
                  }}
                  className={`px-3 py-1.5 text-left flex items-center justify-between ${
                    canUndo ? 'text-zinc-200 hover:bg-indigo-600 hover:text-white' : 'text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <span>Undo</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+Z</span>
                </button>
                <button
                  disabled={!canRedo}
                  onClick={() => {
                    onRedo();
                    setActiveMenu(null);
                  }}
                  className={`px-3 py-1.5 text-left flex items-center justify-between ${
                    canRedo ? 'text-zinc-200 hover:bg-indigo-600 hover:text-white' : 'text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <span>Redo</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+Y</span>
                </button>
                <div className="h-[1px] bg-zinc-700/60 my-1" />
                <button
                  onClick={() => {
                    onAddLayer();
                    setActiveMenu(null);
                  }}
                  className="px-3 py-1.5 text-left text-zinc-200 hover:bg-indigo-600 hover:text-white"
                >
                  Add New Layer
                </button>
                <button
                  disabled={layersCount <= 1}
                  onClick={() => {
                    onDeleteLayer();
                    setActiveMenu(null);
                  }}
                  className={`px-3 py-1.5 text-left ${
                    layersCount > 1
                      ? 'text-zinc-200 hover:bg-rose-600 hover:text-white'
                      : 'text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  Delete Active Layer
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Undo / Redo Quick Action Buttons with Tooltips */}
        <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 rounded px-1 py-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`w-7 h-6 rounded flex items-center justify-center transition ${
              canUndo
                ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
            </svg>
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            className={`w-7 h-6 rounded flex items-center justify-center transition ${
              canRedo
                ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Controls: Zoom & Fit to Screen, Import Image, Export */}
      <div className="flex items-center gap-3">
        {/* Zoom & Fit to Screen Controls */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-400 gap-0.5">
          <button
            onClick={() => setZoom((z) => Math.max(10, z - 25))}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-800 hover:text-zinc-100 transition active:scale-95 font-medium"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={() => setZoom(100)}
            className="px-2 font-mono text-[11px] text-zinc-300 hover:text-indigo-400 transition"
            title="Reset Zoom to 100%"
          >
            {zoom}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(500, z + 25))}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-800 hover:text-zinc-100 transition active:scale-95 font-medium"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={onFitToScreen}
            className="ml-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-indigo-400 hover:text-indigo-300 text-[10px] font-medium transition active:scale-95 flex items-center justify-center"
            title="Fit Canvas to Viewport"
          >
            Fit
          </button>
        </div>

        {/* Import Image Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded flex items-center text-xs font-medium transition shadow-sm cursor-pointer"
          title="Import an image file from disk"
        >
          <svg className="w-4 h-4 mr-1.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Import Image
        </button>

        {/* High-Res Multi-Format Export Button */}
        <button
          onClick={onOpenExportModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded flex items-center text-xs font-medium transition shadow-sm shadow-indigo-600/30 cursor-pointer"
          title="Export multi-layer artwork to PNG/JPEG"
        >
          <svg className="w-4 h-4 mr-1.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>
    </header>
  );
}
