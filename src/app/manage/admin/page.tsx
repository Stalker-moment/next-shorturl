"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";

import { motion, AnimatePresence } from "framer-motion";

const AnalyticsMap = dynamic(
  () => import('@/components/AnalyticsMap'),
  { ssr: false }
);
import { toast } from "sonner";
import { io } from "socket.io-client";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faShieldAlt, 
  faUsers, 
  faLink, 
  faChartLine, 
  faGlobe, 
  faSearch, 
  faTrashAlt,
  faCircle,
  faDownload,
  faQrcode,
  faUserShield,
  faDatabase,
  faServer,
  faHistory,
  faCheckCircle,
  faEye,
  faEyeSlash,
  faPaste,
  faCode,
  faSpinner,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const getFavicon = (urlStr: string) => {
  try {
    const hostname = new URL(urlStr).hostname;
    return `/api/logo?domain=${hostname}`;
  } catch {
    return null;
  }
};

interface ActivityItem {
  id: string;
  urlId: string | null;
  biolinkLinkId: string | null;
  qrCodeId: string | null;
  userUrl: { title: string | null; shortUrl: string | null } | null;
  biolinkLink: { title: string | null } | null;
  qrCode: { name: string | null } | null;
  ip: string | null;
  userAgent: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  referer: string | null;
  createdAt: string;
  lat: number | null;
  lon: number | null;
}

interface AdminStats {
  totalUsers: number;
  totalUserLinks: number;
  totalGuestLinks: number;
  totalQrcodes: number;
  totalViews: number;
  dailyTraffic: { date: string, count: number }[];
  recentActivity: ActivityItem[];
  topStats: {
    countries: { name: string, count: number }[];
    browsers: { name: string, count: number }[];
    devices: { name: string, count: number }[];
  };
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  createdAt: string;
  _count: { userUrls: number };
  planId?: string | null;
  planExpiredAt?: string | null;
  customMaxAssets?: number | null;
  customMaxPastes?: number | null;
  customMaxRooms?: number | null;
  customMaxDomains?: number | null;
  customMaxApiCalls?: number | null;
  customMaxStorage?: number | null;
  customMaxFileSize?: number | null;
  payAsYouGoBalance?: number;
  payAsYouGoPastesBalance?: number;
  payAsYouGoRoomsBalance?: number;
  payAsYouGoDomainsBalance?: number;
  plan?: {
    id: string;
    name: string;
  } | null;
}

interface LinkData {
  id: string;
  title: string;
  url: string;
  shortUrl?: string;
  views?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  user?: { name: string; email: string };
  profile?: { username: string; user: { name: string; email: string } };
  type: 'shorturl' | 'biolink' | 'qrcode';
  biolinkType?: 'link' | 'header';
}

interface VisitorData {
  ip: string;
  city: string;
  country: string;
  date: string;
  lat?: number | null;
  lon?: number | null;
}

interface MapLocation {
  id: string;
  lat: number | null;
  lon: number | null;
  city: string | null;
  country: string | null;
  count?: number;
}

interface AnalyticsReport {
  totalViews: number;
  daily: { date: string, count: number }[];
  devices: { name: string, value: number }[];
  os: { name: string, value: number }[];
  countries: { name: string, value: number }[];
  locations?: MapLocation[];
  visitors?: VisitorData[];
}

// ─── i18n Translations ───────────────────────────────────────────────────────
const translations = {
  id: {
    title: "Kelola Data & Pengguna",
    subtitle: "Pantau aktivitas link, kelola daftar pengguna, dan analisis performa platform secara real-time.",
    badge: "Pusat Kendali Admin",
    search: "Cari nama, email, link...",
    tabs: { stats: "Ringkasan", users: "Pengguna", links: "Konten & Analisis", appeals: "Banding Aset", reports: "Laporan Abuse", pastes: "Pastebin & Room", dns: "Custom DNS", developers: "API Developer", pricing: "Pricing & Paket", revenue: "Revenue & Analitik", transactions: "Riwayat Transaksi" },
    tabsShort: { stats: "Stats", users: "User", links: "Konten", appeals: "Banding", reports: "Laporan", pastes: "Pastebin", dns: "DNS", developers: "API Dev", pricing: "Pricing", revenue: "Revenue", transactions: "Transaksi" },
    stats: { users: "Pengguna", userLinks: "Link Terdaftar", guestLinks: "Link Guest", qrcodes: "QR Code", views: "Kunjungan" },
    table: { asset: "Aset & Tautan Pendek", target: "Tujuan / Target", creator: "Pembuat", date: "Tanggal", clicks: "Klik", status: "Status", action: "Aksi" },
    userTable: { user: "Pengguna", content: "Konten", access: "Akses", action: "Aksi" },
    actions: { analyze: "Analisis", takedown: "Takedown", activate: "Aktifkan", back: "← Kembali ke Daftar Aset", close: "Tutup", analyticsAsset: "Analitik Aset →", assetNotAvail: "Aset Tidak Tersedia" },
    status: { active: "Aktif", takedown: "Takedown" },
    confirm: {
      toggleRoleTitle: "Ubah Hak Akses?",
      toggleRoleMsg: (name: string, role: string) => `Ubah hak akses ${name} menjadi ${role}?`,
      deleteUserTitle: "Hapus Pengguna?",
      deleteUserMsg: "Hapus pengguna ini secara permanen? Semua data miliknya akan hilang!",
      ok: "Ya, Lanjutkan",
      cancel: "Batal",
    },
    loading: "Sinkronisasi Panel Admin...",
    noAnalytics: "Pilih aset dari daftar untuk melihat analitik.",
    trafficChart: "Kunjungan 7 Hari",
    analysisTitle: "Analisis Visitors",
    recentActivity: "Aktivitas Terkini",
    health: { title: "Status", export: "Ekspor Data" },
    activityModal: { ip: "Alamat IP", location: "Lokasi", ua: "Browser / OS", device: "Device", referer: "Sumber / Referer", time: "Waktu Akses", direct: "Langsung (Direct / Bookmark)" },
    fraud: "Analisis Deteksi Phishing / Spam",
    fraudMsg: (host: string) => `Domain tujuan adalah ${host}. Harap pastikan domain ini bukan tiruan/clone dari website perbankan, media sosial populer, atau marketplace ilegal untuk menghindari ancaman pencurian data pengguna.`,
    mapTitle: "Peta Sebaran Pengunjung",
    visitorsTitle: "Pengunjung Terkini",
    guestUser: "Guest User",
    headerSection: "Bagian Header (Tanpa URL)",
    noUrl: "Tidak ada URL tujuan",
    assetType: "Tipe Aset",
    createdDate: "Tanggal Dibuat",
    creatorLabel: "Pembuat / Akun Terdaftar",
    shortLink: "Tautan Pendek / Akses",
    langToggle: "EN",
    // New translations added:
    popularCountries: "Negara Populer",
    environment: "Environment",
    activityList: "Daftar Aktivitas",
    loadingAnalytics: "Memuat Analitik...",
    metaSecurityTitle: "Metadata & Analisis Keamanan Konten",
    metaSecurityDesc: "Tinjau rincian konten aset untuk mendeteksi penipuan, scam, atau aktivitas fraud.",
    metaSecurityDescModal: "Tinjau rincian konten aset untuk mendeteksi penipuan atau aktivitas fraud.",
    destinationUrl: "Tautan Tujuan / Target (Konten Asli)",
    visitTrafficChart: "Trafik Kunjungan (7D)",
    noVisitorData: "Belum Ada Data Pengunjung",
    originDomain: "Domain Asal",
    analyticsLoadError: "Analitik tidak dapat dimuat",
    accountInfo: "Informasi Akun",
    registeredDate: (date: string) => `Terdaftar: ${date}`,
    accessLabel: "Akses:",
    changeAccess: "Ubah Akses",
    changeRole: "Ubah Peran (Role)",
    accountModeration: "Moderasi Akun",
    deleteUser: "Hapus Pengguna",
    linksAndBiolink: (count: number) => `Tautan & Biolink (${count})`,
    qrcodesLabel: (count: number) => `QR Code (${count})`,
    asset: "Aset",
    clicks: "Klik",
    statusLabel: "Status",
    moderationAndAnalytics: "Moderasi & Analitik",
    noAssetsRegistered: "Belum Ada Aset Terdaftar",
    activityDetailTitle: "Detail Aktivitas Pengunjung",
    visitedAsset: "Aset yang Dikunjungi",
    systemDirect: "System / Direct",
    countryAndCity: "Negara & Kota",
    systemAndBrowser: "Sistem & Browser",
    device: "Device",
    ipAddress: "IP Address",
    location: "Lokasi",
    time: "Waktu",
    timeAccess: "Waktu Akses",
    system: "Sistem Operasi",
    visitorLog: "Log Pengunjung",
    appealsTable: {
      user: "Pengguna",
      asset: "Aset Banding",
      reason: "Alasan Banding",
      proof: "Bukti Pendukung",
      status: "Status",
      action: "Aksi / Moderasi"
    },
    appealsStatus: {
      pending: "Menunggu",
      approved: "Disetujui",
      rejected: "Ditolak"
    },
    appealsActions: {
      approve: "Setujui Banding",
      reject: "Tolak Banding",
      notesPlaceholder: "Tulis catatan moderasi/feedback di sini...",
      noAppeals: "Tidak ada pengajuan banding saat ini."
    }
  },
  en: {
    title: "Manage Data & Users",
    subtitle: "Monitor link activity, manage users, and analyze platform performance in real-time.",
    badge: "Admin Control Center",
    search: "Search name, email, link...",
    tabs: { stats: "Summary", users: "Users", links: "Content & Analytics", appeals: "Appeals", reports: "Abuse Reports", pastes: "Pastebin & Rooms", dns: "Custom DNS", developers: "Developer API", pricing: "Pricing & Plans", revenue: "Revenue & Analytics", transactions: "Global Transactions" },
    tabsShort: { stats: "Stats", users: "Users", links: "Content", appeals: "Appeals", reports: "Reports", pastes: "Pastes", dns: "DNS", developers: "API Dev", pricing: "Pricing", revenue: "Revenue", transactions: "Purchases" },
    stats: { users: "Users", userLinks: "Registered Links", guestLinks: "Guest Links", qrcodes: "QR Codes", views: "Visits" },
    table: { asset: "Asset & Short Link", target: "Destination / Target", creator: "Creator", date: "Date", clicks: "Clicks", status: "Status", action: "Action" },
    userTable: { user: "User", content: "Content", access: "Access", action: "Action" },
    actions: { analyze: "Analyze", takedown: "Takedown", activate: "Activate", back: "← Back to Asset List", close: "Close", analyticsAsset: "Asset Analytics →", assetNotAvail: "Asset Not Available" },
    status: { active: "Active", takedown: "Takedown" },
    confirm: {
      toggleRoleTitle: "Change Role?",
      toggleRoleMsg: (name: string, role: string) => `Change ${name}'s role to ${role}?`,
      deleteUserTitle: "Delete User?",
      deleteUserMsg: "Permanently delete this user? All their data will be lost!",
      ok: "Yes, Proceed",
      cancel: "Cancel",
    },
    loading: "Syncing Admin Panel...",
    noAnalytics: "Select an asset from the list to view analytics.",
    trafficChart: "7-Day Visits",
    analysisTitle: "Visitor Analysis",
    recentActivity: "Recent Activity",
    health: { title: "Status", export: "Export Data" },
    activityModal: { ip: "IP Address", location: "Location", ua: "Browser / OS", device: "Device", referer: "Source / Referer", time: "Access Time", direct: "Direct (Bookmark)" },
    fraud: "Phishing / Spam Detection Analysis",
    fraudMsg: (host: string) => `Destination domain is ${host}. Ensure this domain is not a clone of a banking site, popular social media, or illegal marketplace to prevent data theft.`,
    mapTitle: "Visitor Distribution Map",
    visitorsTitle: "Recent Visitors",
    guestUser: "Guest User",
    headerSection: "Header Section (No URL)",
    noUrl: "No destination URL",
    assetType: "Asset Type",
    createdDate: "Date Created",
    creatorLabel: "Creator / Registered Account",
    shortLink: "Short Link / Access",
    langToggle: "ID",
    // New translations added:
    popularCountries: "Popular Countries",
    environment: "Environment",
    activityList: "Activity List",
    loadingAnalytics: "Loading Analytics...",
    metaSecurityTitle: "Metadata & Content Security Analysis",
    metaSecurityDesc: "Review asset content details to detect phishing, scams, or fraudulent activities.",
    metaSecurityDescModal: "Review asset content details to detect scams or fraudulent activity.",
    destinationUrl: "Destination URL / Target (Original Content)",
    visitTrafficChart: "Visit Traffic (7D)",
    noVisitorData: "No Visitor Data Available",
    originDomain: "Origin Domain",
    analyticsLoadError: "Analytics could not be loaded",
    accountInfo: "Account Information",
    registeredDate: (date: string) => `Registered: ${date}`,
    accessLabel: "Access:",
    changeAccess: "Change Access",
    changeRole: "Change Role",
    accountModeration: "Account Moderation",
    deleteUser: "Delete User",
    linksAndBiolink: (count: number) => `Links & Biolink (${count})`,
    qrcodesLabel: (count: number) => `QR Code (${count})`,
    asset: "Asset",
    clicks: "Clicks",
    statusLabel: "Status",
    moderationAndAnalytics: "Moderation & Analytics",
    noAssetsRegistered: "No Assets Registered",
    activityDetailTitle: "Visitor Activity Details",
    visitedAsset: "Visited Asset",
    systemDirect: "System / Direct",
    countryAndCity: "Country & City",
    systemAndBrowser: "System & Browser",
    device: "Device",
    ipAddress: "IP Address",
    location: "Location",
    time: "Time",
    timeAccess: "Access Time",
    system: "Operating System",
    visitorLog: "Visitor Log",
    appealsTable: {
      user: "User",
      asset: "Appeal Asset",
      reason: "Appeal Reason",
      proof: "Supporting Proof",
      status: "Status",
      action: "Action / Moderation"
    },
    appealsStatus: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    },
    appealsActions: {
      approve: "Approve Appeal",
      reject: "Reject Appeal",
      notesPlaceholder: "Write moderation/feedback notes here...",
      noAppeals: "No appeal requests at the moment."
    }
  },
};

