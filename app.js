if (typeof nw !== 'undefined') {
  try {
    const win = nw.Window.get();
    win.setIcon('icon.ico');
  } catch(e) {}
}

let queue = [];
let selectedIndex = null;
const CURRENT_VERSION = "1.1.0";
const GITHUB_REPO = "TNFX1/EXIF-B-Gone";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xrenyqgg";

const i18n = {
  tr: {
    subtitle: "Gizlilik ve EXIF Temizleme Asistanı",
    btnFeedback: "Geri Bildirim",
    dragTitle: "Fotoğraflarınızı buraya sürükleyin veya seçin",
    dragSub: "JPG, PNG ve WebP dosyaları doğrudan yerel bellekte işlenir.",
    queueTitle: "İşlem Kuyruğu",
    btnClear: "Temizle",
    emptyState: "Henüz fotoğraf eklenmedi.",
    btnProcess: "Temizle & İndir",
    btnZip: "ZIP İndir",
    inspectorTitle: "Gizlilik Detayları",
    inspectorEmpty: "Listeden bir fotoğrafa tıklayarak saklı verileri görüntüleyebilirsiniz.",
    settingsTitle: "Ayarlar",
    langLabel: "Uygulama Dili",
    updateLabel: "Güncelleme Durumu",
    btnCheckUpdate: "Güncellemeleri Kontrol Et",
    feedbackTitle: "Geri Bildirim Gönder",
    feedbackSub: "İstek, öneri veya karşılaştığınız hataları bize iletebilirsiniz.",
    btnSendFeedback: "Gönder",
    outFormat: "Çıktı Formatı",
    resizeMax: "Max Genişlik (px)",
    qualityLabel: "Kalite (%)"
  },
  en: {
    subtitle: "Privacy & EXIF Metadata Scrubber",
    btnFeedback: "Feedback",
    dragTitle: "Drag & drop photos here or click to browse",
    dragSub: "JPG, PNG, and WebP processed strictly in local RAM.",
    queueTitle: "Processing Queue",
    btnClear: "Clear",
    emptyState: "No photos added yet.",
    btnProcess: "Clean & Download",
    btnZip: "Download ZIP",
    inspectorTitle: "Privacy Inspector",
    inspectorEmpty: "Click a photo from the queue to view embedded metadata.",
    settingsTitle: "Settings",
    langLabel: "App Language",
    updateLabel: "Update Status",
    btnCheckUpdate: "Check for Updates",
    feedbackTitle: "Send Feedback",
    feedbackSub: "Share your ideas, suggestions, or bug reports with us.",
    btnSendFeedback: "Submit",
    outFormat: "Export Format",
    resizeMax: "Max Width (px)",
    qualityLabel: "Quality (%)"
  }
};

let currentLang = localStorage.getItem('appLang');

const welcomeModal = document.getElementById('welcomeLangModal');
if (!currentLang) {
  welcomeModal.classList.remove('hidden');
} else {
  setLanguage(currentLang);
}

document.getElementById('selectTrBtn').addEventListener('click', () => {
  setLanguage('tr');
  welcomeModal.classList.add('hidden');
});

document.getElementById('selectEnBtn').addEventListener('click', () => {
  setLanguage('en');
  welcomeModal.classList.add('hidden');
});

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });
  document.getElementById('langSelect').value = lang;
}

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

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
  dropzone.classList.add('border-rose-500');
});

dropzone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('border-rose-500');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('border-rose-500');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFiles(Array.from(e.dataTransfer.files));
  }
});

async function handleFiles(files) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const newFiles = files.filter(f => validTypes.includes(f.type));
  
  for (const file of newFiles) {
    let exifData = null;
    try {
      exifData = await exifr.parse(file);
    } catch (err) {}
    
    queue.push({
      file: file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      exif: exifData
    });
  }
  
  updateUI();
  if (queue.length > 0 && selectedIndex === null) {
    selectFile(0);
  }
}

