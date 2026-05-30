const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('g:/myProject/shorturl/next-shorturl/src/app/manage/biolink/page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// ================= Copywriting Replacements =================
const copyReplacements = {
  // Drag overlay & Link item
  "Akhiri Koleksi": "Selesai Grup Link",
  "Tarik tautan ke sini atau tambah baru": "Masukin link ke sini",
  "Lepaskan tautan di sini": "Lepas link di sini",
  
  // Modals & Forms
  "Kalibrasi Gambar": "Atur Posisi Gambar",
  "Konfigurasi parameter visual.": "Geser dan zoom gambar biar pas.",
  "Pembesaran": "Zoom",
  "Isometrik": "Kotak",
  "Sinematik": "Lebar",
  "Tolak": "Batal",
  "Kirim Uplink": "Pakai Gambar",
  "Terminal Diam": "Belum ada isi",
  "Transmisi Nol": "Kamu belum bikin link",
  
  // Profile Tab
  "Identity Panel": "Profil Kamu",
  "Synthesize your digital presence.": "Atur info dasar dan siapa diri kamu.",
  "Visual Identifier": "Foto Profil",
  "Update Spec": "Upload Foto",
  "Informasi Profil": "Info Dasar",
  "Social Uplink": "Tautan Sosial Media",
  "Simpan Perubahan": "Simpan Profil",
  "Menyinkronkan...": "Menyimpan...",
  
  // Design Tab
  "Manifestasi Visual": "Desain Tampilan",
  "Sintesis protokol estetika Anda.": "Pilih warna, gaya tombol, dan jenis font yang cocok denganmu.",
  "Tema Utama": "Pilih Tema",
  "Gradien Atmosfer": "Warna Background",
  "Warna Awal": "Warna Atas",
  "Warna Akhir": "Warna Bawah",
  "Mode Warna Teks": "Warna Teks Otomatis",
  "Terang": "Teks Gelap",
  "Gelap": "Teks Terang",
  "Protokol Diterapkan": "Tema Diterapkan",
  "Suntikkan Spektrum Kustom": "Terapkan Warna",
  "Penggantian Alternatif": "Pilihan Background Lain",
  "Jenis Atmosfer": "Tipe Latar Belakang",
  "Batalkan": "Batal",
  "Default \\(Sinkronisasi Protokol\\)": "Pakai Tema Default",
  "Monokrom Solid": "Satu Warna Aja",
  "Media Imersif \\(URL/GIF\\)": "Pakai Gambar / GIF",
  "Warna Solid": "Pilih Warna Solid",
  "Titik Akhir Media \\(GIF/JPG\\)": "URL Gambar Latar Belakang",
  "Arsitektur Antarmuka Node": "Gaya Tombol",
  "Geometri": "Bentuk Tombol",
  "Reset Universal": "Reset Gaya",
  "Organik": "Bulat Penuh",
  "Lembut": "Sedikit Bulat",
  "Premium": "Sedang",
  "Metodologi Permukaan": "Isi Tombol",
  "Padat": "Penuh",
  "Hantu": "Garis Tepi (Outline)",
  "Aura": "Tanpa Warna Belakang (Tembus)",
  "Warna Permukaan": "Warna Background Tombol",
  "Warna Konten": "Warna Teks Tombol",
  "Standar Tipografi": "Pilih Font Teks",
  "Sans Standar": "Font Standar (Sans)",
  "Serif Elite": "Klasik (Serif)",
  "Mono Antarmuka": "Akar (Mono)",
  "Bulat Lembut": "Membulat (Rounded)",
  "Simetri Tebal": "Poppins",
  "Pesan Kuat": "Tebal (Impact)",
  "Simpan Tampilan": "Simpan Desain",
  
  // Validation / Others
  "Mengerti": "Oke",
  "Keluar Grup": "Keluarkan dari Grup",
  "Tautan Sosial": "Tautan Sosial Media",
  "Tampilan": "Desain Tampilan",
  "Informasi Lengkap": "Data Diri",
  "bg-\\[\\#111113\\]": "bg-white dark:bg-[#111113]",
  "bg-\\[\\#18181b\\]": "bg-slate-50 dark:bg-[#18181b]",
  "bg-\\[\\#1e1e24\\]": "bg-slate-100 dark:bg-[#1e1e24]",
  "bg-\\[\\#141417\\]": "bg-slate-50 dark:bg-[#141417]",
  "bg-\\[\\#0f0f0f\\]": "bg-slate-50 dark:bg-[#0f0f0f]",
  "border-white\/5": "border-slate-200 dark:border-white/5",
  "border-white\/10": "border-slate-200 dark:border-white/10",
  "bg-black\/50": "bg-slate-100 dark:bg-black/50",
  "bg-black\/20": "bg-slate-50 dark:bg-black/20",
  "bg-black\/40": "bg-slate-100 dark:bg-black/40",
  "bg-black\/60": "bg-slate-900/40 dark:bg-black/60",
  "text-zinc-500": "text-slate-500 dark:text-zinc-500",
  "text-zinc-400": "text-slate-500 dark:text-zinc-400",
  "text-zinc-300": "text-slate-600 dark:text-zinc-300",
  "hover:bg-white\/5": "hover:bg-slate-100 dark:hover:bg-white/5",
  "hover:bg-white\/10": "hover:bg-slate-200 dark:hover:bg-white/10",
  "border-zinc-700": "border-slate-300 dark:border-zinc-700",
  "bg-zinc-800\/50": "bg-slate-100 dark:bg-zinc-800/50",
  "hover:bg-zinc-700": "hover:bg-slate-300 dark:hover:bg-zinc-700"
};

for (const [key, val] of Object.entries(copyReplacements)) {
  content = content.replace(new RegExp(key, 'g'), val);
}

// Special case for text-white to avoid breaking existing responsive text like dark:text-white
content = content.replace(/(?<!\w)text-white/g, 'text-slate-900 dark:text-white');

// Write it back
fs.writeFileSync(targetFile, content, 'utf8');
console.log('Transformation complete!');
