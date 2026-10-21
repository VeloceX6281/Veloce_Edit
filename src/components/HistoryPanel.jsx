import React from 'react';

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

export default function HistoryPanel({
  historyList,
  currentIndex,
  onJumpToIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) {
  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      {/* Header & Undo/Redo Buttons */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-300">
            Action History
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-mono">
            {historyList.length} States
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`px-2 py-0.5 rounded border text-[11px] transition ${
              canUndo
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer'
                : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`px-2 py-0.5 rounded border text-[11px] transition ${
              canRedo
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer'
                : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            Redo
          </button>
        </div>
      </div>

      {/* Chronological Visual History List */}
      <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto pr-0.5">
        {historyList.map((item) => {
          const isActive = item.index === currentIndex;
          const isUndone = item.index > currentIndex;
          const icon = ACTION_ICONS[item.icon] || '✏️';

          return (
            <div
              key={item.id}
              onClick={() => onJumpToIndex(item.index)}
              className={`p-2 rounded-lg border transition flex items-center justify-between gap-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                  : isUndone
                  ? 'bg-zinc-900/40 border-zinc-800/40 text-zinc-500 opacity-60 hover:opacity-100 hover:bg-zinc-800/50'
                  : 'bg-zinc-900/80 border-zinc-800/90 hover:bg-zinc-800 text-zinc-200'
              }`}
              title={`Click to jump to state: ${item.action}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm flex-shrink-0">{icon}</span>
                <span className="text-xs font-medium truncate">{item.action}</span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-[10px] text-zinc-500">
                  {item.timestamp}
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-500 text-center pt-1 border-t border-zinc-800/80">
        Click any previous state to instantly travel through time.
      </p>
    </div>
  );
}
