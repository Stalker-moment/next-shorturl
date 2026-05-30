// components/layout/Navbar.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const Navbar = () => {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { label: t('nav.features'), path: '/#features' },
    { label: t('nav.guide'), path: '/guide' },
    { label: t('nav.terms'), path: '/terms' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 z-[100] w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 shadow-sm'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-[4.5rem] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group transition-transform active:scale-95">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <FontAwesomeIcon icon={faLink} className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white">
              nyoo<span className="text-violet-500">.me</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 px-4 py-1.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 backdrop-blur-sm">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.path}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-all px-4 py-1.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            {session ? (
              <Link
                href="/manage"
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-all active:scale-95"
              >
                {t("nav.dashboard")}
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors px-3 py-2"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-md shadow-violet-500/20 transition-all active:scale-95"
                >
                  {t("nav.signup")}
                </Link>
              </div>
            )}

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[99] bg-slate-950/40 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-[4.5rem] left-0 right-0 z-[100] lg:hidden mx-4 mt-2"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/20 overflow-hidden">
                <nav className="p-4 space-y-1">
                  {navLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {!session && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-3 text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-3 text-sm font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20"
                    >
                      {t("nav.signup")}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
