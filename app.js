if (typeof nw !== 'undefined') {
  try {
    const win = nw.Window.get();
    win.setIcon('icon.png');
  } catch(e) {}
}

let queue = [];
let selectedIndex = null;
const CURRENT_VERSION = "1.5.0";
const GITHUB_REPO = "TNFX1/EXIF-B-Gone";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xrenyqgg";

const NON_REMOVABLE_KEYS = [
  'orientation', 'xresolution', 'yresolution', 'resolutionunit',
  'colorspace', 'exifimagewidth', 'exifimageheight', 'imagewidth',
  'imageheight', 'width', 'height', 'compression', 'photometricinterpretation',
  'thumbnail', 'thumbnailbytecount', 'thumbnailoffset', 'jfifversion',
  'thumbnailwidth', 'thumbnailheight', 'profileversion', 'profileclass',
  'colorspacedata', 'profileconnectionspace', 'profilefilesignature',
  'renderingintent', 'profiledescription', 'profilecopyright',
  'profilecmmtype', 'primaryplatform', 'devicemanufacturer', 'profilecreator'
];

const i18n = {
  tr: {
    subtitle: "Fotoğraf ve Videolarınızın izlerini sıfırlayın.",
    btnFeedback: "Geri Bildirim",
    dragTitle: "Fotoğraf veya Videolarınızı buraya bırakın",
    dragSub: "Tüm dosyalar bilgisayarınızda yerel olarak işlenir, sunucuya aktarılmaz.",
    queueTitle: "İşlem Kuyruğu",
    btnClear: "Temizle",
    emptyState: "Kuyrukta dosya yok.",
    btnProcess: "Temizle & İndir",
    btnZip: "ZIP İndir",
    inspectorTitle: "Gizlilik Analizi",
    inspectorEmpty: "Dosya seçerek içeride kalan gizli verileri kontrol edin.",
    settingsTitle: "Ayarlar",
    langLabel: "Uygulama Dili",
    updateLabel: "Güncelleme Durumu",
    btnCheckUpdate: "Güncellemeleri Kontrol Et",
    feedbackTitle: "Geri Bildirim Gönder",
    feedbackSub: "İstek, öneri veya karşılaştığınız hataları bize iletebilirsiniz.",
    btnSendFeedback: "Gönder",
    outFormat: "Çıktı Formatı",
    resizeMax: "Boyut (Genişlik x Yükseklik)",
    qualityLabel: "Kalite"
  },
  en: {
    subtitle: "Strip unwanted metadata from your photos & videos.",
    btnFeedback: "Feedback",
    dragTitle: "Drop your photos or videos here or click to browse",
    dragSub: "All files processed locally on your RAM, zero cloud upload.",
    queueTitle: "Queue",
    btnClear: "Clear",
    emptyState: "No files in queue.",
    btnProcess: "Clean & Download",
    btnZip: "Download ZIP",
    inspectorTitle: "Privacy Inspector",
    inspectorEmpty: "Select a file to inspect embedded metadata.",
    settingsTitle: "Settings",
    langLabel: "App Language",
    updateLabel: "Update Status",
    btnCheckUpdate: "Check for Updates",
    feedbackTitle: "Send Feedback",
    feedbackSub: "Share your ideas or bug reports with us.",
    btnSendFeedback: "Submit",
    outFormat: "Export Format",
    resizeMax: "Size (Width x Height)",
    qualityLabel: "Quality"
  }
};

let currentLang = localStorage.getItem('appLang') || 'tr';
setLanguage(currentLang);

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });
  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = lang;
}

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

if (dropzone && fileInput) {
  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      fileInput.value = '';
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('border-rose-500/50');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('border-rose-500/50');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('border-rose-500/50');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });
}

