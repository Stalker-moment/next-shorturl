// app/cookies/page.tsx
"use client";

import StaticPageLayout from '@/components/layout/StaticPageLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CookiesPage() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <StaticPageLayout 
                title="Cookies Policy" 
                subtitle="Last Updated: May 24, 2026. Understanding how we use cookies and how you can manage them."
            >
                <section className="mb-12">
                    <h2>1. What are Cookies?</h2>
                    <p>
                        Cookies are small text files that are stored on your computer, smartphone, or other web-enabled devices when you visit a website. They contain browser identifiers and basic configuration data, helping websites recognize your device on subsequent visits to deliver personalized features and improve usability.
                    </p>
                    <p>
                        In addition to cookies, we may use other tracking technologies, such as browser Local Storage, which serves a similar purpose by storing configuration data locally within your web browser.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>2. How We Use Cookies</h2>
                    <p>
                        nyoo.me uses cookies and local storage to ensure the stability, security, and smooth operation of our link shortening and bio-page services. Specifically, cookies are used for:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Authentication:</strong> To keep you logged in to your dashboard panel. Without session cookies, you would have to enter your email and password on every page you visit.</li>
                        <li><strong>User Preferences:</strong> Saving settings such as your interface language selection (Indonesian/English) and theme choice (Light Mode/Dark Mode).</li>
                        <li><strong>Security & Protection:</strong> Assisting in the detection of bot registrations, DDoS attacks, or brute force attempts to secure our user accounts.</li>
                        <li><strong>Site Performance & Analytics:</strong> Storing temporary parameters to check redirection flows and resolve system anomalies.</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2>3. Cookies and Storage Keys We Set</h2>
                    <p>Below is a detailed list of the specific cookies and local storage parameters we use on our platform:</p>
                    
                    <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white">Name / Key</th>
                                    <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white">Category</th>
                                    <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white">Purpose</th>
                                    <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white">Lifespan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                <tr>
                                    <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">next-auth.session-token</td>
                                    <td className="px-4 py-3">Strictly Necessary</td>
                                    <td className="px-4 py-3">Stores your encrypted session token once logged in, keeping your dashboard session active.</td>
                                    <td className="px-4 py-3">Session / 30 Days</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">theme</td>
                                    <td className="px-4 py-3">Functional (Local Storage)</td>
                                    <td className="px-4 py-3">Remembers your user interface display choice (Light vs Dark mode).</td>
                                    <td className="px-4 py-3">Persistent</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">language</td>
                                    <td className="px-4 py-3">Functional (Local Storage)</td>
                                    <td className="px-4 py-3">Remembers your language choice (ID or EN) for the text on the site.</td>
                                    <td className="px-4 py-3">Persistent</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">__cf_bm / cf_clearance</td>
                                    <td className="px-4 py-3">Security & Shield</td>
                                    <td className="px-4 py-3">Set by Cloudflare to protect the system from malicious bot traffic.</td>
                                    <td className="px-4 py-3">Up to 1 Year</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mb-12">
                    <h2>4. Third-Party Cookies</h2>
                    <p>
                        In some areas of our site, we integrate services from third parties:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Google OAuth:</strong> If you use the "Login with Google" option, Google will set cookies on their own domain to manage and authenticate your Google session securely.</li>
                        <li><strong>Cloudflare Security:</strong> Set automatically to verify that your connection is secure and to prevent spam registrations.</li>
                    </ul>
                    <p>
                        We do not control these third-party cookies. We recommend reviewing the respective privacy and cookie policies of these services for more information.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>5. Controlling and Disabling Cookies</h2>
                    <p>
                        Most web browsers are configured to accept cookies automatically. However, you have the right and ability to manage, block, or delete cookies at any time:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>You can adjust your browser settings to alert you when cookies are set or block them entirely.</li>
                        <li>You can delete all cookies currently stored on your device through your browser history settings.</li>
                    </ul>
                    <p className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 font-medium">
                        <strong>Warning:</strong> If you block or delete strictly necessary cookies, some functionalities of our Service will be compromised. For example, you will not be able to log in or access your user dashboard.
                    </p>
                </section>

                <section className="mb-12">
                    <h2>6. Contact Information</h2>
                    <p>
                        If you have any queries about our use of cookies or this policy, please email us at:
                    </p>
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <p className="m-0 font-bold">Email: support@nyoo.me</p>
                    </div>
                </section>
            </StaticPageLayout>
        );
    }

    return (
        <StaticPageLayout 
            title="Kebijakan Cookies" 
            subtitle="Terakhir Diperbarui: 24 Mei 2026. Memahami bagaimana kami menggunakan cookies dan cara Anda mengelolanya."
        >
            <section className="mb-12">
                <h2>1. Apa itu Cookies?</h2>
                <p>
                    Cookies adalah file teks kecil yang disimpan di komputer, smartphone, atau perangkat berkemampuan web lainnya saat Anda mengunjungi sebuah situs web. Cookies berisi pengidentifikasi browser dan data konfigurasi dasar, membantu situs mengenali perangkat Anda pada kunjungan berikutnya untuk menyediakan fitur yang dipersonalisasi dan meningkatkan kenyamanan penggunaan.
                </p>
                <p>
                    Selain cookies, kami juga dapat menggunakan teknologi pelacakan lainnya seperti Local Storage browser, yang memiliki tujuan serupa dengan menyimpan data konfigurasi secara lokal di dalam browser web Anda.
                </p>
            </section>

            <section className="mb-12">
                <h2>2. Bagaimana Kami Menggunakan Cookies</h2>
                <p>
                    nyoo.me menggunakan cookies dan local storage untuk memastikan stabilitas, keamanan, dan kelancaran pengoperasian layanan pemendekan tautan dan halaman bio kami. Secara khusus, cookies digunakan untuk:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Otentikasi:</strong> Untuk menjaga Anda tetap masuk ke panel dashboard Anda. Tanpa cookies sesi, Anda harus memasukkan email dan kata sandi di setiap halaman yang Anda kunjungi.</li>
                    <li><strong>Preferensi Pengguna:</strong> Menyimpan pengaturan seperti pilihan bahasa antarmuka (Bahasa Indonesia/Inggris) dan pilihan tema tampilan (Mode Terang/Mode Gelap).</li>
                    <li><strong>Keamanan & Perlindungan:</strong> Membantu mendeteksi pendaftaran bot, serangan DDoS, atau upaya masuk paksa demi mengamankan akun pengguna kami.</li>
                    <li><strong>Kinerja & Analitik:</strong> Menyimpan parameter sementara untuk memeriksa alur pengalihan dan menyelesaikan kendala teknis pada sistem.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>3. Cookies dan Kunci Penyimpanan yang Kami Gunakan</h2>
                <p>Di bawah ini adalah daftar terperinci dari cookies spesifik dan parameter penyimpanan lokal yang kami gunakan di platform kami:</p>
                
                <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white">Nama / Kunci</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white">Kategori</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white">Tujuan</th>
                                <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white">Masa Aktif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            <tr>
                                <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">next-auth.session-token</td>
                                <td className="px-4 py-3">Sangat Penting</td>
                                <td className="px-4 py-3">Menyimpan token sesi terenkripsi Anda setelah masuk, menjaga sesi dashboard Anda tetap aktif.</td>
                                <td className="px-4 py-3">Sesi / 30 Hari</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">theme</td>
                                <td className="px-4 py-3">Fungsional (Local Storage)</td>
                                <td className="px-4 py-3">Mengingat pilihan mode tampilan antarmuka Anda (Mode Terang vs Mode Gelap).</td>
                                <td className="px-4 py-3">Permanen</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">language</td>
                                <td className="px-4 py-3">Fungsional (Local Storage)</td>
                                <td className="px-4 py-3">Mengingat pilihan bahasa Anda (ID atau EN) untuk teks yang ada di situs.</td>
                                <td className="px-4 py-3">Permanen</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">__cf_bm / cf_clearance</td>
                                <td className="px-4 py-3">Keamanan & Shield</td>
                                <td className="px-4 py-3">Ditetapkan oleh Cloudflare untuk melindungi sistem dari trafik bot yang berbahaya.</td>
                                <td className="px-4 py-3">Hingga 1 Tahun</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mb-12">
                <h2>4. Cookies Pihak Ketiga</h2>
                <p>
                    Di beberapa area situs kami, kami mengintegrasikan layanan dari pihak ketiga:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Google OAuth:</strong> Jika Anda memilih opsi "Masuk dengan Google", Google akan menetapkan cookies pada domain mereka sendiri untuk mengelola dan memverifikasi sesi Google Anda dengan aman.</li>
                    <li><strong>Keamanan Cloudflare:</strong> Ditetapkan secara otomatis untuk memverifikasi bahwa koneksi Anda aman dan mencegah pendaftaran spam.</li>
                </ul>
                <p>
                    Kami tidak mengontrol cookies pihak ketiga ini. Kami menyarankan Anda meninjau kebijakan kebijakan privasi dan cookies masing-masing layanan tersebut untuk informasi lebih lanjut.
                </p>
            </section>

            <section className="mb-12">
                <h2>5. Mengontrol dan Menonaktifkan Cookies</h2>
                <p>
                    Sebagian besar browser web dikonfigurasi untuk menerima cookies secara otomatis. Namun, Anda memiliki hak dan kemampuan untuk mengelola, memblokir, atau menghapus cookies kapan saja:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Anda dapat menyesuaikan pengaturan browser Anda untuk memberi tahu Anda saat cookies ditetapkan atau memblokirnya sama sekali.</li>
                    <li>Anda dapat menghapus semua cookies yang saat ini disimpan di perangkat Anda melalui pengaturan riwayat browser Anda.</li>
                </ul>
                <p className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 font-medium">
                    <strong>Peringatan:</strong> Jika Anda memblokir atau menghapus cookies yang sangat penting, fungsionalitas tertentu dari Layanan kami akan terganggu. Sebagai contoh, Anda tidak akan dapat masuk atau mengakses panel dashboard pengguna Anda.
                </p>
            </section>

            <section className="mb-12">
                <h2>6. Hubungi Kami</h2>
                <p>
                    Jika Anda memiliki pertanyaan mengenai penggunaan cookies kami atau kebijakan ini, silakan hubungi kami di:
                </p>
                <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="m-0 font-bold">Email: support@nyoo.me</p>
                </div>
            </section>
        </StaticPageLayout>
    );
}
