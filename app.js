let queue = [];
let selectedIndex = null;

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const emptyState = document.getElementById('emptyState');
const processBtn = document.getElementById('processBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const exifInspector = document.getElementById('exifInspector');
const selectedFileName = document.getElementById('selectedFileName');

// Tıklama ile Dosya Seçimi
dropzone.addEventListener('click', () => fileInput.click());

// Sürükle - Bırak Olayları
['dragenter', 'dragover'].forEach(event => {
  dropzone.addEventListener(event, (e) => {
    e.preventDefault();
    dropzone.classList.add('border-cyan-400', 'bg-cyan-500/5');
  });
});

['dragleave', 'drop'].forEach(event => {
  dropzone.addEventListener(event, (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-cyan-400', 'bg-cyan-500/5');
  });
});

dropzone.addEventListener('drop', (e) => {
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

async function handleFiles(files) {
  for (let file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue;

    const metadata = await exifr.parse(file, {
      gps: true,
      exif: true,
      tiff: true,
      jfif: true,
      iptc: true,
      xmp: true
    }) || {};

    const sensitiveData = filterSensitiveMetadata(metadata);

    queue.push({
      file,
      metadata: sensitiveData,
      isCleaned: Object.keys(sensitiveData).length === 0
    });
  }
  updateUI();
}

// Sadece Gerçek Hassas / Gizlilik İçeren EXIF Verilerini Filtrele
function filterSensitiveMetadata(meta) {
  const sensitiveKeys = [
    // Cihaz ve Yazılım
    'Make', 'Model', 'Software', 'HostComputer', 'ProcessingSoftware',
    // Tarih ve Zaman
    'DateTimeOriginal', 'CreateDate', 'ModifyDate', 'OffsetTimeOriginal',
    // Konum Bilgileri (GPS)
    'latitude', 'longitude', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSSpeed',
    // Kişisel / Telif Bilgileri
    'Artist', 'Copyright', 'OwnerName', 'CameraOwnerName', 'SerialNumber', 'BodySerialNumber', 'LensModel', 'LensSerialNumber',
    // Teknik Çekim Parametreleri
    'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'Flash', 'ExposureMode'
  ];

  let filtered = {};
  for (let key in meta) {
    if (sensitiveKeys.includes(key) || key.toLowerCase().includes('gps') || key.toLowerCase().includes('date')) {
      filtered[key] = meta[key];
    }
  }
  return filtered;
}

function updateUI() {
  fileCount.textContent = queue.length;
  fileList.innerHTML = '';

  if (queue.length === 0) {
    emptyState.classList.remove('hidden');
    processBtn.disabled = true;
    processBtn.className = "w-full mt-2 py-3.5 px-5 rounded-2xl font-semibold text-sm bg-slate-800 text-slate-500 cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg";
    exifInspector.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-xs leading-relaxed">
        <i class="fa-regular fa-hand-pointer text-2xl text-slate-600 mb-3 block"></i>
        Soldaki listeden bir fotoğrafa tıklayarak içerisindeki gizli verileri (Konum, Tarih, Cihaz) inceleyebilirsiniz.
      </div>
    `;
    selectedFileName.textContent = 'Dosya seçilmedi';
    return;
  }

  emptyState.classList.add('hidden');
  processBtn.disabled = false;
  processBtn.className = "w-full mt-2 py-3.5 px-5 rounded-2xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg";

  queue.forEach((item, index) => {
    const hasSensitiveData = Object.keys(item.metadata).length > 0;
    
    const card = document.createElement('div');
    card.className = `p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
      selectedIndex === index ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    }`;

    card.innerHTML = `
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 flex-shrink-0">
          <i class="fa-regular fa-image text-base"></i>
        </div>
        <div class="truncate">
          <p class="text-xs font-semibold text-slate-200 truncate">${item.file.name}</p>
          <p class="text-[10px] text-slate-400">${(item.file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          hasSensitiveData ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }">
          ${hasSensitiveData ? 'EXIF Bulundu' : 'Temiz / Güvenli'}
        </span>
        <button onclick="removeItem(event, ${index})" class="text-slate-500 hover:text-rose-400 p-1 text-xs transition-colors">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;

    card.addEventListener('click', () => {
      selectedIndex = index;
      updateUI();
      inspectMetadata(item);
    });

    fileList.appendChild(card);
  });
}

function inspectMetadata(item) {
  selectedFileName.textContent = item.file.name;
  const keys = Object.keys(item.metadata);

  if (keys.length === 0) {
    exifInspector.innerHTML = `
      <div class="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center my-2">
        <i class="fa-solid fa-shield-check text-2xl text-emerald-400 mb-2"></i>
        <p class="text-xs font-semibold text-emerald-300">Hassas Veri Bulunmadı!</p>
        <p class="text-[11px] text-slate-400 mt-1">Bu fotoğrafta GPS konumu, cihaz seri numarası veya çekim tarihi gibi gizli veriler bulunmuyor.</p>
      </div>
    `;
    return;
  }

  let html = `<div class="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scroll pr-1">`;
  for (let key in item.metadata) {
    html += `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
        <span class="text-slate-400 font-medium">${key}</span>
        <span class="text-cyan-300 font-mono text-[11px] truncate max-w-[160px]">${item.metadata[key]}</span>
      </div>
    `;
  }
  html += `</div>`;
  exifInspector.innerHTML = html;
}

function removeItem(e, index) {
  e.stopPropagation();
  queue.splice(index, 1);
  if (selectedIndex === index) selectedIndex = null;
  updateUI();
}

clearAllBtn.addEventListener('click', () => {
  queue = [];
  selectedIndex = null;
  updateUI();
});

// Canvas Üzerinden Yeniden Çizerek Sıfır EXIF Dosya İndirme
processBtn.addEventListener('click', () => {
  queue.forEach(item => {
    const img = new Image();
    img.src = URL.createObjectURL(item.file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `clean_${item.file.name}`;
        link.click();
      }, item.file.type);
    };
  });
});