// DOM Element Seçimleri
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const appContent = document.getElementById('app-content');
const fileCount = document.getElementById('file-count');
const cleanAllBtn = document.getElementById('clean-all-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const exifContainer = document.getElementById('exif-container');
const inspectFilename = document.getElementById('inspect-filename');

let filesData = []; 
let selectedFileId = null;

// Sürükle & Bırak Olayları
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-cyan-500', 'bg-slate-900/80');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-cyan-500', 'bg-slate-900/80');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-cyan-500', 'bg-slate-900/80');
    if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processFiles(e.target.files);
    }
});

// Gerçek EXIF Verisi Var mı Kontrolü (Genişlik/Yükseklik dışındaki hassas veriler)
function hasRealExif(exifObj) {
    if (!exifObj) return false;
    
    // Sadece resim boyutları (ImageWidth vb.) EXIF var sayılmamalı
    const ignoreKeys = ['ImageWidth', 'ImageHeight', 'ColorSpace', 'ExifImageWidth', 'ExifImageHeight'];
    const keys = Object.keys(exifObj).filter(k => !ignoreKeys.includes(k));
    
    return keys.length > 0;
}

// Dosyaları İşleme ve EXIF Okuma
async function processFiles(uploadedFiles) {
    for (let file of uploadedFiles) {
        if (!file.type.startsWith('image/')) continue;

        const id = Date.now() + Math.random().toString(36).substring(2, 9);
        const previewUrl = URL.createObjectURL(file);
        
        let parsedExif = null;
        try {
            // Sadece TIFF/EXIF taglerini detaylı tara
            parsedExif = await exifr.parse(file, {
                tiff: true,
                exif: true,
                gps: true,
                iptc: true,
                xmp: true
            });
        } catch (err) {
            console.error("EXIF okuma hatası:", err);
        }

        filesData.push({
            id,
            file,
            previewUrl,
            exif: parsedExif
        });
    }

    if (filesData.length > 0) {
        appContent.classList.remove('hidden');
        if (!selectedFileId && filesData.length > 0) {
            selectFileForInspect(filesData[0].id);
        }
    }

    renderFileList();
}

// Dosya Listesini Ekrana Çizme
function renderFileList() {
    fileList.innerHTML = '';
    fileCount.textContent = filesData.length;

    filesData.forEach((item) => {
        const isRealExifPresent = hasRealExif(item.exif);
        const isSelected = item.id === selectedFileId;

        const card = document.createElement('div');
        card.className = `flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
            isSelected 
                ? 'bg-slate-800 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30' 
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`;
        
        card.onclick = () => selectFileForInspect(item.id);

        card.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <img src="${item.previewUrl}" class="w-12 h-12 object-cover rounded-lg border border-slate-700">
                <div class="overflow-hidden">
                    <p class="text-xs font-semibold text-slate-200 truncate">${item.file.name}</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">${(item.file.size / 1024).toFixed(1)} KB</p>
                    <span class="inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        isRealExifPresent ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }">
                        ${isRealExifPresent ? 'Hassas EXIF Bulundu' : 'Temiz / EXIF Yok'}
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="event.stopPropagation(); cleanAndDownloadSingle('${item.id}')" title="Temizle ve İndir" class="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors">
                    <i class="fa-solid fa-download text-xs"></i>
                </button>
                <button onclick="event.stopPropagation(); removeFile('${item.id}')" title="Sil" class="p-2 rounded-lg bg-slate-800 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;

        fileList.appendChild(card);
    });
}

// EXIF İnceleme Paneli Güncelleme
function selectFileForInspect(id) {
    selectedFileId = id;
    renderFileList();

    const target = filesData.find(f => f.id === id);
    if (!target) return;

    inspectFilename.textContent = target.file.name;
    exifContainer.innerHTML = '';

    if (!hasRealExif(target.exif)) {
        exifContainer.innerHTML = `
            <div class="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                <i class="fa-solid fa-shield-check text-emerald-400 text-3xl mb-2"></i>
                <p class="font-semibold text-slate-200">Tamamen Temiz Fotoğraf</p>
                <p class="text-[11px] mt-1 text-slate-400">Bu fotoğrafta gizlilik riski oluşturabilecek hiçbir cihaz, konum veya çekim verisi yok.</p>
            </div>
        `;
        return;
    }

    const list = document.createElement('div');
    list.className = 'space-y-1.5 max-h-[350px] overflow-y-auto pr-1';

    const importantKeys = ['Make', 'Model', 'DateTimeOriginal', 'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'latitude', 'longitude'];

    Object.entries(target.exif).forEach(([key, val]) => {
        if (typeof val === 'object' && val !== null && !(val instanceof Date)) return;

        const isHighlight = importantKeys.includes(key);
        const row = document.createElement('div');
        row.className = `flex justify-between p-2 rounded-lg border text-[11px] ${
            isHighlight ? 'bg-slate-800/80 border-cyan-500/30' : 'bg-slate-900/40 border-slate-800/60'
        }`;

        row.innerHTML = `
            <span class="font-medium text-slate-400 truncate max-w-[120px]">${key}</span>
            <span class="text-slate-200 font-mono truncate max-w-[150px] text-right">${val}</span>
        `;
        list.appendChild(row);
    });

    exifContainer.appendChild(list);
}

// Kesin EXIF Temizleme ve PNG/JPEG Format İndirme
function cleanAndDownloadSingle(id) {
    const item = filesData.find(f => f.id === id);
    if (!item) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = item.previewUrl;
    
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        // Pikselleri ham şekilde canvas'a çiz (Tüm başlık verileri elenir)
        ctx.drawImage(img, 0, 0);

        // JPEG/PNG formatında ham veri üret
        const mimeType = item.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const cleanDataUrl = canvas.toDataURL(mimeType, 0.95);
        
        const a = document.createElement('a');
        a.href = cleanDataUrl;
        a.download = `clean_${item.file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

// Toplu Temizleme
cleanAllBtn.addEventListener('click', () => {
    filesData.forEach(item => cleanAndDownloadSingle(item.id));
});

// Dosya Silme
window.removeFile = function(id) {
    filesData = filesData.filter(f => f.id !== id);
    if (selectedFileId === id) {
        selectedFileId = filesData.length > 0 ? filesData[0].id : null;
    }
    if (filesData.length === 0) {
        appContent.classList.add('hidden');
    } else {
        if (selectedFileId) selectFileForInspect(selectedFileId);
    }
    renderFileList();
};

clearAllBtn.addEventListener('click', () => {
    filesData = [];
    selectedFileId = null;
    appContent.classList.add('hidden');
    renderFileList();
});