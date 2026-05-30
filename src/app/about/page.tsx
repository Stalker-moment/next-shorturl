// app/about/page.tsx
"use client";

import StaticPageLayout from '@/components/layout/StaticPageLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <StaticPageLayout 
                title="About nyoo.me" 
                subtitle="Our mission is to democratize access to professional link branding tools."
            >
                <section className="mb-12">
                    <h2>Who Are We?</h2>
                    <p>
                        nyoo.me was born out of the need for a URL shortener tool that is not only functional, 
                        but also prioritizes aesthetics and data traceability. We are a team of developers 
                        and designers who believe that every link you share is a representation 
                        of your brand.
                    </p>
                    <p>
                        Our platform is designed to support the modern digital ecosystem, ranging from 
                        individual content creators, MSMEs, to large-scale business entities.
                    </p>
                </section>

                <section className="mb-12">
                    <div className="p-10 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                        <h2 className="text-white mb-6 m-0 p-0 text-3xl">Our Mission</h2>
                        <p className="text-xl leading-relaxed font-medium m-0 opacity-90">
                            "Empowering every individual to have a professional digital identity 
                            through neat links, beautiful QR Codes, and meaningful analytics."
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2>Why Choose nyoo.me?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                        <div>
                            <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">Leading Design</h4>
                            <p className="text-sm">We do not compromise on visuals. Every element of our UI is designed to look modern and elegant on every screen.</p>
                        </div>
                        <div>
                            <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">Maximum Security</h4>
                            <p className="text-sm">Your privacy and data security are our top priorities. We use secure cloud infrastructure and high-level encryption.</p>
                        </div>
                        <div>
                            <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">Continuous Innovation</h4>
                            <p className="text-sm">We keep listening to user feedback to launch new features every month, from Biolink to API integrations.</p>
                        </div>
                        <div>
                            <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">Accessibility</h4>
                            <p className="text-sm">Our services can be accessed for free by anyone, with pro options for those who require more scalability.</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2>Location & Contact</h2>
                    <p>
                        Although we operate digitally on a global scale, our core team is based in Indonesia. 
                        If you want to collaborate or have any complaints, feel free to contact us.
                    </p>
                    <div className="flex items-center gap-4 mt-8">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black">@</div>
                        <div>
                            <p className="font-bold m-0 italic">support@nyoo.me</p>
                        </div>
                    </div>
                </section>
            </StaticPageLayout>
        );
    }

    return (
        <StaticPageLayout 
            title="About nyoo.me" 
            subtitle="Misi kami adalah mendemokratisasi akses ke alat branding tautan profesional."
        >
            <section className="mb-12">
                <h2>Siapa Kami?</h2>
                <p>
                    nyoo.me lahir dari kebutuhan akan alat pemendek URL yang tidak hanya fungsional, 
                    tetapi juga mengutamakan estetika dan keterlacakan data. Kami adalah tim pengembang 
                    dan desainer yang percaya bahwa setiap link yang Anda bagikan adalah representasi 
                    dari brand Anda.
                </p>
                <p>
                    Platform kami dirancang untuk mendukung ekosistem digital modern, mulai dari 
                    kreator konten individu, UMKM, hingga entitas bisnis skala besar.
                </p>
            </section>

            <section className="mb-12">
                <div className="p-10 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                    <h2 className="text-white mb-6 m-0 p-0 text-3xl">Misi Kami</h2>
                    <p className="text-xl leading-relaxed font-medium m-0 opacity-90">
                        "Memberdayakan setiap individu untuk memiliki identitas digital yang profesional 
                        melalui link yang rapi, QR Code yang indah, dan analitik yang bermakna."
                    </p>
                </div>
            </section>

            <section className="mb-12">
                <h2>Kenapa Memilih nyoo.me?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    <div>
                        <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">Desain Terdepan</h4>
                        <p className="text-sm">Kami tidak berkompromi soal visual. Setiap elemen UI kami dirancang agar terlihat modern dan elegan di setiap layar.</p>
                    </div>
                    <div>
                        <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">Keamanan Maksimal</h4>
                        <p className="text-sm">Privasi dan keamanan data Anda adalah prioritas utama. Kami menggunakan infrastruktur cloud yang aman dan enkripsi tingkat tinggi.</p>
                    </div>
                    <div>
                        <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">Inovasi Berkelanjutan</h4>
                        <p className="text-sm">Kami terus mendengarkan masukan pengguna untuk meluncurkan fitur-fitur baru setiap bulannya, mulai dari Biolink hingga integrasi API.</p>
                    </div>
                    <div>
                        <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2">Aksesibilitas</h4>
                        <p className="text-sm">Layanan kami dapat diakses secara gratis oleh siapa saja, dengan opsi pro bagi mereka yang membutuhkan skalabilitas lebih.</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2>Lokasi & Kontak</h2>
                <p>
                    Meskipun kami beroperasi secara digital secara global, tim inti kami berbasis di Indonesia. 
                    Jika Anda ingin berkolaborasi atau memiliki keluhan, jangan ragu untuk menghubungi kami.
                </p>
                <div className="flex items-center gap-4 mt-8">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black">@</div>
                    <div>
                        <p className="font-bold m-0 italic">support@nyoo.me</p>
                    </div>
                </div>
            </section>
        </StaticPageLayout>
    );
}
