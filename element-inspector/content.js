/**
 * content.js – Element Inspector & Copier (v1.7.0)
 *
 * Injected into the active tab by the background service worker.
 * Uses a closed Shadow DOM container with inline styles so host-page
 * CSP (Content Security Policy) can NEVER block the inspector styling.
 *
 * Includes:
 * - 🖼️ Image Detection, Thumbnail Preview, Lightbox View, Binary Copy & Download
 * - 📸 JPG Element Screenshot Capture & Clipboard Sync
 * - 🔓 Unlock Client-side Constraints (disabled, readonly, maxlength, pattern)
 * - 👁️ Show/Unhide Passwords
 * - ⚡ 1-Click Boundary & Probe Test Data Injector
 * - 🎭 Ready-to-use Playwright & Cypress Automation Locators
 * - 📋 Copy Styled Rich Text, Plain Text, Selectors, and XPaths
 */

(() => {
  // Clean up any stale or orphaned shadow hosts from prior extension reloads on the current tab
  document.querySelectorAll('#__ei-shadow-host').forEach(el => el.remove());

  // Allow re-injection / initialization on extension reload
  window.__eiInitialized = true;

  // ─── Constants ────────────────────────────────────────────────────────────

  const SHADOW_HOST_ID = '__ei-shadow-host';

  // ─── Inline CSS (Immune to CSP restrictions) ──────────────────────────────

  const INLINE_STYLES = `
:host, * {
  box-sizing: border-box !important;
  margin: 0 !important;
  padding: 0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
  letter-spacing: normal !important;
  text-transform: none !important;
}

.ei-highlight {
  display: none;
  position: fixed !important;
  pointer-events: none !important;
  z-index: 2147483646 !important;
  background-color: rgba(59, 130, 246, 0.18) !important;
  border: 2px solid #3b82f6 !important;
  border-radius: 3px !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 0 0 1px rgba(59, 130, 246, 0.3) !important;
  transition: top 0.04s ease-out, left 0.04s ease-out, width 0.04s ease-out, height 0.04s ease-out !important;
}

.ei-highlight::after {
  content: attr(data-label) !important;
  position: absolute !important;
  top: -24px !important;
  left: -2px !important;
  background: #1d4ed8 !important;
  color: #ffffff !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  font-family: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace !important;
  padding: 2px 7px !important;
  border-radius: 4px 4px 4px 0 !important;
  white-space: nowrap !important;
  max-width: 380px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  pointer-events: none !important;
  line-height: 18px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
}

.mv-inspect-card {
  display: none;
  position: fixed !important;
  z-index: 2147483647 !important;
  pointer-events: auto !important;
  width: 340px !important;
  max-width: calc(100vw - 20px) !important;
  max-height: 92vh !important;
  background: #14151f !important;
  color: #e2e8f0 !important;
  border: 1px solid #2d3148 !important;
  border-radius: 12px !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.65), 0 4px 14px rgba(0, 0, 0, 0.4) !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  animation: mv-card-in 0.16s cubic-bezier(0.16, 1, 0.3, 1) both !important;
}

.mv-inspect-card.mv-active {
  display: flex !important;
  flex-direction: column !important;
}

.mv-inspect-card.mv-capturing,
#__ei-shadow-host.mv-capturing {
  display: none !important;
}

.mv-inspect-card::-webkit-scrollbar,
.mv-inspect-card *::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.mv-inspect-card,
.mv-inspect-card * {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

@keyframes mv-card-in {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── Side Panel Mode (Ask Gemini Style) ─────────────────── */
.mv-inspect-card.mv-side-panel {
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: auto !important;
  width: 380px !important;
  max-width: 95vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  border-radius: 14px 0 0 14px !important;
  border-right: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: 1px solid #2d3148 !important;
  box-shadow: -10px 0 36px rgba(0, 0, 0, 0.65), -2px 0 10px rgba(0, 0, 0, 0.4) !important;
  animation: mv-sidepanel-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both !important;
}

.mv-inspect-card.mv-side-panel .mv-inspect-header {
  cursor: default !important;
}

@keyframes mv-sidepanel-in {
  from {
    transform: translateX(100%);
    opacity: 0.8;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Side Resize Handle on left border */
.mv-side-resize-handle {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  bottom: 0 !important;
  width: 6px !important;
  cursor: ew-resize !important;
  z-index: 25 !important;
  display: none;
  transition: background 0.15s ease !important;
}

.mv-inspect-card.mv-side-panel .mv-side-resize-handle {
  display: block !important;
}

.mv-side-resize-handle:hover,
.mv-side-resize-handle.mv-resizing {
  background: rgba(56, 189, 248, 0.6) !important;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6) !important;
}

/* Dock toggle button */
.mv-btn-dock {
  font-size: 11px !important;
  padding: 3px 6px !important;
}

.mv-btn-dock.mv-docked {
  color: #38bdf8 !important;
  border-color: rgba(56, 189, 248, 0.4) !important;
}

/* ── Global Topbar (Row 1: Brand, Mode Pill, Controls) ── */
.mv-global-topbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 6px 10px !important;
  background: #090a10 !important;
  border-bottom: 1px solid #1f2233 !important;
  cursor: grab !important;
  user-select: none !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 12 !important;
  gap: 6px !important;
}

.mv-global-topbar:active {
  cursor: grabbing !important;
}

.mv-inspect-card.mv-side-panel .mv-global-topbar {
  cursor: default !important;
}

.mv-global-brand {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 11.5px !important;
  font-weight: 700 !important;
  color: #f1f5f9 !important;
  letter-spacing: 0.2px !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.mv-global-brand-icon {
  color: #38bdf8 !important;
  font-size: 13px !important;
}

/* Global Segmented Mode Pill (Inspect <-> Free Click) */
.mv-mode-pill {
  display: inline-flex !important;
  align-items: center !important;
  background: #141622 !important;
  border: 1px solid #262a3d !important;
  border-radius: 20px !important;
  padding: 2px !important;
  gap: 2px !important;
  flex-shrink: 0 !important;
}

.mv-mode-tab {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 3px 8px !important;
  border-radius: 14px !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  border: none !important;
  background: transparent !important;
  color: #94a3b8 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  white-space: nowrap !important;
  line-height: 1.2 !important;
}

.mv-mode-tab:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

.mv-mode-tab-inspect.active {
  background: #2563eb !important;
  color: #ffffff !important;
  box-shadow: 0 1px 6px rgba(37, 99, 235, 0.5) !important;
}

.mv-mode-tab-free.active {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.6) !important;
  animation: mv-pulse-live 2s infinite ease-in-out !important;
}

.mv-mode-hotkey {
  font-size: 9px !important;
  padding: 1px 4px !important;
  border-radius: 3px !important;
  background: rgba(0, 0, 0, 0.3) !important;
  color: #cbd5e1 !important;
  font-family: ui-monospace, "SFMono-Regular", Consolas, monospace !important;
}

/* Global Window Controls (Right: Dock, Minimize, Close) */
.mv-window-controls {
  display: flex !important;
  align-items: center !important;
  gap: 3px !important;
  flex-shrink: 0 !important;
}

.mv-win-btn {
  background: transparent !important;
  border: 1px solid transparent !important;
  color: #94a3b8 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  width: 22px !important;
  height: 22px !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  transition: all 0.12s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  line-height: 1 !important;
}

.mv-win-btn:hover {
  background: #222638 !important;
  color: #ffffff !important;
  border-color: #333850 !important;
}

.mv-win-btn.mv-btn-close:hover {
  background: rgba(239, 68, 68, 0.25) !important;
  color: #f87171 !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
}

.mv-win-btn.mv-btn-dock.mv-docked {
  color: #38bdf8 !important;
  background: rgba(56, 189, 248, 0.12) !important;
  border-color: rgba(56, 189, 248, 0.3) !important;
}

/* ── Element Header (Row 2: Tag, Dimensions & Actions) ── */
.mv-inspect-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 7px 10px !important;
  background: #0e1019 !important;
  border-bottom: 1px solid #202436 !important;
  cursor: grab !important;
  user-select: none !important;
  z-index: 10 !important;
}

.mv-inspect-header:active {
  cursor: grabbing !important;
}

/* ── Tab Bar ─────────────────────────────────────────────── */
.mv-tab-bar {
  display: flex !important;
  background: #080910 !important;
  border-bottom: 1px solid #1a1d2e !important;
  flex-shrink: 0 !important;
}

.mv-tab-btn {
  flex: 1 !important;
  padding: 8px 4px !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  color: #4b5563 !important;
  background: transparent !important;
  border: none !important;
  border-bottom: 2px solid transparent !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  letter-spacing: 0.01em !important;
  white-space: nowrap !important;
}

.mv-tab-btn:hover {
  color: #94a3b8 !important;
  background: rgba(255,255,255,0.03) !important;
}

.mv-tab-btn.active {
  color: #38bdf8 !important;
  border-bottom-color: #38bdf8 !important;
  background: rgba(56,189,248,0.06) !important;
}

.mv-tab-btn[data-tab="design"].active {
  color: #fb923c !important;
  border-bottom-color: #fb923c !important;
  background: rgba(251,146,60,0.06) !important;
}

.mv-tab-btn[data-tab="qa"].active {
  color: #a78bfa !important;
  border-bottom-color: #a78bfa !important;
  background: rgba(167,139,250,0.06) !important;
}

/* ── Tab Panels ──────────────────────────────────────────── */
.mv-tab-panel {
  display: none !important;
}

.mv-tab-panel.active {
  display: block !important;
}

.mv-inspect-tag-group {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  min-width: 0 !important;
  flex: 1 !important;
}

.mv-inspect-tag-badge {
  font-family: ui-monospace, "SFMono-Regular", Consolas, Menlo, monospace !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #60a5fa !important;
  background: rgba(37, 99, 235, 0.18) !important;
  border: 1px solid rgba(96, 165, 250, 0.3) !important;
  padding: 2px 7px !important;
  border-radius: 5px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 170px !important;
}

.mv-inspect-dims {
  font-family: ui-monospace, "SFMono-Regular", Consolas, Menlo, monospace !important;
  font-size: 10.5px !important;
  color: #94a3b8 !important;
  background: #1e2133 !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
  border: 1px solid #2d3148 !important;
  white-space: nowrap !important;
}

.mv-header-actions {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  flex-shrink: 0 !important;
}

.mv-btn-icon {
  background: #1e2133 !important;
  border: 1px solid #2d3148 !important;
  color: #94a3b8 !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 3px 7px !important;
  border-radius: 5px !important;
  cursor: pointer !important;
  transition: all 0.14s ease !important;
  line-height: 1 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.mv-btn-icon:hover {
  background: #2b304c !important;
  color: #e2e8f0 !important;
  border-color: #43496d !important;
}

.mv-btn-parent {
  color: #c084fc !important;
  border-color: rgba(192, 132, 252, 0.3) !important;
  background: rgba(192, 132, 252, 0.1) !important;
}

.mv-btn-parent:hover {
  background: rgba(192, 132, 252, 0.22) !important;
  color: #e9d5ff !important;
}

.mv-btn-screenshot {
  color: #38bdf8 !important;
  border-color: rgba(56, 189, 248, 0.3) !important;
  background: rgba(56, 189, 248, 0.1) !important;
}

.mv-btn-screenshot:hover {
  background: rgba(56, 189, 248, 0.22) !important;
  color: #7dd3fc !important;
}

.mv-btn-minimize {
  font-size: 15px !important;
  font-weight: 700 !important;
  padding: 1px 7px !important;
  line-height: 1 !important;
  color: #94a3b8 !important;
  border-color: rgba(148, 163, 184, 0.3) !important;
}

.mv-btn-minimize:hover {
  background: rgba(148, 163, 184, 0.22) !important;
  color: #ffffff !important;
  border-color: rgba(148, 163, 184, 0.5) !important;
}

.mv-btn-close {
  font-size: 13px !important;
  padding: 3px 6px !important;
}

.mv-btn-close:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  color: #f87171 !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

/* ── Minimized Card State ───────────────────────────────── */
.mv-inspect-card.mv-minimized {
  height: 38px !important;
  min-height: 38px !important;
  max-height: 38px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.mv-inspect-card.mv-side-panel.mv-minimized {
  height: 38px !important;
  min-height: 38px !important;
  max-height: 38px !important;
  top: 10px !important;
  right: 10px !important;
  border-radius: 8px !important;
  border: 1px solid rgba(99, 102, 241, 0.4) !important;
  box-shadow: -4px 4px 24px rgba(0, 0, 0, 0.7) !important;
}

.mv-inspect-card.mv-minimized > *:not(.mv-global-topbar) {
  display: none !important;
}

.mv-inspect-card.mv-minimized .mv-global-topbar {
  border-bottom: none !important;
  cursor: pointer !important;
}

.mv-inspect-card.mv-minimized .mv-side-resize-handle {
  display: none !important;
}

.mv-inspect-metrics {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 6px 10px !important;
  background: #0d0e17 !important;
  padding: 8px 12px !important;
  border-bottom: 1px solid #25283c !important;
}

.mv-metric-item {
  display: flex !important;
  align-items: baseline !important;
  gap: 6px !important;
  min-width: 0 !important;
  font-size: 11px !important;
}

.mv-metric-lbl {
  color: #64748b !important;
  font-weight: 600 !important;
  font-size: 10.5px !important;
  flex-shrink: 0 !important;
}

.mv-metric-val {
  color: #cbd5e1 !important;
  font-family: ui-monospace, "SFMono-Regular", Consolas, Menlo, monospace !important;
  font-size: 10.5px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
}

.mv-color-dot {
  display: inline-block !important;
  width: 9px !important;
  height: 9px !important;
  border-radius: 2px !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  flex-shrink: 0 !important;
}

.mv-snippet-wrap {
  padding: 8px 12px !important;
  background: #14151f !important;
  border-bottom: 1px solid #25283c !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 5px !important;
}

.mv-snippet-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  color: #94a3b8 !important;
}

.mv-snippet-hint {
  font-size: 9.5px !important;
  color: #64748b !important;
}

.mv-snippet-code {
  font-family: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace !important;
  font-size: 10.5px !important;
  line-height: 1.45 !important;
  color: #4ade80 !important;
  background: #090a10 !important;
  border: 1px solid #25283c !important;
  border-radius: 6px !important;
  padding: 7px 9px !important;
  max-height: 64px !important;
  overflow-x: auto !important;
  overflow-y: auto !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  user-select: text !important;
  cursor: pointer !important;
  transition: border-color 0.15s !important;
}

.mv-snippet-code:hover {
  border-color: #3b82f6 !important;
}

.mv-snippet-code::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.mv-snippet-code {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.mv-actions-section {
  padding: 8px 12px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 7px !important;
}

.mv-primary-copy-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  width: 100% !important;
  padding: 6px 10px !important;
  background: #2563eb !important;
  color: #ffffff !important;
  border: 1px solid #3b82f6 !important;
  border-radius: 6px !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.mv-primary-copy-btn:hover {
  background: #1d4ed8 !important;
  border-color: #60a5fa !important;
}

.mv-primary-copy-btn:active {
  transform: translateY(1px) !important;
}

.mv-chips-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 5px !important;
}

.mv-action-chip {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 5px 8px !important;
  background: #1e2133 !important;
  color: #cbd5e1 !important;
  border: 1px solid #2d3148 !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  font-size: 10.5px !important;
  font-weight: 500 !important;
  transition: all 0.14s ease !important;
  user-select: none !important;
}

.mv-action-chip:hover {
  background: #292d47 !important;
  border-color: #43496d !important;
  color: #ffffff !important;
}

.mv-action-chip:active {
  transform: translateY(1px) !important;
}

.mv-chip-icon {
  font-family: ui-monospace, "SFMono-Regular", Consolas, Menlo, monospace !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  color: #60a5fa !important;
  background: rgba(96, 165, 250, 0.15) !important;
  padding: 1px 4px !important;
  border-radius: 3px !important;
  margin-right: 5px !important;
}

.mv-chip-text {
  flex: 1 !important;
  text-align: left !important;
}

/* ── QA & PenTest Interactive Section ───────────────────── */
.mv-qa-section {
  padding: 8px 12px 10px !important;
  background: #090a10 !important;
  border-top: 1px solid #25283c !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 7px !important;
}

.mv-qa-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #f59e0b !important;
}

.mv-qa-header-right {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.mv-locale-toggle {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 1px 6px !important;
  background: #1e2133 !important;
  color: #38bdf8 !important;
  border: 1px solid #0284c7 !important;
  border-radius: 4px !important;
  font-size: 9.5px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.12s ease !important;
  user-select: none !important;
}

.mv-locale-toggle:hover {
  background: #0284c7 !important;
  color: #ffffff !important;
}

.mv-qa-badge {
  font-size: 9.5px !important;
  font-weight: 600 !important;
  color: #fbbf24 !important;
  background: rgba(245, 158, 11, 0.15) !important;
  padding: 1px 5px !important;
  border-radius: 4px !important;
  border: 1px solid rgba(245, 158, 11, 0.3) !important;
}

.mv-qa-actions-row {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 5px !important;
}

.mv-qa-btn-profile {
  background: #181b2a !important;
  border-color: #334155 !important;
  color: #94a3b8 !important;
}

.mv-qa-btn-profile:hover {
  background: #334155 !important;
  color: #f8fafc !important;
  border-color: #64748b !important;
}

.mv-qa-file-section {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  margin-top: 2px !important;
  padding-top: 6px !important;
  border-top: 1px dashed #25283c !important;
}

.mv-qa-file-grid {
  display: grid !important;
  grid-template-columns: repeat(5, 1fr) !important;
  gap: 4px !important;
}

.mv-qa-chip--file {
  font-size: 9px !important;
  padding: 4px 2px !important;
  background: #141b2d !important;
  border-color: #2563eb !important;
  color: #93c5fd !important;
}

.mv-qa-chip--file:hover {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #60a5fa !important;
}

.mv-qa-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 5px !important;
  padding: 5px 8px !important;
  background: #1e2133 !important;
  color: #cbd5e1 !important;
  border: 1px solid #2d3148 !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  transition: all 0.14s ease !important;
}

.mv-qa-btn:hover {
  background: #2b304c !important;
  border-color: #f59e0b !important;
  color: #ffffff !important;
}

.mv-qa-btn-sm {
  font-size: 10px !important;
  padding: 4px 6px !important;
}

.mv-qa-btn-primary {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #3b82f6 !important;
}

.mv-qa-btn-primary:hover {
  background: #1d4ed8 !important;
  border-color: #60a5fa !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4) !important;
}

.mv-qa-btn-sub {
  background: #0f172a !important;
  color: #38bdf8 !important;
  border-color: #0284c7 !important;
}

.mv-qa-btn-sub:hover {
  background: #0284c7 !important;
  border-color: #38bdf8 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35) !important;
}

.mv-qa-fill-label {
  font-size: 10px !important;
  font-weight: 600 !important;
  color: #94a3b8 !important;
  margin-top: 2px !important;
}

.mv-qa-fill-grid {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 4px !important;
}

.mv-qa-chip {
  padding: 4px 5px !important;
  background: #141624 !important;
  color: #94a3b8 !important;
  border: 1px solid #25283c !important;
  border-radius: 5px !important;
  cursor: pointer !important;
  font-size: 9.5px !important;
  font-weight: 600 !important;
  text-align: center !important;
  transition: all 0.12s ease !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.mv-qa-chip:hover {
  background: #1e2133 !important;
  color: #f59e0b !important;
  border-color: #d97706 !important;
}

.mv-qa-btn-curl {
  background: #2e1065 !important;
  color: #c084fc !important;
  border-color: #7c3aed !important;
}

.mv-qa-btn-curl:hover {
  background: #7c3aed !important;
  color: #ffffff !important;
  border-color: #a855f7 !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4) !important;
}

.mv-qa-security-section {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  margin-top: 2px !important;
  padding-top: 6px !important;
  border-top: 1px dashed #25283c !important;
}

.mv-qa-security-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 4px !important;
}

.mv-qa-chip-security {
  font-size: 9px !important;
  padding: 4px 2px !important;
  background: #1c141d !important;
  border-color: #831843 !important;
  color: #f472b6 !important;
}

.mv-qa-chip-security:hover {
  background: #9d174d !important;
  color: #ffffff !important;
  border-color: #f43f5e !important;
}

.mv-copy--success {
  background: #10b981 !important;
  color: #ffffff !important;
  border-color: #34d399 !important;
  font-weight: 700 !important;
}

.mv-copy--error {
  background: #ef4444 !important;
  color: #ffffff !important;
  border-color: #f87171 !important;
}

.mv-card-footer {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 6px 12px 8px !important;
  background: #0d0e17 !important;
  border-top: 1px solid #25283c !important;
  font-size: 10px !important;
  color: #64748b !important;
}

.mv-footer-tip {
  white-space: nowrap !important;
}

.mv-exit-btn {
  background: transparent !important;
  border: none !important;
  color: #f87171 !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  padding: 2px 5px !important;
  border-radius: 3px !important;
  transition: all 0.12s !important;
}

.mv-exit-btn:hover {
  background: rgba(239, 68, 68, 0.15) !important;
}

.ei-toast {
  position: fixed !important;
  bottom: 24px !important;
  left: 50% !important;
  transform: translateX(-50%) translateY(14px) !important;
  background: #14151f !important;
  color: #e2e8f0 !important;
  font-size: 12.5px !important;
  font-weight: 500 !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  border: 1px solid #3b82f6 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
  pointer-events: none !important;
  z-index: 2147483647 !important;
  opacity: 0 !important;
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  white-space: nowrap !important;
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
}

.ei-toast--visible {
  opacity: 1 !important;
  transform: translateX(-50%) translateY(0) !important;
}

/* ── Annotation Editor Modal ────────────────────────────── */
.ei-annotator-modal {
  display: none;
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483647 !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 16px !important;
  pointer-events: auto !important;
}

.ei-annotator-backdrop {
  position: absolute !important;
  inset: 0 !important;
  background: rgba(0, 0, 0, 0.72) !important;
  backdrop-filter: blur(4px) !important;
}

.ei-annotator-dialog {
  position: relative !important;
  z-index: 10 !important;
  display: flex !important;
  flex-direction: column !important;
  max-width: 94vw !important;
  max-height: 92vh !important;
  background: #14151f !important;
  border: 1px solid #2d3148 !important;
  border-radius: 12px !important;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85) !important;
  overflow: hidden !important;
  animation: mv-card-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both !important;
}

.ei-annotator-toolbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  padding: 8px 14px !important;
  background: #0d0e17 !important;
  border-bottom: 1px solid #25283c !important;
  user-select: none !important;
  flex-wrap: wrap !important;
}

.ei-annotator-tools {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.ei-annotator-title {
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #60a5fa !important;
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
}

.ei-color-picker {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: #1e2133 !important;
  padding: 2px 6px !important;
  border-radius: 6px !important;
  border: 1px solid #2d3148 !important;
}

.ei-color-btn {
  width: 17px !important;
  height: 17px !important;
  border-radius: 50% !important;
  border: 2px solid transparent !important;
  cursor: pointer !important;
  transition: transform 0.12s, border-color 0.12s !important;
  padding: 0 !important;
}

.ei-color-btn:hover {
  transform: scale(1.15) !important;
}

.ei-color-btn.active {
  border-color: #ffffff !important;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35) !important;
  transform: scale(1.1) !important;
}

.ei-tool-btn {
  background: #1e2133 !important;
  border: 1px solid #2d3148 !important;
  color: #cbd5e1 !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 4px 8px !important;
  border-radius: 5px !important;
  cursor: pointer !important;
  transition: all 0.14s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.ei-tool-btn:hover {
  background: #2b304c !important;
  color: #ffffff !important;
  border-color: #43496d !important;
}

.ei-annotator-actions {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.ei-btn-copy {
  background: #1e293b !important;
  border-color: rgba(59, 130, 246, 0.4) !important;
  color: #60a5fa !important;
}

.ei-btn-copy:hover {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #3b82f6 !important;
}

.ei-btn-save {
  background: #2563eb !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}

.ei-btn-save:hover {
  background: #1d4ed8 !important;
  border-color: #60a5fa !important;
}

.ei-btn-download-png {
  background: #1e293b !important;
  border-color: rgba(56, 189, 248, 0.4) !important;
  color: #38bdf8 !important;
}

.ei-btn-download-png:hover {
  background: #0284c7 !important;
  color: #ffffff !important;
  border-color: #38bdf8 !important;
}

.ei-btn-close {
  padding: 3px 8px !important;
  font-size: 13px !important;
}

.ei-btn-close:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  color: #f87171 !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
}

.ei-annotator-canvas-wrap {
  position: relative !important;
  overflow: auto !important;
  padding: 14px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #090a10 !important;
  max-width: 100% !important;
  max-height: calc(92vh - 65px) !important;
}

#ei-draw-canvas {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
  border: 1px solid #2d3148 !important;
  border-radius: 4px !important;
  cursor: crosshair !important;
  max-width: 100% !important;
  max-height: calc(92vh - 95px) !important;
  object-fit: contain !important;
  display: block !important;
}

/* ─── Selected Element Box & Ruler Guides ────────────────────────────────── */

.ei-selected-box {
  position: fixed !important;
  pointer-events: none !important;
  z-index: 2147483644 !important;
  border: 2px solid #3b82f6 !important;
  background: rgba(59, 130, 246, 0.08) !important;
  box-sizing: border-box !important;
  border-radius: 2px !important;
  transition: all 0.05s ease !important;
  display: none;
}

.ei-selected-box::after {
  content: attr(data-label);
  position: absolute !important;
  top: -24px !important;
  left: 0 !important;
  background: #2563eb !important;
  color: #ffffff !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 2px 6px !important;
  border-radius: 3px !important;
  white-space: nowrap !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) !important;
  pointer-events: none !important;
}

.ei-ruler-container {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  pointer-events: none !important;
  z-index: 2147483645 !important;
  overflow: visible !important;
  display: none;
}

.ei-ruler-line {
  position: absolute !important;
  background: #f43f5e !important;
  pointer-events: none !important;
}

.ei-ruler-line--h {
  height: 1.5px !important;
}

.ei-ruler-line--v {
  width: 1.5px !important;
}

.ei-ruler-badge {
  position: absolute !important;
  background: #f43f5e !important;
  color: #ffffff !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 10.5px !important;
  font-weight: 700 !important;
  padding: 1.5px 5px !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35) !important;
  transform: translate(-50%, -50%) !important;
  white-space: nowrap !important;
  pointer-events: none !important;
  z-index: 2147483646 !important;
}

/* ─── Designer & UI/UX Tools Card Section ────────────────────────────────── */

.mv-design-section {
  background: #141724;
  border: 1px solid #282c40;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.mv-design-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mv-design-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #f472b6;
  display: flex;
  align-items: center;
  gap: 5px;
}

.mv-btn-ruler {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2.5px 7px;
  background: #1e2235;
  border: 1px solid #374151;
  border-radius: 5px;
  color: #cbd5e1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
}

.mv-btn-ruler:hover {
  background: #282e47;
  color: #ffffff;
  border-color: #f43f5e;
}

.mv-btn-ruler.mv-ruler--active {
  background: rgba(244, 63, 94, 0.2);
  color: #f43f5e;
  border-color: #f43f5e;
  box-shadow: 0 0 8px rgba(244, 63, 94, 0.3);
}

/* Color Palette Swatches */
.mv-palette-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mv-palette-label {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mv-palette-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.mv-palette-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #1a1d2e;
  border: 1px solid #2e334d;
  border-radius: 5px;
  padding: 3px 6px;
  cursor: pointer;
  font-size: 10.5px;
  font-family: ui-monospace, monospace;
  color: #e2e8f0;
  transition: all 0.15s ease;
}

.mv-palette-chip:hover {
  background: #252a42;
  border-color: #f472b6;
  transform: translateY(-1px);
}

.mv-palette-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.mv-palette-tag {
  font-size: 9px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
}

/* Typography Panel */
.mv-typo-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mv-typo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.mv-typo-item {
  background: #1a1d2e;
  border: 1px solid #2a2f46;
  border-radius: 5px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mv-typo-key {
  font-size: 9px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.mv-typo-val {
  font-size: 11px;
  color: #f1f5f9;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mv-btn-copy-typo {
  background: #1e2235;
  border: 1px solid #374151;
  border-radius: 5px;
  color: #38bdf8;
  padding: 3px 6px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.mv-btn-copy-typo:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
}

/* Tailwind CSS Converter Box */
.mv-tailwind-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mv-tailwind-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mv-tailwind-title {
  font-size: 10px;
  font-weight: 600;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mv-btn-copy-tailwind {
  background: #0369a1;
  border: 1px solid #38bdf8;
  color: #ffffff;
  border-radius: 4px;
  padding: 2.5px 7px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mv-btn-copy-tailwind:hover {
  background: #0284c7;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
}

.mv-tailwind-code {
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 5px;
  padding: 6px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  color: #a5f3fc;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 65px;
  overflow-y: auto;
  user-select: all;
}

/* Figma Design Exporter Box */
.mv-figma-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(168, 85, 247, 0.08);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 6px;
  padding: 8px;
}

.mv-figma-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mv-figma-title {
  font-size: 10px;
  font-weight: 700;
  color: #c084fc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mv-figma-badge {
  font-size: 9px;
  font-weight: 600;
  background: rgba(168, 85, 247, 0.2);
  color: #e9d5ff;
  border: 1px solid rgba(168, 85, 247, 0.4);
  border-radius: 10px;
  padding: 1px 6px;
}

.mv-figma-btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  border: 1px solid #c084fc;
  color: #ffffff;
  border-radius: 5px;
  padding: 6.5px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.35);
}

.mv-figma-btn-primary:hover {
  background: linear-gradient(135deg, #6d28d9 0%, #7e22ce 100%);
  border-color: #e9d5ff;
  box-shadow: 0 0 12px rgba(192, 132, 252, 0.5);
}

.mv-figma-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.mv-figma-btn {
  background: #1e1b4b;
  border: 1px solid #7c3aed;
  color: #f3e8ff;
  border-radius: 5px;
  padding: 5px 6px;
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.mv-figma-btn:hover {
  background: #4c1d95;
  border-color: #a855f7;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
}

.mv-figma-btn-svg {
  background: linear-gradient(135deg, #2e1065 0%, #3b0764 100%);
  border-color: #9333ea;
}

.mv-figma-btn-svg:hover {
  background: linear-gradient(135deg, #4c1d95 0%, #581c87 100%);
  border-color: #c084fc;
}

.mv-figma-btn-png {
  background: linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%);
  border-color: #6366f1;
}

.mv-figma-btn-png:hover {
  background: linear-gradient(135deg, #312e81 0%, #334155 100%);
  border-color: #818cf8;
}

/* QA Fake File Options Row */
.mv-qa-file-selectors-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 6px !important;
  background: #0d121f !important;
  border: 1px solid #1e293b !important;
  border-radius: 6px !important;
  padding: 4px 6px !important;
  margin-bottom: 2px !important;
}

.mv-qa-file-opt {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  flex: 1 !important;
  min-width: 0 !important;
}

.mv-qa-file-opt .mv-qa-size-select {
  flex: 1 !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

/* QA MaxLength & Length Boundary Testing Box */
.mv-qa-maxlen-box {
  background: rgba(99, 102, 241, 0.07) !important;
  border: 1px solid rgba(99, 102, 241, 0.28) !important;
  border-radius: 6px !important;
  padding: 6px 8px !important;
  margin-top: 4px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 5px !important;
}

.mv-qa-maxlen-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}

.mv-qa-maxlen-title {
  font-size: 10px !important;
  font-weight: 700 !important;
  color: #a5b4fc !important;
}

.mv-qa-cur-maxlen {
  font-size: 9px !important;
  font-weight: 700 !important;
  color: #38bdf8 !important;
  background: #181b2a !important;
  border: 1px solid #334155 !important;
  border-radius: 3px !important;
  padding: 1px 5px !important;
}

.mv-qa-maxlen-row {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.mv-qa-maxlen-select-wrap {
  display: flex !important;
  align-items: center !important;
  gap: 3px !important;
  flex: 1.1 !important;
  min-width: 0 !important;
}

.mv-qa-maxlen-select-wrap .mv-qa-size-select {
  flex: 1 !important;
  min-width: 0 !important;
}

.mv-qa-btn-fill-len {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 4px !important;
  font-size: 9.5px !important;
  font-weight: 700 !important;
  padding: 3px 7px !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: all 0.15s ease !important;
}

.mv-qa-btn-fill-len:hover {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%) !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4) !important;
}

.mv-qa-btn-set-len {
  background: #181b2a !important;
  color: #cbd5e1 !important;
  border: 1px solid #334155 !important;
  border-radius: 4px !important;
  font-size: 9px !important;
  font-weight: 600 !important;
  padding: 3px 6px !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: all 0.15s ease !important;
}

.mv-qa-btn-set-len:hover {
  background: #1e293b !important;
  color: #ffffff !important;
  border-color: #64748b !important;
}

.mv-qa-maxlen-chips {
  display: flex !important;
  gap: 3px !important;
  overflow-x: auto !important;
}

.mv-qa-chip-len {
  background: #181b2a !important;
  color: #c7d2fe !important;
  border: 1px solid #282f45 !important;
  border-radius: 3px !important;
  font-size: 8.5px !important;
  font-weight: 600 !important;
  padding: 2px 5px !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: all 0.15s ease !important;
}

.mv-qa-chip-len:hover {
  background: #312e81 !important;
  color: #ffffff !important;
  border-color: #818cf8 !important;
}
`;

  // ─── State ────────────────────────────────────────────────────────────────

  let inspectMode   = false;
  let hoveredEl     = null;
  let selectedEl    = null;
  let shadowHost    = null;
  let shadowRoot    = null;
  let highlightBox  = null;
  let selectedBox   = null;
  let rulerContainer = null;
  let inspectCard   = null;
  let isRulerMode   = false;
  let isAltKeyDown  = false;
  let isCardMinimized = false;

  // Side Panel state (Ask Gemini style right drawer)
  let isSidePanelMode     = true;
  let isResizingSidePanel = false;
  let sidePanelWidth      = 380;
  try {
    const savedMode = localStorage.getItem('ei_side_panel');
    if (savedMode === 'false') isSidePanelMode = false;
    const savedWidth = parseInt(localStorage.getItem('ei_side_panel_width') || '380', 10);
    if (savedWidth >= 280 && savedWidth <= 800) sidePanelWidth = savedWidth;
  } catch (_) {}

  // Floating position memory (prevents card from jumping when clicking different elements)
  let floatingPosX        = null;
  let floatingPosY        = null;
  let hasUserDraggedCard  = false;

  // Annotator state
  let annotatorModal    = null;
  let annotatorCanvas   = null;
  let annotatorCtx      = null;
  let baseCanvas        = null;
  let currentCapturedEl = null;
  let drawnRectangles   = [];
  let isDrawingRect     = false;
  let rectStartX        = 0;
  let rectStartY        = 0;
  let currentRectColor  = '#ef4444';

  // Dragging state
  let isDragging    = false;
  let dragStartX    = 0;
  let dragStartY    = 0;
  let cardStartX    = 0;
  let cardStartY    = 0;

  // Live Interact / Free Click Mode (allows clicking buttons, submits, links, calendars, years/months freely without closing extension)
  let isInteractiveMode = false;

  function isInsideCalendarOrPicker(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    const calendarSelectors = [
      '.flatpickr-calendar',
      '.react-datepicker',
      '.react-datepicker-popper',
      '.ant-picker-dropdown',
      '.ant-picker-panel',
      '.MuiPickersPopper-root',
      '.MuiDateCalendar-root',
      '.datepicker',
      '.datepicker-dropdown',
      '.p-datepicker',
      '.ui-datepicker',
      '.v-date-picker',
      '.v-picker',
      '.bootstrap-datetimepicker-widget',
      '.daterangepicker',
      '.ngx-daterangepicker-action',
      '.mat-calendar',
      '.mat-datepicker-content',
      '[class*="flatpickr"]',
      '[class*="datepicker"]',
      '[class*="calendar-popup"]',
      '[class*="calendar-dropdown"]',
      '[class*="picker-dropdown"]',
      '[class*="year-panel"]',
      '[class*="month-panel"]',
      '[class*="year-dropdown"]',
      '[class*="month-dropdown"]',
      '[aria-label*="calendar" i]',
      '[aria-label*="date" i][role="dialog"]',
      '[role="dialog"][class*="picker"]',
      '[role="dialog"][class*="calendar"]'
    ];
    return !!(el.closest && el.closest(calendarSelectors.join(',')));
  }

  function setInteractiveMode(enabled) {
    isInteractiveMode = !!enabled;

    // Update Segmented Mode Pill in inspectCard
    if (inspectCard) {
      const tabInspect = inspectCard.querySelector('#mv-tab-inspect');
      const tabFree = inspectCard.querySelector('#mv-tab-free');
      if (tabInspect && tabFree) {
        if (isInteractiveMode) {
          tabInspect.classList.remove('active');
          tabFree.classList.add('active');
        } else {
          tabInspect.classList.add('active');
          tabFree.classList.remove('active');
        }
      }
    }

    if (isInteractiveMode) {
      hideHighlight();
      showToast('🔓 Free Click ON: Click dates, change years & months freely! (Alt+F or Space to Inspect)');
    } else {
      showToast('🔍 Inspect Mode ON: Hover & click to inspect elements');
      if (hoveredEl) positionHighlight(hoveredEl);
    }
  }

  // ─── Inspector Element and Event Detection ────────────────────────────────

  function isInspectorElement(el) {
    if (!el) return false;
    if (el === shadowHost || el === shadowRoot || el === inspectCard || el === highlightBox || el === selectedBox || el === rulerContainer || el === annotatorModal) return true;
    if (el.id === SHADOW_HOST_ID) return true;
    if (el.getAttribute && el.getAttribute('id') === SHADOW_HOST_ID) return true;
    if (el.classList && (el.classList.contains('mv-inspect-card') || el.classList.contains('ei-highlight') || el.classList.contains('ei-selected-box') || el.classList.contains('ei-ruler-container') || el.classList.contains('ei-annotator-modal'))) return true;
    if (shadowRoot && el.getRootNode && el.getRootNode() === shadowRoot) return true;
    if (el.closest && el.closest(`#${SHADOW_HOST_ID}`)) return true;
    return false;
  }

  function isInspectorEvent(e) {
    if (!e) return false;
    if (isInspectorElement(e.target)) return true;
    if (e.composedPath) {
      const path = e.composedPath();
      for (const node of path) {
        if (isInspectorElement(node)) return true;
      }
    }
    return false;
  }

  // ─── Bootstrap Closed Shadow DOM ──────────────────────────────────────────

  function ensureShadowDOM() {
    if (shadowRoot) return;

    // Clean up any stale host element with this ID
    document.querySelectorAll(`#${SHADOW_HOST_ID}`).forEach(el => el.remove());

    shadowHost = document.createElement('div');
    shadowHost.id = SHADOW_HOST_ID;
    Object.assign(shadowHost.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      zIndex: '2147483647',
      pointerEvents: 'none',
      overflow: 'visible',
    });

    document.documentElement.appendChild(shadowHost);

    // Closed shadow root – page scripts cannot inspect or modify internal UI
    shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

    // Inject inline stylesheet directly to bypass host-page CSP (e.g. GitHub)
    const styleEl = document.createElement('style');
    styleEl.textContent = INLINE_STYLES;
    shadowRoot.appendChild(styleEl);

    // Highlight overlay box
    highlightBox = document.createElement('div');
    highlightBox.className = 'ei-highlight';
    shadowRoot.appendChild(highlightBox);

    // Selected element highlight box
    selectedBox = document.createElement('div');
    selectedBox.className = 'ei-selected-box';
    shadowRoot.appendChild(selectedBox);

    // Ruler measurement guides container
    rulerContainer = document.createElement('div');
    rulerContainer.className = 'ei-ruler-container';
    shadowRoot.appendChild(rulerContainer);

    // Construct the inspect card
    buildCardDOM();
  }

  // ─── Build Inspect Card DOM ───────────────────────────────────────────────

  function buildCardDOM() {
    inspectCard = document.createElement('aside');
    inspectCard.className = 'mv-inspect-card';
    inspectCard.id = 'mv-inspect-card';
    inspectCard.setAttribute('aria-label', 'DOM Element Inspector');

    inspectCard.innerHTML = `
      <!-- Left Edge Resize Handle (Side Panel Mode) -->
      <div class="mv-side-resize-handle" id="mv-side-resize-handle" title="Drag to resize panel"></div>

      <!-- Global Topbar Row 1: Brand, Mode Pill, Window Controls -->
      <div class="mv-global-topbar">
        <div class="mv-global-brand">
          <span class="mv-global-brand-icon">⚡</span>
          <span>Inspector</span>
        </div>
        <div class="mv-mode-pill" id="mv-mode-pill">
          <button type="button" class="mv-mode-tab mv-mode-tab-inspect active" id="mv-tab-inspect" title="Inspect Mode: Hover & click elements to inspect (Alt+F or Space)">
            <span>🔍 Inspect</span>
          </button>
          <button type="button" class="mv-mode-tab mv-mode-tab-free" id="mv-tab-free" title="Free Click Mode: Click buttons, links, calendars, years/months freely! (Alt+F or Space)">
            <span>🔓 Free Click</span>
            <span class="mv-mode-hotkey">Alt+F</span>
          </button>
        </div>
        <div class="mv-window-controls">
          <button type="button" class="mv-win-btn mv-btn-dock" id="mv-inspect-dock" title="Toggle Right Side Panel (like Ask Gemini) or Floating Window">📌</button>
          <button type="button" class="mv-win-btn mv-btn-minimize" id="mv-inspect-minimize" title="Minimize (−)">−</button>
          <button type="button" class="mv-win-btn mv-btn-close" id="mv-inspect-close" title="Close (Esc)">✕</button>
        </div>
      </div>

      <!-- Header Row 2: Element Tag, Dimensions & Element Actions -->
      <div class="mv-inspect-header">
        <div class="mv-inspect-tag-group">
          <span class="mv-inspect-tag-badge" id="mv-inspect-tag">&lt;element&gt;</span>
          <span class="mv-inspect-dims" id="mv-inspect-dims">0 × 0 px</span>
        </div>
        <div class="mv-header-actions">
          <button class="mv-btn-icon mv-btn-screenshot" id="mv-inspect-screenshot" title="Capture & download element screenshot as JPG (and copy to clipboard)">📸 JPG</button>
          <button class="mv-btn-icon mv-btn-parent" id="mv-inspect-parent" title="Select parent element" style="display:none;">↑ Parent</button>
          <button class="mv-btn-icon mv-btn-fullpage-nav" id="mv-inspect-fullpage" title="Select Full Page (Body)">🌐 Full Page</button>
        </div>
      </div>

      <!-- ── Tab Navigation Bar ──────────────────────────────── -->
      <div class="mv-tab-bar">
        <button class="mv-tab-btn active" data-tab="inspect" title="Inspect & Code — metrics, selectors, copy actions">🔍 Inspect</button>
        <button class="mv-tab-btn" data-tab="design" title="Design Tools — colors, fonts, Tailwind, Figma">🎨 Design</button>
        <button class="mv-tab-btn" data-tab="qa" title="QA & PenTest — auto-fill, triggers, security payloads">⚡ QA</button>
      </div>

      <!-- ── Tab Panel: Inspect & Code ─────────────────────── -->
      <div class="mv-tab-panel active" id="mv-panel-inspect">

      <!-- Quick Computed Metrics -->
      <div class="mv-inspect-metrics">
        <div class="mv-metric-item">
          <span class="mv-metric-lbl">Font:</span>
          <span class="mv-metric-val" id="mv-inspect-font">-</span>
        </div>
        <div class="mv-metric-item">
          <span class="mv-metric-lbl">Color:</span>
          <span class="mv-metric-val" id="mv-inspect-color">
            <span class="mv-color-dot" id="mv-inspect-color-dot"></span>
            <span id="mv-inspect-color-txt">-</span>
          </span>
        </div>
        <div class="mv-metric-item">
          <span class="mv-metric-lbl">Padding:</span>
          <span class="mv-metric-val" id="mv-inspect-padding">-</span>
        </div>
        <div class="mv-metric-item">
          <span class="mv-metric-lbl">Margin:</span>
          <span class="mv-metric-val" id="mv-inspect-margin">-</span>
        </div>
      </div>

      <!-- HTML Snippet Preview -->
      <div class="mv-snippet-wrap">
        <div class="mv-snippet-header">
          <span>HTML Snippet</span>
          <span class="mv-snippet-hint">Click code to copy</span>
        </div>
        <pre class="mv-snippet-code" id="mv-inspect-code" tabindex="0" title="Click to copy HTML snippet"></pre>
      </div>

      <!-- Copy Actions Grid -->
      <div class="mv-actions-section">
        <button class="mv-primary-copy-btn" id="mv-inspect-copy-btn">
          <span>📋 Copy HTML Snippet</span>
        </button>
        <div class="mv-chips-grid">
          <button class="mv-action-chip" data-copy="selector" title="Unique CSS selector path">
            <span class="mv-chip-icon">#</span>
            <span class="mv-chip-text">CSS Selector</span>
          </button>
          <button class="mv-action-chip" data-copy="jspath" title="document.querySelector(...) snippet">
            <span class="mv-chip-icon">JS</span>
            <span class="mv-chip-text">JS Path</span>
          </button>
          <button class="mv-action-chip" data-copy="xpath" title="Relative XPath with ID shortcut">
            <span class="mv-chip-icon">//</span>
            <span class="mv-chip-text">XPath</span>
          </button>
          <button class="mv-action-chip" data-copy="fullxpath" title="Absolute XPath from document root">
            <span class="mv-chip-icon">/</span>
            <span class="mv-chip-text">Full XPath</span>
          </button>
          <button class="mv-action-chip" data-copy="styles" title="Computed CSS styling key-value rules">
            <span class="mv-chip-icon">CSS</span>
            <span class="mv-chip-text">Styles</span>
          </button>
          <button class="mv-action-chip" data-copy="outerhtml" title="Full raw element.outerHTML string">
            <span class="mv-chip-icon">&lt;&gt;</span>
            <span class="mv-chip-text">Outer HTML</span>
          </button>
          <button class="mv-action-chip" data-copy="innertext" title="Copy clean, plain text content">
            <span class="mv-chip-icon">T</span>
            <span class="mv-chip-text">Inner Text</span>
          </button>
          <button class="mv-action-chip" data-copy="styledtext" title="Copy text with web formatting & styles (Google Docs, Word, Gmail, Slack)">
            <span class="mv-chip-icon">✨</span>
            <span class="mv-chip-text">Styled Text</span>
          </button>
          <button class="mv-action-chip" data-copy="tailwind" title="Computed styles translated to Tailwind CSS utility classes">
            <span class="mv-chip-icon">🌊</span>
            <span class="mv-chip-text">Tailwind</span>
          </button>
          <button class="mv-action-chip" data-copy="figmasvg" title="Copy element as editable SVG vector for direct paste into Figma (Ctrl+V)">
            <span class="mv-chip-icon">❖</span>
            <span class="mv-chip-text">Figma SVG</span>
          </button>
        </div>
      </div>

      </div><!-- /mv-panel-inspect -->

      <!-- ── Tab Panel: Design ──────────────────────────────── -->
      <div class="mv-tab-panel" id="mv-panel-design">

      <!-- UI/UX & Design Tools Section -->
      <div class="mv-design-section" id="mv-design-section">
        <div class="mv-design-header">
          <div class="mv-design-title">
            <span>🎨</span> <span>Designer &amp; UI/UX Tools</span>
          </div>
          <button class="mv-btn-ruler" id="mv-btn-toggle-ruler" title="Toggle real-time distance ruler guide to any hovered element (or hold Alt in inspect mode)">
            <span>📏</span> <span>Ruler (Alt)</span>
          </button>
        </div>

        <!-- Color Palette Swatches -->
        <div class="mv-palette-wrap" id="mv-palette-wrap">
          <div class="mv-palette-label">🎨 Color Palette:</div>
          <div class="mv-palette-grid" id="mv-palette-grid">
            <span style="font-size:10px; color:#64748b;">No colors extracted</span>
          </div>
        </div>

        <!-- Typography & Font Inspector -->
        <div class="mv-typo-wrap" id="mv-typo-wrap">
          <div class="mv-typo-grid" id="mv-typo-grid">
            <div class="mv-typo-item">
              <span class="mv-typo-key">Font</span>
              <span class="mv-typo-val" id="mv-typo-family">-</span>
            </div>
            <div class="mv-typo-item">
              <span class="mv-typo-key">Size / Weight</span>
              <span class="mv-typo-val" id="mv-typo-size-weight">-</span>
            </div>
            <div class="mv-typo-item">
              <span class="mv-typo-key">Line Height</span>
              <span class="mv-typo-val" id="mv-typo-line-height">-</span>
            </div>
            <div class="mv-typo-item">
              <span class="mv-typo-key">Spacing / Align</span>
              <span class="mv-typo-val" id="mv-typo-align">-</span>
            </div>
          </div>
          <button class="mv-btn-copy-typo" id="mv-btn-copy-font" title="Copy complete font CSS styling">
            <span>📋</span> <span>Copy Font CSS</span>
          </button>
        </div>

        <!-- Tailwind CSS Converter -->
        <div class="mv-tailwind-wrap" id="mv-tailwind-wrap">
          <div class="mv-tailwind-header">
            <div class="mv-tailwind-title">
              <span>⚡</span> <span>Tailwind CSS</span>
            </div>
            <button class="mv-btn-copy-tailwind" id="mv-btn-copy-tailwind" title="Copy translated Tailwind CSS utility classes">
              <span>📋</span> <span>Copy Tailwind</span>
            </button>
          </div>
          <div class="mv-tailwind-code" id="mv-tailwind-code" title="Click to copy Tailwind classes" tabindex="0">
            flex items-center justify-between
          </div>
        </div>

        <!-- Figma Design Exporter -->
        <div class="mv-figma-wrap" id="mv-figma-wrap">
          <div class="mv-figma-header">
            <div class="mv-figma-title">
              <span>❖</span> <span>Figma Design Exporter</span>
            </div>
            <span class="mv-figma-badge">Ctrl+V Ready</span>
          </div>

          <!-- Primary: Selected vs Full Page Layout -->
          <div class="mv-figma-primary-row">
            <button class="mv-figma-btn-primary" id="mv-btn-copy-figma-real" title="Copy selected element with clean background and editable text overlay">
              <span>❖</span> <span>Copy Selected</span>
            </button>
            <button class="mv-figma-btn-fullpage" id="mv-btn-copy-figma-fullpage" title="Copy entire visible page layout (Full Screen) with clean graphics and editable text into Figma">
              <span>🌐</span> <span>Full Page Layout</span>
            </button>
          </div>

          <div class="mv-figma-actions">
            <button class="mv-figma-btn mv-figma-btn-svg" id="mv-btn-copy-figma-svg" title="Copy pure editable vector shapes & text (No background image underneath)">
              <span>📐</span> <span>Pure Vector</span>
            </button>
            <button class="mv-figma-btn mv-figma-btn-png" id="mv-btn-copy-figma-png" title="Copy single 1:1 pixel-perfect PNG image layer">
              <span>🖼️</span> <span>Single PNG</span>
            </button>
          </div>
        </div>
      </div>

      </div><!-- /mv-panel-design -->

      <!-- ── Tab Panel: QA & PenTest ────────────────────────── -->
      <div class="mv-tab-panel" id="mv-panel-qa">

      <!-- QA & PenTest Interactive Tools Section -->
      <div class="mv-qa-section" id="mv-qa-section">
        <div class="mv-qa-header">
          <span>⚡ QA &amp; PenTest Tools</span>
          <div class="mv-qa-header-right">
            <button class="mv-locale-toggle" id="mv-locale-toggle" title="Switch data generator locale (Lao / English)">🇱🇦 LA</button>
            <span class="mv-qa-badge" id="mv-qa-type-badge">Element</span>
          </div>
        </div>

        <!-- Click / Submit Trigger for clickable elements -->
        <div class="mv-qa-actions-row" id="mv-row-trigger-click" style="display:none;">
          <button class="mv-qa-btn mv-qa-btn-trigger" id="mv-btn-trigger-click" style="grid-column: span 2;" title="Trigger a real native click/submit on this element without closing inspector">
            <span>▶</span> <span id="mv-trigger-click-text">Click / Submit Element</span>
          </button>
        </div>

        <!-- Utility Actions -->
        <div class="mv-qa-actions-row">
          <button class="mv-qa-btn" id="mv-btn-unlock" title="Remove disabled, readonly, maxlength, pattern, and required constraints">
            <span>🔓</span> <span>Unlock Constraints</span>
          </button>
          <button class="mv-qa-btn" id="mv-btn-showpass" title="Toggle password visibility (type=password <-> text)">
            <span>👁️</span> <span>Show Password</span>
          </button>
        </div>

        <!-- Automated Test Locators -->
        <div class="mv-qa-actions-row">
          <button class="mv-qa-btn mv-qa-btn-sm" id="mv-btn-playwright" title="Copy ready-to-run Playwright automation script">
            <span>🎭 Playwright</span>
          </button>
          <button class="mv-qa-btn mv-qa-btn-sm" id="mv-btn-cypress" title="Copy ready-to-run Cypress automation script">
            <span>🌲 Cypress</span>
          </button>
        </div>

        <!-- Form to cURL Exporter -->
        <div class="mv-qa-actions-row">
          <button class="mv-qa-btn mv-qa-btn-curl" id="mv-btn-copy-curl" style="grid-column: span 2;" title="Generate and copy complete ready-to-run cURL command for this form">
            <span>🌐</span> <span>Copy Form as cURL</span>
          </button>
        </div>

        <!-- Form State Profile Save & Restore -->
        <div class="mv-qa-actions-row">
          <button class="mv-qa-btn mv-qa-btn-sm mv-qa-btn-profile" id="mv-btn-save-form" title="Save current form values to memory/storage">
            <span>💾 Save Form</span>
          </button>
          <button class="mv-qa-btn mv-qa-btn-sm mv-qa-btn-profile" id="mv-btn-restore-form" title="Restore saved form values">
            <span>📂 Restore Form</span>
          </button>
        </div>

        <!-- Random Auto-Fill Tools -->
        <div class="mv-qa-actions-row">
          <button class="mv-qa-btn mv-qa-btn-primary" id="mv-btn-random-input" title="Smartly detect input type and auto-fill realistic random data (Email, Name, Phone, Number, etc.)">
            <span>🎲</span> <span>Random Input</span>
          </button>
          <button class="mv-qa-btn mv-qa-btn-sub" id="mv-btn-fill-form" title="Auto-fill ALL input fields inside this form or container with realistic random test data">
            <span>⚡</span> <span>Fill Entire Form</span>
          </button>
        </div>

        <!-- 1-Click Fake File Attach with Size & Filename Length Selectors -->
        <div class="mv-qa-file-section" id="mv-qa-file-section">
          <div class="mv-qa-file-header-row">
            <div class="mv-qa-fill-label">📁 1-Click Fake File Attach:</div>
          </div>
          <div class="mv-qa-file-selectors-row">
            <div class="mv-qa-file-opt">
              <label for="mv-qa-file-size" class="mv-qa-size-lbl">Size:</label>
              <select id="mv-qa-file-size" class="mv-qa-size-select" title="Select fake file size to attach">
                <option value="51200">50 KB</option>
                <option value="256000">250 KB</option>
                <option value="512000">500 KB</option>
                <option value="1048576" selected>1 MB (Default)</option>
                <option value="2097152">2 MB</option>
                <option value="5242880">5 MB</option>
                <option value="10485760">10 MB</option>
                <option value="15728640">15 MB (Limit)</option>
                <option value="26214400">25 MB</option>
                <option value="custom">✏️ Custom...</option>
              </select>
            </div>
            <div class="mv-qa-file-opt">
              <label for="mv-qa-file-namelen" class="mv-qa-size-lbl">Name:</label>
              <select id="mv-qa-file-namelen" class="mv-qa-size-select" title="Select length of file name">
                <option value="normal" selected>Normal (~15)</option>
                <option value="5">Short (5 chars)</option>
                <option value="30">Medium (30)</option>
                <option value="50">Long (50)</option>
                <option value="100">100 chars</option>
                <option value="255">255 (DB Limit)</option>
                <option value="300">300 (Overflow)</option>
                <option value="custom">✏️ Custom...</option>
              </select>
            </div>
          </div>
          <div class="mv-qa-file-grid">
            <button class="mv-qa-chip mv-qa-chip--file" data-file="pdf" title="Attach valid PDF (test_document.pdf)">📄 PDF</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="doc" title="Attach Word .doc document (sample_document.doc)">📝 DOC</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="docx" title="Attach Word .docx document (sample_document.docx)">📘 DOCX</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="xls" title="Attach Excel .xls spreadsheet (sample_sheet.xls)">📊 XLS</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="xlsx" title="Attach Excel .xlsx spreadsheet (sample_sheet.xlsx)">📗 XLSX</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="ppt" title="Attach PowerPoint presentation (sample_presentation.pptx)">📽️ PPT</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="png" title="Attach PNG image (sample_image.png)">🖼️ PNG</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="jpg" title="Attach sample JPG image (sample_photo.jpg)">🖼️ JPG</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="zip" title="Attach ZIP archive (archive_files.zip)">📦 ZIP</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="rar" title="Attach RAR archive (archive_files.rar)">🗜️ RAR</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="csv" title="Attach spreadsheet CSV (sample_data.csv)">📈 CSV</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="invalid" title="Attach script file to test security filter (malicious.exe)">🚫 .exe</button>
          </div>
        </div>

        <!-- Input MaxLength & Length Boundary Testing -->
        <div class="mv-qa-maxlen-box" id="mv-qa-maxlen-box">
          <div class="mv-qa-maxlen-header">
            <span class="mv-qa-maxlen-title">📏 Input MaxLength &amp; Boundary Test:</span>
            <span class="mv-qa-cur-maxlen" id="mv-qa-cur-maxlen" title="Current DOM maxlength on selected element">Max: None</span>
          </div>
          <div class="mv-qa-maxlen-row">
            <div class="mv-qa-maxlen-select-wrap">
              <label for="mv-qa-maxlen-select" class="mv-qa-size-lbl">Len:</label>
              <select id="mv-qa-maxlen-select" class="mv-qa-size-select" title="Select string length to fill or test">
                <option value="detect" selected>🎯 Exact MaxLength (Auto)</option>
                <option value="overflow">⚠️ MaxLength + 1 (Overflow)</option>
                <option value="10">10 chars</option>
                <option value="20">20 chars</option>
                <option value="50">50 chars</option>
                <option value="100">100 chars</option>
                <option value="255">255 chars (VARCHAR)</option>
                <option value="500">500 chars</option>
                <option value="1000">1,000 chars</option>
                <option value="5000">5,000 chars</option>
                <option value="custom">✏️ Custom length...</option>
              </select>
            </div>
            <button class="mv-qa-btn-fill-len" id="mv-btn-fill-maxlen" title="Fill selected input with exactly the chosen number of characters">
              <span>⚡ Fill</span>
            </button>
            <button class="mv-qa-btn-set-len" id="mv-btn-set-dom-maxlen" title="Set DOM maxlength attribute on this input to the selected length">
              <span>⚙️ Set Max</span>
            </button>
          </div>
          <div class="mv-qa-maxlen-chips">
            <button class="mv-qa-chip-len" data-len="exact" title="Fill exact maxlength (from input.maxlength or 50)">Exact Max</button>
            <button class="mv-qa-chip-len" data-len="overflow" title="Fill maxlength + 1 to test boundary cutoff">Max + 1</button>
            <button class="mv-qa-chip-len" data-len="50" title="Fill 50 characters">50</button>
            <button class="mv-qa-chip-len" data-len="100" title="Fill 100 characters">100</button>
            <button class="mv-qa-chip-len" data-len="255" title="Fill 255 characters (DB varchar limit)">255</button>
            <button class="mv-qa-chip-len" data-len="1000" title="Fill 1,000 characters">1K</button>
          </div>
        </div>

        <!-- Quick Random & Test Data Fillers -->
        <div class="mv-qa-fill-label">🎲 Quick Random &amp; Test Data Fill:</div>
        <div class="mv-qa-fill-grid">
          <button class="mv-qa-chip" data-fill="rand-name" title="Fill random full name">
            <span>👤 Name</span>
          </button>
          <button class="mv-qa-chip" data-fill="rand-email" title="Fill random valid email">
            <span>📧 Email</span>
          </button>
          <button class="mv-qa-chip" data-fill="rand-phone" title="Fill random phone number (e.g. 02055667788)">
            <span>📱 Phone</span>
          </button>
          <button class="mv-qa-chip" data-fill="rand-date" title="Fill today or random valid date (YYYY-MM-DD)">
            <span>📅 Date</span>
          </button>
          <button class="mv-qa-chip" data-fill="rand-pass" title="Fill strong random password (e.g. Pass@9821_Secure!)">
            <span>🔑 Password</span>
          </button>
          <button class="mv-qa-chip" data-fill="rand-text" title="Fill random message / paragraph">
            <span>📝 Text</span>
          </button>
          <button class="mv-qa-chip" data-fill="number" title="Fill integer boundary number: 999999999">
            <span>Max Number</span>
          </button>
          <button class="mv-qa-chip" data-fill="long" title="Fill 300-character boundary test string">
            <span>Long (300)</span>
          </button>
          <button class="mv-qa-chip" data-fill="special" title="Fill special characters: !@#$%^&*()_+-=[]{}|;':&quot;,<>?">
            <span>Special Chars</span>
          </button>
          <button class="mv-qa-chip" data-fill="unicode" title="Fill international Unicode & emojis: 🚀🌟测试اختبار">
            <span>Unicode / Emoji</span>
          </button>
          <button class="mv-qa-chip" data-fill="probe" title="Fill benign encoding test probe: &lt;test'&quot;&gt;">
            <span>HTML Probe</span>
          </button>
          <button class="mv-qa-chip" data-fill="clear" title="Clear input value completely" style="grid-column: span 2;">
            <span>🧹 Clear Input</span>
          </button>
        </div>

        <!-- Security & PenTest Input Validation Payloads -->
        <div class="mv-qa-security-section" id="mv-qa-security-section">
          <div class="mv-qa-fill-label">🛡️ Security &amp; PenTest Payloads:</div>
          <div class="mv-qa-security-grid">
            <button class="mv-qa-chip mv-qa-chip-security" data-fill="sql-auth" title="SQL Auth Bypass: ' OR '1'='1">💉 SQL Auth</button>
            <button class="mv-qa-chip mv-qa-chip-security" data-fill="sql-comment" title="SQL Comment: admin' --">💉 SQL Comm</button>
            <button class="mv-qa-chip mv-qa-chip-security" data-fill="xss-script" title="XSS Tag: &lt;script&gt;alert(1)&lt;/script&gt;">🛡️ XSS Script</button>
            <button class="mv-qa-chip mv-qa-chip-security" data-fill="xss-img" title="XSS Img: &lt;img src=x onerror=alert(1)&gt;">🛡️ XSS Img</button>
            <button class="mv-qa-chip mv-qa-chip-security" data-fill="ssti-brace" title="Template Injection: {{7*7}}">⚡ SSTI {{7*7}}</button>
            <button class="mv-qa-chip mv-qa-chip-security" data-fill="ssti-dollar" title="Template Injection: ${7*7}">⚡ SSTI ${7*7}</button>
            <button class="mv-qa-chip mv-qa-chip-security" data-fill="cmd-pipe" title="Command Injection: | dir">💻 OS Pipe</button>
            <button class="mv-qa-chip mv-qa-chip-security" data-fill="cmd-semi" title="Command Injection: ; ls -la">💻 OS Semi</button>
          </div>
        </div>
      </div><!-- /mv-qa-section -->

      </div><!-- /mv-panel-qa -->

      <!-- Interaction Shortcut Tip -->
      <div class="mv-inspect-footer-hint" id="mv-inspect-footer-hint">
        💡 Tip: Hold <kbd>Ctrl</kbd>+Click or switch to <kbd>👆 Live</kbd> to submit forms &amp; open links without closing!
      </div>

      <!-- Card Footer -->
      <div class="mv-card-footer">
        <span class="mv-footer-tip">Drag header to move • Esc to close</span>
        <button class="mv-exit-btn" id="mv-exit-btn">⏹ Exit Inspect</button>
      </div>
    `;

    shadowRoot.appendChild(inspectCard);

    // Stop propagation from within the inspectCard so clicks never bubble to document
    inspectCard.addEventListener('mousedown', (e) => e.stopPropagation());
    inspectCard.addEventListener('click', (e) => e.stopPropagation());

    // Initialize Side Panel state (Ask Gemini style)
    if (isSidePanelMode) {
      inspectCard.classList.add('mv-side-panel');
      inspectCard.style.width = `${sidePanelWidth}px`;
    }

    // Bind event listeners inside Card
    const closeBtn = inspectCard.querySelector('#mv-inspect-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideCard();
    });

    // ── Content Tab Switching (Inspect / Design / QA) ─────────────────
    inspectCard.querySelectorAll('.mv-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        inspectCard.querySelectorAll('.mv-tab-btn').forEach(b => b.classList.remove('active'));
        inspectCard.querySelectorAll('.mv-tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = inspectCard.querySelector(`#mv-panel-${btn.dataset.tab}`);
        if (panel) panel.classList.add('active');
      });
    });

    // Minimize button (−)
    const minimizeBtn = inspectCard.querySelector('#mv-inspect-minimize');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMinimizeCard();
      });
    }

    // Mode Tabs inside Global Topbar (🔍 Inspect <-> 🔓 Free Click)
    const tabInspect = inspectCard.querySelector('#mv-tab-inspect');
    const tabFree = inspectCard.querySelector('#mv-tab-free');
    if (tabInspect) {
      tabInspect.addEventListener('click', (e) => {
        e.stopPropagation();
        setInteractiveMode(false);
      });
    }
    if (tabFree) {
      tabFree.addEventListener('click', (e) => {
        e.stopPropagation();
        setInteractiveMode(true);
      });
    }

    // Double-click topbar or header to toggle minimize/expand
    const globalTopbar = inspectCard.querySelector('.mv-global-topbar');
    if (globalTopbar) {
      globalTopbar.addEventListener('dblclick', (e) => {
        if (e.target.closest('button')) return;
        toggleMinimizeCard();
      });
    }

    const inspectHeader = inspectCard.querySelector('.mv-inspect-header');
    if (inspectHeader) {
      inspectHeader.addEventListener('dblclick', (e) => {
        if (e.target.closest('button')) return;
        toggleMinimizeCard();
      });
    }

    // Dock toggle button (Side Panel <-> Floating Window)
    const dockBtn = inspectCard.querySelector('#mv-inspect-dock');
    if (dockBtn) {
      const updateDockBtnUI = () => {
        if (isSidePanelMode) {
          dockBtn.innerHTML = '🗗';
          dockBtn.title = 'Switch to Floating Window';
          dockBtn.classList.add('mv-docked');
        } else {
          dockBtn.innerHTML = '📌';
          dockBtn.title = 'Dock to Right Side (like Ask Gemini)';
          dockBtn.classList.remove('mv-docked');
        }
      };
      updateDockBtnUI();

      dockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isSidePanelMode = !isSidePanelMode;
        try {
          localStorage.setItem('ei_side_panel', isSidePanelMode ? 'true' : 'false');
        } catch (_) {}
        updateDockBtnUI();

        if (isSidePanelMode) {
          inspectCard.classList.add('mv-side-panel');
          inspectCard.style.left = '';
          inspectCard.style.top = '';
          inspectCard.style.right = '0px';
          inspectCard.style.width = `${sidePanelWidth}px`;
          showToast('📌 Docked to Right Side (Ask Gemini style)');
        } else {
          inspectCard.classList.remove('mv-side-panel');
          inspectCard.style.right = '';
          inspectCard.style.width = '';
          const targetX = (floatingPosX !== null) ? floatingPosX : Math.max(20, window.innerWidth - 400);
          const targetY = (floatingPosY !== null) ? floatingPosY : 20;
          floatingPosX = targetX;
          floatingPosY = targetY;
          inspectCard.style.left = `${targetX}px`;
          inspectCard.style.top = `${targetY}px`;
          showToast('🗗 Switched to Floating Window');
        }
      });
    }

    // Left edge resize handle for Side Panel
    const resizeHandle = inspectCard.querySelector('#mv-side-resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        isResizingSidePanel = true;
        resizeHandle.classList.add('mv-resizing');

        const onResizeMove = (moveEvt) => {
          if (!isResizingSidePanel) return;
          const newW = window.innerWidth - moveEvt.clientX;
          if (newW >= 280 && newW <= Math.min(850, window.innerWidth - 60)) {
            sidePanelWidth = newW;
            inspectCard.style.width = `${newW}px`;
          }
        };

        const onResizeUp = () => {
          if (isResizingSidePanel) {
            isResizingSidePanel = false;
            resizeHandle.classList.remove('mv-resizing');
            try {
              localStorage.setItem('ei_side_panel_width', sidePanelWidth);
            } catch (_) {}
            window.removeEventListener('mousemove', onResizeMove, true);
            window.removeEventListener('mouseup', onResizeUp, true);
          }
        };

        window.addEventListener('mousemove', onResizeMove, true);
        window.addEventListener('mouseup', onResizeUp, true);
      });
    }

    const parentBtn = inspectCard.querySelector('#mv-inspect-parent');
    parentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectedEl && selectedEl.parentElement && selectedEl.parentElement !== document.documentElement && !isInspectorElement(selectedEl.parentElement)) {
        selectedEl = selectedEl.parentElement;
        hoveredEl = selectedEl;
        positionHighlight(selectedEl);
        renderCardData(selectedEl);
      }
    });

    const fullpageNavBtn = inspectCard.querySelector('#mv-inspect-fullpage');
    if (fullpageNavBtn) {
      fullpageNavBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = document.body || document.documentElement;
        if (target) {
          selectedEl = target;
          hoveredEl = target;
          positionHighlight(target);
          renderCardData(target);
        }
      });
    }

    const snippetCode = inspectCard.querySelector('#mv-inspect-code');
    snippetCode.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!selectedEl) return;
      await copyToClipboard(selectedEl.outerHTML || '', snippetCode, '✓ Copied HTML!');
    });

    const copyBtn = inspectCard.querySelector('#mv-inspect-copy-btn');
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!selectedEl) return;
      await copyToClipboard(selectedEl.outerHTML || '', copyBtn, '✓ Copied HTML Snippet!');
    });

    // Action chips click handler
    const chips = inspectCard.querySelectorAll('.mv-action-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const type = chip.getAttribute('data-copy');
        if (type === 'styledtext') {
          await copyRichText(selectedEl, chip, '✓ Copied Styled Text!');
        } else if (type === 'figmasvg') {
          await copyFigmaRealLook(selectedEl, chip);
        } else if (type === 'innertext' || type === 'text') {
          const text = (selectedEl.innerText || selectedEl.textContent || '').trim();
          await copyToClipboard(text, chip, '✓ Copied Inner Text!');
        } else {
          const text = getCopyValue(selectedEl, type);
          await copyToClipboard(text, chip, '✓ Copied!');
        }
      });
    });

    // Designer Tool: Toggle Ruler Guide
    const rulerToggleBtn = inspectCard.querySelector('#mv-btn-toggle-ruler');
    if (rulerToggleBtn) {
      rulerToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isRulerMode = !isRulerMode;
        if (isRulerMode) {
          rulerToggleBtn.classList.add('mv-ruler--active');
          if (selectedEl) updateSelectedBox(selectedEl);
          if (selectedEl && hoveredEl && hoveredEl !== selectedEl) {
            renderRulerGuide(selectedEl, hoveredEl);
          }
          showToast('📏 Ruler Guide Enabled (move mouse or hold Alt)');
        } else {
          rulerToggleBtn.classList.remove('mv-ruler--active');
          clearRulerGuide();
          showToast('Ruler Guide Disabled');
        }
      });
    }

    // Designer Tool: Copy Font CSS
    const copyFontBtn = inspectCard.querySelector('#mv-btn-copy-font');
    if (copyFontBtn) {
      copyFontBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const typo = extractTypography(selectedEl);
        if (typo) {
          await copyToClipboard(typo.cssText, copyFontBtn, '✓ Copied Font CSS!');
          showToast('✓ Font CSS rules copied to clipboard!');
        }
      });
    }

    // Designer Tool: Copy Tailwind CSS
    const copyTailwindBtn = inspectCard.querySelector('#mv-btn-copy-tailwind');
    const tailwindCodeEl = inspectCard.querySelector('#mv-tailwind-code');
    if (copyTailwindBtn) {
      copyTailwindBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const tw = generateTailwindClasses(selectedEl);
        if (tw) {
          await copyToClipboard(tw, copyTailwindBtn, '✓ Copied Tailwind!');
          showToast('✓ Tailwind CSS classes copied!');
        }
      });
    }
    if (tailwindCodeEl) {
      tailwindCodeEl.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const tw = generateTailwindClasses(selectedEl);
        if (tw) {
          await copyToClipboard(tw, tailwindCodeEl, '✓ Copied Tailwind!');
        }
      });
    }

    // Designer Tool: Copy Real-Look Figma (100% Real Page Look + All Images, Data & Editable Text)
    const copyFigmaRealBtn = inspectCard.querySelector('#mv-btn-copy-figma-real');
    if (copyFigmaRealBtn) {
      copyFigmaRealBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        await copyFigmaRealLook(selectedEl, copyFigmaRealBtn);
      });
    }

    // Designer Tool: Copy Full Page Layout for Figma
    const copyFigmaFullPageBtn = inspectCard.querySelector('#mv-btn-copy-figma-fullpage');
    if (copyFigmaFullPageBtn) {
      copyFigmaFullPageBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await copyFigmaRealLook(document.body || document.documentElement, copyFigmaFullPageBtn, true);
      });
    }

    // Designer Tool: Copy Pure Vector SVG for Figma
    const copyFigmaSvgBtn = inspectCard.querySelector('#mv-btn-copy-figma-svg');
    if (copyFigmaSvgBtn) {
      copyFigmaSvgBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        await copySvgForFigma(selectedEl, copyFigmaSvgBtn);
      });
    }

    // Designer Tool: Copy PNG for Figma (Pixel-Perfect Layer)
    const copyFigmaPngBtn = inspectCard.querySelector('#mv-btn-copy-figma-png');
    if (copyFigmaPngBtn) {
      copyFigmaPngBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        await copyPngForFigma(selectedEl, copyFigmaPngBtn);
      });
    }

    // QA Tool: Trigger Native Click / Submit
    const triggerClickBtn = inspectCard.querySelector('#mv-btn-trigger-click');
    if (triggerClickBtn) {
      triggerClickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        try {
          const tag = getSafeTag(selectedEl);
          if (tag === 'form') {
            if (typeof selectedEl.requestSubmit === 'function') {
              selectedEl.requestSubmit();
            } else {
              selectedEl.submit();
            }
            showToast('🚀 Form submitted!');
          } else {
            selectedEl.click();
            showToast('▶ Click triggered on element!');
          }
        } catch (err) {
          showToast('⚠️ Click failed: ' + (err.message || 'unknown error'));
        }
      });
    }

    // QA Tool: Unlock constraints
    const unlockBtn = inspectCard.querySelector('#mv-btn-unlock');
    unlockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!selectedEl) return;
      const count = unlockConstraints(selectedEl);
      flashElement(unlockBtn, `✓ Unlocked ${count} Fields!`, 'mv-copy--success');
    });

    // QA Tool: Toggle password visibility
    const showPassBtn = inspectCard.querySelector('#mv-btn-showpass');
    showPassBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!selectedEl) return;
      const ok = togglePasswordVisibility(selectedEl);
      if (ok) {
        flashElement(showPassBtn, '✓ Toggled Mask!', 'mv-copy--success');
      } else {
        flashElement(showPassBtn, 'No Password Input', 'mv-copy--error');
      }
    });

    // QA Tool: Copy Playwright locator
    const playwrightBtn = inspectCard.querySelector('#mv-btn-playwright');
    playwrightBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!selectedEl) return;
      const code = generatePlaywrightCode(selectedEl);
      await copyToClipboard(code, playwrightBtn, '✓ Copied Playwright!');
    });

    // QA Tool: Copy Cypress locator
    const cypressBtn = inspectCard.querySelector('#mv-btn-cypress');
    cypressBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!selectedEl) return;
      const code = generateCypressCode(selectedEl);
      await copyToClipboard(code, cypressBtn, '✓ Copied Cypress!');
    });

    // QA Tool: Copy Form as cURL
    const copyCurlBtn = inspectCard.querySelector('#mv-btn-copy-curl');
    if (copyCurlBtn) {
      copyCurlBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const curlCmd = generateFormCurl(selectedEl);
        if (curlCmd) {
          await copyToClipboard(curlCmd, copyCurlBtn, '✓ Copied cURL!');
          showToast('✓ Form cURL command copied to clipboard!');
        } else {
          flashElement(copyCurlBtn, 'No Form Found', 'mv-copy--error');
        }
      });
    }

    // QA Tool: Smart Random Auto Input for selected element
    const randomInputBtn = inspectCard.querySelector('#mv-btn-random-input');
    if (randomInputBtn) {
      randomInputBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const ok = autoFillRandomInput(selectedEl);
        if (ok) {
          flashElement(randomInputBtn, '✓ Auto-Filled!', 'mv-copy--success');
        } else {
          flashElement(randomInputBtn, 'No Input Found', 'mv-copy--error');
        }
      });
    }

    // QA Tool: Fill entire form / container with random test data
    const fillFormBtn = inspectCard.querySelector('#mv-btn-fill-form');
    if (fillFormBtn) {
      fillFormBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const count = autoFillEntireForm(selectedEl);
        if (count > 0) {
          flashElement(fillFormBtn, `✓ Filled ${count} Inputs!`, 'mv-copy--success');
        } else {
          flashElement(fillFormBtn, 'No Inputs Found', 'mv-copy--error');
        }
      });
    }

    // QA Tool: Locale switcher (Lao <-> English)
    const localeToggleBtn = inspectCard.querySelector('#mv-locale-toggle');
    if (localeToggleBtn) {
      localeToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLocale = (currentLocale === 'LA') ? 'EN' : 'LA';
        localeToggleBtn.textContent = (currentLocale === 'LA') ? '🇱🇦 LA' : '🌐 EN';
        try {
          localStorage.setItem('ei_locale', currentLocale);
        } catch (_) {}
        showToast(`✓ Switched to ${currentLocale === 'LA' ? 'Lao (🇱🇦)' : 'English (🌐)'} data!`);
      });
    }

    // QA Tool: Form State Save
    const saveFormBtn = inspectCard.querySelector('#mv-btn-save-form');
    if (saveFormBtn) {
      saveFormBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const count = saveFormState(selectedEl);
        if (count > 0) {
          flashElement(saveFormBtn, `✓ Saved ${count} Fields!`, 'mv-copy--success');
          showToast(`✓ Form profile saved (${count} fields)!`);
        } else {
          flashElement(saveFormBtn, 'No Form Data', 'mv-copy--error');
        }
      });
    }

    // QA Tool: Form State Restore
    const restoreFormBtn = inspectCard.querySelector('#mv-btn-restore-form');
    if (restoreFormBtn) {
      restoreFormBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        flashElement(restoreFormBtn, '⏳ Restoring...', 'mv-copy--success');
        const count = await restoreFormState(selectedEl);
        if (count > 0) {
          flashElement(restoreFormBtn, `✓ Restored ${count}!`, 'mv-copy--success');
          showToast(`✓ Restored ${count} form fields from saved profile!`);
        } else {
          flashElement(restoreFormBtn, 'No Profile Found', 'mv-copy--error');
        }
      });
    }

    // QA Tool: File Size Selector & Custom Size Handler
    const fileSizeSelect = inspectCard.querySelector('#mv-qa-file-size');
    if (fileSizeSelect) {
      fileSizeSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        if (fileSizeSelect.value === 'custom') {
          const userVal = prompt('Enter custom file size in KB or MB (e.g. 500KB, 2.5MB, 12MB):', '2MB');
          if (userVal) {
            const clean = userVal.trim().toUpperCase();
            let bytes = 1048576;
            if (clean.endsWith('KB')) {
              bytes = Math.round(parseFloat(clean) * 1024);
            } else if (clean.endsWith('MB')) {
              bytes = Math.round(parseFloat(clean) * 1024 * 1024);
            } else if (clean.endsWith('B')) {
              bytes = Math.round(parseFloat(clean));
            } else {
              const parsed = parseFloat(clean);
              if (!isNaN(parsed)) bytes = Math.round(parsed * 1024 * 1024);
            }
            if (bytes > 0) {
              fileSizeSelect.setAttribute('data-custom-size', String(bytes));
              const customOpt = fileSizeSelect.querySelector('option[value="custom"]');
              if (customOpt) customOpt.textContent = `✏️ Custom (${formatBytes(bytes)})`;
              showToast(`✓ File size set to ${formatBytes(bytes)}`);
              return;
            }
          }
          // Revert to 1MB if cancelled or invalid
          fileSizeSelect.value = '1048576';
        } else {
          const bytes = parseInt(fileSizeSelect.value, 10);
          showToast(`✓ File size set to ${formatBytes(bytes)}`);
        }
      });
    }

    // QA Tool: Filename Length Selector & Custom Length Handler
    const fileNameLenSelect = inspectCard.querySelector('#mv-qa-file-namelen');
    if (fileNameLenSelect) {
      fileNameLenSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        if (fileNameLenSelect.value === 'custom') {
          const userVal = prompt('Enter custom filename length (e.g. 75, 200) or a custom filename:', '80');
          if (userVal) {
            const trimmed = userVal.trim();
            const parsedNum = parseInt(trimmed, 10);
            if (!isNaN(parsedNum) && parsedNum > 0) {
              fileNameLenSelect.setAttribute('data-custom-len', String(parsedNum));
              const customOpt = fileNameLenSelect.querySelector('option[value="custom"]');
              if (customOpt) customOpt.textContent = `✏️ Custom (${parsedNum} chars)`;
              showToast(`✓ Filename length set to ${parsedNum} characters`);
              return;
            } else if (trimmed.length > 0) {
              fileNameLenSelect.setAttribute('data-custom-len', trimmed);
              const customOpt = fileNameLenSelect.querySelector('option[value="custom"]');
              if (customOpt) customOpt.textContent = `✏️ Custom (${trimmed.length} chars)`;
              showToast(`✓ Custom filename set (${trimmed.length} chars)`);
              return;
            }
          }
          fileNameLenSelect.value = 'normal';
        } else {
          const optText = fileNameLenSelect.options[fileNameLenSelect.selectedIndex].text;
          showToast(`✓ Filename length set to: ${optText}`);
        }
      });
    }

    // QA Tool: 1-Click Fake File Chips
    const fileChips = inspectCard.querySelectorAll('.mv-qa-chip--file[data-file]');
    fileChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const fileType = chip.getAttribute('data-file');
        const file = generateMockFile(fileType);
        const ok = injectFileToInput(selectedEl, file);
        if (ok) {
          flashElement(chip, '✓ Attached!', 'mv-copy--success');
          showToast(`✓ Attached ${file.name} (${file.name.length} chars, ${formatBytes(file.size)}) to file input!`);
        } else {
          flashElement(chip, 'No File Input', 'mv-copy--error');
        }
      });
    });

    // QA Tool: Input MaxLength & Length Boundary Testing
    const maxLenSelect = inspectCard.querySelector('#mv-qa-maxlen-select');
    if (maxLenSelect) {
      maxLenSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        if (maxLenSelect.value === 'custom') {
          const userVal = prompt('Enter custom string length to test (e.g. 75, 255, 1000):', '255');
          if (userVal) {
            const parsed = parseInt(userVal.trim(), 10);
            if (!isNaN(parsed) && parsed > 0) {
              maxLenSelect.setAttribute('data-custom-len', String(parsed));
              const customOpt = maxLenSelect.querySelector('option[value="custom"]');
              if (customOpt) customOpt.textContent = `✏️ Custom (${parsed} chars)`;
              showToast(`✓ Target length set to ${parsed} chars`);
              return;
            }
          }
          maxLenSelect.value = 'detect';
        }
      });
    }

    const fillMaxLenBtn = inspectCard.querySelector('#mv-btn-fill-maxlen');
    if (fillMaxLenBtn) {
      fillMaxLenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        let targetLen = maxLenSelect ? maxLenSelect.value : 'detect';
        if (targetLen === 'custom') {
          targetLen = maxLenSelect.getAttribute('data-custom-len') || 255;
        }
        const filledLen = fillInputWithLength(selectedEl, targetLen);
        if (filledLen) {
          flashElement(fillMaxLenBtn, `✓ ${filledLen} Chars!`, 'mv-copy--success');
          showToast(`✓ Filled ${filledLen} characters into input!`);
        } else {
          flashElement(fillMaxLenBtn, 'No Input Found', 'mv-copy--error');
        }
      });
    }

    const setDomMaxLenBtn = inspectCard.querySelector('#mv-btn-set-dom-maxlen');
    if (setDomMaxLenBtn) {
      setDomMaxLenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        let targetLen = maxLenSelect ? maxLenSelect.value : '50';
        if (targetLen === 'custom') {
          targetLen = maxLenSelect.getAttribute('data-custom-len') || 50;
        }
        const setLen = setInputDomMaxLength(selectedEl, targetLen);
        if (setLen) {
          flashElement(setDomMaxLenBtn, `✓ Max=${setLen}!`, 'mv-copy--success');
          const badge = inspectCard.querySelector('#mv-qa-cur-maxlen');
          if (badge) badge.textContent = `Max: ${setLen}`;
          showToast(`✓ Set DOM maxlength="${setLen}" on input!`);
        } else {
          flashElement(setDomMaxLenBtn, 'No Input Found', 'mv-copy--error');
        }
      });
    }

    // Quick Length Chips (Exact Max, Max+1, 50, 100, 255, 1K)
    const lenChips = inspectCard.querySelectorAll('.mv-qa-chip-len[data-len]');
    lenChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const lenType = chip.getAttribute('data-len');
        const filledLen = fillInputWithLength(selectedEl, lenType);
        if (filledLen) {
          flashElement(chip, `✓ ${filledLen}`, 'mv-copy--success');
          showToast(`✓ Filled ${filledLen} characters into input!`);
        } else {
          flashElement(chip, 'No Input', 'mv-copy--error');
        }
      });
    });

    // QA Tool: 1-Click Test Data Fillers
    const fillChips = inspectCard.querySelectorAll('.mv-qa-chip[data-fill]');
    fillChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selectedEl) return;
        const fillType = chip.getAttribute('data-fill');
        const val = getFillValue(fillType);
        const ok = injectInputValue(selectedEl, val);
        if (ok) {
          flashElement(chip, '✓ Injected!', 'mv-copy--success');
        } else {
          flashElement(chip, 'No Input Found', 'mv-copy--error');
        }
      });
    });

    // Screenshot JPG capture button
    const screenshotBtn = inspectCard.querySelector('#mv-inspect-screenshot');
    screenshotBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!selectedEl) return;
      await captureElementScreenshotJpg(selectedEl, screenshotBtn);
    });

    const exitBtn = inspectCard.querySelector('#mv-exit-btn');
    exitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      disableInspectMode();
    });

    // Topbar and Header draggable
    const topbar = inspectCard.querySelector('.mv-global-topbar');
    if (topbar) topbar.addEventListener('mousedown', onDragStart);
    const header = inspectCard.querySelector('.mv-inspect-header');
    if (header) header.addEventListener('mousedown', onDragStart);
  }

  // ─── Unified Element Screen/Canvas Capture Helper ─────────────────────────

  async function captureElementCanvas(el, format = 'png', quality = 0.95, isFullPage = false) {
    if (!el || isInspectorElement(el)) return null;

    const rect = isFullPage
      ? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight }
      : el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    // Temporarily hide ALL inspector UI completely so screenshot captures clean host element
    if (shadowHost) {
      shadowHost.classList.add('mv-capturing');
      shadowHost.style.setProperty('display', 'none', 'important');
    }
    if (inspectCard) {
      inspectCard.classList.add('mv-capturing');
      inspectCard.style.setProperty('display', 'none', 'important');
    }
    if (highlightBox) {
      highlightBox.style.setProperty('display', 'none', 'important');
    }

    let captureRes;
    try {
      // Wait 2 animation frames + 100ms so browser completes a full repaint without inspector overlays
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 100);
          });
        });
      });

      const msgPayload = {
        type: 'CAPTURE_VISIBLE_TAB',
        format: format === 'jpeg' ? 'jpeg' : 'png'
      };
      if (format === 'jpeg') {
        msgPayload.quality = Math.round(quality * 100);
      }
      captureRes = await chrome.runtime.sendMessage(msgPayload);
    } catch (err) {
      console.error('[Inspector] captureVisibleTab error:', err);
    } finally {
      // Restore inspector UI
      if (shadowHost) {
        shadowHost.style.removeProperty('display');
        shadowHost.classList.remove('mv-capturing');
      }
      if (inspectCard) {
        inspectCard.style.removeProperty('display');
        inspectCard.classList.remove('mv-capturing');
      }
      if (highlightBox) {
        highlightBox.style.removeProperty('display');
      }
    }

    if (!captureRes || !captureRes.success || !captureRes.dataUrl) return null;

    const img = new Image();
    img.src = captureRes.dataUrl;
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } catch (_) {
      return null;
    }

    const scaleX = (window.innerWidth > 0) ? (img.width / window.innerWidth) : (window.devicePixelRatio || 1);
    const scaleY = (window.innerHeight > 0) ? (img.height / window.innerHeight) : (window.devicePixelRatio || 1);

    const sx = isFullPage ? 0 : Math.max(0, Math.round(rect.left * scaleX));
    const sy = isFullPage ? 0 : Math.max(0, Math.round(rect.top * scaleY));
    const sw = isFullPage ? img.width : Math.min(img.width - sx, Math.round(rect.width * scaleX));
    const sh = isFullPage ? img.height : Math.min(img.height - sy, Math.round(rect.height * scaleY));

    if (sw <= 0 || sh <= 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');

    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sw, sh);
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    return { canvas, rect, width: Math.round(rect.width), height: Math.round(rect.height) };
  }

  // ─── Annotation Editor Helpers ────────────────────────────────────────────

  function hexToRgba(hex, alpha) {
    const clean = (hex || '#ef4444').replace('#', '');
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function computeLineWidth() {
    if (!annotatorCanvas) return 3;
    return Math.max(3, Math.round(annotatorCanvas.width / 320));
  }

  function getCanvasCoords(e) {
    if (!annotatorCanvas) return { x: 0, y: 0 };
    const r = annotatorCanvas.getBoundingClientRect();
    const scaleX = annotatorCanvas.width / (r.width || 1);
    const scaleY = annotatorCanvas.height / (r.height || 1);
    return {
      x: Math.max(0, Math.min(annotatorCanvas.width, (e.clientX - r.left) * scaleX)),
      y: Math.max(0, Math.min(annotatorCanvas.height, (e.clientY - r.top) * scaleY))
    };
  }

  function redrawAnnotationCanvas(previewRect = null) {
    if (!annotatorCtx || !baseCanvas) return;

    annotatorCtx.clearRect(0, 0, annotatorCanvas.width, annotatorCanvas.height);
    annotatorCtx.drawImage(baseCanvas, 0, 0);

    const defaultLw = computeLineWidth();

    // 1. Committed rectangles (outline only, completely transparent inside)
    for (const r of drawnRectangles) {
      annotatorCtx.strokeStyle = r.color;
      annotatorCtx.lineWidth = r.lineWidth || defaultLw;
      annotatorCtx.strokeRect(r.x, r.y, r.w, r.h);
    }

    // 2. Active preview rectangle during drag
    if (previewRect) {
      annotatorCtx.strokeStyle = previewRect.color;
      annotatorCtx.lineWidth = defaultLw;
      annotatorCtx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
    }
  }

  function undoLastRectangle() {
    if (drawnRectangles.length > 0) {
      drawnRectangles.pop();
      redrawAnnotationCanvas();
    }
  }

  function clearAllRectangles() {
    if (drawnRectangles.length > 0) {
      drawnRectangles = [];
      redrawAnnotationCanvas();
    }
  }

  async function copyAnnotatorCanvasToClipboard() {
    if (!annotatorCanvas) return false;
    try {
      window.focus();
    } catch (_) {}

    // Method 1: Modern ClipboardItem with synchronous gesture preservation
    if (navigator.clipboard && typeof navigator.clipboard.write === 'function' && window.ClipboardItem) {
      try {
        const blobPromise = new Promise((resolve, reject) => {
          annotatorCanvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/png');
        });

        const dataUrl = annotatorCanvas.toDataURL('image/png');
        const htmlBlob = new Blob([`<img src="${dataUrl}">`], { type: 'text/html' });

        const item = new ClipboardItem({
          'image/png': blobPromise,
          'text/html': htmlBlob
        });

        await navigator.clipboard.write([item]);
        return true;
      } catch (err) {
        console.warn('[Inspector] Promise ClipboardItem failed, trying direct blob:', err);
      }

      try {
        const blob = await new Promise((res) => annotatorCanvas.toBlob(res, 'image/png'));
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          return true;
        }
      } catch (err) {
        console.warn('[Inspector] Direct Blob clipboard write failed:', err);
      }
    }

    // Method 2: document.execCommand('copy') via contentEditable <img>
    // Reliable fallback on Windows when clipboard API is restricted in content scripts
    try {
      const dataUrl = annotatorCanvas.toDataURL('image/png');
      const container = document.createElement('div');
      container.contentEditable = 'true';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.opacity = '0';

      const img = document.createElement('img');
      img.src = dataUrl;
      container.appendChild(img);
      (document.body || document.documentElement).appendChild(container);

      container.focus();
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNode(img);
      selection.addRange(range);

      const success = document.execCommand('copy');
      selection.removeAllRanges();
      container.remove();

      if (success) {
        return true;
      }
    } catch (err) {
      console.warn('[Inspector] execCommand image copy fallback failed:', err);
    }

    return false;
  }

  async function downloadAnnotatorCanvas(format = 'jpeg') {
    if (!annotatorCanvas) return false;
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';

    const tag = (currentCapturedEl?.tagName || 'element').toLowerCase();
    const cleanId = currentCapturedEl?.id ? `_${currentCapturedEl.id.slice(0, 15)}` : '';
    const hasBoxes = drawnRectangles.length > 0 ? '_annotated' : '';
    const fileName = `${tag}${cleanId}${hasBoxes}_${Math.round(annotatorCanvas.width)}x${Math.round(annotatorCanvas.height)}.${ext}`;

    // 1. Get synchronous dataURL from canvas
    const dataUrl = annotatorCanvas.toDataURL(mime, 0.95);

    // 2. Primary method: Trigger download via Chrome background service worker (chrome.downloads API)
    let downloaded = false;
    try {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'DOWNLOAD_FILE',
          url: dataUrl,
          filename: fileName,
        }, (res) => {
          if (chrome.runtime.lastError || !res || !res.success) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
      downloaded = !!resp;
    } catch (_) {}

    // 3. Fallback method: Direct anchor download
    if (!downloaded) {
      try {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.style.display = 'none';
        (document.body || document.documentElement).appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 1200);
        downloaded = true;
      } catch (err) {
        console.warn('[Inspector] Direct anchor download failed:', err);
      }
    }

    // 4. Silent optional clipboard copy in background (will never block download on Windows 10)
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        annotatorCanvas.toBlob((pngBlob) => {
          if (pngBlob) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]).catch(() => {});
          }
        }, 'image/png');
      }
    } catch (_) {}

    return downloaded;
  }

  function isAnnotatorOpen() {
    return annotatorModal && annotatorModal.style.display === 'flex';
  }

  function closeAnnotationModal() {
    if (annotatorModal) {
      annotatorModal.style.display = 'none';
      isDrawingRect = false;
    }
  }

  function ensureAnnotatorModal() {
    if (annotatorModal) return;

    annotatorModal = document.createElement('div');
    annotatorModal.className = 'ei-annotator-modal';
    annotatorModal.id = 'ei-annotator-modal';
    annotatorModal.setAttribute('aria-label', 'Screenshot Annotation Editor');

    annotatorModal.innerHTML = `
      <div class="ei-annotator-backdrop" id="ei-annotator-backdrop"></div>
      <div class="ei-annotator-dialog">
        <div class="ei-annotator-toolbar">
          <div class="ei-annotator-tools">
            <span class="ei-annotator-title">✏️ Draw Rectangle</span>
            <div class="ei-color-picker" title="Rectangle Color">
              <button class="ei-color-btn active" data-color="#ef4444" style="background:#ef4444;" title="Red (Error/Bug)"></button>
              <button class="ei-color-btn" data-color="#f59e0b" style="background:#f59e0b;" title="Amber / Yellow (Warning)"></button>
              <button class="ei-color-btn" data-color="#3b82f6" style="background:#3b82f6;" title="Blue (Info)"></button>
              <button class="ei-color-btn" data-color="#10b981" style="background:#10b981;" title="Green (Success)"></button>
            </div>
            <button class="ei-tool-btn" id="ei-undo-btn" title="Undo last rectangle (Ctrl+Z)">↩️ Undo</button>
            <button class="ei-tool-btn" id="ei-clear-btn" title="Clear all drawn boxes">🧹 Clear</button>
          </div>
          <div class="ei-annotator-actions">
            <button class="ei-tool-btn ei-btn-copy" id="ei-annotator-copy" title="Copy annotated image to clipboard">📋 Copy</button>
            <button class="ei-tool-btn ei-btn-save" id="ei-annotator-download" title="Download image to your PC as .JPG">💾 Download .JPG</button>
            <button class="ei-tool-btn ei-btn-download-png" id="ei-annotator-download-png" title="Download image to your PC as .PNG">⬇️ .PNG</button>
            <button class="ei-tool-btn ei-btn-close" id="ei-annotator-close" title="Close editor (Esc)">✕</button>
          </div>
        </div>
        <div class="ei-annotator-canvas-wrap">
          <canvas id="ei-draw-canvas"></canvas>
        </div>
      </div>
    `;

    shadowRoot.appendChild(annotatorModal);

    annotatorModal.addEventListener('mousedown', (e) => e.stopPropagation());
    annotatorModal.addEventListener('click', (e) => e.stopPropagation());

    // Backdrop click
    annotatorModal.querySelector('#ei-annotator-backdrop').addEventListener('click', (e) => {
      e.stopPropagation();
      closeAnnotationModal();
    });

    // Close button
    annotatorModal.querySelector('#ei-annotator-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeAnnotationModal();
    });

    // Color picker
    const colorBtns = annotatorModal.querySelectorAll('.ei-color-btn');
    colorBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentRectColor = btn.getAttribute('data-color') || '#ef4444';
      });
    });

    // Undo button
    annotatorModal.querySelector('#ei-undo-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      undoLastRectangle();
    });

    // Clear button
    annotatorModal.querySelector('#ei-clear-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      clearAllRectangles();
    });

    // 1. Copy Image button (Strictly copies to clipboard, NEVER downloads!)
    const copyBtn = annotatorModal.querySelector('#ei-annotator-copy');
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      flashElement(copyBtn, '⏳ Copying...', 'mv-copy--success');
      const copied = await copyAnnotatorCanvasToClipboard();
      if (copied) {
        flashElement(copyBtn, '✓ Copied!', 'mv-copy--success');
        showToast('✓ Image copied to clipboard! Paste with Ctrl+V');
        setTimeout(() => closeAnnotationModal(), 500);
      } else {
        flashElement(copyBtn, '✕ Copy Failed', 'mv-copy--error');
        showToast('✕ Clipboard copy failed. Please click "Download" button to save image.');
      }
    });

    // 2. Download .JPG button (direct download to PC)
    const downloadBtn = annotatorModal.querySelector('#ei-annotator-download');
    downloadBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      flashElement(downloadBtn, '⏳ Downloading...', 'mv-copy--success');
      const ok = await downloadAnnotatorCanvas('jpeg');
      if (ok) {
        showToast('✓ Downloaded .JPG to your PC!');
        closeAnnotationModal();
      } else {
        flashElement(downloadBtn, '✕ Error', 'mv-copy--error');
      }
    });

    // 3. Download .PNG button (direct download to PC)
    const downloadPngBtn = annotatorModal.querySelector('#ei-annotator-download-png');
    if (downloadPngBtn) {
      downloadPngBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        flashElement(downloadPngBtn, '⏳ Downloading...', 'mv-copy--success');
        const ok = await downloadAnnotatorCanvas('png');
        if (ok) {
          showToast('✓ Downloaded .PNG to your PC!');
          closeAnnotationModal();
        } else {
          flashElement(downloadPngBtn, '✕ Error', 'mv-copy--error');
        }
      });
    }

    annotatorCanvas = annotatorModal.querySelector('#ei-draw-canvas');
    annotatorCtx = annotatorCanvas.getContext('2d');

    // Canvas drawing setup
    annotatorCanvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const start = getCanvasCoords(e);
      rectStartX = start.x;
      rectStartY = start.y;
      isDrawingRect = true;

      const onMouseMove = (me) => {
        if (!isDrawingRect) return;
        me.preventDefault();
        const cur = getCanvasCoords(me);
        const x = Math.min(rectStartX, cur.x);
        const y = Math.min(rectStartY, cur.y);
        const w = Math.abs(cur.x - rectStartX);
        const h = Math.abs(cur.y - rectStartY);
        redrawAnnotationCanvas({ x, y, w, h, color: currentRectColor });
      };

      const onMouseUp = (ue) => {
        if (!isDrawingRect) return;
        isDrawingRect = false;
        window.removeEventListener('mousemove', onMouseMove, true);
        window.removeEventListener('mouseup', onMouseUp, true);

        const end = getCanvasCoords(ue);
        const x = Math.min(rectStartX, end.x);
        const y = Math.min(rectStartY, end.y);
        const w = Math.abs(end.x - rectStartX);
        const h = Math.abs(end.y - rectStartY);

        const minDim = Math.max(4, Math.round(annotatorCanvas.width / 200));
        if (w >= minDim && h >= minDim) {
          drawnRectangles.push({
            x,
            y,
            w,
            h,
            color: currentRectColor,
            lineWidth: computeLineWidth()
          });
        }
        redrawAnnotationCanvas();
      };

      window.addEventListener('mousemove', onMouseMove, true);
      window.addEventListener('mouseup', onMouseUp, true);
    });
  }

  function openAnnotationEditor(sourceCanvas, targetEl) {
    ensureShadowDOM();
    ensureAnnotatorModal();

    baseCanvas = sourceCanvas;
    currentCapturedEl = targetEl;
    drawnRectangles = [];

    annotatorCanvas.width = sourceCanvas.width;
    annotatorCanvas.height = sourceCanvas.height;

    redrawAnnotationCanvas();
    annotatorModal.style.display = 'flex';
  }

  // ─── QA Tool: Capture Element Screenshot as JPG & Annotate ─────────────────

  async function captureElementScreenshotJpg(el, btnElement) {
    if (!el || isInspectorElement(el)) return false;

    if (btnElement) {
      flashElement(btnElement, '⏳ Capturing...', 'mv-copy--success');
    }

    const captured = await captureElementCanvas(el, 'jpeg', 0.95);
    if (!captured) {
      if (btnElement) flashElement(btnElement, '✕ Capture Failed', 'mv-copy--error');
      return false;
    }

    if (btnElement) {
      flashElement(btnElement, '✓ Ready!', 'mv-copy--success');
    }

    // Open interactive rectangle drawing annotation editor
    openAnnotationEditor(captured.canvas, el);
    return true;
  }

  // ─── QA Data Values & Localized Mock Data Generator ──────────────────────

  let currentLocale = 'LA';
  try {
    const savedLoc = localStorage.getItem('ei_locale');
    if (savedLoc === 'EN' || savedLoc === 'LA') currentLocale = savedLoc;
  } catch (_) {}

  // Global / English Datasets
  const RANDOM_FIRST_NAMES = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'David', 'Emma',
    'Michael', 'Sarah', 'Daniel', 'Sophia', 'James', 'Olivia', 'Ethan', 'Grace', 'Liam', 'Mia'
  ];

  const RANDOM_LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson',
    'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin'
  ];

  const RANDOM_STREETS = [
    'Main Street', 'Market Street', 'Broadway Ave', 'Park Blvd', 'Sunset Blvd',
    'Highland Ave', 'Oak Street', 'Maple Ave'
  ];

  const RANDOM_CITIES = ['New York', 'San Francisco', 'London', 'Singapore', 'Sydney', 'Tokyo', 'Berlin'];
  const RANDOM_COMPANIES = ['Alpha Global Tech', 'Apex Solutions Ltd', 'Pacific Systems', 'Starlight Media', 'Nexus Dynamics'];
  const RANDOM_PARAGRAPHS = [
    'This is an automated test message generated for QA validation. Form input handling and boundary constraints are being verified.',
    'User feedback testing in progress. System performance, accessibility standards, and responsive UI components are validated.',
    'Automated testing payload submitted to verify input persistence, XSS sanitization, and state management.'
  ];

  // Lao Localized Datasets (🇱🇦)
  const LAO_FIRST_NAMES = [
    'ສົມສັກ', 'ຄຳແພງ', 'ບຸນມີ', 'ວັນໄຊ', 'ທິດາ', 'ມະນີວັນ', 'ສຸກັນ', 'ອາລຸນ',
    'ດາວີ', 'ສີວິໄລ', 'ເກດສະໜາ', 'ພອນໄຊ', 'ຈັນທາ', 'ສຸລິຍາ', 'ແກ້ວມະນີ',
    'ອານຸສອນ', 'ວິໄລສັກ', 'ສຸກສາຄອນ', 'ນ້ອຍ', 'ສົມຊາຍ', 'ພອນທິບ', 'ມານີ'
  ];

  const LAO_LAST_NAMES = [
    'ໄຊຍະວົງ', 'ສີສຸລາດ', 'ວົງສາ', 'ແກ້ວມະນີວົງ', 'ພົມມະຈັນ', 'ອິນທະວົງ',
    'ລັດຕະນະວົງ', 'ດວງດາລາ', 'ສຸລິວົງ', 'ພອນປະເສີດ', 'ຄຳມະນີ', 'ຈັນທະລັງສີ',
    'ສິດທິໄຊ', 'ມະນີວົງ', 'ທຳມະວົງ', 'ສົມພອນ'
  ];

  const LAO_STREETS = [
    'ຖະໜົນ ລ້ານຊ້າງ', 'ຖະໜົນ ສຸພານຸວົງ', 'ຖະໜົນ ສາມແສນໄທ', 'ຖະໜົນ ເສດຖາທິຣາດ',
    'ຖະໜົນ ໄກສອນ ພົມວິຫານ', 'ຖະໜົນ ດົງໂດກ', 'ຖະໜົນ ຄູວຽງ', 'ຖະໜົນ 23 ສິງຫາ'
  ];

  const LAO_PROVINCES = [
    'ນະຄອນຫຼວງວຽງຈັນ', 'ຫຼວງພະບາງ', 'ສະຫວັນນະເຂດ', 'ຈຳປາສັກ', 'ແຂວງວຽງຈັນ',
    'ຄຳມ່ວນ', 'ບໍລິຄຳໄຊ', 'ຊຽງຂວາງ', 'ອຸດົມໄຊ', 'ບໍ່ແກ້ວ', 'ຫຼວງນ້ຳທາ',
    'ສາລະວັນ', 'ເຊກອງ', 'ອັດຕະປື', 'ໄຊຍະບູລີ', 'ຫົວພັນ', 'ຜົ້ງສາລີ', 'ໄຊສົມບູນ'
  ];

  const LAO_DISTRICTS = [
    'ເມືອງ ຈັນທະບູລີ', 'ເມືອງ ສີໂຄດຕະບອງ', 'ເມືອງ ໄຊເສດຖາ', 'ເມືອງ ສີສັດຕະນາກ',
    'ເມືອງ ຫາດຊາຍຟອງ', 'ເມືອງ ນາຊາຍທອງ', 'ເມືອງ ໄຊທານີ'
  ];

  const LAO_COMPANIES = [
    'ລັດວິສາຫະກິດ ໂທລະຄົມມະນາຄົມລາວ (Lao Telecom)',
    'ບໍລິສັດ ພັດທະນາດີຈິຕອນ ລາວ ຈຳກັດ',
    'ກຸ່ມບໍລິສັດ ວຽງຈັນ ເຕັກໂນໂລຊີ',
    'ທະນາຄານ ການຄ້າຕ່າງປະເທດລາວ (BCEL)',
    'ບໍລິສັດ ດາວເຮືອງ ກຣຸບ'
  ];

  const LAO_PARAGRAPHS = [
    'ລະບົບກວດສອບ ແລະ ທົດສອບຟອມອັດຕະໂນມັດ ຊ່ວຍໃຫ້ການເຮັດວຽກຂອງ Developer ແລະ QA ວ່ອງໄວ ແລະ ມີປະສິດທິພາບສູງ.',
    'ການທົດສອບຊອບແວແມ່ນຂະບວນການສຳຄັນທີ່ສຸດເພື່ອຮັບປະກັນຄຸນນະພາບ, ຄວາມປອດໄພ ແລະ ຄວາມຖືກຕ້ອງຂອງລະບົບ.',
    'ຂໍ້ຄວາມທົດສອບອັດຕະໂນມັດຖືກສົ່ງເພື່ອຢືນຢັນການເຮັດວຽກຂອງ Input ແລະ Validation ຂອງລະບົບ.'
  ];

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getSelectedFileSize() {
    const sizeSelect = inspectCard ? inspectCard.querySelector('#mv-qa-file-size') : null;
    if (!sizeSelect) return 1024 * 1024; // Default 1 MB
    const val = sizeSelect.value;
    if (val === 'custom') {
      const custom = sizeSelect.getAttribute('data-custom-size');
      return custom ? parseInt(custom, 10) : 1024 * 1024;
    }
    return parseInt(val, 10) || 1024 * 1024;
  }

  function getSelectedFileNameLength() {
    const nameLenSelect = inspectCard ? inspectCard.querySelector('#mv-qa-file-namelen') : null;
    if (!nameLenSelect) return 'normal';
    const val = nameLenSelect.value;
    if (val === 'custom') {
      const custom = nameLenSelect.getAttribute('data-custom-len');
      return custom || 'normal';
    }
    return val || 'normal';
  }

  function generateMockFileName(type, defaultName) {
    const lenSetting = getSelectedFileNameLength();
    if (lenSetting === 'normal') {
      return defaultName;
    }

    const dotIdx = defaultName.lastIndexOf('.');
    const ext = dotIdx !== -1 ? defaultName.substring(dotIdx) : '';
    const extLen = ext.length;

    // If user provided custom string (e.g. custom filename)
    if (typeof lenSetting === 'string' && isNaN(Number(lenSetting))) {
      return lenSetting.endsWith(ext) ? lenSetting : `${lenSetting}${ext}`;
    }

    const targetLen = parseInt(lenSetting, 10);
    if (!targetLen || targetLen <= 0) return defaultName;

    const baseLen = Math.max(1, targetLen - extLen);
    const prefix = `test_${type}_`;
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789_';
    let base = prefix;
    while (base.length < baseLen) {
      base += alphabet;
    }
    base = base.substring(0, baseLen);
    return `${base}${ext}`;
  }

  function createMockFileBuffer(targetSize, headerBytes = [], textPrefix = '') {
    const size = Math.max(headerBytes.length || 1, Math.min(targetSize, 100 * 1024 * 1024));
    const buf = new Uint8Array(size);

    if (headerBytes && headerBytes.length > 0) {
      for (let i = 0; i < headerBytes.length && i < size; i++) {
        buf[i] = headerBytes[i];
      }
    }

    if (textPrefix) {
      const offset = headerBytes ? headerBytes.length : 0;
      for (let i = 0; i < textPrefix.length && (offset + i) < size; i++) {
        buf[offset + i] = textPrefix.charCodeAt(i);
      }
    }

    return buf;
  }

  function getFillValue(type) {
    const isLao = (currentLocale === 'LA');
    switch (type) {
      case 'rand-name': {
        if (isLao) {
          const fn = LAO_FIRST_NAMES[Math.floor(Math.random() * LAO_FIRST_NAMES.length)];
          const ln = LAO_LAST_NAMES[Math.floor(Math.random() * LAO_LAST_NAMES.length)];
          return `${fn} ${ln}`;
        }
        const fn = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
        const ln = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
        return `${fn} ${ln}`;
      }
      case 'rand-email': {
        const fn = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)].toLowerCase();
        const randNum = Math.floor(100 + Math.random() * 900);
        return `${fn}.${randNum}@example.com`;
      }
      case 'rand-phone':
        if (isLao) {
          const p = ['5', '7', '9', '2'][Math.floor(Math.random() * 4)];
          return `020${p}${Math.floor(1000000 + Math.random() * 9000000)}`;
        }
        return `+1-555-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
      case 'rand-date': {
        const m = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
        const d = String(Math.floor(1 + Math.random() * 28)).padStart(2, '0');
        return `2026-${m}-${d}`;
      }
      case 'rand-pass':
        return `Pass@${Math.floor(1000 + Math.random() * 9000)}_Secure#`;
      case 'rand-text':
        if (isLao) {
          return LAO_PARAGRAPHS[Math.floor(Math.random() * LAO_PARAGRAPHS.length)];
        }
        return RANDOM_PARAGRAPHS[Math.floor(Math.random() * RANDOM_PARAGRAPHS.length)];
      case 'long':
        return 'A'.repeat(300);
      case 'special':
        return '!@#$%^&*()_+-=[]{}|;\':",.<>?';
      case 'unicode':
        return '🚀🌟测试اختبار_123';
      case 'number':
        return '999999999';
      case 'probe':
        return '<test\'">';
      case 'clear':
        return '';
      // Security & PenTest Payloads
      case 'sql-auth':
        return "' OR '1'='1";
      case 'sql-comment':
        return "admin' --";
      case 'xss-script':
        return "<script>alert(1)</script>";
      case 'xss-img':
        return "<img src=x onerror=alert(1)>";
      case 'ssti-brace':
        return "{{7*7}}";
      case 'ssti-dollar':
        return "${7*7}";
      case 'cmd-pipe':
        return "| dir";
      case 'cmd-semi':
        return "; ls -la";
      default:
        return 'test';
    }
  }

  function generateSmartRandomValue(inputEl) {
    if (!inputEl) return 'Test';

    const tag = (inputEl.tagName || '').toLowerCase();
    const type = (inputEl.type || 'text').toLowerCase();
    const name = (inputEl.name || '').toLowerCase();
    const id = (inputEl.id || '').toLowerCase();
    const placeholder = (inputEl.placeholder || '').toLowerCase();
    const ariaLabel = (inputEl.getAttribute('aria-label') || '').toLowerCase();
    const autocomplete = (inputEl.autocomplete || '').toLowerCase();
    const className = (typeof inputEl.className === 'string' ? inputEl.className : '').toLowerCase();
    const combined = `${name} ${id} ${placeholder} ${ariaLabel} ${autocomplete} ${className}`;
    const isLao = (currentLocale === 'LA');

    // 1. Email
    if (type === 'email' || combined.includes('email') || combined.includes('mail')) {
      const fn = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)].toLowerCase();
      const num = Math.floor(100 + Math.random() * 900);
      return `${fn}.${num}@example.com`;
    }

    // 2. Phone / Tel / Mobile / WhatsApp
    const isPhone = type === 'tel' ||
      combined.includes('phone') ||
      combined.includes('tel') ||
      combined.includes('mobile') ||
      combined.includes('cell') ||
      combined.includes('whatsapp') ||
      combined.includes('เบอร์') ||
      combined.includes('ໂທ') ||
      (combined.includes('contact') && (combined.includes('no') || combined.includes('num')));

    if (isPhone) {
      if (isLao) {
        const prefixes = ['5', '7', '9', '2'];
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        const rest = Math.floor(1000000 + Math.random() * 9000000);
        if (placeholder.includes('+856') || combined.includes('country')) {
          return `+85620${p}${rest}`;
        }
        if (placeholder.includes(' ') || placeholder.includes('-')) {
          const s = String(rest);
          return `020 ${p}${s.substring(0, 2)} ${s.substring(2)}`;
        }
        return `020${p}${rest}`;
      } else {
        const area = Math.floor(201 + Math.random() * 700);
        const mid = Math.floor(100 + Math.random() * 900);
        const last = Math.floor(1000 + Math.random() * 9000);
        if (placeholder.includes('+')) {
          return `+1${area}${mid}${last}`;
        }
        if (placeholder.includes('(') || placeholder.includes('-')) {
          return `(${area}) ${mid}-${last}`;
        }
        return `+1-${area}-${mid}-${last}`;
      }
    }

    // 3. Password
    if (type === 'password' || combined.includes('pass') || combined.includes('pwd')) {
      return `Pass@${Math.floor(1000 + Math.random() * 9000)}_Secure#`;
    }

    // 4. Number / Quantity / Price / Age
    if (type === 'number' || combined.includes('amount') || combined.includes('qty') || combined.includes('quantity') || combined.includes('price') || combined.includes('cost')) {
      const min = inputEl.min !== '' ? parseInt(inputEl.min, 10) : 1;
      const max = inputEl.max !== '' ? parseInt(inputEl.max, 10) : 1000;
      return String(Math.floor(min + Math.random() * (Math.min(max, 1000) - min + 1)));
    }
    if (combined.includes('age')) {
      return String(Math.floor(20 + Math.random() * 45));
    }

    // 5. Date / Calendar / Birthday / Schedule / Expiry / Time / Month
    const isDate = type === 'date' ||
      type === 'datetime-local' ||
      type === 'month' ||
      type === 'time' ||
      type === 'week' ||
      combined.includes('date') ||
      combined.includes('birth') ||
      combined.includes('dob') ||
      combined.includes('bday') ||
      combined.includes('expire') ||
      combined.includes('expiry') ||
      combined.includes('deadline') ||
      combined.includes('schedule') ||
      combined.includes('booking') ||
      combined.includes('calendar') ||
      combined.includes('ວັນທີ') ||
      combined.includes('ເກີດ');

    if (isDate) {
      if (type === 'time') {
        const hh = String(Math.floor(8 + Math.random() * 10)).padStart(2, '0');
        const mm = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)];
        return `${hh}:${mm}`;
      }
      if (type === 'month') {
        const mm = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
        return `2026-${mm}`;
      }

      let yyyy = 2026;
      if (combined.includes('birth') || combined.includes('dob') || combined.includes('bday') || combined.includes('ເກີດ')) {
        yyyy = Math.floor(1985 + Math.random() * 20); // 1985 - 2004
      } else if (combined.includes('expire') || combined.includes('expiry') || combined.includes('due') || combined.includes('deadline')) {
        yyyy = Math.floor(2027 + Math.random() * 4); // 2027 - 2030
      }

      const m = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
      const d = String(Math.floor(1 + Math.random() * 28)).padStart(2, '0');

      if (type === 'datetime-local') {
        const hh = String(Math.floor(8 + Math.random() * 10)).padStart(2, '0');
        return `${yyyy}-${m}-${d}T${hh}:00`;
      }

      if (type === 'date') {
        return `${yyyy}-${m}-${d}`;
      }

      // Plain text input with date semantics
      if (placeholder.includes('dd/mm') || placeholder.includes('dd-mm') || placeholder.includes('/')) {
        return `${d}/${m}/${yyyy}`;
      }
      if (placeholder.includes('mm/dd') || placeholder.includes('mm-dd')) {
        return `${m}/${d}/${yyyy}`;
      }
      return `${yyyy}-${m}-${d}`;
    }

    // 6. URL
    if (type === 'url' || combined.includes('url') || combined.includes('website') || combined.includes('link')) {
      return `https://example.com/test-${Math.floor(Math.random() * 1000)}`;
    }

    // 7. Names
    if (combined.includes('first')) {
      if (isLao) return LAO_FIRST_NAMES[Math.floor(Math.random() * LAO_FIRST_NAMES.length)];
      return RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
    }
    if (combined.includes('last') || combined.includes('surname')) {
      if (isLao) return LAO_LAST_NAMES[Math.floor(Math.random() * LAO_LAST_NAMES.length)];
      return RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
    }
    if (combined.includes('name') || combined.includes('user') || combined.includes('author') || combined.includes('contact') || combined.includes('recipient')) {
      if (isLao) {
        const fn = LAO_FIRST_NAMES[Math.floor(Math.random() * LAO_FIRST_NAMES.length)];
        const ln = LAO_LAST_NAMES[Math.floor(Math.random() * LAO_LAST_NAMES.length)];
        return `${fn} ${ln}`;
      }
      const fn = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
      const ln = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
      return `${fn} ${ln}`;
    }

    // 8. Address / City / Country / Company
    if (combined.includes('address') || combined.includes('street')) {
      const num = Math.floor(10 + Math.random() * 980);
      if (isLao) {
        const st = LAO_STREETS[Math.floor(Math.random() * LAO_STREETS.length)];
        return `${st}, ເຮືອນເລກທີ ${num}`;
      }
      const st = RANDOM_STREETS[Math.floor(Math.random() * RANDOM_STREETS.length)];
      return `${num} ${st}`;
    }
    if (combined.includes('city') || combined.includes('province')) {
      if (isLao) return LAO_PROVINCES[Math.floor(Math.random() * LAO_PROVINCES.length)];
      return RANDOM_CITIES[Math.floor(Math.random() * RANDOM_CITIES.length)];
    }
    if (combined.includes('district')) {
      if (isLao) return LAO_DISTRICTS[Math.floor(Math.random() * LAO_DISTRICTS.length)];
      return 'Central District';
    }
    if (combined.includes('company') || combined.includes('org')) {
      if (isLao) return LAO_COMPANIES[Math.floor(Math.random() * LAO_COMPANIES.length)];
      return RANDOM_COMPANIES[Math.floor(Math.random() * RANDOM_COMPANIES.length)];
    }
    if (combined.includes('zip') || combined.includes('postal')) {
      return String(Math.floor(10000 + Math.random() * 90000));
    }

    // 9. Subject / Title / Topic
    if (combined.includes('subject') || combined.includes('title') || combined.includes('topic')) {
      if (isLao) return `ບົດລາຍງານການທົດສອບ QA #${Math.floor(1000 + Math.random() * 9000)}`;
      return `QA Test Report #${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 10. Textarea or Comment / Message / Description / Bio / Notes
    if (tag === 'textarea' || combined.includes('desc') || combined.includes('comment') || combined.includes('message') || combined.includes('body') || combined.includes('detail') || combined.includes('note')) {
      if (isLao) return LAO_PARAGRAPHS[Math.floor(Math.random() * LAO_PARAGRAPHS.length)];
      return RANDOM_PARAGRAPHS[Math.floor(Math.random() * RANDOM_PARAGRAPHS.length)];
    }

    // 11. Color
    if (type === 'color') {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    // Default fallback
    const randStr = Math.random().toString(36).substring(2, 7);
    return isLao ? `ທົດສອບ_${randStr}` : `Auto_${randStr}`;
  }

  // ─── QA Tool: 1-Click Fake File Generator & Attacher ───────────────────────

  function generateMockFile(type, customSizeBytes) {
    const targetSize = (typeof customSizeBytes === 'number' && customSizeBytes > 0)
      ? customSizeBytes
      : getSelectedFileSize();

    const normalizedType = (type || 'pdf').toLowerCase().replace(/^\./, '');

    switch (normalizedType) {
      case 'doc': {
        const magic = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]; // OLE2 doc header
        const buf = createMockFileBuffer(targetSize, magic, 'Microsoft Word 97-2004 Document Sample Test');
        const fname = generateMockFileName('doc', 'sample_document.doc');
        return new File([buf], fname, { type: 'application/msword' });
      }
      case 'docs':
      case 'docx': {
        const magic = [0x50, 0x4B, 0x03, 0x04]; // PK ZIP header
        const buf = createMockFileBuffer(targetSize, magic, '[Content_Types].xml Word Document Test');
        const fname = generateMockFileName('docx', 'sample_document.docx');
        return new File([buf], fname, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }
      case 'xis':
      case 'xls': {
        const magic = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]; // OLE2 xls header
        const buf = createMockFileBuffer(targetSize, magic, 'Microsoft Excel Spreadsheet Sample Test');
        const fname = generateMockFileName('xls', 'sample_sheet.xls');
        return new File([buf], fname, { type: 'application/vnd.ms-excel' });
      }
      case 'xlsx': {
        const magic = [0x50, 0x4B, 0x03, 0x04]; // PK ZIP header
        const buf = createMockFileBuffer(targetSize, magic, '[Content_Types].xml Excel Spreadsheet Test');
        const fname = generateMockFileName('xlsx', 'sample_sheet.xlsx');
        return new File([buf], fname, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }
      case 'ppt':
      case 'pptx': {
        const magic = [0x50, 0x4B, 0x03, 0x04]; // PK ZIP header
        const buf = createMockFileBuffer(targetSize, magic, '[Content_Types].xml PowerPoint Presentation Test');
        const fname = generateMockFileName('pptx', 'sample_presentation.pptx');
        return new File([buf], fname, { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      }
      case 'png': {
        const magic = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]; // PNG signature
        const buf = createMockFileBuffer(targetSize, magic);
        const fname = generateMockFileName('png', 'sample_image.png');
        return new File([buf], fname, { type: 'image/png' });
      }
      case 'jpg':
      case 'jpeg': {
        const magic = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]; // JPEG SOI & JFIF header
        const buf = createMockFileBuffer(targetSize, magic);
        const fname = generateMockFileName('jpg', 'sample_photo.jpg');
        return new File([buf], fname, { type: 'image/jpeg' });
      }
      case 'zip': {
        const magic = [0x50, 0x4B, 0x03, 0x04]; // PK ZIP header
        const buf = createMockFileBuffer(targetSize, magic, 'ZIP Archive Test Package Data');
        const fname = generateMockFileName('zip', 'archive_files.zip');
        return new File([buf], fname, { type: 'application/zip' });
      }
      case 'rar': {
        const magic = [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]; // Rar! signature
        const buf = createMockFileBuffer(targetSize, magic, 'RAR Archive Test Package Data');
        const fname = generateMockFileName('rar', 'archive_files.rar');
        return new File([buf], fname, { type: 'application/x-rar-compressed' });
      }
      case 'csv': {
        const csvHeader = 'id,name,phone,email,date,status\n1,Alex Smith,02055112233,alex@example.com,2026-06-15,Active\n2,Somxai Vongsa,02077889900,somxai@test.la,2026-06-16,Active\n';
        const buf = createMockFileBuffer(targetSize, [], csvHeader);
        const fname = generateMockFileName('csv', 'sample_data.csv');
        return new File([buf], fname, { type: 'text/csv' });
      }
      case 'oversize': {
        const size = Math.max(targetSize, 15 * 1024 * 1024);
        const magic = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34];
        const buf = createMockFileBuffer(size, magic);
        const fname = generateMockFileName('pdf', 'oversize_test_15mb.pdf');
        return new File([buf], fname, { type: 'application/pdf' });
      }
      case 'invalid': {
        const magic = [0x4D, 0x5A]; // MZ executable header
        const buf = createMockFileBuffer(targetSize, magic, 'This program cannot be run in DOS mode.');
        const fname = generateMockFileName('exe', 'malicious_test.exe');
        return new File([buf], fname, { type: 'application/x-msdownload' });
      }
      case 'pdf':
      default: {
        const magic = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]; // %PDF-1.4
        const text = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000118 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n198\n%%EOF\n';
        const buf = createMockFileBuffer(targetSize, magic, text);
        const fname = generateMockFileName('pdf', 'test_document.pdf');
        return new File([buf], fname, { type: 'application/pdf' });
      }
    }
  }

  function getSelectedOrSmartMockFile(inputNode) {
    if (!inputNode) return generateMockFile('pdf');
    const accept = (inputNode.getAttribute('accept') || '').toLowerCase();

    if (accept.includes('.docx') || accept.includes('wordprocessingml')) return generateMockFile('docx');
    if (accept.includes('.doc') || accept.includes('msword')) return generateMockFile('doc');
    if (accept.includes('.xlsx') || accept.includes('spreadsheetml')) return generateMockFile('xlsx');
    if (accept.includes('.xls') || accept.includes('ms-excel')) return generateMockFile('xls');
    if (accept.includes('.pptx') || accept.includes('.ppt') || accept.includes('presentation')) return generateMockFile('ppt');
    if (accept.includes('png')) return generateMockFile('png');
    if (accept.includes('jpg') || accept.includes('jpeg') || accept.includes('image/')) return generateMockFile('jpg');
    if (accept.includes('.zip')) return generateMockFile('zip');
    if (accept.includes('.rar')) return generateMockFile('rar');
    if (accept.includes('.csv')) return generateMockFile('csv');
    if (accept.includes('.pdf')) return generateMockFile('pdf');

    return generateMockFile('pdf');
  }

  function injectFileToInput(target, file) {
    if (!target) return false;
    let fileInput = target;
    const tag = (fileInput.tagName || '').toLowerCase();
    if (tag !== 'input' || (fileInput.type || '').toLowerCase() !== 'file') {
      fileInput = target.querySelector ? target.querySelector('input[type="file"]') : null;
    }
    if (!fileInput) {
      const form = target.closest ? target.closest('form') : null;
      if (form) fileInput = form.querySelector('input[type="file"]');
      if (!fileInput) fileInput = document.querySelector('input[type="file"]');
    }
    if (!fileInput) return false;

    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      flashInputOutline(fileInput);
      return true;
    } catch (err) {
      console.warn('EI: File injection failed', err);
      return false;
    }
  }

  // ─── QA Tool: Form State Save & Restore Profile ────────────────────────────

  function getFormContainer(el) {
    if (!el) return document.body;
    return el.closest('form') || el.closest('[role="form"]') || (['form', 'div', 'section', 'article', 'body'].includes((el.tagName || '').toLowerCase()) ? el : el.parentElement) || document.body;
  }

  function saveFormState(el) {
    const container = getFormContainer(el);
    const inputs = Array.from(container.querySelectorAll('input, textarea, select'));
    if (inputs.length === 0) return 0;

    const data = [];
    inputs.forEach((input, index) => {
      if (isInspectorElement(input)) return;
      const type = (input.type || '').toLowerCase();
      if (['submit', 'button', 'reset', 'file'].includes(type)) return;

      const identifier = input.name ? `name:${input.name}` : (input.id ? `id:${input.id}` : `idx:${index}`);
      let val = (type === 'checkbox' || type === 'radio') ? input.checked : input.value;

      data.push({
        identifier,
        tagName: (input.tagName || '').toLowerCase(),
        type,
        value: val
      });
    });

    if (data.length === 0) return 0;

    const storageKey = `ei_form_${window.location.hostname}_${window.location.pathname}`;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [storageKey]: data });
      } else {
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
    } catch (_) {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }

    return data.length;
  }

  async function restoreFormState(el) {
    const container = getFormContainer(el);
    const inputs = Array.from(container.querySelectorAll('input, textarea, select'));
    if (inputs.length === 0) return 0;

    const storageKey = `ei_form_${window.location.hostname}_${window.location.pathname}`;
    let data = null;

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const res = await new Promise(r => chrome.storage.local.get(storageKey, r));
        data = res ? res[storageKey] : null;
      }
    } catch (_) {}

    if (!data) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) data = JSON.parse(raw);
      } catch (_) {}
    }

    if (!data || !Array.isArray(data) || data.length === 0) return 0;

    let restored = 0;
    inputs.forEach((input, index) => {
      if (isInspectorElement(input)) return;
      const type = (input.type || '').toLowerCase();
      if (['submit', 'button', 'reset', 'file'].includes(type)) return;

      const nameId = input.name ? `name:${input.name}` : null;
      const idId = input.id ? `id:${input.id}` : null;
      const idxId = `idx:${index}`;

      const match = data.find(d => (nameId && d.identifier === nameId) || (idId && d.identifier === idId) || (d.identifier === idxId));
      if (match && match.value !== null && match.value !== undefined) {
        if (type === 'checkbox' || type === 'radio') {
          input.checked = !!match.value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          flashInputOutline(input);
          restored++;
        } else {
          const ok = injectInputValue(input, match.value);
          if (ok) restored++;
        }
      }
    });

    return restored;
  }


  // ─── QA Tool: MaxLength & Length Testing Helpers ──────────────────────────

  function generateLengthTestString(len, isLao = false) {
    if (len <= 0) return '';
    if (len <= 10) {
      return '1234567890'.substring(0, len);
    }
    let result = '';
    let marker = 10;
    const letters = isLao ? 'ກຂຄງຈສຊຍດຕຖທນບປຜຝພຟມຢຣລວຫອຮ' : 'abcdefghijklmnopqrstuvwxyz';
    while (result.length < len) {
      const tag = `[${marker}]`;
      const remaining = len - result.length;
      if (remaining <= tag.length) {
        result += tag.substring(0, remaining);
        break;
      }
      result += tag;
      const chunkLen = Math.min(10 - tag.length, len - result.length);
      for (let i = 0; i < chunkLen; i++) {
        result += letters[(i + marker) % letters.length];
      }
      marker += 10;
    }
    return result.substring(0, len);
  }

  function fillInputWithLength(el, targetLen) {
    if (!el || isInspectorElement(el)) return 0;
    let input = el;
    const tag = (input.tagName || '').toLowerCase();
    if (!['input', 'textarea'].includes(tag) && el.querySelector) {
      input = el.querySelector('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea');
    }
    if (!input) return 0;

    let len = targetLen;
    const currentMax = (input.maxLength > 0 && input.maxLength < 524288) ? input.maxLength : null;

    if (len === 'detect' || len === 'exact') {
      len = currentMax || 50;
    } else if (len === 'overflow') {
      len = (currentMax || 50) + 1;
    } else {
      len = parseInt(len, 10) || 50;
    }

    // If filling more than input.maxLength, unlock constraint so browser doesn't truncate value assignment
    if (currentMax && len > currentMax) {
      input.removeAttribute('maxlength');
      input.maxLength = Math.max(len + 100, 524288);
    }

    const testStr = generateLengthTestString(len, currentLocale === 'LA');
    injectInputValue(input, testStr);
    return len;
  }

  function setInputDomMaxLength(el, targetLen) {
    if (!el || isInspectorElement(el)) return 0;
    let input = el;
    const tag = (input.tagName || '').toLowerCase();
    if (!['input', 'textarea'].includes(tag) && el.querySelector) {
      input = el.querySelector('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea');
    }
    if (!input) return 0;

    let len = targetLen;
    if (len === 'detect' || len === 'exact' || len === 'overflow') {
      len = 50;
    } else {
      len = parseInt(len, 10) || 50;
    }

    input.maxLength = len;
    input.setAttribute('maxlength', String(len));
    flashInputOutline(input);
    return len;
  }

  // ─── QA Tool: Smart Random Auto-Fill for Selected Element ───────────────────

  function autoFillRandomInput(el) {
    if (!el || isInspectorElement(el)) return false;

    let targetInput = el;
    const tag = targetInput.tagName ? targetInput.tagName.toLowerCase() : '';
    if (!['input', 'textarea', 'select'].includes(tag)) {
      targetInput = el.querySelector('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select');
    }
    if (!targetInput) return false;

    if (targetInput.tagName.toLowerCase() === 'input' && (targetInput.type || '').toLowerCase() === 'file') {
      const mockFile = getSelectedOrSmartMockFile(targetInput);
      return injectFileToInput(targetInput, mockFile);
    }

    const val = generateSmartRandomValue(targetInput);
    return injectInputValue(targetInput, val);
  }

  // ─── QA Tool: Auto-Fill Entire Form / Container ───────────────────────────

  function autoFillEntireForm(el) {
    if (!el || isInspectorElement(el)) return 0;

    // Find closest form, or container, or root
    let root = el.closest('form') || el.closest('[role="form"]');
    if (!root) {
      const tag = (el.tagName || '').toLowerCase();
      if (['form', 'div', 'section', 'article', 'main', 'body', 'table'].includes(tag)) {
        root = el;
      } else {
        root = el.parentElement || document.body;
      }
    }

    const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select';
    let inputs = Array.from(root.querySelectorAll(selector));

    // If root had no inputs, fallback to entire document
    if (inputs.length === 0) {
      inputs = Array.from(document.querySelectorAll(selector));
    }

    let filledCount = 0;
    for (const inputNode of inputs) {
      if (isInspectorElement(inputNode)) continue;
      if (inputNode.disabled || inputNode.readOnly) continue;

      if ((inputNode.tagName || '').toLowerCase() === 'input' && (inputNode.type || '').toLowerCase() === 'file') {
        const mockFile = getSelectedOrSmartMockFile(inputNode);
        const ok = injectFileToInput(inputNode, mockFile);
        if (ok) filledCount++;
        continue;
      }

      const val = generateSmartRandomValue(inputNode);
      const ok = injectInputValue(inputNode, val);
      if (ok) filledCount++;
    }

    return filledCount;
  }

  // ─── QA Tool: Inject Value into Input (React/Vue/Angular safe) ─────────────

  function injectInputValue(el, value) {
    if (!el || isInspectorElement(el)) return false;

    let targetInput = el;
    const tag = targetInput.tagName ? targetInput.tagName.toLowerCase() : '';
    if (!['input', 'textarea', 'select'].includes(tag)) {
      targetInput = el.querySelector('input, textarea, select');
    }
    if (!targetInput) return false;

    targetInput.focus();

    const targetTag = targetInput.tagName.toLowerCase();

    // 1. File Input handling
    if (targetTag === 'input' && (targetInput.type || '').toLowerCase() === 'file') {
      const mockFile = getSelectedOrSmartMockFile(targetInput);
      return injectFileToInput(targetInput, mockFile);
    }

    // 2. Dropdown Select handling
    if (targetTag === 'select') {
      const opts = Array.from(targetInput.options).filter(o => !o.disabled && o.value !== '');
      if (opts.length > 0) {
        targetInput.value = opts[Math.floor(Math.random() * opts.length)].value;
      }
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      flashInputOutline(targetInput);
      return true;
    }

    // 3. Checkbox & Radio handling
    if (targetTag === 'input' && ['checkbox', 'radio'].includes(targetInput.type)) {
      targetInput.checked = (targetInput.type === 'radio') ? true : !targetInput.checked;
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      flashInputOutline(targetInput);
      return true;
    }

    // 4. Text, textarea, password, number handling (Bypass React / Vue prototype overriding)
    const nativeInputValSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    const nativeTextAreaValSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (targetTag === 'textarea' && nativeTextAreaValSetter) {
      nativeTextAreaValSetter.call(targetInput, value);
    } else if (targetTag === 'input' && nativeInputValSetter) {
      nativeInputValSetter.call(targetInput, value);
    } else {
      targetInput.value = value;
    }

    // Fire standard input and change events so framework listeners react
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));

    flashInputOutline(targetInput);
    return true;
  }

  function flashInputOutline(targetInput) {
    if (!targetInput) return;
    const prevOutline = targetInput.style.outline;
    const prevTransition = targetInput.style.transition;
    targetInput.style.transition = 'outline 0.15s ease';
    targetInput.style.outline = '3px solid #10b981';
    setTimeout(() => {
      targetInput.style.outline = prevOutline;
      targetInput.style.transition = prevTransition;
    }, 600);
  }

  // ─── QA Tool: Unlock Form / Input Constraints ─────────────────────────────

  function unlockConstraints(el) {
    if (!el || isInspectorElement(el)) return 0;

    const elements = [el, ...el.querySelectorAll('input, textarea, select, button, form')];
    let count = 0;

    for (const node of elements) {
      if (node.nodeType !== Node.ELEMENT_NODE || isInspectorElement(node)) continue;
      let unlocked = false;

      if (node.hasAttribute('disabled')) {
        node.removeAttribute('disabled');
        unlocked = true;
      }
      if (node.hasAttribute('readonly')) {
        node.removeAttribute('readonly');
        unlocked = true;
      }
      if (node.hasAttribute('maxlength')) {
        node.removeAttribute('maxlength');
        node.setAttribute('maxlength', '999999');
        unlocked = true;
      }
      if (node.hasAttribute('pattern')) {
        node.removeAttribute('pattern');
        unlocked = true;
      }
      if (node.hasAttribute('required')) {
        node.removeAttribute('required');
        unlocked = true;
      }
      if (node.tagName.toLowerCase() === 'form') {
        node.setAttribute('novalidate', 'true');
        unlocked = true;
      }

      if (unlocked) count++;
    }

    return count;
  }

  // ─── QA Tool: Toggle Password Visibility ──────────────────────────────────

  function togglePasswordVisibility(el) {
    if (!el || isInspectorElement(el)) return false;

    const inputs = (el.tagName && el.tagName.toLowerCase() === 'input')
      ? [el]
      : Array.from(el.querySelectorAll('input[type="password"], input[data-ei-unmasked]'));

    if (inputs.length === 0) return false;

    let toggled = false;
    for (const inp of inputs) {
      if (inp.type === 'password') {
        inp.type = 'text';
        inp.setAttribute('data-ei-unmasked', 'true');
        toggled = true;
      } else if (inp.getAttribute('data-ei-unmasked') === 'true') {
        inp.type = 'password';
        inp.removeAttribute('data-ei-unmasked');
        toggled = true;
      }
    }
    return toggled;
  }

  // ─── QA Tool: Generate Playwright & Cypress Automation Code ───────────────

  function generatePlaywrightCode(el) {
    const sel = getCssSelector(el);
    const tag = (el.tagName || '').toLowerCase();

    // Priority 1: data-testid
    if (el.dataset && el.dataset.testid) {
      if (['input', 'textarea'].includes(tag)) {
        return `await page.getByTestId('${el.dataset.testid}').fill('test_value');`;
      }
      return `await page.getByTestId('${el.dataset.testid}').click();`;
    }

    // Priority 2: role or semantic
    const role = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label') || (el.innerText || '').trim().slice(0, 30);
    if (role && ariaLabel) {
      return `await page.getByRole('${role}', { name: '${ariaLabel.replace(/'/g, "\\'")}' }).click();`;
    }

    // Default: CSS locator
    if (['input', 'textarea'].includes(tag)) {
      return `await page.locator('${sel.replace(/'/g, "\\'")}').fill('test_value');`;
    }
    return `await page.locator('${sel.replace(/'/g, "\\'")}').click();`;
  }

  function generateCypressCode(el) {
    const sel = getCssSelector(el);
    const tag = (el.tagName || '').toLowerCase();

    if (el.dataset && el.dataset.testid) {
      if (['input', 'textarea'].includes(tag)) {
        return `cy.get('[data-testid="${el.dataset.testid}"]').type('test_value');`;
      }
      return `cy.get('[data-testid="${el.dataset.testid}"]').click();`;
    }

    if (['input', 'textarea'].includes(tag)) {
      return `cy.get('${sel.replace(/'/g, "\\'")}').type('test_value');`;
    }
    return `cy.get('${sel.replace(/'/g, "\\'")}').click();`;
  }

  /**
   * Generates a ready-to-run cURL command for an inspected form, input, or container.
   * @param {HTMLElement} el
   * @returns {string|null}
   */
  function generateFormCurl(el) {
    if (!el) return null;

    // 1. Locate the form or interactive container
    let form = null;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'form') {
      form = el;
    } else {
      form = el.closest('form') || el.querySelector('form');
    }

    const container = form || el;

    // 2. Action URL
    let actionUrl = window.location.href;
    if (form && form.getAttribute('action')) {
      try {
        actionUrl = new URL(form.getAttribute('action'), window.location.href).href;
      } catch (err) {
        actionUrl = form.getAttribute('action');
      }
    } else if (tag === 'a' && el.href) {
      actionUrl = el.href;
    }

    // 3. HTTP Method
    let method = 'POST';
    if (form && form.method) {
      method = form.method.toUpperCase();
    } else if (tag === 'a') {
      method = 'GET';
    }

    // 4. Collect Form Fields
    let formElements = [];
    if (['input', 'textarea', 'select'].includes(tag)) {
      formElements = [el];
    } else {
      formElements = Array.from(container.querySelectorAll('input, textarea, select'));
    }

    const dataPairs = [];
    let hasFiles = false;
    const fileFields = [];

    formElements.forEach((field, index) => {
      if (field.disabled) return;
      const fType = (field.type || '').toLowerCase();
      if (['submit', 'button', 'reset', 'image'].includes(fType)) return;

      const name = field.name || field.id || `field_${index + 1}`;

      if (fType === 'file') {
        hasFiles = true;
        const fileName = (field.files && field.files[0]) ? field.files[0].name : 'sample_document.pdf';
        fileFields.push({ name, fileName });
        return;
      }

      if (fType === 'checkbox') {
        if (field.checked) {
          dataPairs.push({ name, value: field.value || 'on' });
        }
        return;
      }

      if (fType === 'radio') {
        if (field.checked) {
          dataPairs.push({ name, value: field.value || '' });
        }
        return;
      }

      if (fType === 'select-multiple') {
        Array.from(field.selectedOptions || []).forEach((opt) => {
          dataPairs.push({ name, value: opt.value });
        });
        return;
      }

      dataPairs.push({ name, value: field.value || '' });
    });

    // 5. Construct cURL command lines
    const parts = [];

    if (method === 'GET') {
      let finalUrl = actionUrl;
      if (dataPairs.length > 0) {
        try {
          const u = new URL(actionUrl);
          dataPairs.forEach(({ name, value }) => {
            u.searchParams.append(name, value);
          });
          finalUrl = u.href;
        } catch (e) {
          const qs = dataPairs.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join('&');
          const sep = actionUrl.includes('?') ? '&' : '?';
          finalUrl = `${actionUrl}${sep}${qs}`;
        }
      }
      parts.push(`curl -X GET "${finalUrl}"`);
      parts.push(`  -H "Accept: application/json, text/plain, */*"`);
      parts.push(`  -H "User-Agent: ${navigator.userAgent}"`);
      parts.push(`  -H "Referer: ${window.location.href}"`);
    } else {
      // POST, PUT, PATCH, etc.
      parts.push(`curl -X ${method} "${actionUrl}"`);
      if (hasFiles) {
        // multipart/form-data
        dataPairs.forEach(({ name, value }) => {
          parts.push(`  -F "${name}=${value}"`);
        });
        fileFields.forEach(({ name, fileName }) => {
          parts.push(`  -F "${name}=@${fileName}"`);
        });
        parts.push(`  -H "Referer: ${window.location.href}"`);
      } else {
        // application/x-www-form-urlencoded
        parts.push(`  -H "Content-Type: application/x-www-form-urlencoded"`);
        parts.push(`  -H "Origin: ${window.location.origin}"`);
        parts.push(`  -H "Referer: ${window.location.href}"`);
        if (dataPairs.length > 0) {
          const payload = dataPairs.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join('&');
          parts.push(`  --data-raw "${payload}"`);
        }
      }
    }

    return parts.join(' \\\n');
  }

  // ─── Designer & UI/UX Tools: Color Palette, Typography & Tailwind ────────

  function parseColorToHex(colorStr) {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'none') return null;
    if (typeof colorStr !== 'string') return null;
    const trimmed = colorStr.trim();
    if (trimmed === 'rgba(0, 0, 0, 0)' || trimmed === 'transparent') return null;

    // Fast path: standard 6-digit or 8-digit HEX
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed) || /^#[0-9a-fA-F]{8}$/.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toUpperCase();
    }

    // Fast path: standard comma-separated rgb/rgba
    const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d\.]+))?\s*\)/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
      if (a === 0) return null;
      const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
      if (a < 1) {
        const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
        return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
      }
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Fallback: Use browser Canvas 2D to normalize modern syntax:
    // rgb(255 255 255 / 0.5), oklch(...), hsl(...), named colors
    try {
      if (!parseColorToHex._canvas) {
        parseColorToHex._canvas = document.createElement('canvas');
        parseColorToHex._canvas.width = 1;
        parseColorToHex._canvas.height = 1;
        parseColorToHex._ctx = parseColorToHex._canvas.getContext('2d', { willReadFrequently: true });
      }
      const ctx = parseColorToHex._ctx;
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = trimmed;
        const comp = ctx.fillStyle;
        if (comp.startsWith('#')) return comp.toUpperCase();
        const m = comp.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d\.]+))?\s*\)/i);
        if (m) {
          const r = parseInt(m[1], 10);
          const g = parseInt(m[2], 10);
          const b = parseInt(m[3], 10);
          const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
          if (a === 0) return null;
          const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
          if (a < 1) {
            const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
            return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
          }
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }
      }
    } catch (_) {}

    return trimmed;
  }

  function extractElementColors(el) {
    if (!el) return [];
    const cs = window.getComputedStyle(el);
    const candidates = [
      { label: 'Text', raw: cs.color },
      { label: 'Bg', raw: cs.backgroundColor },
      { label: 'Border', raw: cs.borderTopColor },
    ];

    if ((el.tagName || '').toLowerCase() === 'svg' || el.closest('svg')) {
      candidates.push({ label: 'Fill', raw: cs.fill });
      candidates.push({ label: 'Stroke', raw: cs.stroke });
    }

    if (cs.boxShadow && cs.boxShadow !== 'none') {
      const shadowMatch = cs.boxShadow.match(/(rgba?\([^\)]+\)|#[0-9a-fA-F]{3,8})/);
      if (shadowMatch) {
        candidates.push({ label: 'Shadow', raw: shadowMatch[1] });
      }
    }

    const seen = new Set();
    const results = [];

    candidates.forEach((c) => {
      const hex = parseColorToHex(c.raw);
      if (hex && !seen.has(hex)) {
        seen.add(hex);
        results.push({
          hex,
          raw: c.raw,
          label: c.label
        });
      }
    });

    return results;
  }

  function extractTypography(el) {
    if (!el) return null;
    const cs = window.getComputedStyle(el);

    const family = (cs.fontFamily || 'inherit').split(',')[0].replace(/['"]/g, '').trim();
    const size = cs.fontSize || '16px';
    const weightRaw = cs.fontWeight || '400';
    const weightMap = {
      '100': 'Thin',
      '200': 'ExtraLight',
      '300': 'Light',
      '400': 'Regular',
      '500': 'Medium',
      '600': 'SemiBold',
      '700': 'Bold',
      '800': 'ExtraBold',
      '900': 'Black'
    };
    const weightName = weightMap[weightRaw] ? `${weightRaw} (${weightMap[weightRaw]})` : weightRaw;

    let lineHeight = cs.lineHeight || 'normal';
    if (lineHeight.endsWith('px')) {
      const lhVal = parseFloat(lineHeight);
      const fsVal = parseFloat(size);
      if (fsVal > 0) {
        lineHeight = `${Math.round(lhVal)}px (${(lhVal / fsVal).toFixed(1)})`;
      }
    }

    const letterSpacing = cs.letterSpacing || 'normal';
    const textAlign = cs.textAlign || 'left';

    const cssText = `font-family: ${cs.fontFamily};
font-size: ${cs.fontSize};
font-weight: ${cs.fontWeight};
line-height: ${cs.lineHeight};
letter-spacing: ${cs.letterSpacing};
text-align: ${cs.textAlign};`;

    return {
      family,
      size,
      weight: weightName,
      lineHeight,
      letterSpacing,
      textAlign,
      cssText
    };
  }

  function generateTailwindClasses(el) {
    if (!el) return '';
    const cs = window.getComputedStyle(el);
    const classes = [];

    // 1. Display
    const display = cs.display;
    if (display === 'flex') classes.push('flex');
    else if (display === 'inline-flex') classes.push('inline-flex');
    else if (display === 'grid') classes.push('grid');
    else if (display === 'inline-grid') classes.push('inline-grid');
    else if (display === 'block') classes.push('block');
    else if (display === 'inline-block') classes.push('inline-block');
    else if (display === 'none') classes.push('hidden');

    // 2. Position
    const position = cs.position;
    if (['relative', 'absolute', 'fixed', 'sticky'].includes(position)) {
      classes.push(position);
    }

    // 3. Flexbox properties
    if (display === 'flex' || display === 'inline-flex') {
      if (cs.flexDirection === 'column') classes.push('flex-col');
      else if (cs.flexDirection === 'column-reverse') classes.push('flex-col-reverse');
      else if (cs.flexDirection === 'row-reverse') classes.push('flex-row-reverse');

      if (cs.alignItems === 'center') classes.push('items-center');
      else if (cs.alignItems === 'flex-start' || cs.alignItems === 'start') classes.push('items-start');
      else if (cs.alignItems === 'flex-end' || cs.alignItems === 'end') classes.push('items-end');
      else if (cs.alignItems === 'baseline') classes.push('items-baseline');

      if (cs.justifyContent === 'center') classes.push('justify-center');
      else if (cs.justifyContent === 'space-between') classes.push('justify-between');
      else if (cs.justifyContent === 'space-around') classes.push('justify-around');
      else if (cs.justifyContent === 'space-evenly') classes.push('justify-evenly');
      else if (cs.justifyContent === 'flex-end' || cs.justifyContent === 'end') classes.push('justify-end');

      if (cs.flexWrap === 'wrap') classes.push('flex-wrap');
    }

    // Helper: map pixel value to Tailwind spacing scale
    const pxToTw = (val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num === 0) return '0';
      const map = {
        1: '0.5', 2: '0.5', 4: '1', 6: '1.5', 8: '2', 10: '2.5',
        12: '3', 14: '3.5', 16: '4', 20: '5', 24: '6', 28: '7',
        32: '8', 36: '9', 40: '10', 44: '11', 48: '12', 56: '14',
        64: '16', 80: '20', 96: '24'
      };
      if (map[Math.round(num)]) return map[Math.round(num)];
      return `[${Math.round(num)}px]`;
    };

    // 4. Gap
    const gap = parseFloat(cs.gap || cs.rowGap || '0');
    if (gap > 0) {
      classes.push(`gap-${pxToTw(gap)}`);
    }

    // 5. Padding
    const pt = parseFloat(cs.paddingTop) || 0;
    const pr = parseFloat(cs.paddingRight) || 0;
    const pb = parseFloat(cs.paddingBottom) || 0;
    const pl = parseFloat(cs.paddingLeft) || 0;

    if (pt === pr && pr === pb && pb === pl) {
      if (pt > 0) classes.push(`p-${pxToTw(pt)}`);
    } else {
      if (pt === pb && pl === pr) {
        if (pl > 0) classes.push(`px-${pxToTw(pl)}`);
        if (pt > 0) classes.push(`py-${pxToTw(pt)}`);
      } else {
        if (pt > 0) classes.push(`pt-${pxToTw(pt)}`);
        if (pr > 0) classes.push(`pr-${pxToTw(pr)}`);
        if (pb > 0) classes.push(`pb-${pxToTw(pb)}`);
        if (pl > 0) classes.push(`pl-${pxToTw(pl)}`);
      }
    }

    // 6. Margin
    const mt = parseFloat(cs.marginTop) || 0;
    const mr = parseFloat(cs.marginRight) || 0;
    const mb = parseFloat(cs.marginBottom) || 0;
    const ml = parseFloat(cs.marginLeft) || 0;

    if (mt === mr && mr === mb && mb === ml) {
      if (mt > 0) classes.push(`m-${pxToTw(mt)}`);
    } else {
      if (mt === mb && ml === mr) {
        if (ml > 0) classes.push(`mx-${pxToTw(ml)}`);
        if (mt > 0) classes.push(`my-${pxToTw(mt)}`);
      } else {
        if (mt > 0) classes.push(`mt-${pxToTw(mt)}`);
        if (mr > 0) classes.push(`mr-${pxToTw(mr)}`);
        if (mb > 0) classes.push(`mb-${pxToTw(mb)}`);
        if (ml > 0) classes.push(`ml-${pxToTw(ml)}`);
      }
    }

    // 7. Width
    if (cs.width && el.parentElement) {
      const parentW = el.parentElement.getBoundingClientRect().width;
      const elW = el.getBoundingClientRect().width;
      if (parentW > 0 && Math.abs(elW - parentW) < 2) {
        classes.push('w-full');
      }
    }

    // 8. Typography: font-size & font-weight
    const fs = parseFloat(cs.fontSize) || 16;
    const fsMap = {
      12: 'text-xs',
      14: 'text-sm',
      16: 'text-base',
      18: 'text-lg',
      20: 'text-xl',
      24: 'text-2xl',
      30: 'text-3xl',
      36: 'text-4xl',
      48: 'text-5xl'
    };
    if (fsMap[Math.round(fs)]) {
      classes.push(fsMap[Math.round(fs)]);
    } else {
      classes.push(`text-[${Math.round(fs)}px]`);
    }

    const fw = parseInt(cs.fontWeight, 10) || 400;
    if (fw >= 700) classes.push('font-bold');
    else if (fw >= 600) classes.push('font-semibold');
    else if (fw >= 500) classes.push('font-medium');
    else if (fw <= 300) classes.push('font-light');

    if (cs.textAlign === 'center') classes.push('text-center');
    else if (cs.textAlign === 'right') classes.push('text-right');

    // Text color
    const textHex = parseColorToHex(cs.color);
    if (textHex) {
      if (textHex === '#FFFFFF') classes.push('text-white');
      else if (textHex === '#000000') classes.push('text-black');
      else classes.push(`text-[${textHex.toLowerCase()}]`);
    }

    // Background color
    const bgHex = parseColorToHex(cs.backgroundColor);
    if (bgHex) {
      if (bgHex === '#FFFFFF') classes.push('bg-white');
      else if (bgHex === '#000000') classes.push('bg-black');
      else classes.push(`bg-[${bgHex.toLowerCase()}]`);
    }

    // 9. Border & Radius
    const bw = parseFloat(cs.borderTopWidth) || 0;
    if (bw > 0) {
      if (bw === 1) classes.push('border');
      else classes.push(`border-[${Math.round(bw)}px]`);

      const bColorHex = parseColorToHex(cs.borderTopColor);
      if (bColorHex) {
        classes.push(`border-[${bColorHex.toLowerCase()}]`);
      }
    }

    const br = parseFloat(cs.borderTopLeftRadius) || 0;
    if (br > 0) {
      const brMap = {
        2: 'rounded-sm',
        4: 'rounded',
        6: 'rounded-md',
        8: 'rounded-lg',
        12: 'rounded-xl',
        16: 'rounded-2xl',
        24: 'rounded-3xl'
      };
      if (br >= 999 || br >= (el.getBoundingClientRect().height / 2)) {
        classes.push('rounded-full');
      } else if (brMap[Math.round(br)]) {
        classes.push(brMap[Math.round(br)]);
      } else {
        classes.push(`rounded-[${Math.round(br)}px]`);
      }
    }

    // 10. Shadow
    if (cs.boxShadow && cs.boxShadow !== 'none') {
      classes.push('shadow-md');
    }

    return classes.join(' ');
  }

  // ─── Ruler Guide & Selected Element Measurement ──────────────────────────

  function clearRulerGuide() {
    if (rulerContainer) {
      rulerContainer.innerHTML = '';
      rulerContainer.style.display = 'none';
    }
  }

  function updateSelectedBox(el) {
    if (!el || !selectedBox || isInspectorElement(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      selectedBox.style.display = 'none';
      return;
    }
    Object.assign(selectedBox.style, {
      display: 'block',
      top: `${Math.max(0, r.top)}px`,
      left: `${Math.max(0, r.left)}px`,
      width: `${r.width}px`,
      height: `${r.height}px`
    });
    selectedBox.setAttribute('data-label', `Selected: ${buildLabel(el)}`);
  }

  function hideSelectedBox() {
    if (selectedBox) selectedBox.style.display = 'none';
  }

  function renderRulerGuide(sEl, tEl) {
    if (!sEl || !tEl || sEl === tEl || !rulerContainer) {
      clearRulerGuide();
      return;
    }
    if (isInspectorElement(sEl) || isInspectorElement(tEl)) return;

    const s = sEl.getBoundingClientRect();
    const t = tEl.getBoundingClientRect();

    if ((s.width === 0 && s.height === 0) || (t.width === 0 && t.height === 0)) {
      clearRulerGuide();
      return;
    }

    rulerContainer.innerHTML = '';
    rulerContainer.style.display = 'block';

    updateSelectedBox(sEl);

    // Helper to create a line + badge
    const addGuide = (x1, y1, x2, y2, distance, orientation) => {
      const dist = Math.round(distance);
      if (dist <= 0) return;

      const line = document.createElement('div');
      line.className = `ei-ruler-line ${orientation === 'h' ? 'ei-ruler-line--h' : 'ei-ruler-line--v'}`;

      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = orientation === 'h' ? Math.abs(x2 - x1) : 1.5;
      const height = orientation === 'v' ? Math.abs(y2 - y1) : 1.5;

      Object.assign(line.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      });
      rulerContainer.appendChild(line);

      const badge = document.createElement('div');
      badge.className = 'ei-ruler-badge';
      badge.textContent = `${dist}px`;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      Object.assign(badge.style, {
        left: `${midX}px`,
        top: `${midY}px`
      });
      rulerContainer.appendChild(badge);
    };

    // Check if target is inside selected
    const tInsideS = (t.left >= s.left && t.right <= s.right && t.top >= s.top && t.bottom <= s.bottom);
    // Check if selected is inside target
    const sInsideT = (s.left >= t.left && s.right <= t.right && s.top >= t.top && s.bottom <= t.bottom);

    if (tInsideS) {
      const midX = t.left + t.width / 2;
      const midY = t.top + t.height / 2;
      if (t.top - s.top > 0) addGuide(midX, s.top, midX, t.top, t.top - s.top, 'v');
      if (s.bottom - t.bottom > 0) addGuide(midX, t.bottom, midX, s.bottom, s.bottom - t.bottom, 'v');
      if (t.left - s.left > 0) addGuide(s.left, midY, t.left, midY, t.left - s.left, 'h');
      if (s.right - t.right > 0) addGuide(t.right, midY, s.right, midY, s.right - t.right, 'h');
      return;
    }

    if (sInsideT) {
      const midX = s.left + s.width / 2;
      const midY = s.top + s.height / 2;
      if (s.top - t.top > 0) addGuide(midX, t.top, midX, s.top, s.top - t.top, 'v');
      if (t.bottom - s.bottom > 0) addGuide(midX, s.bottom, midX, t.bottom, t.bottom - s.bottom, 'v');
      if (s.left - t.left > 0) addGuide(t.left, midY, s.left, midY, s.left - t.left, 'h');
      if (t.right - s.right > 0) addGuide(s.right, midY, t.right, midY, t.right - s.right, 'h');
      return;
    }

    // External or partial overlap:
    // 1. Horizontal distance
    if (t.right <= s.left) {
      const midY = (Math.max(s.top, t.top) + Math.min(s.bottom, t.bottom)) / 2;
      const validY = (s.bottom >= t.top && s.top <= t.bottom) ? midY : (s.top + s.height / 2);
      addGuide(t.right, validY, s.left, validY, s.left - t.right, 'h');
    } else if (s.right <= t.left) {
      const midY = (Math.max(s.top, t.top) + Math.min(s.bottom, t.bottom)) / 2;
      const validY = (s.bottom >= t.top && s.top <= t.bottom) ? midY : (s.top + s.height / 2);
      addGuide(s.right, validY, t.left, validY, t.left - s.right, 'h');
    }

    // 2. Vertical distance
    if (t.bottom <= s.top) {
      const midX = (Math.max(s.left, t.left) + Math.min(s.right, t.right)) / 2;
      const validX = (s.right >= t.left && s.left <= t.right) ? midX : (s.left + s.width / 2);
      addGuide(validX, t.bottom, validX, s.top, s.top - t.bottom, 'v');
    } else if (s.bottom <= t.top) {
      const midX = (Math.max(s.left, t.left) + Math.min(s.right, t.right)) / 2;
      const validX = (s.right >= t.left && s.left <= t.right) ? midX : (s.left + s.width / 2);
      addGuide(validX, s.bottom, validX, t.top, t.top - s.bottom, 'v');
    }
  }

  // ─── Figma Design Exporter Helpers ────────────────────────────────────────

  function escapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function getBase64FromImage(imgNode) {
    if (!imgNode) return '';
    try {
      if (imgNode.naturalWidth > 0 && imgNode.naturalHeight > 0) {
        const c = document.createElement('canvas');
        c.width = imgNode.naturalWidth;
        c.height = imgNode.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(imgNode, 0, 0);
        return c.toDataURL('image/png');
      }
    } catch (_) {}
    return imgNode.currentSrc || imgNode.src || '';
  }

  function extractTextLayers(rootEl, rootRect, isFullPage = false) {
    const textLayers = [];
    if (!rootEl || !rootRect) return textLayers;

    const walker = document.createTreeWalker(
      rootEl,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.parentElement) {
            if (isInspectorElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
            // Exclude text inside SVGs (handled by vector SVG icon renderer)
            if (node.parentElement.tagName === 'svg' || node.parentElement.closest('svg')) {
              return NodeFilter.FILTER_REJECT;
            }
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let current;
    while ((current = walker.nextNode())) {
      const parent = current.parentElement;
      if (!parent) continue;

      const cs = window.getComputedStyle(parent);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
        continue;
      }

      try {
        const range = document.createRange();
        range.selectNodeContents(current);
        const rects = range.getClientRects();

        const fontFamily = (cs.fontFamily || 'sans-serif').split(',')[0].replace(/['"]/g, '').trim() || 'sans-serif';
        const fontSize = parseFloat(cs.fontSize) || 14;
        const fontWeight = cs.fontWeight || '400';
        const fill = parseColorToHex(cs.color) || '#000000';
        const letterSpacing = parseFloat(cs.letterSpacing) || 0;
        const textTransform = cs.textTransform;

        let rawText = current.textContent || '';
        if (textTransform === 'uppercase') rawText = rawText.toUpperCase();
        else if (textTransform === 'lowercase') rawText = rawText.toLowerCase();
        else if (textTransform === 'capitalize') {
          rawText = rawText.replace(/\b\w/g, c => c.toUpperCase());
        }

        const trimmed = rawText.trim();
        if (!trimmed) continue;

        if (rects && rects.length > 0) {
          const firstR = rects[0];
          if (isFullPage && (firstR.bottom < 0 || firstR.top > window.innerHeight || firstR.right < 0 || firstR.left > window.innerWidth)) {
            continue;
          }

          if (rects.length === 1) {
            const r = rects[0];
            const x = Math.round(r.left - rootRect.left);
            const y = Math.round(r.bottom - rootRect.top - (fontSize * 0.18));
            let extra = letterSpacing ? ` letter-spacing="${letterSpacing}px"` : '';
            textLayers.push(
              `<text x="${x}" y="${y}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fill}"${extra}>${escapeXml(trimmed)}</text>`
            );
          } else {
            const words = trimmed.split(/\s+/);
            for (let i = 0; i < rects.length; i++) {
              const r = rects[i];
              if (r.width <= 0 || r.height <= 0) continue;
              if (isFullPage && (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth)) {
                continue;
              }
              const x = Math.round(r.left - rootRect.left);
              const y = Math.round(r.bottom - rootRect.top - (fontSize * 0.18));
              let extra = letterSpacing ? ` letter-spacing="${letterSpacing}px"` : '';
              const startIdx = Math.floor((i / rects.length) * words.length);
              const endIdx = Math.floor(((i + 1) / rects.length) * words.length);
              const lineChunk = words.slice(startIdx, endIdx).join(' ');
              if (lineChunk) {
                textLayers.push(
                  `<text x="${x}" y="${y}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fill}"${extra}>${escapeXml(lineChunk)}</text>`
                );
              }
            }
          }
        } else {
          const pr = parent.getBoundingClientRect();
          if (isFullPage && (pr.bottom < 0 || pr.top > window.innerHeight || pr.right < 0 || pr.left > window.innerWidth)) {
            continue;
          }
          const x = Math.round(pr.left - rootRect.left);
          const y = Math.round(pr.top - rootRect.top + fontSize);
          textLayers.push(
            `<text x="${x}" y="${y}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fill}">${escapeXml(trimmed)}</text>`
          );
        }
      } catch (_) {}
    }

    // Also extract input and textarea values or placeholders as clean text layers
    try {
      const inputs = [];
      if (rootEl.tagName === 'INPUT' || rootEl.tagName === 'TEXTAREA') inputs.push(rootEl);
      rootEl.querySelectorAll('input, textarea').forEach(inp => inputs.push(inp));

      inputs.forEach(inp => {
        if (isInspectorElement(inp)) return;
        const cs = window.getComputedStyle(inp);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;

        const r = inp.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        if (isFullPage && (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth)) return;

        const isPassword = inp.type === 'password';
        let displayText = inp.value;
        let isPlaceholder = false;
        if (displayText) {
          if (isPassword) displayText = '••••••••';
        } else if (inp.placeholder) {
          displayText = inp.placeholder;
          isPlaceholder = true;
        }

        if (!displayText || !displayText.trim()) return;

        const fontFamily = (cs.fontFamily || 'sans-serif').split(',')[0].replace(/['"]/g, '').trim() || 'sans-serif';
        const fontSize = parseFloat(cs.fontSize) || 14;
        const fontWeight = cs.fontWeight || '400';
        const padLeft = parseFloat(cs.paddingLeft) || 12;
        const fill = isPlaceholder ? '#94A3B8' : (parseColorToHex(cs.color) || '#000000');

        const x = Math.round(r.left - rootRect.left + padLeft);
        const y = Math.round(r.top - rootRect.top + (r.height / 2) + (fontSize * 0.35));

        textLayers.push(
          `<text x="${x}" y="${y}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fill}">${escapeXml(displayText.trim())}</text>`
        );
      });
    } catch (_) {}

    return textLayers;
  }

  async function captureElementCanvasWithoutText(el, format = 'png', quality = 0.95, isFullPage = false) {
    const modified = [];
    let tempStyleEl = null;

    try {
      // 1. Lock all SVG icons and their children with their computed colors
      // so they NEVER turn transparent when text colors are masked!
      const allSvgs = el.querySelectorAll ? Array.from(el.querySelectorAll('svg')) : [];
      if (el.tagName === 'svg') allSvgs.unshift(el);

      allSvgs.forEach((svg) => {
        const csSvg = window.getComputedStyle(svg);
        const compColor = csSvg.color || '#000000';
        const compStroke = csSvg.stroke && csSvg.stroke !== 'none' ? csSvg.stroke : null;
        const compFill = csSvg.fill && csSvg.fill !== 'none' ? csSvg.fill : null;

        modified.push({
          elem: svg,
          isSvg: true,
          color: svg.style.getPropertyValue('color'),
          priority: svg.style.getPropertyPriority('color'),
          stroke: svg.getAttribute('stroke'),
          fill: svg.getAttribute('fill')
        });

        svg.style.setProperty('color', compColor, 'important');
        if (svg.getAttribute('stroke') === 'currentColor' || (!svg.getAttribute('stroke') && compStroke)) {
          svg.setAttribute('stroke', compStroke || compColor);
        }
        if (svg.getAttribute('fill') === 'currentColor' || (!svg.getAttribute('fill') && compFill)) {
          svg.setAttribute('fill', compFill || compColor);
        }

        svg.querySelectorAll('*').forEach((child) => {
          if (child.getAttribute('stroke') === 'currentColor') {
            modified.push({ elem: child, isAttr: true, attr: 'stroke', val: 'currentColor' });
            child.setAttribute('stroke', compColor);
          }
          if (child.getAttribute('fill') === 'currentColor') {
            modified.push({ elem: child, isAttr: true, attr: 'fill', val: 'currentColor' });
            child.setAttribute('fill', compColor);
          }
        });
      });

      // 2. Hide input/textarea text and placeholder cleanly without mutating values or changing box model
      tempStyleEl = document.createElement('style');
      tempStyleEl.id = 'mv-temp-figma-hide-text';
      tempStyleEl.textContent = `
        input, textarea { color: transparent !important; }
        input::placeholder, textarea::placeholder { color: transparent !important; }
      `;
      (document.head || document.documentElement).appendChild(tempStyleEl);

      // 3. Mask text color only on elements that actually have direct text nodes and are NOT SVGs
      const processElement = (elem) => {
        if (!elem || elem.nodeType !== Node.ELEMENT_NODE || isInspectorElement(elem)) return;
        if (elem.tagName === 'svg' || (elem.closest && elem.closest('svg'))) return;

        const cs = window.getComputedStyle(elem);

        // Only set color: transparent if element directly contains non-empty text
        let hasDirectText = false;
        for (let i = 0; i < elem.childNodes.length; i++) {
          const ch = elem.childNodes[i];
          if (ch.nodeType === Node.TEXT_NODE && ch.textContent && ch.textContent.trim().length > 0) {
            hasDirectText = true;
            break;
          }
        }

        if (hasDirectText && cs.color && cs.color !== 'rgba(0, 0, 0, 0)' && cs.color !== 'transparent') {
          modified.push({
            elem,
            color: elem.style.getPropertyValue('color'),
            priority: elem.style.getPropertyPriority('color')
          });
          elem.style.setProperty('color', 'transparent', 'important');
        }
      };

      processElement(el);
      if (el.querySelectorAll) {
        el.querySelectorAll('*').forEach(processElement);
      }

      return await captureElementCanvas(el, format, quality, isFullPage);
    } finally {
      // Clean up temporary styles
      if (tempStyleEl && tempStyleEl.parentNode) {
        tempStyleEl.parentNode.removeChild(tempStyleEl);
      }

      // Restore all original styles and attributes
      modified.forEach((item) => {
        if (item.isAttr) {
          item.elem.setAttribute(item.attr, item.val);
        } else if (item.isSvg) {
          if (item.color) item.elem.style.setProperty('color', item.color, item.priority);
          else item.elem.style.removeProperty('color');

          if (item.stroke !== null && item.stroke !== undefined) item.elem.setAttribute('stroke', item.stroke);
          else item.elem.removeAttribute('stroke');

          if (item.fill !== null && item.fill !== undefined) item.elem.setAttribute('fill', item.fill);
          else item.elem.removeAttribute('fill');
        } else {
          if (item.color) item.elem.style.setProperty('color', item.color, item.priority);
          else item.elem.style.removeProperty('color');
        }
      });
    }
  }

  async function copyFigmaRealLook(el, btnElement, isFullPage = false) {
    const targetEl = isFullPage ? (document.body || document.documentElement) : el;
    if (!targetEl) return;
    flashElement(btnElement, '⏳ Rendering...', 'mv-copy--success');

    const rootRect = isFullPage
      ? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight }
      : targetEl.getBoundingClientRect();
    const W = Math.max(1, Math.round(rootRect.width));
    const H = Math.max(1, Math.round(rootRect.height));

    const cs = isFullPage ? { borderTopLeftRadius: '0' } : window.getComputedStyle(targetEl);
    const rootRx = parseFloat(cs.borderTopLeftRadius) || 0;

    // 1. Capture pixel-perfect render WITHOUT text (so no double-text / clash in Figma!)
    const captured = await captureElementCanvasWithoutText(targetEl, 'png', 0.95, isFullPage);
    if (!captured || !captured.canvas) {
      flashElement(btnElement, '✕ Capture Failed', 'mv-copy--error');
      showToast('✕ Failed to capture ' + (isFullPage ? 'full page' : 'element') + ' graphics');
      return;
    }

    const snapshotDataUrl = captured.canvas.toDataURL('image/png');

    // 2. Extract all editable text layers with exact positions
    const textLayers = extractTextLayers(targetEl, rootRect, isFullPage);

    // 3. Assemble unified SVG for Figma (Single Frame, clean overlay, zero ghosting)
    const clipDef = (!isFullPage && rootRx > 0) ? `
    <clipPath id="figma-bg-clip">
      <rect width="${W}" height="${H}" rx="${Math.round(rootRx)}" ry="${Math.round(rootRx)}" />
    </clipPath>` : '';

    const clipAttr = (!isFullPage && rootRx > 0) ? ' clip-path="url(#figma-bg-clip)"' : '';

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${clipDef}
  </defs>
  <!-- Background Graphic Layer (Text masked out to eliminate double-text) -->
  <image id="background-graphic" x="0" y="0" width="${W}" height="${H}" href="${snapshotDataUrl}" preserveAspectRatio="none"${clipAttr} />
  <!-- Editable Text Layers (Clean overlay) -->
  <g id="editable-text">
    ${textLayers.join('\n    ')}
  </g>
</svg>`;

    // 4. Write to clipboard
    let success = false;
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      try {
        const blobPlain = new Blob([svgContent], { type: 'text/plain' });
        const blobHtml = new Blob([svgContent], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': blobPlain,
            'text/html': blobHtml
          })
        ]);
        success = true;
      } catch (err) {
        console.warn('[Inspector] Async clipboard SVG write failed:', err);
      }
    }

    const successMsg = isFullPage ? '✓ Copied Full Page!' : '✓ Copied for Figma!';
    const toastMsg = isFullPage
      ? '❖ Copied Full Page Layout for Figma! Press Ctrl+V in Figma to paste screen'
      : '❖ Copied for Figma! Clean background + editable text overlay (No double-text)';

    if (!success) {
      success = await copyToClipboard(svgContent, btnElement, successMsg);
      if (success) {
        showToast(toastMsg);
      }
      return;
    }

    flashElement(btnElement, successMsg, 'mv-copy--success');
    showToast(toastMsg);
  }

  function elementToSvgString(el, isFullPage = false) {
    const targetEl = isFullPage ? (document.body || document.documentElement) : el;
    if (!targetEl || !targetEl.getBoundingClientRect) return '';

    const rootRect = isFullPage
      ? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight }
      : targetEl.getBoundingClientRect();
    const W = Math.max(1, Math.round(rootRect.width));
    const H = Math.max(1, Math.round(rootRect.height));

    const tag = (targetEl.tagName || '').toLowerCase();

    // 1. If element itself is an SVG
    if (!isFullPage && tag === 'svg') {
      const clone = targetEl.cloneNode(true);
      if (!clone.getAttribute('xmlns')) {
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      if (!clone.getAttribute('viewBox')) {
        clone.setAttribute('viewBox', `0 0 ${W} ${H}`);
      }
      if (!clone.getAttribute('width')) {
        clone.setAttribute('width', String(W));
      }
      if (!clone.getAttribute('height')) {
        clone.setAttribute('height', String(H));
      }
      return clone.outerHTML;
    }

    // 2. If element is inside an SVG (e.g. <path>, <g>, <circle>)
    if (!isFullPage && targetEl.closest && targetEl.closest('svg')) {
      const parentSvg = targetEl.closest('svg');
      const clone = parentSvg.cloneNode(true);
      if (!clone.getAttribute('xmlns')) {
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      return clone.outerHTML;
    }

    // 3. If element is a single <img>
    if (!isFullPage && tag === 'img') {
      const src = getBase64FromImage(targetEl);
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n  <image x="0" y="0" width="${W}" height="${H}" href="${escapeXml(src)}" preserveAspectRatio="xMidYMid slice" />\n</svg>`;
    }

    // 4. Hierarchical DOM to SVG serialization for HTML elements
    const svgLayers = [];
    const MAX_NODES = 1200;
    let nodeCount = 0;

    function addTextNodes(node, cs, x, y, w) {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const raw = child.textContent || '';
          const trimmed = raw.replace(/\s+/g, ' ').trim();
          if (trimmed.length > 0) {
            const fontFamily = (cs.fontFamily || 'sans-serif').split(',')[0].replace(/['"]/g, '').trim() || 'sans-serif';
            const fontSize = parseFloat(cs.fontSize) || 14;
            const fontWeight = cs.fontWeight || '400';
            const fill = parseColorToHex(cs.color) || '#000000';
            const textAlign = cs.textAlign || 'left';

            let textAnchor = 'start';
            let textX = x + (parseFloat(cs.paddingLeft) || 0);
            if (textAlign === 'center') {
              textAnchor = 'middle';
              textX = x + (w / 2);
            } else if (textAlign === 'right' || textAlign === 'end') {
              textAnchor = 'end';
              textX = x + w - (parseFloat(cs.paddingRight) || 0);
            }

            let textY;
            const lineHeight = parseFloat(cs.lineHeight);
            const padTop = parseFloat(cs.paddingTop) || 0;
            if (!isNaN(lineHeight) && lineHeight > fontSize) {
              textY = y + padTop + (fontSize * 0.8) + ((lineHeight - fontSize) / 2);
            } else {
              textY = y + padTop + (fontSize * 0.82);
            }

            let extra = '';
            const letterSpacing = parseFloat(cs.letterSpacing);
            if (!isNaN(letterSpacing) && letterSpacing !== 0) {
              extra += ` letter-spacing="${letterSpacing}px"`;
            }

            svgLayers.push(`  <text x="${Math.round(textX)}" y="${Math.round(textY)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fill}" text-anchor="${textAnchor}"${extra}>${escapeXml(trimmed)}</text>`);
          }
        }
      }
    }

    function traverse(node, isRoot = false) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
      if (isInspectorElement(node)) return;
      if (nodeCount++ > MAX_NODES) return;

      const r = node.getBoundingClientRect();
      if (!isRoot && (r.width <= 0 || r.height <= 0)) return;

      // Skip elements completely outside visible bounding box
      if (!isRoot && (r.right < rootRect.left || r.left > rootRect.right || r.bottom < rootRect.top || r.top > rootRect.bottom)) {
        return;
      }

      const cs = window.getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
        return;
      }

      const x = isRoot ? 0 : Math.round(r.left - rootRect.left);
      const y = isRoot ? 0 : Math.round(r.top - rootRect.top);
      const w = isRoot ? W : Math.round(r.width);
      const h = isRoot ? H : Math.round(r.height);

      const nTag = (node.tagName || '').toLowerCase();

      // Nested SVG icon or graphic with 100% resolved currentColor, stroke & fill preservation
      if (!isRoot && nTag === 'svg') {
        const csSvg = window.getComputedStyle(node);
        const computedColor = parseColorToHex(csSvg.color) || '#000000';
        const csStroke = parseColorToHex(csSvg.stroke);
        const csFill = parseColorToHex(csSvg.fill);
        const strokeW = parseFloat(csSvg.strokeWidth) || parseFloat(node.getAttribute('stroke-width')) || 0;
        const strokeCap = csSvg.strokeLinecap || node.getAttribute('stroke-linecap') || 'round';
        const strokeJoin = csSvg.strokeLinejoin || node.getAttribute('stroke-linejoin') || 'round';

        const svgClone = node.cloneNode(true);
        if (!svgClone.getAttribute('xmlns')) {
          svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        if (!svgClone.getAttribute('viewBox')) {
          svgClone.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
        svgClone.setAttribute('width', String(w));
        svgClone.setAttribute('height', String(h));

        // Resolve stroke on root SVG
        const origStroke = svgClone.getAttribute('stroke');
        if (origStroke === 'currentColor') {
          svgClone.setAttribute('stroke', computedColor);
        } else if (!origStroke && csStroke && csStroke !== 'none') {
          svgClone.setAttribute('stroke', csStroke);
        }

        // Ensure stroke attributes are present if icon is stroked
        if (svgClone.getAttribute('stroke') && svgClone.getAttribute('stroke') !== 'none') {
          if (!svgClone.getAttribute('stroke-width') && strokeW > 0) {
            svgClone.setAttribute('stroke-width', String(strokeW));
          }
          if (!svgClone.getAttribute('stroke-linecap')) {
            svgClone.setAttribute('stroke-linecap', strokeCap);
          }
          if (!svgClone.getAttribute('stroke-linejoin')) {
            svgClone.setAttribute('stroke-linejoin', strokeJoin);
          }
        }

        // Resolve fill on root SVG
        const origFill = svgClone.getAttribute('fill');
        if (origFill === 'currentColor') {
          svgClone.setAttribute('fill', computedColor);
        } else if (!origFill && csFill && csFill !== 'none') {
          svgClone.setAttribute('fill', csFill);
        }

        // Resolve currentColor on all descendants
        svgClone.querySelectorAll('*').forEach((childEl) => {
          if (childEl.getAttribute('fill') === 'currentColor') {
            childEl.setAttribute('fill', computedColor);
          }
          if (childEl.getAttribute('stroke') === 'currentColor') {
            childEl.setAttribute('stroke', computedColor);
          }
        });

        svgLayers.push(`  <g transform="translate(${x}, ${y})">${svgClone.outerHTML}</g>`);
        return; // Do not descend into svg children
      }

      // Nested <img> with base64 data URL
      if (!isRoot && nTag === 'img') {
        const src = getBase64FromImage(node);
        if (src && !src.startsWith('chrome-extension://')) {
          svgLayers.push(`  <image x="${x}" y="${y}" width="${w}" height="${h}" href="${escapeXml(src)}" preserveAspectRatio="xMidYMid slice" />`);
        }
        return;
      }

      // Nested <canvas>
      if (!isRoot && nTag === 'canvas') {
        try {
          const cData = node.toDataURL('image/png');
          if (cData) {
            svgLayers.push(`  <image x="${x}" y="${y}" width="${w}" height="${h}" href="${cData}" />`);
            return;
          }
        } catch (_) {}
      }

      // Background, Borders, Dividers, Radius and Tailwind Ring
      const bTop = parseFloat(cs.borderTopWidth) || 0;
      const bRight = parseFloat(cs.borderRightWidth) || 0;
      const bBottom = parseFloat(cs.borderBottomWidth) || 0;
      const bLeft = parseFloat(cs.borderLeftWidth) || 0;

      const cTop = parseColorToHex(cs.borderTopColor);
      const cRight = parseColorToHex(cs.borderRightColor);
      const cBottom = parseColorToHex(cs.borderBottomColor);
      const cLeft = parseColorToHex(cs.borderLeftColor);

      const bgHex = parseColorToHex(cs.backgroundColor);
      const rx = parseFloat(cs.borderTopLeftRadius) || 0;

      // Detect Tailwind ring / box-shadow border
      let ringWidth = 0;
      let ringColor = null;
      if (cs.boxShadow && cs.boxShadow !== 'none') {
        const ringMatch = cs.boxShadow.match(/(?:inset\s+)?(?:([a-z0-9#(),.\s\/]+)\s+)?0px\s+0px\s+0px\s+([\d\.]+)px(?:\s+([a-z0-9#(),.\s\/]+))?/i);
        if (ringMatch) {
          ringWidth = parseFloat(ringMatch[2]) || 0;
          ringColor = parseColorToHex(ringMatch[1] || ringMatch[3]);
        }
      }

      const isFullBorder = (bTop > 0 && bBottom > 0 && bLeft > 0 && bRight > 0);
      const hasRing = ringWidth > 0 && !!ringColor;
      const hasBg = !!bgHex;

      if (hasBg || isFullBorder || hasRing) {
        let rectStr = `  <rect x="${x}" y="${y}" width="${w}" height="${h}"`;
        if (rx > 0) rectStr += ` rx="${Math.round(rx)}" ry="${Math.round(rx)}"`;
        if (hasBg) rectStr += ` fill="${bgHex}"`;
        else rectStr += ` fill="none"`;

        if (isFullBorder) {
          rectStr += ` stroke="${cTop || '#000000'}" stroke-width="${bTop}"`;
        } else if (hasRing) {
          rectStr += ` stroke="${ringColor}" stroke-width="${ringWidth}"`;
        }
        const op = parseFloat(cs.opacity);
        if (!isNaN(op) && op < 1) rectStr += ` opacity="${op}"`;
        rectStr += ` />`;
        svgLayers.push(rectStr);
      } else {
        // Handle partial borders (e.g. divider lines: border-bottom)
        if (bBottom > 0 && cBottom && cs.borderBottomStyle !== 'none') {
          svgLayers.push(`  <line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${cBottom}" stroke-width="${bBottom}" />`);
        } else if (bTop > 0 && cTop && cs.borderTopStyle !== 'none') {
          svgLayers.push(`  <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${cTop}" stroke-width="${bTop}" />`);
        } else if (bLeft > 0 && cLeft && cs.borderLeftStyle !== 'none') {
          svgLayers.push(`  <line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${cLeft}" stroke-width="${bLeft}" />`);
        } else if (bRight > 0 && cRight && cs.borderRightStyle !== 'none') {
          svgLayers.push(`  <line x1="${x + w}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="${cRight}" stroke-width="${bRight}" />`);
        }
      }

      // Check CSS background-image
      const bgImg = cs.backgroundImage;
      if (bgImg && bgImg !== 'none' && bgImg.includes('url(')) {
        const m = bgImg.match(/url\(["']?([^"']+)["']?\)/);
        if (m && m[1] && !m[1].startsWith('chrome-extension://')) {
          svgLayers.push(`  <image x="${x}" y="${y}" width="${w}" height="${h}" href="${escapeXml(m[1])}" preserveAspectRatio="xMidYMid slice" />`);
        }
      }

      // Input / Textarea element value or placeholder rendering
      if (nTag === 'input' || nTag === 'textarea') {
        const isPassword = node.type === 'password';
        let inputDisplay = node.value;
        let isPlaceholder = false;
        if (inputDisplay) {
          if (isPassword) inputDisplay = '•'.repeat(Math.min(node.value.length, 12));
        } else if (node.placeholder) {
          inputDisplay = node.placeholder;
          isPlaceholder = true;
        }

        if (inputDisplay && inputDisplay.trim()) {
          const fontFamily = (cs.fontFamily || 'sans-serif').split(',')[0].replace(/['"]/g, '').trim() || 'sans-serif';
          const fontSize = parseFloat(cs.fontSize) || 14;
          const fontWeight = cs.fontWeight || '400';
          const padLeft = parseFloat(cs.paddingLeft) || 12;
          const fill = isPlaceholder ? '#94A3B8' : (parseColorToHex(cs.color) || '#000000');
          const textX = x + padLeft;
          const textY = Math.round(y + (h / 2) + (fontSize * 0.35));
          svgLayers.push(`  <text x="${Math.round(textX)}" y="${Math.round(textY)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fill}">${escapeXml(inputDisplay.trim())}</text>`);
        }
      }

      // Direct text nodes inside this element
      addTextNodes(node, cs, x, y, w);

      // Descend into children
      for (const child of node.children) {
        traverse(child, false);
      }
    }

    traverse(targetEl, true);

    if (svgLayers.length === 0) {
      svgLayers.push(`  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#94a3b8" stroke-dasharray="4 4" />`);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n${svgLayers.join('\n')}\n</svg>`;
  }

  async function copySvgForFigma(el, btnElement, isFullPage = false) {
    const targetEl = isFullPage ? (document.body || document.documentElement) : el;
    if (!targetEl) return;
    const svgText = elementToSvgString(targetEl, isFullPage);
    if (!svgText) {
      flashElement(btnElement, '✕ SVG Error', 'mv-copy--error');
      showToast('✕ Could not generate SVG for this ' + (isFullPage ? 'full page' : 'element'));
      return;
    }

    let success = false;
    // Modern Clipboard API: provide both text/plain and text/html so Figma interprets vector XML
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      try {
        const blobPlain = new Blob([svgText], { type: 'text/plain' });
        const blobHtml = new Blob([svgText], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': blobPlain,
            'text/html': blobHtml
          })
        ]);
        success = true;
      } catch (err) {
        console.warn('[Inspector] Async clipboard SVG write failed, trying writeText fallback:', err);
      }
    }

    const successMsg = isFullPage ? '✓ Copied Full Page SVG!' : '✓ Copied SVG for Figma!';
    const toastMsg = isFullPage
      ? '❖ Copied Full Page Vector! Press Ctrl+V in Figma to paste screen layers'
      : '❖ Copied SVG Vector! Press Ctrl+V in Figma to paste layers';

    // Fallback to plain text writeText or execCommand
    if (!success) {
      success = await copyToClipboard(svgText, btnElement, successMsg);
      if (success) {
        showToast(toastMsg);
      }
      return;
    }

    flashElement(btnElement, successMsg, 'mv-copy--success');
    showToast(toastMsg);
  }

  async function copyPngForFigma(el, btnElement, isFullPage = false) {
    const targetEl = isFullPage ? (document.body || document.documentElement) : el;
    if (!targetEl) return;
    flashElement(btnElement, '⏳ Capturing...', 'mv-copy--success');

    const captured = await captureElementCanvas(targetEl, 'png', 0.95, isFullPage);
    if (!captured || !captured.canvas) {
      flashElement(btnElement, '✕ Capture Failed', 'mv-copy--error');
      showToast('✕ Failed to capture ' + (isFullPage ? 'full page' : 'element') + ' screen');
      return;
    }

    const canvas = captured.canvas;
    let copied = false;

    try {
      window.focus();
    } catch (_) {}

    // Method 1: Modern ClipboardItem with Promise (preserves user gesture tick)
    if (navigator.clipboard && typeof navigator.clipboard.write === 'function' && window.ClipboardItem) {
      try {
        const blobPromise = new Promise((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png');
        });
        const dataUrl = canvas.toDataURL('image/png');
        const htmlBlob = new Blob([`<img src="${dataUrl}">`], { type: 'text/html' });

        const item = new ClipboardItem({
          'image/png': blobPromise,
          'text/html': htmlBlob
        });

        await navigator.clipboard.write([item]);
        copied = true;
      } catch (err) {
        console.warn('[Inspector] Promise ClipboardItem failed, trying direct blob:', err);
      }

      if (!copied) {
        try {
          const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
          if (blob) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            copied = true;
          }
        } catch (err) {
          console.warn('[Inspector] Direct Blob clipboard write failed:', err);
        }
      }
    }

    // Method 2: document.execCommand('copy') via contentEditable <img>
    if (!copied) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const container = document.createElement('div');
        container.contentEditable = 'true';
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.opacity = '0';

        const img = document.createElement('img');
        img.src = dataUrl;
        container.appendChild(img);
        (document.body || document.documentElement).appendChild(container);

        container.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        const range = document.createRange();
        range.selectNode(img);
        sel.addRange(range);

        copied = document.execCommand('copy');
        sel.removeAllRanges();
        container.remove();
      } catch (err) {
        console.warn('[Inspector] execCommand image copy failed:', err);
      }
    }

    if (copied) {
      const msg = isFullPage ? '✓ Copied Full Page PNG!' : '✓ Copied PNG for Figma!';
      flashElement(btnElement, msg, 'mv-copy--success');
      showToast('🖼️ Copied PNG! Press Ctrl+V in Figma to paste 1:1 image layer');
    } else {
      flashElement(btnElement, '✕ Copy Failed', 'mv-copy--error');
      showToast('✕ Image copy to clipboard failed on this browser');
    }
  }

  // ─── Get Copy Value by Type ───────────────────────────────────────────────

  function getCopyValue(el, type) {
    switch (type) {
      case 'figmasvg':
        return elementToSvgString(el);
      case 'tailwind':
        return generateTailwindClasses(el);
      case 'curl':
        return generateFormCurl(el);
      case 'selector':
        return getCssSelector(el);
      case 'jspath': {
        const sel = getCssSelector(el);
        return `document.querySelector('${sel.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')`;
      }
      case 'xpath':
        return getXPath(el);
      case 'fullxpath':
        return getFullXPath(el);
      case 'styles':
        return getComputedStylesText(el);
      case 'outerhtml':
        return el.outerHTML || '';
      case 'innertext':
      case 'styledtext':
      case 'text':
        return (el.innerText || el.textContent || '').trim();
      default:
        return el.outerHTML || '';
    }
  }

  // ─── Header Drag Handling ─────────────────────────────────────────────────

  function onDragStart(e) {
    if (isSidePanelMode || e.target.closest('button')) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const rect = inspectCard.getBoundingClientRect();
    cardStartX = rect.left;
    cardStartY = rect.top;

    window.addEventListener('mousemove', onDragMove, true);
    window.addEventListener('mouseup', onDragEnd, true);
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    let newX = cardStartX + dx;
    let newY = cardStartY + dy;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = inspectCard.offsetWidth;
    const ch = inspectCard.offsetHeight;

    newX = Math.max(8, Math.min(vw - cw - 8, newX));
    newY = Math.max(8, Math.min(vh - ch - 8, newY));

    floatingPosX = newX;
    floatingPosY = newY;
    hasUserDraggedCard = true;

    inspectCard.style.left = `${newX}px`;
    inspectCard.style.top  = `${newY}px`;
  }

  function onDragEnd() {
    isDragging = false;
    window.removeEventListener('mousemove', onDragMove, true);
    window.removeEventListener('mouseup', onDragEnd, true);
  }

  // ─── Inspect Mode Toggle ──────────────────────────────────────────────────

  function enableInspectMode() {
    if (inspectMode) return;
    inspectMode = true;
    ensureShadowDOM();

    setInteractiveMode(false);

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click',     onClick,     true);
    document.addEventListener('keydown',   onKeyDown,   true);
    document.addEventListener('keyup',     onKeyUp,     true);
    document.addEventListener('scroll',    onScroll,    true);
    window.addEventListener('resize',      onResize,    true);

    showToast('Inspect Mode Active – Hover & click an element (Alt+F for Free Click)');
    updateBadge(true);
  }

  function disableInspectMode() {
    if (!inspectMode) return;
    inspectMode = false;

    closeAnnotationModal();
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click',     onClick,     true);
    document.removeEventListener('keydown',   onKeyDown,   true);
    document.removeEventListener('keyup',     onKeyUp,     true);
    document.removeEventListener('scroll',    onScroll,    true);
    window.removeEventListener('resize',      onResize,    true);

    hideHighlight();
    hideSelectedBox();
    clearRulerGuide();
    hideCard();
    hoveredEl = null;
    selectedEl = null;
    isAltKeyDown = false;
    isInteractiveMode = false;
    updateBadge(false);
  }

  function toggleInspectMode() {
    if (inspectMode) {
      disableInspectMode();
    } else {
      enableInspectMode();
    }
  }

  function updateBadge(on) {
    try {
      chrome.runtime.sendMessage({ type: 'SET_BADGE', on });
    } catch (_) {}
  }

  // ─── Highlight Positioning ────────────────────────────────────────────────

  function positionHighlight(el) {
    if (!el || !highlightBox || isInspectorElement(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      highlightBox.style.display = 'none';
      return;
    }

    Object.assign(highlightBox.style, {
      display: 'block',
      top:     Math.max(0, r.top) + 'px',
      left:    Math.max(0, r.left) + 'px',
      width:   r.width + 'px',
      height:  r.height + 'px',
    });

    const label = buildLabel(el);
    highlightBox.setAttribute('data-label', label);
  }

  function hideHighlight() {
    if (highlightBox) highlightBox.style.display = 'none';
  }

  function getSafeTag(el) {
    return (el.tagName || '').toLowerCase();
  }

  function buildLabel(el) {
    let s = getSafeTag(el);
    if (el.id && typeof el.id === 'string' && el.id.trim()) {
      s += `#${el.id.trim()}`;
    }
    const classes = getElementClasses(el);
    if (classes.length > 0) {
      s += '.' + classes.slice(0, 2).join('.');
    }
    const r = el.getBoundingClientRect();
    s += ` (${Math.round(r.width)}×${Math.round(r.height)})`;
    return s;
  }

  function getElementClasses(el) {
    if (!el) return [];
    if (el.classList && el.classList.length > 0) {
      return Array.from(el.classList).filter(c => typeof c === 'string' && c.trim() && !c.includes('\n'));
    }
    if (typeof el.className === 'string') {
      return el.className.trim().split(/\s+/).filter(Boolean);
    }
    if (el.className && typeof el.className.baseVal === 'string') {
      return el.className.baseVal.trim().split(/\s+/).filter(Boolean);
    }
    return [];
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  function onMouseOver(e) {
    if (isInspectorEvent(e)) return;
    const target = e.target;
    if (isInspectorElement(target)) return;
    if (isInteractiveMode || isInsideCalendarOrPicker(target)) return;
    hoveredEl = target;
    positionHighlight(hoveredEl);
  }

  function onMouseMove(e) {
    if (isInspectorEvent(e)) return;
    const target = e.target;
    if (isInspectorElement(target)) return;
    if (isInteractiveMode || isInsideCalendarOrPicker(target)) return;
    if (target !== hoveredEl) {
      hoveredEl = target;
      positionHighlight(hoveredEl);
      if (selectedEl && (isRulerMode || isAltKeyDown)) {
        renderRulerGuide(selectedEl, hoveredEl);
      }
    }
  }

  function onClick(e) {
    // If the click is on or inside our inspector card or mode bar, let it handle the event naturally!
    if (isInspectorEvent(e)) return;
    if (isInspectorElement(e.target)) return;

    // Automatic Pass-Through: Clicks inside date/calendar popups or pickers always pass through cleanly
    if (isInsideCalendarOrPicker(e.target)) {
      return;
    }

    // Instant Pass-Through: In Live Mode or holding modifier keys (Ctrl, Meta/Cmd, Shift)
    // Allows submitting forms, clicking buttons, following links naturally without closing the extension!
    if (isInteractiveMode || e.ctrlKey || e.metaKey || e.shiftKey) {
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        showToast('👆 Click passed through to page!');
      }
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    if (!hoveredEl || isInspectorElement(hoveredEl)) return;
    selectedEl = hoveredEl;
    showCard(selectedEl, e.clientX, e.clientY);
    updateSelectedBox(selectedEl);
    clearRulerGuide();

    // If selected element is a date/month/time input, trigger its picker automatically
    const targetTag = getSafeTag(selectedEl);
    if (targetTag === 'input' && ['date', 'datetime-local', 'month', 'week', 'time'].includes((selectedEl.type || '').toLowerCase())) {
      try {
        if (typeof selectedEl.showPicker === 'function') {
          selectedEl.showPicker();
        }
      } catch (_) {}
    }
  }

  function onKeyDown(e) {
    if (isAnnotatorOpen()) {
      if (e.key === 'Escape') {
        closeAnnotationModal();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLastRectangle();
        return;
      }
      return;
    }

    // Alt+F: Toggle Free Click / Live Interact Mode
    if (e.altKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setInteractiveMode(!isInteractiveMode);
      return;
    }

    // Space key: toggle Live Interact / Free Click Mode (Click buttons/submit/change dates without closing)
    if (e.code === 'Space' || e.key === ' ') {
      const tag = (e.target.tagName || '').toUpperCase();
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;
      if (!isInput && inspectMode) {
        e.preventDefault();
        setInteractiveMode(!isInteractiveMode);
        return;
      }
    }

    if (e.key === 'Alt') {
      isAltKeyDown = true;
      if (selectedEl && hoveredEl && selectedEl !== hoveredEl) {
        renderRulerGuide(selectedEl, hoveredEl);
      }
    }

    if (e.key === 'Escape') {
      if (inspectCard && inspectCard.classList.contains('mv-active')) {
        hideCard();
      } else {
        disableInspectMode();
      }
    }

    if ((e.key === '-' || e.key === '_') && !['INPUT', 'TEXTAREA'].includes((e.target.tagName || ''))) {
      if (inspectCard && inspectCard.classList.contains('mv-active')) {
        e.preventDefault();
        toggleMinimizeCard();
        return;
      }
    }
  }

  function onKeyUp(e) {
    if (e.key === 'Alt') {
      isAltKeyDown = false;
      if (!isRulerMode) {
        clearRulerGuide();
      }
    }
  }

  function onScroll() {
    if (hoveredEl && !isInspectorElement(hoveredEl)) positionHighlight(hoveredEl);
    if (selectedEl && !isInspectorElement(selectedEl)) updateSelectedBox(selectedEl);
    if (selectedEl && hoveredEl && (isRulerMode || isAltKeyDown)) renderRulerGuide(selectedEl, hoveredEl);
  }

  function onResize() {
    if (hoveredEl && !isInspectorElement(hoveredEl)) positionHighlight(hoveredEl);
    if (selectedEl && !isInspectorElement(selectedEl)) updateSelectedBox(selectedEl);
    if (selectedEl && hoveredEl && (isRulerMode || isAltKeyDown)) renderRulerGuide(selectedEl, hoveredEl);
  }

  // ─── Render Card Data ─────────────────────────────────────────────────────

  function renderCardData(el) {
    if (!inspectCard || !el || isInspectorElement(el)) return;

    const tag = getSafeTag(el);
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);

    // 1. Tag Badge & Dims
    const tagEl = inspectCard.querySelector('#mv-inspect-tag');
    let tagFormatted = `<${tag}`;
    if (el.id) {
      tagFormatted += `#${el.id}`;
    } else {
      const classes = getElementClasses(el);
      if (classes.length > 0) {
        tagFormatted += `.${classes[0]}`;
      }
    }
    tagFormatted += '>';
    tagEl.textContent = tagFormatted;
    tagEl.title = tagFormatted;

    const dimsEl = inspectCard.querySelector('#mv-inspect-dims');
    dimsEl.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;

    // Parent button visibility
    const parentBtn = inspectCard.querySelector('#mv-inspect-parent');
    if (el.parentElement && el.parentElement !== document.documentElement && !isInspectorElement(el.parentElement)) {
      parentBtn.style.display = 'inline-flex';
      parentBtn.title = `Inspect parent <${getSafeTag(el.parentElement)}>`;
    } else {
      parentBtn.style.display = 'none';
    }

    // Full page select button visibility
    const fullpageNavBtn = inspectCard.querySelector('#mv-inspect-fullpage');
    if (fullpageNavBtn) {
      if (el === document.body || el === document.documentElement) {
        fullpageNavBtn.style.display = 'none';
      } else {
        fullpageNavBtn.style.display = 'inline-flex';
      }
    }

    // 2. Metrics: Font, Color, Padding, Margin
    const fontEl = inspectCard.querySelector('#mv-inspect-font');
    const firstFont = (cs.fontFamily || 'sans-serif').split(',')[0].replace(/['"]/g, '').trim();
    fontEl.textContent = `${cs.fontSize || '14px'} ${firstFont}`;
    fontEl.title = `${cs.fontSize} ${cs.fontFamily}`;

    const colorDot = inspectCard.querySelector('#mv-inspect-color-dot');
    const colorTxt = inspectCard.querySelector('#mv-inspect-color-txt');
    const currentColor = cs.color || 'rgb(0, 0, 0)';
    colorDot.style.backgroundColor = currentColor;
    colorTxt.textContent = currentColor;

    const padEl = inspectCard.querySelector('#mv-inspect-padding');
    padEl.textContent = `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`;

    const marEl = inspectCard.querySelector('#mv-inspect-margin');
    marEl.textContent = `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`;

    // 3. HTML Snippet Code
    const codeEl = inspectCard.querySelector('#mv-inspect-code');
    const rawSnippet = el.outerHTML || '';
    codeEl.textContent = rawSnippet;

    // 4. Update QA section badge
    const qaBadge = inspectCard.querySelector('#mv-qa-type-badge');
    if (['input', 'textarea', 'select'].includes(tag)) {
      qaBadge.textContent = el.type ? `${tag} [${el.type}]` : tag;
    } else if (tag === 'form') {
      qaBadge.textContent = 'Form';
    } else if (['button', 'a'].includes(tag)) {
      qaBadge.textContent = 'Clickable';
    } else {
      qaBadge.textContent = tag;
    }

    // 5. Update Locale button text
    const localeBtn = inspectCard.querySelector('#mv-locale-toggle');
    if (localeBtn) {
      localeBtn.textContent = (currentLocale === 'LA') ? '🇱🇦 LA' : '🌐 EN';
    }

    // 6. Check file inputs and display file section
    const isFileInput = tag === 'input' && (el.type || '').toLowerCase() === 'file';
    const hasFileInput = isFileInput || (el.querySelector && el.querySelector('input[type="file"]')) || document.querySelector('input[type="file"]');
    const fileSection = inspectCard.querySelector('#mv-qa-file-section');
    if (fileSection) {
      fileSection.style.display = hasFileInput ? 'flex' : 'none';
    }

    // 6c. Check text input/textarea and display MaxLength testing box
    let targetTextNode = el;
    if (!['input', 'textarea'].includes(tag) && el.querySelector) {
      targetTextNode = el.querySelector('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea');
    }
    const isTextInput = targetTextNode && ['input', 'textarea'].includes((targetTextNode.tagName || '').toLowerCase()) && (targetTextNode.type || '').toLowerCase() !== 'file';
    const maxLenBox = inspectCard.querySelector('#mv-qa-maxlen-box');
    const curMaxBadge = inspectCard.querySelector('#mv-qa-cur-maxlen');
    if (maxLenBox) {
      maxLenBox.style.display = isTextInput ? 'flex' : 'none';
    }
    if (curMaxBadge) {
      if (isTextInput) {
        const ml = (targetTextNode.maxLength > 0 && targetTextNode.maxLength < 524288) ? targetTextNode.maxLength : (targetTextNode.getAttribute('maxlength') || null);
        curMaxBadge.textContent = ml ? `Max: ${ml}` : 'Max: None';
        curMaxBadge.title = ml ? `Element has DOM maxlength="${ml}"` : 'Element has no maxlength constraint';
      } else {
        curMaxBadge.textContent = 'Max: N/A';
      }
    }

    // 7. Update cURL Export button styling
    const curlBtn = inspectCard.querySelector('#mv-btn-copy-curl');
    if (curlBtn) {
      const isOrHasForm = tag === 'form' || el.closest('form') || (el.querySelector && el.querySelector('form, input, textarea, select')) || ['input', 'textarea', 'select'].includes(tag);
      if (isOrHasForm) {
        curlBtn.style.opacity = '1';
        curlBtn.title = 'Generate and copy complete ready-to-run cURL command for this form / input';
      } else {
        curlBtn.style.opacity = '0.75';
      }
    }

    // 7b. Update Click / Submit trigger button
    const triggerRow = inspectCard.querySelector('#mv-row-trigger-click');
    const triggerText = inspectCard.querySelector('#mv-trigger-click-text');
    if (triggerRow && triggerText) {
      const isClickable = ['button', 'a'].includes(tag) ||
        (tag === 'input' && ['button', 'submit', 'reset', 'checkbox', 'radio', 'image'].includes((el.type || '').toLowerCase())) ||
        tag === 'form' ||
        el.getAttribute('role') === 'button' ||
        el.getAttribute('role') === 'link' ||
        el.getAttribute('role') === 'tab' ||
        typeof el.onclick === 'function' ||
        cs.cursor === 'pointer';

      if (isClickable) {
        triggerRow.style.display = 'grid';
        if (tag === 'form') {
          triggerText.textContent = 'Submit Form';
        } else if (tag === 'a') {
          triggerText.textContent = 'Follow Link';
        } else if (tag === 'input' && (el.type || '').toLowerCase() === 'submit') {
          triggerText.textContent = 'Submit Form';
        } else {
          triggerText.textContent = 'Click Element';
        }
      } else {
        triggerRow.style.display = 'none';
      }
    }

    // 8. Update UI/UX Designer Tools: Color Palette, Typography, and Tailwind CSS
    // 8a. Color Palette Swatches
    const paletteGrid = inspectCard.querySelector('#mv-palette-grid');
    if (paletteGrid) {
      paletteGrid.innerHTML = '';
      const colors = extractElementColors(el);
      if (colors.length > 0) {
        colors.forEach((c) => {
          const chip = document.createElement('button');
          chip.className = 'mv-palette-chip';
          chip.title = `Click to copy ${c.label} color: ${c.hex}`;
          chip.innerHTML = `
            <span class="mv-palette-dot" style="background-color: ${c.raw};"></span>
            <span>${c.hex}</span>
            <span class="mv-palette-tag">${c.label}</span>
          `;
          chip.addEventListener('click', async (e) => {
            e.stopPropagation();
            await copyToClipboard(c.hex, chip, '✓ Copied!');
            showToast(`✓ Copied ${c.label} color: ${c.hex}`);
          });
          paletteGrid.appendChild(chip);
        });
      } else {
        paletteGrid.innerHTML = '<span style="font-size:10px; color:#64748b;">No colors extracted</span>';
      }
    }

    // 8b. Typography Panel
    const typo = extractTypography(el);
    if (typo) {
      const famEl = inspectCard.querySelector('#mv-typo-family');
      const swEl = inspectCard.querySelector('#mv-typo-size-weight');
      const lhEl = inspectCard.querySelector('#mv-typo-line-height');
      const alEl = inspectCard.querySelector('#mv-typo-align');

      if (famEl) { famEl.textContent = typo.family; famEl.title = cs.fontFamily; }
      if (swEl) { swEl.textContent = `${typo.size} / ${typo.weight}`; }
      if (lhEl) { lhEl.textContent = typo.lineHeight; }
      if (alEl) { alEl.textContent = `${typo.textAlign} (ls: ${typo.letterSpacing})`; }
    }

    // 8c. Tailwind CSS Converter
    const tailwindCode = inspectCard.querySelector('#mv-tailwind-code');
    if (tailwindCode) {
      const tw = generateTailwindClasses(el);
      tailwindCode.textContent = tw || '/* No utility classes mapped */';
      tailwindCode.title = 'Click to copy Tailwind classes';
    }

    // 8d. Update Selected Box outline
    updateSelectedBox(el);
  }

  // ─── Show / Hide Card ─────────────────────────────────────────────────────

  function showCard(el, cx, cy) {
    if (!el || isInspectorElement(el)) return;
    ensureShadowDOM();
    renderCardData(el);

    const wasActive = inspectCard.classList.contains('mv-active');
    inspectCard.classList.add('mv-active');

    if (isSidePanelMode) {
      inspectCard.classList.add('mv-side-panel');
      inspectCard.style.left = '';
      inspectCard.style.top = '';
      inspectCard.style.right = '0px';
      inspectCard.style.width = `${sidePanelWidth}px`;
      return;
    }

    inspectCard.classList.remove('mv-side-panel');
    inspectCard.style.right = '';
    inspectCard.style.width = '';

    // If floating card is ALREADY open and visible on screen, KEEP ITS CURRENT POSITION!
    // Never jump or move around the screen when clicking another element!
    if (wasActive && floatingPosX !== null && floatingPosY !== null) {
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = inspectCard.offsetWidth  || 340;
    const ch = inspectCard.offsetHeight || 420;

    let x = 0;
    let y = 0;

    if (hasUserDraggedCard && floatingPosX !== null && floatingPosY !== null) {
      // Re-use last dragged position, clamped to current viewport
      x = Math.max(8, Math.min(vw - cw - 8, floatingPosX));
      y = Math.max(8, Math.min(vh - ch - 8, floatingPosY));
    } else {
      // Initial positioning near clicked element
      x = cx + 12;
      y = cy + 12;

      if (x + cw > vw - 12) x = cx - cw - 12;
      if (y + ch > vh - 12) y = cy - ch - 12;
      if (x < 12) x = 12;
      if (y < 12) y = 12;
    }

    floatingPosX = x;
    floatingPosY = y;
    inspectCard.style.left = `${x}px`;
    inspectCard.style.top  = `${y}px`;
  }

  function toggleMinimizeCard(forceState) {
    if (!inspectCard) return;
    if (typeof forceState === 'boolean') {
      isCardMinimized = forceState;
    } else {
      isCardMinimized = !isCardMinimized;
    }

    const minimizeBtn = inspectCard.querySelector('#mv-inspect-minimize');

    if (isCardMinimized) {
      inspectCard.classList.add('mv-minimized');
      if (minimizeBtn) {
        minimizeBtn.innerHTML = '+';
        minimizeBtn.title = 'Restore / Expand Card (+)';
      }
      showToast('Inspect Card Minimized (−)');
    } else {
      inspectCard.classList.remove('mv-minimized');
      if (minimizeBtn) {
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize (−)';
      }
    }
  }

  function hideCard() {
    if (inspectCard) {
      inspectCard.classList.remove('mv-active');
      toggleMinimizeCard(false);
    }
    selectedEl = null;
    hideSelectedBox();
    clearRulerGuide();
  }

  // ─── Algorithm: Extract Styled Rich Text matching Web Appearance ──────────

  function getStyledHtml(el) {
    if (!el) return '';

    const clone = el.cloneNode(true);

    const STYLE_PROPS = [
      'color',
      'background-color',
      'background',
      'background-image',
      'box-shadow',
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'line-height',
      'letter-spacing',
      'text-align',
      'text-decoration-line',
      'text-decoration-color',
      'text-decoration-style',
      'text-transform',
      'display',
      'flex-direction',
      'justify-content',
      'align-items',
      'gap',
      'width', 'height',
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-top', 'border-right', 'border-bottom', 'border-left',
      'border-radius',
      'box-sizing'
    ];

    const origNodes = [el, ...el.querySelectorAll('*')];
    const cloneNodes = [clone, ...clone.querySelectorAll('*')];

    for (let i = 0; i < origNodes.length && i < cloneNodes.length; i++) {
      const orig = origNodes[i];
      const cln = cloneNodes[i];
      if (orig.nodeType !== Node.ELEMENT_NODE) continue;

      try {
        const cs = window.getComputedStyle(orig);
        let styleStr = cln.getAttribute('style') || '';
        if (styleStr && !styleStr.endsWith(';')) styleStr += ';';

        for (const prop of STYLE_PROPS) {
          const val = cs.getPropertyValue(prop);
          if (
            val &&
            val !== 'none' &&
            val !== 'normal' &&
            val !== 'rgba(0, 0, 0, 0)' &&
            val !== 'transparent' &&
            val !== 'auto' &&
            val !== '0px'
          ) {
            styleStr += ` ${prop}: ${val};`;
          }
        }

        // Preserve external link destinations and image URLs
        const tag = orig.tagName.toLowerCase();
        if (tag === 'a' && orig.href) {
          cln.setAttribute('href', orig.href);
        }
        if (tag === 'img' && orig.src) {
          cln.setAttribute('src', orig.src);
          if (orig.naturalWidth > 0) {
            cln.setAttribute('width', String(orig.clientWidth || orig.naturalWidth));
            cln.setAttribute('height', String(orig.clientHeight || orig.naturalHeight));
          }
        }

        if (styleStr.trim()) {
          cln.setAttribute('style', styleStr.trim());
        }
      } catch (_) {}
    }

    return clone.outerHTML;
  }

  // ─── Clipboard Execution: Styled Rich Text ────────────────────────────────

  async function copyRichText(el, btnElement, feedbackText = '✓ Copied Styled Text!') {
    if (!el) return;

    const plainText = (el.innerText || el.textContent || '').trim();
    const styledHtml = getStyledHtml(el);

    let success = false;

    // 1. Try modern Async Clipboard API with both text/html and text/plain
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      try {
        const blobHtml = new Blob([styledHtml], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        const item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        });
        await navigator.clipboard.write([item]);
        success = true;
      } catch (err) {
        console.warn('[Inspector] Async clipboard write error:', err);
      }
    }

    // 2. Fallback via document.execCommand('copy') with copy event hook
    if (!success) {
      try {
        const handler = (e) => {
          e.preventDefault();
          e.clipboardData.setData('text/html', styledHtml);
          e.clipboardData.setData('text/plain', plainText);
        };
        document.addEventListener('copy', handler, { capture: true, once: true });
        success = document.execCommand('copy');
        document.removeEventListener('copy', handler, { capture: true });
      } catch (_) {}
    }

    // 3. Fallback to standard plain text if rich text failed
    if (!success) {
      await copyToClipboard(plainText, btnElement, feedbackText);
      return;
    }

    if (success) {
      flashElement(btnElement, feedbackText, 'mv-copy--success');
    } else {
      flashElement(btnElement, '✕ Failed', 'mv-copy--error');
    }
  }

  // ─── Clipboard Execution: Plain Text ──────────────────────────────────────

  async function copyToClipboard(text, btnElement, feedbackText = '✓ Copied!') {
    let success = false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (_) {}
    }

    if (!success) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        success = document.execCommand('copy');
        ta.remove();
      } catch (_) {}
    }

    if (success) {
      flashElement(btnElement, feedbackText, 'mv-copy--success');
    } else {
      flashElement(btnElement, '✕ Failed', 'mv-copy--error');
    }
  }

  function flashElement(element, text, cls) {
    if (!element) return;
    const originalHtml = element.innerHTML;
    element.textContent = text;
    element.classList.add(cls);
    setTimeout(() => {
      element.innerHTML = originalHtml;
      element.classList.remove(cls);
    }, 1200);
  }

  // ─── Toast System ─────────────────────────────────────────────────────────

  function showToast(msg) {
    ensureShadowDOM();
    const t = document.createElement('div');
    t.className = 'ei-toast';
    t.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
    shadowRoot.appendChild(t);

    void t.offsetWidth;
    t.classList.add('ei-toast--visible');

    setTimeout(() => {
      t.classList.remove('ei-toast--visible');
      setTimeout(() => t.remove(), 250);
    }, 2000);
  }

  // ─── Algorithms: CSS Selector, XPath, Styles ──────────────────────────────

  function escapeCss(str) {
    if (window.CSS && CSS.escape) {
      return CSS.escape(str);
    }
    return str.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  function getCssSelector(el) {
    if (!(el instanceof Element) || isInspectorElement(el)) return '';

    const parts = [];
    let node = el;

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      if (node === document.documentElement) {
        parts.unshift('html');
        break;
      }
      if (node === document.body) {
        parts.unshift('body');
        break;
      }

      const tag = getSafeTag(node);
      let part = tag;

      // Unique ID check
      if (node.id && typeof node.id === 'string' && node.id.trim()) {
        const idSelector = `#${escapeCss(node.id.trim())}`;
        try {
          if (document.querySelectorAll(idSelector).length === 1) {
            parts.unshift(idSelector);
            return parts.join(' > ');
          }
        } catch (_) {}
      }

      // Meaningful classes
      const classes = getElementClasses(node)
        .filter(c => !/^(ng-|v-|data-|__)/.test(c))
        .slice(0, 2);

      if (classes.length > 0) {
        part += '.' + classes.map(escapeCss).join('.');
      }

      // Disambiguate siblings
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          s => getSafeTag(s) === tag
        );
        if (siblings.length > 1) {
          const idx = siblings.indexOf(node) + 1;
          part += `:nth-of-type(${idx})`;
        }
      }

      parts.unshift(part);

      // Verify uniqueness
      const candidate = parts.join(' > ');
      try {
        if (document.querySelectorAll(candidate).length === 1) {
          return candidate;
        }
      } catch (_) {}

      node = node.parentElement;
    }

    return parts.join(' > ');
  }

  function getXPath(el) {
    if (isInspectorElement(el)) return '';
    if (el.id && typeof el.id === 'string' && el.id.trim()) {
      return `//*[@id="${el.id.trim()}"]`;
    }

    const parts = [];
    let node = el;

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      const tag = getSafeTag(node);

      if (node.id && typeof node.id === 'string' && node.id.trim()) {
        parts.unshift(`//*[@id="${node.id.trim()}"]`);
        return parts.join('/');
      }

      const parent = node.parentElement;
      if (!parent) {
        parts.unshift(`/${tag}`);
        break;
      }

      const siblings = Array.from(parent.children).filter(
        s => getSafeTag(s) === tag
      );
      const idx = siblings.indexOf(node) + 1;
      parts.unshift(siblings.length > 1 ? `${tag}[${idx}]` : tag);
      node = parent;
    }

    const first = parts[0] || '';
    if (first.startsWith('//*[@id=')) {
      return parts.join('/');
    }
    return '/' + parts.join('/');
  }

  function getFullXPath(el) {
    if (isInspectorElement(el)) return '';
    const parts = [];
    let node = el;

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      const tag = getSafeTag(node);
      const parent = node.parentElement;

      if (!parent) {
        parts.unshift(tag);
        break;
      }

      const siblings = Array.from(parent.children).filter(
        s => getSafeTag(s) === tag
      );
      const idx = siblings.indexOf(node) + 1;
      parts.unshift(siblings.length > 1 ? `${tag}[${idx}]` : tag);
      node = parent;
    }

    return '/' + parts.join('/');
  }

  const RELEVANT_PROPS = [
    'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'margin', 'padding', 'border', 'border-radius', 'box-shadow',
    'background-color', 'color', 'font-family', 'font-size', 'font-weight',
    'line-height', 'text-align', 'opacity', 'cursor',
    'flex-direction', 'justify-content', 'align-items', 'gap'
  ];

  const SKIP_VALUES = new Set([
    'auto', 'none', 'normal', '0px', '0', '', 'initial', 'transparent',
    'rgba(0, 0, 0, 0)', 'rgb(0, 0, 0)', 'inherit', 'unset'
  ]);

  function getComputedStylesText(el) {
    if (isInspectorElement(el)) return '';
    let cs;
    try {
      cs = window.getComputedStyle(el);
    } catch (_) {
      return '/* Unable to retrieve computed styles */';
    }

    const lines = [];
    for (const prop of RELEVANT_PROPS) {
      const val = cs.getPropertyValue(prop)?.trim();
      if (!val || SKIP_VALUES.has(val)) continue;
      lines.push(`  ${prop}: ${val};`);
    }

    const selector = getCssSelector(el);
    return lines.length
      ? `${selector} {\n${lines.join('\n')}\n}`
      : `/* No notable custom styles found for ${selector} */`;
  }

  // ─── Message Listener ─────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'PING') {
      sendResponse({ pong: true, active: inspectMode });
      return true;
    }

    if (msg.type === 'TOGGLE_INSPECT') {
      toggleInspectMode();
      sendResponse({ active: inspectMode });
      return true;
    }

    return true;
  });
})();
