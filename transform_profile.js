const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('g:/myProject/shorturl/next-shorturl/src/app/manage/profile/page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const copyReplacements = {
  "Aset Identitas": "Profil Kamu",
  "Personalize your digital footprint across the ecosystem.": "Atur nama dan foto profil kamu di sini.",
  "Update Photo": "Ganti Foto",
  "Intelligence Overview": "Ringkasan Aktivitas",
  "Active Fragments": "Link Pendek",
  "Biolink Assets": "Halaman Biolink",
  "Global Reach": "Total Dilihat",
  "System Node Active Since": "Bergabung Sejak",
  "Core Identity Config": "Pengaturan Akun",
  "Alias \/ Display Name": "Nama Tampilan",
  "Enter your system alias": "Masukkan nama kamu",
  "Communication Channel": "Alamat Email",
  "The origin email is locked for security integrity.": "Email nggak bisa diubah sementara demi keamanan.",
  "Deploy Updates": "Simpan Perubahan",
  "Atmospheric Data Synchronization": "Sinkronisasi Otomatis",
  "Global analytics and asset counters are synchronized across all nodes in real\\-time\\. Any changes to your identity will propagate throughout the network within seconds\\.": "Perubahan profil kamu akan otomatis tersimpan dan langsung update di semua halaman.",
};

for (const [key, val] of Object.entries(copyReplacements)) {
  content = content.replace(new RegExp(key, 'g'), val);
}

// Ensure the page text defaults to slate-900 for light mode
content = content.replace(/text-white selection:bg-indigo-500\/30/g, 'text-slate-900 dark:text-white selection:bg-indigo-500/30');

// Write back
fs.writeFileSync(targetFile, content, 'utf8');
console.log('Profile page transformation complete!');
