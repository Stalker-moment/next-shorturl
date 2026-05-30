// components/layout/Footer.tsx
"use client";
import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/contexts/LanguageContext';

const SOCIAL_LINKS = [
  { label: 'Twitter', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'GitHub', href: '#' },
];

const Footer = () => {
  const { t, language } = useLanguage();

  const productLinks = [
    { label: t('footer.link.features'), href: '/#features' },
    { label: t('footer.link.biolink'), href: '/biolink' },
    { label: t('footer.link.qrcode'), href: '/qr' },
    { label: t('footer.link.api'), href: '/api-docs' },
  ];

  const helpLinks = [
    { label: t('footer.link.guide'), href: '/guide' },
    { label: t('footer.link.terms'), href: '/terms' },
    { label: t('footer.link.privacy'), href: '/privacy' },
    { label: t('footer.link.cookies'), href: '/cookies' },
    {
      label: language === 'id' ? 'Laporkan Penyalahgunaan' : 'Report Abuse',
      href: '/report',
      isSpecial: true,
    },
  ];

  return (
    <footer className="bg-white dark:bg-slate-950 pt-16 pb-8 border-t border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-20 bg-violet-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10">
        {/* Main grid: brand (2/5) + 3 link columns (1/5 each) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand Column */}
          <div className="col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <FontAwesomeIcon icon={faLink} className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white">
                nyoo<span className="text-violet-500">.me</span>
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed font-medium text-sm">
              {t("footer.desc")}
            </p>
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="text-xs font-bold text-slate-400 dark:text-slate-550 hover:text-violet-650 dark:hover:text-violet-400 transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Spacer on mobile, visible on md+ */}
          <div className="hidden md:block" />

          {/* Produk */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">{t("footer.header.products")}</h4>
            <ul className="space-y-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">{t("footer.header.help")}</h4>
            <ul className="space-y-3">
              {helpLinks.map((l: any) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className={`text-sm font-medium transition-all ${
                      l.isSpecial
                        ? "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-extrabold"
                        : "text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-7 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-600">
            &copy; {new Date().getFullYear()} <span className="font-bold">NYOO.ME</span> — {t("footer.made_with")}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-300 dark:text-slate-700">
            <span className="font-medium">v1.0.0</span>
            <span className="mx-1.5">·</span>
            <Link href="/terms" className="hover:text-violet-500 transition-colors">{t("footer.link.terms_short")}</Link>
            <span className="mx-1.5">·</span>
            <Link href="/privacy" className="hover:text-violet-500 transition-colors">{t("footer.link.privacy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
