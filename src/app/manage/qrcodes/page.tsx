"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlus, faQrcode, faDownload, faPaintBrush, faTrash,
  faKeyboard, faLink, faImage, faWifi, faEnvelope, faPhone, faSms,
  faFileImage, faFileCode, faChartLine, faGlobe
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { DynamicQR, type QrConfig, QR_TEMPLATES } from "@/components/DynamicQR";
import { useLanguage } from "@/contexts/LanguageContext";

interface QrCodeEntry {
  id: string;
  name: string;
  targetUrl: string;
  qrShortUrl: string;
  type?: string;
  styleConfig: string | null;
  logo: string | null;
  isActive: boolean;
  views: number;
  createdAt: string;
}

const STATIC_TYPES = ['wifi', 'text', 'email', 'sms', 'call', 'phone', 'whatsapp'];
const isStatic = (type?: string, targetUrl?: string) => {
  const t = type?.toLowerCase() || "";
  if (STATIC_TYPES.includes(t)) return true;
  if (targetUrl) {
    const raw = targetUrl.trim();
    if (raw.startsWith('WIFI:') || raw.startsWith('tel:') || raw.startsWith('mailto:') || 
        raw.startsWith('SMSTO:') || raw.startsWith('sms:') || raw.includes('wa.me')) return true;
    if (!raw.startsWith('http') && !raw.includes('://')) return true;
  }
  return false;
};

const DOWNLOAD_SIZES = [
  { label: '500px', value: 500, desc: 'Web' },
  { label: '1000px', value: 1000, desc: 'HD' },
  { label: '2000px', value: 2000, desc: 'Print' },
  { label: '4000px', value: 4000, desc: '4K' },
];

