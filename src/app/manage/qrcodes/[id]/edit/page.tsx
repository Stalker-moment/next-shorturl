"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faQrcode, faSave, faPaintBrush,
  faKeyboard, faLink, faImage, faWifi, faEnvelope, faPhone, faSms, faMagic,
  faFileImage, faFileCode, faCode, faSyncAlt, faGlobe, faExclamationTriangle,
  faDesktop, faTimes, faCopy, faPlus
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { DynamicQR, type QrConfig, QR_TEMPLATES } from "@/components/DynamicQR";

// ─── Types & Constants ───────────────────────────────────────────────────────

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

const SHAPES_DOTS = ["square", "dots", "rounded", "classy", "classy-rounded", "extra-rounded"] as const;
const SHAPES_CORNERS_SQUARE = ["square", "dot", "extra-rounded"] as const;

const QR_TYPES = [
  { id: "url",      label: "Dynamic Link",   icon: faLink,     placeholder: "https://example.com" },
  { id: "text",     label: "Standard Text",  icon: faKeyboard, placeholder: "Tulis pesan..." },
  { id: "email",    label: "Email",          icon: faEnvelope, placeholder: "email@example.com" },
  { id: "phone",    label: "Voice Call",     icon: faPhone,    placeholder: "+62..." },
  { id: "wifi",     label: "WLAN Access",    icon: faWifi,     placeholder: "Network SSID" },
  { id: "sms",      label: "Direct SMS",     icon: faSms,      placeholder: "Nomor tujuan..." },
  { id: "whatsapp", label: "WhatsApp",       icon: faGlobe,    placeholder: "Nomor WA..." },
];

