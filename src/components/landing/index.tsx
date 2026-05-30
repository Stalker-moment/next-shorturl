"use client";

// components/LandingUrlShortener.tsx
import React, { useState, FormEvent, useCallback, useMemo, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLink, faCopy, faCheck, faExclamationTriangle,
  faArrowRight, faGlobe, faShieldAlt, faRocket,
  faCog, faPaste, faPaintBrush, faQrcode, faXmark,
  faLock, faFire, faUsers, faEye, faEyeSlash, faUpload
} from '@fortawesome/free-solid-svg-icons';
import { CustomDropdown } from './CustomDropdown';
import FileUploadLanding from './FileUploadLanding';
import { DynamicQR, QR_TEMPLATES, type QrConfig } from '../DynamicQR';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

// --- Constants ---
const API_ENDPOINT_CREATE = "/api/guest/create";
const API_ENDPOINT_SETTING = "/api/guest/setting";
const COPY_TIMEOUT_MS = 2000;

// --- Type Definitions ---
interface ApiSuccessResponse {
  id: string;
  url: string;
  shortUrl: string;
  title: string | null;
  description: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
  useLanding: string;
  initialShowQR?: boolean;
}

interface ApiErrorResponse {
  error: string;
}

// --- Helper Functions ---
const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

// --- Result Card Component ---
interface ShortUrlResultProps {
  data: ApiSuccessResponse;
  onError: (message: string | null) => void;
  onDismiss: () => void;
}

