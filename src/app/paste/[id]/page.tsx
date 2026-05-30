'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLock, faUnlockAlt, faSpinner, faHome, 
  faCopy, faCheck, faFire, faCode, faCalendarAlt, 
  faEye, faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

// PrismJS Syntax Highlighting
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-markup'; // XML/HTML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-json';

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const highlightLine = (line: string, lang: string): string => {
  if (!line) return '&nbsp;'; // Preserve empty lines visually
  const normalizedLang = lang.toLowerCase();
  
  let grammar: Prism.Grammar | undefined;
  if (normalizedLang === 'javascript' || normalizedLang === 'js') {
    grammar = Prism.languages.javascript;
  } else if (normalizedLang === 'typescript' || normalizedLang === 'ts') {
    grammar = Prism.languages.typescript;
  } else if (normalizedLang === 'html' || normalizedLang === 'xml' || normalizedLang === 'markup') {
    grammar = Prism.languages.markup;
  } else if (normalizedLang === 'css') {
    grammar = Prism.languages.css;
  } else if (normalizedLang === 'python' || normalizedLang === 'py') {
    grammar = Prism.languages.python;
  } else if (normalizedLang === 'cpp' || normalizedLang === 'c++' || normalizedLang === 'c') {
    grammar = Prism.languages.cpp || Prism.languages.c;
  } else if (normalizedLang === 'json') {
    grammar = Prism.languages.json;
  }

  if (grammar) {
    try {
      return Prism.highlight(line, grammar, normalizedLang);
    } catch (e) {
      return escapeHtml(line);
    }
  }
  
  return escapeHtml(line);
};

interface PasteData {
  id: string;
  title: string | null;
  content: string;
  language: string;
  expiresAt: string | null;
  burnAfterRead: boolean;
  views: number;
  createdAt: string;
}

export default function PasteViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [paste, setPaste] = useState<PasteData | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fetchPaste = async (providedPassword?: string) => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setPasswordError('');

    try {
      const res = await fetch(`/api/paste/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: providedPassword || undefined })
      });

      const json = await res.json();

      if (res.status === 401 && json.requiresPassword) {
        setRequiresPassword(true);
        if (providedPassword) {
          setPasswordError(json.error || 'Password salah, silakan coba lagi!');
        }
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat paste.");
      }

      setPaste(json.data);
      setRequiresPassword(false);
    } catch (err: any) {
      setError(err.message || "Paste tidak ditemukan atau sudah dihapus.");
    } finally {
      setIsLoading(false);
      setIsSubmittingPassword(false);
    }
  };

  useEffect(() => {
    fetchPaste();
  }, [id]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsSubmittingPassword(true);
    fetchPaste(password);
  };

  const handleCopyCode = async () => {
    if (!paste) return;
    try {
      await navigator.clipboard.writeText(paste.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      // fallback
    }
  };

  if (isLoading && !isSubmittingPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white dark:bg-slate-900 shadow-xl rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 mb-8">
            <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Memuat Paste Nyoo... 🚀</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sedang mengambil catatan terenkripsi.</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl text-center">
          <div className="w-20 h-20 bg-violet-50 dark:bg-violet-950/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-100 dark:border-violet-900/30">
            <FontAwesomeIcon icon={faLock} className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          
          <h1 className="text-2xl font-black mb-2 tracking-tight">Paste Terproteksi 🔒</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
            Paste ini dilindungi kata sandi. Silakan masukkan password untuk membaca konten di dalamnya.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Masukkan kata sandi..."
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
              disabled={isSubmittingPassword || !password.trim()}
              className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmittingPassword ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  Membuka enkripsi...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUnlockAlt} className="w-4 h-4" />
                  Buka Konten
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              href="/"
              className="w-full h-12 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-700">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Yah, Paste Gak Ditemukan 🔍</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-10">
            {error}
          </p>
          <Link
            href="/"
            className="w-full h-14 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const lines = paste?.content.split('\n') || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden pb-12 sm:pb-24">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 pt-8 sm:pt-16 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest leading-none">
              Paste Nyoo Viewer
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {paste?.title || "Untitled Paste"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faCode} className="w-3.5 h-3.5" />
                <span className="capitalize font-bold text-slate-700 dark:text-slate-300">{paste?.language}</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="w-3.5 h-3.5" />
                <span>{paste ? new Date(paste.createdAt).toLocaleString() : ''}</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
                <span>{paste?.views} views</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Link
              href={`/report?type=paste&slug=${id}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-red-500/10 hover:bg-red-650 border border-red-500/20 text-red-500 hover:text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5" />
              <span>Laporkan</span>
            </Link>
            <button
              onClick={handleCopyCode}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                isCopied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className="w-3.5 h-3.5" />
              <span>{isCopied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
            <Link
              href="/"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-violet-500/10"
            >
              <FontAwesomeIcon icon={faHome} className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>
          </div>
        </div>

        {/* Burn After Read Alert */}
        {paste?.burnAfterRead && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-3 shadow-md animate-pulse">
            <FontAwesomeIcon icon={faFire} className="text-lg shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase tracking-wider text-[10px] mb-0.5">PERINGATAN SEKALI BACA (BURN AFTER READ)</p>
              <p className="font-semibold opacity-90 leading-relaxed">
                Catatan ini dikonfigurasi untuk sekali baca saja. Setelah halaman ini ditutup, di-refresh, atau Anda berpindah halaman, isi catatan ini akan terhapus secara permanen dan tidak dapat diakses kembali oleh siapapun!
              </p>
            </div>
          </div>
        )}

        {/* Code Content Box */}
        <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative group">
          <div className="flex items-center justify-between px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>{paste?.language || 'plaintext'} editor view</span>
            <span className="text-slate-600 font-mono">{lines.length} lines</span>
          </div>

          <div className="overflow-x-auto p-6 font-mono text-xs sm:text-sm leading-relaxed custom-scrollbar max-h-[600px]">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                    <td className="w-10 pr-4 text-right text-slate-600 select-none font-semibold border-r border-slate-800/60 leading-normal">
                      {index + 1}
                    </td>
                    <td 
                      className="pl-6 whitespace-pre leading-normal font-medium text-slate-300 antialiased font-mono"
                      dangerouslySetInnerHTML={{ __html: highlightLine(line, paste?.language || 'plaintext') }}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