const BUILTIN_LOGOS = [
  { name: "Facebook",    url: "https://cdn-icons-png.flaticon.com/512/124/124010.png" },
  { name: "Instagram",   url: "https://cdn-icons-png.flaticon.com/512/174/174855.png" },
  { name: "WhatsApp",    url: "https://cdn-icons-png.flaticon.com/512/733/733585.png" },
  { name: "YouTube",     url: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png" },
  { name: "TikTok",      url: "https://cdn-icons-png.flaticon.com/512/3046/3046121.png" },
  { name: "Twitter (X)", url: "https://cdn-icons-png.flaticon.com/512/5968/5968830.png" },
  { name: "LinkedIn",    url: "https://cdn-icons-png.flaticon.com/512/174/174857.png" },
  { name: "Google",      url: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png" },
  { name: "Apple",       url: "https://cdn-icons-png.flaticon.com/512/0/747.png" },
  { name: "Spotify",     url: "https://cdn-icons-png.flaticon.com/512/174/174872.png" },
];

const STATIC_TYPES = ["wifi", "text", "email", "sms", "call", "phone", "whatsapp"];
const isStatic = (type?: string, targetUrl?: string): boolean => {
  const t = type?.toLowerCase() || "";
  if (STATIC_TYPES.includes(t)) return true;
  if (targetUrl) {
    const raw = targetUrl.trim();
    if (raw.startsWith("WIFI:") || raw.startsWith("tel:") || raw.startsWith("mailto:") ||
        raw.startsWith("SMSTO:") || raw.startsWith("sms:") || raw.includes("wa.me")) return true;
    if (!raw.startsWith("http") && !raw.includes("://")) return true;
  }
  return false;
};

const DOWNLOAD_SIZES = [
  { label: "500px",  value: 500,  desc: "Web" },
  { label: "1000px", value: 1000, desc: "HD" },
  { label: "2000px", value: 2000, desc: "Print" },
  { label: "4000px", value: 4000, desc: "4K" },
];

const DEFAULT_CONFIG: QrConfig = {
  dotsOptions:          { type: "square", color: "#000000" },
  cornersSquareOptions: { type: "square", color: "#000000" },
  cornersDotOptions:    { type: "square", color: "#000000" },
  backgroundOptions:    { color: "#ffffff" },
  imageOptions:         { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function QrEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // ── Core State ──────────────────────────────────────────────────────────────
  const [qr, setQr] = useState<QrCodeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [qrConfig, setQrConfig] = useState<QrConfig>(DEFAULT_CONFIG);
  const [editorTab, setEditorTab] = useState<"content" | "template" | "shape" | "color" | "embed">("content");
  const [previewTab, setPreviewTab] = useState<"download" | "embed">("download");
  const [downloadRes, setDownloadRes] = useState(1000);

  // ── Dynamic Content State ────────────────────────────────────────────────────
  const [editWifiSsid, setEditWifiSsid] = useState("");
  const [editWifiPass, setEditWifiPass] = useState("");
  const [editWifiSec,  setEditWifiSec]  = useState("WPA");
  const [editEmailAddr, setEditEmailAddr] = useState("");
  const [editEmailSubj, setEditEmailSubj] = useState("");
  const [editEmailBody, setEditEmailBody] = useState("");
  const [editSmsPhone, setEditSmsPhone] = useState("");
  const [editSmsText,  setEditSmsText]  = useState("");
  const [editCallPhone, setEditCallPhone] = useState("");
  const [editTextBody,  setEditTextBody]  = useState("");
  const [editWaPhone,   setEditWaPhone]   = useState("");
  const [editWaText,    setEditWaText]    = useState("");

  const [isSimulating, setIsSimulating] = useState(false);
  const [simHtml, setSimHtml] = useState("");

  // ── Embed State ──────────────────────────────────────────────────────────────
  const [embedSize,    setEmbedSize]    = useState(400);
  const [embedBg,      setEmbedBg]      = useState("transparent");
  const [embedPadding, setEmbedPadding] = useState(20);
  const [embedRadius,  setEmbedRadius]  = useState(40);

  // ── Engine ───────────────────────────────────────────────────────────────────
  const [QRStylingEngine, setQRStylingEngine] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [hostname, setHostname] = useState("");
  const [protocol, setProtocol] = useState("https://");

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    import("qr-code-styling").then((m) => setQRStylingEngine(() => m.default));
    if (typeof window !== "undefined") {
      setHostname(window.location.host);
      setProtocol(`${window.location.protocol}//`);
    }
  }, []);

  // ── Fetch QR ─────────────────────────────────────────────────────────────────
  const fetchQr = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/qrcodes/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat QR");
      const entry: QrCodeEntry = data.data;
      setQr(entry);
      if (entry.styleConfig) {
        try {
          const parsed = typeof entry.styleConfig === "string"
            ? JSON.parse(entry.styleConfig)
            : entry.styleConfig;
          setQrConfig({ ...DEFAULT_CONFIG, ...parsed });
        } catch { /* keep default */ }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchQr(); }, [fetchQr]);

  // ── Parse targetUrl into edit states ─────────────────────────────────────────
  useEffect(() => {
    if (!qr) return;
    const raw = qr.targetUrl;
    const type = qr.type?.toLowerCase();

    // Reset
    setEditWifiSsid(""); setEditWifiPass(""); setEditWifiSec("WPA");
    setEditEmailAddr(""); setEditEmailSubj(""); setEditEmailBody("");
    setEditSmsPhone(""); setEditSmsText("");
    setEditCallPhone(""); setEditTextBody("");
    setEditWaPhone(""); setEditWaText("");

    try {
      if (type === "wifi") {
        setEditWifiSsid(raw.match(/S:(.*?);/)?.[1] || "");
        setEditWifiPass(raw.match(/P:(.*?);/)?.[1] || "");
        setEditWifiSec(raw.match(/T:(.*?);/)?.[1] || "WPA");
      } else if (type === "sms") {
        const parts = raw.split(":");
        setEditSmsPhone(parts[1] || ""); setEditSmsText(parts[2] ? decodeURIComponent(parts[2]) : "");
      } else if (type === "call" || type === "phone") {
        setEditCallPhone(raw.replace("tel:", ""));
      } else if (type === "email") {
        setEditEmailAddr(raw.match(/mailto:(.*?)(\?|$)/)?.[1] || "");
        setEditEmailSubj(decodeURIComponent(raw.match(/subject=(.*?)&/)?.[1] || raw.match(/subject=(.*)/)?.[1] || ""));
        setEditEmailBody(decodeURIComponent(raw.match(/body=(.*)/)?.[1] || ""));
      } else if (type === "text") {
        setEditTextBody(raw);
      } else if (type === "whatsapp") {
        const num = raw.match(/wa\.me\/(.*?)(\?|$)/)?.[1] || "";
        const txt = raw.match(/text=(.*)/)?.[1] || "";
        setEditWaPhone(num); setEditWaText(txt ? decodeURIComponent(txt) : "");
      }
    } catch { /* parse error */ }
  }, [qr?.id, qr?.targetUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updateUrl = (url: string) => setQr((prev) => prev ? { ...prev, targetUrl: url } : prev);

  const handleSave = async () => {
    if (!qr) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/user/qrcodes/${qr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: qr.name,
          targetUrl: qr.targetUrl,
          styleConfig: qrConfig,
          logo: qr.logo,
          type: qr.type
        }),
      });
      if (res.ok) {
        toast.success("Desain QR berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan");
      }
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQr = async (ext: "png" | "svg" | "webp") => {
    if (!QRStylingEngine || !qr) { toast.error("Engine belum siap"); return; }
    const qrData = isStatic(qr.type, qr.targetUrl) ? qr.targetUrl : `${protocol}${hostname}/${qr.qrShortUrl}`;
    const instance = new QRStylingEngine({
      width: downloadRes, height: downloadRes, data: qrData,
      image: qr.logo || undefined,
      dotsOptions: qrConfig.dotsOptions,
      cornersSquareOptions: qrConfig.cornersSquareOptions,
      cornersDotOptions: qrConfig.cornersDotOptions,
      backgroundOptions: qrConfig.backgroundOptions,
      imageOptions: { ...qrConfig.imageOptions, crossOrigin: "anonymous" },
    });
    instance.download({ name: qr.name || "qrcode", extension: ext });
    toast.success(`Disimpan sebagai .${ext.toUpperCase()} (${downloadRes}px)`);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await fetch("/api/user/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: reader.result }),
        });
        const data = await res.json();
        if (res.ok) {
          setQr((prev) => prev ? { ...prev, logo: data.url } : prev);
          toast.success("Logo diunggah!");
        }
      } catch { toast.error("Gagal unggah logo"); }
    };
  };

  // ── Loading / Error States ───────────────────────────────────────────────────
  if (isLoading) return (
    <div className="w-full h-full flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-violet-500">Memuat Editor QR...</p>
      </div>
    </div>
  );

  if (error || !qr) return (
    <div className="w-full h-full flex items-center justify-center py-32 text-center px-6">
      <div className="max-w-sm">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-2xl" />
        </div>
        <h2 className="text-xl font-bold mb-3">QR Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-zinc-500 text-sm mb-8">{error || "QR Code tidak ditemukan atau Anda tidak memiliki akses."}</p>
        <button onClick={() => router.push("/manage/qrcodes")} className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold transition-all hover:bg-violet-500">
          Kembali ke Daftar
        </button>
      </div>
    </div>
  );

  const qrDataStr = isStatic(qr.type, qr.targetUrl) ? qr.targetUrl : `${protocol}${hostname}/${qr.qrShortUrl}`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full text-slate-900 dark:text-white font-sans selection:bg-violet-500/30 flex flex-col relative">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-[50] bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-200/30 dark:border-white/5 h-14 flex items-center px-4 sm:px-8 justify-between -mx-4 sm:-mx-10 -mt-6 sm:-mt-8 mb-8">
        <button
          onClick={() => router.push("/manage/qrcodes")}
          className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group text-sm font-bold"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="group-hover:-translate-x-0.5 transition-transform text-xs" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <FontAwesomeIcon icon={faQrcode} className="text-white text-sm" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{qr.name}</p>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Editor QR Code</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <FontAwesomeIcon icon={isSaving ? faSyncAlt : faSave} className={isSaving ? "animate-spin" : ""} />
          <span>{isSaving ? "Menyimpan..." : "Simpan Desain"}</span>
        </button>
      </div>

      {/* ── Main Layout ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row gap-8 pb-28 sm:pb-16">

        {/* ══ LEFT: CONTROLS ══ */}
        <div className="flex-1 space-y-6 text-left min-w-0">

          {/* Tab Selector (Responsive: Top on Desktop, Bottom on Mobile) */}
          <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto z-[60] bg-white sm:bg-slate-100/80 dark:bg-slate-900 sm:dark:bg-white/5 border-t sm:border border-slate-200 dark:border-white/5 p-2 sm:p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:shadow-none sm:rounded-2xl">
            {[
              { id: "content",  label: "Isi Data",      icon: faKeyboard },
              { id: "template", label: "Template",      icon: faQrcode },
              { id: "shape",    label: "Bentuk",        icon: faMagic },
              { id: "color",    label: "Warna & Logo",  icon: faImage },
              { id: "embed",    label: "Sematkan",      icon: faCode },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEditorTab(tab.id as typeof editorTab)}
                className={`flex-1 min-w-[58px] py-2.5 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1 whitespace-nowrap active:scale-90 ${
                  editorTab === tab.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 sm:hover:bg-white/60 dark:hover:bg-white/5"
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="text-xs" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 sm:p-7 shadow-sm">

            {/* ─ CONTENT TAB ─ */}
            {editorTab === "content" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nama QR Code</label>
                  <input
                    type="text"
                    value={qr.name}
                    onChange={(e) => setQr({ ...qr, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-4 px-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-400"
                    placeholder="Contoh: QR My Website"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                      <FontAwesomeIcon icon={QR_TYPES.find((t) => t.id === qr.type)?.icon || faGlobe} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tipe & Data QR</p>
                      <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">{qr.type || "GENERIC"}</p>
                    </div>
                  </div>

                  {qr.type === "url" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400">URL Tujuan</label>
                      <input type="text" value={qr.targetUrl} onChange={(e) => updateUrl(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold text-violet-600 dark:text-violet-400 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-mono" />
                    </div>
                  )}

                  {qr.type === "wifi" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-[11px] font-bold text-slate-400">Nama WiFi (SSID)</label>
                        <input type="text" value={editWifiSsid} onChange={(e) => { setEditWifiSsid(e.target.value); updateUrl(`WIFI:S:${e.target.value};T:${editWifiSec};P:${editWifiPass};;`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 dark:text-white outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Kata Sandi</label>
                        <input type="text" value={editWifiPass} onChange={(e) => { setEditWifiPass(e.target.value); updateUrl(`WIFI:S:${editWifiSsid};T:${editWifiSec};P:${e.target.value};;`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold text-amber-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Keamanan</label>
                        <select value={editWifiSec} onChange={(e) => { setEditWifiSec(e.target.value); updateUrl(`WIFI:S:${editWifiSsid};T:${e.target.value};P:${editWifiPass};;`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none appearance-none cursor-pointer">
                          <option value="WPA">WPA/WPA2</option>
                          <option value="WEP">WEP (Legacy)</option>
                          <option value="nopass">Tanpa Sandi</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {qr.type === "whatsapp" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Nomor WhatsApp</label>
                        <input type="text" value={editWaPhone} onChange={(e) => { setEditWaPhone(e.target.value); updateUrl(`https://wa.me/${e.target.value}?text=${encodeURIComponent(editWaText)}`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" placeholder="62..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Pesan Otomatis</label>
                        <textarea value={editWaText} onChange={(e) => { setEditWaText(e.target.value); updateUrl(`https://wa.me/${editWaPhone}?text=${encodeURIComponent(e.target.value)}`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold h-24 resize-none outline-none" />
                      </div>
                    </div>
                  )}

                  {qr.type === "sms" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Nomor Tujuan</label>
                        <input type="text" value={editSmsPhone} onChange={(e) => { setEditSmsPhone(e.target.value); updateUrl(`SMSTO:${e.target.value}:${editSmsText}`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Isi Pesan</label>
                        <textarea value={editSmsText} onChange={(e) => { setEditSmsText(e.target.value); updateUrl(`SMSTO:${editSmsPhone}:${e.target.value}`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold h-24 resize-none outline-none" />
                      </div>
                    </div>
                  )}

                  {(qr.type === "phone" || qr.type === "call") && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400">Nomor Telepon</label>
                      <input type="text" value={editCallPhone} onChange={(e) => { setEditCallPhone(e.target.value); updateUrl(`tel:${e.target.value}`); }}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold text-violet-600 outline-none" />
                    </div>
                  )}

                  {qr.type === "text" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400">Teks</label>
                      <textarea value={editTextBody} onChange={(e) => { setEditTextBody(e.target.value); updateUrl(e.target.value); }}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold h-32 resize-none outline-none" />
                    </div>
                  )}

                  {qr.type === "email" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Alamat Email</label>
                        <input type="email" value={editEmailAddr} onChange={(e) => { setEditEmailAddr(e.target.value); updateUrl(`mailto:${e.target.value}?subject=${encodeURIComponent(editEmailSubj)}&body=${encodeURIComponent(editEmailBody)}`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Subjek</label>
                        <input type="text" value={editEmailSubj} onChange={(e) => { setEditEmailSubj(e.target.value); updateUrl(`mailto:${editEmailAddr}?subject=${encodeURIComponent(e.target.value)}&body=${encodeURIComponent(editEmailBody)}`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400">Isi Email</label>
                        <textarea value={editEmailBody} onChange={(e) => { setEditEmailBody(e.target.value); updateUrl(`mailto:${editEmailAddr}?subject=${encodeURIComponent(editEmailSubj)}&body=${encodeURIComponent(e.target.value)}`); }}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-5 text-sm font-bold h-24 resize-none outline-none" />
                      </div>
                    </div>
                  )}

                  {/* Internal data pointer */}
                  <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                    <p className="text-[8px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Live Target Stream</p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 break-all leading-relaxed whitespace-pre-wrap">{qr.targetUrl}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ─ TEMPLATE TAB ─ */}
            {editorTab === "template" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in fade-in duration-300">
                {QR_TEMPLATES.map((tmp) => {
                  const isActive = qrConfig.dotsOptions.type === tmp.config.dotsOptions.type && qrConfig.dotsOptions.color === tmp.config.dotsOptions.color;
                  return (
                    <button key={tmp.name} onClick={() => setQrConfig({ ...qrConfig, ...tmp.config })}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all relative overflow-hidden group ${
                        isActive ? "bg-violet-500/5 border-violet-500 shadow-xl" : "bg-white/60 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                      }`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${isActive ? "bg-violet-600 text-white rotate-3" : "bg-slate-100 dark:bg-white/10 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/20"}`}>
                        <FontAwesomeIcon icon={faQrcode} />
                      </div>
                      <span className={`text-xs font-bold font-semibold ${isActive ? "text-violet-500" : "text-slate-500 dark:text-slate-400"}`}>{tmp.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ─ SHAPE TAB ─ */}
            {editorTab === "shape" && (
              <div className="space-y-10 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Bentuk Titik Utama</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SHAPES_DOTS.map((sh) => (
                      <button key={sh} onClick={() => setQrConfig({ ...qrConfig, dotsOptions: { ...qrConfig.dotsOptions, type: sh } })}
                        className={`py-4 rounded-xl text-xs font-bold border-2 transition-all capitalize ${
                          qrConfig.dotsOptions.type === sh
                            ? "bg-violet-600 border-violet-400 text-white shadow-lg shadow-violet-600/20"
                            : "bg-white/60 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"
                        }`}>{sh.replace("-", " ")}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Bentuk Sudut</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SHAPES_CORNERS_SQUARE.map((sh) => (
                      <button key={sh} onClick={() => setQrConfig({ ...qrConfig, cornersSquareOptions: { ...qrConfig.cornersSquareOptions, type: sh } })}
                        className={`py-4 rounded-xl text-xs font-bold border-2 transition-all capitalize ${
                          qrConfig.cornersSquareOptions.type === sh
                            ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20"
                            : "bg-white/60 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"
                        }`}>{sh.replace("-", " ")}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─ COLOR & LOGO TAB ─ */}
            {editorTab === "color" && (
              <div className="space-y-10 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex items-center gap-5 bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <input type="color" value={qrConfig.dotsOptions.color}
                      onChange={(e) => setQrConfig({ ...qrConfig, dotsOptions: { ...qrConfig.dotsOptions, color: e.target.value }, cornersSquareOptions: { ...qrConfig.cornersSquareOptions, color: e.target.value }, cornersDotOptions: { ...qrConfig.cornersDotOptions, color: e.target.value } })}
                      className="w-14 h-14 rounded-2xl bg-transparent cursor-pointer" />
                    <div>
                      <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none mb-1">{qrConfig.dotsOptions.color}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Warna Utama</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <input type="color" value={qrConfig.backgroundOptions.color}
                      onChange={(e) => setQrConfig({ ...qrConfig, backgroundOptions: { color: e.target.value } })}
                      className="w-14 h-14 rounded-2xl bg-transparent cursor-pointer" />
                    <div>
                      <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none mb-1">{qrConfig.backgroundOptions.color}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Warna Latar</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identitas Visual (Logo)</p>
                    {qr.logo && (
                      <button onClick={() => setQr({ ...qr, logo: null })} className="text-xs font-bold text-red-400 hover:text-red-500 transition-colors">Hapus Logo</button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2.5">
                    {BUILTIN_LOGOS.map((logo) => (
                      <button key={logo.name} onClick={() => setQr({ ...qr, logo: logo.url })}
                        className={`aspect-square bg-white dark:bg-white/5 rounded-xl border-2 flex items-center justify-center p-3 transition-all hover:scale-105 ${qr.logo === logo.url ? "border-violet-500 bg-violet-500/5 shadow-lg" : "border-slate-100 dark:border-white/5"}`}>
                        <img src={logo.url} alt={logo.name} className={`w-full h-full object-contain ${qr.logo === logo.url ? "" : "grayscale opacity-40 dark:invert dark:opacity-20"}`} />
                      </button>
                    ))}
                    <label className="aspect-square bg-slate-50 dark:bg-white/5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-violet-500 transition-all group">
                      <FontAwesomeIcon icon={faPlus} className="text-xs text-slate-400 group-hover:text-violet-500" />
                      <span className="text-[8px] font-bold text-slate-400 group-hover:text-violet-500 uppercase tracking-tighter transition-colors">Manual</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ─ EMBED TAB ─ */}
            {editorTab === "embed" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <FontAwesomeIcon icon={faSyncAlt} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold leading-relaxed">
                    Sinkronisasi Otomatis Aktif. Perubahan desain akan otomatis terupdate pada semua website yang menanamkan QR ini.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: "Ukuran Frame",       value: embedSize,    setValue: setEmbedSize,    min: 200, max: 800,  step: 10 },
                    { label: "Internal Padding",    value: embedPadding, setValue: setEmbedPadding, min: 0,   max: 100,  step: 5 },
                    { label: "Rounding Radius",     value: embedRadius,  setValue: setEmbedRadius,  min: 0,   max: 100,  step: 10 },
                  ].map(({ label, value, setValue, min, max, step }) => (
                    <div key={label} className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                      <div className="flex justify-between px-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                        <span className="text-xs font-bold text-violet-500">{value}px</span>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setValue(parseInt(e.target.value))}
                        className="w-full accent-violet-600 h-1.5 rounded-full appearance-none cursor-pointer" />
                    </div>
                  ))}
                  <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ambient Base</label>
                      <button onClick={() => setEmbedBg(embedBg === "transparent" ? "#ffffff" : "transparent")}
                        className="text-xs font-bold text-violet-500">{embedBg === "transparent" ? "Mode Transparan" : "Warna Solid"}</button>
                    </div>
                    <input type="color" value={embedBg === "transparent" ? "#ffffff" : embedBg} onChange={(e) => setEmbedBg(e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent cursor-pointer" />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Architecture Snippet</p>
                  <div className="bg-slate-900 dark:bg-black/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 font-mono text-[10px] text-violet-400 dark:text-indigo-400 break-all select-all h-28 overflow-y-auto leading-relaxed custom-scrollbar">
                    {`<iframe src="${protocol}${hostname}/qr/render/${qr.id}?bg=${embedBg.replace("#", "")}&padding=${embedPadding}&radius=${embedRadius}" width="${embedSize}" height="${embedSize}" frameborder="0" style="border-radius: ${embedRadius}px;"></iframe>`}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { navigator.clipboard.writeText(`<iframe src="${protocol}${hostname}/qr/render/${qr.id}?bg=${embedBg.replace("#", "")}&padding=${embedPadding}&radius=${embedRadius}" width="${embedSize}" height="${embedSize}" frameborder="0" style="border-radius: ${embedRadius}px;"></iframe>`); toast.success("Snippet disalin!"); }}
                      className="py-4 bg-slate-900 dark:bg-white/10 text-white dark:text-slate-200 hover:bg-slate-800 dark:hover:bg-white/20 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 active:scale-95">
                      <FontAwesomeIcon icon={faCopy} /> Salin Kode
                    </button>
                    <button onClick={() => { setSimHtml(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f0f2f5;font-family:-apple-system,system-ui,sans-serif;}.box{background:white;padding:3rem;border-radius:2.5rem;box-shadow:0 30px 60px rgba(0,0,0,0.12);text-align:center;max-width:90%;}h1{margin:0 0 1rem;font-size:1.5rem;color:#1a1a1a;}p{color:#666;margin-bottom:2rem;}</style></head><body><div class="box"><h1>Integration Demo</h1><p>Testing QR auto-sync architecture on external website.</p><iframe src="${protocol}${hostname}/qr/render/${qr.id}?bg=${embedBg.replace("#", "")}&padding=${embedPadding}&radius=${embedRadius}" width="${embedSize}" height="${embedSize}" frameborder="0" style="border-radius: ${embedRadius}px;"></iframe></div></body></html>`); setIsSimulating(true); }}
                      className="py-4 bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 active:scale-95">
                      <FontAwesomeIcon icon={faDesktop} /> Buka Lab
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ══ RIGHT: PREVIEW ══ */}
        <aside className="w-full xl:w-[420px] space-y-6">
          <div className="xl:sticky xl:top-24 space-y-6">

            {/* HUD Preview */}
            <div className="bg-white/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-[40px] p-10 flex flex-col items-center text-center relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-violet-500/[0.02] pointer-events-none" />

              <div className="relative mb-10">
                <div className="absolute inset-0 bg-violet-600/20 blur-[100px] rounded-full -z-10" />
                <div
                  className="transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={previewTab === "embed" ? { backgroundColor: embedBg, padding: `${embedPadding}px`, borderRadius: `${embedRadius}px` } : {}}
                >
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-white/10">
                    <DynamicQR data={qrDataStr} config={qrConfig} size={previewTab === "embed" ? 220 : 280} logo={qr.logo} />
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-bold text-violet-500 shadow-2xl flex items-center gap-3 whitespace-nowrap">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-ping" />
                  Synthesized Live Asset
                </div>
              </div>

              {/* HUD Switcher */}
              <div className="w-full space-y-6 pt-6">
                <div className="flex gap-2 bg-slate-100/80 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <button onClick={() => setPreviewTab("download")} className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all ${previewTab === "download" ? "bg-violet-600 text-white shadow-xl shadow-violet-600/20" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}>Save Local</button>
                  <button onClick={() => setPreviewTab("embed")} className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all ${previewTab === "embed" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}>Embed HUD</button>
                </div>

                <AnimatePresence mode="wait">
                  {previewTab === "download" ? (
                    <motion.div key="dl" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                      <div className="grid grid-cols-4 gap-1.5 bg-white/50 dark:bg-white/5 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                        {DOWNLOAD_SIZES.map((sz) => (
                          <button key={sz.value} onClick={() => setDownloadRes(sz.value)}
                            className={`flex flex-col items-center py-3 rounded-lg transition-all ${downloadRes === sz.value ? "bg-violet-600 text-white shadow-md scale-105 z-10" : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/80 dark:hover:bg-white/5"}`}>
                            <span className="text-[11px] font-bold">{sz.label}</span>
                            <span className="text-[8px] opacity-60 mt-0.5">{sz.desc}</span>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => downloadQr("png")} className="py-3.5 bg-slate-900 dark:bg-white/10 text-white hover:opacity-90 rounded-2xl font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-transparent dark:border-white/10">
                          <FontAwesomeIcon icon={faFileImage} className="text-xs" /> PNG HD
                        </button>
                        <button onClick={() => downloadQr("svg")} className="py-3.5 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 rounded-2xl font-bold text-xs border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-all">
                          <FontAwesomeIcon icon={faFileCode} className="text-violet-500" /> SVG
                        </button>
                        <button onClick={() => downloadQr("webp")} className="col-span-2 py-3.5 bg-violet-600/10 dark:bg-violet-600/15 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 rounded-2xl font-bold text-xs border border-violet-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                          <FontAwesomeIcon icon={faMagic} className="text-amber-400" /> WebP Synthetic
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="emb" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-left space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Integration metrics reflect active environment settings from the panel.</p>
                      <p className="text-[10px] font-bold text-slate-400/60 leading-relaxed italic">Adjustment metrics like padding and corner rounding are synthesized in real-time above.</p>
                      <button onClick={() => setEditorTab("embed")} className="w-full py-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold transition-all">
                        <FontAwesomeIcon icon={faCode} className="mr-3 text-indigo-400" /> Adjust Integration Metrics
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Save Action */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-white rounded-[20px] text-[11px] font-bold transition-all shadow-xl shadow-violet-600/25 flex items-center justify-center gap-3"
            >
              {isSaving ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <><FontAwesomeIcon icon={faSave} className="text-xs" /> Simpan Perubahan Arsitektur</>}
            </button>
          </div>
        </aside>

      </motion.div>

      {/* ── Simulation Lab Modal ── */}
      <AnimatePresence>
        {isSimulating && (
          <div className="fixed inset-0 z-[100] bg-slate-100 dark:bg-slate-950 overflow-hidden flex flex-col">
            <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 flex items-center px-10 justify-between shrink-0 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 opacity-30" />
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 glass border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-violet-400 shadow-2xl">
                  <FontAwesomeIcon icon={faDesktop} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Simulation Lab</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cross-platform integration testing</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSimulating(false)} 
                className="w-12 h-12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-400 transition-all border border-slate-200 dark:border-white/5 group"
              >
                <FontAwesomeIcon icon={faTimes} className="group-hover:rotate-90 transition-transform"/>
              </button>
            </header>
            
            <div className="flex-1 flex overflow-hidden">
              {/* CODE SIDE */}
              <div className="hidden lg:flex w-[450px] border-r border-slate-200 dark:border-white/5 flex-col bg-slate-50 dark:bg-slate-900">
                <div className="p-4 bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-red-500/30 rounded-full" />
                    <div className="w-2.5 h-2.5 bg-amber-500/30 rounded-full" />
                    <div className="w-2.5 h-2.5 bg-emerald-500/30 rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic ml-2">index.html</span>
                </div>
                <textarea 
                  value={simHtml} 
                  onChange={(e) => setSimHtml(e.target.value)}
                  className="flex-1 bg-transparent p-8 font-mono text-[11px] text-violet-600 dark:text-indigo-400 outline-none resize-none leading-relaxed selection:bg-violet-500/20"
                  spellCheck={false}
                />
                <div className="p-5 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50">
                  <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold leading-relaxed">
                    LAB NOTE: Changes to the style metadata above are reflected in real-time. Use this context to test your QR integration across different website layouts.
                  </p>
                </div>
              </div>

              {/* PREVIEW SIDE */}
              <div className="flex-1 bg-white relative overflow-hidden">
                <iframe title="Demo Preview" srcDoc={simHtml} className="w-full h-full border-none shadow-2xl" />
                <div className="absolute bottom-10 right-10 pointer-events-none">
                  <div className="bg-slate-900 text-white px-8 py-4 rounded-[20px] text-[10px] font-bold shadow-2xl flex items-center gap-4 border border-white/10">
                    <FontAwesomeIcon icon={faSyncAlt} className="animate-spin text-violet-400" />
                    LIVE ARCHITECTURE SIMULATION
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(79, 70, 229, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(79, 70, 229, 0.3); }
      `}</style>
    </div>
  );
}
