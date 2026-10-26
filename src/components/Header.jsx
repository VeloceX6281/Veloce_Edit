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
  onDuplicateLayer,
  onLayerViaCopy,
  onLayerViaCut,
  onArrangeLayer,
  onToggleClippingMask,
  onMergeDown,
  onMergeVisible,
  onFlattenImage,
  onToggleLockTransparency,
  isTransparencyLocked = false,
  onCopy,
  onCopyMerged,
  onPaste,
  onPasteInPlace,
  onOpenFillModal,
  onOpenImageSize,
  onOpenCanvasSize,
  onSaveProject,
  layersCount = 1,
  showRulers,
  onToggleRulers,
  showGuides,
  onToggleGuides,
  onSelectAll,
  onDeselect,
  onInvertMarquee,
  onFreeTransform,
  documentName = 'Untitled-1.psd',
  // Tonal Adjustments props
  onOpenLevels,
  onOpenCurves,
  onOpenHueSat,
  onOpenColorBalance,
  onDesaturate,
  // Phase 6C props
  onOpenSaveForWeb,
  onRevert,
  onReselect,
  onOpenFeather,
  screenMode = 'standard',
  setScreenMode,
  showPixelGrid = false,
  onTogglePixelGrid,
  snapEnabled = true,
  onToggleSnap,
  lockGuides = false,
  onToggleLockGuides,
  onActualPixels,
  onNewProject,
  onPrint,
  onCut,
  onInvertColors,
  onAutoTone,
  onZoomIn,
  onZoomOut
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
        { label: 'New Project...', shortcut: 'Ctrl+N', action: () => (onNewProject ? onNewProject() : (onClearCanvas && onClearCanvas())) },
        { label: 'Open / Import Image...', shortcut: 'Ctrl+O', action: () => fileInputRef.current?.click() },
        { divider: true },
        { label: 'Save Project (.json)...', shortcut: 'Ctrl+S', action: onSaveProject },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: onOpenExportModal },
        { label: 'Save for Web...', shortcut: 'Alt+Shift+Ctrl+S', action: onOpenSaveForWeb },
        { label: 'Export As (PNG, JPEG, WebP)...', shortcut: 'Ctrl+E', action: onOpenExportModal },
        { label: 'Quick Export as PNG', action: onOpenExportModal },
        { divider: true },
        { label: 'Revert', shortcut: 'F12', action: onRevert },
        { label: 'Print...', shortcut: 'Ctrl+P', action: onPrint },
        { divider: true },
        { label: 'Close Document', shortcut: 'Ctrl+W', action: () => onClearCanvas && onClearCanvas() }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      children: [
        { label: 'Undo', shortcut: 'Ctrl+Z / F1', action: onUndo, disabled: !canUndo },
        { label: 'Redo', shortcut: 'Ctrl+Shift+Z / Ctrl+Y', action: onRedo, disabled: !canRedo },
        { divider: true },
        { label: 'Cut', shortcut: 'Ctrl+X / F2', action: onCut || onLayerViaCut },
        { label: 'Copy', shortcut: 'Ctrl+C / F3', action: () => onCopy && onCopy(false) },
        { label: 'Copy Merged', shortcut: 'Ctrl+Shift+C', action: () => onCopyMerged && onCopyMerged() },
        { label: 'Paste', shortcut: 'Ctrl+V / F4', action: () => onPaste && onPaste(false) },
        { label: 'Paste in Place', shortcut: 'Ctrl+Shift+V', action: () => onPasteInPlace && onPasteInPlace() },
        { divider: true },
        { label: 'Fill...', shortcut: 'Shift+F5', action: onOpenFillModal },
        { label: 'Free Transform', shortcut: 'Ctrl+T', action: onFreeTransform },
        { label: 'Deselect', shortcut: 'Ctrl+D', action: onDeselect },
        { label: 'Clear Active Layer', shortcut: 'Del', action: onClearCanvas },
        { divider: true },
        { label: 'Preferences...', shortcut: 'Ctrl+K', disabled: true }
      ]
    },
    {
      id: 'image',
      label: 'Image',
      children: [
        { label: 'Mode: RGB Color (8 Bit)', disabled: true, checked: true },
        { divider: true },
        {
          label: 'Adjustments',
          submenu: [
            { label: 'Levels...', shortcut: 'Ctrl+L', action: onOpenLevels },
            { label: 'Curves...', shortcut: 'Ctrl+M', action: onOpenCurves },
            { label: 'Hue/Saturation...', shortcut: 'Ctrl+U', action: onOpenHueSat },
            { label: 'Color Balance...', shortcut: 'Ctrl+B', action: onOpenColorBalance },
            { divider: true },
            { label: 'Desaturate', shortcut: 'Ctrl+Shift+U', action: onDesaturate },
            { label: 'Auto Tone', shortcut: 'Ctrl+Shift+L', action: onAutoTone }
          ]
        },
        { divider: true },
        { label: 'Image Size...', shortcut: 'Ctrl+Alt+I', action: onOpenImageSize },
        { label: 'Canvas Size...', shortcut: 'Ctrl+Alt+C', action: onOpenCanvasSize },
        { divider: true },
        { label: 'Invert Colors', shortcut: 'Ctrl+I', action: onInvertColors }
      ]
    },
    {
      id: 'layer',
      label: 'Layer',
      children: [
        { label: 'New Layer', shortcut: 'Shift+Ctrl+N', action: onAddLayer },
        { label: 'Layer via Copy', shortcut: 'Ctrl+J', action: onLayerViaCopy },
        { label: 'Layer via Cut', shortcut: 'Shift+Ctrl+J', action: onLayerViaCut },
        { label: 'Duplicate Layer', action: onDuplicateLayer },
        { label: 'Delete Layer', action: onDeleteLayer, disabled: layersCount <= 1 },
        { divider: true },
        {
          label: 'Arrange',
          submenu: [
            { label: 'Bring to Front', shortcut: 'Ctrl+Shift+]', action: () => onArrangeLayer && onArrangeLayer('front') },
            { label: 'Bring Forward', shortcut: 'Ctrl+]', action: () => onArrangeLayer && onArrangeLayer('forward') },
            { label: 'Send Backward', shortcut: 'Ctrl+[', action: () => onArrangeLayer && onArrangeLayer('backward') },
            { label: 'Send to Back', shortcut: 'Ctrl+Shift+[', action: () => onArrangeLayer && onArrangeLayer('back') }
          ]
        },
        { divider: true },
        {
          label: 'Lock Transparency',
          shortcut: '/',
          checked: isTransparencyLocked,
          action: onToggleLockTransparency
        },
        {
          label: 'Create / Release Clipping Mask',
          shortcut: 'Ctrl+Alt+G',
          action: onToggleClippingMask
        },
        { divider: true },
        {
          label: 'Merge Down',
          shortcut: 'Ctrl+E',
          action: onMergeDown,
          disabled: layersCount <= 1
        },
        {
          label: 'Merge Visible',
          shortcut: 'Shift+Ctrl+E',
          action: onMergeVisible,
          disabled: layersCount <= 1
        },
        {
          label: 'Flatten Image',
          action: onFlattenImage,
          disabled: layersCount <= 1
        }
      ]
    },
    {
      id: 'select',
      label: 'Select',
      children: [
        { label: 'All', shortcut: 'Ctrl+A', action: onSelectAll },
        { label: 'Deselect', shortcut: 'Ctrl+D', action: onDeselect },
        { label: 'Reselect', shortcut: 'Shift+Ctrl+D', action: onReselect },
        { label: 'Inverse Selection', shortcut: 'Shift+Ctrl+I', action: onInvertMarquee },
        { divider: true },
        {
          label: 'Modify',
          submenu: [
            { label: 'Feather...', shortcut: 'Shift+F6', action: onOpenFeather }
          ]
        },
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
        { label: 'Levels...', shortcut: 'Ctrl+L', action: onOpenLevels },
        { label: 'Curves...', shortcut: 'Ctrl+M', action: onOpenCurves },
        { label: 'Hue/Saturation...', shortcut: 'Ctrl+U', action: onOpenHueSat },
        { label: 'Color Balance...', shortcut: 'Ctrl+B', action: onOpenColorBalance },
        { divider: true },
        { label: 'Grayscale / Desaturate', shortcut: 'Shift+Ctrl+U', action: onDesaturate }
      ]
    },
    {
      id: 'view',
      label: 'View',
      children: [
        { label: '100% (Actual Pixels)', shortcut: 'Ctrl+1 / Ctrl+Alt+0', action: onActualPixels },
        { label: 'Fit on Screen', shortcut: 'Ctrl+0', action: onFitToScreen },
        { label: 'Zoom In', shortcut: 'Ctrl++', action: onZoomIn || (() => setZoom((z) => Math.min(500, Math.round(z * 1.25)))) },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', action: onZoomOut || (() => setZoom((z) => Math.max(10, Math.round(z / 1.25)))) },
        { divider: true },
        {
          label: 'Screen Mode',
          submenu: [
            {
              label: 'Standard Screen Mode',
              shortcut: 'F',
              checked: screenMode === 'standard',
              action: () => setScreenMode && setScreenMode('standard')
            },
            {
              label: 'Full Screen Mode with Menu Bar',
              checked: screenMode === 'menu_fullscreen',
              action: () => setScreenMode && setScreenMode('menu_fullscreen')
            },
            {
              label: 'Full Screen Mode (Canvas Only)',
              checked: screenMode === 'pure_canvas',
              action: () => setScreenMode && setScreenMode('pure_canvas')
            }
          ]
        },
        { divider: true },
        {
          label: 'Show',
          submenu: [
            { label: 'Pixel Grid', shortcut: "Ctrl+'", action: onTogglePixelGrid, checked: showPixelGrid },
            { label: 'Guides', shortcut: 'Ctrl+;', action: onToggleGuides, checked: showGuides },
            { label: 'Rulers', shortcut: 'Ctrl+R', action: onToggleRulers, checked: showRulers }
          ]
        },
        { label: 'Rulers', shortcut: 'Ctrl+R', action: onToggleRulers, checked: showRulers },
        { label: 'Guides', shortcut: 'Ctrl+;', action: onToggleGuides, checked: showGuides },
        { label: 'Snap', shortcut: 'Shift+Ctrl+;', action: onToggleSnap, checked: snapEnabled },
        { label: 'Lock Guides', shortcut: 'Alt+Ctrl+;', action: onToggleLockGuides, checked: lockGuides }
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
        { label: 'About VeloceEdit (Photoshop Web)', action: () => alert('VeloceEdit - 1:1 Adobe Photoshop Desktop Parity') },
        {
          label: 'Keyboard Shortcuts Cheatsheet',
          action: () =>
            alert(
              'V: Move\nM: Marquee\nL: Lasso / Polygonal Lasso\nW: Magic Wand\nC: Crop\nI: Eyedropper\nJ: Spot Healing\nB: Brush\nS: Clone Stamp\nE: Eraser / Magic Eraser\nG: Gradient / Paint Bucket\nO: Dodge / Burn / Sponge\nQ: Quick Mask Mode\nF: Cycle Screen Modes\nT: Text\nU: Shapes\nH: Hand\nZ: Zoom\nCtrl+L: Levels\nCtrl+M: Curves\nCtrl+U: Hue/Saturation\nCtrl+B: Color Balance\nShift+Ctrl+U: Desaturate\nShift+F6: Feather Selection\nShift+Ctrl+D: Reselect\nCtrl+1: Actual Pixels (100%)\nCtrl+\': Pixel Grid\nShift+Ctrl+;: Snap\nAlt+Ctrl+;: Lock Guides\nAlt+Shift+Ctrl+S: Save for Web\nF12: Revert'
            )
        }
      ]
    }
  ];

  return (
    <header
      ref={menuBarRef}
      className="h-7 bg-[#282828] border-b border-[#181818] flex items-center justify-between px-2 z-30 select-none text-[11px] font-sans shrink-0"
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
          className="w-5 h-5 bg-[#001e36] text-[#31a8ff] font-bold text-[10px] flex items-center justify-center rounded-[2px] border border-[#003764] mr-1 shadow-sm select-none cursor-default font-sans"
          title="Adobe Photoshop Desktop Web (VeloceEdit)"
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
                    className="absolute left-0 top-6 min-w-[215px] bg-[#222222] border border-[#3a3a3a] py-1 shadow-2xl z-50 text-[11px] text-zinc-200 rounded-[2px]"
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    {menu.children.map((child, idx) => {
                      if (child.divider) {
                        return <div key={idx} className="h-[1px] bg-[#333333] my-1" />;
                      }

                      if (child.submenu) {
                        return (
                          <div key={idx} className="relative group/sub w-full">
                            <div
                              className={`w-full px-3 py-1 text-left flex items-center justify-between gap-4 transition cursor-default ${
                                child.disabled
                                  ? 'text-zinc-600 cursor-not-allowed'
                                  : 'hover:bg-[#1473e6] hover:text-white text-zinc-200'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-2" />
                                {child.label}
                              </span>
                              <span className="text-[9px] text-zinc-400">▶</span>
                            </div>
                            <div className="hidden group-hover/sub:block absolute left-full top-0 min-w-[200px] bg-[#222222] border border-[#3a3a3a] py-1 shadow-2xl z-50 text-[11px] text-zinc-200 rounded-[2px]">
                              {child.submenu.map((sub, sIdx) => {
                                if (sub.divider) {
                                  return <div key={sIdx} className="h-[1px] bg-[#333333] my-1" />;
                                }
                                return (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    disabled={sub.disabled}
                                    onClick={() => {
                                      if (sub.action) sub.action();
                                      setActiveMenu(null);
                                    }}
                                    className={`w-full px-3 py-1 text-left flex items-center justify-between gap-4 transition ${
                                      sub.disabled
                                        ? 'text-zinc-600 cursor-not-allowed'
                                        : 'hover:bg-[#1473e6] hover:text-white text-zinc-200'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      {sub.checked ? (
                                        <span className="text-[10px] w-2 text-[#31a8ff]">✓</span>
                                      ) : (
                                        <span className="w-2" />
                                      )}
                                      {sub.label}
                                    </span>
                                    {sub.shortcut && (
                                      <span className="text-[10px] text-zinc-500 font-mono">
                                        {sub.shortcut}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
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
                              <span className="text-[10px] w-2 text-[#31a8ff]">✓</span>
                            ) : (
                              <span className="w-2" />
                            )}
                            {child.label}
                          </span>
                          {child.shortcut && (
                            <span className="text-[10px] text-zinc-500 font-mono">
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

      {/* Right Controls: Document Info, Quick Actions, Compact Zoom */}
      <div className="flex items-center gap-2 text-zinc-400">
        <div className="text-[10px] text-zinc-400 font-mono hidden md:inline-block">
          <span className="text-zinc-300">{documentName}</span> @ {zoom}% (RGB/8#)
        </div>

        <div className="w-[1px] h-3 bg-[#3a3a3a]" />

        {/* Compact Quick Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-5 h-5 rounded-[2px] bg-[#1c1c1c] hover:bg-[#383838] hover:text-white text-zinc-300 border border-[#3a3a3a] flex items-center justify-center transition"
            title="Open / Import Image (Ctrl+O)"
          >
            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onOpenSaveForWeb}
            className="w-5 h-5 rounded-[2px] bg-[#1c1c1c] hover:bg-[#383838] hover:text-white text-zinc-300 border border-[#3a3a3a] flex items-center justify-center transition"
            title="Save for Web (Alt+Shift+Ctrl+S)"
          >
            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onOpenExportModal}
            className="w-5 h-5 rounded-[2px] bg-[#1473e6] hover:bg-[#0d66d0] text-white flex items-center justify-center transition shadow-sm"
            title="Export Artwork (Ctrl+E)"
          >
            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>

        <div className="w-[1px] h-3 bg-[#3a3a3a]" />

        {/* Compact Zoom & Fit Controls */}
        <div className="flex items-center bg-[#1c1c1c] border border-[#3a3a3a] rounded-[2px] px-1 py-0 text-[10px] text-zinc-300">
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
            onClick={onActualPixels}
            className="px-1.5 font-mono hover:text-[#31a8ff] transition"
            title="100% Actual Pixels (Ctrl+1)"
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
            className="ml-1 px-1.5 rounded-[2px] bg-[#282828] hover:bg-[#383838] text-[#31a8ff] hover:text-white text-[9px] font-semibold transition"
            title="Fit Canvas to Screen (Ctrl+0)"
          >
            FIT
          </button>
        </div>
      </div>
    </header>
  );
}