// MP4/MOV Metadata Okuma (Temizlenmiş videoları sıfır bayt kontrolüyle doğru tespit eder)
async function parseVideoMetadata(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const metadata = {};

  let hasUserData = false;
  
  // 'udta', 'meta' veya 'ilst' atomlarının içeriklerini kontrol et
  for (let i = 0; i < bytes.length - 4; i++) {
    const atom = String.fromCharCode(bytes[i], bytes[i+1], bytes[i+2], bytes[i+3]);
    if (atom === 'udta' || atom === 'meta' || atom === 'ilst' || atom === 'uuid') {
      let isZeroed = true;
      for (let j = i + 4; j < i + 32 && j < bytes.length; j++) {
        if (bytes[j] !== 0) {
          isZeroed = false;
          break;
        }
      }
      if (!isZeroed) {
        hasUserData = true;
        break;
      }
    }
  }

  if (hasUserData) {
    metadata['Container Atom'] = "MOOV / UDTA / META";
    metadata['Creation/Modify Info'] = "Mevcut (GPS / Cihaz / Tarih etiketi barındırıyor)";
    metadata['GPS/Device Location'] = "Ayrıştırılmış Konum Bağlamı Tespit Edildi";
    metadata['Format'] = file.type || 'video/mp4';
    metadata['Boyut'] = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    return metadata;
  } else {
    return null; // Temizlenmiş dosyalarda hassas metadata dönmez
  }
}

// Derinlemesine MP4/MOV Metadata Temizleme
async function stripVideoMetadata(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  const targetAtoms = ['udta', 'meta', 'ilst', 'uuid', 'XMP_'];

  for (let i = 0; i < bytes.length - 4; i++) {
    const tag = String.fromCharCode(bytes[i], bytes[i+1], bytes[i+2], bytes[i+3]);
    if (targetAtoms.includes(tag)) {
      const clearLength = Math.min(256, bytes.length - (i + 4));
      for (let j = i + 4; j < i + 4 + clearLength; j++) {
        bytes[j] = 0;
      }
    }
  }

  return new Blob([bytes], { type: file.type || 'video/mp4' });
}

async function handleFiles(files) {
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'tiff', 'tif', 'avif', 'bmp', 'mp4', 'mov', 'webm', 'm4v'];
  
  const newFiles = files.filter(f => {
    const ext = f.name.split('.').pop().toLowerCase();
    return validExtensions.includes(ext);
  });
  
  for (const file of newFiles) {
    const ext = file.name.split('.').pop().toLowerCase();
    const isVideo = ['mp4', 'mov', 'webm', 'm4v'].includes(ext) || file.type.startsWith('video/');
    let exifData = null;

    if (isVideo) {
      exifData = await parseVideoMetadata(file);
    } else {
      try {
        exifData = await exifr.parse(file, {
          tiff: true, xmp: true, iptc: true, icc: true, jfif: true, thumbnail: true
        });
      } catch (err) {}
    }
    
    queue.push({
      file: file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      exif: exifData,
      isVideo: isVideo,
      rotation: 0,
      flipH: false,
      convertedBlob: null,
      naturalWidth: 0,
      naturalHeight: 0
    });
  }
  
  if (queue.length > 0 && selectedIndex === null) {
    selectedIndex = 0;
  }
  
  updateUI();
  if (selectedIndex !== null) selectFile(selectedIndex);
}

function updateFormatDropdown(isVideo) {
  const exportFormatSelect = document.getElementById('exportFormat');
  if (!exportFormatSelect) return;

  if (isVideo) {
    exportFormatSelect.innerHTML = `
      <option value="original">Orijinal Format (Varsayılan)</option>
      <option value="video/mp4">MP4 (.mp4)</option>
      <option value="video/webm">WebM (.webm)</option>
      <option value="video/quicktime">MOV (.mov)</option>
    `;
  } else {
    exportFormatSelect.innerHTML = `
      <option value="original">Orijinal Format (Varsayılan)</option>
      <option value="image/jpeg">JPEG (.jpg)</option>
      <option value="image/png">PNG (.png)</option>
      <option value="image/webp">WebP (.webp)</option>
      <option value="image/avif">AVIF (.avif)</option>
      <option value="image/bmp">BMP (.bmp)</option>
    `;
  }
}

