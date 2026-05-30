"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
 faArrowLeft,
 faChartLine,
 faQrcode,
 faFingerprint,
 faGlobe,
 faMobileAlt,
 faCompass,
 faTimes,
 faCalendarAlt,
 faExternalLinkAlt,
 faCheck,
 faCopy,
 faExclamationTriangle,
 faMapMarkedAlt,
 faListUl,
 faMapMarkerAlt,
 faInfoCircle,
 faLocationArrow,
 faExpandAlt,
 faDesktop,
 faLink
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import { COUNTRY_DATA } from "@/components/AnalyticsMap";

const QRCodeCanvas = dynamic(
 () => import('qrcode.react').then((mod) => mod.QRCodeCanvas),
 { ssr: false }
);

const AnalyticsMap = dynamic(
 () => import('@/components/AnalyticsMap'),
 { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 dark:bg-black/20 animate-pulse rounded-2xl flex items-center justify-center text-xs font-bold text-slate-500 dark:text-zinc-600">Memuat Peta...</div> }
);

interface AnalyticsItem {
 id: string;
 ip: string | null;
 userAgent: string | null;
 device: string | null;
 os: string | null;
 browser: string | null;
 country: string | null;
 city: string | null;
 lat: number | null;
 lon: number | null;
 referer: string | null;
 createdAt: string;
}

interface QrAnalyticsData {
 id: string;
 name: string;
 targetUrl: string;
 qrShortUrl: string;
 views: number;
 styleConfig: string | null;
 logo: string | null;
 createdAt: string;
 analytics: AnalyticsItem[];
}

export default function QrAnalyticsPage() {
 const router = useRouter();
 const pathname = usePathname();
 const id = pathname?.split('/').pop();

 const [qrData, setQrData] = useState<QrAnalyticsData | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [isCopied, setIsCopied] = useState(false);
 const [selectedAnalytics, setSelectedAnalytics] = useState<AnalyticsItem | null>(null);
 const [isMapExpanded, setIsMapExpanded] = useState(false);

 const fetchQrData = useCallback(async () => {
 if (!id) return;
 setIsLoading(true);
 try {
 const response = await fetch(`/api/user/qrcodes/${id}`);
 const res = await response.json();
 if (!response.ok) throw new Error(res.error || "Gagal memuat data");
 setQrData(res.data);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setIsLoading(false);
 }
 }, [id]);

 useEffect(() => {
 fetchQrData();
 }, [fetchQrData]);

 const aggregatedData = useMemo(() => {
 if (!qrData?.analytics) return null;
 const analytics = qrData.analytics;

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

 const getTop = (key: keyof AnalyticsItem) => {
 const counts: Record<string, number> = {};
 analytics.forEach(a => {
 const val = (a[key] as string) || 'Tidak Diketahui';
 counts[val] = (counts[val] || 0) + 1;
 });
 return Object.entries(counts)
 .map(([name, count]) => ({ name, count }))
 .sort((a,b) => b.count - a.count)
 .slice(0, 5);
 };

 return {
 trafficChart,
 countries: getTop('country'),
 browsers: getTop('browser'),
 devices: getTop('device'),
 uniqueIps: new Set(analytics.map(a => a.ip)).size,
 };
 }, [qrData]);

 const handleCopy = () => {
 if (!qrData) return;
 const fullUrl = `${window.location.origin}/${qrData.qrShortUrl}`;
 navigator.clipboard.writeText(fullUrl);
 setIsCopied(true);
 toast.success("Link berhasil disalin!");
 setTimeout(() => setIsCopied(false), 2000);
 };

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

 if (isLoading) return (
 <div className="w-full flex items-center justify-center">
 <div className="flex flex-col items-center gap-4 text-center">
 <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
 <p className="text-slate-500 dark:text-zinc-500 text-xs font-bold font-semibold">Sinkronisasi Data Statistik...</p>
 </div>
 </div>
 );

 if (error || !qrData) return (
 <div className="w-full flex items-center justify-center p-6 text-center">
 <div className="max-w-md">
 <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-2xl">
 <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-3xl" />
 </div>
 <h1 className="text-3xl font-bold italic tracking-tighter mb-4">Akses Gagal</h1>
 <p className="text-slate-500 dark:text-zinc-500 text-sm mb-10 font-medium leading-relaxed">{error || "Kami tidak dapat memuat statistik untuk QR Code ini."}</p>
 <button onClick={() => router.push('/manage/qrcodes')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white rounded-2xl text-xs font-bold font-semibold transition-all">
 Kembali ke Daftar
 </button>
 </div>
 </div>
 );

 return (
 <div className="w-full text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
 
 <header className="sticky top-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between h-14 sm:h-16 gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <button onClick={() => router.back()} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/5 transition-all group flex-shrink-0">
 <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
 </button>
 <div className="min-w-0">
 <h2 className="text-sm font-bold italic tracking-tight leading-none text-slate-900 dark:text-white truncate">Statistik QR</h2>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
 <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold">Data Real-time</p>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <button onClick={handleCopy} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/5 transition-all">
 <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className={isCopied ? "text-emerald-500" : ""} />
 <span>{isCopied ? "Disalin" : "Salin Link"}</span>
 </button>
 <button onClick={handleCopy} className="sm:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/5 transition-all">
 <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className={`text-sm ${isCopied ? 'text-emerald-500' : ''}`} />
 </button>
 <a href={`/${qrData.qrShortUrl}`} target="_blank" rel="noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-all">
 <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3.5 h-3.5" />
 </a>
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
 
 <section className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8 bg-white/40 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/5 p-5 sm:p-8">
 <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white p-2 rounded-2xl shadow-2xl relative group shrink-0 mx-auto sm:mx-0">
 <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all -z-10" />
 <QRCodeCanvas value={`${window.location.origin}/${qrData.qrShortUrl}`} size={128} level="H" style={{ width: '100%', height: '100%' }} />
 </div>
 <div className="min-w-0 flex-1 w-full text-center sm:text-left">
 <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-2.5">
 <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 text-[9px] font-bold rounded-md border border-slate-200 dark:border-white/5">Aset QR</span>
 <span className="text-slate-300 dark:text-zinc-600 text-xs">•</span>
 <span className="text-slate-400 dark:text-zinc-500 text-[9px] font-semibold">Dibuat {new Date(qrData.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
 </div>
 <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold italic tracking-tighter mb-3 truncate leading-tight">{qrData.name}</h1>
 <div className="flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 w-fit mx-auto sm:mx-0">
 <FontAwesomeIcon icon={faLink} className="text-indigo-400 text-xs flex-shrink-0" />
 <p className="text-[11px] font-bold truncate text-slate-600 dark:text-zinc-400 max-w-[180px] sm:max-w-xs">{qrData.targetUrl}</p>
 </div>
 </div>
 </section>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
 {[
 { label: "Total Scan", value: qrData.views, icon: faQrcode, color: "amber" },
 { label: "Scan Unik", value: aggregatedData?.uniqueIps || 0, icon: faFingerprint, color: "emerald" },
 { label: "Browser", value: aggregatedData?.browsers[0]?.name || 'N/A', icon: faCompass, color: "indigo" },
 { label: "Perangkat", value: aggregatedData?.devices[0]?.name || 'N/A', icon: faMobileAlt, color: "violet" },
 ].map((s, idx) => (
 <motion.div 
 key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
 className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col gap-2 sm:gap-4 group hover:bg-slate-100 dark:bg-white/[0.02] transition-colors text-left"
 >
 <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/10 flex items-center justify-center text-${s.color}-400 group-hover:scale-110 transition-transform`}>
 <FontAwesomeIcon icon={s.icon} className="text-xs sm:text-sm" />
 </div>
 <div>
 <p className="text-[8px] sm:text-xs font-bold font-semibold text-slate-500 dark:text-zinc-600 mb-0.5">{s.label}</p>
 <p className="text-lg sm:text-2xl font-bold italic tracking-tighter truncate">{s.value.toLocaleString()}</p>
 </div>
 </motion.div>
 ))}
 </div>

 <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden">
 <div className="flex items-center justify-between mb-8 text-left">
 <div>
 <h3 className="text-base sm:text-lg font-bold italic tracking-tighter flex items-center gap-3">
 <FontAwesomeIcon icon={faChartLine} className="text-indigo-500" />
 Grafik Kunjungan
 </h3>
 <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium tracking-wide">Aktivitas dalam 14 hari terakhir.</p>
 </div>
 </div>
 <div className="w-full h-[300px] sm:h-[350px]">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={aggregatedData?.trafficChart || []}>
 <defs>
 <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
 <XAxis dataKey="date" stroke="#3f3f46" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('-').slice(2).join('/')} dy={10} />
 <YAxis stroke="#3f3f46" fontSize={8} tickLine={false} axisLine={false} />
 <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
 <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </section>

 <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden group">
 <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01]">
 <div className="text-left">
 <h3 className="text-base sm:text-lg font-bold italic tracking-tighter flex items-center gap-3">
 <FontAwesomeIcon icon={faMapMarkedAlt} className="text-indigo-500" />
 Analisis Geografis
 </h3>
 <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium text-left">Peta persebaran dan daftar lokasi teratas.</p>
 </div>
 <button 
 onClick={() => setIsMapExpanded(true)}
 className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all border border-slate-200 dark:border-white/5 shadow-inner group/expand"
 >
 <FontAwesomeIcon icon={faExpandAlt} className="text-slate-500 dark:text-zinc-500 group-hover/expand:text-slate-900 dark:text-white transition-colors text-xs" />
 </button>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3">
 <div className="lg:col-span-2 h-[350px] sm:h-[450px] bg-slate-100 dark:bg-slate-100 dark:bg-black/40 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/5">
 <AnalyticsMap locations={qrData.analytics || []} type="overview" />
 </div>
 <div className="p-6 sm:p-8 flex flex-col h-full bg-slate-50 dark:bg-white/[0.01]">
 <div className="flex items-center gap-3 mb-6 sm:mb-8 text-left">
 <FontAwesomeIcon icon={faGlobe} className="text-emerald-500" />
 <h4 className="text-xs sm:text-xs font-bold font-semibold text-emerald-500 leading-none">Lokasi Teratas</h4>
 </div>
 <div className="space-y-6 sm:space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
 {aggregatedData?.countries.length ? aggregatedData.countries.map((c, i) => (
 <div key={i} className="text-left">
 <div className="flex justify-between items-center text-[8px] sm:text-xs font-bold mb-2">
 <span className="text-slate-500 dark:text-zinc-500 truncate max-w-[70%]">{COUNTRY_DATA[c.name]?.name || c.name} ({c.name})</span>
 <span className="text-slate-700 dark:text-zinc-300">{c.count} Scan</span>
 </div>
 <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
 <motion.div initial={{ width: 0 }} animate={{ width: `${(c.count / (qrData.analytics?.length || 1)) * 100}%` }} className="h-full bg-emerald-500" />
 </div>
 </div>
 )) : (
 <div className="flex-1 flex flex-col items-center justify-center opacity-30 pt-10 pb-10">
 <FontAwesomeIcon icon={faGlobe} className="text-3xl mb-4" />
 <p className="text-xs font-bold font-semibold text-center">Belum ada data</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </section>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 pb-10">
 <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-2xl border border-slate-200 dark:border-white/5 space-y-8 flex flex-col justify-center">
 <div className="space-y-6 text-left">
 <p className="text-[8px] font-bold text-slate-500 dark:text-zinc-600 font-semibold border-b border-slate-200 dark:border-white/5 pb-2">Browser Terpopuler</p>
 {aggregatedData?.browsers.slice(0,3).map((b, i) => (
 <div key={i} className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-400">
 <span className="truncate">{b.name}</span>
 <span className="text-indigo-400 text-xs">{b.count}</span>
 </div>
 ))}
 </div>
 <div className="space-y-6 text-left">
 <p className="text-[8px] font-bold text-slate-500 dark:text-zinc-600 font-semibold border-b border-slate-200 dark:border-white/5 pb-2 text-left">Sistem Terpopuler</p>
 {aggregatedData?.devices.slice(0,3).map((d, i) => (
 <div key={i} className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-400">
 <span className="truncate">{d.name}</span>
 <span className="text-violet-400 text-xs">{d.count}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col">
 <div className="px-6 sm:px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.01] text-left">
 <h3 className="text-xs sm:text-sm font-bold italic font-semibold text-left">Daftar Aktivitas Baru</h3>
 <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[8px] font-bold font-semibold text-slate-500 dark:text-zinc-600">Terakhir dari 500 Rekaman</span>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-slate-100 dark:bg-black/10 text-[8px] sm:text-xs font-bold font-semibold text-slate-500 dark:text-zinc-600 border-b border-slate-200 dark:border-white/5">
 <tr>
 <th className="px-6 sm:px-8 py-5">Waktu Scan</th>
 <th className="px-4 sm:px-6 py-5">Lokasi & Perangkat</th>
 <th className="px-4 sm:px-6 py-5">Koordinat / IP</th>
 <th className="px-6 sm:px-8 py-5 text-right">Referer</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/[0.02]">
 {qrData.analytics?.length ? qrData.analytics.slice(0, 10).map((a) => (
 <tr key={a.id} className="hover:bg-slate-50 dark:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => setSelectedAnalytics(a)}>
 <td className="px-6 sm:px-8 py-5">
 <p className="text-xs sm:text-[11px] font-bold text-zinc-200">{formatDate(a.createdAt).split(',')[0]}</p>
 <p className="text-[8px] font-bold text-slate-500 dark:text-zinc-600 font-semibold mt-0.5">{formatDate(a.createdAt).split(',')[1]}</p>
 </td>
 <td className="px-4 sm:px-6 py-5">
 <div className="flex items-center gap-4 text-left">
 <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs text-slate-500 dark:text-zinc-600 group-hover:bg-indigo-600 group-hover:text-slate-900 dark:text-white transition-all shrink-0">
 <FontAwesomeIcon icon={a.device?.toLowerCase().includes('mobile') ? faMobileAlt : faDesktop} />
 </div>
 <div className="min-w-0">
 <p className="text-xs sm:text-[11px] font-bold text-slate-700 dark:text-zinc-300 truncate tracking-tight">{a.city}, {COUNTRY_DATA[a.country || ""]?.name || a.country}</p>
 <p className="text-[8px] font-bold text-slate-400 dark:text-zinc-700 font-semibold mt-1">{a.browser} / {a.os}</p>
 </div>
 </div>
 </td>
 <td className="px-4 sm:px-6 py-5">
 <div className="flex flex-col gap-1 text-left">
 <p className="text-[8px] font-bold text-emerald-500/80">{a.lat ? `${a.lat.toFixed(4)}, ${a.lon?.toFixed(4)}` : 'N/A'}</p>
 <code className="text-xs font-bold text-slate-500 dark:text-zinc-600"> {a.ip}</code>
 </div>
 </td>
 <td className="px-6 sm:px-8 py-5 text-right">
 <span className="text-[8px] sm:text-xs font-bold text-amber-500/40 font-semibold truncate max-w-[100px] inline-block">{a.referer || 'LANGSUNG'}</span>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={4} className="px-8 py-20 text-center text-slate-400 dark:text-zinc-700 font-bold text-xs italic opacity-40">Menunggu data masuk...</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 </main>

 <AnimatePresence>
 {isMapExpanded && (
 <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-[99999] flex flex-col p-4 sm:p-8">
 <div className="flex items-center justify-between mb-6">
 <div className="text-left">
 <h3 className="text-xl font-bold italic tracking-tighter">Analisis Geografis Penuh</h3>
 <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium text-left">Tampilan global persebaran scan QR Anda.</p>
 </div>
 <button onClick={() => setIsMapExpanded(false)} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 transition-all">
 <FontAwesomeIcon icon={faTimes} />
 </button>
 </div>
 <div className="flex-1 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-3xl bg-slate-100 dark:bg-black relative">
 <AnalyticsMap locations={qrData.analytics || []} type="overview" />
 </div>
 </div>
 )}

 {selectedAnalytics && (
 <div className="fixed inset-0 bg-slate-100 dark:bg-black/95 backdrop-blur-3xl z-[99999] flex items-center justify-center p-4" onClick={() => setSelectedAnalytics(null)}>
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
 onClick={(e) => e.stopPropagation()}
 className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-3xl flex flex-col md:flex-row max-h-[95vh] overflow-y-auto"
 >
 <div className="w-full md:w-3/5 min-h-[300px] sm:min-h-[450px] relative bg-slate-100 dark:bg-slate-100 dark:bg-black/40 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 overflow-hidden">
 <AnalyticsMap locations={[selectedAnalytics]} type="detail" />
 
 <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
 <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold font-semibold flex items-center gap-3 border border-slate-200 dark:border-white/10 shadow-2xl pointer-events-none">
 <FontAwesomeIcon icon={faMapMarkerAlt} className="animate-bounce" /> {selectedAnalytics.city}
 </div>
 <a 
 href={`https://www.google.com/maps?q=${selectedAnalytics.lat},${selectedAnalytics.lon}`} 
 target="_blank" rel="noreferrer"
 className="bg-white text-slate-900 dark:text-black px-4 py-2 rounded-xl text-xs font-bold font-semibold flex items-center gap-3 shadow-2xl hover:bg-zinc-100 transition-all active:scale-95 group/gm"
 >
 <FontAwesomeIcon icon={faLocationArrow} className="group-hover/gm:translate-x-1 group-hover/gm:-translate-y-1 transition-transform" /> 
 Google Maps
 </a>
 </div>

 <div className="absolute bottom-6 left-6 right-6 z-[1000] pointer-events-none">
 <div className="bg-slate-100 dark:bg-black/80 backdrop-blur-xl border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
 <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 text-xs shrink-0" />
 <p className="text-[9px] font-bold text-amber-200/60 leading-tight text-left">
 <span className="text-amber-500 font-bold">INFO:</span> Lokasi terdeteksi dari IP operator/ISP. Koordinat mungkin merupakan pusat server provider, bukan lokasi fisik perangkat 100%.
 </p>
 </div>
 </div>
 </div>

 <div className="w-full md:w-2/5 p-5 sm:p-6 bg-white dark:bg-slate-900 flex flex-col justify-between">
 <div className="space-y-10">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4 text-left">
 <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-2xl text-slate-900 dark:text-white border border-indigo-500/20 shadow-inner">
 <FontAwesomeIcon icon={selectedAnalytics.device?.toLowerCase().includes('mobile') ? faMobileAlt : faDesktop} />
 </div>
 <div className="text-left">
 <h3 className="text-xl font-bold italic tracking-tighter text-slate-900 dark:text-white leading-none mb-1">Detail Scan</h3>
 <p className="text-slate-500 dark:text-zinc-600 text-xs font-bold">{selectedAnalytics.ip}</p>
 </div>
 </div>
 <button onClick={() => setSelectedAnalytics(null)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-white/5">
 <FontAwesomeIcon icon={faTimes} />
 </button>
 </div>

 <div className="grid grid-cols-1 gap-6 text-left">
 {[
 { label: "Waktu Scan", value: formatDate(selectedAnalytics.createdAt), icon: faCalendarAlt, color: "zinc" },
 { label: "Wilayah & Negara", value: `${selectedAnalytics.city || '??'}, ${COUNTRY_DATA[selectedAnalytics.country || ""]?.name || selectedAnalytics.country}`, icon: faGlobe, color: "emerald" },
 { label: "Koordinat Lokasi", value: selectedAnalytics.lat ? `${selectedAnalytics.lat.toFixed(6)}, ${selectedAnalytics.lon?.toFixed(6)}` : 'N/A', icon: faMapMarkedAlt, color: "indigo" },
 { label: "Aplikasi & Sistem", value: `${selectedAnalytics.browser} / ${selectedAnalytics.os}`, icon: faCompass, color: "amber" },
 { label: "Tipe Perangkat", value: selectedAnalytics.device || 'PC / Laptop', icon: faMobileAlt, color: "violet" },
 ].map((m, i) => (
 <div key={i} className="flex items-center gap-5 group">
 <div className={`w-10 h-10 rounded-xl bg-${m.color}-500/10 flex items-center justify-center text-${m.color}-400 shrink-0 border border-${m.color}-500/10 transition-colors group-hover:bg-${m.color}-500/20`}>
 <FontAwesomeIcon icon={m.icon} className="text-xs" />
 </div>
 <div className="min-w-0">
 <p className="text-[7px] font-bold text-slate-500 dark:text-zinc-600 font-semibold mb-1 leading-none">{m.label}</p>
 <p className="text-xs font-bold text-zinc-100 italic truncate tracking-tight">{m.value}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 
 <div className="mt-10 sm:mt-12">
 <button onClick={() => setSelectedAnalytics(null)} className="w-full py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold font-semibold transition-all text-slate-900 dark:text-white">
 Tutup Detail
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <style jsx global>{`
 .custom-scrollbar::-webkit-scrollbar { width: 3px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
 .leaflet-container { z-index: 1 !important; }
 .leaflet-pane { z-index: 400 !important; }
 .leaflet-top, .leaflet-bottom { z-index: 500 !important; }
 .leaflet-popup { z-index: 600 !important; }
 `}</style>

 </div>
 );
}
