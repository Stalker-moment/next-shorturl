"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faEye, faEyeSlash, faSpinner, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import GoogleSignInButton from '@/components/GoogleSignInButton';


const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  // Show error from NextAuth redirect param
  useEffect(() => {
    if (errorParam) {
      if (errorParam === 'OAuthAccountNotLinked' || errorParam === 'Callback') {
        setError(t("auth.login.err_google_callback"));
      } else {
        setError(t("auth.login.err_system"));
      }
    }
  }, [errorParam, t]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Selesaikan captcha dulu ya!');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        turnstileToken
      });

      console.log("SignIn Response:", res);

      if (res?.error) {
        setError(t("auth.login.err_credentials"));
        setLoading(false);
        setTurnstileToken(null);
        turnstileRef.current?.reset();
      } else {
        router.push('/manage');
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login component error:", err);
      setError(t("auth.login.err_system"));
      setLoading(false);
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  };

  const handleGoogleSuccess = () => {
    // Hard redirect ensures the new session cookie is picked up correctly.
    window.location.href = '/manage';
  };

  const handleGoogleError = (msg: string) => {
    setError(msg);
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
            <Link href="/signup" className="text-sm font-bold px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-900 shadow-sm">
              {t("auth.login.signup_btn")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10 w-full">
        <div className="w-full max-w-md">
          {/* Title Section */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
              {t("auth.login.title_part1")} <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-indigo-400">{t("auth.login.title_part2")}</span>
            </h1>
            <p className="text-slate-500 font-medium">{t("auth.login.subtitle")}</p>
          </div>

          {/* Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 p-8 sm:p-10 space-y-6 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            {error && (
              <div className="p-4 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Email + Password form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">
                  {t("auth.login.email_label")}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t("auth.login.password_label")}
                  </label>
                  <Link href="/forgot-password" className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-bold transition-colors">
                    {t("auth.login.forgot_password")}
                  </Link>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    autoComplete="current-password"
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

              <div className="flex justify-center py-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NODE_ENV === 'development' ? '1x00000000000000000000AA' : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "")}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: theme === 'dark' ? 'dark' : 'light' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-violet-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-violet-700 transition-all active:scale-[0.98] shadow-lg shadow-violet-600/30"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    <span>{t("auth.login.submit_loading")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("auth.login.submit")}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{t("auth.login.or")}</span>
              </div>
            </div>

            {/* Google Sign-In via GSI */}
            <GoogleSignInButton
              mode="login"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />

          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t("auth.login.signup_prompt")} <Link href="/signup" className="text-violet-600 dark:text-violet-400 font-bold hover:underline transition-colors ml-1">{t("auth.login.signup_link")}</Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center opacity-50">
        <p className="text-xs font-bold text-slate-500">© {new Date().getFullYear()} NYOO.ME</p>
      </footer>
    </div>
  );
};

export default LoginPage;