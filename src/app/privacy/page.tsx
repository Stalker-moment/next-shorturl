// app/privacy/page.tsx
"use client";

import StaticPageLayout from '@/components/layout/StaticPageLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPage() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <StaticPageLayout 
                title="Privacy Policy" 
                subtitle="Last Updated: May 24, 2026. How we collect, use, and safeguard your data."
            >
                <section className="mb-12">
                    <h2>1. Introduction</h2>
                    <p>
                        At nyoo.me ("we", "us", or "our"), we take your privacy extremely seriously. This Privacy Policy explains how we collect, use, disclose, and protect your information when you visit our website, use our link shortening tool, create QR codes, or setup a biolink page.
                    </p>
                    <p>
                        By accessing or using our Service, you consent to the data collection and usage practices described in this policy. If you do not agree with the terms of this Privacy Policy, please do not use our Service.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>2. Information We Collect</h2>
                    <p>We collect information about you in three main ways: directly from you, automatically when you interact with our Service, and from third-party services.</p>
                    
                    <h3>A. Information Provided Directly by You</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Account Information:</strong> When you register for a Free Member account, we collect your full name, email address, and account password.</li>
                        <li><strong>Profile Data:</strong> If you use our biolink features, we collect the profile picture, display name, social links, custom tags, and text content you upload or configure for your biolink page.</li>
                        <li><strong>Shortened URLs:</strong> We collect the destination URLs that you enter into our system to shorten.</li>
                    </ul>

                    <h3>B. Information Collected Automatically</h3>
                    <p>When someone clicks a shortened link or visits a biolink page hosted on our Service, we automatically collect basic technical details about the redirection request for analytical purposes:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>IP Addresses:</strong> Used to prevent spam and abuse, and to determine approximate geographic location (country and city level).</li>
                        <li><strong>User Agent:</strong> Details about the web browser and device operating system (e.g., Chrome on Android, Safari on iOS) to categorize device types.</li>
                        <li><strong>Referrer Headers:</strong> Information about the website from which the user clicked the link (e.g., Twitter, Instagram, or a direct link).</li>
                        <li><strong>Timestamps:</strong> The exact date and time of the click event.</li>
                    </ul>

                    <h3>C. Information from Third-Party Services</h3>
                    <p>
                        If you choose to sign up or log in using third-party services (such as Google OAuth), we receive authorization data from that service, specifically your email address and profile picture, to establish your account.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>3. How We Use Your Information</h2>
                    <p>We process your data based on legitimate business interests and to fulfill our services to you. Uses include:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Service Provisioning:</strong> Setting up your account, redirecting shortened links, rendering QR codes, and hosting your biolink landing pages.</li>
                        <li><strong>Analytics & Reports:</strong> Generating click performance, device breakdowns, and location charts inside your user dashboard.</li>
                        <li><strong>Security & Abuse Prevention:</strong> Detecting phishing, malware, rate limit violations, or bots, and identifying accounts that violate our Terms of Service.</li>
                        <li><strong>Service Updates:</strong> Sending account confirmations, password resets, security advisories, or critical technical notices.</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2>4. Data Retention</h2>
                    <p>
                        We store personal data for as long as your account remains active or as needed to provide our services:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Guest Links:</strong> Links shortened by non-registered guest users are temporary and expire automatically after 30 days, along with all associated transient analytics data.</li>
                        <li><strong>Member Links & Biolinks:</strong> Remain active and stored in our database indefinitely as long as your account remains active.</li>
                        <li><strong>Account Deletion:</strong> If you request account deletion, we will delete your personal data (name, email, profile configurations) and anonymize the click logs within 30 days of the request.</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2>5. Sharing of Information</h2>
                    <p>
                        We do not sell, trade, or rent your personal identification information to advertising networks or third parties. We only share information in the following limited circumstances:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Service Providers:</strong> We use reliable cloud hosting and database providers to run our backend services under strict data processing agreements.</li>
                        <li><strong>Legal Obligations:</strong> We may disclose information if required to do so by Indonesian law or in response to valid requests by public authorities (e.g., a court or government agency).</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2>6. Data Security</h2>
                    <p>
                        We implement industry-standard security measures to guard your data. All communication between your browser and our servers is encrypted using Secure Socket Layer (SSL/HTTPS) protocol. Account passwords are encrypted using modern hashing algorithms (e.g., bcrypt) and cannot be read by our team or administrators.
                    </p>
                    <p>
                        However, please remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to protect your personal data, we cannot guarantee its absolute security.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>7. Your Rights (GDPR & CCPA Compliance)</h2>
                    <p>Depending on your jurisdiction, you have several rights regarding your personal information:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
                        <li><strong>Right of Rectification:</strong> Request that we correct inaccurate or incomplete information.</li>
                        <li><strong>Right to Erasure:</strong> Request that we delete your account and associated personal data.</li>
                        <li><strong>Right to Data Portability:</strong> Obtain your links and configuration data in a structured, machine-readable format.</li>
                    </ul>
                    <p>To exercise any of these rights, please contact us at the email listed below.</p>
                </section>

                <section className="mb-12">
                    <h2>8. Contact Us</h2>
                    <p>
                        For any questions about this Privacy Policy, your data rights, or to submit a data deletion request, please reach us at:
                    </p>
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <p className="m-0 font-bold">Email: support@nyoo.me</p>
                        <p className="m-0 text-sm text-slate-500 mt-1">We handle privacy-related requests with high priority.</p>
                    </div>
                </section>
            </StaticPageLayout>
        );
    }

    return (
        <StaticPageLayout 
            title="Kebijakan Privasi" 
            subtitle="Terakhir Diperbarui: 24 Mei 2026. Bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda."
        >
            <section className="mb-12">
                <h2>1. Pendahuluan</h2>
                <p>
                    Di nyoo.me ("kami", "atau milik kami"), kami menjaga kerahasiaan data Anda dengan sangat serius. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi Anda ketika Anda mengunjungi situs web kami, menggunakan alat pemendek tautan, membuat kode QR, atau mengatur halaman biolink.
                </p>
                <p>
                    Dengan mengakses atau menggunakan Layanan kami, Anda menyetujui praktik pengumpulan dan penggunaan data yang dijelaskan dalam kebijakan ini. Jika Anda tidak setuju dengan ketentuan dalam Kebijakan Privasi ini, mohon untuk tidak menggunakan Layanan kami.
                </p>
            </section>

            <section className="mb-12">
                <h2>2. Informasi yang Kami Kumpulkan</h2>
                <p>Kami mengumpulkan informasi tentang Anda dengan tiga cara utama: langsung dari Anda, secara otomatis ketika Anda berinteraksi dengan Layanan kami, dan dari layanan pihak ketiga.</p>
                
                <h3>A. Informasi yang Anda Berikan Secara Langsung</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Informasi Akun:</strong> Ketika Anda mendaftar akun Anggota Gratis, kami mengumpulkan nama lengkap, alamat email, dan kata sandi akun Anda.</li>
                    <li><strong>Data Profil:</strong> Jika Anda menggunakan fitur biolink, kami mengumpulkan foto profil, nama tampilan, tautan sosial, tag kustom, dan konten teks yang Anda unggah atau konfigurasikan untuk halaman biolink Anda.</li>
                    <li><strong>URL yang Diperpendek:</strong> Kami mengumpulkan URL tujuan yang Anda masukkan ke dalam sistem kami untuk diperpendek.</li>
                </ul>

                <h3>B. Informasi yang Dikumpulkan Secara Otomatis</h3>
                <p>Ketika seseorang mengeklik tautan pendek atau mengunjungi halaman biolink yang di-host di Layanan kami, kami secara otomatis mengumpulkan detail teknis dasar untuk keperluan analitik:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Alamat IP:</strong> Digunakan untuk mencegah spam dan penyalahgunaan, serta untuk menentukan perkiraan lokasi geografis (tingkat negara dan kota).</li>
                    <li><strong>User Agent:</strong> Detail tentang browser web dan sistem operasi perangkat (misalnya, Chrome di Android, Safari di iOS) untuk mengkategorikan jenis perangkat.</li>
                    <li><strong>Referrer Headers:</strong> Informasi tentang situs web asal tempat pengguna mengklik tautan tersebut (misalnya, Twitter, Instagram, atau tautan langsung).</li>
                    <li><strong>Stempel Waktu (Timestamps):</strong> Tanggal dan waktu yang tepat saat peristiwa klik terjadi.</li>
                </ul>

                <h3>C. Informasi dari Layanan Pihak Ketiga</h3>
                <p>
                    Jika Anda memilih untuk mendaftar atau masuk menggunakan layanan pihak ketiga (seperti Google OAuth), kami menerima data otorisasi dari layanan tersebut, khususnya alamat email dan foto profil Anda, untuk membuat akun Anda.
                </p>
            </section>

            <section className="mb-12">
                <h2>3. Bagaimana Kami Menggunakan Informasi Anda</h2>
                <p>Kami memproses data Anda berdasarkan kepentingan bisnis yang sah dan untuk memenuhi layanan kami kepada Anda. Penggunaan tersebut meliputi:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Penyediaan Layanan:</strong> Mengatur akun Anda, mengarahkan tautan pendek, merender kode QR, dan menghosting halaman biolink Anda.</li>
                    <li><strong>Analitik & Laporan:</strong> Menghasilkan grafik kinerja klik, rincian perangkat, dan diagram lokasi di dalam dashboard pengguna Anda.</li>
                    <li><strong>Keamanan & Pencegahan Penyalahgunaan:</strong> Mendeteksi phishing, malware, pelanggaran batas akses, atau bot, serta mengidentifikasi akun yang melanggar Ketentuan Layanan kami.</li>
                    <li><strong>Pembaruan Layanan:</strong> Mengirimkan konfirmasi akun, reset kata sandi, pemberitahuan keamanan, atau pemberitahuan teknis penting.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>4. Retensi Data</h2>
                <p>
                    Kami menyimpan data pribadi selama akun Anda tetap aktif atau selama diperlukan untuk menyediakan layanan kami:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Tautan Tamu:</strong> Tautan yang diperpendek oleh pengguna tamu yang tidak terdaftar bersifat sementara dan akan kedaluwarsa secara otomatis setelah 30 hari, beserta semua data analitik terkait.</li>
                    <li><strong>Tautan Anggota & Biolink:</strong> Tetap aktif dan disimpan dalam database kami tanpa batas waktu selama akun Anda tetap aktif.</li>
                    <li><strong>Penghapusan Akun:</strong> Jika Anda meminta penghapusan akun, kami akan menghapus data pribadi Anda (nama, email, konfigurasi profil) dan menganonimkan log klik dalam waktu 30 hari sejak permintaan diajukan.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>5. Pembagian Informasi</h2>
                <p>
                    Kami tidak menjual, memperdagangkan, atau menyewakan informasi identifikasi pribadi Anda kepada jaringan periklanan atau pihak ketiga. Kami hanya membagikan informasi dalam kondisi terbatas berikut:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Penyedia Layanan:</strong> Kami menggunakan penyedia cloud hosting dan database tepercaya untuk menjalankan layanan backend kami di bawah perjanjian pemrosesan data yang ketat.</li>
                    <li><strong>Kewajiban Hukum:</strong> Kami dapat mengungkapkan informasi Anda jika diwajibkan oleh hukum Indonesia atau sebagai tanggapan atas permintaan yang sah dari otoritas publik (misalnya, pengadilan atau lembaga pemerintah).</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>6. Keamanan Data</h2>
                <p>
                    Kami menerapkan langkah-langkah keamanan standar industri untuk melindungi data Anda. Semua komunikasi antara browser Anda dan server kami dienkripsi menggunakan protokol Secure Socket Layer (SSL/HTTPS). Kata sandi akun dienkripsi menggunakan algoritma hashing modern (misalnya, bcrypt) dan tidak dapat dibaca oleh tim atau administrator kami.
                </p>
                <p>
                    Namun, harap diingat bahwa tidak ada metode transmisi melalui Internet, atau metode penyimpanan elektronik yang 100% aman. Meskipun kami berusaha keras untuk melindungi data pribadi Anda, kami tidak dapat menjamin keamanannya secara mutlak.
                </p>
            </section>

            <section className="mb-12">
                <h2>7. Hak Anda (Kepatuhan GDPR & CCPA)</h2>
                <p>Tergantung pada yurisdiksi Anda, Anda memiliki beberapa hak terkait informasi pribadi Anda:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Hak Akses:</strong> Meminta salinan data pribadi yang kami simpan tentang Anda.</li>
                    <li><strong>Hak Perbaikan:</strong> Meminta kami memperbaiki informasi yang tidak akurat atau tidak lengkap.</li>
                    <li><strong>Hak Penghapusan:</strong> Meminta kami menghapus akun dan data pribadi terkait.</li>
                    <li><strong>Hak Portabilitas Data:</strong> Memperoleh tautan dan data konfigurasi Anda dalam format terstruktur yang mudah dibaca oleh mesin.</li>
                </ul>
                <p>Untuk menggunakan hak-hak ini, silakan hubungi kami di email yang tercantum di bawah ini.</p>
            </section>

            <section className="mb-12">
                <h2>8. Hubungi Kami</h2>
                <p>
                    Untuk pertanyaan apa pun mengenai Kebijakan Privasi ini, hak data Anda, atau untuk mengajukan permintaan penghapusan data, silakan hubungi kami di:
                </p>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="m-0 font-bold">Email: support@nyoo.me</p>
                    <p className="m-0 text-sm text-slate-500 mt-1">Kami menangani permintaan terkait privasi dengan prioritas tinggi.</p>
                </div>
            </section>
        </StaticPageLayout>
    );
}