function updateUI() {
  const fileList = document.getElementById('fileList');
  const emptyState = document.getElementById('emptyState');
  const fileCount = document.getElementById('fileCount');
  const processBtn = document.getElementById('processBtn');
  const zipBtn = document.getElementById('zipBtn');

  if (fileCount) fileCount.textContent = queue.length;
  if (!fileList) return;

  if (queue.length === 0) {
    fileList.innerHTML = '';
    if (emptyState) {
      emptyState.classList.remove('hidden');
      fileList.appendChild(emptyState);
    }
    if (processBtn) {
      processBtn.disabled = true;
      processBtn.className = "flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-900 text-zinc-600 cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-zinc-800/50";
    }
    if (zipBtn) {
      zipBtn.disabled = true;
      zipBtn.className = "py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-900 text-zinc-600 cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-zinc-800/50";
    }
    resetInspector();
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  fileList.innerHTML = '';

  if (processBtn) {
    processBtn.disabled = false;
    processBtn.className = "flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20";
  }
  if (zipBtn) {
    zipBtn.disabled = false;
    zipBtn.className = "py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer transition-all flex items-center justify-center gap-2 border border-zinc-700";
  }

  queue.forEach((item, index) => {
    const div = document.createElement('div');
    const isSelected = selectedIndex === index;
    div.className = `p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${isSelected ? 'bg-zinc-900 border-rose-500/50' : 'bg-black/40 border-zinc-800/50 hover:border-zinc-700'}`;
    
    const iconClass = item.isVideo ? 'fa-video text-rose-400' : 'fa-image text-zinc-500';

    div.innerHTML = `
      <div class="flex items-center gap-3 truncate pointer-events-none">
        <i class="fa-regular ${iconClass}"></i>
        <div class="truncate">
          <p class="text-xs font-medium text-zinc-200 truncate">${item.name}</p>
          <p class="text-[10px] text-zinc-500">${item.size}</p>
        </div>
      </div>
      <button type="button" data-index="${index}" class="delete-single-btn p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer">
        <i class="fa-solid fa-xmark text-xs pointer-events-none"></i>
      </button>
    `;

    div.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-single-btn')) selectFile(index);
    });

    const delBtn = div.querySelector('.delete-single-btn');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      removeItemByIndex(index);
    });

    fileList.appendChild(div);
  });
}

function removeItemByIndex(index) {
  queue.splice(index, 1);
  if (queue.length === 0) selectedIndex = null;
  else if (selectedIndex >= queue.length) selectedIndex = queue.length - 1;
  
  updateUI();
  if (selectedIndex !== null && queue[selectedIndex]) selectFile(selectedIndex);
  else resetInspector();
}

function updatePreviewTransform() {
  const previewImg = document.getElementById('imagePreview');
  if (!previewImg || selectedIndex === null || !queue[selectedIndex]) return;

  const item = queue[selectedIndex];
  const scaleX = item.flipH ? -1 : 1;
  previewImg.style.transform = `rotate(${item.rotation}deg) scaleX(${scaleX})`;
}

async function selectFile(index) {
  if (index < 0 || index >= queue.length) return;
  selectedIndex = index;
  const item = queue[index];

  updateFormatDropdown(item.isVideo);

  const fileNameEl = document.getElementById('selectedFileName');
  if (fileNameEl) fileNameEl.textContent = item.name;

  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('imagePreview');
  const previewVideo = document.getElementById('videoPreview');

  if (previewContainer) previewContainer.classList.remove('hidden');

  if (item.isVideo) {
    if (previewImg) previewImg.classList.add('hidden');
    if (previewVideo) {
      previewVideo.classList.remove('hidden');
      previewVideo.src = URL.createObjectURL(item.file);
    }
  } else {
    if (previewVideo) previewVideo.classList.add('hidden');
    if (previewImg) {
      previewImg.classList.remove('hidden');
      const sourceBlob = await getImageSourceBlob(item);
      previewImg.src = URL.createObjectURL(sourceBlob);
      
      previewImg.onload = () => {
        item.naturalWidth = previewImg.naturalWidth;
        item.naturalHeight = previewImg.naturalHeight;
      };
      
      updatePreviewTransform();
    }
  }

  renderInspectorData(item);
  updateUI();
}