export default function QrCodesPage() {
  const { t, language } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [qrcodes, setQrcodes] = useState<QrCodeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const memoizedQrcodes = React.useMemo(() => {
    return qrcodes.map(qr => ({
      ...qr,
      parsedStyle: qr.styleConfig ? (typeof qr.styleConfig === 'string' ? JSON.parse(qr.styleConfig) : qr.styleConfig) : null
    }));
  }, [qrcodes]);
  
  // Modal states
  const [isCreating, setIsCreating] = useState(false);
  const [sharingQr, setSharingQr] = useState<QrCodeEntry | null>(null);
  const [sharingTab, setSharingTab] = useState<'download' | 'embed'>('download');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Settings states for sharing/export
  const [downloadRes, setDownloadRes] = useState(1000);
  const [embedSize, setEmbedSize] = useState(400);
  const [embedBg, setEmbedBg] = useState('transparent');
  const [embedPadding, setEmbedPadding] = useState(20);
  const [embedRadius, setEmbedRadius] = useState(40);

  // Create state
  const [activeTab, setActiveTab] = useState('url');
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");
  
  const [QRStylingEngine, setQRStylingEngine] = useState<any>(null);
  const [hostname, setHostname] = useState("");
  const [protocol, setProtocol] = useState("https://");

  useEffect(() => {
    import("qr-code-styling").then((m) => setQRStylingEngine(() => m.default));
    if (typeof window !== "undefined") {
      setHostname(window.location.host);
      setProtocol(`${window.location.protocol}//`);
    }
  }, []);

  const fetchQrcodes = async () => {
    try {
      const res = await fetch("/api/user/qrcodes");
      const data = await res.json();
      if (res.ok) setQrcodes(data.data || []);
    } catch { toast.error(language === 'en' ? "Failed to load QR Codes" : "Gagal memuat QR Code"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchQrcodes();
  }, [status, router]);

  useEffect(() => {
    const target = searchParams.get('target');
    if (target) {
      setNewTarget(`${window.location.origin}/${target}`);
      setNewName(language === 'en' ? `QR for ${target}` : `QR untuk ${target}`);
      setIsCreating(true);
    }
  }, [searchParams]);

  const handleCreateQr = async () => {
    let finalData = newTarget;
    if (activeTab === 'wifi') finalData = `WIFI:S:${newTarget};T:${wifiSecurity};P:${wifiPass};;`;
    else if (activeTab === 'email') finalData = `mailto:${newTarget}`;
    else if (activeTab === 'phone') finalData = `tel:${newTarget}`;
    else if (activeTab === 'sms') finalData = `sms:${newTarget}`;
    else if (activeTab === 'whatsapp') finalData = `https://wa.me/${newTarget}`;

    if (!finalData) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/qrcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: (session?.user as any)?.id,
          name: newName || `QR ${activeTab.toUpperCase()}`, 
          targetUrl: finalData,
          type: activeTab 
        })
      });
      if (res.ok) {
        toast.success(language === 'en' ? "New QR Code created successfully!" : "QR Code baru berhasil dibuat!");
        setIsCreating(false);
        setNewName(""); setNewTarget(""); setWifiPass("");
        fetchQrcodes();
      }
    } catch { toast.error(language === 'en' ? "Failed to create QR Code" : "Gagal membuat QR Code"); }
    finally { setIsSaving(false); }
  };

  const downloadQr = async (qrEntry: QrCodeEntry, extension: 'png' | 'svg' | 'webp' = 'png') => {
    if (!QRStylingEngine || !qrEntry) { toast.error(language === 'en' ? "Failed to start download" : "Gagal memulai unduhan"); return; }
    
    let activeConfig = QR_TEMPLATES[0].config;
    if (qrEntry.styleConfig) {
      try { activeConfig = typeof qrEntry.styleConfig === 'string' ? JSON.parse(qrEntry.styleConfig) : qrEntry.styleConfig; }
      catch { }
    }

    const qrData = isStatic(qrEntry.type, qrEntry.targetUrl) ? qrEntry.targetUrl : `${protocol}${hostname}/${qrEntry.qrShortUrl}`;

    const instance = new QRStylingEngine({
      width: downloadRes, height: downloadRes, data: qrData,
      image: qrEntry.logo || undefined,
      dotsOptions: activeConfig.dotsOptions,
      cornersSquareOptions: activeConfig.cornersSquareOptions,
      cornersDotOptions: activeConfig.cornersDotOptions,
      backgroundOptions: activeConfig.backgroundOptions,
      imageOptions: { ...activeConfig.imageOptions, crossOrigin: 'anonymous' }
    });

    instance.download({ name: qrEntry.name || "qrcode", extension });
    toast.success(language === 'en' ? `Design saved as .${extension.toUpperCase()}` : `Hasil desain disimpan sebagai .${extension.toUpperCase()}`);
  };

  const handleDeleteQr = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/user/qrcodes/${deleteConfirmId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(language === 'en' ? "QR Code deleted successfully!" : "QR Code berhasil dihapus!");
        setQrcodes(qrcodes.filter(q => q.id !== deleteConfirmId));
        setDeleteConfirmId(null);
      } else if (res.status === 404) {
        // ID tidak ditemukan — hapus dari daftar lokal juga
        toast.info(language === 'en' ? "This QR Code is no longer on the server." : "QR Code ini sudah tidak ada di server.");
        setQrcodes(qrcodes.filter(q => q.id !== deleteConfirmId));
        setDeleteConfirmId(null);
      } else {
        toast.error(language === 'en' ? "Failed to delete. Try again." : "Gagal menghapus. Coba lagi.");
      }
    } catch { toast.error(language === 'en' ? "Network issue. Try again." : "Koneksi bermasalah. Coba lagi."); }
  };

  if (isLoading) return (
    <div className="w-full flex flex-col items-center justify-center py-40 opacity-50">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{language === 'en' ? "Loading your QR Codes..." : "Memuat QR Code kamu..."}</p>
    </div>
  );

  return (
    <div className="w-full h-full text-slate-900 dark:text-white selection:bg-indigo-500/30 flex flex-col relative pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-[50] bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-b border-slate-200/30 dark:border-white/5 h-14 flex items-center px-4 sm:px-8 justify-between -mx-4 sm:-mx-10 -mt-6 sm:-mt-8 mb-8">
        <div className="w-[100px]" />
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <FontAwesomeIcon icon={faQrcode} />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 dark:text-white leading-none block mb-1">{language === 'en' ? "My QR Codes" : "QR Code Saya"}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest hidden sm:block">{language === 'en' ? "Manage All QR Codes" : "Kelola Semua QR Code"}</span>
          </div>
        </div>
        <div className="w-[100px]" />
      </div>

      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full px-2 sm:px-8 py-6">
        <header className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight mb-2">{language === 'en' ? "My QR Codes" : "QR Code Saya"}</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest opacity-60">{language === 'en' ? `Total ${qrcodes.length} active QR Codes` : `Total ${qrcodes.length} QR Code aktif`}</p>
          </div>
          <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
            <FontAwesomeIcon icon={faPlus} /> {language === 'en' ? "Create New QR" : "Buat QR Baru"}
          </button>
        </header>

        {qrcodes.length === 0 ? (
          <div className="bg-white/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-[40px] p-20 text-center">
            <div className="w-24 h-24 bg-violet-600/5 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl text-violet-600/20"><FontAwesomeIcon icon={faQrcode} /></div>
            <h3 className="text-xl font-bold mb-3">{t("qrcode.empty")}</h3>
            <p className="text-slate-500 text-sm mb-10 max-w-sm mx-auto">{t("qrcode.empty_desc")}</p>
            <button onClick={() => setIsCreating(true)} className="px-10 py-4 bg-violet-600 text-white rounded-2xl text-xs font-bold shadow-xl hover:bg-violet-700 transition-all">{language === 'en' ? "Create First QR Code" : "Buat QR Code Pertama"}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {memoizedQrcodes.map((qr) => {
              const style = qr.parsedStyle || QR_TEMPLATES[0].config;
              const qrDataStr = isStatic(qr.type, qr.targetUrl) ? qr.targetUrl : `${protocol}${hostname}/${qr.qrShortUrl}`;
              return (
                <motion.div key={qr.id} layout className="group relative bg-white/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-[32px] p-6 hover:border-violet-500/50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-violet-600/5">
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${isStatic(qr.type, qr.targetUrl) ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {isStatic(qr.type, qr.targetUrl) ? 'Static' : 'Dynamic'}
                    </div>
                  </div>

                  <div className="flex flex-col items-center mb-8">
                    <div className="relative p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-1 border border-slate-100 dark:border-white/5">
                      <DynamicQR data={qrDataStr} config={style} size={160} logo={qr.logo} />
                    </div>
                    <h3 className="font-bold text-sm mt-6 mb-1 text-center truncate w-full">{qr.name}</h3>
                    <div className="flex items-center gap-1.5 opacity-40">
                      <FontAwesomeIcon icon={faLink} className="text-[8px]" />
                      <p className="text-[10px] font-bold truncate max-w-[150px] uppercase tracking-tighter">{isStatic(qr.type, qr.targetUrl) ? qr.type : qr.targetUrl}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => router.push(`/manage/qrcodes/${qr.id}/edit`)} className="bg-slate-100 dark:bg-white/5 hover:bg-violet-600 hover:text-white py-3.5 rounded-2xl text-[10px] font-bold transition-all flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faPaintBrush} /> {t("qrcode.action.edit")}
                    </button>
                    {!isStatic(qr.type, qr.targetUrl) ? (
                      <button onClick={() => router.push(`/manage/qrcodes/${qr.id}`)} className="bg-slate-100 dark:bg-white/5 hover:bg-emerald-600 hover:text-white py-3.5 rounded-2xl text-[10px] font-bold transition-all flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faChartLine} /> {language === 'en' ? "Stats" : "Stats"}
                      </button>
                    ) : (
                      <div className="bg-slate-100 dark:bg-white/5 py-3.5 rounded-2xl text-[10px] font-bold flex items-center justify-center opacity-20 grayscale cursor-not-allowed">
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                    )}
                    <button onClick={() => { setSharingQr(qr); setSharingTab('download'); }} className="col-span-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                      <FontAwesomeIcon icon={faDownload} /> {language === 'en' ? "Save / Export" : "Save / Export"}
                    </button>
                  </div>

                  <button onClick={() => setDeleteConfirmId(qr.id)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-all flex items-center justify-center shadow-lg hover:scale-110">
                    <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.main>

      {/* MODALS */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreating(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[40px] p-8 sm:p-10 relative z-10 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-2xl border border-white/10 text-left">
              <h2 className="text-2xl font-bold mb-8">{t("qrcode.form.title")}</h2>
              
              <div className="grid grid-cols-4 gap-2 mb-10 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl">
                {[
                  { id: 'url', icon: faLink, label: 'URL' },
                  { id: 'wifi', icon: faWifi, label: 'WiFi' },
                  { id: 'whatsapp', icon: faGlobe, label: 'WA' },
                  { id: 'text', icon: faKeyboard, label: 'Teks' },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center py-3 rounded-xl transition-all ${activeTab === t.id ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-400'}`}>
                    <FontAwesomeIcon icon={t.icon} className="text-xs mb-1" />
                    <span className="text-[8px] font-bold">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t("qrcode.form.name")}</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={language === 'en' ? "e.g. Restaurant Menu, Promo Link..." : "Contoh: Menu Restoran, Link Promo..."} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    {activeTab === 'wifi' ? (language === 'en' ? "WiFi Name (SSID)" : "Nama WiFi (SSID)") : activeTab === 'whatsapp' ? (language === 'en' ? "WhatsApp Number" : "Nomor WhatsApp") : activeTab === 'text' ? (language === 'en' ? "Text / Message" : "Teks / Pesan") : t("qrcode.form.url")}
                  </label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder={activeTab === 'wifi' ? (language === 'en' ? "WiFi network name..." : "Nama jaringan WiFi...") : activeTab === 'whatsapp' ? '628xxxxxxxxxx' : activeTab === 'text' ? (language === 'en' ? "Type message here..." : "Ketik pesan di sini...") : 'https://...'}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 font-mono"
                  />
                </div>
                
                {activeTab === 'wifi' && (
                  <input type="text" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} placeholder={language === 'en' ? "WiFi Password (leave blank if no password)" : "Password WiFi (kosongkan jika tanpa password)"} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 mt-4" />
                )}

                <button onClick={handleCreateQr} disabled={isSaving || !newTarget} className="w-full py-5 bg-violet-600 text-white rounded-2xl font-bold text-xs mt-8 shadow-xl shadow-violet-600/20 disabled:opacity-50 hover:bg-violet-700 active:scale-95 transition-all">
                  {isSaving ? (language === 'en' ? 'Creating...' : 'Sedang membuat...') : (language === 'en' ? 'Create QR Code Now' : 'Buat QR Code Sekarang')}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {sharingQr && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSharingQr(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-10 relative z-10 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-2xl border border-white/5 text-center">
              <div className="relative mb-10">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl inline-block border border-slate-100 dark:border-white/5">
                  <DynamicQR 
                    data={isStatic(sharingQr.type, sharingQr.targetUrl) ? sharingQr.targetUrl : `${protocol}${hostname}/${sharingQr.qrShortUrl}`} 
                    config={(sharingQr as any).parsedStyle || QR_TEMPLATES[0].config} size={220} logo={sharingQr.logo} 
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-8">{language === 'en' ? "Export Asset" : "Export Asset"}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => downloadQr(sharingQr, 'png')} className="py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all outline-none">PNG Image</button>
                <button onClick={() => downloadQr(sharingQr, 'svg')} className="py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all">SVG Vector</button>
              </div>
              <button onClick={() => setSharingQr(null)} className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">{language === 'en' ? "Close" : "Tutup"}</button>
            </motion.div>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-[32px] p-10 max-w-sm w-full relative z-10 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 text-xl"><FontAwesomeIcon icon={faTrash} /></div>
              <h3 className="text-xl font-bold mb-2">{language === 'en' ? "Delete this QR Code?" : "Hapus QR Code ini?"}</h3>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed">{language === 'en' ? "Deleted QR Codes cannot be recovered. Make sure you are sure before continuing." : "QR Code yang sudah dihapus tidak bisa dikembalikan. Pastikan kamu yakin sebelum melanjutkan."}</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-xs font-bold transition-all">{language === 'en' ? "Cancel" : "Batal"}</button>
                <button onClick={handleDeleteQr} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-bold shadow-xl shadow-red-600/20 active:scale-95 transition-all">{language === 'en' ? "Yes, Delete" : "Ya, Hapus"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
