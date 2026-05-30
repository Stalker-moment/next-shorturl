// app/manage/page.tsx
"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faLink,
  faChartLine,
  faCopy,
  faCheck,
  faChartBar,
  faShieldAlt,
  faBolt,
  faSearch,
  faArrowRight,
  faTimes,
  faSpinner,
  faQrcode
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface UserUrl {
  id: string;
  url: string;
  shortUrl: string;
  views: number;
  title: string | null;
  isActive: boolean;
  createdAt: string;
}

interface QrCodeData {
  id: string;
  name: string | null;
  targetUrl: string;
  qrShortUrl: string;
  views: number;
  isActive: boolean;
  createdAt: string;
}

interface TrafficDay {
  date: string;
  linkClicks: number;
  qrClicks: number;
  total: number;
}

interface DashboardStats {
  totalLinks: number;
  totalQrCodes: number;
  totalLinkClicks: number;
  totalQrClicks: number;
  totalClicks: number;
}

function UserDashboardContent() {

  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle Google OAuth popup callback
  useEffect(() => {
    if (typeof window !== "undefined" && window.opener && window.name === "google-login-popup") {
      const popupParam = searchParams.get("popup");
      const errorParam = searchParams.get("error");
      if (popupParam === "true") {
        window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS" }, window.location.origin);
        window.close();
      } else if (errorParam) {
        window.opener.postMessage({ type: "GOOGLE_AUTH_ERROR", error: errorParam }, window.location.origin);
        window.close();
      }
    }
  }, [searchParams]);

  const [urls, setUrls] = useState<UserUrl[]>([]);
  const [qrcodes, setQrcodes] = useState<QrCodeData[]>([]);
  const [trafficSummary, setTrafficSummary] = useState<TrafficDay[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [destination, setDestination] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [createError, setCreateError] = useState("");
  const [hostname, setHostname] = useState("nyoo.me/");
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'views'>('newest');
  const [activeTab, setActiveTab] = useState<'links' | 'qrcodes'>('links');

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(`${window.location.host}/`);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/user/dashboard-analytics");
      if (res.ok) {
        const json = await res.json();
        const { urls: fetchedUrls, qrcodes: fetchedQr, trafficSummary: fetchedTraffic, stats: fetchedStats } = json.data || {};
        setUrls(fetchedUrls || []);
        setQrcodes(fetchedQr || []);
        setTrafficSummary(fetchedTraffic || []);
        setStats(fetchedStats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!destination) return;
    setCreating(true);
    try {
      const res = await fetch("/api/user/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: destination, customizedUrl: customAlias || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setDestination("");
        setCustomAlias("");
        setShowCreateForm(false);
        fetchDashboardData();
      } else {
        setCreateError(data.error || (language === 'en' ? "Failed to create short link." : "Aduh, gagal bikin link nih."));
      }
    } catch {
      setCreateError(language === 'en' ? "Network issue, please try again." : "Jaringan lagi bermasalah, coba lagi ya.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(txt);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredUrls = useMemo(() => {
    let result = urls.filter(u => 
      u.url.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.shortUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (sortBy === 'views') {
      result.sort((a,b) => b.views - a.views);
    } else {
      result.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [urls, searchTerm, sortBy]);

  const filteredQrCodes = useMemo(() => {
    let result = qrcodes.filter(q => 
      (q.name && q.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      q.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.qrShortUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (sortBy === 'views') {
      result.sort((a,b) => b.views - a.views);
    } else {
      result.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [qrcodes, searchTerm, sortBy]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-violet-500 w-6 h-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-16 relative overflow-hidden font-sans">
      
      <main className="max-w-6xl mx-auto relative z-10 px-6">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 mt-8">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t("overview.title")}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">✨ {urls.length + qrcodes.length} {language === 'en' ? 'Your assets are active and running' : 'Aset Anda aktif dan berjalan'}</p>
          </motion.div>

          <div className="flex gap-3">
            <Link
              href="/manage/qrcodes"
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-950 dark:text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" /> {language === 'en' ? 'Create QR Code' : 'Buat QR Code'}
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3.5 bg-violet-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-95"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" /> {t("overview.btn.create")}
            </motion.button>
          </div>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: t("overview.stat.total_links"), val: stats?.totalLinks ?? urls.length, icon: faLink, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-900/50' },
            { label: language === 'en' ? 'Link Clicks' : 'Klik Tautan', val: (stats?.totalLinkClicks ?? urls.reduce((acc, u) => acc + u.views, 0)).toLocaleString(), icon: faChartLine, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/50' },
            { label: language === 'en' ? 'Total QR Codes' : 'Total QR Code', val: stats?.totalQrCodes ?? qrcodes.length, icon: faQrcode, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-900/50' },
            { label: language === 'en' ? 'QR Scans' : 'Pindaian QR Code', val: (stats?.totalQrClicks ?? qrcodes.reduce((acc, q) => acc + q.views, 0)).toLocaleString(), icon: faShieldAlt, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/50' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} border ${stat.border}`}>
                  <FontAwesomeIcon icon={stat.icon} className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{stat.val}</h4>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Traffic Summary Chart */}
        {trafficSummary.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-10"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'en' ? 'Traffic Summary' : 'Ringkasan Trafik 30 Hari'}
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Link Clicks vs. QR Code Scans' : 'Klik Link vs Scan QR Code'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-violet-500" />
                  <span className="text-slate-600 dark:text-slate-400">{language === 'en' ? 'Link Clicks' : 'Klik Link'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400">{language === 'en' ? 'QR Scans' : 'Scan QR'}</span>
                </div>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => {
                      const parts = tick.split('-');
                      return `${parts[2]}/${parts[1]}`;
                    }}
                    stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    fontWeight="bold"
                  />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(label) => {
                      const parts = label.split('-');
                      const d = new Date(parts[0], parts[1] - 1, parts[2]);
                      return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                    }}
                  />
                  <Area type="monotone" dataKey="linkClicks" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                  <Area type="monotone" dataKey="qrClicks" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Tab System Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 mb-6">
          <button
            onClick={() => setActiveTab('links')}
            className={`pb-4 text-sm font-black transition-all relative ${activeTab === 'links' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <span className="flex items-center gap-2">
              {language === 'en' ? 'Short Links' : 'Tautan Pendek'}
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'links' ? 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {urls.length}
              </span>
            </span>
            {activeTab === 'links' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('qrcodes')}
            className={`pb-4 text-sm font-black transition-all relative ${activeTab === 'qrcodes' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <span className="flex items-center gap-2">
              {language === 'en' ? 'QR Codes' : 'Kode QR'}
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'qrcodes' ? 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {qrcodes.length}
              </span>
            </span>
            {activeTab === 'qrcodes' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
            )}
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors w-4 h-4" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'links' ? t("overview.placeholder.search") : (language === 'en' ? 'Search QR codes...' : 'Cari QR Code...')} 
              className="w-full h-12 bg-white dark:bg-slate-900 pl-11 pr-4 rounded-full border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all shadow-sm"
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setSortBy('newest')}
              className={`px-6 h-10 rounded-full text-xs font-bold transition-all ${sortBy === 'newest' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {t("overview.sort.newest")}
            </button>
            <button 
              onClick={() => setSortBy('views')}
              className={`px-6 h-10 rounded-full text-xs font-bold transition-all ${sortBy === 'views' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {activeTab === 'links' ? t("overview.sort.clicks") : (language === 'en' ? 'Most Scanned' : 'Paling Banyak Scan')}
            </button>
          </div>
        </div>

        {/* Dynamic Lists */}
        {activeTab === 'links' ? (
          <div className="space-y-4">
            {filteredUrls.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl mb-4 border border-slate-100 dark:border-slate-700">👻</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{language === 'en' ? 'Ah, Empty...' : 'Yah, Kosong...'}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs">{language === 'en' ? "You don't have any links yet, or the search term doesn't match." : "Kamu belum punya link apa-apa, atau ketikan pencariannya nggak pas nih."}</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredUrls.map((url, i) => (
                  <motion.div
                    layout
                    key={url.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-white dark:bg-slate-900 group p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-500/50 transition-all flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden shadow-sm hover:shadow-md"
                  >
                    {/* Icon Section */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm relative overflow-hidden group-hover:border-violet-400 transition-colors duration-300">
                      <img 
                        src={`/api/logo?domain=${new URL(url.url).hostname}`} 
                        alt="favicon" 
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as any).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'%3E%3C/path%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'%3E%3C/path%3E%3C/svg%3E";
                        }}
                      />
                    </div>

                    {/* Core Info */}
                    <div className="flex-1 min-w-0 text-left space-y-0.5">
                      <div className="flex items-center gap-2">
                         <h3 className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-none">{url.title || (language === 'en' ? 'Untitled Link' : 'Link Tanpa Judul')}</h3>
                         <div className={`w-1.5 h-1.5 rounded-full ${url.isActive ? 'bg-emerald-500 shadow-sm' : 'bg-red-500'}`} />
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold truncate max-w-xs">{url.url}</p>
                    </div>

                    {/* Short Link - Integrated Copy */}
                    <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 w-full sm:w-auto">
                      <div className="px-3 py-1 flex-1 sm:text-left flex items-center gap-1">
                        <p className="text-[11px] tracking-tight font-bold whitespace-nowrap overflow-hidden">
                          <span className="text-slate-400 dark:text-slate-500 opacity-60 ml-0.5">{hostname}</span>
                          <span className="text-slate-900 dark:text-white font-black">{url.shortUrl}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => handleCopy(`${hostname}${url.shortUrl}`)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${copied === `${hostname}${url.shortUrl}` ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'}`}
                        title={t("landing.qr.copy")}
                      >
                        <FontAwesomeIcon icon={copied === `${hostname}${url.shortUrl}` ? faCheck : faCopy} className="text-[10px]" />
                      </button>
                    </div>

                    {/* Stats & Details Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                      <div className="flex flex-col items-start sm:items-end justify-center min-w-[50px]">
                         <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{url.views.toLocaleString()}</p>
                         <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">{t("overview.th.clicks")}</p>
                      </div>
                      <Link href={`/manage/${url.id}`} title={language === 'en' ? 'View Statistics' : 'Lihat Statistik'} className="h-8 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-white hover:bg-violet-600 dark:hover:bg-violet-600 transition-all shadow-sm gap-2">
                         <FontAwesomeIcon icon={faChartBar} className="w-3 h-3" />
                         <span className="sm:hidden lg:inline">{language === 'en' ? 'Details' : 'Detail'}</span>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQrCodes.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl mb-4 border border-slate-100 dark:border-slate-700">🔍</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{language === 'en' ? 'No QR Codes Found' : 'QR Code Tidak Ditemukan'}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs">{language === 'en' ? "You don't have any QR codes yet, or the search term doesn't match." : "Kamu belum punya QR Code apa-apa, atau kata kuncinya nggak pas nih."}</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredQrCodes.map((qr, i) => (
                  <motion.div
                    layout
                    key={qr.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-white dark:bg-slate-900 group p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-500/50 transition-all flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden shadow-sm hover:shadow-md"
                  >
                    {/* QR Icon Section */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-50 dark:bg-violet-950 rounded-xl flex items-center justify-center border border-violet-100 dark:border-violet-900/50 shrink-0 shadow-sm text-violet-600 dark:text-violet-400">
                      <FontAwesomeIcon icon={faQrcode} className="w-5 h-5" />
                    </div>

                    {/* Core Info */}
                    <div className="flex-1 min-w-0 text-left space-y-0.5">
                      <div className="flex items-center gap-2">
                         <h3 className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-none">{qr.name || (language === 'en' ? 'Untitled QR Code' : 'QR Code Tanpa Nama')}</h3>
                         <div className={`w-1.5 h-1.5 rounded-full ${qr.isActive ? 'bg-emerald-500 shadow-sm' : 'bg-slate-400'}`} />
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold truncate max-w-xs">{qr.targetUrl}</p>
                    </div>

                    {/* Short QR Link - Integrated Copy */}
                    <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 w-full sm:w-auto">
                      <div className="px-3 py-1 flex-1 sm:text-left flex items-center gap-1">
                        <p className="text-[11px] tracking-tight font-bold whitespace-nowrap overflow-hidden">
                          <span className="text-slate-400 dark:text-slate-500 opacity-60 ml-0.5">{hostname}</span>
                          <span className="text-slate-900 dark:text-white font-black">{qr.qrShortUrl}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => handleCopy(`${hostname}${qr.qrShortUrl}`)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${copied === `${hostname}${qr.qrShortUrl}` ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'}`}
                        title={t("landing.qr.copy")}
                      >
                        <FontAwesomeIcon icon={copied === `${hostname}${qr.qrShortUrl}` ? faCheck : faCopy} className="text-[10px]" />
                      </button>
                    </div>

                    {/* Scans Count & Details Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                      <div className="flex flex-col items-start sm:items-end justify-center min-w-[50px]">
                         <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{qr.views.toLocaleString()}</p>
                         <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">{language === 'en' ? 'SCANS' : 'PINDAIAN'}</p>
                      </div>
                      <Link href={`/manage/qrcodes/${qr.id}`} title={language === 'en' ? 'Edit QR Code' : 'Edit Kode QR'} className="h-8 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-white hover:bg-violet-600 dark:hover:bg-violet-600 transition-all shadow-sm gap-2">
                         <FontAwesomeIcon icon={faChartBar} className="w-3 h-3" />
                         <span className="sm:hidden lg:inline">{language === 'en' ? 'Details' : 'Detail'}</span>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowCreateForm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-2xl"
            >
              <div className="p-6 sm:p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm">
                      <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t("overview.form.title")}</h2>
                  </div>
                  <button onClick={() => setShowCreateForm(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  {createError && (
                    <div className="p-4 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-center gap-2">
                      {createError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">{language === 'en' ? 'Copy-paste your link here 👇' : 'Copy-paste link kamu di sini 👇'}</label>
                    <input 
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="https://example.com/very-long-url-path"
                      className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">{language === 'en' ? 'Customize your link name? (Optional)' : 'Mau custom nama linknya nggak? (Bebas)'}</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 shadow-sm transition-all h-14 w-full">
                      <div className="flex items-center justify-center px-4 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800/80 pointer-events-none whitespace-nowrap">
                        {hostname}
                      </div>
                      <input 
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        placeholder="mycustomname"
                        className="flex-1 w-full bg-transparent px-4 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none h-full"
                      />
                    </div>
                  </div>

                  <button
                    disabled={creating}
                    type="submit"
                    className="w-full h-14 bg-violet-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/30 active:scale-[0.98] mt-2"
                  >
                    {creating ? (
                      <><FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin" /> <span>{language === 'en' ? 'Shortening link...' : 'Lagi dipendekin nih...'}</span></>
                    ) : (
                      <><span>{language === 'en' ? 'Create Magic Link' : 'Bikin Link Ajaibnya'}</span> <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function UserDashboard() {

  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center py-40 opacity-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UserDashboardContent />
    </Suspense>
  );
}