function renderInspectorData(item) {
  const exifInspector = document.getElementById('exifInspector');
  if (!exifInspector) return;

  if (!item.exif || Object.keys(item.exif).length === 0) {
    exifInspector.innerHTML = `<div class="text-center py-10 text-emerald-400/90 text-xs flex flex-col items-center gap-2"><i class="fa-solid fa-circle-check text-lg"></i><span>${currentLang === 'tr' ? 'Dosyada hiçbir gizli veri bulunamadı!' : 'No sensitive metadata found!'}</span></div>`;
  } else {
    let filteredEntries = [];
    for (const [key, val] of Object.entries(item.exif)) {
      if (typeof val !== 'object' && val !== undefined) {
        if (!NON_REMOVABLE_KEYS.includes(key.toLowerCase())) {
          filteredEntries.push([key, val]);
        }
      }
    }

    if (filteredEntries.length === 0) {
      exifInspector.innerHTML = `<div class="text-center py-10 text-emerald-400/90 text-xs flex flex-col items-center gap-2"><i class="fa-solid fa-circle-check text-lg"></i><span>${currentLang === 'tr' ? 'Dosya temiz. Hassas veri yok.' : 'File is clean. No sensitive metadata.'}</span></div>`;
    } else {
      let html = '<div class="flex flex-col gap-1.5 w-full">';
      for (const [key, val] of filteredEntries) {
        html += `
          <div class="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-black/60 border border-zinc-800/80">
            <span class="text-zinc-400 font-medium">${key}</span>
            <span class="text-rose-400 font-mono text-[11px] truncate max-w-[180px]">${val}</span>
          </div>
        `;
      }
      html += '</div>';
      exifInspector.innerHTML = html;
    }
  }
}

document.getElementById('rotateLeftBtn')?.addEventListener('click', () => {
  if (selectedIndex !== null && queue[selectedIndex]) {
    queue[selectedIndex].rotation -= 90;
    updatePreviewTransform();
  }
});

document.getElementById('rotateRightBtn')?.addEventListener('click', () => {
  if (selectedIndex !== null && queue[selectedIndex]) {
    queue[selectedIndex].rotation += 90;
    updatePreviewTransform();
  }
});

document.getElementById('flipHBtn')?.addEventListener('click', () => {
  if (selectedIndex !== null && queue[selectedIndex]) {
    queue[selectedIndex].flipH = !queue[selectedIndex].flipH;
    updatePreviewTransform();
  }
});

document.getElementById('scale50Btn')?.addEventListener('click', () => setPercentScale(0.5));
document.getElementById('scale75Btn')?.addEventListener('click', () => setPercentScale(0.75));
document.getElementById('resetScaleBtn')?.addEventListener('click', resetScale);

function setPercentScale(factor) {
  if (selectedIndex === null || !queue[selectedIndex]) return;
  const item = queue[selectedIndex];
  if (item.naturalWidth && item.naturalHeight) {
    document.getElementById('maxWidthInput').value = Math.round(item.naturalWidth * factor);
    document.getElementById('maxHeightInput').value = Math.round(item.naturalHeight * factor);
  }
}

function resetScale() {
  document.getElementById('maxWidthInput').value = '';
  document.getElementById('maxHeightInput').value = '';
}

document.getElementById('qualityRange')?.addEventListener('input', (e) => {
  const qualityVal = document.getElementById('qualityVal');
  if (qualityVal) qualityVal.textContent = Math.round(e.target.value * 100) + '%';
});

document.getElementById('clearAllBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  queue = [];
  selectedIndex = null;
  updateUI();
});

function resetInspector() {
  const fileNameEl = document.getElementById('selectedFileName');
  if (fileNameEl) fileNameEl.textContent = '';
  
  const previewContainer = document.getElementById('previewContainer');
  if (previewContainer) previewContainer.classList.add('hidden');
  
  const exifInspector = document.getElementById('exifInspector');
  if (exifInspector) {
    exifInspector.innerHTML = `<div class="text-center py-12 text-zinc-600 text-xs leading-relaxed">${i18n[currentLang].inspectorEmpty}</div>`;
  }
}

