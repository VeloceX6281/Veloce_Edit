import React, { useRef, useEffect } from 'react';

/**
 * 9x9 Pixel Magnifying Loupe for Photoshop Eyedropper Tool
 */
export default function EyedropperLoupe({
  x,
  y,
  compositeData, // 9x9 ImageData
  currentColorHex = '#000000',
  visible = true
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!visible || !compositeData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Create temporary 9x9 canvas then draw scaled up 8x
    const off = document.createElement('canvas');
    off.width = 9;
    off.height = 9;
    const oCtx = off.getContext('2d');
    oCtx.putImageData(compositeData, 0, 0);

    ctx.clearRect(0, 0, 72, 72);
    ctx.drawImage(off, 0, 0, 9, 9, 0, 0, 72, 72);

    // Draw pixel grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, 0);
      ctx.lineTo(i * 8, 72);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * 8);
      ctx.lineTo(72, i * 8);
      ctx.stroke();
    }

    // Highlight center sampled pixel (index 4, 4: x=32..40, y=32..40)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(32, 32, 8, 8);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(31, 31, 10, 10);
  }, [visible, compositeData]);

  if (!visible) return null;

  return (
    <div
      style={{
        left: `${x + 18}px`,
        top: `${y - 45}px`
      }}
      className="absolute pointer-events-none z-50 flex flex-col items-center select-none"
    >
      {/* Circular Magnifying Ring */}
      <div className="w-[76px] h-[76px] rounded-full p-[2px] bg-[#181818] border-2 border-[#ffffff] shadow-2xl overflow-hidden flex items-center justify-center relative">
        <canvas
          ref={canvasRef}
          width={72}
          height={72}
          className="rounded-full block"
        />
        {/* Outer color ring badge */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none border-[3px]"
          style={{ borderColor: currentColorHex }}
        />
      </div>

      {/* Hex value badge */}
      <div className="mt-1 px-1.5 py-0.5 rounded-[2px] bg-[#181818] border border-[#3a3a3a] text-[9px] font-mono text-white shadow-lg flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-[1px] border border-white/40"
          style={{ backgroundColor: currentColorHex }}
        />
        <span>{currentColorHex.toUpperCase()}</span>
      </div>
    </div>
  );
}
