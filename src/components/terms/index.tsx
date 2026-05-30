"use client";

import React from 'react';
import Link from 'next/link';
import ThemeToggle from '../ThemeToggle';

const TermsPage = () => {
 return (
 <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">

 {/* Sticky Navbar - identical to Guide */}
 <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
 <Link href="/" className="flex items-center gap-2">
 <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
 <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
 </svg>
 </div>
 <span className="font-bold text-slate-900 dark:text-white">nyoo.me</span>
 </Link>
 <div className="flex items-center gap-4">
 <ThemeToggle />
 <Link href="/manage" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
 Dashboard
 </Link>
 <Link href="/login" className="text-sm font-semibold px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
 Login
 </Link>
 </div>
 </div>
 </header>

 {/* Main Content - identical structure to Guide */}
 <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

 {/* Back link */}
 <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-8 font-semibold">
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
 </svg>
 Kembali ke Beranda
 </Link>

 {/* Hero Header - identical to Guide */}
 <div className="text-center mb-10">
 <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
 <svg className="w-8 h-8 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
 </svg>
 </div>
 <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Syarat & Ketentuan</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed max-w-md mx-auto">
 Aturan penggunaan layanan nyoo.me. Harap dibaca dengan saksama sebelum menggunakan layanan kami.
 </p>
 </div>

 {/* Sections as separate cards — same structure as Guide */}
 <div className="space-y-4">

 {/* Card 1 */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
 <div className="px-6 py-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
 <span className="text-base leading-none">⚖️</span>
 </div>
 <div>
 <p className="font-bold text-slate-900 dark:text-white text-sm">Penerimaan Persyaratan</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Syarat penggunaan layanan nyoo.me.</p>
 </div>
 </div>
 <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
 <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
 Selamat datang di <strong className="text-violet-600 dark:text-violet-400">nyoo.me</strong>! Dengan menggunakan layanan kami, Anda setuju untuk terikat oleh Syarat ini. Saat membuat akun atau memperpendek tautan, Anda dikonfirmasi telah membaca dan setuju dengan nyoo.me Terms serta Kebijakan Privasi kami.
 </p>
 </div>
 </div>

 {/* Card 2 */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
 <div className="px-6 py-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
 <span className="text-base leading-none">🔗</span>
 </div>
 <div>
 <p className="font-bold text-slate-900 dark:text-white text-sm">Deskripsi Layanan</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Apa yang nyoo.me lakukan dan tidak lakukan.</p>
 </div>
 </div>
 <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
 <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
 nyoo.me menyederhanakan URL panjang menjadi ringkas dan mudah dibagikan. Kami berhak memodifikasi, menghentikan, atau menghapus link pasif tanpa pemberitahuan jika dianggap sebagai spam atau melanggar aturan.
 </p>
 </div>
 </div>

 {/* Card 3 */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
 <div className="px-6 py-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
 <span className="text-base leading-none">🔐</span>
 </div>
 <div>
 <p className="font-bold text-slate-900 dark:text-white text-sm">Akun Pengguna & Keamanan</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tanggung jawab pengguna atas akun mereka.</p>
 </div>
 </div>
 <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
 <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
 Untuk fitur analitik dan custom URL, Anda wajib login. Anda sepenuhnya bertanggung jawab atas kerahasiaan password dan seluruh aktivitas link yang dilakukan melalui akun Anda.
 </p>
 </div>
 </div>

 {/* Card 4 - Danger */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
 <div className="px-6 py-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
 <span className="text-base leading-none">🚫</span>
 </div>
 <div>
 <p className="font-bold text-slate-900 dark:text-white text-sm">Larangan Keras (Toleransi Nol)</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pelanggaran akan diblokir permanen.</p>
 </div>
 </div>
 <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
 <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4">
 <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">
 Kami akan menghapus link dan memblokir akun Anda secara permanen jika terbukti:
 </p>
 <ul className="space-y-1.5">
 {[
 'Materi ilegal, narkotika, atau kejahatan internet (Phishing).',
 'Konten perjudian, pornografi, atau pelecehan masal.',
 'Tindakan eksploitasi bug sistem server kami.',
 ].map((item, i) => (
 <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
 <span className="mt-0.5 shrink-0">•</span> {item}
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>

 {/* Card 5 */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
 <div className="px-6 py-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
 <span className="text-base leading-none">©️</span>
 </div>
 <div>
 <p className="font-bold text-slate-900 dark:text-white text-sm">Hak Kekayaan Intelektual</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kepemilikan aset dan desain platform.</p>
 </div>
 </div>
 <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
 <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
 Sistem algoritma, visual logo, dan desain platform adalah milik eksklusif pemilik nyoo.me. Lisensi tidak dialihkan ke pengunjung mana pun.
 </p>
 </div>
 </div>

 {/* Card 6 - Contact */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
 <div className="px-6 py-4 flex items-center gap-3">
 <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center shrink-0">
 <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
 </svg>
 </div>
 <div>
 <p className="font-bold text-slate-900 dark:text-white text-sm">Kontak Support</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hubungi kami jika ada kendala.</p>
 </div>
 </div>
 <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
 <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
 Jika Anda memiliki kendala atau menemukan penyalahgunaan link, silakan hubungi kami di{' '}
 <a href="mailto:support@nyoo.me.site" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
 support@nyoo.me.site
 </a>.
 </p>
 </div>
 </div>

 </div>

 <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-10 font-semibold">
 TERAKHIR DIPERBARUI: MARET 2026
 </p>
 </main>

 {/* Footer - identical to Guide */}
 <footer className="mt-20 bg-slate-900 dark:bg-slate-950 text-slate-400 border-t border-slate-800">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
 <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
 <div>
 <div className="flex items-center gap-2 mb-3">
 <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
 <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
 </svg>
 </div>
 <span className="font-bold text-white text-sm">nyoo.me</span>
 </div>
 <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
 Persingkat link kamu dan pantau trafik dengan mudah, gratis, dan tanpa ribet.
 </p>
 </div>
 <div className="flex gap-10 text-xs">
 <div>
 <p className="font-semibold text-slate-300 font-semibold mb-3">Layanan</p>
 <ul className="space-y-2">
 <li><Link href="/" className="hover:text-violet-400 transition-colors">Beranda</Link></li>
 <li><Link href="/manage" className="hover:text-violet-400 transition-colors">Dashboard</Link></li>
 </ul>
 </div>
 <div>
 <p className="font-semibold text-slate-300 font-semibold mb-3">Bantuan</p>
 <ul className="space-y-2">
 <li><Link href="/guide" className="hover:text-violet-400 transition-colors">Cara Pakai</Link></li>
 </ul>
 </div>
 <div>
 <p className="font-semibold text-slate-300 font-semibold mb-3">Keamanan</p>
 <ul className="space-y-2">
 <li><Link href="/terms" className="hover:text-violet-400 transition-colors">Syarat Layanan</Link></li>
 </ul>
 </div>
 </div>
 </div>
 <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-center text-slate-600">
 © {new Date().getFullYear()} nyoo.me. All rights reserved.
 </div>
 </div>
 </footer>
 </div>
 );
};

export default TermsPage;