"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faCheck,
  faExclamationTriangle,
  faCalendarAlt,
  faGlobe,
  faArrowLeft,
  faExternalLinkAlt,
  faTimes,
  faChartLine,
  faFingerprint,
  faCompass,
  faMobileAlt,
  faQrcode,
  faSpinner,
  faMapMarkedAlt,
  faExpandAlt,
  faMapMarkerAlt,
  faLocationArrow,
  faInfoCircle,
  faDesktop,
  faLock,
  faDownload
} from "@fortawesome/free-solid-svg-icons";
import dynamic from 'next/dynamic';
import { useLanguage } from "@/contexts/LanguageContext";
import { COUNTRY_DATA } from "@/components/AnalyticsMap";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const QRCodeCanvas = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeCanvas),
  { ssr: false }
);

const AnalyticsMap = dynamic(
  () => import('@/components/AnalyticsMap'),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 dark:bg-black/20 animate-pulse rounded-2xl flex items-center justify-center text-xs font-bold text-slate-500 dark:text-zinc-600">Memuat Peta...</div> }
);

// --- Type Definitions ---
interface AnalyticsItem {
  id: string;
  ip: string | null;
  userAgent: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  referer: string | null;
  createdAt: string;
}

interface ApiLinkDetail {
 id: string;
 url: string;
 shortUrl: string;
 title: string | null;
 description: string | null;
 logo: string | null;
 createdAt: string;
 updatedAt: string;
 useLanding: string; 
 views?: number;
 password?: string | null;
 type?: 'shorturl' | 'biolink';
 isActive?: boolean;
 isTakedown?: boolean;
 expiresAt?: string | null;
 analytics?: AnalyticsItem[];
 qrCodes?: Array<{
 id: string;
 name: string;
 qrShortUrl: string;
 views: number;
 styleConfig: string | null;
 }>;
}

// --- Helper Functions ---
const formatDate = (dateString: string) => {
 try {
 return new Intl.DateTimeFormat("id-ID", {
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 }).format(new Date(dateString));
 } catch { return "N/A"; }
 };

const getApiEndpointForLink = (id: string) => `/api/links/${id}`;
const getApiEndpointForSetting = `/api/user/setting`;