const ShortUrlResult: React.FC<ShortUrlResultProps> = React.memo(({ data, onError, onDismiss }) => {
  const { t } = useLanguage();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isProtectModeEnabled, setIsProtectModeEnabled] = useState<boolean>(data.useLanding === 'true');
  const [isUpdatingSetting, setIsUpdatingSetting] = useState<boolean>(false);
  const [settingError, setSettingError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<boolean>(false);
  const [qrConfig, setQrConfig] = useState<QrConfig>(QR_TEMPLATES[0].config);

  useEffect(() => {
    if (data.initialShowQR) setShowQR(true);
  }, [data.initialShowQR]);

  useEffect(() => {
    setIsProtectModeEnabled(data.useLanding === 'true');
  }, [data.useLanding]);

  const { id, shortUrl, title, logo, url: originalUrl } = data;

  const fullShortUrl = useMemo(() => {
    if (typeof window !== 'undefined') return `${window.location.origin}/${shortUrl}`;
    return `/${shortUrl}`;
  }, [shortUrl]);

  const handleCopy = useCallback(async () => {
    if (!navigator.clipboard) { onError('Clipboard tidak tersedia.'); return; }
    try {
      await navigator.clipboard.writeText(fullShortUrl);
      setIsCopied(true);
      onError(null);
      setTimeout(() => setIsCopied(false), COPY_TIMEOUT_MS);
    } catch {
      onError('Gagal menyalin link.');
      setIsCopied(false);
    }
  }, [fullShortUrl, onError]);

  const handleToggleProtectMode = useCallback(async () => {
    setIsUpdatingSetting(true);
    setSettingError(null);
    const newVal = !isProtectModeEnabled;
    try {
      const response = await fetch(API_ENDPOINT_SETTING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data.shortUrl, useLanding: newVal }),
      });
      if (response.ok) {
        setIsProtectModeEnabled(newVal);
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as ApiErrorResponse)?.error || `Error ${response.status}`);
      }
    } catch (err: unknown) {
      setSettingError(err instanceof Error ? err.message : 'Gagal update.');
    } finally {
      setIsUpdatingSetting(false);
    }
  }, [isProtectModeEnabled, data.shortUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-lg overflow-hidden text-left w-full relative z-30"
      aria-live="polite"
    >
      {/* Short URL Row */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{t("landing.qr.link_short")}</p>
          <a
            href={fullShortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 dark:text-violet-400 font-bold text-base hover:underline truncate block leading-tight"
          >
            {fullShortUrl}
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isCopied
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400'
            }`}
          >
            <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className="w-3 h-3" />
            {isCopied ? t("landing.qr.copied") : t("landing.qr.copy")}
          </button>
          <button
            onClick={onDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={t("landing.qr.close")}
          >
            <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Origin URL + Logo */}
      {(title || originalUrl) && (
        <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {logo && (
            <Image
              src={logo}
              alt={title || 'Logo'}
              width={28}
              height={28}
              className="rounded-md border border-slate-200 dark:border-slate-700 object-contain bg-white shrink-0"
              unoptimized
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="min-w-0 flex-1">
            {title && <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{title}</p>}
            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <FontAwesomeIcon icon={faGlobe} className="w-2.5 h-2.5 shrink-0" />
              <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] hover:underline truncate">{originalUrl}</a>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="px-5 py-3 flex flex-wrap items-center gap-3">
        {/* Protect Mode Toggle */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={handleToggleProtectMode}
            disabled={isUpdatingSetting}
            className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors shrink-0 ${isProtectModeEnabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform shadow-sm ${isProtectModeEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{t("landing.protect_mode")}</span>
          {settingError && <span className="text-xs text-red-500 truncate">{settingError}</span>}
        </div>

        {/* QR Toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            showQR
              ? 'bg-violet-600 text-white border-violet-600'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600'
          }`}
        >
          <FontAwesomeIcon icon={faQrcode} className="w-3 h-3" />
          {t("nav.qrcode")}
        </button>

        {/* Manage Link */}
        <Link
          href={`/manage/${id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-all shadow-sm shadow-violet-500/20"
        >
          <FontAwesomeIcon icon={faCog} className="w-3 h-3" />
          {t("landing.qr.manage")}
        </Link>
      </div>

      {/* QR Panel (expandable) */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
          >
            <div className="px-5 py-4 flex flex-col sm:flex-row gap-5 items-center">
              <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 shrink-0">
                <DynamicQR data={fullShortUrl} config={qrConfig} size={120} />
              </div>
              <div className="flex-1 space-y-2.5 w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faPaintBrush} className="w-3 h-3" /> {t("landing.qr.style")}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QR_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => setQrConfig(tmpl.config)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        qrConfig === tmpl.config
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                      }`}
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
ShortUrlResult.displayName = 'ShortUrlResult';


// --- Main Landing Page Shortener Component ---
const LandingUrlShortener: React.FC = () => {
  const { language, t } = useLanguage();
  const [longUrl, setLongUrl] = useState<string>('');
  const [duration, setDuration] = useState<string>('7');
  const [shortenedUrlData, setShortenedUrlData] = useState<ApiSuccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [isPasteSupported, setIsPasteSupported] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qrcode' | 'subdomain' | 'pastebin' | 'upload'>('link');
  const [showProPrompt, setShowProPrompt] = useState(false);
  const { data: session } = useSession();
  const [subdomainQuery, setSubdomainQuery] = useState("");
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainResult, setSubdomainResult] = useState<{ available: boolean; message: string } | null>(null);
  const [baseDomains, setBaseDomains] = useState<{ id: string; domain: string }[]>([]);
  const [selectedBaseDomainId, setSelectedBaseDomainId] = useState<string>("");

  const router = useRouter();

  // Pastebin States
  const [pasteType, setPasteType] = useState<'url' | 'room'>('url');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [pasteLanguage, setPasteLanguage] = useState<string>('plaintext');
  const [pastePassword, setPastePassword] = useState<string>('');
  const [showPastePassword, setShowPastePassword] = useState<boolean>(false);
  const [pasteBurnAfterRead, setPasteBurnAfterRead] = useState<boolean>(false);
  const [roomName, setRoomName] = useState<string>('');
  const [pasteResult, setPasteResult] = useState<{ id: string; url: string; type: 'url' | 'room' } | null>(null);
  const [isCopiedPaste, setIsCopiedPaste] = useState<boolean>(false);

  const handlePasteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPasteResult(null);

    try {
      if (pasteType === 'url') {
        if (!pasteContent.trim()) {
          setError(language === 'en' ? 'Paste content cannot be empty.' : 'Isi paste tidak boleh kosong.');
          setIsLoading(false);
          return;
        }

        const payload = {
          title: "Paste - " + new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US'),
          content: pasteContent,
          language: pasteLanguage,
          expiresAt: duration === 'forever' ? null : new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString(),
          password: session ? (pastePassword || null) : null,
          burnAfterRead: session ? pasteBurnAfterRead : false,
          userId: session?.user ? (session.user as { id: string }).id : null
        };

        const res = await fetch("/api/paste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat paste.");

        const fullUrl = `${window.location.origin}/paste/${json.data.id}`;
        setPasteResult({ id: json.data.id, url: fullUrl, type: 'url' });
      } else {
        if (!roomName.trim()) {
          setError(language === 'en' ? 'Room name cannot be empty.' : 'Nama ruangan tidak boleh kosong.');
          setIsLoading(false);
          return;
        }

        const payload = {
          name: roomName,
          userId: session?.user ? (session.user as { id: string }).id : null
        };

        const res = await fetch("/api/paste/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat ruangan.");

        // Redirect directly to the realtime room
        router.push(`/paste/room/${json.data.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPasteUrl = async () => {
    if (!pasteResult) return;
    try {
      await navigator.clipboard.writeText(pasteResult.url);
      setIsCopiedPaste(true);
      setTimeout(() => setIsCopiedPaste(false), 2000);
    } catch (e) {
      setError('Gagal menyalin link.');
    }
  };

  const handleCheckSubdomain = async () => {
    if (!subdomainQuery.trim() || !selectedBaseDomainId) return;
    setIsCheckingSubdomain(true);
    setSubdomainResult(null);

    const prefix = subdomainQuery.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    if (prefix.length < 3) {
      setIsCheckingSubdomain(false);
      setSubdomainResult({
        available: false,
        message: language === 'en' 
          ? "Subdomain must be at least 3 characters." 
          : "Subdomain minimal terdiri dari 3 karakter."
      });
      return;
    }

    try {
      const res = await fetch(`/api/dns/subdomains/check?domainId=${selectedBaseDomainId}&subdomain=${prefix}`);
      const json = await res.json();
      if (res.ok) {
        if (json.available) {
          const domainObj = baseDomains.find(d => d.id === selectedBaseDomainId);
          const domainStr = domainObj ? domainObj.domain : "nyoo.me";
          setSubdomainResult({
            available: true,
            message: language === 'en'
              ? `🎉 ${prefix}.${domainStr} is available!`
              : `🎉 ${prefix}.${domainStr} tersedia!`
          });
        } else {
          setSubdomainResult({
            available: false,
            message: json.reason || (language === 'en'
              ? `❌ Subdomain is already taken or blocked!`
              : `❌ Subdomain sudah digunakan atau dilarang!`)
          });
        }
      } else {
        setSubdomainResult({
          available: false,
          message: json.error || (language === 'en' ? "Error checking availability." : "Gagal mengecek ketersediaan.")
        });
      }
    } catch (e) {
      console.error(e);
      setSubdomainResult({
        available: false,
        message: language === 'en' ? "Failed to reach server." : "Gagal terhubung ke server."
      });
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  useEffect(() => {
    setIsPasteSupported(!!(typeof window !== 'undefined' && navigator.clipboard?.readText));
    
    // Fetch active base domains for guest subdomain checker
    const fetchBaseDomains = async () => {
      try {
        const res = await fetch("/api/dns/domains");
        if (res.ok) {
          const json = await res.json();
          const domainsList = json.data || [];
          setBaseDomains(domainsList);
          if (domainsList.length > 0) {
            setSelectedBaseDomainId(domainsList[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load base domains for subdomain availability checker:", err);
      }
    };
    fetchBaseDomains();
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeTab !== 'link' && activeTab !== 'qrcode') return;
    setIsLoading(true);
    setError(null);
    setCopyError(null);
    setShortenedUrlData(null);

    let trimmedUrl = longUrl.trim();
    if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = "http://" + trimmedUrl;
    }

    if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
      setError(language === 'en' ? 'Enter a valid URL (starting with http:// or https://)' : 'Masukkan URL yang valid (mulai dengan http:// atau https://)');
      setIsLoading(false);
      return;
    }

    try {
      let endpoint = API_ENDPOINT_CREATE;
      let payload: Record<string, unknown> = { url: trimmedUrl, duration };

      if (session?.user) {
        const userId = (session.user as { id: string }).id;
        if (activeTab === 'link') {
          endpoint = "/api/user/urls";
          payload = { url: trimmedUrl, userId };
        } else {
          endpoint = "/api/user/qrcodes";
          payload = { url: trimmedUrl, userId, targetUrl: trimmedUrl, name: `QR - ${new Date().toLocaleDateString()}` };
        }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Gagal membuat link.");
      const rawData = await response.json();
      const data = (session?.user ? rawData.data : rawData) as ApiSuccessResponse;
      const finalShortUrl = data.shortUrl || (data as any).qrShortUrl;
      const finalId = data.id;

      if (finalShortUrl && finalId) {
        setShortenedUrlData({ ...data, shortUrl: finalShortUrl as string, id: finalId, initialShowQR: activeTab === 'qrcode' });
      } else {
        throw new Error("Data dari server tidak lengkap.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [longUrl, duration, activeTab, session, t]);

  const handleDurationChange = (val: string) => {
    if (val === "forever" && !session) { setShowProPrompt(true); return; }
    setDuration(val);
  };

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLongUrl(e.target.value);
    if (error) setError(null);
    if (copyError) setCopyError(null);
    if (shortenedUrlData) setShortenedUrlData(null);
  }, [error, copyError, shortenedUrlData]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLongUrl(text);
      if (error) setError(null);
      if (copyError) setCopyError(null);
    } catch { setError('Gagal membaca clipboard.'); }
  }, [error, copyError]);

  const handleDismiss = useCallback(() => {
    setShortenedUrlData(null);
    setError(null);
  }, []);

  return (
    <div className="w-full relative py-8 sm:py-16 overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div animate={{ x: [0, 40, 0], y: [0, 25, 0], scale: [1, 1.08, 1] }} transition={{ duration: 18, repeat: Infinity }} className="absolute -top-20 -left-20 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px]" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.15, 1] }} transition={{ duration: 22, repeat: Infinity, delay: 3 }} className="absolute top-1/3 -right-20 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">



        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="bg-white/70 dark:bg-slate-950/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800/70 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-violet-900/10 overflow-visible"
        >
          {/* Header */}
          <div className="px-6 pt-7 pb-5 sm:px-8 sm:pt-9 text-center">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[11px] font-bold mb-5 border border-violet-200/60 dark:border-violet-800/50">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
              </span>
              {t("landing.badge")}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.08] tracking-tighter mb-3">
              {t("landing.title_part1")}
              <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent italic inline-flex items-center gap-2 flex-wrap justify-center">
                {t("landing.title_part2")}
                <motion.span
                  animate={{ y: [0, -6, 0], rotate: [0, 12, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-violet-500 not-italic"
                >
                  <FontAwesomeIcon icon={faRocket} className="-rotate-45 text-2xl sm:text-4xl" />
                </motion.span>
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
              {activeTab === 'link'
                ? t("landing.desc.link")
                : activeTab === 'qrcode'
                  ? t("landing.desc.qrcode")
                  : activeTab === 'subdomain'
                    ? (language === 'en' ? "Claim your unique brand subdomain on nyoo.me" : "Klaim nama subdomain brand unik kamu di nyoo.me")
                    : activeTab === 'pastebin'
                      ? (language === 'en' ? "Create secure, temporary code or text snippets" : "Buat catatan atau cuplikan kode terenkripsi sementara")
                      : (language === 'en' ? "Upload direct download files in seconds" : "Unggah berkas untuk unduhan langsung secara instan")}
            </p>

            {/* Tab Switcher */}
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-slate-700/50 flex-wrap justify-center">
              {([
                { key: 'link', icon: faLink, label: t("landing.tab.link"), soon: false },
                { key: 'qrcode', icon: faQrcode, label: t("landing.tab.qrcode"), soon: false },
                { key: 'subdomain', icon: faGlobe, label: language === 'en' ? 'Subdomain' : 'Subdomain', soon: false },
                { key: 'pastebin', icon: faPaste, label: 'Pastebin', soon: false },
                { key: 'upload', icon: faUpload, label: language === 'en' ? 'Files' : 'Berkas', soon: false },
              ] as const).map(({ key, icon, label, soon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    activeTab === key ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {activeTab === key && (
                    <motion.div
                      layoutId="tabBg"
                      className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-sm"
                    />
                  )}
                  <FontAwesomeIcon icon={icon} className="relative z-10 w-3.5 h-3.5" />
                  <span className="relative z-10">{label}</span>
                  {soon && (
                    <span className="relative z-10 text-[8px] font-black tracking-widest uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded border border-amber-500/20 scale-75 select-none ml-0.5">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Form Area */}
          <div className="px-5 pb-5 sm:px-7 sm:pb-7">
            {activeTab === 'link' || activeTab === 'qrcode' ? (
              <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-transparent sm:bg-white sm:dark:bg-slate-950 sm:border sm:border-slate-200/80 sm:dark:border-slate-800 sm:rounded-2xl sm:p-1.5 transition-all shadow-sm focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10">
                  {/* Input */}
                  <div className="relative flex-1 min-w-0 bg-white dark:bg-slate-950 border border-slate-200/85 dark:border-slate-800 rounded-2xl sm:bg-transparent sm:border-none focus-within:ring-4 focus-within:ring-violet-500/10 sm:focus-within:ring-0 transition-all flex items-center h-12 sm:h-auto shadow-sm sm:shadow-none w-full">
                    <FontAwesomeIcon
                      icon={activeTab === 'link' ? faLink : faQrcode}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="url"
                      value={longUrl}
                      onChange={handleInputChange}
                      placeholder={activeTab === 'link' ? t("landing.placeholder.link") : t("landing.placeholder.qrcode")}
                      className="w-full pl-10 pr-8 h-12 text-sm bg-transparent border-none focus:ring-0 outline-none text-slate-800 dark:text-white placeholder-slate-400 font-medium"
                      disabled={isLoading}
                      autoComplete="off"
                    />
                    {isPasteSupported && !longUrl && (
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 px-1.5 py-0.5 rounded-md hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                      >
                        <FontAwesomeIcon icon={faPaste} className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Options row for mobile, integrated on desktop */}
                  <div className="flex items-center gap-2.5 sm:gap-2 w-full sm:w-auto shrink-0">
                    {/* Duration dropdown (guest only) */}
                    {!session && (
                      <div className="flex-grow sm:flex-grow-0 shrink-0 min-w-[120px]">
                        <CustomDropdown
                          value={duration}
                          onChange={handleDurationChange}
                          options={[
                            { value: "1", label: t("landing.days.1") },
                            { value: "3", label: t("landing.days.3") },
                            { value: "7", label: t("landing.days.7") },
                            { value: "30", label: t("landing.days.30") },
                            { value: "forever", label: t("landing.days.forever") + " 🔒" },
                          ]}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading || !longUrl.trim()}
                      className="flex-grow sm:flex-grow-0 shrink-0 flex items-center justify-center gap-1.5 px-6 h-12 bg-gradient-to-r from-violet-600 to-indigo-650 text-white rounded-2xl text-sm font-extrabold shadow-md shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{activeTab === 'link' ? t("landing.btn.link") : t("landing.btn.qrcode")}</span>
                          <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : activeTab === 'subdomain' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-left"
              >
                <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-transparent sm:bg-white sm:dark:bg-slate-950 sm:border sm:border-slate-200/80 sm:dark:border-slate-800 sm:rounded-2xl sm:p-1.5 transition-all shadow-sm focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10">
                  {baseDomains.length > 1 && (
                    <div className="w-full sm:w-auto min-w-[130px] px-2 shrink-0">
                      <CustomDropdown
                        value={selectedBaseDomainId}
                        onChange={(val) => {
                          setSelectedBaseDomainId(val);
                          setSubdomainResult(null);
                        }}
                        options={baseDomains.map(d => ({ value: d.id, label: d.domain.toUpperCase() }))}
                        className="w-full text-xs font-black uppercase tracking-wider"
                      />
                    </div>
                  )}
                  <div className="relative flex-1 min-w-0 bg-white dark:bg-slate-950 border border-slate-200/85 dark:border-slate-800 rounded-2xl sm:bg-transparent sm:border-none focus-within:ring-4 focus-within:ring-violet-500/10 sm:focus-within:ring-0 transition-all flex items-center h-12 sm:h-auto shadow-sm sm:shadow-none w-full">
                    <FontAwesomeIcon icon={faGlobe} className="absolute left-4 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder={language === 'en' ? "Enter subdomain..." : "Masukkan subdomain..."}
                      value={subdomainQuery}
                      onChange={(e) => {
                        setSubdomainQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        setSubdomainResult(null);
                      }}
                      className="w-full pl-10 pr-36 h-12 text-sm bg-transparent border-none focus:ring-0 outline-none text-slate-800 dark:text-white placeholder-slate-400 font-medium"
                    />
                    <span className="absolute right-4 text-xs font-bold text-violet-500 dark:text-violet-400 font-mono bg-violet-550/5 px-2 py-0.5 rounded border border-violet-500/10 uppercase tracking-wide">
                      {baseDomains.find(d => d.id === selectedBaseDomainId)?.domain ? `.${baseDomains.find(d => d.id === selectedBaseDomainId)?.domain}` : ".nyoo.me"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckSubdomain}
                    disabled={isCheckingSubdomain || !subdomainQuery.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 h-12 bg-gradient-to-r from-violet-600 to-indigo-650 text-white rounded-2xl text-sm font-extrabold shadow-md shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
                  >
                    {isCheckingSubdomain ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{language === 'en' ? 'Check' : 'Cek'}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {subdomainResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`p-4 rounded-2xl text-xs font-bold border flex flex-col gap-3 ${
                        subdomainResult.available
                          ? "bg-emerald-500/5 dark:bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/5 dark:bg-red-500/[0.03] border-red-500/20 text-red-600 dark:text-red-400"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{subdomainResult.available ? "🎉" : "❌"}</span>
                        <div className="flex-1">
                          <p className="text-xs font-extrabold">{subdomainResult.message}</p>
                          {subdomainResult.available && (
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">
                              {session ? (
                                language === 'en'
                                  ? "Subdomain is available! Click below to create it directly in your dashboard."
                                  : "Subdomain ini tersedia! Klik di bawah untuk langsung membuatnya di dashboard Anda."
                              ) : (
                                language === 'en'
                                  ? "Subdomain is available! Register an account now to claim it."
                                  : "Subdomain ini tersedia! Ayo klaim sekarang dengan mendaftar akun."
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {subdomainResult.available && (
                        <div className="pt-1.5 border-t border-emerald-500/10 flex justify-end">
                          {session ? (
                            <a
                              href={`/manage/dns?create=true&subdomain=${subdomainQuery}&domainId=${selectedBaseDomainId}`}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-600/10 active:scale-95 flex items-center gap-1.5"
                            >
                              <span>{language === 'en' ? "Create Now" : "Buat Sekarang"}</span>
                              <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                            </a>
                          ) : (
                            <a
                              href={`/register?callbackUrl=${encodeURIComponent(`/manage/dns?create=true&subdomain=${subdomainQuery}&domainId=${selectedBaseDomainId}`)}`}
                              className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-violet-600/10 active:scale-95 flex items-center gap-1.5"
                            >
                              <span>{language === 'en' ? "Claim & Register" : "Klaim & Daftar"}</span>
                              <FontAwesomeIcon icon={faRocket} className="text-[9px]" />
                            </a>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : activeTab === 'pastebin' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-left"
              >
                {/* Concept Toggler */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 border border-slate-200/50 dark:border-slate-700/50 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => { setPasteType('url'); setPasteResult(null); setError(null); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      pasteType === 'url'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faPaste} className="w-3.5 h-3.5" />
                    <span>Pastebin (URL)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPasteType('room'); setPasteResult(null); setError(null); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      pasteType === 'room'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5" />
                    <span>Realtime Room</span>
                  </button>
                </div>

                {pasteType === 'url' ? (
                  <form onSubmit={handlePasteSubmit} className="space-y-5">
                    {/* Paste Content Editor */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 shadow-inner">
                      <textarea
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                        placeholder={
                          language === 'en'
                            ? "Write or paste your code snippet here..."
                            : "Tulis atau tempel teks/kode Anda di sini..."
                        }
                        className="w-full h-36 p-4 text-xs font-mono bg-transparent border-none focus:ring-0 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none font-medium"
                      />
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Language Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                          Syntax Highlighting
                        </label>
                        <CustomDropdown
                          value={pasteLanguage}
                          onChange={(val) => setPasteLanguage(val)}
                          options={[
                            { value: "plaintext", label: "Plain Text" },
                            { value: "javascript", label: "JavaScript" },
                            { value: "typescript", label: "TypeScript" },
                            { value: "html", label: "HTML" },
                            { value: "css", label: "CSS" },
                            { value: "python", label: "Python" },
                            { value: "cpp", label: "C++" },
                            { value: "json", label: "JSON" }
                          ]}
                        />
                      </div>

                      {/* Expiration Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                          Expiration Duration
                        </label>
                        <CustomDropdown
                          value={duration}
                          onChange={handleDurationChange}
                          options={[
                            { value: "1", label: t("landing.days.1") },
                            { value: "3", label: t("landing.days.3") },
                            { value: "7", label: t("landing.days.7") },
                            { value: "30", label: t("landing.days.30") },
                            ...(session ? [{ value: "forever", label: t("landing.days.forever") + " 🔒" }] : [])
                          ]}
                        />
                      </div>

                      {/* Password Protection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                          Password Security {!session && "(Registered User Only)"}
                        </label>
                        <div className="relative">
                          <input
                            type={showPastePassword ? "text" : "password"}
                            placeholder={session ? "Masukkan sandi..." : "Sandi dinonaktifkan untuk tamu"}
                            value={pastePassword}
                            onChange={(e) => setPastePassword(e.target.value)}
                            disabled={!session}
                            className="w-full h-11 pl-4 pr-10 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          />
                          {session && (
                            <button
                              type="button"
                              onClick={() => setShowPastePassword(!showPastePassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors p-1"
                            >
                              <FontAwesomeIcon icon={showPastePassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Burn after read */}
                      <div className="flex items-center pt-5 px-1">
                        <label className={`flex items-center gap-2.5 text-xs font-bold select-none cursor-pointer ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <input
                            type="checkbox"
                            checked={session ? pasteBurnAfterRead : false}
                            onChange={(e) => setPasteBurnAfterRead(e.target.checked)}
                            disabled={!session}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-violet-600 focus:ring-violet-500 disabled:cursor-not-allowed cursor-pointer"
                          />
                          <span className="text-slate-700 dark:text-slate-300">
                            Sekali lihat langsung hangus {!session && "🔒"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !pasteContent.trim()}
                      className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-xs font-extrabold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2.5 transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPaste} className="w-3.5 h-3.5" />
                          <span>Buat Paste Nyoo</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePasteSubmit} className="space-y-5">
                    {/* Room Name Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                        Nama Ruangan Kolaborasi
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mabar Coding, Diskusi Pemrograman"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full h-12 px-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
                      />
                    </div>

                    {/* Room Capacity Limitations Box */}
                    <div className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed flex items-start gap-3 shadow-inner ${
                      session 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      <div className="text-base shrink-0">💡</div>
                      <div>
                        {session ? (
                          <>
                            <p className="font-extrabold uppercase tracking-wide text-[10px] mb-0.5">Akun Premium Terdeteksi</p>
                            <p className="font-semibold opacity-90">Ruangan kolaborasi Anda akan bersifat permanen, dan tidak ada batasan jumlah pengguna yang dapat terhubung bersamaan!</p>
                          </>
                        ) : (
                          <>
                            <p className="font-extrabold uppercase tracking-wide text-[10px] mb-0.5">Akses Kolaborasi Tamu (Guest)</p>
                            <p className="font-semibold opacity-90">Ruangan kolaborasi tamu dibatasi durasi aktif maksimal **1 jam**, dan kapasitas maksimal **3 user terhubung** secara bersamaan.</p>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !roomName.trim()}
                      className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-xs font-extrabold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2.5 transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5" />
                          <span>Buat Realtime Room & Masuk</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Pastebin Result Box */}
                <AnimatePresence>
                  {pasteResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Short URL Paste</p>
                          <a
                            href={pasteResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-600 dark:text-violet-400 font-extrabold text-sm hover:underline mt-1 block"
                          >
                            {pasteResult.url}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPasteResult(null)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                          <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {pasteBurnAfterRead && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 leading-none">
                            <FontAwesomeIcon icon={faFire} className="w-3.5 h-3.5 animate-pulse" />
                            <span>Paste Sekali Baca (Akan Hangus)</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyPasteUrl}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isCopiedPaste
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/30'
                          }`}
                        >
                          <FontAwesomeIcon icon={isCopiedPaste ? faCheck : faCopy} className="w-3 h-3" />
                          <span>{isCopiedPaste ? "Tersalin!" : "Salin Link"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-center w-full"
              >
                <FileUploadLanding isTab={true} />
              </motion.div>
            )}

            {/* Error */}
            <AnimatePresence>
              {(error || copyError) && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-3 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400"
                >
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3 shrink-0" />
                  {error || copyError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {shortenedUrlData && !isLoading && !error && (
                <ShortUrlResult
                  key={shortenedUrlData.id}
                  data={shortenedUrlData}
                  onError={setCopyError}
                  onDismiss={handleDismiss}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Footer CTAs — only show when NOT logged in */}
          {!session && (
            <div className="px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("landing.pro.unlimited")}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors px-2 py-1"
                >
                  {t("landing.pro.login")}
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-bold px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-all shadow-sm"
                >
                  {t("landing.pro.signup")}
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6">
          {[
            { icon: faShieldAlt, text: t("landing.trust.secure") },
            { icon: faRocket, text: t("landing.trust.redirect") },
            { icon: faQrcode, text: t("landing.trust.free_qr") },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600">
              <FontAwesomeIcon icon={icon} className="w-3 h-3" />
              <span className="text-xs font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Prompt Modal */}
      <AnimatePresence>
        {showProPrompt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProPrompt(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-sm p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl text-center"
            >
              <button
                onClick={() => setShowProPrompt(false)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
              <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-4 mx-auto text-violet-600 text-xl">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <h3 className="text-lg font-black mb-1.5 text-slate-900 dark:text-white">{t("landing.modal.title")}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                {t("landing.modal.desc")}
              </p>
              <Link
                href="/signup"
                className="block w-full py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 text-sm mb-2"
              >
                {t("landing.modal.signup")}
              </Link>
              <button
                onClick={() => setShowProPrompt(false)}
                className="w-full py-2.5 text-slate-400 dark:text-slate-500 text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {t("landing.modal.later")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingUrlShortener;