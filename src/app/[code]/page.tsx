'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, notFound } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faSearch, faSpinner, faHome, faLock, faUnlockAlt } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const RedirectPage = () => {
  const router = useRouter();
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname(); // /abc123
  const code = pathname?.split('/')[1]; // Ambil kode dari URL path

  const resolveUrl = async (providedPassword?: string) => {
    if (!code) return;
    setIsSubmitting(true);
    setPasswordError('');

    try {
        const url = providedPassword 
          ? `/api/resolve-url/${code}?password=${encodeURIComponent(providedPassword)}`
          : `/api/resolve-url/${code}`;
        
        const res = await fetch(url);
        if (res.status === 401) {
          setPasswordRequired(true);
          if (providedPassword) {
            setPasswordError('Password salah, silakan coba lagi!');
          }
          setIsSubmitting(false);
          return;
        }
        if (res.status === 403) {
          setErrorStatus(403);
          setIsSubmitting(false);
          return;
        }
        if (res.status === 410) {
          setErrorStatus(410);
          setIsSubmitting(false);
          return;
        }
        if (res.status === 404) {
          setErrorStatus(404);
          setIsSubmitting(false);
          return;
        }
        if (!res.ok) {
          throw new Error();
        }

        const data = await res.json();

        if (data.useLanding) {
          const confirmUrl = providedPassword 
            ? `/confirm/${code}?password=${encodeURIComponent(providedPassword)}`
            : `/confirm/${code}`;
          router.replace(confirmUrl);
        } else {
          window.location.href = data.url;
        }
    } catch(e) {
        setErrorStatus(404);
    } finally {
        setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Abaikan jika kode adalah reserved keywords static, atau picu notFound
    const RESERVED_SLUGS = ['login', 'signup', 'register', 'dashboard', 'manage', 'guide', 'terms', 'privacy', '404'];
    if (code && RESERVED_SLUGS.includes(code.toLowerCase())) {
      notFound();
      return;
    }

    resolveUrl();
  }, [code]);

  if (errorStatus === 410) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 shadow-2xl shadow-amber-500/10 dark:shadow-none">
          <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100 dark:border-amber-800/50">
             <FontAwesomeIcon icon={faBan} className="w-10 h-10 text-amber-500 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Tautan Kedaluwarsa ⌛</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-10">
            Aduh, tautan pendek yang kamu cari ini sudah kedaluwarsa atau tidak aktif lagi karena batas waktunya sudah habis.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
            Balik ke Beranda Aja
          </button>
        </div>
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-2xl shadow-red-500/10 dark:shadow-none">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-100 dark:border-red-800/50">
             <FontAwesomeIcon icon={faBan} className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Waduh, Link Dinonaktifkan 🚫</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-10">
            Maaf banget, link ini dinonaktifkan sementara sama admin karena melanggar aturan atau udah nggak aktif nih.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
            Balik ke Beranda Aja
          </button>
        </div>
      </div>
    );
  }

  if (errorStatus === 404) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-700">
             <FontAwesomeIcon icon={faSearch} className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Yah, Linknya Gak Ketemu 🔍</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-10">
            Hmm, rasanya link yang kamu cari ini nggak ada atau udah kehapus deh. Coba cek lagi URL-nya ya!
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full h-14 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
            Balik ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (passwordRequired && errorStatus === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-md bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/80 dark:shadow-none text-center">
          <div className="w-20 h-20 bg-violet-50 dark:bg-violet-950/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-100 dark:border-violet-900/30">
             <FontAwesomeIcon icon={faLock} className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-bounce" />
          </div>
          
          <h1 className="text-2xl font-black mb-2 tracking-tight">Halaman Terproteksi 🔒</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
            Tautan pendek ini dilindungi sandi. Silakan masukkan password untuk membuka halaman tujuan.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); resolveUrl(password); }} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 font-medium text-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                autoFocus
              />
            </div>
            
            {passwordError && (
              <p className="text-red-500 dark:text-red-400 text-xs font-bold text-left ml-2 animate-shake">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUnlockAlt} className="w-4 h-4" />
                  Buka Halaman
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => router.push('/')}
              className="w-full h-12 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 mb-8">
              <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Mengarahkan kamu... 🚀</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tunggu sebentar ya, lagi siap-siap meluncur.</p>
          <div className="mt-8 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
             <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest leading-none">ID: {code}</p>
          </div>
      </div>
    </div>
  );
};

export default RedirectPage;