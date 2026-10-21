import React from 'react';

export default function MarchingAntsOverlay({
  selection, // { type: 'rect' | 'ellipse', x, y, width, height, inverted }
  canvasWidth,
  canvasHeight
}) {
  if (!selection || selection.width === 0 || selection.height === 0) return null;

  const rx = Math.min(selection.x, selection.x + selection.width);
  const ry = Math.min(selection.y, selection.y + selection.height);
  const rw = Math.abs(selection.width);
  const rh = Math.abs(selection.height);

  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const radX = rw / 2;
  const radY = rh / 2;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      <svg
        className="w-full h-full block"
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <style>{`
            @keyframes marchingAntsAnim {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: 8; }
            }
            .marching-ants {
              animation: marchingAntsAnim 0.5s linear infinite;
            }
          `}</style>
        </defs>

        {selection.type === 'rect' ? (
          <g>
            {/* Black base dash */}
            <rect
              x={rx}
              y={ry}
              width={rw}
              height={rh}
              fill="none"
              stroke="#000000"
              strokeWidth="1"
            />
            {/* White animated marching ants dash */}
            <rect
              x={rx}
              y={ry}
              width={rw}
              height={rh}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="marching-ants"
            />
          </g>
        ) : (
          <g>
            {/* Black base ellipse dash */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={radX}
              ry={radY}
              fill="none"
              stroke="#000000"
              strokeWidth="1"
            />
            {/* White animated marching ants ellipse dash */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={radX}
              ry={radY}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="marching-ants"
            />
          </g>
        )}
      </svg>

      {/* Marquee Selection Dimension Badge */}
      <div
        style={{
          left: `${rx}px`,
          top: `${Math.max(0, ry - 22)}px`
        }}
        className="absolute bg-zinc-900/90 border border-zinc-700/80 rounded px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 shadow-md whitespace-nowrap pointer-events-none"
      >
        <span>
          {Math.round(rw)} × {Math.round(rh)} px
        </span>
        {selection.inverted && <span className="text-amber-400 ml-1">(Inverted)</span>}
      </div>
    </div>
  );
}
