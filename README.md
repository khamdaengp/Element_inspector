# Element Inspector & Copier 🔍

A powerful Google Chrome Extension (Manifest V3) designed for Developers, QA Engineers, and Penetration Testers.

## ✨ Features

- **📱 Right Side Panel Display (Like "Ask Gemini"):** Docks seamlessly to the right side of the screen with a full-height scrollable drawer, smooth slide-in animation, left-border drag handle to resize width (280px - 850px), and a 1-click toggle (`📌 Side` / `🗗 Float`) between Side Panel and Floating Window.
- **🎯 Interactive DOM Inspection:** Hover and inspect any element on any webpage with isolated Shadow DOM UI (100% CSP-safe).
- **📸 Clean JPG Element Screenshots:** One-click pixel-perfect element capture without inspector overlay interference.
- **🎨 Developer & UI/UX Design Tools:**
  - 📏 **Figma-Style Ruler Guide:** Real-time pixel distance measurement between the selected element and any hovered element across 4 directions (Top, Right, Bottom, Left, and Inner padding) with live coral guide lines and `px` badges (toggle via button or hold `Alt` key).
  - 🎨 **Color Palette Inspector:** Auto-extracts all colors (`Text`, `Bg`, `Border`, `Shadow`, `Fill`, `Stroke`) into interactive color swatches with 1-click Hex code copy.
  - 🔤 **Typography Inspector:** Real-time inspection of Font Family, Size, Weight, Line-height, Letter-spacing, and Alignment with 1-click `📋 Copy Font CSS`.
  - ⚡ **Tailwind CSS Converter:** Translates computed styles into modern, ready-to-use Tailwind CSS utility classes with 1-click copy.
- **⚡ QA & PenTest Tools:**
  - 🌐 **Form to cURL Exporter:** 1-Click to generate a complete, ready-to-run `curl` command with method (`GET`/`POST`), action URL, headers (`Referer`, `Origin`, `User-Agent`), and serialized form data (or multipart `-F` for file uploads) to execute in Terminal, Postman, or Burp Suite.
  - 🛡️ **PenTest & Security Payload Presets:** Dedicated chips for instant security testing against input validation:
    - **SQL Injection:** `' OR '1'='1`, `admin' --`
    - **Cross-Site Scripting (XSS):** `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`
    - **Server-Side Template Injection (SSTI):** `{{7*7}}`, `${7*7}`
    - **OS Command Injection:** `| dir`, `; ls -la`
  - 📁 **1-Click Fake File Generator:** Inject realistic mock files (`📄 PDF`, `🖼️ JPG`, `📊 CSV`, `⚠️ 15MB Oversize`, `🚫 .exe script`) directly into `<input type="file">` via the native `DataTransfer` API without needing physical files on disk.
  - 🇱🇦 **Lao & Global Mock Data Presets:** One-click locale toggle (`🇱🇦 LA` / `🌐 EN`) generating localized Lao names, 020 phones, Lao provinces/districts, streets, and companies.
  - 💾 **Form State Save & Restore:** Snapshot all form field values into browser storage (`chrome.storage`) and restore them across sessions in 1 click.
  - 🎲 **Smart Random Auto-Input:** Context-aware automatic data generation (Name, Email, Phone, Password, Address, Date, Numbers, URLs) that injects realistic mock data with native React/Vue/Angular prototype synchronization.
  - ⚡ **Fill Entire Form:** 1-Click to automatically fill all inputs, textareas, select dropdowns, checkboxes, and file uploads across the entire form or container.
  - 🧩 **Quick Mock Chips:** 1-Click chips for realistic `👤 Name`, `📧 Email`, `📱 Phone`, `🔑 Password`, and `📝 Text`.
  - 🔓 **Unlock Form Constraints:** Remove `disabled`, `readonly`, `maxlength`, `pattern`, `required`, and `novalidate` restrictions with 1 click.
  - 👁️ **Show Password:** Instantly unmask and toggle masked password fields.
  - 🎭 **Playwright Automation Locators:** Generate ready-to-use Playwright scripts (`getByTestId`, `getByRole`, `locator`).
  - 🌲 **Cypress Automation Locators:** Generate ready-to-use Cypress scripts.
  - ⚡ **Boundary & Security Test Data:** Inject boundary strings (Long 300), Special Characters (`!@#$%...`), Unicode/Emojis (`🚀🌟...`), Max Numbers (`999999999`), HTML XSS Probes (`<test'"`>`), and Quick Clear.
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