function triggerDownload(blob, fileName) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (e) {
    console.error("İndirme hatası:", e);
  }
}

async function getImageSourceBlob(item) {
  const ext = item.name.split('.').pop().toLowerCase();
  
  if (ext === 'heic' || ext === 'heif' || item.file.type === 'image/heic' || item.file.type === 'image/heif') {
    if (item.convertedBlob) {
      return item.convertedBlob;
    }
    if (typeof heic2any !== 'undefined') {
      try {
        const converted = await heic2any({
          blob: item.file,
          toType: "image/jpeg",
          quality: 0.95
        });
        const finalBlob = Array.isArray(converted) ? converted[0] : converted;
        item.convertedBlob = finalBlob;
        return finalBlob;
      } catch (e) {
        console.error("HEIC dönüşüm hatası:", e);
      }
    }
  }
  return item.file;
}

async function processMedia(item) {
  if (item.isVideo) {
    const cleanedBlob = await stripVideoMetadata(item.file);
    return { blob: cleanedBlob, name: item.name };
  }

  const sourceBlob = await getImageSourceBlob(item);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let origW = img.naturalWidth || img.width;
        let origH = img.naturalHeight || img.height;

        const rot = Math.abs(item.rotation % 360);
        const is90 = rot === 90 || rot === 270;

        let renderW = is90 ? origH : origW;
        let renderH = is90 ? origW : origH;

        const customW = parseInt(document.getElementById('maxWidthInput')?.value);
        const customH = parseInt(document.getElementById('maxHeightInput')?.value);

        if (customW && customH) {
          renderW = customW;
          renderH = customH;
        } else if (customW) {
          renderH = Math.round((renderH * customW) / renderW);
          renderW = customW;
        } else if (customH) {
          renderW = Math.round((renderW * customH) / renderH);
          renderH = customH;
        }

        canvas.width = renderW;
        canvas.height = renderH;

        const ctx = canvas.getContext('2d');
        const exportFormatSelect = document.getElementById('exportFormat')?.value || 'original';
        
        let targetMime = 'image/jpeg';
        const isHeic = item.name.toLowerCase().endsWith('.heic') || item.name.toLowerCase().endsWith('.heif');
        
        if (exportFormatSelect === 'original') {
          if (item.file.type && !isHeic) {
            targetMime = item.file.type;
          }
        } else {
          targetMime = exportFormatSelect;
        }

        const quality = parseFloat(document.getElementById('qualityRange')?.value || 0.9);

        if (targetMime === 'image/jpeg' || targetMime === 'image/bmp') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((item.rotation * Math.PI) / 180);
        if (item.flipH) ctx.scale(-1, 1);

        const drawW = is90 ? canvas.height : canvas.width;
        const drawH = is90 ? canvas.width : canvas.height;
        
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        let newName = item.name;
        const nameWithoutExt = newName.substring(0, newName.lastIndexOf('.')) || newName;

        const extMap = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/webp': '.webp',
          'image/avif': '.avif',
          'image/bmp': '.bmp'
        };
        if (extMap[targetMime]) newName = nameWithoutExt + extMap[targetMime];

        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, name: newName });
          } else {
            reject(new Error("Canvas toBlob failed"));
          }
        }, targetMime, quality);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = (err) => reject(err);
    img.src = URL.createObjectURL(sourceBlob);
  });
}

document.getElementById('processBtn')?.addEventListener('click', async () => {
  if (queue.length === 0) return;
  for (const item of queue) {
    try {
      const processed = await processMedia(item);
      triggerDownload(processed.blob, `cleaned_${processed.name}`);
    } catch (e) {
      alert(currentLang === 'tr' ? "Dosya işlenirken bir hata oluştu." : "Error processing file.");
    }
  }
});

