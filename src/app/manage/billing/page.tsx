"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faHistory,
  faQrcode,
  faServer,
  faCreditCard,
  faCircleNotch,
  faArrowLeft,
  faCheckCircle,
  faTimesCircle,
  faPaste,
  faDatabase,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  days: number;
  maxAssets: number;
  maxPastes: number;
  maxRooms: number;
  maxDomains: number;
  maxStorage?: number;
  maxFileSize?: number;
  isPayAsYouGo: boolean;
  isActive: boolean;
}

interface Transaction {
  id: string;
  planId: string;
  targetAmount: number;
  feeAmount: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentNumber: string | null;
  paymentUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  plan: PricingPlan;
}

const paymentMethodsList = [
  { id: "qris", name: "QRIS", type: "QR Code", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg", feeDesc: "0.7% + Rp310" },
  { id: "bri_va", name: "BRI VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_Logo.svg", feeDesc: "+Rp3.500" },
  { id: "bni_va", name: "BNI VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg", feeDesc: "+Rp3.500" },
  { id: "cimb_niaga_va", name: "CIMB VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/CIMB_Niaga_logo.svg", feeDesc: "+Rp3.500" },
  { id: "permata_va", name: "Permata VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_Permata_Bank.svg", feeDesc: "+Rp3.500" },
  { id: "maybank_va", name: "Maybank VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Maybank-Logo.svg", feeDesc: "+Rp3.500" },
  { id: "bnc_va", name: "BNC VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/id/c/cd/Logo_Bank_Neo_Commerce.svg", feeDesc: "+Rp3.500" },
  { id: "artha_graha_va", name: "Artha Graha VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/id/8/87/Logo_Bank_Artha_Graha_Internasional.svg", feeDesc: "+Rp2.000" },
  { id: "sampoerna_va", name: "Sampoerna VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/id/a/a2/Logo_Sahabat_Sampoerna.png", feeDesc: "+Rp2.000" },
  { id: "atm_bersama_va", name: "ATM Bersama VA", type: "Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/ATM_Bersama_logo.svg", feeDesc: "+Rp3.500" },
];

const renderMethodLogo = (methodId: string) => {
  switch (methodId) {
    case "qris":
      return (
        <div className="w-10 h-7 bg-slate-900 rounded flex items-center justify-center shrink-0 border border-slate-700/50 shadow-inner overflow-hidden select-none">
          <span className="text-[10px] font-black tracking-tighter text-white">
            <span className="text-cyan-400">Q</span>
            <span className="text-rose-500">R</span>
            <span className="text-amber-400">I</span>
            <span className="text-emerald-400">S</span>
          </span>
        </div>
      );
    case "bri_va":
      return (
        <div className="w-10 h-7 bg-[#00529C] rounded flex items-center justify-center shrink-0 border border-blue-600/30 shadow-inner overflow-hidden select-none">
          <span className="text-[10px] font-black tracking-tight text-white font-sans">BRI</span>
        </div>
      );
    case "bni_va":
      return (
        <div className="w-10 h-7 bg-[#005E6A] rounded flex items-center justify-center shrink-0 border border-teal-600/30 shadow-inner overflow-hidden select-none relative">
          <span className="text-[10px] font-black tracking-tight text-white font-sans">BNI</span>
          <div className="absolute right-1 bottom-1 w-1.5 h-1.5 rounded-full bg-[#F15A24]" />
        </div>
      );
    case "cimb_niaga_va":
      return (
        <div className="w-10 h-7 bg-[#E21C26] rounded flex items-center justify-center shrink-0 border border-red-600/30 shadow-inner overflow-hidden select-none">
          <span className="text-[9px] font-black tracking-tighter text-white font-sans">CIMB</span>
        </div>
      );
    case "permata_va":
      return (
        <div className="w-10 h-7 bg-[#00A753] rounded flex items-center justify-center shrink-0 border border-emerald-600/30 shadow-inner overflow-hidden select-none">
          <span className="text-[9px] font-black tracking-tight text-white font-sans">Permata</span>
        </div>
      );
    case "maybank_va":
      return (
        <div className="w-10 h-7 bg-[#FFD100] rounded flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner overflow-hidden select-none">
          <span className="text-[8px] font-black tracking-tight text-black font-sans">Maybank</span>
        </div>
      );
    case "bnc_va":
      return (
        <div className="w-10 h-7 bg-[#FFD000] rounded flex items-center justify-center shrink-0 border border-yellow-500/30 shadow-inner overflow-hidden select-none">
          <span className="text-[9px] font-black tracking-tighter text-amber-950 font-sans">NEO</span>
        </div>
      );
    case "artha_graha_va":
      return (
        <div className="w-10 h-7 bg-[#0F4C81] rounded flex items-center justify-center shrink-0 border border-blue-800/30 shadow-inner overflow-hidden select-none">
          <span className="text-[9px] font-black tracking-tighter text-white font-sans">Artha</span>
        </div>
      );
    case "sampoerna_va":
      return (
        <div className="w-10 h-7 bg-[#B38F4F] rounded flex items-center justify-center shrink-0 border border-amber-700/30 shadow-inner overflow-hidden select-none">
          <span className="text-[9px] font-black tracking-tighter text-white font-sans">Sahabat</span>
        </div>
      );
    case "atm_bersama_va":
      return (
        <div className="w-10 h-7 bg-[#005691] rounded flex items-center justify-center shrink-0 border border-blue-600/30 shadow-inner overflow-hidden select-none">
          <span className="text-[9px] font-black tracking-tighter text-white font-sans">ATM</span>
        </div>
      );
    default:
      return (
        <div className="w-10 h-7 bg-slate-100 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0 border shadow-inner overflow-hidden select-none">
          <span className="text-[10px] font-black text-slate-500">BANK</span>
        </div>
      );
  }
};

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useLanguage();

  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [planExpiredAt, setPlanExpiredAt] = useState<string | null>(null);
  const [assetCounts, setAssetCounts] = useState<any>({ totalAssets: 0, urlsCount: 0, qrCount: 0, biolinkCount: 0 });
  const [payAsYouGoBalance, setPayAsYouGoBalance] = useState<number>(0);
  const [payAsYouGoPastesBalance, setPayAsYouGoPastesBalance] = useState<number>(0);
  const [payAsYouGoRoomsBalance, setPayAsYouGoRoomsBalance] = useState<number>(0);
  const [payAsYouGoDomainsBalance, setPayAsYouGoDomainsBalance] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<"monthly" | "payg">("monthly");
  const [loading, setLoading] = useState(true);

  const [planToConfirmChange, setPlanToConfirmChange] = useState<PricingPlan | null>(null);

  const getRemainingDays = () => {
    if (!planExpiredAt) return 0;
    const expiry = new Date(planExpiredAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return diffTime / (1000 * 60 * 60 * 24);
  };

  const getRenewalState = () => {
    const isFree = !currentPlan || currentPlan.id === "FREE";
    if (isFree || !planExpiredAt || !currentPlan) return { showReminder: false, isGracePeriod: false, daysLeft: 0, daysOverdue: 0 };
    const expiry = new Date(planExpiredAt).getTime();
    const now = Date.now();
    const diffMs = expiry - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    const gracePeriodMs = 7 * 24 * 60 * 60 * 1000;
    const isInGracePeriod = now > expiry && now <= expiry + gracePeriodMs;
    const isInH7 = diffDays <= 7 && diffDays >= 0;

    return {
      showReminder: isInH7 || isInGracePeriod,
      isGracePeriod: isInGracePeriod,
      daysLeft: Math.ceil(diffDays),
      daysOverdue: Math.max(0, Math.floor((now - expiry) / (1000 * 60 * 60 * 24)))
    };
  };

  const handleConfirmPlanChange = () => {
    if (planToConfirmChange) {
      setSelectedPlan(planToConfirmChange);
      setPaymentMethod("qris");
      setPlanToConfirmChange(null);
    }
  };

  // Checkout flow states
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("qris");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState<Transaction | null>(null);
  const [cancellingTx, setCancellingTx] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const expiresStr = pendingTx?.expiresAt;
    if (!expiresStr || pendingTx.status !== "PENDING") return;

    const updateTimer = () => {
      const expires = new Date(expiresStr).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pendingTx]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleDownloadQR = async () => {
    if (!pendingTx?.paymentNumber) return;
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(pendingTx.paymentNumber)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QRIS-${pendingTx.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("QRIS berhasil diunduh!");
    } catch (e) {
      toast.error("Gagal mengunduh QRIS, silakan screenshot.");
    }
  };

  const handlePrintInvoice = (tx: Transaction) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const activeMethod = paymentMethodsList.find(m => m.id === tx.paymentMethod) || { name: tx.paymentMethod.replace("_va", "").toUpperCase() };
    const invoiceDate = new Date(tx.createdAt).toLocaleString(language === "en" ? "en-US" : "id-ID", { dateStyle: "long", timeStyle: "short" });

    const isPaid = tx.status === "COMPLETED" || tx.status === "PAID" || tx.status === "SUCCESS";
    const isCancelled = tx.status === "CANCELLED" || tx.status === "FAILED";
    const statusText = isPaid 
      ? (language === "en" ? "PAID" : "LUNAS") 
      : isCancelled 
        ? (language === "en" ? "CANCELLED" : "BATAL") 
        : (language === "en" ? "PENDING" : "MENUNGGU");
    const statusClass = isPaid ? "paid" : isCancelled ? "cancelled" : "pending";

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
            .logo span {
              color: #6366f1;
            }
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
            .status-badge.paid {
              background-color: #d1fae5;
              color: #065f46;
              border: 1px solid #a7f3d0;
            }
            .status-badge.pending {
              background-color: #fef3c7;
              color: #92400e;
              border: 1px solid #fde68a;
            }
            .status-badge.cancelled {
              background-color: #fee2e2;
              color: #991b1b;
              border: 1px solid #fca5a5;
            }
            .invoice-body {
              padding: 40px;
            }
            .meta-section {
              display: grid;
              grid-template-cols: 1.2fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 30px;
            }
            .meta-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #94a3b8;
              margin-bottom: 8px;
            }
            .meta-value {
              font-size: 13px;
              font-weight: 500;
              color: #334155;
              line-height: 1.6;
            }
            .meta-value.highlight {
              font-family: 'JetBrains Mono', monospace;
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
            }
            .title-receipt {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 0;
              margin-bottom: 30px;
              letter-spacing: -0.5px;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
              margin-bottom: 40px;
            }
            .invoice-table th {
              background-color: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              padding: 16px 20px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.15em;
              color: #64748b;
            }
            .invoice-table td {
              border-bottom: 1px solid #f1f5f9;
              padding: 20px;
              font-size: 14px;
              color: #334155;
            }
            .invoice-table td strong {
              color: #0f172a;
              font-weight: 600;
            }
            .totals-section {
              display: flex;
              justify-content: flex-end;
            }
            .totals-box {
              width: 100%;
              max-width: 360px;
              background-color: #f8fafc;
              border-radius: 16px;
              padding: 20px;
              border: 1px solid #e2e8f0;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 13px;
              color: #64748b;
            }
            .totals-row.grand-total {
              border-top: 1px solid #e2e8f0;
              margin-top: 12px;
              padding-top: 14px;
              font-size: 18px;
              font-weight: 800;
              color: #6366f1;
            }
            .invoice-footer {
              background-color: #f8fafc;
              border-top: 1px solid #e2e8f0;
              padding: 30px 40px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              line-height: 1.6;
            }
            
            @media print {
              body {
                background-color: #ffffff;
                padding: 0;
                margin: 0;
              }
              .invoice-container {
                border: none;
                box-shadow: none;
                border-radius: 0;
                max-width: 100%;
              }
              .invoice-header {
                padding: 30px;
              }
              .invoice-body {
                padding: 30px;
              }
              .invoice-footer {
                padding: 20px 30px;
              }
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
              <h2 class="title-receipt">${language === "en" ? "TRANSACTION RECEIPT" : "KUITANSI TRANSAKSI"}</h2>
              
              <div class="meta-section">
                <div>
                  <div class="meta-title">${language === "en" ? "BILLED TO" : "PELANGGAN"}</div>
                  <div class="meta-value">
                    <strong>${session?.user?.name || "Premium Member"}</strong><br/>
                    ${session?.user?.email || ""}
                  </div>
                </div>
                <div>
                  <div class="meta-title">${language === "en" ? "INVOICE DETAILS" : "RINCIAN INVOICE"}</div>
                  <div class="meta-value">
                    <strong>${language === "en" ? "Invoice ID:" : "ID Transaksi:"}</strong> <span class="meta-value highlight">#${tx.id}</span><br/>
                    <strong>${language === "en" ? "Date:" : "Tanggal:"}</strong> ${invoiceDate}<br/>
                    <strong>${language === "en" ? "Method:" : "Metode:"}</strong> ${activeMethod.name}
                  </div>
                </div>
              </div>
              
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th>${language === "en" ? "DESCRIPTION" : "DESKRIPSI"}</th>
                    <th style="text-align: right;">${language === "en" ? "DURATION" : "MASA AKTIF"}</th>
                    <th style="text-align: right;">${language === "en" ? "AMOUNT" : "JUMLAH"}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      Premium Subscription - <strong>${tx.plan?.name || tx.planId}</strong><br/>
                      <span style="font-size: 11px; color: #64748b;">
                        ${language === "en" ? "Access to all features, custom biolinks, and domain mappings" : "Akses penuh ke semua fitur, biolink personal, dan domain kustom"}
                      </span>
                    </td>
                    <td style="text-align: right; font-weight: 500;">${tx.plan?.days || 30} ${language === "en" ? "Days" : "Hari"}</td>
                    <td style="text-align: right; font-weight: 600; color: #0f172a;">Rp${tx.targetAmount.toLocaleString("id-ID")}</td>
                  </tr>
                </tbody>
              </table>

              <div class="totals-section">
                <div class="totals-box">
                  <div class="totals-row">
                    <span>${language === "en" ? "Subtotal:" : "Subtotal:"}</span>
                    <span style="font-weight: 500; color: #334155;">Rp${tx.targetAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div class="totals-row">
                     <span>${language === "en" ? "Service Fee:" : "Biaya Admin:"}</span>
                     <span style="font-weight: 500; color: #334155;">Rp${tx.feeAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div class="totals-row grand-total">
                    <span>${language === "en" ? "Total Amount Paid:" : "Total Pembayaran:"}</span>
                    <span>Rp${tx.totalAmount.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="invoice-footer">
              <strong>nyoo.me</strong> &bull; ${language === "en" ? "Premium Link-in-Bio & Dynamic QR Solutions" : "Solusi Tautan Premium & QR Dinamis"}<br/>
              <span style="font-size: 10px; color: #cbd5e1; margin-top: 8px; display: block;">
                ${language === "en" ? "This is an official computer-generated receipt. No physical signature is required." : "Ini adalah kuitansi digital resmi. Tidak memerlukan tanda tangan fisik."}
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

  const fetchBillingData = async () => {
    if (!session?.user) return;
    try {
      // @ts-expect-error id check
      const userId = session.user.id;
      const [plansRes, historyRes, profileRes] = await Promise.all([
        fetch("/api/user/pricing/plans"),
        fetch(`/api/user/billing/history?userId=${userId}`),
        fetch(`/api/user/profile?userId=${userId}`),
      ]);

      if (plansRes.ok) {
        const json = await plansRes.json();
        // Exclude FREE plan from buyable list
        setPlans((json.data || []).filter((p: PricingPlan) => p.id !== "FREE"));
      }

      if (historyRes.ok) {
        const json = await historyRes.json();
        setHistory(json.data || []);
        
        // Find if there is any active pending transaction
        const pending = (json.data || []).find((tx: Transaction) => tx.status === "PENDING" && new Date(tx.expiresAt || 0) > new Date());
        if (pending) {
          setPendingTx(pending);
        } else {
          setPendingTx(null);
        }
      }

      if (profileRes.ok) {
        const json = await profileRes.json();
        setCurrentPlan(json.data?.plan || null);
        setPlanExpiredAt(json.data?.planExpiredAt || null);
        setAssetCounts(json.data?.stats || { totalAssets: 0 });
        setPayAsYouGoBalance(json.data?.payAsYouGoBalance || 0);
        setPayAsYouGoPastesBalance(json.data?.payAsYouGoPastesBalance || 0);
        setPayAsYouGoRoomsBalance(json.data?.payAsYouGoRoomsBalance || 0);
        setPayAsYouGoDomainsBalance(json.data?.payAsYouGoDomainsBalance || 0);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyinkronkan data billing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchBillingData();
    }
  }, [status, session]);

  // Automatically trigger checkout modal if planId is passed in query parameters
  useEffect(() => {
    if (plans.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const urlPlanId = params.get("planId");
      if (urlPlanId) {
        const matchingPlan = plans.find(p => p.id === urlPlanId);
        if (matchingPlan && !pendingTx) {
          setSelectedPlan(matchingPlan);
          // Clear query param from address bar to prevent repeated popups on refresh
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    }
  }, [plans, pendingTx]);

  // QRIS Calculation
  const calculateQrisDisplay = (targetPrice: number) => {
    const fee = Math.ceil(targetPrice * 0.007 + 310);
    return { displayPrice: targetPrice + fee, fee };
  };

  // VA Admin Flat Fee Calculation
  const calculateVaDisplay = (targetPrice: number, method: string) => {
    const fee = (method === "sampoerna_va" || method === "artha_graha_va") ? 2000 : 3500;
    return { displayPrice: targetPrice + fee, fee };
  };

  const handleCheckoutInit = async (plan: PricingPlan) => {
    const isFree = !currentPlan || currentPlan.id === "FREE";
    if (!isFree && currentPlan && currentPlan.id !== plan.id && !plan.isPayAsYouGo) {
      // Show ganti paket warning modal first
      setPlanToConfirmChange(plan);
    } else if (currentPlan && currentPlan.id === plan.id && !plan.isPayAsYouGo) {
      // Renewal check: must be in H-7 or grace period
      const expiry = planExpiredAt ? new Date(planExpiredAt) : null;
      if (expiry) {
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
          toast.error(`Anda hanya dapat memperpanjang paket ${plan.name} maksimal 7 hari sebelum masa aktif berakhir (H-7).`);
          return;
        }
      }
      setSelectedPlan(plan);
      setPaymentMethod("qris");
    } else {
      setSelectedPlan(plan);
      setPaymentMethod("qris");
    }
  };

  const handleProcessCheckout = async () => {
    if (!selectedPlan || !session?.user) return;
    setCheckoutLoading(true);
    try {
      // @ts-expect-error id check
      const userId = session.user.id;
      const res = await fetch("/api/user/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod,
          userId,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Transaksi berhasil dibuat!");
        setPendingTx(json.transaction);
        setSelectedPlan(null);
        fetchBillingData();
      } else {
        toast.error(json.error || "Gagal membuat invoice checkout.");
      }
    } catch (err) {
      toast.error("Kesalahan jaringan.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancelCheckout = async (orderId: string) => {
    if (!session?.user) return;
    setCancellingTx(true);
    try {
      // @ts-expect-error id check
      const userId = session.user.id;
      const res = await fetch(`/api/user/billing/cancel/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        toast.success("Invoice checkout berhasil dibatalkan.");
        setPendingTx(null);
        fetchBillingData();
      } else {
        toast.error("Gagal membatalkan invoice.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setCancellingTx(false);
    }
  };

  // Mock Simulated Payment Webhook Trigger
  const handleSimulatePayment = async (orderId: string) => {
    setSimulatingPayment(true);
    try {
      // Trigger checkout webhook endpoint mock
      const res = await fetch("/api/user/billing/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status: "completed",
        }),
      });

      if (res.ok) {
        toast.success("Pembayaran Berhasil! Paket Anda kini telah aktif.");
        setPendingTx(null);
        fetchBillingData();
      } else {
        toast.error("Simulasi pembayaran gagal.");
      }
    } catch (e) {
      toast.error("Jaringan bermasalah.");
    } finally {
      setSimulatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] w-full flex flex-col items-center justify-center">
        <FontAwesomeIcon icon={faCircleNotch} className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat Layanan Billing & Quota...</p>
      </div>
    );
  }

  const activePlanName = currentPlan?.name || "Free Plan";
  const planActiveDays = currentPlan?.days || 3650;
  const isFreePlan = !currentPlan || currentPlan.id === "FREE";

  const totalAssetsLimit = currentPlan?.maxAssets || 100;
  const totalPastesLimit = currentPlan?.maxPastes || 20;
  const totalRoomsLimit = currentPlan?.maxRooms || 1;
  const totalDomainsLimit = currentPlan?.maxDomains || 1;

  const totalAssetsUsed = assetCounts.totalAssets || 0;
  const totalPastesUsed = assetCounts.pastesCount || 0;
  const totalRoomsUsed = assetCounts.roomsCount || 0;
  const totalDomainsUsed = assetCounts.domainsCount || 0;

  // Usage percentages
  const assetsPercent = Math.min(100, Math.round((totalAssetsUsed / totalAssetsLimit) * 100));
  const pastesPercent = Math.min(100, Math.round((totalPastesUsed / totalPastesLimit) * 100));
  const roomsPercent = Math.min(100, Math.round((totalRoomsUsed / totalRoomsLimit) * 100));
  const domainsPercent = Math.min(100, Math.round((totalDomainsUsed / totalDomainsLimit) * 100));

  const totalStorageUsed = assetCounts.usedStorage || 0;
  const totalStorageLimitMB = currentPlan?.maxStorage || 500;
  const totalStorageLimitBytes = totalStorageLimitMB * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((totalStorageUsed / totalStorageLimitBytes) * 100));

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const renewal = getRenewalState();

  return (
    <div className="w-full h-full text-slate-900 dark:text-white selection:bg-indigo-500/20 font-sans pb-20 max-w-6xl mx-auto space-y-8">
      
      {/* Auto-billing / Renewal Reminder Banner */}
      {renewal.showReminder && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-sm backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
        >
          {/* Ambient glow behind card */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
          
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                {renewal.isGracePeriod ? "Masa Tenggang Langganan" : "Perpanjang Masa Aktif"}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
              {renewal.isGracePeriod
                ? `Paket langganan ${currentPlan?.name} Anda telah kedaluwarsa ${renewal.daysOverdue} hari yang lalu. Anda memiliki sisa ${7 - renewal.daysOverdue} hari masa tenggang sebelum paket dinonaktifkan (auto-downgrade ke Free) dan sisa aset berlebih ditangguhkan.`
                : `Paket langganan ${currentPlan?.name} Anda akan berakhir dalam ${renewal.daysLeft} hari. Perpanjang sekarang agar semua fitur dan aset Anda tetap aktif tanpa terputus.`}
            </p>
          </div>
          <button
            onClick={() => {
              const matchingPlan = plans.find(p => p.id === currentPlan.id);
              if (matchingPlan) {
                handleCheckoutInit(matchingPlan);
              } else {
                toast.error("Paket langganan tidak ditemukan.");
              }
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shrink-0 z-10 active:scale-95 flex items-center gap-1.5"
          >
            <span>🔁</span>
            <span>{language === "en" ? "Extend Subscription" : "Perpanjang Sekarang"}</span>
          </button>
        </motion.div>
      )}

      {/* 1. Unified Header & Quota Dashboard Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: Plan Summary & Header (col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/5 px-2.5 py-1 rounded-xl border border-indigo-500/20 w-fit">
              <FontAwesomeIcon icon={faBolt} className="text-indigo-600 dark:text-indigo-400 text-[10px]" />
              <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                {language === "en" ? "PLANS & BILLING" : "PAKET & KUOTA"}
              </p>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {language === "en" ? "Choose the Perfect Plan for" : "Tingkatkan Akses dengan"}{" "}
                <span className="text-indigo-600 dark:text-indigo-400">nyoo.me</span>
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 text-[11px] font-medium leading-relaxed">
                {language === "en" 
                  ? "Track link analytics, customize Biolinks, and map custom subdomains smoothly with no boundaries."
                  : "Optimalkan performa link, QR Code dinamis, kustomisasi biolink, dan sambungkan domain personal."}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-black/25 rounded-2xl p-3.5 border border-slate-100 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                {language === "en" ? "ACTIVE PLAN" : "PAKET AKTIF"}
              </span>
              <span className="bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase shrink-0">
                {activePlanName}
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-350 flex items-center justify-between border-t border-slate-250/50 dark:border-white/5 pt-2.5">
              <span>📅 {language === "en" ? "Plan Expiration:" : "Masa Aktif Paket:"}</span>
              <span className="text-slate-800 dark:text-zinc-200 font-extrabold">
                {isFreePlan 
                  ? (language === "en" ? "Forever" : "Selamanya") 
                  : planExpiredAt 
                    ? new Date(planExpiredAt).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { dateStyle: "medium" })
                    : (language === "en" ? "Forever" : "Selamanya")}
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-350 border-t border-slate-250/50 dark:border-white/5 pt-2.5 space-y-1.5">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                💰 {language === "en" ? "Pay-As-You-Go Quotas:" : "Kuota Pay-As-You-Go:"}
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>🔗 {language === "en" ? "Assets:" : "Aset:"}</span>
                  <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{payAsYouGoBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span>📝 {language === "en" ? "Pastes:" : "Paste:"}</span>
                  <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{payAsYouGoPastesBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span>💬 {language === "en" ? "Rooms:" : "Room:"}</span>
                  <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{payAsYouGoRoomsBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span>🌐 {language === "en" ? "Domains:" : "Domain:"}</span>
                  <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{payAsYouGoDomainsBalance}</span>
                </div>
              </div>
            </div>
            <div className="text-[8px] text-slate-450 dark:text-zinc-500 font-semibold leading-normal pt-1.5 border-t border-slate-250/30 dark:border-white/5">
              {language === "en" 
                ? "*Pay-As-You-Go quotas never expire and are consumed automatically only when your subscription limit is reached." 
                : "*Kuota Pay-As-You-Go tidak kedaluwarsa dan otomatis digunakan saat limit langganan habis."}
            </div></div>
        </div>

        {/* Right Card: Resource Quota Limits (col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="font-extrabold text-[10px] tracking-wider text-slate-400 uppercase">
              {language === "en" ? "RESOURCE LIMITS" : "BATAS KAPASITAS"}
            </h3>
            {(assetsPercent >= 100 || pastesPercent >= 100 || roomsPercent >= 100 || domainsPercent >= 100) && (
              <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded animate-pulse">
                ⚠️ {language === "en" ? "QUOTA FULL" : "QUOTA PENUH"}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-y-4 py-1 flex-grow justify-center">
            {/* Link Assets */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs">🔗</span>
                  <span className="uppercase text-[9px] text-slate-500 tracking-wider">
                    {language === "en" ? "Link Assets" : "Aset Tautan"}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                  {totalAssetsUsed}/{totalAssetsLimit} ({assetsPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    assetsPercent >= 100 ? "bg-red-500 animate-pulse" : assetsPercent >= 80 ? "bg-amber-500" : "bg-indigo-500"
                  }`} 
                  style={{ width: `${assetsPercent}%` }} 
                />
              </div>
            </div>

            {/* Paste Capacity */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs">📝</span>
                  <span className="uppercase text-[9px] text-slate-500 tracking-wider">
                    {language === "en" ? "Pastebin" : "Pastebin"}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                  {totalPastesUsed}/{totalPastesLimit} ({pastesPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    pastesPercent >= 100 ? "bg-red-500 animate-pulse" : pastesPercent >= 80 ? "bg-amber-500" : "bg-indigo-500"
                  }`} 
                  style={{ width: `${pastesPercent}%` }} 
                />
              </div>
            </div>

            {/* Collaboration Rooms */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs">💬</span>
                  <span className="uppercase text-[9px] text-slate-500 tracking-wider">
                    {language === "en" ? "Collab Rooms" : "Ruang Kolaborasi"}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                  {totalRoomsUsed}/{totalRoomsLimit} ({roomsPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    roomsPercent >= 100 ? "bg-red-500 animate-pulse" : roomsPercent >= 80 ? "bg-amber-500" : "bg-indigo-500"
                  }`} 
                  style={{ width: `${roomsPercent}%` }} 
                />
              </div>
            </div>

            {/* Custom Domains */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs">🌐</span>
                  <span className="uppercase text-[9px] text-slate-500 tracking-wider">
                    {language === "en" ? "Custom DNS" : "Kustom DNS"}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                  {totalDomainsUsed}/{totalDomainsLimit} ({domainsPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    domainsPercent >= 100 ? "bg-red-500 animate-pulse" : domainsPercent >= 80 ? "bg-amber-500" : "bg-indigo-500"
                  }`} 
                  style={{ width: `${domainsPercent}%` }} 
                />
              </div>
            </div>

            {/* File Storage Capacity */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs">💾</span>
                  <span className="uppercase text-[9px] text-slate-500 tracking-wider">
                    {language === "en" ? "File Storage" : "Penyimpanan Berkas"}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                  {formatBytes(totalStorageUsed)} / {totalStorageLimitMB} MB ({storagePercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    storagePercent >= 100 ? "bg-red-500 animate-pulse" : storagePercent >= 80 ? "bg-amber-500" : "bg-indigo-500"
                  }`} 
                  style={{ width: `${storagePercent}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Minimalist inline alert strip when any Quota is Full */}
          {(assetsPercent >= 100 || pastesPercent >= 100 || roomsPercent >= 100 || domainsPercent >= 100) && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-bold text-red-655 dark:text-red-450 select-none mt-1">
              <div className="flex items-center gap-1.5">
                <span className="animate-pulse">⚠️</span>
                <span>
                  {language === "en" 
                    ? "Limits reached! Upgrade plan to expand capacities." 
                    : "Kapasitas penuh! Upgrade paket untuk menambah batas."}
                </span>
              </div>
              <button
                onClick={() => {
                  const element = document.getElementById("premium-packages-section");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="font-black uppercase tracking-wider text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 hover:scale-105 active:scale-95 transition-all"
              >
                {language === "en" ? "Upgrade ⚡" : "Upgrade ⚡"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. Pending Transaction Checkout Card */}
      {pendingTx && (() => {
        const activeMethod = paymentMethodsList.find(m => m.id === pendingTx.paymentMethod) || { 
          name: pendingTx.paymentMethod.replace("_va", "").toUpperCase(), 
          logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg", 
          type: "Payment Gateway" 
        };

        return (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-amber-500/30 dark:border-amber-500/20 p-6 shadow-xl backdrop-blur-xl space-y-6 relative overflow-hidden"
          >
            {/* Ambient gold glow behind card */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

            {/* Header: Status and Countdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  {language === "en" ? "Waiting for Payment" : "Menunggu Pembayaran"}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  #{pendingTx.id}
                </span>
              </div>
              <div className="bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] uppercase flex items-center gap-1.5 shrink-0">
                <span>⏳</span>
                <span>
                  {language === "en" ? "Expires In: " : "Kedaluwarsa: "}
                  <strong className="font-mono">{formatTime(timeLeft)}</strong>
                </span>
              </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Column: Cost and Bank Details */}
              <div className="md:col-span-7 space-y-5">
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                    {language === "en" ? "TOTAL AMOUNT TO PAY" : "TOTAL NOMINAL YANG HARUS DIBAYAR"}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white select-all">
                      Rp{pendingTx.totalAmount.toLocaleString("id-ID")}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(pendingTx.totalAmount.toString());
                        toast.success(language === "en" ? "Amount copied!" : "Nominal berhasil disalin!");
                      }}
                      className="text-[9px] font-black text-indigo-500 hover:underline uppercase tracking-widest"
                    >
                      [ {language === "en" ? "Copy" : "Salin"} ]
                    </button>
                  </div>
                </div>

                {/* Selected Payment Method Tile */}
                <div className="bg-slate-50 dark:bg-black/25 rounded-2xl p-4 border border-slate-100 dark:border-white/5 flex items-center gap-4">
                  {renderMethodLogo(pendingTx.paymentMethod)}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black block leading-tight text-slate-900 dark:text-white uppercase">
                      {activeMethod.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mt-0.5">
                      {activeMethod.type}
                    </span>
                  </div>
                </div>

                {/* Instructions text */}
                <div className="space-y-2 text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                    {language === "en" ? "INSTRUCTIONS" : "PETUNJUK PEMBAYARAN"}
                  </span>
                  {pendingTx.paymentMethod === "qris" ? (
                    <ul className="list-decimal list-inside space-y-1">
                      <li>{language === "en" ? "Scan the QRIS QR Code using your preferred m-Banking or e-Wallet." : "Pindai Kode QR QRIS menggunakan m-Banking atau e-Wallet pilihan Anda (GoPay, OVO, Dana, LinkAja)."}</li>
                      <li>{language === "en" ? "Confirm the recipient name matches PAKASIR and checkout amount is exact." : "Pastikan nama penerima tertulis PAKASIR dan nominal transfer presisi."}</li>
                      <li>{language === "en" ? "Keep this page open; transaction status will update automatically upon completion." : "Tetap buka halaman ini, status pembayaran akan sinkron secara otomatis setelah sukses."}</li>
                    </ul>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                        <div>
                          <span className="text-[8px] font-black uppercase text-indigo-400 block">
                            {language === "en" ? "VIRTUAL ACCOUNT NUMBER" : "NOMOR REKENING VIRTUAL ACCOUNT"}
                          </span>
                          <strong className="text-sm font-mono text-indigo-650 dark:text-indigo-400 select-all block">
                            {pendingTx.paymentNumber || "883908871632788"}
                          </strong>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(pendingTx.paymentNumber || "883908871632788");
                            toast.success(language === "en" ? "Account number copied!" : "Nomor rekening berhasil disalin!");
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          {language === "en" ? "Copy" : "Salin"}
                        </button>
                      </div>
                      <ul className="list-decimal list-inside space-y-1">
                        <li>
                          {language === "en" 
                            ? "Transfer the precise amount above to the Virtual Account using m-Banking, i-Banking, or ATM." 
                            : "Transfer nominal presisi di atas ke nomor Virtual Account di atas melalui ATM, m-Banking, atau Mobile Banking pilihan Anda."}
                        </li>
                        <li>
                          {language === "en"
                            ? "Confirm the recipient name is PAKASIR and make sure the amount is correct."
                            : "Pastikan nama penerima adalah PAKASIR dan pastikan jumlahnya itu benar."}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
 
              {/* Right Column: Visual QRIS or VA Card details */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                {pendingTx.paymentMethod === "qris" ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="bg-white p-4 rounded-3xl shadow-xl border relative group">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pendingTx.paymentNumber || "")}`} 
                        alt="QRIS Code" 
                        className="w-48 h-48" 
                      />
                      <div className="absolute inset-x-0 bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="bg-black/85 text-[7px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                          Scan with banking or e-wallet
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadQR}
                      className="px-4 py-2 bg-indigo-50 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-white/10 text-indigo-655 dark:text-zinc-200 border border-indigo-150 dark:border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      📥 {language === "en" ? "Download QR Image" : "Unduh Gambar QR"}
                    </button>
                  </div>
                ) : (
                  <div className="w-full max-w-[240px] bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-700/30 rounded-3xl p-5 shadow-2xl relative text-white space-y-8 select-none">
                    {/* Visual Bank Card */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[7px] opacity-60 uppercase font-black tracking-widest block">Bank Payment</span>
                        <strong className="text-md font-black tracking-tight">{activeMethod.name}</strong>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        🏦
                      </div>
                    </div>
 
                    <div className="space-y-1">
                      <span className="text-[7px] opacity-60 uppercase font-black tracking-widest block">Account Number</span>
                      <strong className="text-sm font-mono tracking-widest font-bold">
                        {pendingTx.paymentNumber ? pendingTx.paymentNumber.replace(/(.{4})/g, "$1 ") : "8839 0887 1632 788"}
                      </strong>
                    </div>
 
                    <div className="flex justify-between items-center border-t border-white/10 pt-3">
                      <div>
                        <span className="text-[6px] opacity-40 uppercase font-black tracking-widest block">{language === "en" ? "RECIPIENT" : "PENERIMA"}</span>
                        <span className="text-[8px] font-bold truncate max-w-[120px] block">PAKASIR</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                        VA ACTIVE
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Control Panel (Cancel & Discrete Dev Simulation) */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5 gap-4">
              <button
                disabled={cancellingTx}
                onClick={() => handleCancelCheckout(pendingTx.id)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-655 dark:text-zinc-350 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {cancellingTx ? "Membatalkan..." : "Batalkan Transaksi"}
              </button>

              {/* @ts-expect-error role check */}
              {session?.user?.role === "ADMIN" && (
                <button
                  disabled={simulatingPayment}
                  onClick={() => handleSimulatePayment(pendingTx.id)}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-all flex items-center gap-1 opacity-60 hover:opacity-100"
                  title="Dev Mode Simulation: Mock immediate payment success"
                >
                  🧪 {simulatingPayment ? "Memproses..." : "Mock Success (Dev)"}
                </button>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* 4. Browse Premium Packages */}
      <section id="premium-packages-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-extrabold text-sm uppercase text-slate-450 tracking-widest">
            {language === "en" ? "Choose Premium Plan" : "Pilihan Paket Upgrade"}
          </h2>

          {/* Category Tabs Selector */}
          <div className="flex gap-1 p-1 bg-slate-150 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
            <button
              onClick={() => setActiveCategory("monthly")}
              className={`px-4 py-2 text-[10px] rounded-xl font-black uppercase tracking-wider transition-all ${
                activeCategory === "monthly"
                  ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-555 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              📅 {language === "en" ? "Monthly Plan" : "Langganan Bulanan"}
            </button>
            <button
              onClick={() => setActiveCategory("payg")}
              className={`px-4 py-2 text-[10px] rounded-xl font-black uppercase tracking-wider transition-all ${
                activeCategory === "payg"
                  ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-555 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              ⚡ {language === "en" ? "Top-Up Quota (PAYG)" : "Top-Up Kuota (PAYG)"}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeCategory === "monthly" ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="monthly-tab"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {plans.filter(p => !p.isPayAsYouGo).map(plan => {
                return (
                  <div 
                    key={plan.id}
                    className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 shadow-md p-6 flex flex-col justify-between backdrop-blur-xl relative group hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase truncate">{plan.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{plan.days} Hari Masa Aktif</p>
                      </div>

                      <div className="py-2 flex items-baseline gap-1 border-y border-slate-100 dark:border-white/5">
                        <span className="text-xl sm:text-2xl font-black tracking-tighter text-indigo-650 dark:text-indigo-400">
                          Rp{plan.price.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">/ {plan.id === "FREE" ? (language === "en" ? "forever" : "selamanya") : `${plan.days} hari`}</span>
                      </div>

                      <ul className="space-y-2 text-[11px] font-bold text-slate-655 dark:text-zinc-350">
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faBolt} className="text-indigo-500 text-[10px]" />
                          <span>{plan.maxAssets} Combined Link Assets</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faPaste} className="text-indigo-500 text-[10px]" />
                          <span>{plan.maxPastes} Paste Capacity</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faServer} className="text-indigo-500 text-[10px]" />
                          <span>{plan.maxRooms} Collaboration Rooms</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faGlobe} className="text-indigo-500 text-[10px]" />
                          <span>{plan.maxDomains} Custom Domain Mapping</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faDatabase} className="text-indigo-500 text-[10px]" />
                          <span>
                            {plan.maxStorage}MB {language === "en" ? "Total Storage Space" : "Total Ruang Penyimpanan"}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faDatabase} className="text-indigo-500 text-[10px]" />
                          <span>
                            {plan.maxFileSize}MB {language === "en" ? "Max Size per File" : "Maks. Ukuran per File"}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <button
                      disabled={!!pendingTx}
                      onClick={() => handleCheckoutInit(plan)}
                      className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-white/5 text-white disabled:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {pendingTx ? "Menunggu Pembayaran" : (language === "en" ? "Subscribe Now" : "Pilih Paket")}
                    </button>
                  </div>
                );
              })}

              {plans.filter(p => !p.isPayAsYouGo).length === 0 && (
                <div className="col-span-3 bg-slate-50 dark:bg-black/10 border border-dashed rounded-3xl py-12 text-center w-full">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada paket langganan bulanan yang tersedia saat ini.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="payg-tab"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {plans.filter(p => p.isPayAsYouGo).map(plan => {
                return (
                  <div 
                    key={plan.id}
                    className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-indigo-500/20 dark:border-indigo-500/10 shadow-lg p-6 flex flex-col justify-between backdrop-blur-xl relative group hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
                  >
                    <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-widest border border-indigo-500/30">
                      One-Time Purchase
                    </span>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase truncate">{plan.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{language === "en" ? "Never Expires" : "Masa Aktif Selamanya"}</p>
                      </div>

                      <div className="py-2 flex items-baseline gap-1 border-y border-slate-100 dark:border-white/5">
                        <span className="text-xl sm:text-2xl font-black tracking-tighter text-indigo-650 dark:text-indigo-400">
                          Rp{plan.price.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">/ {language === "en" ? "one-time" : "sekali bayar"}</span>
                      </div>

                      <ul className="space-y-2 text-[11px] font-bold text-slate-655 dark:text-zinc-350">
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faBolt} className="text-indigo-500 text-[10px]" />
                          <span>+{plan.maxAssets} {language === "en" ? "Asset Quota (Forever)" : "Kuota Aset Link (Selamanya)"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faPaste} className="text-indigo-500 text-[10px]" />
                          <span>+{plan.maxPastes} {language === "en" ? "Paste Quota (Forever)" : "Kuota Paste (Selamanya)"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faServer} className="text-indigo-500 text-[10px]" />
                          <span>+{plan.maxRooms} {language === "en" ? "Collab Room Quota (Forever)" : "Kuota Room Kolaborasi (Selamanya)"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faGlobe} className="text-indigo-500 text-[10px]" />
                          <span>+{plan.maxDomains} {language === "en" ? "Custom Domain Quota (Forever)" : "Kuota Custom Domain (Selamanya)"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faDatabase} className="text-indigo-500 text-[10px]" />
                          <span>
                            +{plan.maxStorage}MB {language === "en" ? "Storage Space (Forever)" : "Ruang Penyimpanan (Selamanya)"}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faDatabase} className="text-indigo-500 text-[10px]" />
                          <span>
                            {plan.maxFileSize}MB {language === "en" ? "Max Size per File" : "Maks. Ukuran per File"}
                          </span>
                        </li>
                        <li className="text-[9px] text-slate-400 dark:text-zinc-550 leading-relaxed font-normal italic pt-1.5 border-t border-slate-100 dark:border-white/5">
                          {language === "en" 
                            ? "*These are permanent top-up resources that will be consumed only when your active plan quota is fully used." 
                            : "*Kuota top-up permanen yang tidak hangus, digunakan saat batas kuota bulanan habis."}
                        </li>
                      </ul>
                    </div>

                    <button
                      disabled={!!pendingTx}
                      onClick={() => handleCheckoutInit(plan)}
                      className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-white/5 text-white disabled:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {pendingTx ? "Menunggu Pembayaran" : (language === "en" ? "Top Up Now ⚡" : "Top Up Sekarang ⚡")}
                    </button>
                  </div>
                );
              })}

              {plans.filter(p => p.isPayAsYouGo).length === 0 && (
                <div className="col-span-3 bg-slate-50 dark:bg-black/10 border border-dashed rounded-3xl py-12 text-center w-full">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada paket Top-Up Pay-As-You-Go yang tersedia saat ini.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 5. Checkout Confirmation Modal Overlay */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col"
            >
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5 mb-4 shrink-0">
                <span className="text-xl">💳</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Checkout Invoice</h3>
                  <h4 className="text-sm font-bold truncate uppercase">{selectedPlan.name}</h4>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-650 text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Plan Summary Card */}
                <div className="bg-slate-50 dark:bg-black/25 rounded-2xl p-4 border flex justify-between items-center text-xs font-bold">
                  <div>
                    <span className="text-[8px] font-black text-slate-450 uppercase block">Paket Upgrade</span>
                    <strong className="text-slate-900 dark:text-white uppercase">{selectedPlan.name}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black text-slate-450 uppercase block">Harga Dasar</span>
                    <strong className="text-indigo-500 font-extrabold">Rp{selectedPlan.price.toLocaleString("id-ID")}</strong>
                  </div>
                </div>

                {/* Payment Picker */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Metode Pembayaran</label>
                  
                  <div className="max-h-56 overflow-y-auto pr-1.5 space-y-2 scrollbar-thin scrollbar-thumb-indigo-500/30">
                    {paymentMethodsList.map(method => {
                      const isSelected = paymentMethod === method.id;
                      const feeBreakup = method.id === "qris" 
                        ? calculateQrisDisplay(selectedPlan.price) 
                        : calculateVaDisplay(selectedPlan.price, method.id);
                      
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected 
                              ? "bg-indigo-500/10 border-indigo-500 text-indigo-650 dark:text-indigo-400 shadow-sm" 
                              : "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-400 hover:border-slate-350 dark:hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {renderMethodLogo(method.id)}
                            <div>
                              <span className="text-xs font-black block leading-tight">{method.name}</span>
                              <span className="text-[8px] uppercase tracking-wider opacity-60 block mt-0.5">{method.type}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold block text-indigo-600 dark:text-indigo-400">
                              Rp{feeBreakup.displayPrice.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[8px] opacity-60 block mt-0.5">{method.feeDesc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Math fee breakup */}
                <div className="bg-slate-50 dark:bg-black/25 rounded-2xl p-4 border space-y-1.5 text-[11px] font-bold text-slate-655 dark:text-zinc-350 border-dashed">
                  <div className="flex justify-between">
                    <span>Harga Dasar Paket:</span>
                    <span>Rp{selectedPlan.price.toLocaleString("id-ID")}</span>
                  </div>
                  {paymentMethod === "qris" ? (() => {
                    const { displayPrice, fee } = calculateQrisDisplay(selectedPlan.price);
                    return (
                      <>
                        <div className="flex justify-between text-amber-600 dark:text-amber-400">
                          <span>Biaya Admin:</span>
                          <span>+Rp{fee.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/50 dark:border-white/5 pt-1.5 text-xs text-slate-900 dark:text-white font-extrabold">
                          <span>Total Bayar:</span>
                          <span className="text-indigo-500 font-black">Rp{displayPrice.toLocaleString("id-ID")}</span>
                        </div>
                      </>
                    );
                  })() : (() => {
                    const { displayPrice, fee } = calculateVaDisplay(selectedPlan.price, paymentMethod);
                    return (
                      <>
                        <div className="flex justify-between text-amber-600 dark:text-amber-400">
                          <span>Biaya Admin:</span>
                          <span>+Rp{fee.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/50 dark:border-white/5 pt-1.5 text-xs text-slate-900 dark:text-white font-extrabold">
                          <span>Total Bayar:</span>
                          <span className="text-indigo-500 font-black">Rp{displayPrice.toLocaleString("id-ID")}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2.5 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-655 dark:text-zinc-350 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleProcessCheckout}
                  disabled={checkoutLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1.5 animate-shimmer"
                >
                  {checkoutLoading ? "Membuat Order..." : "Konfirmasi Checkout"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plan Change Confirmation Modal Overlay */}
      <AnimatePresence>
        {planToConfirmChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col"
            >
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5 mb-4 shrink-0">
                <span className="text-xl text-amber-500">⚠️</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Konfirmasi Ganti Paket</h3>
                  <h4 className="text-sm font-bold truncate uppercase">Ubah Langganan</h4>
                </div>
                <button
                  onClick={() => setPlanToConfirmChange(null)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-650 text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs font-semibold leading-relaxed text-slate-700 dark:text-zinc-200">
                  <p>
                    Anda akan mengubah paket dari <strong className="text-indigo-650 dark:text-indigo-400 uppercase">{currentPlan?.name}</strong> menjadi <strong className="text-indigo-650 dark:text-indigo-400 uppercase">{planToConfirmChange.name}</strong>.
                  </p>
                  <p className="mt-3 text-rose-550 dark:text-rose-450 font-black">
                    ⚠️ PENTING: Sisa hari masa aktif paket Anda saat ini akan dianggap hangus. Paket baru akan aktif segera selama {planToConfirmChange.days} hari ke depan setelah pembayaran diselesaikan.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2.5 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setPlanToConfirmChange(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-655 dark:text-zinc-350 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmPlanChange}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Transactions Billing History */}
      <section className="bg-white dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm font-bold shadow-inner">
            <FontAwesomeIcon icon={faHistory} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">Riwayat Transaksi</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Log pembayaran paket premium Anda</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="bg-slate-50 dark:bg-black/30 border-b border-slate-200 dark:border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-3 py-2.5">Paket</th>
                <th className="px-3 py-2.5">Metode</th>
                <th className="px-3 py-2.5">Total Bayar</th>
                <th className="px-3 py-2.5">Tanggal</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-zinc-350">
              {history.map(tx => (
                <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="hover:bg-indigo-50/20 dark:hover:bg-white/5 cursor-pointer transition-all select-none">
                  <td className="px-4 py-3 font-mono text-[10px] text-indigo-600 dark:text-indigo-400">{tx.id}</td>
                  <td className="px-3 py-3 text-slate-900 dark:text-white uppercase">{tx.plan?.name || tx.planId}</td>
                  <td className="px-3 py-3 uppercase">{tx.paymentMethod.replace("_va", "")}</td>
                  <td className="px-3 py-3 font-bold text-slate-900 dark:text-white">Rp{tx.totalAmount.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-3 font-mono text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      tx.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" :
                      tx.status === "PENDING" ? "bg-amber-500/10 text-amber-500 animate-pulse" :
                      tx.status === "CANCELED" ? "bg-red-500/10 text-red-500" : "bg-slate-500/10 text-slate-500"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 uppercase font-bold tracking-widest text-[9px]">
                    Belum Ada Riwayat Transaksi Langganan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Transaction Details Modal Overlay */}
      <AnimatePresence>
        {selectedTx && (() => {
          const activeMethod = paymentMethodsList.find(m => m.id === selectedTx.paymentMethod) || { 
            name: selectedTx.paymentMethod.replace("_va", "").toUpperCase(), 
            logo: "", 
            type: "Payment Method" 
          };
          const invoiceDate = new Date(selectedTx.createdAt).toLocaleString(language === "en" ? "en-US" : "id-ID", { dateStyle: "long", timeStyle: "short" });

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5 mb-4 shrink-0">
                  <span className="text-xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {language === "en" ? "TRANSACTION DETAILS" : "RINCIAN TRANSAKSI"}
                    </h3>
                    <h4 className="text-xs font-mono truncate text-slate-500">#{selectedTx.id}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-650 text-xs font-bold transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content */}
                <div className="space-y-4 text-xs font-bold">
                  {/* Status Badge Block */}
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-black/25 rounded-2xl p-3 border border-slate-100 dark:border-white/5">
                    <span className="text-slate-500 dark:text-zinc-400">Status Pembayaran:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      selectedTx.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" :
                      selectedTx.status === "PENDING" ? "bg-amber-500/10 text-amber-500 animate-pulse" :
                      "bg-red-500/10 text-red-500"
                    }`}>
                      {selectedTx.status}
                    </span>
                  </div>

                  {/* Transaction info rows */}
                  <div className="bg-slate-50 dark:bg-black/25 rounded-2xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-wider">Paket Langganan:</span>
                      <span className="text-slate-900 dark:text-white uppercase font-extrabold">{selectedTx.plan?.name || selectedTx.planId}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200/40 dark:border-white/5 pt-2.5">
                      <span className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-wider">Tanggal Transaksi:</span>
                      <span className="text-slate-700 dark:text-zinc-350 font-mono text-[10px]">{invoiceDate}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200/40 dark:border-white/5 pt-2.5">
                      <span className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-wider">Metode Pembayaran:</span>
                      <div className="flex items-center gap-2">
                        {renderMethodLogo(selectedTx.paymentMethod)}
                        <span className="text-slate-750 dark:text-zinc-350 uppercase">{activeMethod.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing breakup */}
                  <div className="bg-slate-50 dark:bg-black/25 rounded-2xl p-4 border border-slate-100 dark:border-white/5 space-y-2 border-dashed">
                    <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                      <span>Harga Dasar Paket:</span>
                      <span>Rp{selectedTx.targetAmount.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                      <span>Biaya Admin:</span>
                      <span>+Rp{selectedTx.feeAmount.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/50 dark:border-white/5 pt-2.5 text-sm text-slate-900 dark:text-white font-extrabold">
                      <span>Total Pembayaran:</span>
                      <span className="text-indigo-500 font-black">Rp{selectedTx.totalAmount.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2.5 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedTx(null)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-655 dark:text-zinc-350 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    {language === "en" ? "Close" : "Tutup"}
                  </button>

                  {selectedTx.status === "COMPLETED" && (
                    <button
                      onClick={() => handlePrintInvoice(selectedTx)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                    >
                      🖨️ {language === "en" ? "Print Invoice" : "Cetak Invoice"}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
