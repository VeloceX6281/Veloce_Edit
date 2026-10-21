import React from 'react';

export default function ImportImageModal({
  isOpen,
  imageMeta,
  canvasWidth,
  canvasHeight,
  onInsertAsNewLayer,
  onOpenAsNewProject,
  onCancel
}) {
  if (!isOpen || !imageMeta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-lg bg-[#282828] border border-[#383838] rounded-[2px] shadow-2xl p-5 text-zinc-200 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[2px] bg-[#1473e6]/20 border border-[#1473e6]/40 flex items-center justify-center text-[#31a8ff]">
              🖼️
            </div>
            <div>
              <h3 className="font-semibold text-xs text-zinc-100">Import Local Image</h3>
              <p className="text-[10px] text-zinc-400">Choose how to add this image into the Photoshop document</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-6 h-6 rounded-[2px] text-zinc-400 hover:text-white hover:bg-[#383838] flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Image Preview & Meta Card */}
        <div className="flex items-center gap-4 p-2.5 bg-[#202020] rounded-[2px] border border-[#383838]">
          <div className="w-16 h-16 rounded-[2px] bg-[#181818] border border-[#383838] overflow-hidden flex items-center justify-center flex-shrink-0">
            <img
              src={imageMeta.dataUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1 text-xs">
            <span className="font-medium text-zinc-200 truncate">{imageMeta.name}</span>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span>Resolution:</span>
              <span className="font-mono text-zinc-300 font-semibold">
                {imageMeta.width} × {imageMeta.height} px
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span>Current Canvas:</span>
              <span className="font-mono text-zinc-400">
                {canvasWidth} × {canvasHeight} px
              </span>
            </div>
          </div>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option A: Insert as New Layer */}
          <button
            onClick={onInsertAsNewLayer}
            className="p-3.5 rounded-[2px] border border-[#383838] bg-[#222] hover:bg-[#2e2e2e] hover:border-[#1473e6] flex flex-col gap-2 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-[2px] bg-[#333] flex items-center justify-center text-zinc-300 group-hover:bg-[#1473e6] group-hover:text-white transition">
              <svg className="w-4 h-4 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-xs text-zinc-100 group-hover:text-[#31a8ff] transition">
                Insert as New Layer
              </span>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                Add as a separate layer fitted within the current {canvasWidth}×{canvasHeight} document.
              </p>
            </div>
          </button>

          {/* Option B: Open as New Project */}
          <button
            onClick={onOpenAsNewProject}
            className="p-3.5 rounded-[2px] border border-[#383838] bg-[#222] hover:bg-[#2e2e2e] hover:border-[#1473e6] flex flex-col gap-2 text-left transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-[2px] bg-[#333] flex items-center justify-center text-zinc-300 group-hover:bg-[#1473e6] group-hover:text-white transition">
              <svg className="w-4 h-4 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-xs text-zinc-100 group-hover:text-[#31a8ff] transition">
                Open as New Document
              </span>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                Match document artboard dimensions ({imageMeta.width}×{imageMeta.height} px) to image.
              </p>
            </div>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-[#383838]">
          <button
            onClick={onCancel}
            className="px-4 py-1 rounded-[2px] text-xs text-zinc-300 hover:text-white hover:bg-[#383838] border border-[#383838] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
