document.addEventListener('DOMContentLoaded', () => {

  // Formspree Endpoint
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xrenyqgg";

  let queue = [];
  let selectedIndex = -1;
  let currentRotation = 0;
  let currentFlip = false;
  let currentScale = 1;
  let currentLang = localStorage.getItem('app_lang') || 'en';

  const i18n = {
    en: {
      subtitle: "Strip unwanted metadata from your photos & videos.",
      btnFeedback: "Feedback",
      dragTitle: "Drop your photos or videos here or click to browse",
      dragSub: "All files processed locally on your RAM, zero cloud upload.",
      outFormat: "Export Format",
      resizeMax: "Size (Width x Height)",
      phWidth: "Width (px)",
      phHeight: "Height (px)",
      qualityLabel: "Quality",
      lblTransform: "Rotate / Flip:",
      btnRotateLeft: "Left",
      btnRotateRight: "Right",
      btnFlipH: "Flip",
      btnResetScale: "Reset",
      queueTitle: "Queue",
      btnClear: "Clear",
      emptyState: "No files in queue.",
      btnProcess: "Clean & Download",
      btnZip: "Download ZIP",
      inspectorTitle: "Privacy Inspector",
      inspectorEmpty: "Select a file to inspect embedded metadata.",
      inspectorClean: "File is completely clean! Zero metadata embedded.",
      feedbackTitle: "Send Feedback",
      phFeedbackEmail: "Your Email (optional)",
      phFeedbackMessage: "Write your thoughts or issues...",
      btnSubmitFeedback: "Send Feedback",
      feedbackSuccess: "Thank you for your feedback!",
      feedbackError: "Failed to send feedback. Please try again."
    },
    tr: {
      subtitle: "Fotoğraf ve videolarınızdaki istenmeyen gizli verileri (EXIF) temizleyin.",
      btnFeedback: "Geri Bildirim",
      dragTitle: "Fotoğraf veya videolarınızı buraya sürükleyin veya seçin",
      dragSub: "Tüm işlemler RAM üzerinde gerçekleşir, sunucuya hiçbir veri yüklenmez.",
      outFormat: "Dışa Aktarım Formatı",
      resizeMax: "Boyutlandır (Genişlik x Yükseklik)",
      phWidth: "Genişlik (px)",
      phHeight: "Yükseklik (px)",
      qualityLabel: "Kalite",
      lblTransform: "Döndür / Çevir:",
      btnRotateLeft: "Sola",
      btnRotateRight: "Sağa",
      btnFlipH: "Çevir",
      btnResetScale: "Sıfırla",
      queueTitle: "Kuyruk",
      btnClear: "Temizle",
      emptyState: "Kuyrukta dosya yok.",
      btnProcess: "Temizle ve İndir",
      btnZip: "ZIP Olarak İndir",
      inspectorTitle: "Gizlilik İnceleyicisi",
      inspectorEmpty: "Gizli verileri görmek için bir dosya seçin.",
      inspectorClean: "Dosya tamamen temiz! Hiçbir gizli veri bulunamadı.",
      feedbackTitle: "Geri Bildirim Gönder",
      phFeedbackEmail: "E-postanız (isteğe bağlı)",
      phFeedbackMessage: "Düşüncelerinizi veya karşılaştığınız sorunları yazın...",
      btnSubmitFeedback: "Gönder",
      feedbackSuccess: "Geri bildiriminiz için teşekkür ederiz!",
      feedbackError: "Gönderim başarısız oldu. Lütfen tekrar deneyin."
    }
  };

  // DOM Elements (index.html ile tam eşleşen ID'ler)
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('file-input');
  const queueContainer = document.getElementById('queueContainer');
  const queueCount = document.getElementById('queueCount');
  const clearQueueBtn = document.getElementById('clearQueueBtn');
  const processBtn = document.getElementById('processBtn');
  const zipBtn = document.getElementById('zipBtn');
  
  const inspectorPreview = document.getElementById('inspectorPreview');
  const metadataTable = document.getElementById('metadataTable');
  const inspectorEmptyState = document.getElementById('inspectorEmptyState');
  
  const rotateLeftBtn = document.getElementById('rotateLeftBtn');
  const rotateRightBtn = document.getElementById('rotateRightBtn');
  const flipHBtn = document.getElementById('flipHBtn');
  const resetTransformBtn = document.getElementById('resetTransformBtn');

  const qualitySlider = document.getElementById('qualitySlider');
  const qualityValue = document.getElementById('qualityValue');
  const exportFormat = document.getElementById('exportFormat');
  const maxWidthInput = document.getElementById('maxWidthInput');
  const maxHeightInput = document.getElementById('maxHeightInput');

  const langSelect = document.getElementById('langSelect');

  const feedbackBtn = document.getElementById('feedbackBtn');
  const feedbackModal = document.getElementById('feedbackModal');
  const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
  const feedbackForm = document.getElementById('feedbackForm');
  const feedbackStatus = document.getElementById('feedbackStatus');

  function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    if (langSelect) langSelect.value = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang] && i18n[lang][key]) {
        el.textContent = i18n[lang][key];
      }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (i18n[lang] && i18n[lang][key]) {
        el.placeholder = i18n[lang][key];
      }
    });
  }

  if (langSelect) {
    langSelect.addEventListener('change', (e) => updateLanguage(e.target.value));
  }
  updateLanguage(currentLang);

  if (qualitySlider && qualityValue) {
    qualitySlider.addEventListener('input', (e) => {
      qualityValue.textContent = `${e.target.value}%`;
    });
  }

  // File Drop & Click Logic (Düzeltildi)
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', (e) => {
      fileInput.click();
    });
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-rose-500/50', 'bg-rose-500/5');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-rose-500/50', 'bg-rose-500/5');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-rose-500/50', 'bg-rose-500/5');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        handleFiles(Array.from(e.target.files));
        fileInput.value = '';
      }
    });
  }

  async function handleFiles(files) {
    for (const file of files) {
      const isImg = file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
      const isVid = file.type.startsWith('video/');

      if (!isImg && !isVid) continue;

      let parsedMeta = null;
      let displayUrl = null;

      if (isImg) {
        try {
          if (typeof exifr !== 'undefined') {
            parsedMeta = await exifr.parse(file, { tiff: true, xmp: true, icc: true, iptc: true, jfif: true, gps: true });
          }
        } catch (err) {
          console.warn("Exifr parse warning:", err);
        }

        if (/\.(heic|heif)$/i.test(file.name) && typeof heic2any !== 'undefined') {
          try {
            const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
            displayUrl = URL.createObjectURL(Array.isArray(converted) ? converted[0] : converted);
          } catch (e) {
            console.error("HEIC convert error:", e);
          }
        } else {
          displayUrl = URL.createObjectURL(file);
        }
      } else {
        displayUrl = URL.createObjectURL(file);
      }

      queue.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: formatBytes(file.size),
        type: isImg ? 'image' : 'video',
        url: displayUrl,
        metadata: parsedMeta
      });
    }

    renderQueue();
    if (queue.length > 0 && selectedIndex === -1) {
      selectItem(0);
    }
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function renderQueue() {
    if (!queueContainer) return;
    queueContainer.innerHTML = '';
    
    if (queueCount) queueCount.textContent = queue.length;

    if (queue.length === 0) {
      queueContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-32 text-zinc-600 gap-2">
          <i class="fa-solid fa-folder-open text-2xl"></i>
          <span class="text-xs" data-i18n="emptyState">${i18n[currentLang].emptyState}</span>
        </div>
      `;
      resetInspector();
      return;
    }

    queue.forEach((item, index) => {
      const isSelected = index === selectedIndex;
      const card = document.createElement('div');
      card.className = `flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
        isSelected 
          ? 'bg-rose-500/10 border-rose-500/40 text-rose-200' 
          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
      }`;

      card.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400 text-xs">
            <i class="${item.type === 'image' ? 'fa-regular fa-image' : 'fa-solid fa-film'}"></i>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-medium truncate">${item.name}</span>
            <span class="text-[10px] text-zinc-500">${item.size}</span>
          </div>
        </div>
        <button class="remove-btn w-6 h-6 rounded-md hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.remove-btn')) return;
        selectItem(index);
      });

      card.querySelector('.remove-btn').addEventListener('click', () => {
        removeItem(index);
      });

      queueContainer.appendChild(card);
    });
  }

  function selectItem(index) {
    selectedIndex = index;
    renderQueue();
    renderInspector();
  }

  function removeItem(index) {
    queue.splice(index, 1);
    if (selectedIndex >= queue.length) {
      selectedIndex = queue.length - 1;
    }
    renderQueue();
    if (selectedIndex >= 0) {
      renderInspector();
    } else {
      resetInspector();
    }
  }

  clearQueueBtn?.addEventListener('click', () => {
    queue = [];
    selectedIndex = -1;
    renderQueue();
    resetInspector();
  });

  function resetInspector() {
    if (inspectorPreview) inspectorPreview.innerHTML = `<span class="text-xs text-zinc-600" data-i18n="inspectorEmpty">${i18n[currentLang].inspectorEmpty}</span>`;
    if (metadataTable) metadataTable.innerHTML = '';
    if (inspectorEmptyState) inspectorEmptyState.classList.remove('hidden');
  }

  function renderInspector() {
    if (selectedIndex < 0 || selectedIndex >= queue.length) {
      resetInspector();
      return;
    }

    const item = queue[selectedIndex];
    if (inspectorEmptyState) inspectorEmptyState.classList.add('hidden');

    if (inspectorPreview) {
      if (item.type === 'image') {
        inspectorPreview.innerHTML = `<img src="${item.url}" class="max-h-full max-w-full object-contain rounded-lg shadow-md" style="transform: rotate(${currentRotation}deg) scaleX(${currentFlip ? -1 : 1})">`;
      } else {
        inspectorPreview.innerHTML = `<video src="${item.url}" controls class="max-h-full max-w-full rounded-lg shadow-md"></video>`;
      }
    }

    if (metadataTable) {
      metadataTable.innerHTML = '';
      if (item.metadata && Object.keys(item.metadata).length > 0) {
        Object.entries(item.metadata).forEach(([key, val]) => {
          let displayVal = val;
          if (val instanceof Date) displayVal = val.toLocaleString();
          else if (typeof val === 'object') displayVal = JSON.stringify(val);

          const row = document.createElement('div');
          row.className = 'flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-950/40 border border-zinc-900/80 text-xs';
          row.innerHTML = `
            <span class="text-zinc-400 font-mono text-[11px]">${key}</span>
            <span class="text-rose-400 font-medium truncate max-w-[180px] font-mono text-[11px]" title="${displayVal}">${displayVal}</span>
          `;
          metadataTable.appendChild(row);
        });
      } else {
        metadataTable.innerHTML = `
          <div class="flex flex-col items-center justify-center p-6 text-emerald-400 gap-2 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <i class="fa-solid fa-shield-check text-xl"></i>
            <span class="text-xs font-medium text-center" data-i18n="inspectorClean">${i18n[currentLang].inspectorClean}</span>
          </div>
        `;
      }
    }
  }

  // Transform controls
  rotateLeftBtn?.addEventListener('click', () => { currentRotation = (currentRotation - 90) % 360; renderInspector(); });
  rotateRightBtn?.addEventListener('click', () => { currentRotation = (currentRotation + 90) % 360; renderInspector(); });
  flipHBtn?.addEventListener('click', () => { currentFlip = !currentFlip; renderInspector(); });
  resetTransformBtn?.addEventListener('click', () => { currentRotation = 0; currentFlip = false; renderInspector(); });

  // Deep Pixel & Metadata Sanitization Engine
  async function processImage(item) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = item.url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        const maxW = parseInt(maxWidthInput?.value) || 0;
        const maxH = parseInt(maxHeightInput?.value) || 0;

        if (maxW > 0 && width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (maxH > 0 && height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Temiz piksel çizimi: Tuvali tamamen temizle (tüm kalıntı EXIF/header verilerini sıfırlar)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (currentRotation !== 0 || currentFlip) {
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          if (currentRotation) ctx.rotate((currentRotation * Math.PI) / 180);
          if (currentFlip) ctx.scale(-1, 1);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.restore();
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const selectedFmt = exportFormat?.value || 'original';
        let mimeType = 'image/jpeg';
        let ext = item.name.split('.').pop() || 'jpg';

        if (selectedFmt === 'png') { mimeType = 'image/png'; ext = 'png'; }
        else if (selectedFmt === 'webp') { mimeType = 'image/webp'; ext = 'webp'; }
        else if (selectedFmt === 'jpeg') { mimeType = 'image/jpeg'; ext = 'jpg'; }

        const qVal = (parseInt(qualitySlider?.value) || 90) / 100;

        canvas.toBlob((blob) => {
          resolve({ blob, format: ext });
        }, mimeType, qVal);
      };
    });
  }

  async function processVideo(item) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = item.url;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        let width = video.videoWidth;
        let height = video.videoHeight;

        const maxW = parseInt(maxWidthInput?.value) || 0;
        const maxH = parseInt(maxHeightInput?.value) || 0;

        if (maxW > 0 && width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (maxH > 0 && height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const stream = canvas.captureStream(30);
        
        const selectedFmt = exportFormat?.value || 'original';
        let ext = selectedFmt === 'original' ? (item.name.split('.').pop() || 'mp4') : selectedFmt;
        let mimeType = 'video/webm';

        if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
          ext = 'mp4';
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve({ blob, format: ext });
        };

        recorder.start();
        video.play();

        function drawFrame() {
          if (video.paused || video.ended) {
            recorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(drawFrame);
        }

        drawFrame();
      };
    });
  }

  processBtn?.addEventListener('click', async () => {
    for (const item of queue) {
      let result;
      if (item.type === 'image') {
        result = await processImage(item);
      } else {
        result = await processVideo(item);
      }
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(result.blob);
      a.download = `cleaned_${item.name.replace(/\.[^/.]+$/, '')}.${result.format}`;
      a.click();
    }
  });

  zipBtn?.addEventListener('click', async () => {
    if (typeof JSZip === 'undefined') return;
    const zip = new JSZip();

    for (const item of queue) {
      let result;
      if (item.type === 'image') {
        result = await processImage(item);
      } else {
        result = await processVideo(item);
      }
      zip.file(`cleaned_${item.name.replace(/\.[^/.]+$/, '')}.${result.format}`, result.blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = "cleaned_files.zip";
    a.click();
  });

  // Feedback Modal Controls
  feedbackBtn?.addEventListener('click', () => {
    feedbackModal?.classList.remove('hidden');
  });

  closeFeedbackBtn?.addEventListener('click', () => {
    feedbackModal?.classList.add('hidden');
    if (feedbackStatus) feedbackStatus.textContent = '';
  });

  feedbackForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('feedbackEmail')?.value;
    const message = document.getElementById('feedbackMessage')?.value;

    if (feedbackStatus) {
      feedbackStatus.className = 'text-xs text-zinc-400 font-medium text-center';
      feedbackStatus.textContent = 'Sending...';
    }

    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message })
      });

      if (resp.ok) {
        if (feedbackStatus) {
          feedbackStatus.className = 'text-xs text-emerald-400 font-medium text-center';
          feedbackStatus.textContent = i18n[currentLang].feedbackSuccess;
        }
        feedbackForm.reset();
        setTimeout(() => {
          feedbackModal?.classList.add('hidden');
          if (feedbackStatus) feedbackStatus.textContent = '';
        }, 1500);
      } else {
        throw new Error();
      }
    } catch (err) {
      if (feedbackStatus) {
        feedbackStatus.className = 'text-xs text-rose-400 font-medium text-center';
        feedbackStatus.textContent = i18n[currentLang].feedbackError;
      }
    }
  });

});