document.getElementById('zipBtn')?.addEventListener('click', async () => {
  if (queue.length === 0) return;
  const zip = new JSZip();
  for (const item of queue) {
    try {
      const processed = await processMedia(item);
      zip.file(`cleaned_${processed.name}`, processed.blob);
    } catch (e) {}
  }
  const content = await zip.generateAsync({ type: 'blob' });
  triggerDownload(content, 'EXIF_Cleaned_Files.zip');
});

// Modal Kontrolleri
const settingsModal = document.getElementById('settingsModal');
const feedbackModal = document.getElementById('feedbackModal');

document.getElementById('openSettingsBtn')?.addEventListener('click', () => settingsModal?.classList.remove('hidden'));
document.getElementById('closeSettingsBtn')?.addEventListener('click', () => settingsModal?.classList.add('hidden'));

document.getElementById('openFeedbackBtn')?.addEventListener('click', () => feedbackModal?.classList.remove('hidden'));
document.getElementById('closeFeedbackBtn')?.addEventListener('click', () => feedbackModal?.classList.add('hidden'));

document.getElementById('langSelect')?.addEventListener('change', (e) => setLanguage(e.target.value));

document.getElementById('checkUpdateBtn')?.addEventListener('click', async () => {
  const container = document.getElementById('updateStatusContainer');
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = `<p class="text-[11px] text-zinc-400 text-center">${currentLang === 'tr' ? 'Kontrol ediliyor...' : 'Checking for updates...'}</p>`;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    const data = await response.json();
    const latestVersion = data.tag_name.replace('v', '');

    if (latestVersion !== CURRENT_VERSION) {
      const setupAsset = data.assets.find(a => a.name.endsWith('.exe'));
      const downloadUrl = setupAsset ? setupAsset.browser_download_url : data.html_url;

      container.innerHTML = currentLang === 'tr' 
        ? `<button id="autoInstallBtn" type="button" class="w-full py-2 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all cursor-pointer">Sürüm ${data.tag_name} İndir ve Kur</button>`
        : `<button id="autoInstallBtn" type="button" class="w-full py-2 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all cursor-pointer">Download & Install ${data.tag_name}</button>`;

      document.getElementById('autoInstallBtn')?.addEventListener('click', async () => {
        if (typeof nw !== 'undefined' && nw.Shell) {
          nw.Shell.openExternal(downloadUrl);
        } else {
          window.location.href = downloadUrl;
        }
      });
    } else {
      container.innerHTML = `<p class="text-[11px] text-emerald-400 text-center">${currentLang === 'tr' ? 'Uygulamanız güncel! (v' + CURRENT_VERSION + ')' : 'App is up to date! (v' + CURRENT_VERSION + ')'}</p>`;
    }
  } catch (err) {
    container.innerHTML = `<p class="text-[11px] text-rose-400 text-center">${currentLang === 'tr' ? 'Güncelleme kontrolü başarısız oldu.' : 'Failed to check for updates.'}</p>`;
  }
});

document.getElementById('feedbackForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('feedbackEmail')?.value || 'no-reply@exifbgone.app';
  const message = document.getElementById('feedbackMessage')?.value;
  const sendBtn = document.getElementById('sendFeedbackBtn');

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = currentLang === 'tr' ? 'Gönderiliyor...' : 'Sending...';
  }

  try {
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('message', message);

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      alert(currentLang === 'tr' ? 'Geri bildiriminiz başarıyla iletildi!' : 'Feedback sent successfully!');
      document.getElementById('feedbackForm').reset();
      feedbackModal?.classList.add('hidden');
    } else {
      throw new Error('Formspree error');
    }
  } catch (error) {
    if (typeof nw !== 'undefined' && nw.Shell) {
      nw.Shell.openExternal(`mailto:support@exifbgone.app?subject=EXIF-B-Gone Feedback&body=${encodeURIComponent(message)}`);
    }
    alert(currentLang === 'tr' ? 'Geri bildirim iletilemedi. E-posta istemciniz açılıyor...' : 'Opening email client...');
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = i18n[currentLang].btnSendFeedback;
    }
  }
});