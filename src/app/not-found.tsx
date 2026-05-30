import Link from 'next/link';
import { Metadata } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHome, faBook } from '@fortawesome/free-solid-svg-icons';

export const metadata: Metadata = {
  title: '404 - Waduh, Halamannya Nggak Ketemu 🙈 | nyoo.me',
  description: 'Halaman yang kamu cari nggak ada atau linknya udah kadaluarsa.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300 overflow-hidden font-sans">
      
      {/* Injecting CSS Animations for smoother visuals without package overhead */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes float-shadow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(0.85); opacity: 0.1; }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-shadow { animation: float-shadow 4s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulse-soft 3s ease-in-out infinite; }
      `}</style>

      {/* Minimal Navbar */}
      <header className="relative z-50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 transition-transform active:scale-[0.98] group">
                        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <span className="font-bold text-white leading-none">n</span>
                        </div>
                        <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tighter">nyoo.me</span>
                    </Link>
                </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 relative">
        
        {/* Background Glowing Orb (Soft Animation) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-400/10 dark:bg-violet-600/5 rounded-full blur-3xl animate-pulse-soft pointer-events-none" />

        <div className="text-center max-w-md mx-auto z-10 w-full">
          
          {/* Animated Illustration Header */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-sm relative animate-float">
               <FontAwesomeIcon icon={faSearch} className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            {/* Shadow beneath float */}
            <div className="w-16 h-2 bg-slate-300 dark:bg-slate-800/80 rounded-full mx-auto mt-4 blur-sm animate-float-shadow" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
            Waduh, Halamannya Nggak Ketemu Nih 🙈
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            Short URL yang kamu akses rasanya udah <strong className="text-violet-600 dark:text-violet-400 font-bold">kadaluarsa</strong>, dihapus, atau emang salah ketik. Coba periksa lagi ya!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 h-12 px-6 bg-violet-600 text-white text-sm font-bold rounded-2xl hover:bg-violet-700 transition-all shadow-md shadow-violet-600/20 active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
              Balik ke Beranda
            </Link>
            <Link
              href="/guide"
              className="flex items-center justify-center gap-2 h-12 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faBook} className="w-4 h-4" />
              Baca Panduan
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center opacity-50 relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">© {new Date().getFullYear()} NYOO.ME</p>
      </footer>
    </div>
  );
}
