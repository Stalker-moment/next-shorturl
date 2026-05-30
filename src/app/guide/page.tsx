// app/guide/page.tsx
"use client";

import StaticPageLayout from '@/components/layout/StaticPageLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function GuidePage() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <StaticPageLayout 
                title="User Guide" 
                subtitle="Complete guide to using nyoo.me from basic to professional."
            >
                <section className="mb-12">
                    <h2>1. Getting Started (Guest Mode)</h2>
                    <p>
                        You do not need to register to use nyoo.me. Just paste your long URL 
                        on the Landing Page and click <strong>Shorten Now</strong>.
                    </p>
                    <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl mb-8">
                        <p className="text-amber-800 dark:text-amber-400 font-bold m-0 italic">Guest links have an automatic duration limit (up to 30 days).</p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2>2. Professional Account</h2>
                    <p>Registering an account will unlock the following features:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <h4 className="font-bold mb-2 m-0 p-0 text-indigo-600 dark:text-indigo-400">URL Analytics</h4>
                            <p className="text-sm m-0">Track origin countries, browsers, and devices of your link visitors in real-time.</p>
                        </div>
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <h4 className="font-bold mb-2 m-0 p-0 text-indigo-600 dark:text-indigo-400">Custom QR Designs</h4>
                            <p className="text-sm m-0">Upload a logo at the center of the QR, customize colors, and adjust eye patterns for aesthetic visuals.</p>
                        </div>
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <h4 className="font-bold mb-2 m-0 p-0 text-indigo-600 dark:text-indigo-400">Biolink Builder</h4>
                            <p className="text-sm m-0">Create a single page containing a collection of your social media and business links.</p>
                        </div>
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <h4 className="font-bold mb-2 m-0 p-0 text-indigo-600 dark:text-indigo-400">Custom Slugs</h4>
                            <p className="text-sm m-0">Use custom words for your links, e.g., <em>nyoo.me/my-bio</em>.</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2>3. How to Create a QR Code</h2>
                    <ol className="list-decimal pl-5 space-y-3">
                        <li>Select the <strong>QR Code</strong> tab on the Landing Page.</li>
                        <li>Enter your target URL.</li>
                        <li>Click <strong>Generate QR</strong>.</li>
                        <li>Use the <strong>Styling Editor</strong> panel that appears below the result to customize the design.</li>
                        <li>Download the final result as a PNG or SVG file.</li>
                    </ol>
                </section>

                <section className="mb-12">
                    <h2>4. Analytics & Tracking</h2>
                    <p>
                        Access Dashboard &gt; Link Management &gt; Analytics to view your link performance. 
                        You can filter data based on specific date ranges.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>5. Need Further Help?</h2>
                    <p>
                        If this guide still doesn't answer your questions, visit our help center 
                        or email us at <strong>support@nyoo.me</strong>.
                    </p>
                </section>
            </StaticPageLayout>
        );
    }

    return (
        <StaticPageLayout 
            title="User Guide" 
            subtitle="Panduan lengkap penggunaan nyoo.me dari dasar hingga profesional."
        >
            <section className="mb-12">
                <h2>1. Memulai (Guest Mode)</h2>
                <p>
                    Anda tidak perlu mendaftar untuk menggunakan nyoo.me. Cukup tempel URL panjang Anda 
                    di Landing Page dan klik <strong>Shorten Now</strong>.
                </p>
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl mb-8">
                    <p className="text-amber-800 dark:text-amber-400 font-bold m-0 italic">Link Guest memiliki batas durasi otomatis (hingga 30 hari).</p>
                </div>
            </section>

            <section className="mb-12">
                <h2>2. Akun Profesional</h2>
                <p>Pendaftaran akun akan membuka fitur-fitur berikut:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <h4 className="font-bold mb-2 m-0 p-0 text-indigo-600 dark:text-indigo-400">URL Analytics</h4>
                        <p className="text-sm m-0">Lacak asal negara, browser, dan perangkat pengunjung tautan Anda secara real-time.</p>
                    </div>
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <h4 className="font-bold mb-2 m-0 p-0 text-indigo-600 dark:text-indigo-400">Custom QR Designs</h4>
                        <p className="text-sm m-0">Unggah logo di tengah QR, sesuaikan warna, dan pola mata QR agar semakin estetik.</p>
                    </div>
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <h4 className="font-bold mb-2 m-0 p-0 text-indigo-600 dark:text-indigo-400">Biolink Builder</h4>
                        <p className="text-sm m-0">Ciptakan satu halaman berisi kumpulan tautan media sosial dan bisnis Anda.</p>
                    </div>
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <h4 className="font-bold mb-2 m-0 p-0 text-indigo-600 dark:text-indigo-400">Custom Slugs</h4>
                        <p className="text-sm m-0">Gunakan kata-kata kustom untuk link Anda, misalnya: <em>nyoo.me/bio-saya</em>.</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2>3. Cara Membuat QR Code</h2>
                <ol className="list-decimal pl-5 space-y-3">
                    <li>Pilih tab <strong>QR Code</strong> pada Landing Page.</li>
                    <li>Masukkan URL target Anda.</li>
                    <li>Klik <strong>Generate QR</strong>.</li>
                    <li>Gunakan panel <strong>Editor Styling</strong> yang muncul di bawah hasil untuk menyesuaikan desain.</li>
                    <li>Download hasil akhir sebagai file PNG atau SVG.</li>
                </ol>
            </section>

            <section className="mb-12">
                <h2>4. Analitik & Pelacakan</h2>
                <p>
                    Akses Dashboard &gt; Link Management &gt; Analitik untuk melihat performa link Anda. 
                    Anda dapat memfilter data berdasarkan rentang waktu tertentu.
                </p>
            </section>

            <section className="mb-12">
                <h2>5. Butuh Bantuan Lanjut?</h2>
                <p>
                    Jika panduan ini masih belum menjawab pertanyaan Anda, kunjungi help center kami 
                    atau email kami di <strong>support@nyoo.me</strong>.
                </p>
            </section>
        </StaticPageLayout>
    );
}
