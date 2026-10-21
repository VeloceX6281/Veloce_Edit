import { useState } from 'react';

export default function App() {
  const [activeTool, setActiveTool] = useState('brush');
  const [activeTab, setActiveTab] = useState('layers');
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(8);
  const [zoom] = useState(100);

  const tools = [
    { id: 'select', name: 'Move / Select', icon: 'M4 4l7 17 2.5-6.5L20 12 4 4z' },
    { id: 'brush', name: 'Brush Tool', icon: 'M18.375 2.625a3.875 3.875 0 00-5.48 0L3.5 12.02v4.48h4.48l9.395-9.395a3.875 3.875 0 000-5.48z' },
    { id: 'eraser', name: 'Eraser Tool', icon: 'M19 11L13 5 4.5 13.5a2.12 2.12 0 000 3L7.5 19.5a2.12 2.12 0 003 0L19 11z' },
    { id: 'shapes', name: 'Rectangle Tool', icon: 'M4 5h16v14H4V5z' },
    { id: 'text', name: 'Text Tool', icon: 'M5 4v3h5.5v12h3V7H19V4H5z' },
    { id: 'bucket', name: 'Paint Bucket', icon: 'M19 11l-8-8-8.5 8.5a2.5 2.5 0 000 3.54l3.46 3.46a2.5 2.5 0 003.54 0L17 11.04' },
    { id: 'crop', name: 'Crop Tool', icon: 'M6 2v14a2 2 0 002 2h14 M2 6h14a2 2 0 012 2v14' }
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f1117] text-zinc-200 select-none overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-12 bg-[#181a20] border-b border-zinc-800 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-indigo-500/20">
              V
            </div>
            <span className="font-semibold tracking-wide text-sm text-zinc-100">VeloceEdit</span>
          </div>

          <nav className="flex items-center gap-1 text-xs text-zinc-400">
            <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-100 transition">File</button>
            <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-100 transition">Edit</button>
            <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-100 transition">Image</button>
            <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-100 transition">View</button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-400">
            <span>Zoom: {zoom}%</span>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition border border-zinc-700">
            Import Image
          </button>
          <button className="px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition shadow-sm shadow-indigo-600/30">
            Export
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-14 bg-[#14161d] border-r border-zinc-800 flex flex-col items-center py-3 gap-2 z-10">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.name}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                activeTool === tool.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <svg className="w-4 h-4 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
              </svg>
            </button>
          ))}

          <div className="w-8 h-[1px] bg-zinc-800 my-2" />

          {/* Color Picker Indicator */}
          <div className="relative">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
              title="Foreground Color"
            />
            <div 
              className="w-7 h-7 rounded-full border-2 border-zinc-700 shadow-inner"
              style={{ backgroundColor: brushColor }} 
            />
          </div>
        </aside>

        {/* Center Viewport / Canvas */}
        <main className="flex-1 bg-[#090a0f] relative overflow-hidden flex items-center justify-center p-8">
          <div className="relative shadow-2xl shadow-black/80 rounded border border-zinc-800 bg-[#1e2029] overflow-hidden flex items-center justify-center">
            <canvas
              id="veloce-canvas"
              width={800}
              height={500}
              className="bg-white cursor-crosshair block"
            />
          </div>

          <div className="absolute bottom-3 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-md px-3 py-1 flex items-center gap-3 text-xs text-zinc-400">
            <span>Tool: <strong className="text-zinc-200 capitalize">{activeTool}</strong></span>
            <span>|</span>
            <span>800 × 500 px</span>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 bg-[#14161d] border-l border-zinc-800 flex flex-col z-10">
          <div className="h-10 border-b border-zinc-800 flex">
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 text-xs font-medium border-b-2 transition ${
                activeTab === 'layers'
                  ? 'border-indigo-500 text-zinc-100 bg-[#181a22]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setActiveTab('adjustments')}
              className={`flex-1 text-xs font-medium border-b-2 transition ${
                activeTab === 'adjustments'
                  ? 'border-indigo-500 text-zinc-100 bg-[#181a22]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Adjustments
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'layers' ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span>Layers (1)</span>
                  <button className="text-indigo-400 hover:text-indigo-300 font-semibold">+ New</button>
                </div>

                <div className="p-2.5 rounded bg-zinc-800/80 border border-indigo-500/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-800">
                      ⬜
                    </span>
                    <span className="text-zinc-200 font-medium">Background</span>
                  </div>
                  <span className="text-zinc-400 cursor-pointer hover:text-zinc-100">👁</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Brush Size</span>
                    <span className="text-zinc-200">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="h-[1px] bg-zinc-800 my-1" />

                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Filters</span>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>Brightness</span>
                      <span className="text-zinc-200">100%</span>
                    </div>
                    <input type="range" min="0" max="200" defaultValue="100" className="w-full accent-indigo-500 cursor-pointer" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>Contrast</span>
                      <span className="text-zinc-200">100%</span>
                    </div>
                    <input type="range" min="0" max="200" defaultValue="100" className="w-full accent-indigo-500 cursor-pointer" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>Blur</span>
                      <span className="text-zinc-200">0px</span>
                    </div>
                    <input type="range" min="0" max="200" defaultValue="0" className="w-full accent-indigo-500 cursor-pointer" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}