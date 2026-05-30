// src/app/report/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldAlt, faExclamationTriangle, faArrowLeft, faCheckCircle, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

function ReportForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const typeParam = searchParams.get("type") || "shorturl";
  const slugParam = searchParams.get("slug") || "";

  const [assetType, setAssetType] = useState(typeParam);
  const [assetId, setAssetId] = useState(slugParam);
  const [reason, setReason] = useState("Spam");
  const [details, setDetails] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeParam) setAssetType(typeParam);
    if (slugParam) setAssetId(slugParam);
  }, [typeParam, slugParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId.trim()) {
      toast.error("Tautan atau kode aset wajib diisi.");
      return;
    }
    if (!reason) {
      toast.error("Kategori pelanggaran wajib diisi.");
      return;
    }
    if (!details.trim()) {
      toast.error("Detail penjelasan pelanggaran wajib diisi.");
      return;
    }
    if (!reporterName.trim()) {
      toast.error("Nama pelapor wajib diisi sebagai identitas dasar.");
      return;
    }
    if (!reporterEmail.trim()) {
      toast.error("Email pelapor wajib diisi sebagai identitas dasar.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/guest/report-abuse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId: assetId.trim(),
          assetType,
          reason,
          details: details.trim(),
          reporterName: reporterName.trim(),
          reporterEmail: reporterEmail.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setSuccess(true);
        toast.success("Laporan berhasil dikirim!");
      } else {
        toast.error(json.error || "Gagal mengirimkan laporan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-zinc-900/60 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-md w-full text-center backdrop-blur-xl space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner border border-emerald-500/20">
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Laporan Terkirim</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
            Terima kasih atas laporan Anda. Tim moderator kami akan meninjau laporan ini dalam waktu 24 jam untuk menjaga keamanan ekosistem platform kami.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            Kembali ke Beranda
          </button>
          <button
            onClick={() => {
              setDetails("");
              setSuccess(false);
            }}
            className="flex-1 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
          >
            Kirim Laporan Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-xl w-full backdrop-blur-xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500" />
      
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-2.5 py-1 rounded-xl border border-red-500/20 w-fit">
            <FontAwesomeIcon icon={faShieldAlt} className="text-[10px]" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Keamanan Konten</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Laporkan Penyalahgunaan</h1>
          <p className="text-slate-500 dark:text-zinc-500 text-[10px] sm:text-xs font-semibold leading-relaxed">
            Laporkan spam, malware, phishing, pencurian hak cipta, atau konten ilegal lainnya di platform kami.
          </p>
        </div>
        <Link
          href="/"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 transition-all shadow-sm shrink-0"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Asset Type */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Jenis Produk/Aset</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            >
              <option value="shorturl">Short URL (Tautan)</option>
              <option value="qrcode">QR Code</option>
              <option value="biolink">Biolink Profile</option>
              <option value="paste">Pastebin Snippet</option>
              <option value="paste_room">Paste Room (Kolaborasi)</option>
              <option value="file">File (Unggahan Berkas)</option>
            </select>
          </div>

          {/* Asset Slug/ID */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">ID / Kode / Link Aset</label>
            <input
              type="text"
              placeholder="e.g. abcd1234 atau username"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
              required
            />
          </div>
        </div>

        {/* Abuse Reason */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Kategori Pelanggaran</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-10 px-3.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          >
            <option value="Spam">Spamming / Iklan Tak Diinginkan</option>
            <option value="Phishing / Malware">Phishing / Malware / Situs Berbahaya</option>
            <option value="Intellectual Property / Copyright">Pelanggaran Hak Cipta / Kekayaan Intelektual</option>
            <option value="Abusive / Hate Speech">Konten Kebencian / SARA / Pelecehan</option>
            <option value="Other">Lainnya (Tulis detail di bawah)</option>
          </select>
        </div>

        {/* Violation Details */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Penjelasan Detail Pelanggaran</label>
          <textarea
            placeholder="Jelaskan secara spesifik mengapa aset ini melanggar ketentuan layanan..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full h-28 p-3.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
            required
          />
        </div>

        {/* Reporter Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-450 dark:text-zinc-450 tracking-wider">
              Nama Pelapor <span className="text-red-500 font-extrabold">* (Wajib)</span>
            </label>
            <input
              type="text"
              placeholder="Nama Lengkap Anda"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-450 dark:text-zinc-450 tracking-wider">
              Email Pelapor <span className="text-red-500 font-extrabold">* (Wajib)</span>
            </label>
            <input
              type="email"
              placeholder="email@domain.com"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
              required
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 text-xs mt-0.5 shrink-0" />
          <p className="text-[9px] text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
            Perhatian: Mengajukan laporan palsu atau fitnah dapat menyebabkan penangguhan akun Anda. Harap berikan bukti dan rincian yang jujur serta valid.
          </p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-650/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} className="text-[10px]" />
              <span>Kirim Laporan Pelanggaran</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat form...</p>
        </div>
      }>
        <ReportForm />
      </Suspense>
    </main>
  );
}
