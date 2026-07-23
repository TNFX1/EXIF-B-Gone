// NW.js Görev Çubuğu İkonunu Zorlama
if (typeof nw !== 'undefined') {
  try {
    nw.Window.get().setIcon('icon.ico');
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

// İlk Açılış Kontrolü
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

// Modal Kontrolleri
const settingsModal = document.getElementById('settingsModal');
const feedbackModal = document.getElementById('feedbackModal');

document.getElementById('openSettingsBtn').addEventListener('click', () => settingsModal.classList.remove('hidden'));
document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsModal.classList.add('hidden'));

document.getElementById('openFeedbackBtn').addEventListener('click', () => feedbackModal.classList.remove('hidden'));
document.getElementById('closeFeedbackBtn').addEventListener('click', () => feedbackModal.classList.add('hidden'));

document.getElementById('langSelect').addEventListener('change', (e) => setLanguage(e.target.value));

// Otomatik Güncelleme
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

// Feedback Formu
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