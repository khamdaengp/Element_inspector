// background.js – Service Worker for Element Inspector & Copier (v1.7.0)
// Handles toolbar icon clicks, keyboard shortcuts, script injection pinging,
// badge state, tab captures, and CORS-free image data fetching.

const CONTENT_SCRIPT = 'content.js';
const CONTENT_CSS    = 'content.css';

/**
 * Checks if content script is already alive in the tab.
 */
async function pingTab(tabId) {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    return res && res.pong === true;
  } catch {
    return false;
  }
}

/**
 * Injects content script and CSS into active tab if not already present,
 * then toggles inspect mode.
 */
async function injectAndToggle(tab) {
  if (!tab || !tab.id) return;

  const url = tab.url || '';
  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('edge://') ||
    url.startsWith('view-source:')
  ) {
    console.warn('[Inspector] Cannot inspect restricted browser page:', url);
    return;
  }

  try {
    const isAlive = await pingTab(tab.id);

    if (!isAlive) {
      // Inject CSS first, then JS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: [CONTENT_CSS],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [CONTENT_SCRIPT],
      });
    }

    // Toggle inspect mode
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_INSPECT' });
  } catch (err) {
    console.error('[Inspector] Injection or toggle error:', err);
  }
}

// --- Toolbar icon click ---
chrome.action.onClicked.addListener(async (tab) => {
  await injectAndToggle(tab);
});

// --- Keyboard shortcut (Alt+X) ---
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-inspect-mode') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    await injectAndToggle(tab);
  }
});

// --- Runtime message listener (Badge & Screenshot capture) ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_BADGE' && sender.tab?.id) {
    const tabId = sender.tab.id;
    if (msg.on) {
      chrome.action.setBadgeText({ text: 'ON', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#2563eb', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
    return false;
  }

  // Handle capturing visible tab for element screenshot in JPG/PNG format
  if (msg.type === 'CAPTURE_VISIBLE_TAB') {
    const windowId = sender.tab?.windowId;
    const format = (msg.format === 'png') ? 'png' : 'jpeg';
    const options = { format };
    if (format === 'jpeg') {
      options.quality = typeof msg.quality === 'number' ? msg.quality : 95;
    }

    chrome.tabs.captureVisibleTab(windowId, options, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('[Inspector] captureVisibleTab failed:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true; // Keep message port open for async response
  }
});

// Clean up badge when tab is updated / navigated
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId }).catch(() => {});
  }
});
