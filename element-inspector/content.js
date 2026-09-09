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

.mv-inspect-card::-webkit-scrollbar {
  width: 5px !important;
}
.mv-inspect-card::-webkit-scrollbar-track {
  background: #14151f !important;
}
.mv-inspect-card::-webkit-scrollbar-thumb {
  background: #2d3148 !important;
  border-radius: 3px !important;
}

@keyframes mv-card-in {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.mv-inspect-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 8px 12px !important;
  background: #0d0e17 !important;
  border-bottom: 1px solid #25283c !important;
  cursor: grab !important;
  user-select: none !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

.mv-inspect-header:active {
  cursor: grabbing !important;
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

.mv-btn-close {
  font-size: 13px !important;
  padding: 3px 6px !important;
}

.mv-btn-close:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  color: #f87171 !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
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
  width: 4px !important;
  height: 4px !important;
}
.mv-snippet-code::-webkit-scrollbar-track {
  background: #090a10 !important;
}
.mv-snippet-code::-webkit-scrollbar-thumb {
  background: #2d3148 !important;
  border-radius: 3px !important;
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
`;

  // ─── State ────────────────────────────────────────────────────────────────

  let inspectMode   = false;
  let hoveredEl     = null;
  let selectedEl    = null;
  let shadowHost    = null;
  let shadowRoot    = null;
  let highlightBox  = null;
  let inspectCard   = null;

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

  // ─── Inspector Element and Event Detection ────────────────────────────────

  function isInspectorElement(el) {
    if (!el) return false;
    if (el === shadowHost || el === shadowRoot || el === inspectCard || el === highlightBox || el === annotatorModal) return true;
    if (el.id === SHADOW_HOST_ID) return true;
    if (el.getAttribute && el.getAttribute('id') === SHADOW_HOST_ID) return true;
    if (el.classList && (el.classList.contains('mv-inspect-card') || el.classList.contains('ei-highlight') || el.classList.contains('ei-annotator-modal'))) return true;
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
      <!-- Header -->
      <div class="mv-inspect-header">
        <div class="mv-inspect-tag-group">
          <span class="mv-inspect-tag-badge" id="mv-inspect-tag">&lt;element&gt;</span>
          <span class="mv-inspect-dims" id="mv-inspect-dims">0 × 0 px</span>
        </div>
        <div class="mv-header-actions">
          <button class="mv-btn-icon mv-btn-screenshot" id="mv-inspect-screenshot" title="Capture & download element screenshot as JPG (and copy to clipboard)">📸 JPG</button>
          <button class="mv-btn-icon mv-btn-parent" id="mv-inspect-parent" title="Select parent element" style="display:none;">↑ Parent</button>
          <button class="mv-btn-icon mv-btn-close" id="mv-inspect-close" title="Close (Esc)">✕</button>
        </div>
      </div>

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
        </div>
      </div>

      <!-- QA & PenTest Interactive Tools Section -->
      <div class="mv-qa-section" id="mv-qa-section">
        <div class="mv-qa-header">
          <span>⚡ QA &amp; PenTest Tools</span>
          <div class="mv-qa-header-right">
            <button class="mv-locale-toggle" id="mv-locale-toggle" title="Switch data generator locale (Lao / English)">🇱🇦 LA</button>
            <span class="mv-qa-badge" id="mv-qa-type-badge">Element</span>
          </div>
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

        <!-- 1-Click Fake File Attach -->
        <div class="mv-qa-file-section" id="mv-qa-file-section">
          <div class="mv-qa-fill-label">📁 1-Click Fake File Attach:</div>
          <div class="mv-qa-file-grid">
            <button class="mv-qa-chip mv-qa-chip--file" data-file="pdf" title="Attach valid PDF (test_document.pdf)">📄 PDF</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="jpg" title="Attach sample JPG image (sample_photo.jpg)">🖼️ JPG</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="csv" title="Attach spreadsheet CSV (sample_data.csv)">📊 CSV</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="oversize" title="Attach 15MB file to test size limit">⚠️ 15MB</button>
            <button class="mv-qa-chip mv-qa-chip--file" data-file="invalid" title="Attach script file to test security filter (malicious.exe)">🚫 .exe</button>
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

    // Bind event listeners inside Card
    const closeBtn = inspectCard.querySelector('#mv-inspect-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideCard();
    });

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
        } else if (type === 'innertext' || type === 'text') {
          const text = (selectedEl.innerText || selectedEl.textContent || '').trim();
          await copyToClipboard(text, chip, '✓ Copied Inner Text!');
        } else {
          const text = getCopyValue(selectedEl, type);
          await copyToClipboard(text, chip, '✓ Copied!');
        }
      });
    });

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
          showToast(`✓ Attached ${file.name} to file input!`);
        } else {
          flashElement(chip, 'No File Input', 'mv-copy--error');
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

    // Header draggable
    const header = inspectCard.querySelector('.mv-inspect-header');
    header.addEventListener('mousedown', onDragStart);
  }

  // ─── Unified Element Screen/Canvas Capture Helper ─────────────────────────

  async function captureElementCanvas(el, format = 'png', quality = 0.95) {
    if (!el || isInspectorElement(el)) return null;

    const rect = el.getBoundingClientRect();
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

    const sx = Math.max(0, Math.round(rect.left * scaleX));
    const sy = Math.max(0, Math.round(rect.top * scaleY));
    const sw = Math.min(img.width - sx, Math.round(rect.width * scaleX));
    const sh = Math.min(img.height - sy, Math.round(rect.height * scaleY));

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
      const pngBlob = await new Promise((res) => annotatorCanvas.toBlob(res, 'image/png'));
      if (pngBlob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        return true;
      }
    } catch (err) {
      console.warn('[Inspector] Clipboard write image error:', err);
    }
    return false;
  }

  async function downloadAnnotatorCanvas(format = 'jpeg') {
    if (!annotatorCanvas) return false;
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';
    const blob = await new Promise((res) => annotatorCanvas.toBlob(res, mime, 0.95));
    if (!blob) return false;

    const tag = (currentCapturedEl?.tagName || 'element').toLowerCase();
    const cleanId = currentCapturedEl?.id ? `_${currentCapturedEl.id.slice(0, 15)}` : '';
    const hasBoxes = drawnRectangles.length > 0 ? '_annotated' : '';
    const fileName = `${tag}${cleanId}${hasBoxes}_${Math.round(annotatorCanvas.width)}x${Math.round(annotatorCanvas.height)}.${ext}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1200);

    // Also copy to clipboard for immediate pasting into chat/tickets
    await copyAnnotatorCanvasToClipboard();
    return true;
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
            <button class="ei-tool-btn ei-btn-save" id="ei-annotator-download" title="Save & download image as .JPG (and copy to clipboard)">💾 Save & Download</button>
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

    // Copy Image button
    const copyBtn = annotatorModal.querySelector('#ei-annotator-copy');
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await copyAnnotatorCanvasToClipboard();
      if (ok) {
        showToast('✓ Annotated image copied to clipboard!');
        closeAnnotationModal();
      } else {
        flashElement(copyBtn, '✕ Failed', 'mv-copy--error');
      }
    });

    // Save & Download button
    const downloadBtn = annotatorModal.querySelector('#ei-annotator-download');
    downloadBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      flashElement(downloadBtn, '⏳ Saving...', 'mv-copy--success');
      const ok = await downloadAnnotatorCanvas('jpeg');
      if (ok) {
        showToast('✓ Saved .JPG & copied to clipboard!');
        closeAnnotationModal();
      } else {
        flashElement(downloadBtn, '✕ Error', 'mv-copy--error');
      }
    });

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
        return `020${Math.floor(10000000 + Math.random() * 90000000)}`;
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

    // 2. Phone / Tel / Mobile
    if (type === 'tel' || combined.includes('phone') || combined.includes('tel') || combined.includes('mobile') || combined.includes('cell')) {
      return `020${Math.floor(10000000 + Math.random() * 90000000)}`;
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

    // 5. Date
    if (type === 'date' || combined.includes('date') || combined.includes('birth') || combined.includes('dob')) {
      const m = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
      const d = String(Math.floor(1 + Math.random() * 28)).padStart(2, '0');
      return `2026-${m}-${d}`;
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

  function generateMockFile(type) {
    switch (type) {
      case 'pdf': {
        const pdfData = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000118 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n198\n%%EOF`;
        return new File([pdfData], 'test_document.pdf', { type: 'application/pdf' });
      }
      case 'jpg': {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 320, 200);
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(10, 10, 300, 180);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('SAMPLE IMAGE', 160, 100);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const byteStr = atob(dataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteStr.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteStr.length; i++) {
            ia[i] = byteStr.charCodeAt(i);
          }
          return new File([ia], 'sample_photo.jpg', { type: 'image/jpeg' });
        } catch (_) {
          return new File(['DUMMY_IMAGE_DATA'], 'sample_photo.jpg', { type: 'image/jpeg' });
        }
      }
      case 'csv': {
        const csv = "id,name,email,role,status\n1,Alex Smith,alex@example.com,QA Tester,Active\n2,Somxai Vongsa,somxai@laotel.com,Developer,Active\n3,Jane Davis,jane@example.com,Admin,Pending\n4,Khamdaeng Xai,khamdaeng@test.la,Security,Active\n";
        return new File([csv], 'sample_data.csv', { type: 'text/csv' });
      }
      case 'oversize': {
        // 15 MB binary file to trigger upload file size limits
        const size = 15 * 1024 * 1024;
        const buf = new Uint8Array(size);
        return new File([buf], 'oversize_test_15mb.pdf', { type: 'application/pdf' });
      }
      case 'invalid': {
        return new File(['MZ_MOCK_EXECUTABLE_BINARY_PAYLOAD'], 'malicious_test.exe', { type: 'application/x-msdownload' });
      }
      default:
        return new File(['test file content'], 'test_file.txt', { type: 'text/plain' });
    }
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
      const mockFile = generateMockFile('pdf');
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
        const mockFile = generateMockFile('pdf');
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
      const mockFile = generateMockFile('pdf');
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

  // ─── Get Copy Value by Type ───────────────────────────────────────────────

  function getCopyValue(el, type) {
    switch (type) {
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
    if (e.target.closest('button')) return;
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

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click',     onClick,     true);
    document.addEventListener('keydown',   onKeyDown,   true);
    document.addEventListener('scroll',    onScroll,    true);
    window.addEventListener('resize',      onResize,    true);

    showToast('Inspect Mode Active – Hover & click an element');
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
    document.removeEventListener('scroll',    onScroll,    true);
    window.removeEventListener('resize',      onResize,    true);

    hideHighlight();
    hideCard();
    hoveredEl = null;
    selectedEl = null;
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
    hoveredEl = target;
    positionHighlight(hoveredEl);
  }

  function onMouseMove(e) {
    if (isInspectorEvent(e)) return;
    const target = e.target;
    if (isInspectorElement(target)) return;
    if (target !== hoveredEl) {
      hoveredEl = target;
      positionHighlight(hoveredEl);
    }
  }

  function onClick(e) {
    // If the click is on or inside our inspector card, let it handle the event naturally!
    if (isInspectorEvent(e)) return;
    if (isInspectorElement(e.target)) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    if (!hoveredEl || isInspectorElement(hoveredEl)) return;
    selectedEl = hoveredEl;
    showCard(selectedEl, e.clientX, e.clientY);
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

    if (e.key === 'Escape') {
      if (inspectCard && inspectCard.classList.contains('mv-active')) {
        hideCard();
      } else {
        disableInspectMode();
      }
    }
  }

  function onScroll() {
    if (hoveredEl && !isInspectorElement(hoveredEl)) positionHighlight(hoveredEl);
  }

  function onResize() {
    if (hoveredEl && !isInspectorElement(hoveredEl)) positionHighlight(hoveredEl);
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
  }

  // ─── Show / Hide Card ─────────────────────────────────────────────────────

  function showCard(el, cx, cy) {
    if (!el || isInspectorElement(el)) return;
    ensureShadowDOM();
    renderCardData(el);

    inspectCard.classList.add('mv-active');

    // Intelligent positioning
    inspectCard.style.left = '0px';
    inspectCard.style.top  = '0px';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = inspectCard.offsetWidth  || 340;
    const ch = inspectCard.offsetHeight || 420;

    let x = cx + 12;
    let y = cy + 12;

    if (x + cw > vw - 12) x = cx - cw - 12;
    if (y + ch > vh - 12) y = cy - ch - 12;
    if (x < 12) x = 12;
    if (y < 12) y = 12;

    inspectCard.style.left = `${x}px`;
    inspectCard.style.top  = `${y}px`;
  }

  function hideCard() {
    if (inspectCard) {
      inspectCard.classList.remove('mv-active');
    }
}

  // ─── Algorithm: Extract Styled Rich Text matching Web Appearance ──────────

  function getStyledHtml(el) {
    if (!el) return '';

    const clone = el.cloneNode(true);

    const STYLE_PROPS = [
      'color',
      'background-color',
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
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-top', 'border-right', 'border-bottom', 'border-left',
      'border-radius'
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
        if (orig.tagName.toLowerCase() === 'a' && orig.href) {
          cln.setAttribute('href', orig.href);
        }
        if (orig.tagName.toLowerCase() === 'img' && orig.src) {
          cln.setAttribute('src', orig.src);
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
