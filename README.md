<div align="center">

  <img src="icon.png" alt="EXIF-B-Gone Logo" width="128" height="128">

  # 🛡️ EXIF-B-Gone

  **Privacy-First Local Metadata Scrubber & EXIF Viewer**
  
  *Easily inspect and strip sensitive metadata like GPS location, capture dates, hardware serial numbers, and camera settings from your images — 100% locally on your device.*

  [![Version](https://img.shields.io/badge/version-1.1.0-rose.svg?style=for-the-badge)](https://github.com/TNFX1/EXIF-B-Gone)
  [![License](https://img.shields.io/badge/license-MIT-emerald.svg?style=for-the-badge)](LICENSE)
  [![Privacy](https://img.shields.io/badge/privacy-100%25%20Client--Side-blue.svg?style=for-the-badge)](#-privacy--security)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Web-purple.svg?style=for-the-badge)](#-installation)

</div>

---

## 🌟 Why EXIF-B-Gone?

Photos shared on social media and the web often contain hidden metadata including **exact GPS coordinates**, **home/office addresses**, **timestamps**, and **device serial numbers**. 

**EXIF-B-Gone** safeguards your digital footprint by detecting and scrubbing these sensitive tags at the pixel level before you publish or share your photos.

---

## ✨ Key Features

- 🔍 **Detailed Metadata Inspector:** Instantly view embedded GPS location, camera settings, hardware models, and dates.
- 🗺️ **GPS Map Quick-Link:** Directly open coordinates on Google Maps to see what location data your photo is leaking.
- 🖼️ **Image Preview:** Built-in previewer to verify photos in your queue before processing.
- 🧹 **Deep Scrubbing:** Permanently strips GPS, timestamps, serial numbers, and software signatures.
- 📐 **Image Resizing & Format Conversion:** Adjust image width, export as JPG/PNG/WebP, and control compression quality.
- 🌐 **Multi-Language Support:** First-launch language picker with built-in Turkish and English options.
- 📦 **Batch Operations & ZIP Export:** Process multiple photos at once and download them individually or as a single `.zip` archive.
- 🔒 **100% Offline & Private:** Your photos **never** leave your computer. All processing happens locally inside your device's memory.

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

- **UI & Styling:** HTML5, Tailwind CSS, FontAwesome (Dark Obsidian Theme)
- **Parsing Engine:** `exifr`
- **Archiving Engine:** `JSZip`
- **Desktop Packaging:** NW.js & Inno Setup
- **CI/CD Pipeline:** GitHub Actions

---

## 📄 License

Distributed under the **[MIT License](LICENSE)**.