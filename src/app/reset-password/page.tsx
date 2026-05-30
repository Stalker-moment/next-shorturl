// src/app/reset-password/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faEye, faEyeSlash, faUnlockAlt, faArrowRight, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';

const ResetPasswordContent = () => {
    const router = useRouter();
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validation State
    const [isValidating, setIsValidating] = useState(true);
    const [tokenError, setTokenError] = useState<string | null>(null);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenError(t("auth.reset.err_token_missing"));
                setIsValidating(false);
                return;
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-reset-token/${token}`);
                const data = await res.json();

                if (!res.ok) {
                    setTokenError(data.error || t("auth.reset.err_token_invalid"));
                }
            } catch {
                setTokenError(t("auth.reset.err_token_network"));
            } finally {
                setIsValidating(false);
            }
        };

        verifyToken();
    }, [token, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error(t("auth.reset.toast_mismatch"));
            return;
        }

        if (password.length < 8) {
            toast.error(t("auth.reset.toast_length"));
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password })
            });

            if (res.ok) {
                toast.success(t("auth.reset.toast_success"));
                router.push('/login');
            } else {
                const data = await res.json();
                toast.error(data.error || t("auth.reset.err_token_invalid"));
            }
        } catch {
            toast.error(t("auth.register.err_network"));
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
                            <FontAwesomeIcon icon={faUnlockAlt} className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{t("auth.reset.title")}</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">{t("auth.reset.subtitle")}</p>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 p-8 sm:p-10 space-y-6 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        {isValidating ? (
                            <div className="py-10 text-center space-y-4">
                                <FontAwesomeIcon icon={faSpinner} className="w-10 h-10 text-violet-500 animate-spin mx-auto" />
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t("auth.reset.checking")}</p>
                            </div>
                        ) : tokenError ? (
                            <div className="text-center space-y-6 py-4">
                                <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl text-red-800 dark:text-red-400 text-sm font-bold leading-relaxed">
                                    {tokenError}
                                </div>
                                <Link 
                                    href="/forgot-password"
                                    className="block w-full h-14 rounded-2xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-violet-600/30"
                                >
                                    {t("auth.reset.request_new_btn")}
                                </Link>
                                <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800">
                                    <Link href="/login" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2">
                                        <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                                        {t("auth.reset.back_btn")}
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="new-password" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1">
                                        {t("auth.reset.password_label")}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="new-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder={t("auth.reset.password_placeholder")}
                                            className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500/20 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 p-2 transition-colors"
                                        >
                                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1">
                                        {t("auth.reset.confirm_password_label")}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="confirm-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            placeholder={t("auth.register.confirm_password_placeholder")}
                                            className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500/20 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 p-2 transition-colors"
                                        >
                                            <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full h-14 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] mt-2 ${
                                        loading ? 'bg-slate-400 dark:bg-slate-700 shadow-none cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/30'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                                            <span>{t("auth.reset.submit_loading")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t("auth.reset.submit")}</span>
                                            <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                                
                                <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800 mt-6">
                                    <Link href="/login" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2">
                                        <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                                        {t("auth.reset.back_btn")}
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center opacity-50 relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">© {new Date().getFullYear()} NYOO.ME</p>
            </footer>
        </div>
    );
};

const ResetPasswordPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><FontAwesomeIcon icon={faSpinner} className="w-10 h-10 text-violet-500 animate-spin" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
};

export default ResetPasswordPage;
