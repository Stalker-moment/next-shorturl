"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLink,
  faSignOutAlt,
  faShieldAlt,
  faTree,
  faUser,
  faQrcode,
  faTachometerAlt,
  faSpinner,
  faCheckCircle,
  faBolt,
  faFileCode,
  faGlobe,
  faCode,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isStudioPage =
    pathname === "/manage/biolink" || pathname?.endsWith("/edit");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { t, language } = useLanguage();
  const [profileData, setProfileData] = useState<any>(null);
  const [isQuotaExpanded, setIsQuotaExpanded] = useState(false);

  const now = new Date();
  const expiryDate = profileData?.planExpiredAt ? new Date(profileData.planExpiredAt) : null;
  const isExpiringSoon = expiryDate && profileData?.planId !== "FREE"
    ? (expiryDate.getTime() > now.getTime() && (expiryDate.getTime() - now.getTime()) <= 3 * 24 * 60 * 60 * 1000) 
    : false;

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // @ts-expect-error user id
      const userId = session.user.id;
      fetch(`/api/user/profile?userId=${userId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) setProfileData(json.data);
        })
        .catch((err) => console.error("Gagal mengambil data profil:", err));
    }
  }, [status, session]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let headerVisible = true;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shouldShow = !(currentScrollY > lastScrollY && currentScrollY > 60);
      if (shouldShow !== headerVisible) {
        headerVisible = shouldShow;
        setIsHeaderVisible(shouldShow);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setIsHeaderVisible(true);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
            <FontAwesomeIcon
              icon={faSpinner}
              className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin"
            />
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
            {t("overview.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Prevent rendering children if unauthenticated entirely (prevent flash)
  if (status === "unauthenticated") {
    return null;
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-10 sm:mb-12 px-2">
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
          <FontAwesomeIcon icon={faLink} className="text-white text-lg" />
        </div>
        <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white">
          nyoo<span className="text-violet-500">.me</span>
        </span>
      </div>

      <nav className="flex-grow space-y-2">
        {[
          {
            icon: faTachometerAlt,
            label: t("nav.overview"),
            href: "/manage",
            active: pathname === "/manage",
          },
          {
            icon: faTree,
            label: t("nav.biolink"),
            href: "/manage/biolink",
            active: pathname?.startsWith("/manage/biolink"),
          },
          {
            icon: faQrcode,
            label: t("nav.qrcode"),
            href: "/manage/qrcodes",
            active: pathname?.startsWith("/manage/qrcodes"),
          },
          {
            icon: faFileCode,
            label: "Pastebin",
            href: "/manage/pastebin",
            active: pathname?.startsWith("/manage/pastebin"),
            comingSoon: false,
          },
          {
            icon: faGlobe,
            label: "Custom DNS",
            href: "/manage/dns",
            active: pathname?.startsWith("/manage/dns"),
          },
          {
            icon: faFolderOpen,
            label: language === "id" ? "Penyimpanan File" : "File Storage",
            href: "/manage/files",
            active: pathname?.startsWith("/manage/files"),
          },
          {
            icon: faCode,
            label: "Developer API",
            href: "/manage/api",
            active: pathname?.startsWith("/manage/api"),
          },
          {
            icon: faBolt,
            label: language === "id" ? "Billing & Paket" : "Billing & Plans",
            href: "/manage/billing",
            active: pathname === "/manage/billing",
          },
          {
            icon: faUser,
            label: t("nav.profile"),
            href: t("nav.profile"),
            hrefUrl: "/manage/profile",
            active: pathname?.startsWith("/manage/profile"),
          },
        ].map((item: any, idx) => (
          <Link
            key={idx}
            href={item.hrefUrl || item.href}
            className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${item.active ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" : "text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <div className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={item.icon}
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${item.active ? "text-white" : ""}`}
              />
              <span>{item.label}</span>
            </div>
            {item.comingSoon && (
              <span className="text-[8px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/20 select-none scale-90 origin-right transition-all group-hover:bg-amber-500 group-hover:text-white dark:group-hover:text-slate-900 duration-200">
                Soon
              </span>
            )}
          </Link>
        ))}

        {/* @ts-expect-error role check */}
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/manage/admin"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group mt-4 ${pathname?.startsWith("/manage/admin") ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/50" : "text-red-500/80 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"}`}
          >
            <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4" />
            {t("nav.admin")}
          </Link>
        )}
      </nav>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        {(() => {
          const activePlanName = profileData?.plan?.name || "Free Plan";
          const maxAssets = profileData?.plan?.maxAssets || 100;
          const totalAssets = profileData?.stats?.totalAssets || 0;
          const assetsPercent = Math.min(100, Math.round((totalAssets / maxAssets) * 100));

          const maxPastes = profileData?.plan?.maxPastes || 20;
          const totalPastes = profileData?.stats?.pastesCount || 0;
          const pastesPercent = Math.min(100, Math.round((totalPastes / maxPastes) * 100));

          const maxRooms = profileData?.plan?.maxRooms || 1;
          const totalRooms = profileData?.stats?.roomsCount || 0;
          const roomsPercent = Math.min(100, Math.round((totalRooms / maxRooms) * 100));

          const maxDomains = profileData?.plan?.maxDomains || 1;
          const totalDomains = profileData?.stats?.domainsCount || 0;
          const domainsPercent = Math.min(100, Math.round((totalDomains / maxDomains) * 100));

          const maxStorageMB = profileData?.plan?.maxStorage || 500;
          const usedStorageBytes = profileData?.stats?.usedStorage || 0;
          const usedStorageMB = usedStorageBytes / (1024 * 1024);
          const storagePercent = Math.min(100, Math.round((usedStorageMB / maxStorageMB) * 100));

          return (
            <div className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 mb-4 shadow-sm transition-all duration-300">
              {/* Header: Clickable to toggle */}
              <div 
                onClick={() => setIsQuotaExpanded(!isQuotaExpanded)}
                className="flex items-center justify-between pb-2 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                    <FontAwesomeIcon icon={faBolt} className="w-3 h-3 animate-pulse" />
                  </div>
                  <p className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                    <span>{language === "id" ? "Batas Kuota" : "Quota Limits"}</span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono transition-transform duration-255">
                      {isQuotaExpanded ? "▲" : "▼"}
                    </span>
                  </p>
                </div>
                <span className="text-[8px] font-black uppercase text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md shrink-0">
                  {activePlanName}
                </span>
              </div>

              {/* AnimatePresence + motion.div for expandable/collapsible details */}
              <AnimatePresence initial={false} mode="wait">
                {!isQuotaExpanded ? (
                  /* Collapsed View: Single combined asset bar */
                  <motion.div
                    key="collapsed"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 overflow-hidden mt-3"
                  >
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${assetsPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1">
                      <p className="tracking-tight">
                        {language === "id" ? "Terpakai" : "Used"}{" "}
                        <b className="text-slate-700 dark:text-slate-200">{assetsPercent}%</b>{" "}
                        {language === "id" ? "dari" : "of"} {maxAssets.toLocaleString()} limit
                      </p>
                      <Link 
                        href="/manage/billing" 
                        className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-0.5 font-extrabold"
                      >
                        {language === "id" ? "Kelola" : "Manage"} ↗
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  /* Expanded View: All 4 categories */
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/80"
                  >
                    <div className="space-y-3">
                      {/* Category 1: Assets */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{language === "id" ? "Aset Tautan" : "Link Assets"}</span>
                          <span className="font-mono text-[9px]">{totalAssets}/{maxAssets}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${assetsPercent}%` }} />
                        </div>
                      </div>

                      {/* Category 2: Pastebin */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{language === "id" ? "Kapasitas Paste" : "Pastes"}</span>
                          <span className="font-mono text-[9px]">{totalPastes}/{maxPastes}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pastesPercent}%` }} />
                        </div>
                      </div>

                      {/* Category 3: Rooms */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{language === "id" ? "Kolaborasi" : "Collab Rooms"}</span>
                          <span className="font-mono text-[9px]">{totalRooms}/{maxRooms}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${roomsPercent}%` }} />
                        </div>
                      </div>

                      {/* Category 4: Custom DNS */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{language === "id" ? "Subdomain Custom" : "Custom DNS"}</span>
                          <span className="font-mono text-[9px]">{totalDomains}/{maxDomains}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${domainsPercent}%` }} />
                        </div>
                      </div>

                      {/* Category 5: File Storage */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{language === "id" ? "Penyimpanan File" : "File Storage"}</span>
                          <span className="font-mono text-[9px]">{usedStorageMB.toFixed(1)}/{maxStorageMB} MB</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${storagePercent}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Premium action billing footer */}
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/80">
                      <Link 
                        href="/manage/billing"
                        className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-650 text-white rounded-xl font-extrabold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-violet-500/10"
                      >
                        <span>{language === "id" ? "Detail Billing" : "Billing Details"}</span>
                        <span>⚡</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        <div className="flex gap-2.5 w-full mt-2 items-center">
          <ThemeToggle />
          <LanguageToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex-1 justify-center flex items-center gap-2 px-2 py-3 h-10 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group"
          >
            <FontAwesomeIcon
              icon={faSignOutAlt}
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            />
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-500/30 relative transition-colors duration-300">
      {/* Background Blobs (Soft) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/5 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      <div className="flex relative z-10 w-full min-h-screen">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {showMobileMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileMenu(false)}
                className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-[101] w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 lg:hidden shadow-2xl"
              >
                {/* Scrollable Container Wrapper */}
                <div className="flex-1 overflow-y-auto scrollbar-none p-6 pb-20 relative flex flex-col h-full w-full">
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors z-[110]"
                  >
                    ✕
                  </button>
                  <SidebarContent />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar (FIXED) */}
        <aside className="hidden lg:flex fixed left-0 top-0 w-72 h-screen flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 z-[60] overflow-y-auto scrollbar-none shadow-sm">
          <SidebarContent />
        </aside>

        {/* Main Content Area - Compensate Sidebar Width */}
        <main className="flex-1 w-full min-w-0 lg:ml-72 px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 min-h-screen flex flex-col relative">
          {/* Header for Mobile - Sticky with Expand/Collapse feel */}
          <header
            className={`lg:hidden sticky top-4 z-[50] w-full px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between mb-8 shrink-0 transition-all duration-300 transform shadow-md shadow-slate-200/50 dark:shadow-none ${isHeaderVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
            style={{ backfaceVisibility: "hidden", willChange: "transform" }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
              >
                <div className="space-y-1.5 flex flex-col items-start translate-x-[-1px]">
                  <div className="w-5 h-0.5 bg-current rounded-full" />
                  <div className="w-5 h-0.5 bg-current rounded-full" />
                  <div className="w-3 h-0.5 bg-current rounded-full" />
                </div>
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-600/20">
                  <FontAwesomeIcon
                    icon={faLink}
                    className="text-white text-[10px]"
                  />
                </div>
                <span className="font-black text-lg tracking-tighter text-slate-900 dark:text-white leading-none">
                  nyoo.me
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <LanguageToggle />
              <Link
                href="/manage/profile"
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 overflow-hidden active:scale-95 transition-all shrink-0"
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500">
                    <FontAwesomeIcon icon={faUser} className="text-xs" />
                  </div>
                )}
              </Link>
            </div>
          </header>

          {/* Plan Expiring Soon Warning Banner */}
          {isExpiringSoon && expiryDate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-400 font-bold backdrop-blur-md relative overflow-hidden"
            >
              {/* Decorative pulsing blur background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center gap-2.5 relative z-10 text-left">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-bounce shrink-0">
                  ⚠️
                </div>
                <p className="leading-relaxed">
                  {language === "id"
                    ? `Paket premium Anda (${profileData.plan?.name || profileData.planId}) akan berakhir dalam waktu dekat pada ${expiryDate.toLocaleDateString("id-ID", { dateStyle: "medium" })}.`
                    : `Your premium plan (${profileData.plan?.name || profileData.planId}) is expiring soon on ${expiryDate.toLocaleDateString("en-US", { dateStyle: "medium" })}.`}
                </p>
              </div>

              <Link
                href="/manage/billing"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0 relative z-10 font-sans"
              >
                {language === "id" ? "Perbarui Sekarang ⚡" : "Renew Now ⚡"}
              </Link>
            </motion.div>
          )}

          <div className="flex-1 w-full">{children}</div>

          {/* Friendly Footer */}
          {!isStudioPage && (
            <footer className="mt-auto py-8 sm:py-10 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 text-slate-500 dark:text-slate-400 shrink-0 max-w-full relative z-10">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-emerald-500 w-4 h-4"
                />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {t("footer.status")}
                </p>
              </div>
              <div className="flex gap-6 text-xs font-bold flex-wrap justify-center items-center">
                <Link
                  href="/guide"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  {t("footer.guide")}
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  {t("footer.terms")}
                </Link>
                <Link
                  href="/"
                  className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  {t("footer.home")}
                </Link>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>
                <Link
                  href="/report"
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors font-black"
                >
                  {language === "id" ? "Laporkan Abuse" : "Report Abuse"}
                </Link>
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
