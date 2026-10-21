import React, { useState, useEffect, useRef } from 'react';

export default function TextOverlay({
  config,
  onCommit,
  onCancel,
  zoom = 100
}) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(28);
  const [color, setColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (config && config.visible) {
      setText(config.text || '');
      setFontSize(config.fontSize || 28);
      setColor(config.color || '#000000');
      setIsBold(Boolean(config.isBold));
      setIsItalic(Boolean(config.isItalic));
      setFontFamily(config.fontFamily || 'Arial');
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          if (config.text) {
            textareaRef.current.select();
          }
        }
      }, 50);
    }
  }, [config]);

  if (!config || !config.visible) return null;

  const handleCommit = () => {
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      onCommit({
        layerId: config.layerId || null,
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
      className="absolute z-40 pointer-events-auto"
      style={{
        left: `${config.x}px`,
        top: `${config.y}px`,
        transformOrigin: 'top left'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating Mini Formatting Toolbar */}
      <div className="absolute -top-10 left-0 flex items-center gap-1.5 bg-[#1e1e1e] border border-[#3a3a3a] rounded-[2px] px-2 py-0.5 shadow-2xl text-[11px] whitespace-nowrap z-50 font-sans">
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="bg-[#181818] text-zinc-200 text-[10px] rounded-[1px] px-1 py-0.5 border border-[#3a3a3a] focus:outline-none focus:border-[#1473e6] cursor-pointer"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Impact">Impact</option>
        </select>

        <div className="flex items-center gap-1 bg-[#181818] px-1 rounded-[1px] border border-[#3a3a3a]">
          <span className="text-[9px] text-zinc-400">Size:</span>
          <input
            type="number"
            min="8"
            max="144"
            value={fontSize}
            onChange={(e) => setFontSize(Math.max(8, Number(e.target.value)))}
            className="w-8 bg-transparent text-zinc-200 text-[10px] text-right font-mono focus:outline-none"
          />
          <span className="text-[9px] text-zinc-400">pt</span>
        </div>

        <button
          type="button"
          onClick={() => setIsBold(!isBold)}
          className={`w-5 h-5 rounded-[1px] flex items-center justify-center font-bold text-xs transition ${
            isBold ? 'bg-[#1473e6] text-white' : 'text-zinc-400 hover:bg-[#383838] hover:text-zinc-200'
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => setIsItalic(!isItalic)}
          className={`w-5 h-5 rounded-[1px] flex items-center justify-center italic text-xs transition ${
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
            className="w-4 h-4 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
            title="Text Color"
          />
          <div
            className="w-4 h-4 rounded-[1px] border border-[#3a3a3a] shadow-sm"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className="w-[1px] h-3 bg-[#3a3a3a] mx-0.5" />

        <button
          type="button"
          onClick={handleCommit}
          className="px-2 py-0.5 rounded-[1px] bg-[#1473e6] hover:bg-[#0d66d0] text-white font-medium text-[10px] flex items-center gap-1 shadow-sm transition"
          title="Commit Text (Enter)"
        >
          ✔ Done
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-1.5 py-0.5 rounded-[1px] text-zinc-400 hover:text-zinc-100 hover:bg-[#383838] text-[10px] transition"
          title="Cancel (Esc)"
        >
          ✕
        </button>
      </div>

      {/* WYSIWYG Editable Text Box */}
      <div className="relative min-w-[140px] border border-dashed border-[#1473e6] bg-[#181818]/80 rounded-[2px] p-1.5 shadow-2xl backdrop-blur-[2px]">
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
        <div className="text-[9px] text-zinc-500 mt-1 select-none flex justify-between gap-2 border-t border-[#333333] pt-0.5 font-mono">
          <span>Enter: Commit</span>
          <span>Shift+Enter: Newline</span>
          <span>Esc: Cancel</span>
        </div>
      </div>
    </div>
  );
}
