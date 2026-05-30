// app/features/page.tsx
"use client";

import StaticPageLayout from '@/components/layout/StaticPageLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faGlobe, faLayerGroup, faQrcode 
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FeaturesPage() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <StaticPageLayout 
                title="Our Features" 
                subtitle="Explore our advanced ecosystem of tools for URL shortening and link branding."
            >
                <section className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2>1. Real-time Analytics</h2>
                            <p>
                                Understand your audience with in-depth analytics. We compile every click 
                                based on geographic location, browser type, operating system, and the origin referrer of your link.
                            </p>
                            <ul className="list-disc pl-5 mt-6 space-y-2 font-bold text-sm">
                                <li className="text-indigo-600 dark:text-indigo-400">Total Clicks & Unique Visitors</li>
                                <li className="text-indigo-600 dark:text-indigo-400">Country & City Breakdown</li>
                                <li className="text-indigo-600 dark:text-indigo-400">Browser & Device Statistics</li>
                            </ul>
                        </div>
                       <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-12 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center">
                            <FontAwesomeIcon icon={faChartLine} className="text-8xl text-indigo-500 opacity-60" />
                       </div>
                    </div>
                </section>

                <section className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="md:order-last">
                            <h2>2. Dynamic QR Codes</h2>
                            <p>
                                Convert your links into aesthetic QR Codes. You can customize every aspect 
                                of your QR Code, ranging from colors, dot patterns, to adding your own brand logo 
                                in the center of the QR.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 p-12 rounded-3xl border border-fuchsia-100 dark:border-fuchsia-900/40 flex items-center justify-center">
                            <FontAwesomeIcon icon={faQrcode} className="text-8xl text-fuchsia-500 opacity-60" />
                        </div>
                    </div>
                </section>

                <section className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2>3. Stunning Biolink Pages</h2>
                            <p>
                                One link to share everything. Build a beautiful profile landing page 
                                with a collection of your social media links, portfolio, and more. Highly responsive 
                                and optimized for mobile devices.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-12 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center">
                            <FontAwesomeIcon icon={faLayerGroup} className="text-8xl text-emerald-500 opacity-60" />
                        </div>
                    </div>
                </section>

                <section className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="md:order-last">
                            <h2>4. Custom Alias & Branding</h2>
                            <p>
                                Build trust with human-readable links. Instead of getting a random 
                                link, you can set a custom alias like <em>nyoo.me/march-promo</em> 
                                to strengthen your brand recognition.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-12 rounded-3xl border border-orange-100 dark:border-orange-900/40 flex items-center justify-center">
                            <FontAwesomeIcon icon={faGlobe} className="text-8xl text-orange-500 opacity-60" />
                        </div>
                    </div>
                </section>

                <div className="text-center mt-32 p-16 bg-slate-900 dark:bg-indigo-950 rounded-[3rem] text-white">
                    <h2 className="text-white mb-6 m-0 p-0 text-3xl md:text-4xl">Ready to Upgrade Your Links?</h2>
                    <p className="text-slate-300 mb-10 max-w-lg mx-auto">Start your professional link branding journey today with a free account registration.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="/signup" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black no-underline hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">Sign Up Now</a>
                        <a href="/login" className="px-10 py-4 bg-white/10 text-white rounded-2xl font-black no-underline hover:bg-white/20 backdrop-blur-md transition-all border border-white/20">Log In</a>
                    </div>
                </div>
            </StaticPageLayout>
        );
    }

    return (
        <StaticPageLayout 
            title="Our Features" 
            subtitle="Jelajahi ekosistem alat canggih untuk memperpendek URL dan branding link."
        >
            <section className="mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2>1. Real-time Analytics</h2>
                        <p>
                            Pelajari siapa audiens Anda dengan analitik yang mendalam. Kami merekap setiap klik 
                            berdasarkan letak geografis, tipe browser, sistem operasi, hingga origin dari referer tautan Anda.
                        </p>
                        <ul className="list-disc pl-5 mt-6 space-y-2 font-bold text-sm">
                            <li className="text-indigo-600 dark:text-indigo-400">Total Klik & Unique Visitors</li>
                            <li className="text-indigo-600 dark:text-indigo-400">Perincian Negara & Kota</li>
                            <li className="text-indigo-600 dark:text-indigo-400">Statistik Browser & Device</li>
                        </ul>
                    </div>
                   <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-12 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center">
                        <FontAwesomeIcon icon={faChartLine} className="text-8xl text-indigo-500 opacity-60" />
                   </div>
                </div>
            </section>

            <section className="mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="md:order-last">
                        <h2>2. Dynamic QR Codes</h2>
                        <p>
                            Ubah link Anda menjadi QR Code yang estetik. Anda dapat menyesuaikan setiap aspek 
                            dari QR Code Anda, mulai dari warna, pola titik, hingga menambahkan logo brand Anda 
                            sendiri di bagian tengah QR.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 p-12 rounded-3xl border border-fuchsia-100 dark:border-fuchsia-900/40 flex items-center justify-center">
                        <FontAwesomeIcon icon={faQrcode} className="text-8xl text-fuchsia-500 opacity-60" />
                    </div>
                </div>
            </section>

            <section className="mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2>3. Stunning Biolink Pages</h2>
                        <p>
                            Satu tautan untuk membagikan segalanya. Bangun landing page profil yang indah 
                            dengan daftar tautan media sosial, portofolio, dan lainnya. Sangat responsif 
                            dan dioptimalkan untuk perangkat seluler.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-12 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center">
                        <FontAwesomeIcon icon={faLayerGroup} className="text-8xl text-emerald-500 opacity-60" />
                    </div>
                </div>
            </section>

            <section className="mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="md:order-last">
                        <h2>4. Custom Alias & Branding</h2>
                        <p>
                            Bangun kepercayaan dengan link yang dapat dibaca manusia. Alih-alih mendapatkan 
                            link acak, Anda dapat menetapkan alias kustom seperti <em>nyoo.me/promo-maret</em> 
                            untuk memperkuat pengenalan brand Anda.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-12 rounded-3xl border border-orange-100 dark:border-orange-900/40 flex items-center justify-center">
                        <FontAwesomeIcon icon={faGlobe} className="text-8xl text-orange-500 opacity-60" />
                    </div>
                </div>
            </section>

            <div className="text-center mt-32 p-16 bg-slate-900 dark:bg-indigo-950 rounded-[3rem] text-white">
                <h2 className="text-white mb-6 m-0 p-0 text-3xl md:text-4xl">Siap Meningkatkan Link Anda?</h2>
                <p className="text-slate-300 mb-10 max-w-lg mx-auto">Mulai perjalanan profesional branding Anda hari ini dengan pendaftaran akun gratis.</p>
                <div className="flex flex-wrap justify-center gap-4">
                    <a href="/signup" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black no-underline hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">Daftar Sekarang</a>
                    <a href="/login" className="px-10 py-4 bg-white/10 text-white rounded-2xl font-black no-underline hover:bg-white/20 backdrop-blur-md transition-all border border-white/20">Masuk Akun</a>
                </div>
            </div>
        </StaticPageLayout>
    );
}
