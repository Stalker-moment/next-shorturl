const fs = require('fs');
const path = require('path');

const directories = [
  'g:/myProject/shorturl/next-shorturl/src/app/manage/qrcodes',
  'g:/myProject/shorturl/next-shorturl/src/app/manage/qrcodes/[id]'
];

const copyReplacements = {
  // Common
  "Exit Studio": "Tutup Editor",
  "Publish Design": "Simpan Desain",
  "Syncing...": "Menyimpan...",
  "QR Code Studio": "Editor QR Code",
  "Asset Intelligence Layer": "Atur Tampilan QR Kamu",
  "Manajemen Aset QR": "Manajemen QR Code",
  "Architect intelligent physical triggers for your digital experiences.": "Buat QR Code unik untuk membagikan tautan atau info secara fisik.",
  "Generate New Asset": "Buat QR Code Baru",
  "Memuat QR Studio": "Memuat Editor QR...",
  "Belum ada QR Code": "Belum ada QR Code",
  "Ubah tautan fisik Anda menjadi digital dengan QR Code kustom.": "Yuk buat QR Code pertamamu untuk membagikan info dengan mudah.",
  "Mulai Buat": "Mulai Buat",
  "Total Scans": "Total Scan",
  "Direct Data Node": "Data Statis",
  "Studio": "Edit",
  "Intel": "Statistik",
  "Export": "Simpan",
  "Scrap Protocol\\?": "Hapus QR Code?",
  "Tindakan ini bersifat ": "Tindakan ini bersifat ",
  "permanen": "permanen",
  "\\. Seluruh data analitik akan terhapus selamanya\\.": ". Data statistik juga bakal kehapus selamanya.",
  "Destroy Data": "Ya, Hapus",
  "Abeyance": "Batal",

  // Editor Tabs
  "Payload": "Isi Data",
  "Nodes": "Template",
  "Geometry": "Bentuk",
  "Branding": "Warna & Logo",
  "Protocol": "Sematkan",
  "Studio Protocol": "Atur QR Code",
  "Architect primary asset visuality": "Buat tampilan QR Code kamu jadi lebih menarik",

  // Payload Tab
  "Campaign Node Identity": "Nama QR Code",
  "Archive Label": "Contoh: QR Code Promo IG",
  "Node Configuration": "Pengaturan QR",
  "DATASTREAM": "DATA",
  "Destination Target": "Tautan Tujuan",
  "Access SSID": "Nama WiFi (SSID)",
  "Keyphrase": "Kata Sandi WiFi",
  "Security Protocol": "Tipe Keamanan WiFi",
  "WPA/WPA2 Professional": "WPA/WPA2 (Biasa Digunakan)",
  "WEP (Legacy)": "WEP (Jadul)",
  "Open Node": "Tanpa Kata Sandi",
  "Open \/ No Identity": "Tanpa Kata Sandi",
  "Handset Identifier": "Nomor WhatsApp",
  "e\\.g\\. 628\\.\\.\\.": "Contoh: 62812...",
  "Initial Payload": "Pesan Awal",
  "Transmission content\\.\\.\\.": "Contoh: Halo, saya mau tanya pesan...",
  "Recipient Node": "Nomor Tujuan SMS",
  "SMS Buffer": "Isi Pesan SMS",
  "Dialer Protocol": "Nomor Telepon",
  "Raw String Data": "Teks Biasa",
  "SMTP Address": "Alamat Email",
  "Subject Line": "Subjek Email",
  "Mail Body": "Isi Email",
  "Internal Payload Pointer": "Isi Data Sesungguhnya",

  // Shape Tab
  "Main Body Geometry": "Bentuk Pola QR",
  "Aperture Frame Design": "Bentuk Bingkai Sudut",
  "Core Chromatic": "Warna Pola QR",
  "Base Canvas": "Warna Latar",
  "Legacy \/ Branding Inlay": "Tambahkan Logo",
  "High fidelity SVG rendering supported": "Bisa pakai format file SVG atau PNG",
  "Discard Inlay": "Hapus Logo",
  "Manifest": "Unggah Logo",

  // Export Tab
  "Endpoint": "Kode Semat",

  // Embed Tab
  "Node Scale": "Ukuran QR",
  "Isolation Pad": "Jarak Tepi (Padding)",
  "Canvas Mode": "Mode Latar Belakang",
  "Alpha Transpose": "Transparan",
  "Solid Opaque": "Solid",
  "Boundary Radius": "Lengkungan Sudut",
  "Protocol attributes are locked into the dynamic URL builder for instant redistribution\\.": "Pengaturan sematan akan tersimpan dan langsung update.",
  "Real\\-time Buffer": "Pratinjau Langsung",
  
  // Create Modal
  "Craft New Node": "Buat QR Code Baru",
  "Note: WiFi, SMS, and Text are provisioned as ": "Catatan: Tipe WiFi, SMS, dan Teks akan dibuat sebagai ",
  "Static Nodes": "QR Statis",
  "\\. Data is stored directly on the medium and remains scanning\\-ready without a network\\.": ". Datanya disimpan langsung di QR, jadi nggak butuh internet buat scan.",
  "Archive Identity": "Nama QR Code",
  "e\\.g\\. Genesis Asset \/ Branch Promo": "Contoh: QR Promo Tahun Baru",
  "Generate Protocol Asset": "Ayo Buat QR Code",
  "Commit Manifest Changes": "Simpan Perubahan QR Code",

  // Sharing Modal
  "Direct Provision": "Tujuan Langsung",
  "Local Export": "Unduh Gambar",
  "Embed Node": "Sematkan di Web",
  "Optimize WebP": "Format WebP",
  "Capture Deployment Code": "Salin Kode Sematan",
  "Endpoint architecture is ": "Kode sematan dibuat secara ",
  "auto\\-synchronizing": "otomatis",
  "\\. Deployment occurs upon dashboard commit\\.": ". Setiap ada perubahan desain, sematan akan otomatis update tanpa perlu salin kode baru.",
  "Transmission Snippet": "Kode Sematan (Iframe)",
  "Live Iframe Snippet": "Kode Sematan langsung",
  "Copy Snippet": "Salin Kode"
};

for (const dir of directories) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.tsx')) {
      const targetFile = path.join(dir, file);
      let content = fs.readFileSync(targetFile, 'utf8');

      for (const [key, val] of Object.entries(copyReplacements)) {
        content = content.replace(new RegExp(key, 'g'), val);
      }
      
      // Update basic light/dark styling globally
      // `bg-white dark:bg-black/40` should be fine. But be careful.
      // Let's ensure text isn't invisible in light mode on `manage/qrcodes/page.tsx`
      if (file === 'page.tsx' && dir.includes('[id]')) {
        // Just some specific styling fixes that might be needed
      }

      fs.writeFileSync(targetFile, content, 'utf8');
    }
  }
}

console.log('QRCodes page transformation complete!');
