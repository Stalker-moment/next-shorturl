"use client";

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
      className="px-3 h-10 min-w-[3.5rem] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shrink-0 active:scale-95 shadow-sm text-xs font-bold gap-1"
      title={language === 'id' ? 'Change to English' : 'Ubah ke Bahasa Indonesia'}
    >
      <FontAwesomeIcon icon={faGlobe} className="text-violet-500 w-4 h-4 shrink-0" />
      <span>{language === 'id' ? 'ID' : 'EN'}</span>
    </button>
  );
}
