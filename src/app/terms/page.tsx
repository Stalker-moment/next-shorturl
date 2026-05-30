// app/terms/page.tsx
"use client";

import StaticPageLayout from '@/components/layout/StaticPageLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsPage() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <StaticPageLayout 
                title="Terms of Service" 
                subtitle="Last Updated: May 24, 2026. Please read these terms carefully before using nyoo.me."
            >
                <section className="mb-12">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing, registering for, or using the services provided by nyoo.me ("Service", "we", "us", or "our"), including link shortening, dynamic QR code creation, and biolink profile creation, you agree to be bound by these Terms of Service ("Terms") and all applicable laws and regulations.
                    </p>
                    <p>
                        If you do not agree with any part of these Terms, you are prohibited from using or accessing our Service. We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will indicate the date of the latest update at the top of this page. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>2. Description of Service</h2>
                    <p>
                        nyoo.me provides users with tools to shorten Uniform Resource Locators (URLs), generate custom dynamic QR codes, and create personalized biolink landing pages. 
                    </p>
                    <p>
                        The Service is offered in various tiers, including Guest (non-registered) and Free Member (registered) accounts. Each tier is subject to specific quotas and limits, including link expiration rules (e.g., 30-day expiration for guest links versus permanent link options for registered accounts), monthly redirect limits, and custom customization limits, which may be modified by us from time to time.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>3. Account Registration and Security</h2>
                    <p>
                        To access certain advanced features of the Service, you must create a user account. You agree to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Provide accurate, current, and complete information during the registration process.</li>
                        <li>Maintain the security and confidentiality of your login credentials (password, session tokens).</li>
                        <li>Promptly update your account information to keep it accurate and current.</li>
                        <li>Accept responsibility for all activities that occur under your account, whether authorized by you or not.</li>
                    </ul>
                    <p>
                        You must immediately notify us of any unauthorized use of your account or any other breach of security. We are not liable for any losses caused by unauthorized access to your account.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>4. Acceptable Use and Prohibited Content</h2>
                    <p>
                        You are entirely responsible for all URLs, content, and information shortened, linked, or hosted on your biolink page. You agree not to use our Service to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Shorten, host, or distribute URLs pointing to malware, ransomware, spyware, trojans, viruses, or other malicious software.</li>
                        <li>Engage in phishing, social engineering, credential harvesting, or any form of digital deception.</li>
                        <li>Distribute unsolicited commercial communications, spam, mass promotional messages, or chain letters.</li>
                        <li>Facilitate or promote illegal activities, including copyright infringement, unauthorized file sharing, illegal gambling, or financial scams.</li>
                        <li>Host, display, or link to content that is threatening, abusive, harassing, defamatory, vulgar, obscene, invasive of another's privacy, hateful, or racially/ethnically offensive.</li>
                        <li>Violate any local, national, or international laws and regulations.</li>
                    </ul>
                    <p>
                        We employ automated security scanning tools and review abuse reports. We reserve the absolute right to suspend, disable, or delete any shortened URLs, biolink pages, QR codes, or user accounts immediately, without prior notice, if we believe a violation of this section has occurred.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>5. Abuse and Rate Limiting</h2>
                    <p>
                        You must not attempt to bypass any rate limiting, API usage restrictions, or security mechanisms of the Service. Prohibited actions include:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Generating artificial or simulated click traffic to shortened URLs or biolink pages using bots, scrapers, or automated tools.</li>
                        <li>Using automated scripts to mass-generate links, QR codes, or accounts.</li>
                        <li>Interfering with or disrupting the integrity, performance, or availability of the nyoo.me servers and network infrastructure.</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2>6. Intellectual Property Rights</h2>
                    <p>
                        Except for user-provided content (such as URLs and custom biolink text/assets), all contents of the Service, including logo designs, graphics, user interface elements, source code, database structures, and trademarks, are the exclusive property of nyoo.me.
                    </p>
                    <p>
                        By uploading content to your biolink page, you grant us a worldwide, non-exclusive, royalty-free license to host, display, and distribute that content solely for the purpose of operating the Service for you.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>7. Disclaimer of Warranties</h2>
                    <p>
                        THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESSED OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                    </p>
                    <p>
                        WE DO NOT WARRANT THAT: (A) THE SERVICE WILL BE SECURE, UNINTERRUPTED, OR AVAILABLE AT ANY PARTICULAR TIME OR LOCATION; (B) ANY ERRORS OR DEFECTS WILL BE CORRECTED; OR (C) THE REDIRECTION SPEED OR CODE PERFORMANCE WILL MATCH A SPECIFIC BENCHMARK.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>8. Limitation of Liability</h2>
                    <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL NYOO.ME, ITS OPERATORS, PARTNERS, OR EMPLOYEES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (I) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (II) ANY CONTENT OBTAINED FROM THE SERVICE; OR (III) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>9. Governing Law</h2>
                    <p>
                        These Terms and your relationship with nyoo.me shall be governed by and construed in accordance with the laws of the Republic of Indonesia, without regard to its conflict of law provisions. Any dispute arising from these terms shall be resolved in the competent courts located in Jakarta, Indonesia.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>10. Contact Us</h2>
                    <p>
                        If you have any questions, abuse reports, or feedback regarding these Terms, please contact our support team at:
                    </p>
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <p className="m-0 font-bold">Email: support@nyoo.me</p>
                        <p className="m-0 text-sm text-slate-500 mt-1">We typically respond to inquiries within 24-48 business hours.</p>
                    </div>
                </section>
            </StaticPageLayout>
        );
    }

    return (
        <StaticPageLayout 
            title="Ketentuan Layanan" 
            subtitle="Terakhir Diperbarui: 24 Mei 2026. Harap baca ketentuan ini secara saksama sebelum menggunakan nyoo.me."
        >
            <section className="mb-12">
                <h2>1. Penerimaan Ketentuan</h2>
                <p>
                    Dengan mengakses, mendaftar akun, atau menggunakan layanan yang disediakan oleh nyoo.me ("Layanan", "kami", atau "milik kami"), termasuk pemendekan tautan, pembuatan kode QR dinamis, dan pembuatan profil biolink, Anda setuju untuk terikat oleh Ketentuan Layanan ini ("Ketentuan") serta seluruh hukum dan peraturan yang berlaku.
                </p>
                <p>
                    Jika Anda tidak menyetujui bagian mana pun dari Ketentuan ini, Anda dilarang menggunakan atau mengakses Layanan kami. Kami berhak, atas kebijakan kami sendiri, untuk mengubah atau mengganti Ketentuan ini kapan saja. Kami akan mencantumkan tanggal pembaruan terakhir di bagian atas halaman ini. Penggunaan berkelanjutan Layanan setelah perubahan apa pun merupakan persetujuan atas Ketentuan baru tersebut.
                </p>
            </section>

            <section className="mb-12">
                <h2>2. Deskripsi Layanan</h2>
                <p>
                    nyoo.me menyediakan alat bagi pengguna untuk memperpendek Uniform Resource Locator (URL), menghasilkan kode QR dinamis kustom, dan membuat halaman biolink pribadi.
                </p>
                <p>
                    Layanan ini ditawarkan dalam berbagai tingkatan, termasuk akun Tamu (tidak terdaftar) dan Anggota Gratis (terdaftar). Setiap tingkatan tunduk pada kuota dan batasan tertentu, termasuk aturan kedaluwarsa tautan (misalnya, kedaluwarsa 30 hari untuk tautan tamu berbanding pilihan tautan permanen untuk akun terdaftar), batas pengalihan bulanan, dan batas penyesuaian kustom, yang dapat kami ubah dari waktu ke waktu.
                </p>
            </section>

            <section className="mb-12">
                <h2>3. Pendaftaran dan Keamanan Akun</h2>
                <p>
                    Untuk mengakses fitur lanjutan tertentu dari Layanan, Anda harus membuat akun pengguna. Anda setuju untuk:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Memberikan informasi yang akurat, terkini, dan lengkap selama proses pendaftaran.</li>
                    <li>Menjaga keamanan dan kerahasiaan kredensial masuk Anda (kata sandi, token sesi).</li>
                    <li>Segera memperbarui informasi akun Anda agar tetap akurat dan mutakhir.</li>
                    <li>Menerima tanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda, baik yang Anda izinkan maupun tidak.</li>
                </ul>
                <p>
                    Anda harus segera memberi tahu kami jika ada penggunaan akun Anda tanpa izin atau pelanggaran keamanan lainnya. Kami tidak bertanggung jawab atas kerugian yang disebabkan oleh akses tidak sah ke akun Anda.
                </p>
            </section>

            <section className="mb-12">
                <h2>4. Penggunaan yang Sah dan Konten yang Dilarang</h2>
                <p>
                    Anda bertanggung jawab penuh atas semua URL, konten, dan informasi yang diperpendek, ditautkan, atau dihosting di halaman biolink Anda. Anda setuju untuk tidak menggunakan Layanan kami untuk:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Memperpendek, menghosting, atau menyebarkan URL yang mengarah ke malware, ransomware, spyware, trojan, virus, atau perangkat lunak berbahaya lainnya.</li>
                    <li>Melakukan phishing, rekayasa sosial, pemanenan kredensial, atau segala bentuk penipuan digital.</li>
                    <li>Menyebarkan komunikasi komersial yang tidak diinginkan, spam, pesan promosi massal, atau surat berantai.</li>
                    <li>Memfasilitasi atau mempromosikan aktivitas ilegal, termasuk pelanggaran hak cipta, pembagian file tanpa izin, perjudian ilegal, atau penipuan keuangan.</li>
                    <li>Menghosting, menampilkan, atau menautkan ke konten yang mengancam, melecehkan, memfitnah, kasar, tidak senonoh, melanggar privasi orang lain, penuh kebencian, atau menyinggung secara ras/etnis.</li>
                    <li>Melanggar hukum dan peraturan lokal, nasional, atau internasional.</li>
                </ul>
                <p>
                    Kami menggunakan alat pemindaian keamanan otomatis dan meninjau laporan penyalahgunaan. Kami berhak sepenuhnya untuk menangguhkan, menonaktifkan, atau menghapus URL pendek, halaman biolink, kode QR, atau akun pengguna secara langsung, tanpa pemberitahuan sebelumnya, jika kami meyakini telah terjadi pelanggaran pada bagian ini.
                </p>
            </section>

            <section className="mb-12">
                <h2>5. Penyalahgunaan dan Batasan Akses (Rate Limiting)</h2>
                <p>
                    Anda dilarang mencoba melewati batasan akses, pembatasan penggunaan API, atau mekanisme keamanan Layanan. Tindakan yang dilarang meliputi:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Menghasilkan lalu lintas klik buatan atau simulasi ke URL pendek atau halaman biolink menggunakan bot, scraper, atau alat otomatis lainnya.</li>
                    <li>Menggunakan skrip otomatis untuk menghasilkan tautan, kode QR, atau akun secara massal.</li>
                    <li>Mengganggu atau mengacaukan integritas, performa, atau ketersediaan server dan infrastruktur jaringan nyoo.me.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>6. Hak Kekayaan Intelektual</h2>
                <p>
                    Kecuali untuk konten yang disediakan pengguna (seperti URL dan teks/aset biolink kustom), semua konten Layanan, termasuk desain logo, grafis, elemen antarmuka pengguna, kode sumber, struktur database, dan merek dagang adalah milik eksklusif nyoo.me.
                </p>
                <p>
                    Dengan mengunggah konten ke halaman biolink Anda, Anda memberi kami lisensi non-eksklusif, bebas royalti di seluruh dunia untuk menghosting, menampilkan, dan mendistribusikan konten tersebut semata-mata untuk tujuan mengoperasikan Layanan untuk Anda.
                </p>
            </section>

            <section className="mb-12">
                <h2>7. Batasan Jaminan</h2>
                <p>
                    LAYANAN INI DISEDIAKAN "SEBAGAIMANA ADANYA" DAN "SEBAGAIMANA TERSEDIA", TANPA JAMINAN APA PUN, BAIK TERSURAT MAUPUN TERSIRAT. KAMI MENOLAK SEMUA JAMINAN, TERMASUK NAMUN TIDAK TERBATAS PADA, JAMINAN TERSIRAT KELAYAKAN JUAL, KESESUAIAN UNTUK TUJUAN TERTENTU, DAN NON-PELANGGARAN.
                </p>
                <p>
                    KAMI TIDAK MENJAMIN BAHWA: (A) LAYANAN AKAN AMAN, TANPA GANGGUAN, ATAU TERSEDIA PADA WAKTU ATAU LOKASI TERTENTU; (B) SETIAP KESALAHAN ATAU CACAT AKAN DIPERBAIKI; ATAU (C) KECEPATAN REDIRECT ATAU KINERJA KODE QR AKAN SESUAI DENGAN BENCHMARK TERTENTU.
                </p>
            </section>

            <section className="mb-12">
                <h2>8. Batasan Tanggung Jawab</h2>
                <p>
                    SEJAUH DIIZINKAN OLEH HUKUM YANG BERLAKU, NYOO.ME, PENGELOLA, MITRA, ATAU KARYAWANNYA TIDAK AKAN BERTANGGUNG JAWAB ATAS KERUGIAN TIDAK LANGSUNG, INSIDENTAL, KHUSUS, KONSEKUENSIAL, ATAU PUNITIF, TERMASUK TANPA BATASAN, KEHILANGAN KEUNTUNGAN, DATA, PENGGUNAAN, GOODWILL, ATAU KERUGIAN TAK BERWUJUD LAINNYA YANG TIMBUL DARI: (I) AKSES ATAU PENGGUNAAN ATAU KETIDAKMAMPUAN ANDA UNTUK MENGAKSES ATAU MENGGUNAKAN LAYANAN; (II) KONTEN APA PUN YANG DIPEROLEH DARI LAYANAN; ATAU (III) AKSES, PENGGUNAAN, ATAU PERUBAHAN TANPA IZIN DARI TRANSMISI ATAU KONTEN ANDA.
                </p>
            </section>

            <section className="mb-12">
                <h2>9. Hukum yang Mengatur</h2>
                <p>
                    Ketentuan ini dan hubungan Anda dengan nyoo.me akan diatur dan ditafsirkan sesuai dengan hukum Negara Republik Indonesia, tanpa memperhatikan pertentangan ketentuan hukumnya. Setiap perselisihan yang timbul dari ketentuan ini akan diselesaikan di pengadilan yang berwenang yang berlokasi di Jakarta, Indonesia.
                </p>
            </section>

            <section className="mb-12">
                <h2>10. Hubungi Kami</h2>
                <p>
                    Jika Anda memiliki pertanyaan, laporan penyalahgunaan, atau umpan balik mengenai Ketentuan ini, silakan hubungi tim dukungan kami di:
                </p>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="m-0 font-bold">Email: support@nyoo.me</p>
                    <p className="m-0 text-sm text-slate-500 mt-1">Kami biasanya menanggapi pertanyaan dalam waktu 24-48 jam kerja.</p>
                </div>
            </section>
        </StaticPageLayout>
    );
}