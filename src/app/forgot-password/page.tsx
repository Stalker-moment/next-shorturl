// src/app/forgot-password/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faKey, faPaperPlane, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';

const ForgotPasswordPage = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setSubmitted(true);
                toast.success(t("auth.forgot.toast_success"));
            } else {
                const data = await res.json();
                toast.error(data.error || t("auth.forgot.toast_error"));
            }
        } catch (error) {
            toast.error(t("auth.forgot.toast_network"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300 relative overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 dark:bg-violet-600/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[100px]" />
            </div>

            {/* Minimal Navbar */}
            <header className="relative z-50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 transition-transform active:scale-95 group">
                        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <FontAwesomeIcon icon={faLink} className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter">nyoo.me</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <LanguageToggle />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10 w-full">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-violet-200 dark:border-violet-800/50">
                            <FontAwesomeIcon icon={faKey} className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{t("auth.forgot.title")}</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">{t("auth.forgot.subtitle")}</p>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 p-8 sm:p-10 space-y-6 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1">
                                        {t("auth.forgot.email_label")}
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="nama@email.com"
                                        className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full h-14 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                                        loading ? 'bg-slate-400 dark:bg-slate-700 shadow-none cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/30'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{t("auth.forgot.submit_loading")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t("auth.forgot.submit")}</span>
                                            <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center space-y-6">
                                <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-2xl">
                                    <span className="text-3xl block mb-2">📬</span>
                                    <p className="text-green-800 dark:text-green-400 text-sm font-bold leading-relaxed">
                                        {t("auth.forgot.success_desc")}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSubmitted(false)}
                                    className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                                >
                                    {t("auth.forgot.retry_btn")}
                                </button>
                            </div>
                        )}

                        <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800 mt-6">
                            <Link href="/login" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center justify-center gap-2">
                                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                                {t("auth.forgot.back_btn")}
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center opacity-50 relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">© {new Date().getFullYear()} NYOO.ME</p>
            </footer>
        </div>
    );
};

export default ForgotPasswordPage;