// ─── Confirm Modal Component ─────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, okLabel, cancelLabel }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
  okLabel: string; cancelLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative z-10 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 w-full max-w-sm"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl mb-4 mx-auto">
          ⚠️
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white text-center mb-1.5">{title}</h3>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 text-center leading-relaxed mb-6">{message}</p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
          >{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shadow-indigo-500/20"
          >{okLabel}</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Pricing & Plans Admin Panel Component ─────────────────────────────────
interface PricingPlan {
  id: string;
  name: string;
  price: number;
  days: number;
  maxAssets: number;
  maxPastes: number;
  maxRooms: number;
  maxDomains: number;
  maxApiCalls: number;
  maxStorage: number;
  maxFileSize: number;
  isPayAsYouGo: boolean;
  isActive: boolean;
  createdAt: string;
}

interface SystemSetting {
  key: string;
  value: string;
}

function PricingPlansAdminPanel({ onInspectUser }: { onInspectUser: (userId: string) => void }) {
  const [subTab, setSubTab] = useState<"packages" | "revenue" | "transactions">("packages");
  const [activeCategory, setActiveCategory] = useState<"monthly" | "payg">("monthly");
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: 0,
    days: 30,
    maxAssets: 100,
    maxPastes: 20,
    maxRooms: 1,
    maxDomains: 1,
    maxApiCalls: 100,
    maxStorage: 500,
    maxFileSize: 20,
    isPayAsYouGo: false,
    isActive: true
  });

  const getQrisDisplayPrice = (target: number) => {
    let display = Math.ceil((target + 310) / 0.993);
    if (display > 105000) {
      display = Math.ceil(target / 0.99);
    }
    return display;
  };

  const fetchPlansAndSettings = async () => {
    setLoading(true);
    try {
      const [plansRes, settingsRes] = await Promise.all([
        fetch("/api/admin/pricing/plans"),
        fetch("/api/admin/system-settings")
      ]);

      if (plansRes.ok) {
        const json = await plansRes.json();
        setPlans(json.data || []);
      }
      if (settingsRes.ok) {
        const json = await settingsRes.json();
        const settingsMap: Record<string, string> = {};
        (json.data || []).forEach((s: SystemSetting) => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyinkronkan data pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndSettings();
  }, []);

  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    try {
      const res = await fetch(`/api/admin/system-settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue ? "true" : "false" })
      });
      if (res.ok) {
        toast.success(`Pengaturan ${key} berhasil diperbarui.`);
        setSettings(prev => ({ ...prev, [key]: newValue ? "true" : "false" }));
      } else {
        toast.error("Gagal memperbarui pengaturan.");
      }
    } catch (e) {
      toast.error("Kesalahan jaringan.");
    }
  };

  const handleEditClick = (plan: PricingPlan) => {
    setEditingId(plan.id);
    setFormData({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      days: plan.days,
      maxAssets: plan.maxAssets,
      maxPastes: plan.maxPastes,
      maxRooms: plan.maxRooms,
      maxDomains: plan.maxDomains,
      maxApiCalls: plan.maxApiCalls || 100,
      maxStorage: plan.maxStorage || 500,
      maxFileSize: plan.maxFileSize || 20,
      isPayAsYouGo: plan.isPayAsYouGo,
      isActive: plan.isActive
    });
    setShowForm(true);
  };

  const handleNewClick = () => {
    setEditingId(null);
    setFormData({
      id: "",
      name: "",
      price: 15000,
      days: 30,
      maxAssets: 500,
      maxPastes: 100,
      maxRooms: 5,
      maxDomains: 5,
      maxApiCalls: 100,
      maxStorage: 500,
      maxFileSize: 20,
      isPayAsYouGo: false,
      isActive: true
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus paket pricing ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/admin/pricing/plans/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Paket pricing berhasil dihapus.");
        setPlans(prev => prev.filter(p => p.id !== id));
      } else {
        toast.error("Gagal menghapus paket pricing.");
      }
    } catch (e) {
      toast.error("Kesalahan jaringan.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      toast.error("ID dan Nama paket wajib diisi!");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId 
        ? `/api/admin/pricing/plans/${editingId}`
        : "/api/admin/pricing/plans";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(editingId ? "Paket diperbarui!" : "Paket pricing baru berhasil dibuat!");
        setShowForm(false);
        fetchPlansAndSettings();
      } else {
        toast.error(json.error || "Gagal menyimpan paket.");
      }
    } catch (e) {
      toast.error("Kesalahan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  const isReminderEnabled = settings["billing_reminder_enabled"] === "true";
  const isPayAsYouGoEnabled = settings["pay_as_you_go_enabled"] === "true";

  return (
    <div className="space-y-6">
      {/* Sub-tab Segmented Control */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 mb-6 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setSubTab("packages")}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            subTab === "packages" 
              ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>💎 Atur Paket & Limit</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("revenue")}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            subTab === "revenue" 
              ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>📊 Analitik & Laporan Keuangan</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("transactions")}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            subTab === "transactions" 
              ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>💳 Riwayat Transaksi Global</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === "packages" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="packages"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Side: System Configurations (Reminder & Pay-As-You-Go toggle) */}
            <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm space-y-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm font-bold shadow-inner">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Konfigurasi Billing</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pengaturan sistem langganan</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Reminder Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-150 dark:border-white/5">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-800 dark:text-white">Auto Billing Reminder</span>
                    <span className="block text-[9px] text-slate-400 font-medium">Kirim email pengingat H-3 kedaluwarsa</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isReminderEnabled}
                      onChange={() => handleToggleSetting("billing_reminder_enabled", isReminderEnabled)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

                {/* Pay-As-You-Go Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-150 dark:border-white/5">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-800 dark:text-white">Pay As You Go Service</span>
                    <span className="block text-[9px] text-slate-400 font-medium">Izinkan checkout sistem Pay As You Go</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPayAsYouGoEnabled}
                      onChange={() => handleToggleSetting("pay_as_you_go_enabled", isPayAsYouGoEnabled)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Side: Packages List & Control */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-505 text-sm font-bold shadow-inner">
                      💎
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Daftar Paket Pricing</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kelola harga dan kapasitas paket</p>
                    </div>
                  </div>
                  <button
                    onClick={handleNewClick}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-1.5"
                  >
                    + Tambah Paket
                  </button>
                </div>

                {/* Category Tab Selector */}
                <div className="flex gap-1 p-1 bg-slate-150 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("monthly")}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      activeCategory === "monthly"
                        ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    📅 Bulanan (Monthly)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("payg")}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      activeCategory === "payg"
                        ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    ⚡ Top-Up (PAYG)
                  </button>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans
                    .filter(p => activeCategory === "monthly" ? !p.isPayAsYouGo : p.isPayAsYouGo)
                    .map(p => (
                    <div 
                      key={p.id} 
                      className={`bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border transition-all ${
                        p.isActive 
                          ? "border-slate-200 dark:border-white/5 hover:border-indigo-500/30" 
                          : "border-red-500/10 opacity-70"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 pb-2 border-b border-slate-250/50 dark:border-white/5">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase">{p.name}</h4>
                          <span className="text-[9px] font-mono text-indigo-500 font-bold uppercase tracking-wider">{p.id}</span>
                        </div>
                        <span className="text-xs font-black text-indigo-650 bg-indigo-500/10 px-2 py-0.5 rounded-lg">
                          Rp{p.price.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-4">
                        <div>⏱️ Durasi: <span className="text-slate-900 dark:text-white font-black">{p.isPayAsYouGo ? "Forever" : `${p.days} Hari`}</span></div>
                        <div>🚀 Limit Link: <span className="text-slate-900 dark:text-white font-black">{p.maxAssets}</span></div>
                        <div>📝 Pastes: <span className="text-slate-900 dark:text-white font-black">{p.maxPastes}</span></div>
                        <div>🔒 Paste Rooms: <span className="text-slate-900 dark:text-white font-black">{p.maxRooms}</span></div>
                        <div>🌐 Custom DNS: <span className="text-slate-900 dark:text-white font-black">{p.maxDomains}</span></div>
                        <div>🔑 API Calls/Day: <span className="text-slate-900 dark:text-white font-black">{p.maxApiCalls || 100}</span></div>
                        <div>💾 Storage: <span className="text-slate-900 dark:text-white font-black">{p.maxStorage || 500} MB</span></div>
                        <div>📁 Max File: <span className="text-slate-900 dark:text-white font-black">{p.maxFileSize || 20} MB</span></div>
                        <div>💰 Tipe: <span className="text-indigo-500 font-black">{p.isPayAsYouGo ? "PayAsYouGo" : "Reguler"}</span></div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-white/5 pt-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                          p.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {p.isActive ? "Aktif" : "Non-aktif"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-600 hover:text-white text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all"
                          >
                            Edit
                          </button>
                          {p.id !== "FREE" && (
                            <button
                              onClick={() => handleDeleteClick(p.id)}
                              className="px-2.5 py-1 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {plans.filter(p => activeCategory === "monthly" ? !p.isPayAsYouGo : p.isPayAsYouGo).length === 0 && (
                    <div className="col-span-2 text-center py-10">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[9px]">Belum ada paket pricing untuk kategori ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === "revenue" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="revenue"
          >
            <AdminRevenueAnalytics />
          </motion.div>
        )}

        {subTab === "transactions" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="transactions"
          >
            <AdminTransactionsList onInspectUser={onInspectUser} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package Creator / Editor Modal Drawer */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5 mb-4 shrink-0">
                <span className="text-xl">💎</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Moderasi Pricing</h3>
                  <h4 className="text-sm font-bold truncate uppercase">{editingId ? "Edit Paket Pricing" : "Buat Paket Pricing Baru"}</h4>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-650 text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">ID Paket (Kode Unik)</label>
                    <input
                      type="text"
                      disabled={!!editingId}
                      placeholder="e.g. PREMIUM_PRO"
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none uppercase disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Nama Paket</label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Pro"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Harga Target (Net IDR)</label>
                    <input
                      type="number"
                      disabled={formData.id === "FREE"}
                      placeholder="e.g. 29000"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none disabled:opacity-50"
                    />
                    <div className="mt-1 space-y-0.5 text-[9px] font-bold text-slate-400">
                      <span className="block">📱 QRIS Bayar: <strong className="text-emerald-500 font-extrabold">Rp{getQrisDisplayPrice(formData.price).toLocaleString("id-ID")}</strong></span>
                      <span className="block">🏦 VA Bayar: <strong className="text-indigo-500 font-extrabold">Rp{(formData.price + 3500).toLocaleString("id-ID")}</strong> (BRI/BNI) / <strong className="text-indigo-500 font-extrabold">Rp{(formData.price + 2000).toLocaleString("id-ID")}</strong> (Sampoerna)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Masa Aktif (Hari)</label>
                    {formData.isPayAsYouGo ? (
                      <input
                        type="text"
                        disabled
                        value="Forever"
                        className="w-full h-10 px-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none opacity-60 cursor-not-allowed text-indigo-500"
                      />
                    ) : (
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        value={formData.days}
                        onChange={(e) => setFormData(prev => ({ ...prev, days: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Max Link Aset (ShortURL/QR/Biolink)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={formData.maxAssets}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxAssets: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Max Pastes</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={formData.maxPastes}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxPastes: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Max Paste Rooms</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={formData.maxRooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxRooms: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Max Custom DNS Subdomains</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={formData.maxDomains}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxDomains: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Max API Calls (Developer/Day)</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={formData.maxApiCalls}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxApiCalls: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Max Storage Capacity (MB)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={formData.maxStorage}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxStorage: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Max File Size Limit (MB)</label>
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={formData.maxFileSize}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxFileSize: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  {formData.id !== "FREE" ? (
                    <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPayAsYouGo}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({ 
                            ...prev, 
                            isPayAsYouGo: checked,
                            days: checked ? 3650 : 30 
                          }));
                        }}
                        className="w-4 h-4 accent-indigo-650 rounded cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold text-slate-800 dark:text-white">Pay As You Go</span>
                        <span className="block text-[8px] text-slate-450 font-medium">Beban saldo per-asset</span>
                      </div>
                    </label>
                  ) : (
                    <div className="p-3.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center text-[10px] font-bold text-slate-400">
                      Paket dasar bawaan sistem (Rp0).
                    </div>
                  )}

                  <label className={`flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl ${formData.id === "FREE" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      disabled={formData.id === "FREE"}
                      checked={formData.id === "FREE" ? true : formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-650 rounded cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-slate-800 dark:text-white">Aktifkan Paket</span>
                      <span className="block text-[8px] text-slate-450 font-medium">Bisa di-checkout publik</span>
                    </div>
                  </label>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2.5 shrink-0 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-655 dark:text-zinc-350 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Paket"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface RevenueData {
  totalRevenue: number;
  totalNetRevenue: number;
  totalFees: number;
  completedCount: number;
  pendingCount: number;
  cancelledCount: number;
  premiumUsersCount: number;
  packageBreakdown: { name: string; revenue: number }[];
  methodBreakdown: { method: string; revenue: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

function AdminRevenueAnalytics() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        toast.error("Gagal memuat analitik pendapatan.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handlePrintFinancialReport = async () => {
    if (!data) return;
    toast.info("Menyiapkan data audit keuangan...");
    try {
      const txRes = await fetch("/api/admin/transactions");
      if (!txRes.ok) throw new Error("Gagal mengambil riwayat transaksi.");
      const txJson = await txRes.json();
      const allTxs: any[] = txJson.data || [];
      
      const completedTxs = allTxs.filter(t => t.status === "COMPLETED" || t.status === "PAID" || t.status === "SUCCESS");
      
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const reportDate = new Date().toLocaleString(language === "en" ? "en-US" : "id-ID", { dateStyle: "long", timeStyle: "short" });

      const planBreakdownRows = data.packageBreakdown.map((pkg) => {
        const percent = Math.round((pkg.revenue / (data.totalRevenue || 1)) * 100);
        return `
          <tr>
            <td><strong>${pkg.name}</strong></td>
            <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">Rp${pkg.revenue.toLocaleString("id-ID")}</td>
            <td style="text-align: right; font-weight: bold; color: #6366f1;">${percent}%</td>
          </tr>
        `;
      }).join("");

      const methodBreakdownRows = data.methodBreakdown.map((m) => {
        const percent = Math.round((m.revenue / (data.totalRevenue || 1)) * 100);
        return `
          <tr>
            <td><span class="method-tag">${m.method.toUpperCase().replace("_VA", "")}</span></td>
            <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">Rp${m.revenue.toLocaleString("id-ID")}</td>
            <td style="text-align: right; font-weight: bold; color: #10b981;">${percent}%</td>
          </tr>
        `;
      }).join("");

      const ledgerRows = completedTxs.map((tx) => {
        const txDate = new Date(tx.createdAt).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { dateStyle: "short" });
        return `
          <tr>
            <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">#${tx.id.substring(0, 12)}...</td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${tx.user?.name || "Premium Member"}</div>
              <div style="font-size: 10px; color: #64748b;">${tx.user?.email || ""}</div>
            </td>
            <td><strong style="color: #6366f1;">${tx.plan?.name || tx.planId}</strong></td>
            <td><span class="method-tag">${tx.paymentMethod.toUpperCase().replace("_VA", "")}</span></td>
            <td style="font-family: 'JetBrains Mono', monospace; text-align: right;">Rp${tx.targetAmount.toLocaleString("id-ID")}</td>
            <td style="font-family: 'JetBrains Mono', monospace; text-align: right; color: #ef4444;">Rp${tx.feeAmount.toLocaleString("id-ID")}</td>
            <td style="font-family: 'JetBrains Mono', monospace; text-align: right; font-weight: 700; color: #10b981;">Rp${tx.totalAmount.toLocaleString("id-ID")}</td>
            <td style="text-align: right; font-size: 11px; color: #64748b;">${txDate}</td>
          </tr>
        `;
      }).join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Laporan Keuangan Langganan - nyoo.me</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #1e293b;
                background-color: #ffffff;
                padding: 40px;
                margin: 0;
                line-height: 1.5;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .report-header {
                border-bottom: 3px double #cbd5e1;
                padding-bottom: 20px;
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .logo {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -1.5px;
                color: #0f172a;
              }
              .logo span { color: #6366f1; }
              .report-title {
                text-align: right;
              }
              .report-title h1 {
                font-size: 20px;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 5px 0;
                letter-spacing: -0.5px;
              }
              .report-title p {
                font-size: 11px;
                color: #64748b;
                margin: 0;
                font-weight: 500;
              }
              .summary-grid {
                display: grid;
                grid-template-cols: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 40px;
              }
              .summary-card {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 16px;
              }
              .summary-card span {
                display: block;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #64748b;
                margin-bottom: 6px;
              }
              .summary-card strong {
                font-size: 16px;
                font-weight: 800;
                color: #0f172a;
              }
              .grid-sections {
                display: grid;
                grid-template-cols: 1.2fr 1fr;
                gap: 30px;
                margin-bottom: 40px;
              }
              .section-box {
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                padding: 24px;
                background-color: #ffffff;
              }
              .section-box h3 {
                font-size: 13px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #0f172a;
                margin-top: 0;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid #f1f5f9;
              }
              .report-table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
              }
              .report-table th {
                background-color: #f8fafc;
                border-bottom: 2px solid #e2e8f0;
                padding: 10px 12px;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                color: #64748b;
              }
              .report-table td {
                border-bottom: 1px solid #f1f5f9;
                padding: 12px;
                font-size: 12px;
                color: #334155;
              }
              .method-tag {
                background-color: #f1f5f9;
                border: 1px solid #e2e8f0;
                padding: 2px 6px;
                border-radius: 6px;
                font-size: 9px;
                font-weight: 800;
                color: #475569;
              }
              .ledger-container {
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                padding: 24px;
                margin-bottom: 40px;
                background-color: #ffffff;
              }
              .ledger-container h3 {
                font-size: 13px;
                font-weight: 800;
                text-transform: uppercase;
                color: #0f172a;
                margin-top: 0;
                margin-bottom: 16px;
              }
              .footer {
                text-align: center;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
                font-size: 10px;
                color: #94a3b8;
                margin-top: 60px;
              }
              @media print {
                body { padding: 0; }
                .summary-card { background-color: #f8fafc !important; }
                .method-tag { background-color: #f1f5f9 !important; }
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div class="logo">nyoo<span>.me</span></div>
              <div class="report-title">
                <h1>LAPORAN KINERJA KEUANGAN</h1>
                <p>Periode Audit: Sampai Dengan ${reportDate}</p>
              </div>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <span>Pendapatan Kotor</span>
                <strong style="color: #6366f1;">Rp${data.totalRevenue.toLocaleString("id-ID")}</strong>
              </div>
              <div class="summary-card">
                <span>Pendapatan Bersih</span>
                <strong style="color: #10b981;">Rp${data.totalNetRevenue.toLocaleString("id-ID")}</strong>
              </div>
              <div class="summary-card">
                <span>Biaya Admin (VA/QRIS)</span>
                <strong style="color: #ef4444;">Rp${data.totalFees.toLocaleString("id-ID")}</strong>
              </div>
              <div class="summary-card">
                <span>Pelanggan Premium Aktif</span>
                <strong style="color: #f59e0b;">${data.premiumUsersCount} Users</strong>
              </div>
            </div>

            <div class="grid-sections">
              <div class="section-box">
                <h3>Beban Kontribusi Penjualan per Paket</h3>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Nama Paket</th>
                      <th style="text-align: right;">Total Omzet</th>
                      <th style="text-align: right;">Pangsa Pasar</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${planBreakdownRows}
                  </tbody>
                </table>
              </div>

              <div class="section-box">
                <h3>Distribusi Metode Pembayaran</h3>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Metode</th>
                      <th style="text-align: right;">Total Volume</th>
                      <th style="text-align: right;">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${methodBreakdownRows}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="ledger-container">
              <h3>Buku Besar Kronologis Transaksi Sukses (${completedTxs.length} Transaksi)</h3>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>ID Invoice</th>
                    <th>Nama & Email</th>
                    <th>Paket</th>
                    <th>Metode</th>
                    <th style="text-align: right;">Bruto</th>
                    <th style="text-align: right;">Biaya</th>
                    <th style="text-align: right;">Netto</th>
                    <th style="text-align: right;">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  ${ledgerRows}
                </tbody>
              </table>
            </div>

            <div class="footer">
              Laporan Keuangan Resmi nyoo.me &bull; Sistem Pemendek URL &amp; Biolink Premium Terintegrasi
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 1000);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast.success("Laporan keuangan berhasil diekspor!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal mencetak laporan keuangan.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[300px] w-full flex flex-col items-center justify-center bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Analitik Pendapatan...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Section Header with Print Report Trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/5 backdrop-blur-xl">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Dasbor Revenue & Keuangan</h3>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Analisis kualitatif pendapatan, potongan biaya transaksi, dan margin</p>
        </div>
        <button
          type="button"
          onClick={handlePrintFinancialReport}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
        >
          🖨️ Ekspor Laporan Keuangan
        </button>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: language === "en" ? "Gross Revenue" : "Pendapatan Kotor", value: `Rp${data.totalRevenue.toLocaleString("id-ID")}`, color: "text-indigo-600 dark:text-indigo-400" },
          { label: language === "en" ? "Net Revenue" : "Pendapatan Bersih", value: `Rp${data.totalNetRevenue.toLocaleString("id-ID")}`, color: "text-emerald-500" },
          { label: language === "en" ? "Processing Fees" : "Total Biaya Admin", value: `Rp${data.totalFees.toLocaleString("id-ID")}`, color: "text-rose-500" },
          { label: language === "en" ? "Premium Subscribers" : "Subscribers Aktif", value: data.premiumUsersCount, color: "text-amber-500" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
            <span className={`block text-sm sm:text-base font-extrabold tracking-tight ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-sm backdrop-blur-xl space-y-4">
          <div>
            <h4 className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {language === "en" ? "Revenue Trends" : "Tren Pendapatan"}
            </h4>
            <p className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-white">
              {language === "en" ? "Daily Revenue (Last 30 Days)" : "Grafik Pendapatan Harian (30 Hari Terakhir)"}
            </p>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyRevenue}>
                <CartesianGrid strokeDasharray="10 10" stroke="rgba(0,0,0,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} fontWeight="700" tickFormatter={(v) => v.split('-').slice(2).join('/')} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={8} fontWeight="700" axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${v/1000}k`} />
                <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} contentStyle={{ border: 'none', borderRadius: '1rem', fontWeight: '850', fontSize: '10px' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-sm backdrop-blur-xl space-y-5">
          <div className="border-b border-slate-100 dark:border-white/5 pb-2">
            <h4 className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{language === "en" ? "Sales Breakdown" : "Rincian Penjualan"}</h4>
            <p className="text-xs font-bold text-slate-800 dark:text-white">{language === "en" ? "Revenue share by packages" : "Kontribusi pendapatan per paket"}</p>
          </div>

          {/* Package breakdown list */}
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {data.packageBreakdown.map((pkg, idx) => {
              const percent = Math.round((pkg.revenue / (data.totalRevenue || 1)) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                    <span className="uppercase tracking-wider">{pkg.name}</span>
                    <span className="font-mono text-[9px] text-slate-500 dark:text-zinc-400">
                      Rp{pkg.revenue.toLocaleString("id-ID")} ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {data.packageBreakdown.length === 0 && (
              <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest py-10">Belum ada rincian paket terjual</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdminTransaction {
  id: string;
  userId: string;
  planId: string;
  targetAmount: number;
  feeAmount: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
  };
  plan: {
    name: string;
    price: number;
  };
}

function AdminTransactionsList({ onInspectUser }: { onInspectUser: (userId: string) => void }) {
  const [txs, setTxs] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const { language } = useLanguage();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/transactions");
      if (res.ok) {
        const json = await res.json();
        setTxs(json.data || []);
      } else {
        toast.error("Gagal memuat riwayat pembelian.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status transaksi menjadi ${nextStatus}?`)) return;
    setStatusLoading(id);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        toast.success("Status transaksi berhasil diubah!");
        fetchTransactions();
      } else {
        toast.error("Gagal memperbarui status transaksi.");
      }
    } catch {
      toast.error("Kesalahan jaringan.");
    } finally {
      setStatusLoading(null);
    }
  };

  const handlePrint = (tx: AdminTransaction) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const isPaid = tx.status === "COMPLETED" || tx.status === "PAID" || tx.status === "SUCCESS";
    const isCancelled = tx.status === "CANCELLED" || tx.status === "FAILED";
    const statusText = isPaid ? "PAID" : isCancelled ? "CANCELLED" : "PENDING";
    const statusClass = isPaid ? "paid" : isCancelled ? "cancelled" : "pending";

    const invoiceDate = new Date(tx.createdAt).toLocaleString(language === "en" ? "en-US" : "id-ID", { dateStyle: "long", timeStyle: "short" });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${tx.id} - nyoo.me</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              background-color: #f8fafc;
              padding: 40px 20px;
              margin: 0;
              line-height: 1.5;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 24px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
              overflow: hidden;
            }
            .invoice-header {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 40px;
              color: #ffffff;
              display: flex;
              justify-content: space-between;
              align-items: center;
              position: relative;
            }
            .invoice-header::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #6366f1, #a855f7);
            }
            .logo {
              font-family: 'Space Grotesk', sans-serif;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: -1px;
            }
            .logo span { color: #6366f1; }
            .status-badge {
              font-weight: 800;
              font-size: 11px;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              padding: 6px 16px;
              border-radius: 9999px;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .status-badge.paid { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
            .status-badge.pending { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
            .status-badge.cancelled { background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
            .invoice-body { padding: 40px; }
            .meta-section {
              display: grid;
              grid-template-cols: 1.2fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 30px;
            }
            .meta-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
            .meta-value { font-size: 13px; font-weight: 500; color: #334155; line-height: 1.6; }
            .meta-value.highlight { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #0f172a; }
            .title-receipt { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 30px; letter-spacing: -0.5px; }
            .invoice-table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 40px; }
            .invoice-table th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 16px 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; }
            .invoice-table td { border-bottom: 1px solid #f1f5f9; padding: 20px; font-size: 14px; color: #334155; }
            .invoice-table td strong { color: #0f172a; font-weight: 600; }
            .totals-section { display: flex; justify-content: flex-end; }
            .totals-box { width: 100%; max-width: 360px; background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #64748b; }
            .totals-row.grand-total { border-top: 1px solid #e2e8f0; margin-top: 12px; padding-top: 14px; font-size: 18px; font-weight: 800; color: #6366f1; }
            .invoice-footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 30px 40px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6; }
            
            @media print {
              body { background-color: #ffffff; padding: 0; margin: 0; }
              .invoice-container { border: none; box-shadow: none; border-radius: 0; max-width: 100%; }
              .invoice-header { padding: 30px; }
              .invoice-body { padding: 30px; }
              .invoice-footer { padding: 20px 30px; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="logo">nyoo<span>.me</span></div>
              <div class="status-badge ${statusClass}">${statusText}</div>
            </div>
            
            <div class="invoice-body">
              <h2 class="title-receipt">KUITANSI TRANSAKSI</h2>
              
              <div class="meta-section">
                <div>
                  <div class="meta-title">PELANGGAN</div>
                  <div class="meta-value">
                    <strong>${tx.user?.name || "Premium Member"}</strong><br/>
                    ${tx.user?.email || ""}
                  </div>
                </div>
                <div>
                  <div class="meta-title">RINCIAN INVOICE</div>
                  <div class="meta-value">
                    <strong>ID Transaksi:</strong> <span class="meta-value highlight">#${tx.id}</span><br/>
                    <strong>Tanggal:</strong> ${invoiceDate}<br/>
                    <strong>Metode:</strong> ${tx.paymentMethod.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th>DESKRIPSI</th>
                    <th style="text-align: right;">JUMLAH</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      Premium Subscription - <strong>${tx.plan?.name || tx.planId}</strong><br/>
                      <span style="font-size: 11px; color: #64748b;">
                        Akses penuh ke semua fitur, biolink personal, dan domain kustom
                      </span>
                    </td>
                    <td style="text-align: right; font-weight: 600; color: #0f172a;">Rp${tx.targetAmount.toLocaleString("id-ID")}</td>
                  </tr>
                </tbody>
              </table>

              <div class="totals-section">
                <div class="totals-box">
                  <div class="totals-row">
                    <span>Subtotal:</span>
                    <span style="font-weight: 500; color: #334155;">Rp${tx.targetAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div class="totals-row">
                    <span>Biaya Transaksi / Layanan:</span>
                    <span style="font-weight: 500; color: #334155;">Rp${tx.feeAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div class="totals-row grand-total">
                    <span>Total Pembayaran:</span>
                    <span>Rp${tx.totalAmount.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="invoice-footer">
              <strong>nyoo.me</strong> &bull; Solusi Tautan Premium & QR Dinamis<br/>
              <span style="font-size: 10px; color: #cbd5e1; margin-top: 8px; display: block;">
                Ini adalah kuitansi digital resmi. Tidak memerlukan tanda tangan fisik.
              </span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredTxs = txs.filter((tx) => {
    if (selectedUserEmail && tx.user?.email !== selectedUserEmail) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.planId.toLowerCase().includes(q) ||
      (tx.plan?.name || "").toLowerCase().includes(q) ||
      (tx.user?.name || "").toLowerCase().includes(q) ||
      (tx.user?.email || "").toLowerCase().includes(q) ||
      tx.paymentMethod.toLowerCase().includes(q) ||
      tx.status.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[300px] w-full flex flex-col items-center justify-center bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Riwayat Pembelian...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 backdrop-blur-xl flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm font-bold shadow-inner">
            💳
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Riwayat Pembelian Global</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Transaksi Terlacak: {txs.length}</p>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Active Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
        <div className="relative group flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Cari ID, user, paket, metode, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl py-2 px-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-650 shadow-sm"
          />
        </div>

        {selectedUserEmail && (
          <div className="flex items-center gap-2 bg-indigo-500/10 px-3.5 py-1.5 rounded-xl border border-indigo-500/20 text-[10px] font-bold text-indigo-650 dark:text-indigo-400">
            <span>Isolasi User: <strong>{selectedUserEmail}</strong></span>
            <button
              onClick={() => setSelectedUserEmail(null)}
              className="text-indigo-400 hover:text-indigo-600 transition-colors ml-1 font-extrabold"
              title="Clear Filter"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs font-bold">
          <thead className="bg-slate-50 dark:bg-black/30 border-b border-slate-250 dark:border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">Pengguna</th>
              <th className="px-3 py-3">Invoice & Paket</th>
              <th className="px-3 py-3">Total Bayar</th>
              <th className="px-2 py-3">Metode</th>
              <th className="px-3 py-3">Tanggal</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-zinc-350">
            {filteredTxs.map((tx) => {
              const isPaid = tx.status === "COMPLETED" || tx.status === "PAID" || tx.status === "SUCCESS";
              const isPending = tx.status === "PENDING";
              const isCancelled = tx.status === "CANCELLED" || tx.status === "FAILED" || tx.status === "EXPIRED";

              return (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <td 
                    className="px-4 py-3 cursor-pointer" 
                    onClick={() => setSelectedUserEmail(tx.user?.email || null)}
                    title="Klik untuk isolasi transaksi user ini"
                  >
                    <div className="space-y-0.5 group/user">
                      <span className="block text-slate-900 dark:text-white truncate max-w-[130px] group-hover/user:text-indigo-500 transition-colors">{tx.user?.name || "Premium Member"}</span>
                      <span className="block text-[9px] text-slate-400 font-mono truncate max-w-[130px] group-hover/user:underline">{tx.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-0.5">
                      <span className="block text-slate-900 dark:text-white font-mono text-[10px]">#{tx.id.substring(0, 15)}...</span>
                      <span className="block text-[9px] text-indigo-500 uppercase">{tx.plan?.name || tx.planId}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-900 dark:text-white font-mono text-[10px]">
                    Rp{tx.totalAmount.toLocaleString("id-ID")}
                  </td>
                  <td className="px-2 py-3">
                    <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border dark:border-white/5 uppercase">
                      {tx.paymentMethod.replace("_va", "")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400 font-bold text-[10px]">
                    {new Date(tx.createdAt).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { dateStyle: "short" })}
                  </td>
                  <td className="px-2 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      isPaid ? "bg-emerald-500/10 text-emerald-500" :
                      isPending ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-red-500/10 text-red-500"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onInspectUser(tx.userId)}
                        className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-650 hover:text-white text-[9px] uppercase tracking-wider rounded-lg transition-all font-extrabold"
                        title="Tinjau detail akun & limit user"
                      >
                        Detail User
                      </button>
                      <button
                        onClick={() => handlePrint(tx)}
                        className="px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white text-[9px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        Print
                      </button>
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(tx.id, "COMPLETED")}
                            disabled={statusLoading === tx.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] uppercase tracking-wider rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(tx.id, "CANCELLED")}
                            disabled={statusLoading === tx.id}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] uppercase tracking-wider rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredTxs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                  Tidak ada transaksi pembelian langganan yang cocok dengan filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "links" | "appeals" | "reports" | "pastes" | "dns" | "developers" | "pricing" | "revenue" | "transactions">("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Developer Moderation States
  const [devAppeals, setDevAppeals] = useState<any[]>([]);
  const [loadingDevAppeals, setLoadingDevAppeals] = useState(false);
  const [appealLimitVal, setAppealLimitVal] = useState<Record<string, number>>({});
  const [appealRejectNotes, setAppealRejectNotes] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<UserData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLink, setSelectedLink] = useState<LinkData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsReport | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [isLoadingAdminLogs, setIsLoadingAdminLogs] = useState(false);

  // Appeals System Admin States
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loadingAppeals, setLoadingAppeals] = useState(false);
  const [appealNotes, setAppealNotes] = useState<Record<string, string>>({});

  // Abuse Reports States
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ open: true, title, message, onConfirm });
  };

  // User details overlay states
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userSubTab, setUserSubTab] = useState<"links" | "qrs">("links");
  const [modalSelectedLink, setModalSelectedLink] = useState<LinkData | null>(null);
  const [modalAnalyticsData, setModalAnalyticsData] = useState<AnalyticsReport | null>(null);
  const [modalLoadingAnalytics, setModalLoadingAnalytics] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Pastebin states
  const [adminPastes, setAdminPastes] = useState<any[]>([]);
  const [adminRooms, setAdminRooms] = useState<any[]>([]);
  const [loadingPastes, setLoadingPastes] = useState(false);
  const [selectedPasteContent, setSelectedPasteContent] = useState<string | null>(null);
  const [selectedPasteTitle, setSelectedPasteTitle] = useState<string | null>(null);
  const [selectedRoomMessages, setSelectedRoomMessages] = useState<any[] | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);

  // Custom DNS Admin States
  const [adminDomains, setAdminDomains] = useState<any[]>([]);
  const [adminBlockedPrefixes, setAdminBlockedPrefixes] = useState<any[]>([]);
  const [adminSubdomains, setAdminSubdomains] = useState<any[]>([]);
  const [loadingDns, setLoadingDns] = useState(false);

  // Forms
  const [newDomain, setNewDomain] = useState("");
  const [newCfZoneId, setNewCfZoneId] = useState("");
  const [newCfToken, setNewCfToken] = useState("");
  const [newBlockedPhrase, setNewBlockedPhrase] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);
  const [addingPhrase, setAddingPhrase] = useState(false);
  const [showCfToken, setShowCfToken] = useState(false);
  const [isPasteSupported, setIsPasteSupported] = useState(false);
  const [banSubdomainTarget, setBanSubdomainTarget] = useState<any | null>(null);
  const [banReasonText, setBanReasonText] = useState("");
  const [banningSubdomain, setBanningSubdomain] = useState(false);

  // Subscription overrides state
  const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userSubFormData, setUserSubFormData] = useState({
    planId: null as string | null,
    customDays: null as number | null,
    customMaxAssets: null as number | null,
    customMaxPastes: null as number | null,
    customMaxRooms: null as number | null,
    customMaxDomains: null as number | null,
    customMaxApiCalls: null as number | null,
    customMaxStorage: null as number | null,
    customMaxFileSize: null as number | null,
    payAsYouGoBalance: null as number | null,
    payAsYouGoPastesBalance: null as number | null,
    payAsYouGoRoomsBalance: null as number | null,
    payAsYouGoDomainsBalance: null as number | null,
  });

  useEffect(() => {
    setIsPasteSupported(!!(typeof window !== 'undefined' && navigator.clipboard?.readText));
  }, []);

  const fetchAdminDnsData = React.useCallback(async () => {
    setLoadingDns(true);
    try {
      const [domRes, prefRes, subRes] = await Promise.all([
        fetch("/api/dns/admin/domains"),
        fetch("/api/dns/admin/blocked-prefixes"),
        fetch("/api/dns/admin/subdomains")
      ]);

      if (domRes.ok) {
        const domJson = await domRes.json();
        setAdminDomains(domJson.data || []);
      }
      if (prefRes.ok) {
        const prefJson = await prefRes.json();
        setAdminBlockedPrefixes(prefJson.data || []);
      }
      if (subRes.ok) {
        const subJson = await subRes.json();
        setAdminSubdomains(subJson.data || []);
      }
    } catch (e) {
      console.error("Error loading admin DNS data:", e);
      toast.error("Gagal memuat data Custom DNS");
    } finally {
      setLoadingDns(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "dns") {
      fetchAdminDnsData();
    }
  }, [activeTab, fetchAdminDnsData]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !newCfZoneId.trim() || !newCfToken.trim()) {
      toast.error("Semua kolom input domain wajib diisi.");
      return;
    }

    setAddingDomain(true);
    try {
      const res = await fetch("/api/dns/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: newDomain.trim().toLowerCase(),
          cloudflareZoneId: newCfZoneId.trim(),
          cloudflareToken: newCfToken.trim()
        })
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Domain Custom & Cloudflare Zone berhasil ditambahkan!");
        setNewDomain("");
        setNewCfZoneId("");
        setNewCfToken("");
        setShowCfToken(false);
        fetchAdminDnsData();
      } else {
        toast.error(json.error || "Gagal menambahkan domain");
      }
    } catch (e) {
      console.error(e);
      toast.error("Kesalahan koneksi.");
    } finally {
      setAddingDomain(false);
    }
  };

  const handleToggleDomainStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/dns/admin/domains/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        toast.success("Status domain berhasil diperbarui!");
        fetchAdminDnsData();
      } else {
        toast.error("Gagal memperbarui status domain");
      }
    } catch (e) {
      console.error(e);
      toast.error("Kesalahan koneksi.");
    }
  };

  const handleDeleteDomain = async (id: string) => {
    showConfirm(
      language === "en" ? "Delete Custom Domain?" : "Hapus Domain Custom?",
      language === "en" 
        ? "Are you sure you want to permanently delete this custom domain? All user subdomains mapped under it will be deactivated."
        : "Apakah Anda yakin ingin menghapus domain custom ini secara permanen? Seluruh subdomain user di bawah domain ini akan ikut dinonaktifkan.",
      async () => {
        setConfirmModal(null);
        try {
          const res = await fetch(`/api/dns/admin/domains/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Domain berhasil dihapus.");
            fetchAdminDnsData();
          } else {
            toast.error("Gagal menghapus domain");
          }
        } catch (e) {
          console.error(e);
          toast.error("Kesalahan koneksi.");
        }
      }
    );
  };

  const handleAddBlockedPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedPhrase.trim()) return;

    setAddingPhrase(true);
    try {
      const res = await fetch("/api/dns/admin/blocked-prefixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase: newBlockedPhrase.trim() })
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Frasa/prefix berhasil diblokir!");
        setNewBlockedPhrase("");
        fetchAdminDnsData();
      } else {
        toast.error(json.error || "Gagal memblokir frasa");
      }
    } catch (e) {
      console.error(e);
      toast.error("Kesalahan koneksi.");
    } finally {
      setAddingPhrase(false);
    }
  };

  const handleDeleteBlockedPhrase = async (id: string) => {
    try {
      const res = await fetch(`/api/dns/admin/blocked-prefixes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Frasa berhasil dihapus dari daftar blokir.");
        fetchAdminDnsData();
      } else {
        toast.error("Gagal menghapus frasa dari daftar blokir");
      }
    } catch (e) {
      console.error(e);
      toast.error("Kesalahan koneksi.");
    }
  };
 
  const handleBanSubdomain = async () => {
    if (!banSubdomainTarget || !banReasonText.trim()) {
      toast.error("Alasan penonaktifan wajib diisi.");
      return;
    }
    setBanningSubdomain(true);
    try {
      const res = await fetch(`/api/dns/admin/subdomains/${banSubdomainTarget.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReasonText })
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Subdomain user berhasil di-ban & dinonaktifkan.");
        setBanSubdomainTarget(null);
        setBanReasonText("");
        fetchAdminDnsData();
      } else {
        toast.error(json.error || "Gagal memblokir/ban subdomain");
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setBanningSubdomain(false);
    }
  };

  const handleRestoreSubdomain = async (id: string) => {
    try {
      const res = await fetch(`/api/dns/admin/subdomains/${id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Subdomain berhasil dipulihkan!");
        fetchAdminDnsData();
      } else {
        toast.error(json.error || "Gagal memulihkan subdomain");
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const fetchAdminPastes = React.useCallback(async () => {
    setLoadingPastes(true);
    try {
      const res = await fetch("/api/admin/pastes");
      if (res.ok) {
        const json = await res.json();
        setAdminPastes(json.data.pastes || []);
        setAdminRooms(json.data.rooms || []);
      }
    } catch (e) {
      console.error("Error fetching admin pastes:", e);
    } finally {
      setLoadingPastes(false);
    }
  }, []);

  const fetchDevAppeals = React.useCallback(async () => {
    setLoadingDevAppeals(true);
    try {
      const res = await fetch("/api/admin/developer-appeals");
      if (res.ok) {
        const json = await res.json();
        setDevAppeals(json.data || []);
      }
    } catch (e) {
      console.error("Error fetching dev appeals:", e);
    } finally {
      setLoadingDevAppeals(false);
    }
  }, []);

  const handleResolveDevAppeal = async (id: string, status: "APPROVED" | "REJECTED") => {
    const limit = appealLimitVal[id] || 100;
    const rejectionReason = appealRejectNotes[id] || "";
    try {
      const res = await fetch(`/api/admin/developer-appeals/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, limit, rejectionReason })
      });
      if (res.ok) {
        toast.success(status === "APPROVED" ? "Permohonan developer disetujui!" : "Permohonan developer ditolak.");
        fetchDevAppeals();
      } else {
        const json = await res.json();
        toast.error(json.error || "Gagal memproses permohonan.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Kesalahan koneksi.");
    }
  };

  useEffect(() => {
    if (activeTab === "developers") {
      fetchDevAppeals();
    }
  }, [activeTab, fetchDevAppeals]);

  useEffect(() => {
    if (activeTab === "pastes") {
      fetchAdminPastes();
    }
  }, [activeTab, fetchAdminPastes]);

  const updateQueryParams = React.useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    updateQueryParams({ tab: tabId, linkId: null, userId: null });
  };

  // Synchronize state with URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab") as "stats" | "users" | "links" | "appeals" | "reports" | "pastes" | "dns" | "developers" | "pricing" | null;
    if (tab && ["stats", "users", "links", "appeals", "reports", "pastes", "dns", "developers", "pricing"].includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab("stats");
    }

    const linkId = searchParams.get("linkId");
    if (linkId && links.length > 0) {
      const found = links.find(l => l.id === linkId);
      if (found) {
        if (!selectedLink || selectedLink.id !== linkId) {
          setSelectedLink(found);
          setLoadingAnalytics(true);
          setAnalyticsData(null);
          fetch(`/api/admin/links/analytics/${found.type}/${found.id}`)
            .then(res => res.json())
            .then(json => {
              setAnalyticsData(json.data);
            })
            .catch(e => {
              console.error(e);
              toast.error("Gagal mengambil data analitik");
            })
            .finally(() => {
              setLoadingAnalytics(false);
            });

          // Fetch Audit Logs if it's a short URL
          if (found.type === 'shorturl' && found.shortUrl) {
            setIsLoadingAdminLogs(true);
            setAdminAuditLogs([]);
            fetch(`/api/user/urls/${found.shortUrl}/audit-logs`)
              .then(res => res.json())
              .then(json => {
                setAdminAuditLogs(json.data || []);
              })
              .catch(err => console.error("Error fetching audit logs for admin:", err))
              .finally(() => {
                setIsLoadingAdminLogs(false);
              });
          } else {
            setAdminAuditLogs([]);
          }
        }
      } else {
        setSelectedLink(null);
      }
    } else {
      setSelectedLink(null);
    }

    const userId = searchParams.get("userId");
    if (userId && users.length > 0) {
      const found = users.find(u => u.id === userId);
      if (found) {
        setSelectedUser(found);
      } else {
        setSelectedUser(null);
      }
    } else {
      setSelectedUser(null);
    }
  }, [searchParams, links, users, selectedLink]);

  const fetchAdminData = React.useCallback(async () => {
    setLoading(true);
    try {
      // @ts-expect-error next-auth session user does not have id by default
      const adminId = session?.user?.id;
      const [statsRes, usersRes, linksRes] = await Promise.all([
        fetch(`/api/admin/stats?adminId=${adminId}`),
        fetch(`/api/admin/users?adminId=${adminId}`),
        fetch(`/api/admin/links?adminId=${adminId}`)
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).data);
      if (usersRes.ok) setUsers((await usersRes.json()).data);
      
      if (linksRes.ok) {
        const raw = await linksRes.json();
        const combined: LinkData[] = [
          ...raw.data.shortUrls.map((s: any) => ({ ...s, type: 'shorturl' })),
          ...raw.data.biolinks.map((b: any) => ({ ...b, type: 'biolink', biolinkType: b.type })),
          ...(raw.data.qrcodes || []).map((q: any) => ({
            ...q,
            title: q.name || 'QR Code',
            url: q.targetUrl,
            shortUrl: q.qrShortUrl,
            type: 'qrcode'
          }))
        ].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLinks(combined);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const fetchAppeals = React.useCallback(async () => {
    setLoadingAppeals(true);
    try {
      const res = await fetch("/api/admin/appeals");
      if (res.ok) {
        const json = await res.json();
        setAppeals(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAppeals(false);
    }
  }, []);

  const handleModerateAppeal = async (appealId: string, status: "APPROVED" | "REJECTED", notes: string) => {
    try {
      const res = await fetch(`/api/admin/appeals/${appealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes })
      });
      if (res.ok) {
        toast.success("Banding berhasil dimoderasi!");
        fetchAppeals();
        fetchAdminData();
      } else {
        toast.error("Gagal memoderasi banding");
      }
    } catch {
      toast.error("Kesalahan jaringan");
    }
  };

  const fetchReports = React.useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const json = await res.json();
        setReports(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  const handleModerateReport = async (reportId: string, status: "RESOLVED" | "IGNORED", notes: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes })
      });
      if (res.ok) {
        toast.success("Laporan berhasil dimoderasi!");
        fetchReports();
      } else {
        toast.error("Gagal memoderasi laporan");
      }
    } catch {
      toast.error("Kesalahan jaringan");
    }
  };

  const handleTakedownFromReport = async (reportId: string, notes: string) => {
    try {
      const res = await fetch(`/api/admin/reports/takedown/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes })
      });
      if (res.ok) {
        toast.success("Aset berhasil di-takedown dan laporan diselesaikan!");
        fetchReports();
        fetchAdminData();
      } else {
        const json = await res.json();
        toast.error(json.error || "Gagal melakukan takedown aset.");
      }
    } catch {
      toast.error("Kesalahan jaringan");
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // @ts-expect-error next-auth session user does not have role by default
      if (session?.user?.role !== "ADMIN") {
        router.push("/manage");
      } else {
        fetchAdminData();
        fetchAppeals();
        fetchReports();
      }
    }
  }, [status, session, router, fetchAdminData, fetchAppeals, fetchReports]);

  // WebSocket support
  useEffect(() => {
    // @ts-expect-error role check
    if (status !== "authenticated" || session?.user?.role !== 'ADMIN') return;

    const socket = io(SOCKET_URL);

    socket.on("admin:statsUpdated", () => {
      // @ts-expect-error id check
      const adminId = session.user.id;
      fetch(`/api/admin/stats?adminId=${adminId}`).then(r => r.json()).then(d => setStats(d.data));
    });

    socket.on("admin:viewIncremented", ({ id }) => {
      setLinks(prev => prev.map(l => l.id === id ? { ...l, views: (l.views || 0) + 1 } : l));
    });

    socket.on("admin:reportAbuseCreated", (report) => {
      setReports(prev => [report, ...prev]);
      toast.info(`Laporan penyalahgunaan baru! Tipe: ${report.assetType}`);
    });

    return () => { socket.disconnect(); };
  }, [status, session]);

  const handleTakedown = async (link: LinkData) => {
    const isCurrentlyActive = !!link.isActive;
    const nextStatus = !isCurrentlyActive;
    
    setActionLoading(link.id);
    try {
      // @ts-expect-error adminId check
      const adminId = session?.user?.id;
      const res = await fetch(`/api/admin/links/takedown/${link.type}/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, isActive: nextStatus })
      });
      if (res.ok) {
        toast.success(`Broadcasting: Status ${link.title} telah diperbarui!`);
        setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: nextStatus } : l));
      } else {
        toast.error("Gagal mengubah status link");
      }
    } catch (e) { 
      toast.error("Error jaringan saat memperbarui status");
    } finally { setActionLoading(null); }
  };

  const handleToggleRole = (user: UserData) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    showConfirm(
      t.confirm.toggleRoleTitle,
      t.confirm.toggleRoleMsg(user.name || user.email, nextRole),
      async () => {
        setConfirmModal(null);
        setActionLoading(user.id);
        try {
          // @ts-expect-error adminId check
          const adminId = session?.user?.id;
          const res = await fetch(`/api/admin/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId, role: nextRole })
          });
          if (res.ok) {
            toast.success(`Role updated to ${nextRole}`);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: nextRole } : u));
          } else {
            toast.error("Failed to update role");
          }
        } catch (e) {
          toast.error("Network error");
        } finally { setActionLoading(null); }
      }
    );
  };

  const handleDeleteUser = (id: string) => {
    showConfirm(
      t.confirm.deleteUserTitle,
      t.confirm.deleteUserMsg,
      async () => {
        setConfirmModal(null);
        setActionLoading(id);
        try {
          // @ts-expect-error adminId check
          const adminId = session?.user?.id;
          const res = await fetch(`/api/admin/users/${id}?adminId=${adminId}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success("User deleted successfully");
            setUsers(prev => prev.filter(u => u.id !== id));
          } else {
            toast.error("Failed to delete user");
          }
        } catch (e) {
          toast.error("Error while deleting");
        } finally { setActionLoading(null); }
      }
    );
  };

  const handleViewAnalytics = async (link: LinkData) => {
    setActiveTab("links");
    setSelectedLink(link);
    updateQueryParams({ tab: "links", linkId: link.id });
  };

  const handleViewModalAnalytics = async (link: LinkData) => {
    setModalSelectedLink(link);
    setModalLoadingAnalytics(true);
    setModalAnalyticsData(null);
    try {
      const res = await fetch(`/api/admin/links/analytics/${link.type}/${link.id}`);
      if (res.ok) {
        const json = await res.json();
        setModalAnalyticsData(json.data);
      } else {
        toast.error("Gagal mengambil data analitik");
      }
    } catch(e) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setModalLoadingAnalytics(false);
    }
  };

  const handleTakedownInModal = async (link: LinkData) => {
    const isCurrentlyActive = !!link.isActive;
    const nextStatus = !isCurrentlyActive;
    await handleTakedown(link);
    if (modalSelectedLink && modalSelectedLink.id === link.id) {
      setModalSelectedLink(prev => prev ? { ...prev, isActive: nextStatus } : null);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    updateQueryParams({ userId: null });
    setModalSelectedLink(null);
    setModalAnalyticsData(null);
  };

  // Synchronize Subscriptions form when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setUserSubFormData({
        planId: selectedUser.planId || null,
        customDays: null,
        customMaxAssets: selectedUser.customMaxAssets || null,
        customMaxPastes: selectedUser.customMaxPastes || null,
        customMaxRooms: selectedUser.customMaxRooms || null,
        customMaxDomains: selectedUser.customMaxDomains || null,
        customMaxApiCalls: selectedUser.customMaxApiCalls || null,
        customMaxStorage: selectedUser.customMaxStorage || null,
        customMaxFileSize: selectedUser.customMaxFileSize || null,
        payAsYouGoBalance: selectedUser.payAsYouGoBalance !== undefined ? selectedUser.payAsYouGoBalance : 0,
        payAsYouGoPastesBalance: selectedUser.payAsYouGoPastesBalance !== undefined ? selectedUser.payAsYouGoPastesBalance : 0,
        payAsYouGoRoomsBalance: selectedUser.payAsYouGoRoomsBalance !== undefined ? selectedUser.payAsYouGoRoomsBalance : 0,
        payAsYouGoDomainsBalance: selectedUser.payAsYouGoDomainsBalance !== undefined ? selectedUser.payAsYouGoDomainsBalance : 0,
      });

      // Fetch active plans list
      fetch("/api/admin/pricing/plans")
        .then(r => r.json())
        .then(json => {
          setAvailablePlans((json.data || []).filter((p: any) => p.id !== "FREE"));
        })
        .catch(err => console.error("Error loading plans:", err));
    }
  }, [selectedUser]);

  const handleSaveUserSubscription = async () => {
    if (!selectedUser) return;
    setUserSubmitting(true);
    try {
      // @ts-expect-error adminId check
      const adminId = session?.user?.id;
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          planId: userSubFormData.planId,
          customDays: userSubFormData.customDays,
          customMaxAssets: userSubFormData.customMaxAssets,
          customMaxPastes: userSubFormData.customMaxPastes,
          customMaxRooms: userSubFormData.customMaxRooms,
          customMaxDomains: userSubFormData.customMaxDomains,
          customMaxApiCalls: userSubFormData.customMaxApiCalls,
          customMaxStorage: userSubFormData.customMaxStorage,
          customMaxFileSize: userSubFormData.customMaxFileSize,
          payAsYouGoBalance: userSubFormData.payAsYouGoBalance,
          payAsYouGoPastesBalance: userSubFormData.payAsYouGoPastesBalance,
          payAsYouGoRoomsBalance: userSubFormData.payAsYouGoRoomsBalance,
          payAsYouGoDomainsBalance: userSubFormData.payAsYouGoDomainsBalance,
        })
      });

      if (res.ok) {
        toast.success(language === "en" ? "User limits & subscription successfully updated!" : "Langganan & batas limit user berhasil diperbarui!");
        const json = await res.json();
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...json.data } : u));
        setSelectedUser(json.data);
      } else {
        toast.error("Gagal menyimpan kustomisasi.");
      }
    } catch {
      toast.error("Kesalahan jaringan.");
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleRevokeSubscription = async () => {
    if (!selectedUser) return;
    if (!confirm(language === "en" ? "Are you sure you want to revoke this user's active package? This will set them back to the FREE Plan." : "Apakah Anda yakin ingin membatalkan paket aktif user ini? Hal ini akan mengembalikan user ke Paket FREE dasar.")) return;
    
    setUserSubmitting(true);
    try {
      // @ts-expect-error adminId check
      const adminId = session?.user?.id;
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          planId: "FREE",
          customDays: null,
        })
      });

      if (res.ok) {
        toast.success(language === "en" ? "Subscription successfully revoked!" : "Langganan aktif user berhasil dibatalkan!");
        const json = await res.json();
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...json.data } : u));
        setSelectedUser(json.data);
        setUserSubFormData(prev => ({ ...prev, planId: null, customDays: null }));
      } else {
        toast.error("Gagal melakukan revoke.");
      }
    } catch {
      toast.error("Kesalahan jaringan.");
    } finally {
      setUserSubmitting(false);
    }
  };
  

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLinks = links.filter(l => 
    l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.shortUrl?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAppeals = appeals.filter(a => 
    a.assetTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.assetSlug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[400px] w-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full text-slate-900 dark:text-white selection:bg-indigo-500/20 font-sans pb-10 sm:pb-20">

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal?.open && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
            okLabel={t.confirm.ok}
            cancelLabel={t.confirm.cancel}
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <section className="mb-6 sm:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6">
        <div className="space-y-1 sm:space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/5 px-2.5 py-1 rounded-xl border border-indigo-500/20 w-fit">
            <FontAwesomeIcon icon={faShieldAlt} className="text-indigo-600 dark:text-indigo-400 text-[10px]" />
            <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.badge}</p>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">{t.title.split('&')[0]}&amp; <span className="text-indigo-600 dark:text-indigo-400">{t.title.split('& ')[1]}</span></h1>
          <p className="text-slate-500 dark:text-zinc-500 text-[10px] sm:text-xs font-medium leading-relaxed opacity-80">
            {t.subtitle}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative group w-full sm:w-[260px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <FontAwesomeIcon icon={faSearch} className="text-xs" />
            </div>
            <input 
              type="text" 
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-black/20 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/5 mb-6 sm:mb-8 overflow-x-auto scrollbar-none shadow-inner no-scrollbar">
        {([
          { id: "stats", icon: faChartLine },
          { id: "users", icon: faUsers },
          { id: "links", icon: faLink },
          { id: "appeals", icon: faShieldAlt },
          { id: "reports", icon: faExclamationTriangle },
          { id: "pastes", icon: faPaste },
          { id: "dns", icon: faGlobe },
          { id: "developers", icon: faCode },
          { id: "pricing", icon: faDatabase },
        ] as { id: 'stats'|'users'|'links'|'appeals'|'reports'|'pastes'|'dns'|'developers'|'pricing'; icon: typeof faChartLine }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 min-w-[70px] sm:min-w-[100px] flex items-center justify-center gap-2 px-2 py-1.5 sm:px-4 sm:py-2.5 text-[9px] sm:text-[11px] rounded-lg sm:rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm sm:shadow-md" 
              : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="text-[9px] sm:text-[10px]" />
            <span className="hidden sm:inline">{t.tabs[tab.id]}</span>
            <span className="sm:hidden">{t.tabsShort[tab.id]}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "stats" && stats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="stats" className="space-y-8 sm:space-y-12">
              
              {/* Grid Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
                {[
                  { label: t.stats.users, value: stats.totalUsers, icon: faUsers },
                  { label: t.stats.userLinks, value: stats.totalUserLinks, icon: faLink },
                  { label: t.stats.guestLinks, value: stats.totalGuestLinks, icon: faGlobe },
                  { label: t.stats.qrcodes, value: stats.totalQrcodes, icon: faQrcode },
                  { label: t.stats.views, value: stats.totalViews, icon: faChartLine },
                ].map((s, i) => (
                  <motion.div 
                    key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-white/5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/5 group hover:border-indigo-500/50 transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shadow-inner">
                        <FontAwesomeIcon icon={s.icon} className="text-xs sm:text-sm" />
                      </div>
                      <span className="text-[7px] font-bold text-slate-400/50 uppercase tracking-widest">Live</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 mb-0.5 uppercase tracking-tight truncate">{s.label}</p>
                    <p className="text-base sm:text-lg font-bold tracking-tight">{s.value.toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                {/* Traffic Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-white/[0.03] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="space-y-0.5 sm:space-y-1">
                      <h4 className="text-[8px] sm:text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.analysisTitle}</h4>
                      <p className="text-sm sm:text-lg font-bold tracking-tight">{t.trafficChart}</p>
                    </div>
                    <div className="hidden xs:flex items-center gap-1.5 sm:gap-2.5 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[7px] sm:text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Normal</span>
                    </div>
                  </div>
                  <div className="h-[140px] sm:h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.dailyTraffic}>
                        <defs>
                          <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="10 10" stroke="rgba(0,0,0,0.03)" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight="700" tickFormatter={(v) => v.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} fontWeight="700" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '1.5rem', padding: '15px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                          labelStyle={{ color: '#6366f1', fontWeight: '800', marginBottom: '5px', fontSize: '9px' }}
                          itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: '800', padding: 0 }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Country List */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-white/[0.03] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl">
                    <h4 className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 sm:mb-4 pb-2 border-b border-slate-100 dark:border-white/5">{t.popularCountries}</h4>
                    <div className="space-y-2.5 sm:space-y-3">
                      {stats.topStats.countries.slice(0, 5).map((c, i) => (
                        <div key={i} className="group">
                          <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold mb-1">
                            <span className="text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors tracking-tight">{c.name}</span>
                            <span className="text-indigo-600 font-bold italic">{c.count}</span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} animate={{ width: `${(c.count / (stats.totalViews || 1)) * 100}%` }}
                              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/[0.03] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center">
                    <h4 className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3 sm:mb-4 pb-2 border-b border-slate-100 dark:border-white/5 w-full text-center">{t.environment}</h4>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
                      <div className="space-y-2">
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center">{t.device}</p>
                        <div className="space-y-1.5">
                          {stats.topStats.devices.slice(0, 3).map((d, i) => (
                            <div key={i} className="flex justify-between text-[9px] font-bold">
                              <span className="text-slate-500 truncate max-w-[50px]">{d.name}</span>
                              <span className="text-indigo-500">{d.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center">Browser</p>
                        <div className="space-y-1.5">
                          {stats.topStats.browsers.slice(0, 3).map((b, i) => (
                            <div key={i} className="flex justify-between text-[9px] font-bold">
                              <span className="text-slate-500 truncate max-w-[50px]">{b.name}</span>
                              <span className="text-indigo-500">{b.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-xl">
                  <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                        <FontAwesomeIcon icon={faHistory} className="text-[10px] sm:text-xs" />
                      </div>
                      <h4 className="text-xs font-bold tracking-tight">{t.activityList}</h4>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {stats.recentActivity.slice(0, 10).map((a, i) => (
                          <tr key={i} onClick={() => setSelectedActivity(a)} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-[11px] cursor-pointer group">
                            <td className="px-4 py-1.5 sm:px-6 sm:py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-2 sm:gap-3 font-bold">
                                <span className="text-base">{a.qrCodeId ? '📱' : (a.biolinkLinkId ? '🌳' : '🔗')}</span>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 dark:text-white truncate max-w-[120px] sm:max-w-[180px] tracking-tight">{a.qrCode?.name || a.userUrl?.title || a.biolinkLink?.title || 'System'}</div>
                                  <div className="text-[7px] sm:text-[8px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">#{a.id.slice(0, 6)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-1.5 sm:px-4 sm:py-2.5 whitespace-nowrap text-slate-500 font-bold text-[9px] sm:text-[10px]">
                              {a.country || 'Unknown'}
                            </td>
                            <td className="px-4 py-1.5 sm:px-6 sm:py-2.5 text-right whitespace-nowrap">
                              <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Health Console */}
                <div className="bg-white dark:bg-indigo-600 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between relative overflow-hidden group shadow-xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 transition-transform group-hover:scale-125" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500 dark:bg-white/10 flex items-center justify-center text-white shadow-lg">
                        <FontAwesomeIcon icon={faUserShield} className="text-sm sm:text-base" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-md font-bold tracking-tight text-slate-900 dark:text-white">{t.health.title}</h3>
                        <p className="text-[7px] sm:text-[8px] font-bold opacity-50 uppercase tracking-widest">System v4.2</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4 sm:mb-5">
                      {[
                        { icon: faDatabase, label: "Database OK" },
                        { icon: faServer, label: "Server OK" },
                        { icon: faCheckCircle, label: "Firewall OK" },
                      ].map((h, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-white/5">
                          <FontAwesomeIcon icon={faCircle} className="text-[5px] text-emerald-400 animate-pulse" />
                          <p className="text-[10px] font-bold text-slate-900 dark:text-white/80">{h.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-indigo-600 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faDownload} />
                    {t.health.export}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} key="users" className="bg-white dark:bg-white/[0.02] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-white/5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3 sm:px-6 sm:py-4">{t.userTable.user}</th>
                      <th className="px-3 py-3 sm:px-5 sm:py-4">{t.userTable.content}</th>
                      <th className="px-3 py-3 sm:px-5 sm:py-4">{t.userTable.access}</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">{t.userTable.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-3 sm:px-6 sm:py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-xs sm:text-sm text-white shadow-md relative cursor-pointer" onClick={() => { setSelectedUser(u); updateQueryParams({ userId: u.id }); }}>
                              {u.image ? (
                                <img src={u.image} alt={u.name || 'User'} className="w-full h-full object-cover" />
                              ) : (
                                u.name?.[0] || u.email[0].toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 cursor-pointer" onClick={() => { setSelectedUser(u); updateQueryParams({ userId: u.id }); }}>
                              <div className="font-bold text-xs sm:text-sm tracking-tight truncate max-w-[100px] sm:max-w-none uppercase hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{u.name || 'User'}</div>
                              <div className="text-[9px] sm:text-[11px] text-slate-400 font-bold truncate max-w-[100px] sm:max-w-none">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <div className="text-sm sm:text-lg font-bold text-indigo-600 tracking-tighter italic lining-nums">{(u._count?.userUrls || 0)}</div>
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <button 
                            onClick={() => handleToggleRole(u)}
                            disabled={actionLoading === u.id || (session?.user as any).id === u.id}
                            className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-all border ${
                              u.role === 'ADMIN' 
                              ? 'bg-indigo-600 text-white border-indigo-400' 
                              : 'bg-white dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-white/5'
                            } disabled:opacity-50`}
                          >
                            {u.role}
                          </button>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => { setSelectedUser(u); updateQueryParams({ userId: u.id }); }} 
                              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-indigo-500 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-xs" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)} 
                              disabled={actionLoading === u.id || u.role === 'ADMIN'}
                              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-600 hover:text-white rounded-lg transition-all disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "links" && (
            <div className="space-y-6">
              {!selectedLink ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.98 }} 
                  key="links-list" 
                  className="bg-white dark:bg-white/[0.02] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm backdrop-blur-xl"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-white/5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-3 sm:px-6 sm:py-4">{t.table.asset}</th>
                          <th className="px-3 py-3 sm:px-5 sm:py-4">{t.table.target}</th>
                          <th className="px-3 py-3 sm:px-5 sm:py-4">{t.table.creator}</th>
                          <th className="px-3 py-3 sm:px-5 sm:py-4">{t.table.date}</th>
                          <th className="px-3 py-3 sm:px-5 sm:py-4">{t.table.clicks}</th>
                          <th className="px-3 py-3 sm:px-5 sm:py-4">{t.table.status}</th>
                          <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">{t.table.action}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredLinks.map(l => {
                          const isActive = !!l.isActive;
                          const isHeader = l.biolinkType === 'header';
                          return (
                            <tr 
                              key={l.id} 
                              onClick={() => !isHeader && handleViewAnalytics(l)}
                              className={`transition-colors group text-xs ${isHeader ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                              <td className="px-4 py-3 sm:px-6 sm:py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-black flex items-center justify-center text-sm transition-all shrink-0 ${isActive ? 'grayscale-0' : 'grayscale opacity-30'}`}>
                                    {l.type === 'shorturl' ? '🔗' : l.type === 'biolink' ? (l.biolinkType === 'header' ? '📁' : '🌳') : '📱'}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold tracking-tight truncate max-w-[150px] uppercase text-slate-800 dark:text-white">{l.title || 'Untitled'}</div>
                                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                                      {l.type === 'biolink' ? `nyoo.me/${l.profile?.username}` : `nyoo.me/${l.shortUrl}`}
                                    </div>
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mt-1 ${
                                      l.type === 'shorturl' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25' :
                                      l.type === 'qrcode' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25' :
                                      l.biolinkType === 'header' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                                    }`}>
                                      {l.type === 'shorturl' ? 'Short URL' :
                                       l.type === 'qrcode' ? 'QR Code' :
                                       l.biolinkType === 'header' ? 'Biolink Header' : 'Biolink Link'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 sm:px-5 sm:py-3.5 max-w-[200px]">
                                <div className="flex items-center gap-2">
                                  {l.url ? (
                                    <>
                                      {getFavicon(l.url) && (
                                        <img 
                                          src={getFavicon(l.url) || ''} 
                                          alt="" 
                                          className="w-4 h-4 rounded object-contain bg-white p-0.5 shrink-0" 
                                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                        />
                                      )}
                                      <a 
                                        href={l.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono truncate"
                                      >
                                        {l.url}
                                      </a>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 dark:text-zinc-550 font-medium">
                                      {isHeader ? t.headerSection : t.noUrl}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[120px] uppercase">
                                    {l.user?.name || l.profile?.user?.name || t.guestUser}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                    {l.user?.email || l.profile?.user?.email || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 sm:px-5 sm:py-3.5 text-slate-500 dark:text-zinc-400 font-bold whitespace-nowrap">
                                {new Date(l.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-tighter italic">
                                  {isHeader ? '-' : (l.views || 0)}
                                </div>
                              </td>
                              <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                  l.isDeleted ? 'bg-slate-500/10 text-slate-500 border border-slate-500/25' : (isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')
                                }`}>
                                  {l.isDeleted ? (language === 'en' ? 'Deleted' : 'Terhapus') : (isActive ? t.status.active : t.status.takedown)}
                                </span>
                              </td>
                              <td className="px-4 py-3 sm:px-6 sm:py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                  {!isHeader && (
                                    <button 
                                      onClick={() => handleViewAnalytics(l)}
                                      className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                                    >
                                      {t.actions.analyze}
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleTakedown(l)}
                                    disabled={actionLoading === l.id || l.isDeleted}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${
                                      l.isDeleted
                                      ? 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent cursor-not-allowed'
                                      : (isActive 
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-600 hover:text-white' 
                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-600 hover:text-white')
                                    }`}
                                  >
                                    {l.isDeleted ? (language === 'en' ? 'Deleted' : 'Terhapus') : (isActive ? t.actions.takedown : t.actions.activate)}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                /* Analytics Details Panel */
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <button 
                    onClick={() => { setSelectedLink(null); updateQueryParams({ linkId: null }); }} 
                    className="group flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-white dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm"
                  >
                    {t.actions.back}
                  </button>

                  {loadingAnalytics ? (
                    <div className="p-10 flex flex-col items-center justify-center bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/10">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">{t.loadingAnalytics}</p>
                    </div>
                  ) : analyticsData ? (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-3 sm:p-4 rounded-xl shadow-md relative overflow-hidden text-white flex justify-between items-center">
                        <div className="relative z-10 space-y-0.5">
                          <h2 className="text-sm sm:text-lg font-bold tracking-tight uppercase">{selectedLink.title}</h2>
                          <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest">
                            {selectedLink.type === 'biolink' ? `nyoo.me/${selectedLink.profile?.username}` : `nyoo.me/${selectedLink.shortUrl}`}
                          </p>
                        </div>
                        <div className="relative z-10 text-right">
                          <span className="text-2xl sm:text-3xl font-bold tracking-tighter lining-nums block">{analyticsData.totalViews}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Total {t.clicks}</span>
                        </div>
                      </div>

                      {/* Metadata & Fraud Prevention Console */}
                      <div className="bg-white dark:bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm space-y-3 text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-white/5">
                          <span className="text-base">🛡️</span>
                          <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-tight text-slate-800 dark:text-white">{t.metaSecurityTitle}</h4>
                            <p className="text-[9px] text-slate-400 font-medium">{t.metaSecurityDesc}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                          {/* Left Column: URLs */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">{t.destinationUrl}</p>
                              <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/25 p-2 rounded-lg border border-slate-150 dark:border-white/5">
                                {selectedLink.url ? (
                                  <>
                                    {getFavicon(selectedLink.url) && (
                                      <img 
                                        src={getFavicon(selectedLink.url) || ''} 
                                        alt="Favicon" 
                                        className="w-4 h-4 rounded object-contain bg-white p-0.5" 
                                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                      />
                                    )}
                                    <a 
                                      href={selectedLink.url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-indigo-600 dark:text-indigo-400 hover:underline break-all font-mono text-[11px] line-clamp-2"
                                    >
                                      {selectedLink.url}
                                    </a>
                                  </>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    {selectedLink.biolinkType === 'header' ? t.headerSection : t.noUrl}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">{t.shortLink}</p>
                              <div className="bg-slate-50 dark:bg-black/25 p-2 rounded-lg border border-slate-150 dark:border-white/5">
                                <a 
                                  href={selectedLink.type === 'biolink' ? `http://localhost:3000/${selectedLink.profile?.username}` : `http://localhost:3000/${selectedLink.shortUrl}`}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-slate-700 dark:text-zinc-300 hover:underline font-mono text-[11px]"
                                >
                                  {selectedLink.type === 'biolink' ? `nyoo.me/${selectedLink.profile?.username}` : `nyoo.me/${selectedLink.shortUrl}`}
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Asset Details & Creator */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">{t.assetType}</p>
                                <div className="bg-slate-50 dark:bg-black/25 p-2 rounded-lg border border-slate-150 dark:border-white/5 capitalize text-slate-750 dark:text-zinc-350 flex items-center gap-1.5 text-[11px]">
                                  <span>
                                    {selectedLink.type === 'shorturl' 
                                      ? '🔗 Short URL' 
                                      : selectedLink.type === 'biolink' 
                                        ? (selectedLink.biolinkType === 'header' ? '🌳 Biolink Header' : '🌳 Biolink Link') 
                                        : '📱 QR Code'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">{t.createdDate}</p>
                                <div className="bg-slate-50 dark:bg-black/25 p-2 rounded-lg border border-slate-150 dark:border-white/5 text-slate-600 dark:text-zinc-350 text-[11px]">
                                  {new Date(selectedLink.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium' })}
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">{t.creatorLabel}</p>
                              <div className="bg-slate-50 dark:bg-black/25 p-2 rounded-lg border border-slate-150 dark:border-white/5">
                                <div className="text-slate-800 dark:text-white uppercase font-black truncate text-[11px]">{selectedLink.user?.name || selectedLink.profile?.user?.name || t.guestUser}</div>
                                <div className="text-[10px] text-slate-400 font-bold truncate">{selectedLink.user?.email || selectedLink.profile?.user?.email || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fraud Flag Analysis */}
                        {selectedLink.biolinkType !== 'header' && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-start gap-2.5">
                            <span className="text-sm text-amber-500 font-bold">⚠️</span>
                            <div className="space-y-0.5 text-[9px] text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                              <p className="font-bold uppercase tracking-wider text-[8px] text-amber-600 dark:text-amber-400">{t.fraud}</p>
                              <p>{t.fraudMsg(selectedLink.url ? new URL(selectedLink.url).hostname : 'N/A')}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Charts and Tables */}
                      <div className="bg-white dark:bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <h4 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3 text-center">{t.visitTrafficChart}</h4>
                        <div className="h-[120px] sm:h-[150px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.daily}>
                              <CartesianGrid strokeDasharray="10 10" stroke="rgba(0,0,0,0.03)" vertical={false} />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} fontWeight="700" tickFormatter={(v) => v.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={8} fontWeight="700" axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} contentStyle={{ border: 'none', borderRadius: '1rem', fontWeight: '800' }} />
                              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={16} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {[
                          { title: t.device, data: analyticsData.devices, type: 'pie' },
                          { title: t.system, data: analyticsData.os, type: 'bar' },
                          { title: t.location, data: analyticsData.countries, type: 'bar' }
                        ].map((block, idx) => (
                          <div key={idx} className="bg-white dark:bg-white/[0.03] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center">
                            <h4 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/5 w-full text-center pb-1">{block.title}</h4>
                            <div className="h-[90px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                {block.type === 'pie' ? (
                                  <PieChart>
                                    <Pie data={block.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={36} innerRadius={22} paddingAngle={4}>
                                      {block.data.map((_, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                      ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', fontSize: '9px' }} />
                                  </PieChart>
                                ) : (
                                  <BarChart data={block.data} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={8} fontWeight="700" width={45} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} contentStyle={{ border: 'none', borderRadius: '0.5rem', fontSize: '9px' }} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={8} />
                                  </BarChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Geographic Distribution Map */}
                      <div className="bg-white dark:bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                        <h4 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3 text-center">{t.mapTitle}</h4>
                        <div className="h-[160px] w-full rounded-xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-inner">
                          <AnalyticsMap locations={analyticsData.locations || []} type="overview" />
                        </div>
                      </div>

                      {/* Visitor Log (IP & Location) */}
                      <div className="bg-white dark:bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <h4 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3 text-center">{t.visitorLog}</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-black/30 border-b border-slate-200 dark:border-white/5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              <tr>
                                <th className="px-3 py-1.5">{t.ipAddress}</th>
                                <th className="px-3 py-1.5">{t.location}</th>
                                <th className="px-3 py-1.5 text-right">{t.time}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                              {(analyticsData.visitors || []).slice(0, 10).map((v, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="px-3 py-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{v.ip}</td>
                                  <td className="px-3 py-1.5 font-bold text-slate-700 dark:text-zinc-350">{v.city || 'Unknown'}, {v.country || 'Unknown'}</td>
                                  <td className="px-3 py-1.5 text-right text-slate-400 font-bold">
                                    {new Date(v.date).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                                  </td>
                                </tr>
                              ))}
                              {(analyticsData.visitors || []).length === 0 && (
                                <tr>
                                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                                    {t.noVisitorData}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Audit Log Timeline for Admin */}
                      {selectedLink.type === 'shorturl' && (
                        <div className="bg-white dark:bg-zinc-900/40 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                          <h4 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-4 text-center">Riwayat Perubahan Tautan (Audit Log)</h4>
                          {isLoadingAdminLogs ? (
                            <div className="flex flex-col items-center justify-center py-10">
                              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Fetching logs...' : 'Menarik log perubahan...'}</p>
                            </div>
                          ) : adminAuditLogs.length ? (
                            <div className="relative border-l-2 border-slate-250 dark:border-slate-800 ml-4 pl-6 space-y-6 py-1">
                              {adminAuditLogs.map((log) => (
                                <div key={log.id} className="relative group">
                                  {/* Timeline Bullet */}
                                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-all shadow-md" />
                                  
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 tracking-tight leading-tight">{log.details}</p>
                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono shrink-0">
                                      {new Date(log.createdAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span>
                                      Pelaku: <strong className="text-indigo-600 dark:text-indigo-400">{log.actorName}</strong>
                                      <span className="ml-1 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[8px] font-bold">{log.actorRole}</span>
                                    </span>
                                    <span className="w-1 h-1 bg-slate-350 dark:bg-slate-700 rounded-full" />
                                    <span>IP: <code className="bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded font-mono font-bold text-slate-650 dark:text-zinc-450">{log.ip}</code></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? 'No change history found.' : 'Belum ada riwayat perubahan.'}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="p-20 text-center bg-white dark:bg-white/5 rounded-3xl">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{t.analyticsLoadError}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {activeTab === "appeals" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }} 
              key="appeals-list" 
              className="space-y-6"
            >
              {loadingAppeals ? (
                <div className="min-h-[300px] w-full flex flex-col items-center justify-center bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">{t.loading}</p>
                </div>
              ) : filteredAppeals.length === 0 ? (
                <div className="p-20 text-center bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{t.appealsActions.noAppeals}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredAppeals.map((appeal) => {
                    const isPending = appeal.status === "PENDING";
                    const isApproved = appeal.status === "APPROVED";
                    const isRejected = appeal.status === "REJECTED";

                    return (
                      <motion.div 
                        key={appeal.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-zinc-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between backdrop-blur-xl group hover:border-indigo-500/30 transition-all"
                      >
                        <div>
                          {/* Appeal Header */}
                          <div className="flex justify-between items-start gap-4 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                            <div className="min-w-0">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mb-1.5 ${
                                appeal.assetType === 'shorturl' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25' :
                                appeal.assetType === 'qrcode' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25' :
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                              }`}>
                                {appeal.assetType}
                              </span>
                              <h3 className="font-bold text-xs uppercase text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                                {appeal.assetTitle || "Untitled"}
                              </h3>
                              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-[300px] mt-0.5">
                                nyoo.me/{appeal.assetSlug}
                              </p>
                            </div>

                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border shrink-0 ${
                              isApproved 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : isRejected 
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                            }`}>
                              {t.appealsStatus[appeal.status.toLowerCase() as keyof typeof t.appealsStatus]}
                            </span>
                          </div>

                          {/* User metadata */}
                          <div className="flex items-center gap-2.5 mb-4 bg-slate-50 dark:bg-black/10 p-2.5 rounded-xl border border-slate-150 dark:border-white/5 text-[10px] sm:text-xs">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0">
                              {appeal.user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:text-white uppercase truncate">{appeal.user?.name || "User"}</p>
                              <p className="text-[9px] text-slate-400 truncate">{appeal.user?.email}</p>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="mb-4">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.appealsTable.reason}</p>
                            <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-150 dark:border-white/5 whitespace-pre-wrap">
                              {appeal.reason}
                            </p>
                          </div>

                          {/* Proof Url */}
                          {appeal.proofUrl && (
                            <div className="mb-4">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.appealsTable.proof}</p>
                              <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 p-2 rounded-xl border border-slate-150 dark:border-white/5 text-xs">
                                <span>📄</span>
                                <a 
                                  href={appeal.proofUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono truncate"
                                >
                                  {appeal.proofUrl}
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Proof Images */}
                          {appeal.proofImages && (() => {
                            try {
                              const imgs = JSON.parse(appeal.proofImages);
                              if (Array.isArray(imgs) && imgs.length > 0) {
                                return (
                                  <div className="mb-4">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Foto Bukti (Proof Photos)</p>
                                    <div className="flex gap-2">
                                      {imgs.map((url, idx) => (
                                        <a 
                                          key={idx} 
                                          href={url} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 hover:opacity-85 hover:scale-105 transition-all shadow-sm"
                                        >
                                          <img src={url} alt="Proof" className="w-full h-full object-cover" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            } catch {
                              return null;
                            }
                          })()}

                          {/* Admin Notes / Moderation Action */}
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            {isPending ? (
                              <div className="space-y-3">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.appealsActions.notesPlaceholder}</p>
                                <textarea
                                  placeholder={t.appealsActions.notesPlaceholder}
                                  value={appealNotes[appeal.id] || ""}
                                  onChange={(e) => setAppealNotes(prev => ({ ...prev, [appeal.id]: e.target.value }))}
                                  className="w-full h-20 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-400 placeholder:font-bold"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleModerateAppeal(appeal.id, "REJECTED", appealNotes[appeal.id] || "")}
                                    className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-red-500/20 active:scale-[0.98]"
                                  >
                                    {t.appealsActions.reject}
                                  </button>
                                  <button
                                    onClick={() => handleModerateAppeal(appeal.id, "APPROVED", appealNotes[appeal.id] || "")}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                                  >
                                    {t.appealsActions.approve}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 dark:bg-black/10 p-3 rounded-xl border border-slate-150 dark:border-white/5 text-[11px]">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Moderator Feedback</p>
                                  <span className="text-[9px] font-bold text-slate-400 italic">
                                    {new Date(appeal.updatedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-zinc-400 font-semibold leading-relaxed">
                                  {appeal.adminNotes || (language === 'en' ? "No feedback notes provided." : "Tidak ada catatan feedback.")}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }} 
              key="reports-list" 
              className="space-y-6"
            >
              {loadingReports ? (
                <div className="min-h-[300px] w-full flex flex-col items-center justify-center bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">{t.loading}</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-20 text-center bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Tidak ada laporan penyalahgunaan saat ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {reports.filter(r => 
                    r.assetType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.assetId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.details?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((report) => {
                    const isPending = report.status === "PENDING";
                    const isResolved = report.status === "RESOLVED";
                    const isIgnored = report.status === "IGNORED";

                    return (
                      <motion.div 
                        key={report.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-zinc-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between backdrop-blur-xl group hover:border-red-500/30 transition-all"
                      >
                        <div>
                          {/* Report Header */}
                          <div className="flex justify-between items-start gap-4 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                            <div className="min-w-0">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mb-1.5 ${
                                report.assetType === 'shorturl' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25' :
                                report.assetType === 'qrcode' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25' :
                                report.assetType === 'biolink' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' :
                                report.assetType === 'file' ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/25' :
                                'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25'
                              }`}>
                                {report.assetType}
                              </span>
                              <h3 className="font-bold text-xs uppercase text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                                ID Aset: {report.assetId}
                              </h3>
                              {report.assetUrl && (
                                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-[300px] mt-0.5">
                                  Tautan: <a href={`/${report.assetUrl}`} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">{report.assetUrl}</a>
                                </p>
                              )}
                            </div>

                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border shrink-0 ${
                              isResolved 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : isIgnored 
                                  ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' 
                                  : 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                            }`}>
                              {report.status}
                            </span>
                          </div>

                          {/* Reporter Info */}
                          <div className="mb-4 bg-slate-50 dark:bg-black/10 p-2.5 rounded-xl border border-slate-150 dark:border-white/5 text-[10px] sm:text-xs">
                            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Informasi Pelapor</p>
                            <p className="font-bold text-slate-800 dark:text-white truncate">Nama: {report.reporterName || "Anonymous Guest"}</p>
                            {report.reporterEmail && <p className="text-[9px] text-slate-400 truncate">Email: {report.reporterEmail}</p>}
                            <p className="text-[8px] text-slate-400/50 mt-1">IP: {report.reporterIp || "Unknown"}</p>
                          </div>

                          {/* Category / Reason */}
                          <div className="mb-3">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori Pelanggaran</p>
                            <span className="text-xs text-red-550 dark:text-red-400 font-black">{report.reason}</span>
                          </div>

                          {/* Details */}
                          <div className="mb-4">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Penjelasan Pelapor</p>
                            <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-150 dark:border-white/5 whitespace-pre-wrap">
                              {report.details}
                            </p>
                          </div>

                          {/* Action Moderation */}
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            {isPending ? (
                              <div className="space-y-3">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Catatan Moderasi Tindakan</p>
                                <textarea
                                  placeholder="Tulis alasan takedown / pengabaian laporan di sini..."
                                  value={reportNotes[report.id] || ""}
                                  onChange={(e) => setReportNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                                  className="w-full h-20 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-400 placeholder:font-bold"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleModerateReport(report.id, "IGNORED", reportNotes[report.id] || "")}
                                    className="flex-1 py-2.5 bg-slate-500/10 hover:bg-slate-650 text-slate-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-500/20 active:scale-[0.98]"
                                  >
                                    Abaikan Laporan
                                  </button>
                                  <button
                                    onClick={() => handleTakedownFromReport(report.id, reportNotes[report.id] || "")}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-750 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                                  >
                                    Takedown Aset
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 dark:bg-black/10 p-3 rounded-xl border border-slate-150 dark:border-white/5 text-[11px]">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Catatan Peninjauan Moderator</p>
                                  <span className="text-[9px] font-bold text-slate-400 italic">
                                    {new Date(report.updatedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-zinc-400 font-semibold leading-relaxed">
                                  {report.adminNotes || "Tindakan diselesaikan tanpa catatan tambahan."}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "pastes" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              key="pastes-audit"
              className="space-y-8"
            >
              {loadingPastes ? (
                <div className="min-h-[300px] w-full flex flex-col items-center justify-center bg-white dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">{t.loading}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
                  
                  {/* Pastebin Card */}
                  <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-5 flex flex-col backdrop-blur-xl">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 text-sm font-bold shadow-inner">
                        📋
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Audit Pastebin Snippets</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Snippets: {adminPastes.length}</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-x-auto custom-scrollbar no-scrollbar max-h-[500px]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-black/30 border-b border-slate-250 dark:border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <tr>
                            <th className="px-3 py-2.5">Judul & Detail</th>
                            <th className="px-2 py-2.5">Pembuat</th>
                            <th className="px-2 py-2.5">Status</th>
                            <th className="px-3 py-2.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                          {adminPastes.map((p) => {
                            const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
                            const isBurn = p.burnAfterRead;
                            const isDel = p.isDeleted;
                            return (
                              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-3 py-3">
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-800 dark:text-white truncate max-w-[130px]">{p.title || "Untitled"}</div>
                                    <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                      <span className="capitalize bg-slate-100 dark:bg-white/5 px-1 py-0.2 rounded font-bold text-indigo-500">{p.language}</span>
                                      <span>•</span>
                                      <span>{p.views} views</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-slate-500 font-bold text-[9px] sm:text-[10px]">
                                  {p.user?.name || "Guest User"}
                                </td>
                                <td className="px-2 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    isDel ? 'bg-red-500/10 text-red-500' :
                                    isExpired ? 'bg-amber-500/10 text-amber-500' :
                                    isBurn ? 'bg-fuchsia-500/10 text-fuchsia-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
                                  }`}>
                                    {isDel ? 'Deleted / Burned' : isExpired ? 'Expired' : isBurn ? 'Once-View ⚡' : 'Active'}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <button
                                    onClick={() => { setSelectedPasteContent(p.content); setSelectedPasteTitle(p.title || "Untitled Paste"); }}
                                    className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                  >
                                    Tinjau Isi
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {adminPastes.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                                Belum Ada Pastebin Snippets
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Realtime Room Card */}
                  <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-5 flex flex-col backdrop-blur-xl">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm font-bold shadow-inner">
                        💬
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Audit Realtime Rooms</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Rooms: {adminRooms.length}</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-x-auto custom-scrollbar no-scrollbar max-h-[500px]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-black/30 border-b border-slate-250 dark:border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <tr>
                            <th className="px-3 py-2.5">Nama & Detail</th>
                            <th className="px-2 py-2.5">Pembuat</th>
                            <th className="px-2 py-2.5">Status</th>
                            <th className="px-3 py-2.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                          {adminRooms.map((r) => {
                            const isExpired = r.expiresAt && new Date(r.expiresAt) < new Date();
                            const isDel = r.isDeleted;
                            const messagesCount = r.messages?.length || 0;
                            return (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-3 py-3">
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-800 dark:text-white truncate max-w-[130px]">{r.name}</div>
                                    <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                      <span>{messagesCount} chat logs</span>
                                      <span>•</span>
                                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-slate-500 font-bold text-[9px] sm:text-[10px]">
                                  {r.user?.name || "Guest (Tamu)"}
                                </td>
                                <td className="px-2 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    isDel ? 'bg-red-500/10 text-red-500' :
                                    isExpired ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                  }`}>
                                    {isDel ? 'Deleted / Expired' : isExpired ? 'Expired' : 'Active'}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <button
                                    onClick={() => { setSelectedRoomMessages(r.messages || []); setSelectedRoomName(r.name); }}
                                    className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-650 text-indigo-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                  >
                                    Buka Obrolan
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {adminRooms.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                                Belum Ada Realtime Rooms
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {activeTab === "dns" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              key="dns"
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Cloudflare Domains Card */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm p-6 backdrop-blur-xl space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-650 text-sm font-bold shadow-inner">
                      <FontAwesomeIcon icon={faGlobe} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Cloudflare Custom Domains</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kelola domain utama untuk pemetaan Custom DNS</p>
                    </div>
                  </div>

                  {/* Add Domain Form */}
                  <form onSubmit={handleAddDomain} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Nama Domain</label>
                      <input 
                        type="text" 
                        placeholder="e.g. nyoo.me" 
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Cloudflare Zone ID</label>
                      <input 
                        type="text" 
                        placeholder="Zone ID" 
                        value={newCfZoneId}
                        onChange={(e) => setNewCfZoneId(e.target.value)}
                        className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1 flex flex-col justify-between">
                      <label className="text-[9px] font-black uppercase text-slate-400">API Token</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 flex items-center">
                          <input 
                            type={showCfToken ? "text" : "password"} 
                            placeholder="Token" 
                            value={newCfToken}
                            onChange={(e) => setNewCfToken(e.target.value)}
                            className="w-full h-10 pl-3 pr-16 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                          />
                          <div className="absolute right-2 flex items-center gap-1">
                            {isPasteSupported && !newCfToken && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const text = await navigator.clipboard.readText();
                                    setNewCfToken(text);
                                  } catch (err) {
                                    toast.error("Gagal membaca clipboard");
                                  }
                                }}
                                className="text-slate-400 hover:text-violet-500 p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
                                title="Paste"
                              >
                                <FontAwesomeIcon icon={faPaste} className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowCfToken(!showCfToken)}
                              className="text-slate-400 hover:text-violet-500 p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
                              title={showCfToken ? "Hide Token" : "Show Token"}
                            >
                              <FontAwesomeIcon icon={showCfToken ? faEyeSlash : faEye} className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={addingDomain}
                          className="px-4 bg-violet-600 hover:bg-violet-750 text-white rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-50"
                        >
                          {addingDomain ? "..." : "Add"}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Domains List */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold">
                      <thead className="bg-slate-50 dark:bg-black/30 border-b border-slate-200 dark:border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-2.5">Domain</th>
                          <th className="px-3 py-2.5">Zone ID</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-zinc-350">
                        {adminDomains.map((dom) => (
                          <tr key={dom.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                            <td className="px-4 py-3 text-slate-950 dark:text-white uppercase tracking-wider">{dom.domain}</td>
                            <td className="px-3 py-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate">{dom.cloudflareZoneId}</td>
                            <td className="px-3 py-3">
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={dom.isActive}
                                  onChange={() => handleToggleDomainStatus(dom.id, dom.isActive)}
                                  className="sr-only peer"
                                />
                                <div className="w-7 h-4 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
                              </label>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteDomain(dom.id)}
                                className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 dark:border-white/5 hover:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all ml-auto"
                              >
                                <FontAwesomeIcon icon={faTrashAlt} className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {adminDomains.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400 uppercase font-bold tracking-widest text-[9px]">
                              Belum Ada Custom Domain Terdaftar
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fraud Prevention / Blocked Phrases Card */}
                <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm p-6 backdrop-blur-xl space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-sm font-bold shadow-inner">
                      🛡️
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Fraud Prevention</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Blokir subdomain phishing / spam</p>
                    </div>
                  </div>

                  {/* Add blocked phrase form */}
                  <form onSubmit={handleAddBlockedPhrase} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. paypal, admin" 
                      value={newBlockedPhrase}
                      onChange={(e) => setNewBlockedPhrase(e.target.value)}
                      className="flex-1 h-10 px-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addingPhrase || !newBlockedPhrase.trim()}
                      className="px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                    >
                      Block
                    </button>
                  </form>

                  {/* Blocked phrases grid */}
                  <div className="flex flex-wrap gap-2 pt-2 max-h-[180px] overflow-y-auto pr-1">
                    {adminBlockedPrefixes.map((phr) => (
                      <span 
                        key={phr.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase shadow-sm"
                      >
                        <span>{phr.phrase}</span>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteBlockedPhrase(phr.id)}
                          className="hover:text-red-750 transition-colors font-mono font-bold ml-0.5"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {adminBlockedPrefixes.length === 0 && (
                      <span className="text-slate-400 font-bold uppercase text-[8px] tracking-widest py-4 block text-center w-full">
                        Belum Ada Subdomain yang Diblokir
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Subdomains Monitoring Table */}
              <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm p-6 backdrop-blur-xl space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650 text-sm font-bold shadow-inner">
                    <FontAwesomeIcon icon={faServer} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">User Subdomains Monitor</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pantau semua subdomain yang dibuat oleh pengguna publik</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-bold">
                    <thead className="bg-slate-50 dark:bg-black/30 border-b border-slate-200 dark:border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-2.5">Subdomain</th>
                        <th className="px-3 py-2.5">Mapping / DNS</th>
                        <th className="px-3 py-2.5">Cloudflare Proxy</th>
                        <th className="px-3 py-2.5">Dibuat Oleh</th>
                        <th className="px-3 py-2.5">Tanggal</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-zinc-350">
                      {adminSubdomains.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-[11px]">
                          <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">
                            {sub.subdomain}.{sub.domain.domain}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold text-[9px]">{sub.dnsType}</span>
                              <span className="font-mono text-slate-400 max-w-[150px] truncate">{sub.dnsValue}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                              sub.proxied ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-100 dark:bg-white/5 text-slate-450'
                            }`}>
                              {sub.proxied ? 'Proxied' : 'DNS Only'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-0.5">
                              <span className="block text-slate-950 dark:text-white font-bold">{sub.user.name || 'User'}</span>
                              <span className="block text-slate-400 font-bold text-[9px]">{sub.user.email}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-[10px] text-slate-400">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              sub.isBanned ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {sub.isBanned ? 'Suspended / Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              {sub.isBanned ? (
                                <button
                                  onClick={() => handleRestoreSubdomain(sub.id)}
                                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-450 hover:text-emerald-500 rounded-lg border border-slate-200 dark:border-white/5 hover:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                                  title="Pulihkan Subdomain"
                                >
                                  <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setBanSubdomainTarget(sub)}
                                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-450 hover:text-red-500 rounded-lg border border-slate-200 dark:border-white/5 hover:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                  title="Ban/Hapus Subdomain"
                                >
                                  <FontAwesomeIcon icon={faTrashAlt} className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {adminSubdomains.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 uppercase font-bold tracking-widest text-[9px]">
                            Belum Ada Subdomain yang Dibuat Pengguna
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "developers" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              key="developers"
              className="space-y-6"
            >
              <div className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm p-6 backdrop-blur-xl space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-650 text-sm font-bold shadow-inner">
                    <FontAwesomeIcon icon={faCode} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">
                      {language === 'en' ? "Developer Account Appeals" : "Persetujuan Akun Developer"}
                    </h3>
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                      {language === 'en' ? "Moderation dashboard to approve or reject API developer applications" : "Pusat kendali moderasi untuk menyetujui atau menolak permohonan API developer"}
                    </p>
                  </div>
                </div>

                {loadingDevAppeals ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin mb-4" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? "Syncing Developer Records..." : "Memuat Data Developer..."}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold font-sans">
                      <thead className="bg-slate-50 dark:bg-black/20 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-3.5 rounded-l-lg">{language === 'en' ? "Developer Info" : "Pengaju / User"}</th>
                          <th className="px-6 py-3.5">{language === 'en' ? "Purpose of Usage" : "Tujuan Penggunaan"}</th>
                          <th className="px-6 py-3.5">{language === 'en' ? "Project Proof / Document" : "Bukti / Dokumen Pendukung"}</th>
                          <th className="px-6 py-3.5">{language === 'en' ? "Status" : "Status"}</th>
                          <th className="px-6 py-3.5">{language === 'en' ? "API hits limit (Daily)" : "Jatah Kuota Harian"}</th>
                          <th className="px-6 py-3.5 text-right rounded-r-lg">{language === 'en' ? "Actions" : "Aksi"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-zinc-300 font-medium">
                        {devAppeals.map((appeal) => {
                          const currentLimit = appealLimitVal[appeal.id] || appeal.apiHitsLimit || 100;
                          return (
                            <tr key={appeal.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all">
                              <td className="px-6 py-4">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-extrabold text-slate-950 dark:text-white block">
                                    {appeal.user.name || 'Developer'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {appeal.user.email}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 max-w-[250px]">
                                <p className="text-xs font-semibold text-slate-655 dark:text-zinc-350 leading-relaxed whitespace-normal break-words">
                                  {appeal.purpose}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                {appeal.projectProof ? (
                                  <a
                                    href={appeal.projectProof}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all text-[10px] font-bold shadow-sm"
                                  >
                                    <span>🌐 Open Document</span>
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">No document submitted</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                  appeal.status === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : appeal.status === 'REJECTED'
                                      ? 'bg-red-500/10 text-red-550'
                                      : 'bg-amber-500/10 text-amber-500 animate-pulse'
                                }`}>
                                  {appeal.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {appeal.status === 'PENDING' ? (
                                  <div className="flex flex-col gap-1 items-start min-w-[120px]">
                                    <span className="text-[10px] font-extrabold text-indigo-500">
                                      {currentLimit} hits/day
                                    </span>
                                    <input
                                      type="range"
                                      min={50}
                                      max={5000}
                                      step={50}
                                      value={currentLimit}
                                      onChange={(e) => setAppealLimitVal(prev => ({
                                        ...prev,
                                        [appeal.id]: parseInt(e.target.value, 10)
                                      }))}
                                      className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                                    />
                                  </div>
                                ) : (
                                  <span className="font-mono text-xs text-slate-500 dark:text-zinc-400 font-bold">
                                    {appeal.apiHitsLimit} hits/day
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {appeal.status === 'PENDING' ? (
                                  <div className="flex items-center justify-end gap-2.5">
                                    <div className="flex flex-col gap-1.5 items-end">
                                      <input
                                        type="text"
                                        placeholder={language === 'en' ? "Reason if rejecting..." : "Alasan jika menolak..."}
                                        value={appealRejectNotes[appeal.id] || ""}
                                        onChange={(e) => setAppealRejectNotes(prev => ({
                                          ...prev,
                                          [appeal.id]: e.target.value
                                        }))}
                                        className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-[10px] rounded-lg w-[120px] font-medium outline-none focus:border-red-500/50"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleResolveDevAppeal(appeal.id, "REJECTED")}
                                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all"
                                        >
                                          {language === 'en' ? "Reject" : "Tolak"}
                                        </button>
                                        <button
                                          onClick={() => handleResolveDevAppeal(appeal.id, "APPROVED")}
                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all"
                                        >
                                          {language === 'en' ? "Approve" : "Setujui"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : appeal.status === 'APPROVED' ? (
                                  <div className="space-y-1">
                                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active API Key</span>
                                    <span className="block font-mono text-[9px] text-slate-500 bg-slate-50 dark:bg-black/25 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800 font-bold select-all">
                                      {appeal.apiKey.substring(0, 14)}...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="max-w-[150px] text-right ml-auto">
                                    <span className="block text-[8px] font-black text-red-400 dark:text-red-500 uppercase tracking-widest">Rejection Reason</span>
                                    <span className="block text-[9px] text-red-500/80 font-bold italic line-clamp-2 leading-tight">
                                      "{appeal.rejectionReason}"
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {devAppeals.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400 uppercase font-bold tracking-widest text-[9px]">
                              {language === 'en' ? "No developer applications found" : "Belum ada permohonan developer masuk"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "pricing" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              key="pricing"
            >
              <PricingPlansAdminPanel onInspectUser={(userId) => {
                const found = users.find(u => u.id === userId);
                if (found) setSelectedUser(found);
                updateQueryParams({ userId });
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Inspector Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/25">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-md">
                    {selectedUser.image ? (
                      <img src={selectedUser.image} alt={selectedUser.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.name?.[0] || selectedUser.email[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase">{selectedUser.name || 'User'}</h3>
                    <p className="text-xs text-slate-400 font-bold">{selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-xl transition-all"
                >
                  {t.actions.close}
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {modalSelectedLink ? (
                  /* Analytics View in Modal */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => { setModalSelectedLink(null); setModalAnalyticsData(null); }}
                        className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 transition-all"
                      >
                        {t.actions.back}
                      </button>
                      <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-xl">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase">{modalSelectedLink.type}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-4 sm:p-6 rounded-2xl text-white flex justify-between items-center">
                      <div className="space-y-0.5">
                        <h4 className="text-md sm:text-lg font-bold truncate uppercase">{modalSelectedLink.title}</h4>
                        <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">{modalSelectedLink.type === 'biolink' ? `nyoo.me/${modalSelectedLink.profile?.username}` : `nyoo.me/${modalSelectedLink.shortUrl}`}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl sm:text-4xl font-bold tracking-tighter lining-nums block">{modalLoadingAnalytics ? '...' : (modalAnalyticsData?.totalViews ?? modalSelectedLink.views ?? 0)}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Total {t.clicks}</span>
                      </div>
                    </div>

                    {/* Metadata & Fraud Prevention Console inside Modal */}
                    <div className="bg-slate-50 dark:bg-black/10 p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-4 text-xs font-bold">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-250/50 dark:border-white/5">
                        <span className="text-lg">🛡️</span>
                        <div>
                          <h5 className="text-[11px] font-bold uppercase tracking-tight text-slate-800 dark:text-white">{t.metaSecurityTitle}</h5>
                          <p className="text-[9px] text-slate-400 font-medium">{t.metaSecurityDescModal}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">{t.destinationUrl}</p>
                          <div className="flex items-center gap-2 bg-white dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                            {modalSelectedLink.url ? (
                              <>
                                {getFavicon(modalSelectedLink.url) && (
                                  <img 
                                    src={getFavicon(modalSelectedLink.url) || ''} 
                                    alt="Favicon" 
                                    className="w-4 h-4 rounded object-contain bg-white p-0.5" 
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                )}
                                <a 
                                  href={modalSelectedLink.url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline break-all font-mono text-[11px] line-clamp-2"
                                >
                                  {modalSelectedLink.url}
                                </a>
                              </>
                            ) : (
                              <span className="text-slate-400 font-mono">
                                {modalSelectedLink.biolinkType === 'header' ? t.headerSection : t.noUrl}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">{t.shortLink}</p>
                          <div className="bg-white dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                            <a 
                              href={modalSelectedLink.type === 'biolink' ? `http://localhost:3000/${modalSelectedLink.profile?.username}` : `http://localhost:3000/${modalSelectedLink.shortUrl}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="text-slate-700 dark:text-zinc-300 hover:underline font-mono text-[11px]"
                            >
                              {modalSelectedLink.type === 'biolink' ? `nyoo.me/${modalSelectedLink.profile?.username}` : `nyoo.me/${modalSelectedLink.shortUrl}`}
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">{t.assetType}</p>
                          <div className="bg-white dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-700 dark:text-zinc-350 capitalize">
                            {modalSelectedLink.type === 'shorturl' 
                              ? '🔗 Short URL' 
                              : modalSelectedLink.type === 'biolink' 
                                ? (modalSelectedLink.biolinkType === 'header' ? '🌳 Biolink Header' : '🌳 Biolink Link') 
                                : '📱 QR Code'}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">{t.originDomain}</p>
                          <div className="bg-white dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-700 dark:text-zinc-350 font-mono truncate">
                            {modalSelectedLink.url ? new URL(modalSelectedLink.url).hostname : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {modalLoadingAnalytics ? (
                      <div className="py-12 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">{t.loadingAnalytics}</p>
                      </div>
                    ) : modalAnalyticsData ? (
                      <div className="space-y-6">
                        {/* Traffic Chart */}
                        <div className="bg-slate-50 dark:bg-black/10 p-3.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                          <h5 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3">{t.visitTrafficChart}</h5>
                          <div className="h-[120px] sm:h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={modalAnalyticsData.daily}>
                                <CartesianGrid strokeDasharray="10 10" stroke="rgba(0,0,0,0.03)" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} fontWeight="700" tickFormatter={(v) => v.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={8} fontWeight="700" axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} contentStyle={{ border: 'none', borderRadius: '1rem', fontWeight: '800', fontSize: '9px' }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={15} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Device, OS, Countries Grids */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { title: t.device, data: modalAnalyticsData.devices, type: 'pie' },
                            { title: t.system, data: modalAnalyticsData.os, type: 'bar' },
                            { title: t.location, data: modalAnalyticsData.countries, type: 'bar' }
                          ].map((block, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-black/10 p-3.5 rounded-xl border border-slate-200/50 dark:border-white/5 flex flex-col items-center">
                              <h5 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3 border-b border-slate-200 dark:border-white/5 w-full text-center pb-1">{block.title}</h5>
                              <div className="h-[90px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  {block.type === 'pie' ? (
                                    <PieChart>
                                      <Pie data={block.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={36} innerRadius={22} paddingAngle={4}>
                                        {block.data.map((_, index: number) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                      </Pie>
                                      <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', fontSize: '9px' }} />
                                    </PieChart>
                                  ) : (
                                    <BarChart data={block.data} layout="vertical">
                                      <XAxis type="number" hide />
                                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={8} fontWeight="700" width={45} axisLine={false} tickLine={false} />
                                      <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} contentStyle={{ border: 'none', borderRadius: '0.5rem', fontSize: '9px' }} />
                                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={8} />
                                    </BarChart>
                                  )}
                                </ResponsiveContainer>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Peta Kunjungan */}
                        <div className="bg-slate-50 dark:bg-black/10 p-3.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                          <h5 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3">{t.mapTitle}</h5>
                          <div className="h-[160px] w-full rounded-xl overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-inner">
                            <AnalyticsMap locations={modalAnalyticsData.locations || []} type="overview" />
                          </div>
                        </div>

                        {/* Log Pengunjung */}
                        <div className="bg-slate-50 dark:bg-black/10 p-3.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                          <h5 className="text-[8px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-3">{t.visitorLog}</h5>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 dark:bg-black/30 border-b border-slate-200 dark:border-white/5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                <tr>
                                  <th className="px-3 py-1.5">{t.ipAddress}</th>
                                  <th className="px-3 py-1.5">{t.location}</th>
                                  <th className="px-3 py-1.5 text-right">{t.time}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/50 dark:divide-white/5 font-sans">
                                {(modalAnalyticsData.visitors || []).slice(0, 5).map((v, i) => (
                                  <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-3 py-1.5 font-mono font-bold text-indigo-500">{v.ip}</td>
                                    <td className="px-3 py-1.5 text-slate-600 dark:text-zinc-350">{v.city || 'Unknown'}, {v.country || 'Unknown'}</td>
                                    <td className="px-3 py-1.5 text-right text-slate-400">
                                      {new Date(v.date).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                  </tr>
                                ))}
                                {(modalAnalyticsData.visitors || []).length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="px-3 py-4 text-center text-slate-400 uppercase font-bold text-[8px] tracking-widest">
                                      {t.noVisitorData}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-2xl">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{t.analyticsLoadError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* User Info & Assets List View */
                  <div className="space-y-6">
                    {/* User Metadata Header Card */}
                    <div className="bg-slate-50 dark:bg-black/10 p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.accountInfo}</p>
                        <div className="text-xs font-bold text-slate-600 dark:text-zinc-400">{t.registeredDate(new Date(selectedUser.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }))}</div>
                        <div className="text-xs font-bold flex items-center gap-1.5 mt-1 text-slate-600 dark:text-zinc-400">
                          <span>{t.accessLabel}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{selectedUser.role}</span>
                        </div>
                      </div>

                      <div className="space-y-1 sm:border-l sm:border-slate-200 dark:sm:border-white/5 sm:pl-4">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.changeAccess}</p>
                        <button 
                          onClick={() => handleToggleRole(selectedUser)}
                          disabled={actionLoading === selectedUser.id || (session?.user as any).id === selectedUser.id}
                          className="mt-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          {t.changeRole}
                        </button>
                      </div>

                      <div className="space-y-1 sm:border-l sm:border-slate-200 dark:sm:border-white/5 sm:pl-4">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.accountModeration}</p>
                        <button 
                          onClick={() => {
                            if (confirm(t.confirm.deleteUserMsg)) {
                              handleDeleteUser(selectedUser.id);
                              handleCloseModal();
                            }
                          }}
                          disabled={actionLoading === selectedUser.id || selectedUser.role === 'ADMIN'}
                          className="mt-1 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          {t.deleteUser}
                        </button>
                      </div>
                    </div>

                    {/* Subscription & Resource Limits overrides section */}
                    <div className="bg-slate-50 dark:bg-black/10 p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-white/5">
                        <span className="text-sm">⚡</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase">{language === "en" ? "Subscription & Manual Limits" : "Langganan & Batas Manual"}</h4>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{language === "en" ? "Customize limits & subscription for this user" : "Kustomisasi limit & paket untuk user ini"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Package Selection */}
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{language === "en" ? "Active Package" : "Paket Aktif"}</label>
                          <select
                            value={userSubFormData.planId || ""}
                            onChange={(e) => setUserSubFormData(prev => ({ ...prev, planId: e.target.value || null }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">{language === "en" ? "Free Plan (No Plan)" : "Free Plan (Tanpa Paket)"}</option>
                            {availablePlans.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.isPayAsYouGo ? (language === "en" ? "Forever" : "Selamanya") : `${p.days} ${language === "en" ? "Days" : "Hari"}`} - Rp{p.price.toLocaleString("id-ID")})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Custom Duration (Days) */}
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                            {language === "en" ? "Duration (Days from Now)" : "Masa Aktif (Hari dari Sekarang)"}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 30"
                            value={userSubFormData.customDays === null ? "" : userSubFormData.customDays}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUserSubFormData(prev => ({ ...prev, customDays: val === "" ? null : parseInt(val, 10) }));
                            }}
                            className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Manual Limits Overrides */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                            {language === "en" ? "Manual Limits Overrides (Leave blank to use Plan default)" : "Override Batas Manual (Biarkan kosong untuk menggunakan default Paket)"}
                          </label>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!selectedUser) return;
                              if (!confirm(language === "en" ? "Are you sure you want to reset this user's daily API hits?" : "Apakah Anda yakin ingin menyetel ulang hit API harian user ini?")) return;
                              try {
                                // @ts-expect-error adminId check
                                const adminId = session?.user?.id;
                                const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ adminId, resetApiHits: true })
                                });
                                if (res.ok) {
                                  toast.success(language === "en" ? "Daily API hits successfully reset!" : "Hit API harian berhasil disetel ulang!");
                                } else {
                                  toast.error("Failed to reset hits.");
                                }
                              } catch (e) {
                                toast.error("Error resetting hits.");
                              }
                            }}
                            className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-650 text-indigo-600 dark:text-indigo-400 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all select-none shrink-0"
                          >
                            🔄 {language === "en" ? "Reset Daily Hits" : "Reset Hit Harian"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {/* Combined Assets Limit */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">🔗 Assets Limit</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={selectedUser.role === 'ADMIN' ? "Unlimited" : "Default"}
                              value={userSubFormData.customMaxAssets === null ? "" : userSubFormData.customMaxAssets}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, customMaxAssets: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Pastes Limit */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">📝 Pastes Limit</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={selectedUser.role === 'ADMIN' ? "Unlimited" : "Default"}
                              value={userSubFormData.customMaxPastes === null ? "" : userSubFormData.customMaxPastes}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, customMaxPastes: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Rooms Limit */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">💬 Rooms Limit</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={selectedUser.role === 'ADMIN' ? "Unlimited" : "Default"}
                              value={userSubFormData.customMaxRooms === null ? "" : userSubFormData.customMaxRooms}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, customMaxRooms: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* DNS/Domains Limit */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">🌐 DNS Limit</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={selectedUser.role === 'ADMIN' ? "Unlimited" : "Default"}
                              value={userSubFormData.customMaxDomains === null ? "" : userSubFormData.customMaxDomains}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, customMaxDomains: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* API Calls Limit */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">🔑 API Limit</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={selectedUser.role === 'ADMIN' ? "Unlimited" : "Default"}
                              value={userSubFormData.customMaxApiCalls === null ? "" : userSubFormData.customMaxApiCalls}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, customMaxApiCalls: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Storage Capacity Limit (MB) */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">💾 Storage (MB)</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={selectedUser.role === 'ADMIN' ? "Unlimited" : "Default"}
                              value={userSubFormData.customMaxStorage === null ? "" : userSubFormData.customMaxStorage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, customMaxStorage: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Max File Size Limit (MB) */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">📁 File Limit (MB)</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={selectedUser.role === 'ADMIN' ? "Unlimited" : "Default"}
                              value={userSubFormData.customMaxFileSize === null ? "" : userSubFormData.customMaxFileSize}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, customMaxFileSize: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pay-As-You-Go Balance */}
                      <div className="space-y-2.5 border-t border-slate-100 dark:border-white/5 pt-4">
                        <label className="block text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                          {language === "en" ? "Pay-As-You-Go Quota Balance" : "Saldo Kuota Pay-As-You-Go"}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">🔗 Links</span>
                            <input
                              type="number"
                              min="0"
                              value={userSubFormData.payAsYouGoBalance === null ? "" : userSubFormData.payAsYouGoBalance}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, payAsYouGoBalance: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">📝 Pastes</span>
                            <input
                              type="number"
                              min="0"
                              value={userSubFormData.payAsYouGoPastesBalance === null ? "" : userSubFormData.payAsYouGoPastesBalance}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, payAsYouGoPastesBalance: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">💬 Collab Rooms</span>
                            <input
                              type="number"
                              min="0"
                              value={userSubFormData.payAsYouGoRoomsBalance === null ? "" : userSubFormData.payAsYouGoRoomsBalance}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, payAsYouGoRoomsBalance: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">🌐 DNS / Domains</span>
                            <input
                              type="number"
                              min="0"
                              value={userSubFormData.payAsYouGoDomainsBalance === null ? "" : userSubFormData.payAsYouGoDomainsBalance}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserSubFormData(prev => ({ ...prev, payAsYouGoDomainsBalance: val === "" ? null : parseInt(val, 10) }));
                              }}
                              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2.5 pt-2">
                        {selectedUser.planId && (
                          <button
                            type="button"
                            onClick={handleRevokeSubscription}
                            disabled={userSubmitting}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-500/20 transition-all"
                          >
                            {language === "en" ? "Revoke Package ✖" : "Revoke Paket ✖"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveUserSubscription}
                          disabled={userSubmitting}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                        >
                          {userSubmitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
                          {language === "en" ? "Save Settings" : "Simpan Pengaturan"}
                        </button>
                      </div>
                    </div>

                    {/* Asset Navigation & Search */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-black/25 rounded-2xl border border-slate-200/50 dark:border-white/5">
                        <button
                          onClick={() => setUserSubTab("links")}
                          className={`px-4 py-2 text-[10px] font-bold rounded-xl transition-all ${
                            userSubTab === "links" 
                            ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm" 
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {t.linksAndBiolink(links.filter(l => ((l.user?.email === selectedUser.email) || (l.profile?.user?.email === selectedUser.email)) && l.type !== 'qrcode').length)}
                        </button>
                        <button
                          onClick={() => setUserSubTab("qrs")}
                          className={`px-4 py-2 text-[10px] font-bold rounded-xl transition-all ${
                            userSubTab === "qrs" 
                            ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm" 
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {t.qrcodesLabel(links.filter(l => ((l.user?.email === selectedUser.email) || (l.profile?.user?.email === selectedUser.email)) && l.type === 'qrcode').length)}
                        </button>
                      </div>
                    </div>

                    {/* Assets List */}
                    <div className="bg-slate-50 dark:bg-black/10 rounded-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-black/30 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                            <tr>
                              <th className="px-3 py-2.5 sm:px-4">{t.asset}</th>
                              <th className="px-2 py-2.5">{t.clicks}</th>
                              <th className="px-2 py-2.5">{t.statusLabel}</th>
                              <th className="px-3 py-2.5 text-right">{t.moderationAndAnalytics}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {links
                              .filter(l => {
                                const isUserAsset = (l.user?.email === selectedUser.email) || (l.profile?.user?.email === selectedUser.email);
                                if (userSubTab === "links") {
                                  return isUserAsset && l.type !== 'qrcode';
                                } else {
                                  return isUserAsset && l.type === 'qrcode';
                                }
                              })
                              .map(l => {
                                const isActive = !!l.isActive;
                                return (
                                  <tr key={l.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-3 py-2 sm:px-4 sm:py-2.5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-black flex items-center justify-center text-sm">
                                          {l.type === 'shorturl' ? '🔗' : l.type === 'biolink' ? (l.biolinkType === 'header' ? '📁' : '🌳') : '📱'}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-bold truncate max-w-[150px] uppercase text-xs">{l.title || 'Untitled'}</div>
                                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                                            {l.biolinkType === 'header' ? '(Header Section)' : l.url}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-2 py-2 sm:py-2.5 font-bold text-indigo-500 text-xs">
                                      {l.views || 0}
                                    </td>
                                    <td className="px-2 py-2 sm:py-2.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                        isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                      }`}>
                                        {isActive ? t.status.active : t.status.takedown}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 sm:px-4 sm:py-2.5 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleViewModalAnalytics(l)}
                                          className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                                        >
                                          {t.actions.analyze}
                                        </button>
                                        <button
                                          onClick={() => handleTakedownInModal(l)}
                                          disabled={actionLoading === l.id}
                                          className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${
                                            isActive 
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-600 hover:text-white' 
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                                          }`}
                                        >
                                          {isActive ? t.actions.takedown : t.actions.activate}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            {links.filter(l => {
                              const isUserAsset = (l.user?.email === selectedUser.email) || (l.profile?.user?.email === selectedUser.email);
                              if (userSubTab === "links") {
                                return isUserAsset && l.type !== 'qrcode';
                              } else {
                                return isUserAsset && l.type === 'qrcode';
                              }
                            }).length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                                  {t.noAssetsRegistered}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity Detail Inspector Modal */}
      <AnimatePresence>
        {selectedActivity && (() => {
          const matchingLink = links.find(l => 
            l.id === selectedActivity.urlId || 
            l.id === selectedActivity.biolinkLinkId || 
            l.id === selectedActivity.qrCodeId
          );

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 relative text-slate-900 dark:text-white"
              >
                {/* Modal Header */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-lg">
                    {selectedActivity.qrCodeId ? '📱' : (selectedActivity.biolinkLinkId ? '🌳' : '🔗')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight uppercase">{t.activityDetailTitle}</h3>
                    <p className="text-[9px] text-slate-400 font-mono">ID: #{selectedActivity.id.slice(0, 8)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedActivity(null)}
                    className="ml-auto w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content Details Grid */}
                <div className="space-y-3 text-xs font-bold">
                  {/* Target Asset Detail */}
                  <div className="bg-slate-50 dark:bg-black/25 p-3 rounded-xl border border-slate-150 dark:border-white/5 space-y-1">
                    <p className="text-[8px] text-slate-400 uppercase tracking-widest">{t.visitedAsset}</p>
                    <div className="text-slate-800 dark:text-white text-sm font-bold uppercase truncate">
                      {selectedActivity.qrCode?.name || selectedActivity.userUrl?.title || selectedActivity.biolinkLink?.title || t.systemDirect}
                    </div>
                    {selectedActivity.userUrl?.shortUrl && (
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        nyoo.me/{selectedActivity.userUrl.shortUrl}
                      </div>
                    )}
                  </div>

                  {/* Visitor details grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-black/25 p-3 rounded-xl border border-slate-150 dark:border-white/5">
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">{t.ipAddress}</p>
                      <p className="font-mono text-slate-800 dark:text-zinc-350">{selectedActivity.ip || "Unknown"}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-black/25 p-3 rounded-xl border border-slate-150 dark:border-white/5">
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">{t.countryAndCity}</p>
                      <p className="truncate text-slate-800 dark:text-zinc-350">
                        {selectedActivity.city || "Unknown"}, {selectedActivity.country || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-black/25 p-3 rounded-xl border border-slate-150 dark:border-white/5">
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">{t.systemAndBrowser}</p>
                      <p className="truncate text-slate-800 dark:text-zinc-350">
                        {selectedActivity.browser || "Unknown"} ({selectedActivity.os || "Unknown"})
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-black/25 p-3 rounded-xl border border-slate-150 dark:border-white/5">
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">{t.device}</p>
                      <p className="capitalize text-slate-800 dark:text-zinc-350">{selectedActivity.device || "Unknown"}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-black/25 p-3 rounded-xl border border-slate-150 dark:border-white/5">
                    <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">{t.activityModal.referer}</p>
                    <p className="font-mono truncate text-slate-600 dark:text-zinc-400 text-[10px]">
                      {selectedActivity.referer || t.activityModal.direct}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-black/25 p-3 rounded-xl border border-slate-150 dark:border-white/5">
                    <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">{t.activityModal.time}</p>
                    <p className="text-slate-800 dark:text-zinc-350">
                      {new Date(selectedActivity.createdAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                {/* Modal Footer / Navigation Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2.5">
                  <button 
                    onClick={() => setSelectedActivity(null)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-350 transition-all"
                  >
                    {t.actions.close}
                  </button>
                  {matchingLink ? (
                    <button 
                      onClick={() => {
                        handleViewAnalytics(matchingLink);
                        setSelectedActivity(null);
                      }}
                      className="flex-grow flex-1 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      {t.actions.analyticsAsset}
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="flex-1 py-2 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-not-allowed opacity-50"
                    >
                      {t.actions.assetNotAvail}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Inspect Paste Content Modal */}
      <AnimatePresence>
        {selectedPasteContent !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800 mb-4 shrink-0">
                <span className="text-xl">📋</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Tinjau Snippet Teks / Kode</h3>
                  <h4 className="text-sm font-bold text-white truncate">{selectedPasteTitle}</h4>
                </div>
                <button 
                  onClick={() => { setSelectedPasteContent(null); setSelectedPasteTitle(null); }}
                  className="w-7 h-7 flex items-center justify-center bg-white/5 rounded-full text-slate-400 hover:text-white text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre scrollbar-thin select-text">
                {selectedPasteContent}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end shrink-0">
                <button 
                  onClick={() => { setSelectedPasteContent(null); setSelectedPasteTitle(null); }}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Tutup Tinjauan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspect Room Chat logs Modal */}
      <AnimatePresence>
        {selectedRoomMessages !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5 mb-4 shrink-0">
                <span className="text-xl">💬</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Log Aktivitas Chat Obrolan</h3>
                  <h4 className="text-sm font-bold truncate uppercase">{selectedRoomName}</h4>
                </div>
                <button 
                  onClick={() => { setSelectedRoomMessages(null); setSelectedRoomName(null); }}
                  className="w-7 h-7 flex items-center justify-center bg-slate-150 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-655 text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[450px]">
                {selectedRoomMessages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat pesan obrolan.</p>
                  </div>
                ) : (
                  selectedRoomMessages.map((msg: any, index: number) => (
                    <div key={index} className="flex flex-col items-start bg-slate-50 dark:bg-black/10 p-3 rounded-2xl border border-slate-150 dark:border-white/5">
                      <div className="flex justify-between items-center w-full mb-1 border-b border-slate-200/50 dark:border-white/5 pb-1">
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">{msg.senderName}</span>
                        <span className="text-[8px] font-bold text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-zinc-350 break-all select-text">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end shrink-0">
                <button 
                  onClick={() => { setSelectedRoomMessages(null); setSelectedRoomName(null); }}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Tutup Log Obrolan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ban Subdomain Modal */}
      <AnimatePresence>
        {banSubdomainTarget && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col"
            >
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5 mb-4 shrink-0">
                <span className="text-xl">⚠️</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-red-500 font-bold">Tindakan Moderasi</h3>
                  <h4 className="text-sm font-bold truncate uppercase">Ban & Blokir Subdomain</h4>
                </div>
                <button 
                  onClick={() => { setBanSubdomainTarget(null); setBanReasonText(""); }}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-650 text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-500/10 text-red-500 p-3 rounded-2xl border border-red-500/20 text-xs font-bold leading-relaxed">
                  Tindakan ini akan menghapus DNS mapping di Cloudflare, mematikan subdomain secara instan, dan menuntut pengguna mengajukan banding untuk memulihkannya.
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Domain Target</span>
                  <div className="bg-slate-50 dark:bg-black/25 px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-white/5 font-mono text-xs text-indigo-500 font-bold">
                    {banSubdomainTarget.subdomain}.{banSubdomainTarget.domain.domain}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Alasan Penonaktifan</span>
                  <textarea
                    placeholder="Contoh: Terdeteksi melakukan aktivitas penipuan phishing / Melanggar ketentuan layanan platform..."
                    value={banReasonText}
                    onChange={(e) => setBanReasonText(e.target.value)}
                    className="w-full h-24 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium outline-none focus:ring-4 focus:ring-red-500/10 transition-all font-sans resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2.5 shrink-0 justify-end">
                <button 
                  onClick={() => { setBanSubdomainTarget(null); setBanReasonText(""); }}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-350 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleBanSubdomain}
                  disabled={banningSubdomain || !banReasonText.trim()}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  {banningSubdomain ? "Memproses..." : "Hapus & Ban"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] w-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Panel Admin / Syncing Admin Panel...</p>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
