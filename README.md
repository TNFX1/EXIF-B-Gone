<div align="center">

  <img src="icon.png" alt="EXIF-B-Gone Logo" width="128" height="128">

  # 🛡️ EXIF-B-Gone

  **Privacy-First Local Metadata Scrubber & EXIF/Video Inspector**
  
  *Easily inspect and strip sensitive metadata like GPS location, capture dates, hardware serial numbers, and camera settings from your photos AND videos — 100% locally on your device.*

  [![Version](https://img.shields.io/badge/version-1.5.1-rose.svg?style=for-the-badge)](https://github.com/TNFX1/EXIF-B-Gone)
  [![License](https://img.shields.io/badge/license-MIT-emerald.svg?style=for-the-badge)](LICENSE)
  [![Privacy](https://img.shields.io/badge/privacy-100%25%20Client--Side-blue.svg?style=for-the-badge)](#-privacy--security)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Web-purple.svg?style=for-the-badge)](#-installation)
  [![Supports](https://img.shields.io/badge/supports-Photos%20%26%20Videos-amber.svg?style=for-the-badge)](#-key-features)

</div>

---

## 🌟 Why EXIF-B-Gone?

Photos and videos shared on social media, messaging apps, and the web often contain hidden metadata including **exact GPS coordinates**, **home/office locations**, **exact timestamps**, and **device serial numbers**. 

**EXIF-B-Gone** safeguards your digital footprint by detecting and scrubbing these sensitive tags at the pixel/frame level before you publish or share your media.

---

## ✨ Key Features

- 🔍 **Privacy-Focused Inspector:** Instantly view embedded GPS coordinates, camera models, serial numbers, and creation timestamps with smart noise filtering.
- 🎬 **Full Video & Photo Support:** Strip metadata from both images (`.jpg`, `.png`, `.webp`, `.heic`) and video formats (`.mp4`, `.webm`).
- ⚡ **Instant Native Downloads:** Integrated native save dialogs for lightning-fast export without browser download delays.
- 👁️ **Live Visual Canvas & Rotation:** Rotate (90° left/right), flip horizontally, and preview images & videos in real-time with smooth CSS animations.
- 🍏 **HEIC / Apple Photo Support:** Native decoding and live preview support for iPhone `.heic` / `.heif` media.
- 🧹 **Deep Pixel/Frame Scrubbing:** Permanently strips EXIF, GPS, IPTC, XMP, and software signatures by re-rendering media safely on RAM.
- 📐 **Format & Resolution Control:** Resize dimensions (Width x Height), adjust compression quality, and export to JPEG, PNG, WebP, or MP4.
- 🌐 **Multi-Language Support:** First-launch language selector with seamless English and Turkish localization.
- 📦 **Batch Operations & ZIP Export:** Process multiple files simultaneously and export them individually or as a single `.zip` archive.
- 🔒 **100% Offline & Private:** Your media **never** leaves your computer. Zero server uploads.

---

## 💻 Installation & Usage

### 🚀 Windows Installer (Recommended)
1. Go to the **[Releases](https://github.com/TNFX1/EXIF-B-Gone/releases)** tab on GitHub.
2. Download **`EXIF-B-Gone-Setup-x64.exe`**.
3. Run the installer to set up EXIF-B-Gone with automatic desktop and start menu shortcuts.

### 📦 Portable ZIP (No Installation)
Download **`EXIF-B-Gone-Windows-x64.zip`**, extract the archive, and double-click `EXIF-B-Gone.exe`.

### 🌐 Browser / Web Mode
Clone this repository and double-click `index.html` to open the utility in any modern web browser (Chrome, Edge, Firefox, Brave).

---

## 🛠️ Tech Stack

- **UI & Styling:** HTML5, Tailwind CSS, FontAwesome (Matte Dark OLED Theme)
- **Parsing Engine:** `exifr` & Web APIs
- **Archiving Engine:** `JSZip`
- **Desktop Packaging:** NW.js & Inno Setup
- **CI/CD Pipeline:** GitHub Actions

---

## 📄 License

Distributed under the **[MIT License](LICENSE)**.
