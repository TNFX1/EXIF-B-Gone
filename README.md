<div align="center">

  <img src="icon.png" alt="EXIF-B-Gone Logo" width="128" height="128">

  # 🛡️ EXIF-B-Gone

  **Privacy-First Local Metadata Remover & EXIF Viewer**
  
  *Easily view and strip sensitive metadata like GPS location, capture dates, and camera serial numbers from your images entirely locally on your device.*

  [![Version](https://img.shields.io/badge/version-1.0.12-cyan.svg?style=for-the-badge)](https://github.com/)
  [![License](https://img.shields.io/badge/license-MIT-emerald.svg?style=for-the-badge)](LICENSE)
  [![Privacy](https://img.shields.io/badge/privacy-100%25%20Client--Side-blue.svg?style=for-the-badge)](#-privacy--security)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Web-purple.svg?style=for-the-badge)](#-getting-started)

</div>

---

## 🌟 Why EXIF-B-Gone?

Photos you share online often contain hidden metadata including **exact GPS coordinates**, **device serial numbers**, **timestamps**, and **camera settings**. 

**EXIF-B-Gone** safeguards your digital privacy by inspecting and scrubbing these sensitive data points at the pixel level before you publish or share your media.

---

## ✨ Features

- 🔍 **Sensitive Data Inspector:** Instantly view detailed hidden metadata embedded inside your photos.
- 🧹 **Deep Scrubbing:** Completely strips GPS tags, capture timestamps, hardware serials, and software signatures.
- ⚡ **Pixel-Level Processing:** Re-renders image data via HTML5 Canvas to permanently strip EXIF tags while maintaining visual fidelity.
- 📦 **Batch Operations:** Drag-and-drop multiple images and clean them simultaneously with a single click.
- 🔒 **100% Offline & Private:** Your photos **never** leave your computer. All processing happens locally in your browser's RAM.

---

## 🚀 Getting Started

### Desktop Application (Windows)
1. Go to the **Releases** tab on GitHub and download the latest `EXIF-B-Gone-Windows-x64.zip`.
2. Extract the archive and launch `EXIF-B-Gone.exe`.

### Web / Local Usage
Clone or download this repository and double-click `index.html` to open the utility in any modern web browser (Chrome, Edge, Firefox, Brave).

---

## 🛠️ Tech Stack

- **UI & Styling:** HTML5, Tailwind CSS, FontAwesome
- **Parsing Engine:** `exifr`
- **Desktop Packaging:** NW.js & GitHub Actions CI/CD Pipeline

---

## 📄 License

Distributed under the **[MIT License](LICENSE)**.