function updateUI() {
  const fileList = document.getElementById('fileList');
  const emptyState = document.getElementById('emptyState');
  const fileCount = document.getElementById('fileCount');
  const processBtn = document.getElementById('processBtn');
  const zipBtn = document.getElementById('zipBtn');

  fileCount.textContent = queue.length;

  if (queue.length === 0) {
    emptyState.classList.remove('hidden');
    fileList.innerHTML = '';
    fileList.appendChild(emptyState);
    processBtn.disabled = true;
    zipBtn.disabled = true;
    processBtn.className = "flex-1 py-3.5 px-5 rounded-2xl font-semibold text-sm bg-slate-900 text-slate-600 cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-slate-800";
    zipBtn.className = "py-3.5 px-5 rounded-2xl font-semibold text-sm bg-slate-900 text-slate-600 cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-slate-800";
    resetInspector();
    return;
  }

  emptyState.classList.add('hidden');
  fileList.innerHTML = '';

  processBtn.disabled = false;
  zipBtn.disabled = false;
  processBtn.className = "flex-1 py-3.5 px-5 rounded-2xl font-semibold text-sm bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20";
  zipBtn.className = "py-3.5 px-5 rounded-2xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-all flex items-center justify-center gap-2 border border-slate-700";

  queue.forEach((item, index) => {
    const div = document.createElement('div');
    const isSelected = selectedIndex === index;
    div.className = `p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${isSelected ? 'bg-slate-800/80 border-rose-500/50' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`;
    
    div.innerHTML = `
      <div class="flex items-center gap-3 truncate">
        <i class="fa-regular fa-image text-slate-400"></i>
        <div class="truncate">
          <p class="text-xs font-semibold text-slate-200 truncate">${item.name}</p>
          <p class="text-[10px] text-slate-500">${item.size}</p>
        </div>
      </div>
      <button class="remove-btn p-1.5 text-slate-500 hover:text-rose-400 transition-colors" data-index="${index}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    div.addEventListener('click', (e) => {
      if (!e.target.closest('.remove-btn')) {
        selectFile(index);
      }
    });

    div.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromQueue(index);
    });

    fileList.appendChild(div);
  });
}

function selectFile(index) {
  if (index < 0 || index >= queue.length) return;
  selectedIndex = index;
  const item = queue[index];

  document.getElementById('selectedFileName').textContent = item.name;
  
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('imagePreview');
  previewImg.src = URL.createObjectURL(item.file);
  previewContainer.classList.remove('hidden');

  const exifInspector = document.getElementById('exifInspector');
  if (!item.exif || Object.keys(item.exif).length === 0) {
    exifInspector.innerHTML = `<div class="text-center py-8 text-slate-500 text-xs">${currentLang === 'tr' ? 'Bu fotoğrafta gizli EXIF verisi bulunamadı.' : 'No EXIF metadata found in this image.'}</div>`;
  } else {
    let html = '<div class="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scroll pr-1">';
    for (const [key, val] of Object.entries(item.exif)) {
      if (typeof val !== 'object' && val !== undefined) {
        html += `
          <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/40">
            <span class="text-slate-400 font-medium">${key}</span>
            <span class="text-slate-200 font-mono text-[11px] truncate max-w-[150px]">${val}</span>
          </div>
        `;
      }
    }
    html += '</div>';
    exifInspector.innerHTML = html;
  }

  updateUI();
}

function removeFromQueue(index) {
  queue.splice(index, 1);
  if (selectedIndex === index) {
    selectedIndex = queue.length > 0 ? 0 : null;
  } else if (selectedIndex > index) {
    selectedIndex--;
  }
  updateUI();
  if (selectedIndex !== null) selectFile(selectedIndex);
}

document.getElementById('clearAllBtn').addEventListener('click', () => {
  queue = [];
  selectedIndex = null;
  updateUI();
});

function resetInspector() {
  document.getElementById('selectedFileName').textContent = currentLang === 'tr' ? 'Dosya seçilmedi' : 'No file selected';
  document.getElementById('imagePreviewContainer').classList.add('hidden');
  document.getElementById('exifInspector').innerHTML = `<div class="text-center py-8 text-slate-600 text-xs leading-relaxed" data-i18n="inspectorEmpty">${i18n[currentLang].inspectorEmpty}</div>`;
}

async function processImage(item) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const maxWidth = parseInt(document.getElementById('maxWidthInput').value);
      if (maxWidth && width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const exportFormatSelect = document.getElementById('exportFormat').value;
      const targetFormat = exportFormatSelect === 'original' ? item.file.type : exportFormatSelect;
      const quality = parseFloat(document.getElementById('qualityRange').value);

      canvas.toBlob((blob) => {
        resolve({ blob, name: item.name, type: targetFormat });
      }, targetFormat, quality);
    };
    img.src = URL.createObjectURL(item.file);
  });
}

document.getElementById('processBtn').addEventListener('click', async () => {
  if (queue.length === 0) return;
  for (const item of queue) {
    const processed = await processImage(item);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(processed.blob);
    a.download = `cleaned_${processed.name}`;
    a.click();
  }
});

document.getElementById('zipBtn').addEventListener('click', async () => {
  if (queue.length === 0) return;
  const zip = new JSZip();
  for (const item of queue) {
    const processed = await processImage(item);
    zip.file(`cleaned_${processed.name}`, processed.blob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'EXIF_Cleaned_Photos.zip';
  a.click();
});

const settingsModal = document.getElementById('settingsModal');
const feedbackModal = document.getElementById('feedbackModal');

document.getElementById('openSettingsBtn').addEventListener('click', () => settingsModal.classList.remove('hidden'));
document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsModal.classList.add('hidden'));

document.getElementById('openFeedbackBtn').addEventListener('click', () => feedbackModal.classList.remove('hidden'));
document.getElementById('closeFeedbackBtn').addEventListener('click', () => feedbackModal.classList.add('hidden'));

document.getElementById('langSelect').addEventListener('change', (e) => setLanguage(e.target.value));

document.getElementById('checkUpdateBtn').addEventListener('click', async () => {
  const statusText = document.getElementById('updateStatusText');
  statusText.classList.remove('hidden');
  statusText.textContent = currentLang === 'tr' ? "Kontrol ediliyor..." : "Checking for updates...";

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    const data = await response.json();
    const latestVersion = data.tag_name.replace('v', '');

    if (latestVersion !== CURRENT_VERSION) {
      statusText.innerHTML = currentLang === 'tr' 
        ? `<span class="text-emerald-400 font-semibold">Yeni sürüm mevcut (${data.tag_name})!</span> <a href="${data.html_url}" target="_blank" class="underline text-rose-400">İndir</a>`
        : `<span class="text-emerald-400 font-semibold">New version available (${data.tag_name})!</span> <a href="${data.html_url}" target="_blank" class="underline text-rose-400">Download</a>`;
    } else {
      statusText.textContent = currentLang === 'tr' ? "Uygulamanız güncel!" : "App is up to date!";
    }
  } catch (err) {
    statusText.textContent = currentLang === 'tr' ? "Güncelleme kontrolü başarısız oldu." : "Failed to check for updates.";
  }
});

document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('feedbackEmail').value;
  const message = document.getElementById('feedbackMessage').value;
  const sendBtn = document.getElementById('sendFeedbackBtn');

  sendBtn.disabled = true;
  sendBtn.textContent = currentLang === 'tr' ? 'Gönderiliyor...' : 'Sending...';

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email || 'Unspecified', message: message })
    });

    if (response.ok) {
      alert(currentLang === 'tr' ? 'Geri bildiriminiz başarıyla iletildi!' : 'Feedback sent successfully!');
      document.getElementById('feedbackForm').reset();
      feedbackModal.classList.add('hidden');
    } else {
      alert(currentLang === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.');
    }
  } catch (error) {
    alert(currentLang === 'tr' ? 'Bağlantı hatası.' : 'Connection error.');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = i18n[currentLang].btnSendFeedback;
  }
});