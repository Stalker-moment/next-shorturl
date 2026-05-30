"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faGlobe, 
  faServer, 
  faCheckCircle, 
  faInfoCircle,
  faPlus,
  faTrash,
  faEdit,
  faSpinner,
  faExternalLinkAlt,
  faExchangeAlt,
  faSlidersH,
  faShieldAlt
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BaseDomain {
  id: string;
  domain: string;
}

interface UserSubdomain {
  id: string;
  subdomain: string;
  dnsType: string;
  dnsValue: string;
  proxied: boolean;
  isActive: boolean;
  createdAt: string;
  domain: {
    domain: string;
  };
  isBanned?: boolean;
  banReason?: string | null;
}

export default function CustomDnsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const isId = language === "id";

  const [domains, setDomains] = useState<BaseDomain[]>([]);
  const [subdomains, setSubdomains] = useState<UserSubdomain[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubdomain, setSelectedSubdomain] = useState<UserSubdomain | null>(null);

  // Form fields
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [subdomainPrefix, setSubdomainPrefix] = useState("");
  const [dnsType, setDnsType] = useState<"CNAME" | "A">("CNAME");
  const [dnsValue, setDnsValue] = useState("");
  const [proxied, setProxied] = useState(false);
  const [setupMode, setSetupMode] = useState<"template" | "advance">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [githubUsername, setGithubUsername] = useState("");

  // Async Validation States
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // General Loading for CRUD operations
  const [submitting, setSubmitting] = useState(false);

  // Subdomain Appeal States
  const [appealSubdomainTarget, setAppealSubdomainTarget] = useState<UserSubdomain | null>(null);
  const [appealReasonText, setAppealReasonText] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<UserSubdomain | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load domains and user's registered subdomains
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [domRes, subRes] = await Promise.all([
        fetch("/api/dns/domains"),
        fetch("/api/dns/subdomains")
      ]);

      if (domRes.ok) {
        const domJson = await domRes.json();
        setDomains(domJson.data || []);
        if (domJson.data && domJson.data.length > 0) {
          setSelectedDomainId(domJson.data[0].id);
        }
      }
      if (subRes.ok) {
        const subJson = await subRes.json();
        setSubdomains(subJson.data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Gagal memuat data DNS." : "Failed to load DNS data.");
    } finally {
      setLoading(false);
    }
  }, [isId]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status, loadData]);

  // Pre-fill subdomain registration modal from redirect parameters
  useEffect(() => {
    if (typeof window !== "undefined" && domains.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const shouldCreate = params.get("create") === "true";
      const prefilledSubdomain = params.get("subdomain");
      const prefilledDomainId = params.get("domainId");

      if (shouldCreate && prefilledSubdomain) {
        setSubdomainPrefix(prefilledSubdomain);
        if (prefilledDomainId && domains.some(d => d.id === prefilledDomainId)) {
          setSelectedDomainId(prefilledDomainId);
        }
        setShowCreateModal(true);
        // Clean URL parameters cleanly so it doesn't trigger on refresh
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [domains]);

  // Handle template selection
  useEffect(() => {
    if (setupMode === "template") {
      if (selectedTemplate === "vercel") {
        setDnsType("CNAME");
        setDnsValue("cname.vercel-dns.com");
        setProxied(false);
      } else if (selectedTemplate === "canva") {
        setDnsType("CNAME");
        setDnsValue("custom-dns.canva.com");
        setProxied(false);
      } else if (selectedTemplate === "github") {
        setDnsType("CNAME");
        if (githubUsername.trim()) {
          setDnsValue(`${githubUsername.trim().toLowerCase()}.github.io`);
        } else {
          setDnsValue("");
        }
        setProxied(false);
      } else if (selectedTemplate === "blogger") {
        setDnsType("CNAME");
        setDnsValue("ghs.google.com");
        setProxied(false);
      }
    }
  }, [selectedTemplate, setupMode, githubUsername]);

  // Auto-check availability with debounce when prefix or domain changes
  useEffect(() => {
    if (!showCreateModal) return;

    const prefix = subdomainPrefix.trim();
    if (!prefix || !selectedDomainId) {
      setIsAvailable(null);
      setAvailabilityMessage(null);
      setCheckingAvailability(false);
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityMessage(null);

    const delayDebounceFn = setTimeout(async () => {
      const sanitizedPrefix = prefix.toLowerCase().replace(/[^a-z0-9-]/g, "");
      try {
        const res = await fetch(`/api/dns/subdomains/check?domainId=${selectedDomainId}&subdomain=${sanitizedPrefix}`);
        const json = await res.json();

        // Ensure input hasn't changed while request was in-flight
        if (subdomainPrefix.trim() !== prefix) return;

        if (res.ok) {
          setIsAvailable(json.available);
          if (json.available) {
            setAvailabilityMessage(isId ? "🎉 Subdomain tersedia!" : "🎉 Subdomain is available!");
          } else {
            setAvailabilityMessage(json.reason || (isId ? "Subdomain sudah digunakan." : "Subdomain is already taken."));
          }
        } else {
          setIsAvailable(false);
          setAvailabilityMessage(json.error || (isId ? "Terjadi kesalahan pengecekan." : "Error checking availability."));
        }
      } catch (e) {
        console.error(e);
        setIsAvailable(false);
        setAvailabilityMessage(isId ? "Gagal mengecek ketersediaan." : "Failed to verify subdomain availability.");
      } finally {
        setCheckingAvailability(false);
      }
    }, 550); // 550ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [subdomainPrefix, selectedDomainId, showCreateModal, isId]);

  // Create subdomain handler
  const handleCreateSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId || !subdomainPrefix.trim() || !dnsValue.trim()) {
      toast.error(isId ? "Harap lengkapi semua kolom." : "Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/dns/subdomains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId: selectedDomainId,
          subdomain: subdomainPrefix.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
          dnsType,
          dnsValue: dnsValue.trim(),
          proxied
        })
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(isId ? "Subdomain berhasil dibuat!" : "Subdomain created successfully!");
        setShowCreateModal(false);
        // Clear fields
        setSubdomainPrefix("");
        setDnsValue("");
        setProxied(false);
        setSelectedTemplate("");
        setGithubUsername("");
        setIsAvailable(null);
        setAvailabilityMessage(null);
        loadData();
      } else {
        toast.error(json.error || (isId ? "Gagal membuat subdomain." : "Failed to create subdomain."));
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Koneksi bermasalah." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit subdomain handler
  const handleEditSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubdomain || !dnsValue.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/dns/subdomains/${selectedSubdomain.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dnsType,
          dnsValue: dnsValue.trim(),
          proxied
        })
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(isId ? "Subdomain berhasil diperbarui!" : "Subdomain updated successfully!");
        setShowEditModal(false);
        loadData();
      } else {
        toast.error(json.error || (isId ? "Gagal memperbarui subdomain." : "Failed to update subdomain."));
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Koneksi bermasalah." : "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete subdomain handler
  const handleDeleteSubdomain = async (id: string) => {
    try {
      const res = await fetch(`/api/dns/subdomains/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        toast.success(isId ? "Subdomain berhasil dihapus." : "Subdomain deleted successfully.");
        loadData();
      } else {
        toast.error(json.error || (isId ? "Gagal menghapus subdomain." : "Failed to delete subdomain."));
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Koneksi bermasalah." : "Network error.");
    }
  };

  const handleCreateAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealSubdomainTarget || !appealReasonText.trim() || !session?.user) return;

    setSubmittingAppeal(true);
    try {
      const res = await fetch("/api/user/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session.user as { id: string }).id,
          assetId: appealSubdomainTarget.id,
          assetType: "subdomain",
          reason: appealReasonText.trim()
        })
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(
          isId 
            ? "Banding berhasil diajukan! Admin akan meninjau pengajuan Anda." 
            : "Appeal submitted successfully! Admin will review your appeal."
        );
        setAppealSubdomainTarget(null);
        setAppealReasonText("");
      } else {
        toast.error(json.error || (isId ? "Gagal mengajukan banding." : "Failed to submit appeal."));
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Terjadi kesalahan jaringan." : "Network error.");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const openCreateModal = () => {
    setSubdomainPrefix("");
    setDnsValue("");
    setProxied(false);
    setSetupMode("template");
    setSelectedTemplate("");
    setGithubUsername("");
    setIsAvailable(null);
    setAvailabilityMessage(null);
    setShowCreateModal(true);
  };

  const openEditModal = (sub: UserSubdomain) => {
    setSelectedSubdomain(sub);
    setDnsType(sub.dnsType as "CNAME" | "A");
    setDnsValue(sub.dnsValue);
    setProxied(sub.proxied);
    setSetupMode("advance");
    setShowEditModal(true);
  };

  if (loading && subdomains.length === 0) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
          <span className="text-xs font-bold text-slate-400">{isId ? "Memuat pengaturan DNS..." : "Loading DNS control..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-8 relative font-sans text-slate-900 dark:text-white pb-20">
      
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest leading-none">
                Domain Control Center
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              nyoo<span className="text-violet-500">.custom-dns</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isId 
                ? "Petakan subdomain premium milik platform ke hosting/aplikasi eksternal Anda dengan integrasi Cloudflare otomatis."
                : "Map platform premium subdomains to your external hosting or application with automated Cloudflare integration."}
            </p>
          </div>

          <button
            onClick={openCreateModal}
            disabled={domains.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>{isId ? "Daftar Subdomain Baru" : "Register New Subdomain"}</span>
          </button>
        </div>

        {domains.length === 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
            <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 shrink-0" />
            <span>
              {isId 
                ? "Saat ini belum ada domain custom yang diaktifkan oleh Administrator. Hubungi admin untuk informasi lebih lanjut."
                : "Currently, no custom domains have been activated by the Administrator. Please contact admin for details."}
            </span>
          </div>
        )}

        {/* Requirements requirements card */}
        <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faServer} className="text-violet-500 w-4 h-4" />
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {isId ? "Langkah-Langkah Integrasi" : "Integration Process Requirements"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] font-bold text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
            <div className="bg-white/40 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-250/50 dark:border-slate-800/50 space-y-1">
              <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest block">1. Cek Ketersediaan</span>
              <span>{isId ? "Pilih salah satu base domain aktif lalu masukkan subdomain prefix yang Anda inginkan (misal: 'portfolio')." : "Choose an active base domain and check prefix availability (e.g. 'portfolio')."}</span>
            </div>
            <div className="bg-white/40 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-250/50 dark:border-slate-800/50 space-y-1">
              <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest block">2. Setup DNS Mapping</span>
              <span>{isId ? "Gunakan template instan untuk Vercel, Canva, Blogger, Github Pages, atau masukkan CNAME/A target secara manual." : "Use instant templates for Vercel, Canva, Blogger, Github Pages, or enter manual CNAME/A target value."}</span>
            </div>
            <div className="bg-white/40 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-250/50 dark:border-slate-800/50 space-y-1">
              <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest block">3. Aktivasi Instan</span>
              <span>{isId ? "Sistem akan mendaftarkan record DNS di Cloudflare secara real-time. Subdomain Anda langsung aktif dan siap digunakan." : "Our system registers the DNS record in Cloudflare in real-time. Your subdomain is instantly active!"}</span>
            </div>
          </div>
        </div>

        {/* Subdomains Table Card */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
              {isId ? "Daftar Subdomain Anda" : "Your Registered Subdomains"}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase">
              Total: {subdomains.length}
            </span>
          </div>

          {subdomains.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto text-slate-300 dark:text-slate-800 text-2xl border border-slate-100 dark:border-slate-850 shadow-inner">
                <FontAwesomeIcon icon={faGlobe} />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {isId ? "Belum Ada Subdomain" : "No Registered Subdomains"}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                  {isId 
                    ? "Anda belum mendaftarkan subdomain custom. Klik tombol pendaftaran di atas untuk mulai membuat!"
                    : "You haven't registered any custom subdomains yet. Click the button above to get started!"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold font-sans">
                <thead className="bg-slate-50 dark:bg-black/20 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Subdomain & Domain</th>
                    <th className="px-6 py-3.5">DNS Record Type</th>
                    <th className="px-6 py-3.5">Value / Target</th>
                    <th className="px-6 py-3.5">Cloudflare Proxy</th>
                    <th className="px-6 py-3.5">Created Date</th>
                    <th className="px-6 py-3.5 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-zinc-300 font-medium">
                  {subdomains.map((sub) => {
                    const fullUrl = `${sub.subdomain}.${sub.domain.domain}`;
                    const isBanned = !!sub.isBanned;
                    return (
                      <tr key={sub.id} className={`transition-all ${
                        isBanned 
                          ? 'bg-red-500/[0.03] dark:bg-red-500/[0.02] border-l-4 border-l-red-500' 
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/20'
                      }`}>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className={`text-xs font-extrabold block ${isBanned ? 'text-red-500 line-through' : 'text-slate-950 dark:text-white'}`}>
                              {sub.subdomain}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              .{sub.domain.domain}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-lg font-extrabold text-[10px] ${
                            isBanned 
                              ? 'bg-red-500/10 text-red-500' 
                              : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
                          }`}>
                            {sub.dnsType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] max-w-[220px] truncate">
                          {isBanned ? (
                            <span className="text-red-500 font-bold block text-xs whitespace-normal leading-normal">
                              {isId 
                                ? `⚠️ Ditangguhkan oleh Admin: "${sub.banReason || 'Melanggar Ketentuan'}"`
                                : `⚠️ Suspended by Admin: "${sub.banReason || 'Violation of Terms'}"`}
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-zinc-400">{sub.dnsValue}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-black text-[8px] uppercase tracking-widest animate-pulse border border-red-500/20">
                              Suspended
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                              sub.proxied 
                                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/10' 
                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border border-transparent'
                            }`}>
                              <FontAwesomeIcon icon={faShieldAlt} className="text-[9px]" />
                              <span>{sub.proxied ? 'Proxy On' : 'Proxy Off'}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400 dark:text-zinc-550 text-[10px] font-mono">
                          {new Date(sub.createdAt).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isBanned ? (
                              <button
                                onClick={() => {
                                  setAppealSubdomainTarget(sub);
                                  setAppealReasonText("");
                                }}
                                className="px-3 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-all font-black uppercase text-[9px] tracking-wider shadow-sm flex items-center gap-1.5 active:scale-95"
                                title={isId ? "Ajukan Banding" : "Submit Appeal"}
                              >
                                🛡️ <span>{isId ? "Ajukan Banding" : "Submit Appeal"}</span>
                              </button>
                            ) : (
                              <>
                                <a 
                                  href={`http://${fullUrl}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all flex items-center justify-center border border-slate-200/50 dark:border-slate-800"
                                >
                                  <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
                                </a>
                                <button
                                  onClick={() => openEditModal(sub)}
                                  className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-center border border-slate-200/50 dark:border-slate-800"
                                >
                                  <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmTarget(sub)}
                                  className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-455 hover:text-red-500 hover:bg-red-55/10 dark:hover:bg-red-950/20 transition-all flex items-center justify-center border border-slate-200/50 dark:border-slate-800"
                                  title={isId ? "Hapus Subdomain" : "Delete Subdomain"}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* CREATE SUBDOMAIN MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl text-slate-900 dark:text-white p-6 sm:p-8 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm">
                    <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                  </div>
                  <h3 className="text-md font-black tracking-tight uppercase">
                    {isId ? "Daftar Subdomain Baru" : "Register Subdomain"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubdomain} className="space-y-4">
                
                {/* Domain Selector & Subdomain prefix entry */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    {isId ? "Pilih Domain & Prefix Subdomain" : "Select Domain & Prefix"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {/* Prefix Subdomain */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="e.g. portfolio"
                        value={subdomainPrefix}
                        onChange={(e) => {
                          setSubdomainPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                          setIsAvailable(null);
                          setAvailabilityMessage(null);
                        }}
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                    {/* Domain selection */}
                    <div className="sm:w-[180px]">
                      <select
                        value={selectedDomainId}
                        onChange={(e) => {
                          setSelectedDomainId(e.target.value);
                          setIsAvailable(null);
                          setAvailabilityMessage(null);
                        }}
                        className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all cursor-pointer"
                      >
                        {domains.map((dom) => (
                          <option key={dom.id} value={dom.id}>
                            .{dom.domain}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Auto Availability Checker Indicator */}
                  {(checkingAvailability || availabilityMessage) && (
                    <div className="flex items-center gap-1.5 pt-1.5 min-h-[1.5rem] transition-all">
                      {checkingAvailability ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 animate-pulse">
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[9px]" />
                          <span>{isId ? "Mengecek ketersediaan..." : "Checking availability..."}</span>
                        </div>
                      ) : (
                        availabilityMessage && (
                          <span className={`text-[10px] font-bold ${
                            isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                          }`}>
                            {availabilityMessage}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Setup Mode Toggle Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1 border border-slate-200/50 dark:border-slate-800/80 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => setSetupMode("template")}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      setupMode === "template"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <FontAwesomeIcon icon={faSlidersH} className="text-[10px]" />
                    <span>{isId ? "Gunakan Template" : "Templates"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupMode("advance")}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      setupMode === "advance"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <FontAwesomeIcon icon={faExchangeAlt} className="text-[10px]" />
                    <span>{isId ? "Advance Setup" : "Manual Advance"}</span>
                  </button>
                </div>

                {/* TEMPLATE MODE INTERFACE */}
                {setupMode === "template" && (
                  <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "vercel", label: "Vercel Hosting" },
                        { id: "canva", label: "Canva Custom DNS" },
                        { id: "github", label: "Github Pages" },
                        { id: "blogger", label: "Blogger Custom" }
                      ].map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => setSelectedTemplate(tmpl.id)}
                          className={`py-2 px-3 border rounded-xl text-[10px] font-bold text-center uppercase tracking-wide transition-all ${
                            selectedTemplate === tmpl.id
                              ? "bg-indigo-500/10 text-indigo-500 border-indigo-500 dark:border-indigo-400"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-zinc-400 hover:border-slate-400"
                          }`}
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>

                    {selectedTemplate === "github" && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          Github Username
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. tierkun"
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value)}
                          className="w-full h-10 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none"
                          required={selectedTemplate === "github"}
                        />
                      </div>
                    )}

                    {selectedTemplate && (
                      <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                        <span className="block font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[8px]">Auto pre-fills record</span>
                        <div className="flex justify-between font-mono">
                          <span>Type:</span>
                          <span className="font-extrabold text-indigo-500">{dnsType}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span>Value:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white max-w-[200px] truncate">{dnsValue || "..."}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span>Cloudflare Proxy:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">Off (Disabled)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ADVANCE SETUP MODE */}
                {setupMode === "advance" && (
                  <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl">
                    
                    {/* Record type selection */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        DNS Record Type
                      </label>
                      <div className="flex gap-2">
                        {["CNAME", "A"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setDnsType(type as "CNAME" | "A")}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border uppercase ${
                              dnsType === type
                                ? "bg-indigo-500/10 text-indigo-500 border-indigo-500 dark:border-indigo-400"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-zinc-400"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Destination DNS target */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        {isId ? "Tujuan / Target Value" : "Value / Target"}
                      </label>
                      <input
                        type="text"
                        placeholder={dnsType === "CNAME" ? "e.g. cname.vercel-dns.com" : "e.g. 76.76.21.21"}
                        value={dnsValue}
                        onChange={(e) => setDnsValue(e.target.value)}
                        className="w-full h-11 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none"
                        required
                      />
                    </div>

                    {/* Proxy Toggle switch */}
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-slate-900 dark:text-white block uppercase tracking-wide">
                          Cloudflare Proxy
                        </span>
                        <span className="text-[9px] font-medium text-slate-400 block leading-tight">
                          {isId ? "Sembunyikan IP / Domain target Anda di balik proxy DNS Cloudflare." : "Hide your target IP / domain behind the Cloudflare DNS Proxy."}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={proxied}
                          onChange={(e) => setProxied(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                      </label>
                    </div>

                  </div>
                )}

                {/* Submitting Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 transition-all"
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || isAvailable === false || !dnsValue.trim() || !subdomainPrefix.trim()}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[10px]" />
                        <span>{isId ? "Membuat..." : "Creating..."}</span>
                      </div>
                    ) : (
                      isId ? "Buat Sekarang" : "Create Subdomain"
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT SUBDOMAIN MODAL */}
      <AnimatePresence>
        {showEditModal && selectedSubdomain && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl text-slate-900 dark:text-white p-6 sm:p-8 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                  </div>
                  <h3 className="text-md font-black tracking-tight uppercase">
                    {isId ? "Edit Subdomain" : "Edit Subdomain"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-0.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                <span className="block font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[8px]">Selected Subdomain</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs">{selectedSubdomain.subdomain}.{selectedSubdomain.domain.domain}</span>
              </div>

              <form onSubmit={handleEditSubdomain} className="space-y-4">
                
                {/* Record type selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    DNS Record Type
                  </label>
                  <div className="flex gap-2">
                    {["CNAME", "A"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDnsType(type as "CNAME" | "A")}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border uppercase ${
                          dnsType === type
                            ? "bg-indigo-500/10 text-indigo-500 border-indigo-500 dark:border-indigo-400"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-zinc-400"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destination DNS target */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    {isId ? "Tujuan / Target Value" : "Value / Target"}
                  </label>
                  <input
                    type="text"
                    placeholder={dnsType === "CNAME" ? "e.g. cname.vercel-dns.com" : "e.g. 76.76.21.21"}
                    value={dnsValue}
                    onChange={(e) => setDnsValue(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none"
                    required
                  />
                </div>

                {/* Proxy Toggle switch */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold text-slate-900 dark:text-white block uppercase tracking-wide">
                      Cloudflare Proxy
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 block leading-tight">
                      {isId ? "Sembunyikan IP / Domain target Anda di balik proxy DNS Cloudflare." : "Hide your target IP / domain behind the Cloudflare DNS Proxy."}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={proxied}
                      onChange={(e) => setProxied(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                  </label>
                </div>

                {/* Submitting Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 transition-all"
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !dnsValue.trim()}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[10px]" />
                        <span>{isId ? "Menyimpan..." : "Saving..."}</span>
                      </div>
                    ) : (
                      isId ? "Simpan Perubahan" : "Save Changes"
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APPEAL SUBDOMAINS MODAL */}
      <AnimatePresence>
        {appealSubdomainTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
                <span className="text-xl">🛡️</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    {isId ? "Ajukan Banding Moderasi" : "Submit Moderation Appeal"}
                  </h3>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">
                    {appealSubdomainTarget.subdomain}.{appealSubdomainTarget.domain.domain}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppealSubdomainTarget(null);
                    setAppealReasonText("");
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold transition-all border border-slate-100 dark:border-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateAppeal} className="space-y-4 font-sans">
                <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-2xl border border-amber-500/20 text-[11px] font-bold leading-relaxed">
                  {isId 
                    ? "Banding Anda akan ditinjau langsung oleh tim Administrator. Tulis penjelasan yang objektif mengapa subdomain Anda layak dipulihkan."
                    : "Your appeal will be reviewed directly by our Administration team. Write an objective explanation of why your subdomain should be restored."}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    {isId ? "Alasan Penangguhan Admin" : "Admin Suspension Reason"}
                  </span>
                  <div className="bg-red-500/5 text-red-500 border border-red-500/10 px-4 py-2.5 rounded-xl font-semibold text-xs">
                    "{appealSubdomainTarget.banReason || (isId ? 'Melanggar Ketentuan' : 'Violation of Terms')}"
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    {isId ? "Penjelasan & Bukti Banding" : "Appeal Explanation & Proof"}
                  </label>
                  <textarea
                    placeholder={isId ? "Tulis penjelasan pembelaan Anda di sini..." : "Write your defense explanation here..."}
                    value={appealReasonText}
                    onChange={(e) => setAppealReasonText(e.target.value)}
                    className="w-full h-28 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl p-4 text-xs font-medium outline-none focus:ring-4 focus:ring-violet-500/10 transition-all font-sans resize-none placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Submitting Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAppealSubdomainTarget(null);
                      setAppealReasonText("");
                    }}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 transition-all"
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAppeal || !appealReasonText.trim()}
                    className="flex-grow flex-1 py-3 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {submittingAppeal ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[10px]" />
                        <span>{isId ? "Mengirim..." : "Submitting..."}</span>
                      </div>
                    ) : (
                      isId ? "Kirim Pengajuan" : "Submit Appeal"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col font-sans"
            >
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
                <span className="text-xl">⚠️</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-red-500 font-bold">
                    {isId ? "Konfirmasi Penghapusan" : "Delete Confirmation"}
                  </h3>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">
                    {isId ? "Hapus Subdomain?" : "Delete Subdomain?"}
                  </h4>
                </div>
                <button 
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold transition-all border border-slate-100 dark:border-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-2xl border border-red-500/20 text-xs font-bold leading-relaxed">
                  {isId 
                    ? "Tindakan ini bersifat permanen. Mapping DNS subdomain Anda di Cloudflare akan dihapus dan data ini tidak bisa dikembalikan."
                    : "This action is permanent. Your subdomain DNS mapping on Cloudflare will be deleted and this data cannot be recovered."}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    {isId ? "Nama Subdomain" : "Subdomain Target"}
                  </span>
                  <div className="bg-slate-50 dark:bg-black/25 px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 font-mono text-xs text-indigo-500 font-bold">
                    {deleteConfirmTarget.subdomain}.{deleteConfirmTarget.domain.domain}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2.5 shrink-0 justify-end">
                <button 
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-zinc-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button 
                  onClick={() => {
                    const targetId = deleteConfirmTarget.id;
                    setDeleteConfirmTarget(null);
                    handleDeleteSubdomain(targetId);
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1.5 font-sans"
                >
                  {isId ? "Hapus Permanen" : "Delete Permanently"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