export default function ManageLinkPage() {
 const router = useRouter();
 const pathname = usePathname();
 const id = pathname?.split('/').pop();
 const { data: session } = useSession();

 const { language } = useLanguage();
 const [linkData, setLinkData] = useState<ApiLinkDetail | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const [isProtectModeEnabled, setIsProtectModeEnabled] = useState(false);
 const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);
 const [isDeleting, setIsDeleting] = useState(false);
 const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
 const [isCopied, setIsCopied] = useState(false);
 const [selectedAnalytics, setSelectedAnalytics] = useState<AnalyticsItem | null>(null);
 const [isMapExpanded, setIsMapExpanded] = useState(false);
 const [isExporting, setIsExporting] = useState(false);

 const [destinationInput, setDestinationInput] = useState("");
 const [slugInput, setSlugInput] = useState("");
 const [passwordInput, setPasswordInput] = useState("");
 const [expiresAtInput, setExpiresAtInput] = useState("");
 const [descriptionInput, setDescriptionInput] = useState("");
 const [isSavingProperties, setIsSavingProperties] = useState(false);
 const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

 const [activeActivityTab, setActiveActivityTab] = useState<'clicks' | 'audit'>('clicks');
 const [auditLogs, setAuditLogs] = useState<any[]>([]);
 const [isLoadingLogs, setIsLoadingLogs] = useState(false);

 // Appeals System States
 const [appeals, setAppeals] = useState<any[]>([]);
 const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
 const [appealReason, setAppealReason] = useState("");
 const [appealProof, setAppealProof] = useState("");

 // --- Aggregate Data ---
 const aggregatedData = useMemo(() => {
 if (!linkData?.analytics) return null;
 const analytics = linkData.analytics;

 // Traffic Over Time (Last 14 days)
 const dates: Record<string, number> = {};
 for (let i = 13; i >= 0; i--) {
 const d = new Date();
 d.setDate(d.getDate() - i);
 dates[d.toISOString().split('T')[0]] = 0;
 }
 analytics.forEach(a => {
 const d = a.createdAt.split('T')[0];
 if (dates[d] !== undefined) dates[d]++;
 });
 const trafficChart = Object.entries(dates).map(([date, count]) => ({ date, count }));

 // Top Categories Helper
  const getTop = (key: keyof AnalyticsItem) => {
    const counts: Record<string, number> = {};
    analytics.forEach(a => {
      const val = (a[key] as string) || '??';
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);
  };

  return {
    trafficChart,
    countries: (() => {
      const counts: Record<string, number> = {};
      analytics.forEach(a => {
        // Use countryCode if available, fallback to country if it looks like a code, else '??'
        const val = a.countryCode || (a.country?.length === 2 ? a.country : '??');
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);
    })(),
    browsers: getTop('browser'),
    devices: getTop('device'),
    uniqueIps: new Set(analytics.map(a => a.ip)).size
  };
 }, [linkData]);

  // --- Fetch Logic ---
  const fetchLinkData = useCallback(async () => {
  if (!id) return;
  setIsLoading(true);
  try {
  const response = await fetch(getApiEndpointForLink(id));
  const res = await response.json();
  if (!response.ok) throw new Error(res.error || "Gagal memuat data");
  setLinkData(res.data);
  setIsProtectModeEnabled(res.data.useLanding === "true");
  setDestinationInput(res.data.url || "");
  setSlugInput(res.data.shortUrl || "");
  setPasswordInput(res.data.password || "");
  setExpiresAtInput(res.data.expiresAt ? new Date(res.data.expiresAt).toISOString().slice(0, 16) : "");
  setDescriptionInput(res.data.description || "");
  } catch (err: unknown) {
  setError(err instanceof Error ? err.message : String(err));
  } finally {
  setIsLoading(false);
  }
  }, [id]);

  useEffect(() => { fetchLinkData(); }, [fetchLinkData]);

  const fetchAuditLogs = useCallback(async () => {
    if (!id || !linkData) return;
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`/api/user/urls/${linkData.shortUrl}/audit-logs`);
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [id, linkData]);

  useEffect(() => {
    if (linkData) {
      fetchAuditLogs();
    }
  }, [linkData, fetchAuditLogs]);

  const fetchAppeals = useCallback(async () => {
    try {
      const response = await fetch("/api/user/appeals");
      if (response.ok) {
        const json = await response.json();
        setAppeals(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const [appealImages, setAppealImages] = useState<File[]>([]);
  const [appealImagePreviews, setAppealImagePreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check total limit (max 3)
    if (appealImages.length + files.length > 3) {
      toast.error(language === 'en' ? "Maximum of 3 proof images allowed" : "Maksimal 3 foto bukti saja");
      return;
    }

    // Check size limit per file (2MB)
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(language === 'en' ? `File ${file.name} exceeds 2MB limit` : `File ${file.name} melebihi batas 2MB`);
        return;
      }
    }

    const newImages = [...appealImages, ...files];
    setAppealImages(newImages);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setAppealImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    setAppealImages(prev => prev.filter((_, i) => i !== index));
    setAppealImagePreviews(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason || !linkData) return;
    setIsSubmittingAppeal(true);
    try {
      // 1. Upload files to get URLs
      const imageUrls: string[] = [];
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

      for (const file of appealImages) {
        const base64 = await toBase64(file);
        const uploadRes = await fetch("/api/user/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64,
            userId: (session?.user as {id?: string})?.id || 'anon'
          })
        });
        if (uploadRes.ok) {
          const json = await uploadRes.json();
          imageUrls.push(json.url);
        } else {
          throw new Error("Gagal mengunggah foto bukti.");
        }
      }

      // 2. Submit appeal
      const res = await fetch("/api/user/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: linkData.id,
          assetType: "shorturl",
          reason: appealReason,
          proofUrl: appealProof || null,
          proofImages: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null
        })
      });
      if (res.ok) {
        toast.success(language === 'en' ? "Appeal ticket submitted successfully!" : "Banding berhasil diajukan!");
        setAppealReason("");
        setAppealProof("");
        setAppealImages([]);
        appealImagePreviews.forEach(p => URL.revokeObjectURL(p));
        setAppealImagePreviews([]);
        fetchAppeals();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengajukan banding");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  // --- Actions ---
  const handleToggleProtectMode = async (val: boolean) => {
  if (!linkData) return;
  setIsUpdatingSetting(true);
  try {
  const res = await fetch(getApiEndpointForSetting, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: linkData.shortUrl, useLanding: val }),
  });
  const json = await res.json();
  if (res.ok) {
    setLinkData(prev => prev ? { ...prev, ...json.data } : json.data);
    setIsProtectModeEnabled(val);
  }
  } finally {
  setIsUpdatingSetting(false);
  }
  };

  const handleToggleActive = async (val: boolean) => {
    if (!linkData) return;
    setIsUpdatingSetting(true);
    try {
      const res = await fetch(getApiEndpointForSetting, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: linkData.shortUrl, isActive: val }),
      });
      const json = await res.json();
      if (res.ok) {
        setLinkData(prev => prev ? { ...prev, ...json.data } : json.data);
      }
    } finally {
      setIsUpdatingSetting(false);
    }
  };

  const handleSaveProperties = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData) return;
    setIsSavingProperties(true);
    setSaveFeedback(null);
    try {
      const res = await fetch(getApiEndpointForSetting, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: linkData.shortUrl,
          url: destinationInput,
          slug: slugInput,
          password: passwordInput,
          expiresAt: expiresAtInput,
          description: descriptionInput
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setLinkData(prev => prev ? { ...prev, ...json.data } : json.data);
        setSaveFeedback({
          type: 'success',
          message: language === 'en' ? 'Settings updated successfully!' : 'Pengaturan berhasil diperbarui!'
        });
        setTimeout(() => setSaveFeedback(null), 3000);
      } else {
        throw new Error(json.error || (language === 'en' ? 'Failed to update settings.' : 'Gagal memperbarui pengaturan.'));
      }
    } catch (err: any) {
      setSaveFeedback({
        type: 'error',
        message: err.message || (language === 'en' ? 'Something went wrong.' : 'Terjadi kesalahan.')
      });
    } finally {
      setIsSavingProperties(false);
    }
  };

  const handleDeleteLink = () => {
    if (!linkData || !session?.user) return;
    setIsConfirmDeleteOpen(true);
  };

  const executeDeleteLink = async () => {
    if (!linkData || !session?.user) return;
    setIsConfirmDeleteOpen(false);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/links/${linkData.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(language === 'en' ? 'Short URL deleted successfully.' : 'Link pendek berhasil dihapus.');
        router.push("/manage");
      } else {
        toast.error(json.error || (language === 'en' ? 'Failed to delete.' : 'Gagal menghapus.'));
      }
    } catch (e) {
      console.error(e);
      toast.error(language === 'en' ? 'Network error occurred.' : 'Terjadi kesalahan jaringan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!linkData) return;
    setIsExporting(true);
    try {
      const response = await fetch(`/api/links/${linkData.id}/export`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || (language === 'en' ? "Failed to export data." : "Gagal mengekspor data."));
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `analytics-${linkData.shortUrl}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(language === 'en' ? "CSV exported successfully!" : "CSV berhasil diekspor!");
    } catch (err: any) {
      toast.error(err.message || (language === 'en' ? "Failed to export CSV." : "Gagal mengekspor CSV."));
    } finally {
      setIsExporting(false);
    }
  };

 const handleCopy = () => {
 if (!linkData) return;
 navigator.clipboard.writeText(`${window.location.origin}/${linkData.shortUrl}`);
 setIsCopied(true);
 setTimeout(() => setIsCopied(false), 2000);
 };

 if (isLoading) return (
 <div className="w-full flex flex-col items-center justify-center py-40">
 <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 mb-4">
 <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
 </div>
 <p className="text-slate-500 dark:text-slate-400 text-sm font-bold animate-pulse">Lagi narik data statistik nih...</p>
 </div>
 );

 if (error || !linkData) return (
 <div className="flex items-center justify-center p-6 text-center h-[60vh]">
 <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-2xl shadow-red-500/10 dark:shadow-none">
 <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-800/50">
 <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-red-500 dark:text-red-400" />
 </div>
 <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Data Nggak Ketemu</h1>
 <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-8">{error || "Kami nggak bisa nemuin data statistik buat link ini."}</p>
 <button onClick={() => router.back()} className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
 Balik ke Dashboard Aja
 </button>
 </div>
 </div>
 );

 return (
 <div className="w-full h-full text-slate-900 dark:text-white font-sans selection:bg-violet-500/30 flex flex-col relative pb-20 overflow-hidden">
 
    {/* Navbar Toolbar - Compact */}
    <header className="mb-6 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-all group border border-slate-200 dark:border-slate-800 shadow-sm" title="Kembali">
          <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">Detail Statistik</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
        >
          <FontAwesomeIcon icon={isExporting ? faSpinner : faDownload} className={`w-3 h-3 ${isExporting ? 'animate-spin' : ''}`} />
          <span>{isExporting ? (language === 'en' ? 'Exporting...' : 'Mengekspor...') : (language === 'en' ? 'Export CSV' : 'Ekspor CSV')}</span>
        </button>
        <a 
          href={`${window.location.protocol}//${window.location.host}/${linkData.shortUrl}`} 
          target="_blank" rel="noreferrer" 
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 flex items-center gap-2.5 transition-all shadow-lg shadow-violet-600/30 text-[11px] font-black text-white uppercase tracking-wider"
        >
          <span>Kunjungi Link</span>
          <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
        </a>
      </div>
    </header>

  <main className="w-full">
  
    {linkData.isTakedown && (
      <div className="mb-6 p-5 sm:p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-red-800 dark:text-red-400 tracking-tight leading-none mb-1">
            {language === 'en' ? 'Asset Suspended by Administrator' : 'Tautan Ditangguhkan oleh Administrator'}
          </h3>
          <p className="text-xs text-red-700 dark:text-red-500 font-medium leading-relaxed">
            {language === 'en' 
              ? 'This link has been taken down due to a system policy violation. Visitors cannot access this link. You can submit an appeal using the form below.'
              : 'Link pendek ini telah dinonaktifkan secara paksa oleh administrator sistem karena melanggar kebijakan. Pengunjung tidak dapat membuka link ini. Anda dapat mengajukan banding menggunakan formulir di samping.'}
          </p>
        </div>
      </div>
    )}
 
    {/* Link Overview Card - Modern & Efficient */}
    <section className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-6 w-full lg:w-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white dark:bg-slate-950 flex items-center justify-center text-3xl shadow-inner-sm shrink-0 border border-slate-200 dark:border-slate-800 overflow-hidden relative group">
          <img 
            src={`/api/logo?domain=${new URL(linkData.url).hostname}`} 
            alt="favicon" 
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              (e.target as any).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'%3E%3C/path%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'%3E%3C/path%3E%3C/svg%3E";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-3 border border-violet-200 dark:border-violet-800/50">
            {linkData.type === 'biolink' ? '📱 Biolink' : '🔗 Short Link'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 truncate max-w-[500px] text-slate-900 dark:text-white leading-none">
            {linkData.title || "Link Tanpa Judul"}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 font-bold text-xs">
            <FontAwesomeIcon icon={faGlobe} className="w-3 h-3 opacity-50" />
            <span className="truncate max-w-[250px] sm:max-w-md">{linkData.url}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 px-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1 justify-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Dibuat Pada</p>
          <p className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">
            {new Date(linkData.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        
        <div 
          className="bg-slate-50 dark:bg-slate-800/50 p-4 px-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-8 group cursor-pointer hover:border-violet-400 transition-all shadow-inner-sm" 
          onClick={handleCopy}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Link Pendekmu</p>
            <p className="text-sm tracking-tight font-black leading-none">
              <span className="text-slate-400 dark:text-slate-500 opacity-60">nyoo.me/</span>
              <span className="text-violet-600 dark:text-violet-400">{linkData.shortUrl}</span>
            </p>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isCopied ? "bg-emerald-500 text-white shadow-lg" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 group-hover:text-violet-600 shadow-sm"}`}>
            <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className="text-xs" />
          </div>
        </div>
      </div>
    </section>

 {/* Global Stats Grid */}
 <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10 relative z-10 w-full">
  {[
  { label: "Total Klik", value: linkData.views || 0, icon: faChartLine, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: 'border-blue-100 dark:border-blue-900/50' },
  ...(linkData.qrCodes && linkData.qrCodes.length > 0 ? [
  { label: "Scan QR", value: linkData.qrCodes.reduce((s, q) => s + q.views, 0), icon: faQrcode, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: 'border-orange-100 dark:border-orange-900/50' }
  ] : []),
  { label: "Klik Unik", value: aggregatedData?.uniqueIps || 0, icon: faFingerprint, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: 'border-emerald-100 dark:border-emerald-900/50' },
  { label: "Perangkat Utama", value: aggregatedData?.devices?.[0]?.name || '-', icon: faMobileAlt, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20", border: 'border-violet-100 dark:border-violet-900/50' },
  { label: "Lokasi Utama", value: COUNTRY_DATA[aggregatedData?.countries?.[0]?.name || '']?.name || '-', icon: faGlobe, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", border: 'border-rose-100 dark:border-rose-900/50' },
  ].map((s, idx) => (
 <motion.div 
 key={idx} 
 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
 className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
 >
 <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} border ${s.border} mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
 <FontAwesomeIcon icon={s.icon} className="w-4 h-4" />
 </div>
 <p className="text-xs font-bold text-slate-500 mb-1">{s.label}</p>
 <p className="text-xl font-bold text-slate-900 dark:text-white truncate" title={String(s.value)}>
 {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
 </p>
 </motion.div>
 ))}
 </section>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 w-full relative z-10">
    {/* Traffic Performance Chart */}
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic leading-none">Tren Klik Harian</h4>
          <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold mt-2 uppercase tracking-wide">Analisis 14 hari terakhir</p>
        </div>
      </div>
      <div className="h-[280px] w-full -ml-4 sm:ml-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={aggregatedData?.trafficChart || []} margin={{ left: -20, right: 10 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.2} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('-').slice(2).join('/')} dy={10} fontWeight="700" />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={40} fontWeight="700" allowDecimals={false} minTickGap={10} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Technical Matrix */}
    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
      <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3 italic">
        <FontAwesomeIcon icon={faMobileAlt} className="text-amber-500" /> Gadget & Aplikasi
      </h4>
      <div className="space-y-8 flex-1">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Top Browsers</p>
          <div className="space-y-4">
            {aggregatedData?.browsers.slice(0, 3).map((b, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-center text-[11px] font-black mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300 truncate">{b.name}</span>
                  <span className="text-amber-500">{b.count} Klik</span>
                </div>
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(b.count / (linkData.views || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Top System</p>
          <div className="space-y-4">
            {aggregatedData?.devices.slice(0, 3).map((d, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-center text-[11px] font-black mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300 truncate">{d.name}</span>
                  <span className="text-violet-500">{d.count} Klik</span>
                </div>
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-600" style={{ width: `${(d.count / (linkData.views || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Geographical Analysis Section - Full Width for better visibility */}
  <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden mb-10 shadow-sm relative z-10">
    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/[0.01]">
      <div>
        <h3 className="text-lg font-black tracking-tight flex items-center gap-3 italic">
          <FontAwesomeIcon icon={faMapMarkedAlt} className="text-violet-500" />
          ANALISIS GEOGRAFIS
        </h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 ml-7">Jangkauan pengunjung Global link Anda</p>
      </div>
      <button 
        onClick={() => setIsMapExpanded(true)}
        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700 shadow-sm group"
      >
        <FontAwesomeIcon icon={faExpandAlt} className="text-slate-400 group-hover:text-violet-500 transition-colors text-xs" />
      </button>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3">
      <div className="lg:col-span-2 h-[450px] sm:h-[500px] bg-slate-50 dark:bg-black/40 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
        <AnalyticsMap locations={linkData.analytics || []} type="overview" />
      </div>
      <div className="p-8 sm:p-10 flex flex-col h-full bg-slate-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-3 mb-10">
          <FontAwesomeIcon icon={faGlobe} className="text-emerald-500" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">LOKASI TERATAS</h4>
        </div>
        <div className="space-y-7 flex-1 overflow-y-auto no-scrollbar">
          {aggregatedData?.countries.length ? aggregatedData.countries.map((c, i) => (
            <div key={i} className="group">
              <div className="flex justify-between items-center text-xs font-black mb-3">
                <span className="text-slate-800 dark:text-zinc-200 truncate max-w-[70%] flex items-center gap-3">
                  <span className="w-5 text-[9px] text-slate-400 font-mono">0{i+1}</span>
                  {c.name === '??' ? 'Lokasi Misterius' : (COUNTRY_DATA[c.name]?.name || c.name)}
                </span>
                <span className="text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg text-[10px] font-black">{c.count} Klik</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(c.count / (linkData.analytics?.length || 1)) * 100}%` }} className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              </div>
            </div>
          )) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <FontAwesomeIcon icon={faGlobe} className="text-4xl mb-6 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Belum ada data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>

 {/* Recent Activity & Settings */}
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10 w-full mb-12">
  {/* Quick Settings */}
  <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
   {linkData.isTakedown ? (
     <div className="flex flex-col gap-6">
       <div>
         <h4 className="text-sm font-bold text-red-500 mb-2">{language === 'en' ? 'Appeal Suspension' : 'Banding Penangguhan'}</h4>
         <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
           {language === 'en' 
             ? 'Your link has been suspended due to system policies. You can file a ticket appeal to request activation.' 
             : 'Link Anda ditangguhkan oleh sistem. Anda dapat mengajukan tiket banding ke admin untuk memulihkannya.'}
         </p>
       </div>

       {/* Form Appeal */}
       {appeals.filter(ap => ap.assetId === linkData.id && ap.status === "PENDING").length === 0 ? (
         <form onSubmit={handleSubmitAppeal} className="flex flex-col gap-4">
           <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'en' ? 'Appeal Reason' : 'Alasan Banding'}</label>
             <textarea
               required
               rows={3}
               value={appealReason}
               onChange={(e) => setAppealReason(e.target.value)}
               placeholder={language === 'en' ? 'Explain why your link should be restored...' : 'Jelaskan kenapa link Anda layak dipulihkan...'}
               className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white resize-none font-medium"
             />
           </div>

           <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'en' ? 'Evidence Link / Proof URL (Optional)' : 'Link Bukti / Pendukung (Opsional)'}</label>
             <input
               type="text"
               value={appealProof}
               onChange={(e) => setAppealProof(e.target.value)}
               placeholder="e.g. Google Drive / Image URL"
               className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white font-medium"
             />
           </div>

           {/* Photo Uploader (Optional) */}
           <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
               {language === 'en' ? 'Supporting Photos (Optional, Max 3)' : 'Foto Pendukung (Opsional, Maks 3)'}
             </label>
             
             <div className="flex flex-col gap-2.5">
               {/* File Input Selector */}
               {appealImages.length < 3 && (
                 <label className="flex flex-col items-center justify-center w-full h-20 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-violet-500/50 hover:bg-slate-100/50 dark:hover:bg-slate-950 transition-all duration-300 relative group">
                   <div className="flex flex-col items-center justify-center pt-3 pb-3">
                     <svg className="w-5 h-5 mb-1.5 text-slate-400 group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                     </svg>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{language === 'en' ? 'Upload Proof Photo (Max 2MB)' : 'Unggah Foto Bukti (Maks 2MB)'}</p>
                   </div>
                   <input
                     type="file"
                     multiple
                     accept="image/*"
                     onChange={handleFileChange}
                     className="hidden"
                   />
                 </label>
               )}

               {/* Uploaded Previews List */}
               {appealImagePreviews.length > 0 && (
                 <div className="grid grid-cols-3 gap-2">
                   {appealImagePreviews.map((preview, index) => (
                     <div key={index} className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-sm bg-white dark:bg-slate-950">
                       <img src={preview} alt="preview" className="w-full h-full object-cover" />
                       <button
                         type="button"
                         onClick={() => handleRemoveImage(index)}
                         className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 text-white"
                       >
                         <span className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-[10px] font-black shadow-md transform scale-90 group-hover:scale-100 transition-transform">✕</span>
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>

           <button
             type="submit"
             disabled={isSubmittingAppeal}
             className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 active:scale-[0.98]"
           >
             {isSubmittingAppeal ? (
               <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
             ) : language === 'en' ? 'Submit Appeal' : 'Kirim Banding'}
           </button>
         </form>
       ) : (
         <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
           <p className="text-[11px] font-bold text-amber-500 animate-pulse text-center">
             {language === 'en' ? '⚡ You have an appeal ticket pending review' : '⚡ Anda memiliki tiket banding yang sedang ditinjau'}
           </p>
         </div>
       )}

       {/* Appeals History */}
       <div className="space-y-3">
         <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{language === 'en' ? 'Appeals History' : 'Riwayat Banding'}</h5>
         {appeals.filter(ap => ap.assetId === linkData.id).length === 0 ? (
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'en' ? 'No tickets filed' : 'Belum ada tiket'}</p>
         ) : (
           <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
             {appeals.filter(ap => ap.assetId === linkData.id).map((ap) => (
               <div key={ap.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 shadow-sm">
                 <div className="flex justify-between items-center text-[10px]">
                   <span className="font-bold text-slate-500">{new Date(ap.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                   <span className={`px-2 py-0.5 rounded font-black text-[9px] ${
                     ap.status === 'PENDING' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                     ap.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                     'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                   }`}>{ap.status}</span>
                 </div>
                 <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 line-clamp-3 leading-relaxed">{ap.reason}</p>
                 
                 {/* Proof Images in History */}
                 {ap.proofImages && (() => {
                   try {
                     const imgs = JSON.parse(ap.proofImages);
                     if (Array.isArray(imgs) && imgs.length > 0) {
                       return (
                         <div className="flex gap-1.5 mt-1 overflow-x-auto pb-0.5 no-scrollbar">
                           {imgs.map((url, idx) => (
                             <a key={idx} href={url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 hover:opacity-85 transition-opacity">
                               <img src={url} alt="Proof" className="w-full h-full object-cover" />
                             </a>
                           ))}
                         </div>
                       );
                     }
                   } catch {
                     return null;
                   }
                 })()}

                 {ap.adminNotes && (
                   <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 mt-1">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'en' ? 'Admin Feedback' : 'Balasan Admin'}</p>
                     <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-normal">{ap.adminNotes}</p>
                   </div>
                  )}
                </div>
              ))}
            </div>
          )}
       </div>
     </div>
   ) : (
     /* Regular Quick Settings Form */
     <form onSubmit={handleSaveProperties} className="flex flex-col gap-5">
       <div>
         <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic leading-none mb-2">
           {language === 'en' ? 'Quick Settings' : 'Pengaturan Cepat'}
         </h4>
         <p className="text-[10px] text-slate-500 font-medium">
           {language === 'en' ? 'Customize your short URL properties directly.' : 'Sesuaikan pengaturan link pendek Anda langsung.'}
         </p>
       </div>

       {/* Destination URL */}
       <div className="space-y-1">
         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
           {language === 'en' ? 'Destination URL' : 'URL Tujuan'}
         </label>
         <input
           type="url"
           required
           value={destinationInput}
           onChange={(e) => setDestinationInput(e.target.value)}
           placeholder="e.g. https://google.com"
           className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white font-medium"
         />
       </div>

       {/* Slug Input */}
       <div className="space-y-1">
         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
           {language === 'en' ? 'Short URL Slug' : 'Slug Link Pendek'}
         </label>
         <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-within:ring-1 focus-within:ring-violet-500">
           <span className="bg-slate-100 dark:bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800 select-none">
             nyoo.me/
           </span>
           <input
             type="text"
             required
             value={slugInput}
             onChange={(e) => setSlugInput(e.target.value)}
             className="w-full px-3 py-2.5 text-xs bg-transparent focus:outline-none dark:text-white font-medium"
           />
         </div>
       </div>

       {/* Description */}
       <div className="space-y-1">
         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
           {language === 'en' ? 'Description (Optional)' : 'Deskripsi (Opsional)'}
         </label>
         <input
           type="text"
           value={descriptionInput}
           onChange={(e) => setDescriptionInput(e.target.value)}
           placeholder={language === 'en' ? 'Describe this link...' : 'Keterangan link ini...'}
           className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white font-medium"
         />
       </div>

       {/* Active Toggle */}
       <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
         <div className="flex-1 min-w-0">
           <p className="text-xs font-black text-slate-800 dark:text-zinc-200 mb-0.5">
             {language === 'en' ? 'Status Active' : 'Status Aktif'}
           </p>
           <p className="text-[9px] text-slate-400 leading-tight">
             {language === 'en' ? 'Enable or disable visitors from resolving.' : 'Aktifkan atau matikan akses pengunjung.'}
           </p>
         </div>
         <button
           type="button"
           onClick={() => handleToggleActive(!linkData.isActive)}
           disabled={isUpdatingSetting}
           className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${linkData.isActive ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-800'}`}
         >
           <motion.div animate={{ x: linkData.isActive ? 22 : 2 }} className="w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transform -translate-x-[2px]" />
         </button>
       </div>

       {/* Landing Mode Toggle */}
       <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
         <div className="flex-1 min-w-0">
           <p className="text-xs font-black text-slate-800 dark:text-zinc-200 mb-0.5">
             {language === 'en' ? 'Protect Mode' : 'Halaman Jeda'}
           </p>
           <p className="text-[9px] text-slate-400 leading-tight">
             {language === 'en' ? 'Show interstitial page before redirecting.' : 'Tampilkan halaman perantara sebelum dialihkan.'}
           </p>
         </div>
         <button
           type="button"
           onClick={() => handleToggleProtectMode(!isProtectModeEnabled)}
           disabled={isUpdatingSetting}
           className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${isProtectModeEnabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-800'}`}
         >
           <motion.div animate={{ x: isProtectModeEnabled ? 22 : 2 }} className="w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transform -translate-x-[2px]" />
         </button>
       </div>

       {/* Password Protection */}
       <div className="space-y-1">
         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
           {language === 'en' ? 'Password Protection' : 'Proteksi Sandi'}
         </label>
         <input
           type="text"
           value={passwordInput}
           onChange={(e) => setPasswordInput(e.target.value)}
           placeholder={language === 'en' ? 'Leave empty for no password' : 'Kosongkan jika tanpa sandi'}
           className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white font-medium"
         />
       </div>

       {/* Expiration Date */}
       <div className="space-y-1">
         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
           {language === 'en' ? 'Expiration Date' : 'Tanggal Kedaluwarsa'}
         </label>
         <input
           type="datetime-local"
           value={expiresAtInput}
           onChange={(e) => setExpiresAtInput(e.target.value)}
           className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 dark:text-white font-medium"
         />
       </div>

       {/* Feedback message */}
       {saveFeedback && (
         <div className={`p-3 rounded-xl text-xs font-bold ${saveFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
           {saveFeedback.message}
         </div>
       )}

       <button
         type="submit"
         disabled={isSavingProperties}
         className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 active:scale-[0.98] shadow-md shadow-violet-600/10"
       >
         {isSavingProperties ? (
           <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
         ) : language === 'en' ? 'Save Settings' : 'Simpan Setelan'}
       </button>
     </form>
   )}

   {/* Divider Line */}
   <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

   {/* Danger Zone */}
   <div className="flex flex-col gap-3.5">
     <div>
       <h4 className="text-xs font-black text-red-500 uppercase tracking-widest italic leading-none mb-1">
         {language === 'en' ? 'Danger Zone' : 'Zona Bahaya'}
       </h4>
       <p className="text-[9px] text-slate-400 leading-tight">
         {language === 'en' 
           ? 'Deleting this short URL will hide it from your dashboard and free up its custom alias. However, its historical click statistics will be preserved for administrator review.' 
           : 'Menghapus URL pendek ini akan menyembunyikannya dari dasbor Anda dan membebaskan alias kustomnya. Namun, data statistik historis akan tetap dipertahankan untuk kebutuhan analisis admin.'}
       </p>
     </div>
     <button
       type="button"
       onClick={handleDeleteLink}
       disabled={isDeleting}
       className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]"
     >
       {isDeleting ? (
         <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
       ) : (
         language === 'en' ? 'Delete Short URL' : 'Hapus Link Pendek'
       )}
     </button>
   </div>

   {/* System ID Banner - Compact & Premium */}
   <div className="pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">
     <span>ID SISTEM</span>
     <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 select-all">
       {linkData.id}
     </span>
   </div>
  </div>

  {/* Recent Activity & Change History Tab Column */}
  <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
    {/* Tab Selector Header */}
    <div className="px-6 py-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
      <div className="flex gap-6">
        <button
          onClick={() => setActiveActivityTab('clicks')}
          className={`text-sm font-bold pb-2 border-b-2 transition-all ${activeActivityTab === 'clicks' ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400' : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          {language === 'en' ? 'Recent Clicks' : 'Aktivitas Terbaru'}
        </button>
        <button
          onClick={() => setActiveActivityTab('audit')}
          className={`text-sm font-bold pb-2 border-b-2 transition-all ${activeActivityTab === 'audit' ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400' : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          {language === 'en' ? 'Change History (Audit)' : 'Riwayat Perubahan (Audit)'}
        </button>
      </div>
      {activeActivityTab === 'clicks' ? (
        <span className="text-[9px] font-bold bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full text-violet-600 dark:text-violet-400 font-semibold hidden sm:inline-block">
          {language === 'en' ? 'LAST 15 CLICKS' : '15 KLIK TERAKHIR'}
        </span>
      ) : (
        <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full text-amber-600 dark:text-amber-400 font-semibold hidden sm:inline-block">
          {language === 'en' ? 'LINK HISTORY' : 'RIWAYAT TAUTAN'}
        </span>
      )}
    </div>

    {/* Tab 1: Clicks Log */}
    {activeActivityTab === 'clicks' && (
      <div className="overflow-x-auto">
        <table className="w-full text-left bg-white dark:bg-slate-900">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 sm:px-8 py-5 w-[140px] sm:w-auto">Waktu Tepatnya</th>
              <th className="px-6 sm:px-8 py-5">Lokasi & Device</th>
              <th className="px-6 sm:px-8 py-5">Koordinat / IP</th>
              <th className="px-6 sm:px-8 py-5 text-right hidden lg:table-cell">Referer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {linkData.analytics?.length ? linkData.analytics.slice(0, 15).map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-all cursor-pointer group" onClick={() => setSelectedAnalytics(a)}>
                <td className="px-6 sm:px-8 py-5 whitespace-nowrap">
                  <p className="text-xs font-black text-slate-900 dark:text-white mb-0.5">{formatDate(a.createdAt).split(',')[0]}</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-mono uppercase">{formatDate(a.createdAt).split(',')[1]?.trim()}</p>
                </td>
                <td className="px-6 sm:px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                      <FontAwesomeIcon icon={a.device?.toLowerCase().includes('mobile') ? faMobileAlt : faDesktop} className="text-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate tracking-tight">{a.city ? `${a.city}, ` : ''}{COUNTRY_DATA[a.countryCode || '']?.name || a.country || 'Global'}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 truncate mt-1">{a.browser} / {a.os}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 sm:px-8 py-5">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-emerald-500/80 font-mono tracking-tighter">{a.lat ? `${a.lat.toFixed(4)}, ${a.lon?.toFixed(4)}` : 'N/A'}</p>
                    <code className="text-xs font-bold text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md w-fit group-hover:bg-violet-500/10 group-hover:text-violet-400 transition-colors">{a.ip}</code>
                  </div>
                </td>
                <td className="px-6 sm:px-8 py-5 text-right hidden lg:table-cell">
                  <p className="text-[10px] font-black text-amber-500/60 truncate max-w-[150px] ml-auto uppercase tracking-wider">{a.referer || "Direct / Link"}</p>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <p className="text-sm font-bold text-slate-400">Sepi nih, belum ada pengunjung sama sekali.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {/* Tab 2: Audit Logs Log */}
    {activeActivityTab === 'audit' && (
      <div className="p-6 sm:p-8 overflow-y-auto max-h-[500px] no-scrollbar bg-white dark:bg-slate-900">
        {isLoadingLogs ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-violet-500 w-8 h-8 mb-3" />
            <p className="text-xs font-bold text-slate-400">{language === 'en' ? 'Fetching history...' : 'Menarik riwayat log...'}</p>
          </div>
        ) : auditLogs.length ? (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8 py-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline Bullet */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 bg-violet-600 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-all shadow-md" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs font-black text-slate-800 dark:text-zinc-200 tracking-tight leading-tight">{log.details}</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>
                    Pelaku: <strong className="text-violet-600 dark:text-violet-400">{log.actorName}</strong>
                    <span className="ml-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-[9px] font-bold">{log.actorRole}</span>
                  </span>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  <span>IP: <code className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600 dark:text-zinc-400">{log.ip}</code></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700 mb-4 opacity-50">
              <FontAwesomeIcon icon={faInfoCircle} className="text-2xl text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-400">{language === 'en' ? 'No changes recorded yet.' : 'Belum ada riwayat perubahan.'}</p>
          </div>
        )}
      </div>
    )}
  </div>
 </div>
 </main>

 {/* Linked QR Codes Section */}
 <section className="w-full relative z-10">
 {linkData.qrCodes && linkData.qrCodes.length > 0 && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
 <h3 className="text-xl font-bold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
 <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 border border-orange-200 dark:border-orange-800/50">
 <FontAwesomeIcon icon={faQrcode} className="w-4 h-4" />
 </div>
 QR Code Buat Link Ini
 </h3>
 <button onClick={() => router.push('/manage/qrcodes')} className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors self-start sm:self-auto ml-11 sm:ml-0">
 Ke Studio QR Code &raquo;
 </button>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {linkData.qrCodes.map((qr) => (
 <div key={qr.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 group hover:border-orange-300 dark:hover:border-orange-500/50 transition-all shadow-sm hover:shadow-md">
 <div className="w-24 h-24 bg-white p-2 rounded-2xl shrink-0 shadow-md transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300 border-2 border-slate-100">
 <QRCodeCanvas 
 value={`${window.location.origin}/${qr.qrShortUrl}`}
 size={100}
 level="H"
 className="w-full h-full"
 />
 </div>
 <div className="min-w-0 flex-1 text-center sm:text-left flex flex-col justify-center h-full">
 <p className="text-xs font-bold text-slate-500 mb-1 truncate">{qr.name}</p>
 <div className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400 mb-3">{qr.views.toLocaleString()} <span className="text-xs font-bold text-slate-400 font-semibold ml-1">Scan</span></div>
 <button 
 onClick={() => router.push('/manage/qrcodes')}
 className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all border border-slate-200 dark:border-slate-700"
 >
 Edit Tampilan
 </button>
 </div>
 </div>
 ))}
 </div>
 </motion.div>
 )}
 </section>

  {/* Visitor Details Modal - Synced with QrAnalytics */}
  <AnimatePresence>
  {selectedAnalytics && (
  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4" onClick={() => setSelectedAnalytics(null)}>
  <motion.div 
  initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
  onClick={(e) => e.stopPropagation()}
  className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-3xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
  >
  <div className="w-full md:w-3/5 min-h-[350px] sm:min-h-[450px] relative bg-slate-100 dark:bg-black/40 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-hidden">
    <AnalyticsMap locations={[selectedAnalytics]} type="detail" />
    
    <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
      <div className="bg-violet-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-white/20 shadow-2xl pointer-events-none">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="animate-bounce" /> {selectedAnalytics.city || 'Kota Tak Diketahui'}
      </div>
      <a 
        href={`https://www.google.com/maps?q=${selectedAnalytics.lat},${selectedAnalytics.lon}`} 
        target="_blank" rel="noreferrer"
        className="bg-white text-zinc-900 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-slate-100 transition-all active:scale-95 group"
      >
        <FontAwesomeIcon icon={faLocationArrow} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
        Buka Google Maps
      </a>
    </div>

    <div className="absolute bottom-6 left-6 right-6 z-[1000] pointer-events-none">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 text-xs shrink-0" />
        <p className="text-[9px] font-bold text-amber-200/60 leading-tight">
          <span className="text-amber-500 uppercase tracking-widest mr-1">Info:</span> Lokasi terdeteksi dari IP operator/ISP. Koordinat mungkin merupakan pusat server provider, bukan lokasi fisik perangkat 100%.
        </p>
      </div>
    </div>
  </div>

  <div className="w-full md:w-2/5 p-8 sm:p-10 flex flex-col justify-between">
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-3xl text-white shadow-xl shadow-violet-600/30 border-2 border-white/20">
            <FontAwesomeIcon icon={selectedAnalytics.device?.toLowerCase().includes('mobile') ? faMobileAlt : faDesktop} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none mb-2">Detail Klik</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black tracking-tight font-mono">{selectedAnalytics.ip}</p>
          </div>
        </div>
        <button onClick={() => setSelectedAnalytics(null)} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {[
          { label: "Waktu Klik", value: formatDate(selectedAnalytics.createdAt), icon: faCalendarAlt, color: "slate" },
          { label: "Wilayah & Negara", value: `${selectedAnalytics.city || '??'}, ${COUNTRY_DATA[selectedAnalytics.countryCode || ""]?.name || selectedAnalytics.country}`, icon: faGlobe, color: "emerald" },
          { label: "Koordinat Lokasi", value: selectedAnalytics.lat ? `${selectedAnalytics.lat.toFixed(6)}, ${selectedAnalytics.lon?.toFixed(6)}` : 'N/A', icon: faMapMarkedAlt, color: "violet" },
          { label: "Aplikasi & Sistem", value: `${selectedAnalytics.browser} / ${selectedAnalytics.os}`, icon: faCompass, color: "amber" },
          { label: "User Agent", value: selectedAnalytics.userAgent || 'Tidak tersedia', icon: faInfoCircle, color: "blue" },
        ].map((m, i) => (
          <div key={i} className="flex items-start gap-6 group">
            <div className={`w-10 h-10 rounded-[1.25rem] bg-${m.color}-500/10 text-${m.color}-500 flex items-center justify-center shrink-0 border border-${m.color}-500/10 transition-colors group-hover:bg-${m.color}-500/20`}>
              <FontAwesomeIcon icon={m.icon as any} className="text-xs" />
            </div>
            <div className="min-w-0 pt-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2 leading-none">{m.label}</p>
              <p className="text-[11px] font-black text-slate-900 dark:text-zinc-100 truncate tracking-tight">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    
    <div className="mt-14">
      <button onClick={() => setSelectedAnalytics(null)} className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-2xl">
        Tutup Detail
      </button>
    </div>
  </div>
  </motion.div>
  </div>
  )}
  </AnimatePresence>

  {/* Full Map Modal */}
  <AnimatePresence>
  {isMapExpanded && (
  <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[99999] flex flex-col p-4 sm:p-10">
    <div className="flex items-center justify-between mb-10">
      <div>
        <h3 className="text-3xl font-black italic tracking-tighter">Analisis Geografis Global</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Lacak persebaran jangkauan link Anda di seluruh dunia.</p>
      </div>
      <button onClick={() => setIsMapExpanded(false)} className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 transition-all shadow-xl">
        <FontAwesomeIcon icon={faTimes} className="text-lg" />
      </button>
    </div>
    <div className="flex-1 rounded-[3rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-3xl bg-slate-100 dark:bg-black relative">
      <AnalyticsMap locations={linkData.analytics || []} type="overview" />
    </div>
  </div>
  )}
  </AnimatePresence>

  {/* Confirm Delete Modal */}
  <AnimatePresence>
    {isConfirmDeleteOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsConfirmDeleteOpen(false)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 w-full max-w-sm shadow-xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-xl mb-4 mx-auto font-sans font-bold">
            ⚠️
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white text-center mb-1.5">
            {language === 'en' ? 'Delete Short URL?' : 'Hapus Link Pendek?'}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 text-center leading-normal mb-6">
            {language === 'en' 
              ? 'Are you sure you want to delete this short URL? This action cannot be undone.'
              : 'Apakah Anda yakin ingin menghapus link pendek ini? Tindakan ini tidak dapat dibatalkan.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              onClick={executeDeleteLink}
              className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-600/20"
            >
              {language === 'en' ? 'Yes, Delete' : 'Ya, Hapus'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>

  <style jsx global>{`
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .leaflet-container { z-index: 1 !important; border-radius: inherit; }
  .leaflet-pane { z-index: 400 !important; }
  .leaflet-top, .leaflet-bottom { z-index: 500 !important; }
  .leaflet-popup { z-index: 600 !important; }
  `}</style>

 </div>
 );
}
