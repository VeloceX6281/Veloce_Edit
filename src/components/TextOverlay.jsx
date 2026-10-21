import React, { useState, useEffect, useRef } from 'react';

export default function TextOverlay({
  config,
  onCommit,
  onCancel,
  zoom = 100
}) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(config?.fontSize || 24);
  const [color, setColor] = useState(config?.color || '#6366f1');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (config) {
      setText('');
      setFontSize(config.fontSize || 24);
      setColor(config.color || '#6366f1');
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    }
  }, [config]);

  if (!config || !config.visible) return null;

  const handleCommit = () => {
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      onCommit({
        text,
        x: config.x,
        y: config.y,
        fontSize,
        color,
        fontFamily,
        isBold,
        isItalic
      });
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="absolute z-30 pointer-events-auto"
      style={{
        left: `${config.x}px`,
        top: `${config.y}px`,
        transformOrigin: 'top left'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating Mini Formatting Toolbar */}
      <div className="absolute -top-11 left-0 flex items-center gap-1.5 bg-[#181a20]/95 backdrop-blur-md border border-zinc-700/80 rounded-md px-2 py-1 shadow-2xl text-xs whitespace-nowrap z-40 animate-in fade-in zoom-in-95 duration-100">
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="bg-zinc-800 text-zinc-200 text-[11px] rounded px-1.5 py-0.5 border border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="sans-serif">Sans-Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="cursive">Script / Cursive</option>
        </select>

        <div className="flex items-center gap-1 bg-zinc-800 px-1 rounded border border-zinc-700">
          <span className="text-[10px] text-zinc-400">Size:</span>
          <input
            type="number"
            min="10"
            max="120"
            value={fontSize}
            onChange={(e) => setFontSize(Math.max(8, Number(e.target.value)))}
            className="w-10 bg-transparent text-zinc-200 text-[11px] text-right focus:outline-none"
          />
          <span className="text-[10px] text-zinc-400">px</span>
        </div>

        <button
          type="button"
          onClick={() => setIsBold(!isBold)}
          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition ${
            isBold ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:bg-[#383838] hover:text-zinc-200'
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => setIsItalic(!isItalic)}
          className={`w-6 h-6 rounded flex items-center justify-center italic text-xs transition ${
            isItalic ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:bg-[#383838] hover:text-zinc-200'
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>

        <div className="relative flex items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
            title="Text Color"
          />
          <div
            className="w-5 h-5 rounded border border-zinc-600 shadow-sm"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className="w-[1px] h-4 bg-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={handleCommit}
          className="px-2 py-0.5 rounded bg-[#1473e6] hover:bg-[#0d66d0] text-white font-medium text-[11px] flex items-center gap-1 shadow-sm transition"
          title="Commit Text (Enter)"
        >
          <svg className="w-3.5 h-3.5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Done
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#383838] text-[11px] transition"
          title="Cancel (Esc)"
        >
          ✕
        </button>
      </div>

      {/* WYSIWYG Editable Text Box */}
      <div className="relative min-w-[140px] border border-dashed border-[#1473e6] bg-black/40 rounded-[2px] p-1.5 shadow-xl backdrop-blur-[2px]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type text here..."
          rows={Math.max(1, text.split('\n').length)}
          style={{
            fontSize: `${fontSize}px`,
            color: color,
            fontFamily: fontFamily,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            lineHeight: 1.25
          }}
          className="w-full bg-transparent resize-none border-none outline-none overflow-hidden placeholder:text-zinc-500/70 p-0 m-0 block"
        />
        <div className="text-[9px] text-zinc-400 mt-1 select-none flex justify-between gap-2 border-t border-zinc-700/50 pt-0.5">
          <span>Enter: commit</span>
          <span>Shift+Enter: newline</span>
          <span>Esc: cancel</span>
        </div>
      </div>
    </div>
  );
}
