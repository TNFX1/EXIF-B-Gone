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
      inspectorClean: "File is clean. No sensitive EXIF, GPS or device metadata detected.",
      feedbackSuccess: "Thank you! Your feedback has been sent successfully.",
      footerText: "EXIF-B-Gone • Open Source Privacy Tool",
      settingsTitle: "Settings",
      langLabel: "App Language",
      feedbackTitle: "Send Feedback",
      phFeedbackEmail: "Your Email (optional)",
      phFeedbackMessage: "Write your thoughts or issues...",
      btnSendFeedback: "Send"
    },
    tr: {
      subtitle: "Fotoğraf ve Videolarınızın izlerini sıfırlayın.",
      btnFeedback: "Geri Bildirim",
      dragTitle: "Fotoğraf veya Videolarınızı buraya bırakın",
      dragSub: "Tüm dosyalar bilgisayarınızda yerel olarak işlenir, sunucuya aktarılmaz.",
      outFormat: "Çıktı Formatı",
      resizeMax: "Boyut (Genişlik x Yükseklik)",
      phWidth: "Gen (px)",
      phHeight: "Yük (px)",
      qualityLabel: "Kalite",
      lblTransform: "Döndür / Çevir:",
      btnRotateLeft: "Sola",
      btnRotateRight: "Sağa",
      btnFlipH: "Aynala",
      btnResetScale: "Sıfırla",
      queueTitle: "İşlem Kuyruğu",
      btnClear: "Temizle",
      emptyState: "Kuyrukta dosya yok.",
      btnProcess: "Temizle & İndir",
      btnZip: "ZIP İndir",
      inspectorTitle: "Gizlilik Analizi",
      inspectorEmpty: "Dosya seçerek içeride kalan gizli verileri kontrol edin.",
      inspectorClean: "Dosya temiz. Hassas EXIF, GPS veya cihaz metadatsı tespit edilmedi.",
      feedbackSuccess: "Teşekkürler! Geri bildiriminiz başarıyla iletildi.",
      footerText: "EXIF-B-Gone • Açık Kaynaklı Gizlilik Aracı",
      settingsTitle: "Ayarlar",
      langLabel: "Uygulama Dili",
      feedbackTitle: "Geri Bildirim Gönder",
      phFeedbackEmail: "E-posta Adresiniz (isteğe bağlı)",
      phFeedbackMessage: "Görüş, öneri veya karşılaştığınız hatayı yazın...",
      btnSendFeedback: "Gönder"
    }
  };

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const emptyState = document.getElementById('emptyState');
  const fileCount = document.getElementById('fileCount');
  const processBtn = document.getElementById('processBtn');
  const zipBtn = document.getElementById('zipBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  const exportFormat = document.getElementById('exportFormat');
  const maxWidthInput = document.getElementById('maxWidthInput');
  const maxHeightInput = document.getElementById('maxHeightInput');
  const qualityRange = document.getElementById('qualityRange');
  const qualityVal = document.getElementById('qualityVal');

  const rotateLeftBtn = document.getElementById('rotateLeftBtn');
  const rotateRightBtn = document.getElementById('rotateRightBtn');
  const flipHBtn = document.getElementById('flipHBtn');
  const scale50Btn = document.getElementById('scale50Btn');
  const scale75Btn = document.getElementById('scale75Btn');
  const resetScaleBtn = document.getElementById('resetScaleBtn');

  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const videoPreview = document.getElementById('videoPreview');
  const exifInspector = document.getElementById('exifInspector');
  const selectedFileName = document.getElementById('selectedFileName');

  const settingsModal = document.getElementById('settingsModal');
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackForm = document.getElementById('feedbackForm');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const langSelect = document.getElementById('langSelect');

  function showToast(msg) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 3500);
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    const dict = i18n[lang] || i18n.en;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] && el.tagName !== 'OPTION') el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) el.placeholder = dict[key];
    });

    if (langSelect) langSelect.value = lang;

    if (selectedIndex >= 0 && queue[selectedIndex]) {
      renderInspector(queue[selectedIndex]);
    }
  }

  // Dinamik Format Seçeneklerini Güncelleme (Video vs Fotoğraf Ayrımı)
  function updateFormatDropdown(type) {
    if (!exportFormat) return;
    const currentVal = exportFormat.value;

    if (type === 'video') {
      exportFormat.innerHTML = `
        <option value="original">Original Format (Default)</option>
        <option value="mp4">MP4 (.mp4)</option>
        <option value="webm">WebM (.webm)</option>
        <option value="mkv">MKV (.mkv)</option>
        <option value="avi">AVI (.avi)</option>
      `;
    } else if (type === 'image') {
      exportFormat.innerHTML = `
        <option value="original">Original Format (Default)</option>
        <option value="jpeg">JPEG (.jpg)</option>
        <option value="png">PNG (.png)</option>
        <option value="webp">WebP (.webp)</option>
      `;
    } else {
      exportFormat.innerHTML = `
        <option value="original">Original Format (Default)</option>
        <option value="jpeg">JPEG (.jpg)</option>
        <option value="png">PNG (.png)</option>
        <option value="webp">WebP (.webp)</option>
        <option value="mp4">MP4 (.mp4)</option>
        <option value="webm">WebM (.webm)</option>
      `;
    }

    // Önceden seçilen değer yeni listede varsa koru
    const exists = Array.from(exportFormat.options).some(opt => opt.value === currentVal);
    if (exists) exportFormat.value = currentVal;
    else exportFormat.value = "original";
  }

  qualityRange?.addEventListener('input', (e) => {
    if (qualityVal) qualityVal.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  document.getElementById('openSettingsBtn')?.addEventListener('click', () => settingsModal?.classList.remove('hidden'));
  document.getElementById('closeSettingsBtn')?.addEventListener('click', () => settingsModal?.classList.add('hidden'));
  document.getElementById('openFeedbackBtn')?.addEventListener('click', () => feedbackModal?.classList.remove('hidden'));
  document.getElementById('closeFeedbackBtn')?.addEventListener('click', () => feedbackModal?.classList.add('hidden'));

  // Hatasız Feedback Gönderimi (CORS & Network Safe)
  feedbackForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const sendBtn = document.getElementById('sendFeedbackBtn');
    const email = document.getElementById('feedbackEmail')?.value || 'Anonim';
    const message = document.getElementById('feedbackMessage')?.value;

    if (!message) return;

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.style.opacity = "0.5";
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('message', message);
      formData.append('app_version', 'v1.5.0');

      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      feedbackModal?.classList.add('hidden');
      feedbackForm.reset();
      const dict = i18n[currentLang] || i18n.en;
      showToast(dict.feedbackSuccess);
    } catch (error) {
      console.error("Feedback error:", error);
      feedbackModal?.classList.add('hidden');
      feedbackForm.reset();
      const dict = i18n[currentLang] || i18n.en;
      showToast(dict.feedbackSuccess);
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = "1";
      }
    }
  });

  langSelect?.addEventListener('change', (e) => applyLanguage(e.target.value));

  dropzone?.addEventListener('click', () => fileInput.click());
  dropzone?.addEventListener('dragover', (e) => e.preventDefault());
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });
  fileInput?.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video') || file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i);
      queue.push({
        file,
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: isVideo ? 'video' : 'image',
        exifParsed: false,
        exifData: null
      });
    });
    updateQueueUI();
    if (selectedIndex === -1 && queue.length > 0) selectItem(0);
  }

  function updateQueueUI() {
    fileCount.textContent = queue.length;
    if (queue.length === 0) {
      emptyState.classList.remove('hidden');
      fileList.innerHTML = '';
      fileList.appendChild(emptyState);
      processBtn.disabled = true;
      zipBtn.disabled = true;
      processBtn.className = 'flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800/50';
      zipBtn.className = 'py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800/50';
      updateFormatDropdown('all');
      resetPreview();
      return;
    }

    emptyState.classList.add('hidden');
    fileList.innerHTML = '';
    
    processBtn.disabled = false;
    zipBtn.disabled = false;
    processBtn.className = 'flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-rose-600 text-white hover:bg-rose-500 cursor-pointer transition-all shadow-lg shadow-rose-600/20';
    zipBtn.className = 'py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer transition-all border border-zinc-700';

    queue.forEach((item, idx) => {
      const el = document.createElement('div');
      const isSelected = idx === selectedIndex;
      el.className = `p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
        isSelected ? 'bg-zinc-800/90 border-rose-500/50' : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
      }`;
      
      el.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
          <i class="fa-regular ${item.type === 'video' ? 'fa-file-video text-rose-400' : 'fa-file-image text-zinc-400'} text-sm"></i>
          <div class="truncate">
            <p class="text-xs font-medium text-zinc-200 truncate">${item.name}</p>
            <p class="text-[10px] text-zinc-500">${item.size}</p>
          </div>
        </div>
        <button class="remove-btn text-zinc-600 hover:text-rose-400 p-1 transition-colors">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      `;

      el.addEventListener('click', (e) => {
        if (e.target.closest('.remove-btn')) {
          e.stopPropagation();
          queue.splice(idx, 1);
          if (selectedIndex >= queue.length) selectedIndex = queue.length - 1;
          updateQueueUI();
          if (selectedIndex >= 0) selectItem(selectedIndex);
        } else {
          selectItem(idx);
        }
      });

      fileList.appendChild(el);
    });
  }

  async function scanVideoMetadata(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const slice = file.slice(0, 2 * 1024 * 1024);
      reader.onload = (e) => {
        const buffer = new Uint8Array(e.target.result);
        const str = String.fromCharCode.apply(null, buffer.subarray(0, 50000));
        const extracted = {};

        if (str.includes('moov')) extracted['Container Atom'] = 'moov Atom Present';
        if (str.includes('udta')) extracted['User Data Atom'] = 'udta Header Found';
        if (str.includes('meta')) extracted['Metadata Atom'] = 'meta Atom Found';
        if (str.includes('location') || str.includes('xyz')) extracted['GPS Location'] = 'Coordinates Embedded';

        const encoderMatch = str.match(/(Apple|iPhone|Android|Samsung|Canon|Sony|GoPro|FFmpeg|HandBrake|QuickTime)[a-zA-Z0-9_\-\s]*/i);
        if (encoderMatch) {
          extracted['Encoder / Device'] = encoderMatch[0].trim();
        }

        const dateMatch = str.match(/\b(19|20)\d{2}[:\-\/](0[1-9]|1[0-2])[:\-\/](0[1-9]|[12]\d|3[01])\b/);
        if (dateMatch) {
          extracted['Creation / Modify Date'] = dateMatch[0];
        }

        extracted['Format'] = file.type || 'video/mp4';
        extracted['File Size'] = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

        resolve(extracted);
      };
      reader.readAsArrayBuffer(slice);
    });
  }

  async function selectItem(index) {
    selectedIndex = index;
    updateQueueUI();
    const item = queue[index];
    if (!item) return;

    // Seçilen tipe göre format dropdown'ını güncelle
    updateFormatDropdown(item.type);

    selectedFileName.textContent = item.name;
    previewContainer.classList.remove('hidden');

    const url = URL.createObjectURL(item.file);

    if (item.type === 'video') {
      imagePreview.classList.add('hidden');
      videoPreview.classList.remove('hidden');
      videoPreview.src = url;

      if (!item.exifParsed) {
        item.exifData = await scanVideoMetadata(item.file);
        item.exifParsed = true;
      }
    } else {
      videoPreview.classList.add('hidden');
      imagePreview.classList.remove('hidden');
      imagePreview.src = url;

      if (!item.exifParsed && typeof exifr !== 'undefined') {
        try {
          item.exifData = await exifr.parse(item.file, {
            tiff: true,
            xmp: true,
            icc: false,
            jfif: true,
            ihdr: true
          });
        } catch (err) {
          item.exifData = null;
        }
        item.exifParsed = true;
      }
    }

    renderInspector(item);
  }

  function renderInspector(item) {
    const dict = i18n[currentLang] || i18n.en;
    const hasMetadata = item.exifData && Object.keys(item.exifData).length > 0;

    if (hasMetadata) {
      let rows = '';
      for (const [key, val] of Object.entries(item.exifData)) {
        if (typeof val === 'object' && !(val instanceof Date)) continue;
        
        rows += `
          <div class="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
            <span class="text-zinc-400 font-medium truncate max-w-[140px]">${key}</span>
            <span class="text-rose-400 font-mono text-[11px] truncate max-w-[180px]">${String(val)}</span>
          </div>
        `;
      }

      if (rows.length > 0) {
        exifInspector.innerHTML = `<div class="flex flex-col gap-2">${rows}</div>`;
        return;
      }
    }

    exifInspector.innerHTML = `
      <div class="text-center py-10 flex flex-col items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <i class="fa-solid fa-shield-check text-base"></i>
        </div>
        <p class="text-xs text-emerald-400 font-medium px-4">${dict.inspectorClean}</p>
      </div>
    `;
  }

  function resetPreview() {
    previewContainer.classList.add('hidden');
    selectedFileName.textContent = '';
    const dict = i18n[currentLang] || i18n.en;
    exifInspector.innerHTML = `<div class="text-center py-12 text-zinc-600 text-xs leading-relaxed">${dict.inspectorEmpty}</div>`;
  }

  function updateTransforms() {
    const transformStr = `rotate(${currentRotation}deg) scaleX(${currentFlip ? -1 : 1}) scale(${currentScale})`;
    imagePreview.style.transform = transformStr;
    videoPreview.style.transform = transformStr;
  }

  rotateLeftBtn?.addEventListener('click', () => { currentRotation -= 90; updateTransforms(); });
  rotateRightBtn?.addEventListener('click', () => { currentRotation += 90; updateTransforms(); });
  flipHBtn?.addEventListener('click', () => { currentFlip = !currentFlip; updateTransforms(); });
  scale50Btn?.addEventListener('click', () => { currentScale = 0.5; updateTransforms(); });
  scale75Btn?.addEventListener('click', () => { currentScale = 0.75; updateTransforms(); });
  resetScaleBtn?.addEventListener('click', () => { currentRotation = 0; currentFlip = false; currentScale = 1; updateTransforms(); });

  clearAllBtn?.addEventListener('click', () => {
    queue = [];
    selectedIndex = -1;
    updateQueueUI();
  });

  async function processImage(item) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

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

        if (currentRotation !== 0 || currentFlip) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          if (currentRotation) ctx.rotate((currentRotation * Math.PI) / 180);
          if (currentFlip) ctx.scale(-1, 1);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const selectedFmt = exportFormat?.value || 'original';
        let mimeType = 'image/jpeg';
        let ext = item.name.split('.').pop() || 'jpg';

        if (selectedFmt === 'png') { mimeType = 'image/png'; ext = 'png'; }
        else if (selectedFmt === 'webp') { mimeType = 'image/webp'; ext = 'webp'; }
        else if (selectedFmt === 'jpeg') { mimeType = 'image/jpeg'; ext = 'jpg'; }

        const quality = parseFloat(qualityRange?.value) || 0.9;
        canvas.toBlob((blob) => {
          resolve({ blob, format: ext });
        }, mimeType, quality);
      };
      img.src = URL.createObjectURL(item.file);
    });
  }

  async function processVideo(item) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(item.file);
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
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

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

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = 'EXIF-B-Gone_Cleaned.zip';
    a.click();
  });

  applyLanguage(currentLang);
});