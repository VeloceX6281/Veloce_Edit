import React, { useRef, useState, useEffect } from 'react';

export default function Header({
  zoom = 100,
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
  layersCount = 1,
  showRulers,
  onToggleRulers,
  showGuides,
  onToggleGuides,
  onSelectAll,
  onDeselect,
  onInvertMarquee,
  onFreeTransform,
  documentName = 'Untitled-1.png'
}) {
  const fileInputRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuBarRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  const menuItems = [
    {
      id: 'file',
      label: 'File',
      children: [
        { label: 'New Project...', shortcut: 'Ctrl+N', action: () => onClearCanvas && onClearCanvas() },
        { label: 'Open / Import Image...', shortcut: 'Ctrl+O', action: () => fileInputRef.current?.click() },
        { divider: true },
        { label: 'Export As (PNG, JPG)...', shortcut: 'Ctrl+E', action: onOpenExportModal },
        { label: 'Quick Export as PNG', action: onOpenExportModal },
        { divider: true },
        { label: 'Close Document', shortcut: 'Ctrl+W', action: () => onClearCanvas && onClearCanvas() }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      children: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: onUndo, disabled: !canUndo },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: onRedo, disabled: !canRedo },
        { divider: true },
        { label: 'Free Transform', shortcut: 'Ctrl+T', action: onFreeTransform },
        { label: 'Clear Active Layer', shortcut: 'Del', action: onClearCanvas },
        { divider: true },
        { label: 'Fill Layer...', shortcut: 'Alt+Backspace', action: onClearCanvas },
        { label: 'Preferences...', shortcut: 'Ctrl+K', disabled: true }
      ]
    },
    {
      id: 'image',
      label: 'Image',
      children: [
        { label: 'Mode: RGB Color (8 Bit)', disabled: true, checked: true },
        { divider: true },
        { label: 'Adjustments (Right Panel)', shortcut: 'F8', action: () => {} },
        { label: 'Canvas Size...', action: onFitToScreen },
        { label: 'Crop Canvas', action: () => {} },
        { divider: true },
        { label: 'Duplicate Image...', action: () => {} }
      ]
    },
    {
      id: 'layer',
      label: 'Layer',
      children: [
        { label: 'New Layer', shortcut: 'Shift+Ctrl+N', action: onAddLayer },
        { label: 'Duplicate Layer', shortcut: 'Ctrl+J', action: onAddLayer },
        { label: 'Delete Layer', action: onDeleteLayer, disabled: layersCount <= 1 },
        { divider: true },
        { label: 'Lock Layer', disabled: true },
        { label: 'Merge Visible', shortcut: 'Shift+Ctrl+E', disabled: true }
      ]
    },
    {
      id: 'select',
      label: 'Select',
      children: [
        { label: 'All', shortcut: 'Ctrl+A', action: onSelectAll },
        { label: 'Deselect', shortcut: 'Ctrl+D', action: onDeselect },
        { label: 'Inverse Selection', shortcut: 'Shift+Ctrl+I', action: onInvertMarquee },
        { divider: true },
        { label: 'Select Subject (AI)', disabled: true }
      ]
    },
    {
      id: 'filter',
      label: 'Filter',
      children: [
        { label: 'Last Filter (Live)', shortcut: 'Ctrl+F', action: () => {} },
        { divider: true },
        { label: 'Blur (Gaussian / Box)...', action: () => {} },
        { label: 'Brightness & Contrast...', action: () => {} },
        { label: 'Invert / Negative', shortcut: 'Ctrl+I', action: () => {} },
        { label: 'Grayscale / Desaturate', shortcut: 'Shift+Ctrl+U', action: () => {} }
      ]
    },
    {
      id: 'view',
      label: 'View',
      children: [
        { label: 'Rulers', shortcut: 'Ctrl+R', action: onToggleRulers, checked: showRulers },
        { label: 'Guides', shortcut: 'Ctrl+;', action: onToggleGuides, checked: showGuides },
        { divider: true },
        { label: 'Zoom In', shortcut: 'Ctrl++', action: () => setZoom((z) => Math.min(500, z + 25)) },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => setZoom((z) => Math.max(10, z - 25)) },
        { label: 'Fit on Screen', shortcut: 'Ctrl+0', action: onFitToScreen },
        { label: '100% (Actual Pixels)', shortcut: 'Ctrl+1', action: () => setZoom(100) }
      ]
    },
    {
      id: 'window',
      label: 'Window',
      children: [
        { label: 'Tools', checked: true },
        { label: 'Options Bar', checked: true },
        { label: 'Layers (F7)', checked: true },
        { label: 'History', checked: true },
        { label: 'Adjustments / Filters', checked: true },
        { label: 'Color & Swatches', checked: true }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      children: [
        { label: 'About VeloceEdit (Photoshop Web)', action: () => alert('VeloceEdit - Authentic Adobe Photoshop Web Experience') },
        { label: 'Keyboard Shortcuts Cheatsheet', action: () => alert('V: Move\nM: Marquee\nL: Lasso\nC: Crop\nI: Eyedropper\nB: Brush\nS: Stamp\nE: Eraser\nG: Bucket\nT: Type\nU: Shapes\nH: Hand\nZ: Zoom\nCtrl+Z: Undo\nCtrl+Y: Redo') }
      ]
    }
  ];

  return (
    <header
      ref={menuBarRef}
      className="h-7 bg-[#2b2b2b] border-b border-[#181818] flex items-center justify-between px-2 z-30 select-none text-[11px] font-sans"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left: Photoshop Icon & Menu Bar */}
      <div className="flex items-center gap-1">
        {/* Authentic Photoshop 'Ps' Logo Box */}
        <div
          className="w-5 h-5 bg-[#001e36] text-[#31a8ff] font-bold text-[10px] flex items-center justify-center rounded-[2px] border border-[#003764] mr-1.5 shadow-sm select-none cursor-default"
          title="Adobe Photoshop Web (VeloceEdit)"
        >
          Ps
        </div>

        {/* Dropdown Menus */}
        <nav className="flex items-center text-zinc-300">
          {menuItems.map((menu) => {
            const isOpen = activeMenu === menu.id;

            return (
              <div key={menu.id} className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(isOpen ? null : menu.id)}
                  onMouseEnter={() => {
                    if (activeMenu !== null) setActiveMenu(menu.id);
                  }}
                  className={`px-2 py-0.5 rounded-[2px] transition ${
                    isOpen
                      ? 'bg-[#1473e6] text-white'
                      : 'hover:bg-[#383838] hover:text-white text-zinc-300'
                  }`}
                >
                  {menu.label}
                </button>

                {isOpen && (
                  <div
                    className="absolute left-0 top-6 min-w-[200px] bg-[#252525] border border-[#383838] py-1 shadow-2xl z-50 text-[11px] text-zinc-200 rounded-[2px]"
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    {menu.children.map((child, idx) => {
                      if (child.divider) {
                        return <div key={idx} className="h-[1px] bg-[#383838] my-1" />;
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={child.disabled}
                          onClick={() => {
                            if (child.action) child.action();
                            setActiveMenu(null);
                          }}
                          className={`w-full px-3 py-1 text-left flex items-center justify-between gap-4 transition ${
                            child.disabled
                              ? 'text-zinc-600 cursor-not-allowed'
                              : 'hover:bg-[#1473e6] hover:text-white text-zinc-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {child.checked ? (
                              <span className="text-[10px] w-2">✓</span>
                            ) : (
                              <span className="w-2" />
                            )}
                            {child.label}
                          </span>
                          {child.shortcut && (
                            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-mono">
                              {child.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Document Info, Compact Quick Actions, Compact Zoom */}
      <div className="flex items-center gap-2.5 text-zinc-400">
        {/* Document Status */}
        <div className="text-[10px] text-zinc-400 font-mono hidden sm:inline-block">
          <span className="text-zinc-300">{documentName}</span> @ {zoom}% (RGB/8)
        </div>

        <div className="w-[1px] h-3 bg-[#3a3a3a]" />

        {/* Compact Quick Actions: Import & Export */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-5 h-5 rounded-[2px] bg-[#222] hover:bg-[#383838] hover:text-white text-zinc-300 border border-[#383838] flex items-center justify-center transition"
            title="Open / Import Image (Ctrl+O)"
          >
            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onOpenExportModal}
            className="w-5 h-5 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white flex items-center justify-center transition shadow-sm"
            title="Export Artwork (Ctrl+E)"
          >
            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>

        <div className="w-[1px] h-3 bg-[#3a3a3a]" />

        {/* Compact Zoom & Fit Controls */}
        <div className="flex items-center bg-[#202020] border border-[#383838] rounded-[2px] px-1 py-0 text-[10px] text-zinc-300">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(10, z - 25))}
            className="w-4 h-4 flex items-center justify-center hover:bg-[#383838] hover:text-white transition"
            title="Zoom Out (Ctrl+-)"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="px-1.5 font-mono hover:text-[#31a8ff] transition"
            title="Reset Zoom to 100% (Ctrl+1)"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(500, z + 25))}
            className="w-4 h-4 flex items-center justify-center hover:bg-[#383838] hover:text-white transition"
            title="Zoom In (Ctrl++)"
          >
            +
          </button>
          <button
            type="button"
            onClick={onFitToScreen}
            className="ml-1 px-1.5 rounded-[2px] bg-[#2b2b2b] hover:bg-[#383838] text-[#31a8ff] hover:text-white text-[9px] font-semibold transition"
            title="Fit Canvas to Screen (Ctrl+0)"
          >
            FIT
          </button>
        </div>
      </div>
    </header>
  );
}
