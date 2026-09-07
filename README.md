# Element Inspector & Copier 🔍

A powerful Google Chrome Extension (Manifest V3) designed for Developers, QA Engineers, and Penetration Testers.

## ✨ Features

- **🎯 Interactive DOM Inspection:** Hover and inspect any element on any webpage with isolated Shadow DOM UI (100% CSP-safe).
- **📸 Clean JPG Element Screenshots:** One-click pixel-perfect element capture without inspector overlay interference.
- **⚡ QA & PenTest Tools:**
  - 🔓 **Unlock Form Constraints:** Remove `disabled`, `readonly`, `maxlength`, `pattern`, `required`, and `novalidate` restrictions with 1 click.
  - 👁️ **Show Password:** Instantly unmask and toggle masked password fields.
  - 🎭 **Playwright Automation Locators:** Generate ready-to-use Playwright scripts (`getByTestId`, `getByRole`, `locator`).
  - 🌲 **Cypress Automation Locators:** Generate ready-to-use Cypress scripts.
  - ⚡ **1-Click Test Data Fillers:** Inject boundary strings (Long 300), Special Characters (`!@#$%...`), Unicode/Emojis (`🚀🌟...`), Max Numbers (`999999999`), HTML XSS Probes (`<test'"`>`), and Quick Clear (React/Vue/Angular safe).
- **📋 Rich Copy Formats:**
  - CSS Selector
  - JS Path (`document.querySelector(...)`)
  - XPath & Full XPath
  - Computed CSS Styles
  - Outer HTML & Inner Text
  - ✨ **Styled Rich Text** (Paste formatted text with styles directly into Google Docs, Word, Gmail, Slack).

## 🚀 Installation

1. Clone this repository:
   ```bash
   git clone <repo-url>
   ```
2. Open Google Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select the `element-inspector` directory.
5. Use keyboard shortcut **Alt + X** to activate inspection on any page.

## 🛠️ Architecture

- **Manifest V3** compliant.
- **Closed Shadow DOM** container to prevent host-page CSS leaks and script conflicts.
- **Background Service Worker** for resilient tab capture and permission management.
