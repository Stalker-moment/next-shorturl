"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ConfirmationCard from '@/components/card';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';

const ConfirmRedirectPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params?.code as string;
  const password = searchParams?.get('password') || '';

  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Link konfirmasinya nggak valid nih.");
      setIsLoading(false);
      return;
    }

    const fetchUrlInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = password 
          ? `/api/url-info/${code}?password=${encodeURIComponent(password)}`
          : `/api/url-info/${code}`;
        const response = await fetch(url);

        if (response.status === 401 || response.status === 410) {
          router.replace(`/${code}`);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Gagal ambil info URL (${response.status})`);
        }

        if (!data.originalUrl) {
            throw new Error("URL aslinya nggak ketemu di database.");
        }

        setTargetUrl(data.originalUrl);

      } catch (err: unknown) {
        console.error("Failed to fetch target URL:", err);
        if (err instanceof Error) {
          setError(err.message || "Gagal load detail redirect-nya.");
        } else {
          setError("Ada error yang nggak diketahui nih.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrlInfo();
  }, [code, password, router]);

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 font-sans">
         <div className="text-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 mx-auto mb-6">
               <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-violet-600 dark:text-violet-400 animate-spin" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Lagi nyiapin halamannya ya...</p>
         </div>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
       <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 font-sans">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-2xl shadow-red-500/10 dark:shadow-none text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-800/50">
                   <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-red-500 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Oops, Ada Masalah!</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">
                   {error}
                </p>
                <button 
                  onClick={() => router.push('/')}
                  className="w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
                  Balik ke Beranda Aja
                </button>
            </div>
        </div>
    );
  }

  // --- Render Confirmation Card (Success State) ---
  if (targetUrl) {
    return (
      <>
        <Head>
          <title>Mau lanjutin ke halaman ini? | nyoo.me</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden font-sans">
          {/* Background Ambience */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 w-full flex justify-center">
            <ConfirmationCard url={targetUrl} />
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default ConfirmRedirectPage;