import React, { useRef, useState } from 'react';

export default function Header({
  zoom,
  setZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearCanvas,
  baseCanvasRef,
  pushSnapshot
}) {
  const fileInputRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null);

  // Import Image from user disk
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = baseCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Draw image scaled to fit or center inside canvas
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        pushSnapshot();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Export Canvas as PNG
  const handleExport = () => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with white background so JPEG/PNG exports cleanly
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext('2d');
    expCtx.fillStyle = '#ffffff';
    expCtx.fillRect(0, 0, canvas.width, canvas.height);
    expCtx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `veloce-edit-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
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

      {/* Brand & Menu */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-indigo-500/20">
            V
          </div>
          <span className="font-semibold tracking-wide text-sm text-zinc-100">VeloceEdit</span>
        </div>

        {/* Studio Menus */}
        <nav className="relative flex items-center gap-1 text-xs text-zinc-400">
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
                className="absolute left-0 top-8 w-44 bg-[#1f222b] border border-zinc-700/80 rounded-md py-1 shadow-2xl z-50 text-xs flex flex-col"
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
                    handleExport();
                    setActiveMenu(null);
                  }}
                  className="px-3 py-1.5 text-left text-zinc-200 hover:bg-indigo-600 hover:text-white flex items-center justify-between"
                >
                  <span>Export PNG</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+S</span>
                </button>
                <div className="h-[1px] bg-zinc-700/60 my-1" />
                <button
                  onClick={() => {
                    onClearCanvas();
                    setActiveMenu(null);
                  }}
                  className="px-3 py-1.5 text-left text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-between"
                >
                  <span>Clear Canvas</span>
                </button>
              </div>
            )}
          </div>

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
                className="absolute left-0 top-8 w-40 bg-[#1f222b] border border-zinc-700/80 rounded-md py-1 shadow-2xl z-50 text-xs flex flex-col"
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
                    onClearCanvas();
                    setActiveMenu(null);
                  }}
                  className="px-3 py-1.5 text-left text-zinc-200 hover:bg-indigo-600 hover:text-white"
                >
                  Clear All
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
            <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
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
            <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Controls: Zoom & Import / Export */}
      <div className="flex items-center gap-3">
        {/* Zoom Controls */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-xs text-zinc-400">
          <button
            onClick={() => setZoom((z) => Math.max(25, z - 25))}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-800 hover:text-zinc-200 transition"
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
            onClick={() => setZoom((z) => Math.min(250, z + 25))}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-800 hover:text-zinc-200 transition"
            title="Zoom In"
          >
            +
          </button>
        </div>

        {/* Import Image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition border border-zinc-700 flex items-center gap-1.5 shadow-sm"
          title="Import an image file onto canvas"
        >
          <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import
        </button>

        {/* Export Image */}
        <button
          onClick={handleExport}
          className="px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition shadow-sm shadow-indigo-600/30 flex items-center gap-1.5"
          title="Download canvas as PNG"
        >
          <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>
    </header>
  );
}
