"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
 faUser, 
 faEnvelope, 
 faCalendarAlt, 
 faChartBar, 
 faLink, 
 faEye,
 faCamera,
 faCheckCircle,
 faSave,
 faTshirt,
 faEyeSlash,
 faLock,
 faKey,
 faExclamationTriangle,
 faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";
import GoogleSignInButton from "@/components/GoogleSignInButton";

interface UserStats {
 totalShortlinks: number;
 totalBiolinkAssets: number;
 totalViews: number;
 hasBiolink: boolean;
}

interface UserProfile {
 id: string;
 name: string;
 email: string;
 image: string | null;
 role: string;
 googleLinked: boolean;
 hasPassword: boolean;
 createdAt: string;
 stats: UserStats;
}

function ProfilePageContent() {
 const { status, update: updateSession } = useSession();
 const router = useRouter();
 const searchParams = useSearchParams();
 const linkParam = searchParams.get("link");
 const errorParam = searchParams.get("error");
 const { language, t } = useLanguage();

 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 
 // Google OAuth States
 const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);

 // Password Management Form States
 const [currentPassword, setCurrentPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showCurrentPassword, setShowCurrentPassword] = useState(false);
 const [showNewPassword, setShowNewPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [isSavingPassword, setIsSavingPassword] = useState(false);

 // Form States
 const [newName, setNewName] = useState("");
 const [uploadingImage, setUploadingImage] = useState(false);

 // Cropper States
 const [imageSrc, setImageSrc] = useState<string | null>(null);
 const [crop, setCrop] = useState({ x: 0, y: 0 });
 const [zoom, setZoom] = useState(1);
 const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

 const fetchProfile = useCallback(async () => {
 try {
 const res = await fetch(`/api/user/profile`);
 const json = await res.json();
 if (res.ok) {
 setProfile(json.data);
 setNewName(json.data.name || "");
 }
 } catch (e) {
 console.error(e);
 toast.error(t("profile.toast.load_fail"));
 } finally {
 setIsLoading(false);
 }
 }, [t]);

  useEffect(() => {
    if (status === "authenticated") fetchProfile();
    else if (status === "unauthenticated") router.push("/login");
  }, [status, fetchProfile, router]);

  // If this window is a Google login popup, notify parent and close
  useEffect(() => {
    if (typeof window !== "undefined" && window.opener && window.name === "google-login-popup") {
      const searchParams = new URLSearchParams(window.location.search);
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
  }, []);

  // Listen for authentication messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        toast.success(t("profile.google.toast_link_success"));
        fetchProfile();
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        toast.error(decodeURIComponent(event.data.error));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchProfile, t]);

  const handleGoogleLinkSuccess = () => {
    toast.success(t("profile.google.toast_link_success"));
    fetchProfile();
    updateSession({ googleLinked: true });
  };

  const handleGoogleLinkError = (msg: string) => {
    toast.error(msg);
  };

  const handleUnlinkGoogle = async () => {
    if (!profile) return;
    if (!profile.hasPassword) {
      toast.error(t("profile.google.err_unlink_no_pass"));
      return;
    }
    
    setIsUnlinkingGoogle(true);
    try {
      const res = await fetch("/api/user/unlink-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(t("profile.google.toast_unlink_success"));
        setProfile({ ...profile, googleLinked: false });
        await updateSession({ googleLinked: false });
      } else {
        toast.error(data.error || t("profile.toast.sys_error"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("profile.toast.sys_error"));
    } finally {
      setIsUnlinkingGoogle(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!profile) return;
    if (!newPassword || !confirmPassword) {
      toast.error(t("profile.password.toast_mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("profile.password.toast_length"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.password.toast_mismatch"));
      return;
    }
    if (profile.hasPassword && !currentPassword) {
      toast.error(t("profile.password.label_current"));
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: profile.hasPassword ? currentPassword : "",
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(t("profile.password.toast_success"));
        setProfile({ ...profile, hasPassword: true });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || t("profile.toast.sys_error"));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("profile.toast.sys_error"));
    } finally {
      setIsSavingPassword(false);
    }
  };

 const handleUpdateName = async () => {
 if (!profile || !newName.trim()) return;
 setIsSaving(true);
 try {
 const res = await fetch("/api/user/profile", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: profile.id, name: newName })
 });
 if (res.ok) {
  toast.success(t("profile.toast.save_success"));
  setProfile({ ...profile, name: newName });
  // Update next-auth session
  await updateSession({ name: newName });
 } else {
  toast.error(t("profile.toast.save_fail"));
 }
 } catch (e) {
 console.error(e);
 toast.error(t("profile.toast.sys_error"));
 } finally {
 setIsSaving(false);
 }
 };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !profile) return;

    setUploadingImage(true);
    try {
      const base64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // 1. Upload image
      const uploadRes = await fetch("/api/user/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, userId: profile.id })
      });
      const uploadJson = await uploadRes.json();
      
      if (uploadRes.ok) {
        const imageUrl = uploadJson.url;
        // 2. Update user profile with new image URL
        const updateRes = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.id, image: imageUrl })
        });
        
        if (updateRes.ok) {
          setProfile({ ...profile, image: imageUrl });
          await updateSession({ image: imageUrl });
          toast.success(t("profile.toast.upload_success"));
          setImageSrc(null); // Close modal
        } else {
          toast.error(t("profile.toast.upload_fail"));
        }
      } else {
        toast.error(t("profile.toast.upload_fail"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("profile.toast.upload_fail"));
    } finally {
      setUploadingImage(false);
    }
  };

 if (isLoading) {
 return (
  <div className="w-full flex items-center justify-center py-40 opacity-50">
  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
 );
 }

 if (!profile) return null;

 return (
  <div className="w-full animate-fade-in text-slate-900 dark:text-white selection:bg-indigo-500/30 flex justify-center relative font-sans">
    {/* Background Glow Ambience */}
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 dark:bg-violet-600/5 rounded-full blur-[140px] pointer-events-none" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

    <div className="w-full max-w-6xl relative z-10 space-y-6 md:space-y-8 pb-16">

      {/* Profile Header Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Avatar + Identity */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full md:w-auto">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-0.5 shadow-lg">
              <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-950 overflow-hidden relative">
                {profile.image ? (
                  <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <FontAwesomeIcon icon={faUser} className="text-3xl text-slate-400" />
                  </div>
                )}
                <label className="absolute inset-0 bg-violet-600/80 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                  <FontAwesomeIcon icon={faCamera} className="text-white text-base mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t("profile.avatar.hover")}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-600 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-[10px]" />
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate leading-tight">{profile.name}</h1>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-wider border border-violet-500/20 self-center">
                {profile.role}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold truncate leading-none">{profile.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1 text-slate-400 dark:text-slate-500">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
              <span className="text-xs font-semibold">
                {language === 'id' ? 'Bergabung' : 'Joined'} {new Date(profile.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center w-full md:w-auto md:justify-end shrink-0">
          {[
            { label: 'Links', value: profile.stats.totalShortlinks, icon: faLink, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
            { label: 'Biolinks', value: profile.stats.totalBiolinkAssets, icon: faTshirt, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
            { label: language === 'id' ? 'Tayangan' : 'Views', value: profile.stats.totalViews, icon: faEye, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-[120px] sm:min-w-[140px] shadow-sm hover:scale-[1.02] hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${s.color}`}>
                <FontAwesomeIcon icon={s.icon} className="text-sm" />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{s.value.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

        {/* Left: Account Settings + Google */}
        <div className="space-y-6 md:space-y-8">
          {/* Account Settings */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-3xl shadow-sm p-6 sm:p-8">
            <h4 className="text-xs sm:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{t("profile.section.account")}</h4>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-400 ml-0.5">{t("profile.label.name")}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-violet-500 transition-colors">
                    <FontAwesomeIcon icon={faUser} className="text-xs" />
                  </div>
                  <input type="text" placeholder={t("profile.placeholder.name")} value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-500/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5 opacity-70">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-400 ml-0.5">{t("profile.label.email")}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                  </div>
                  <input type="email" value={profile.email} readOnly
                    className="w-full bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-550 outline-none cursor-not-allowed" />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-0.5">{t("profile.desc.email")}</p>
              </div>
              <button onClick={handleUpdateName} disabled={isSaving || !newName.trim() || newName === profile.name}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-550 active:scale-[0.99] disabled:opacity-40 text-white rounded-2xl text-sm font-extrabold transition-all shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2">
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (<><FontAwesomeIcon icon={faSave} className="text-xs" /><span>{t("profile.btn.save")}</span></>)}
              </button>
            </div>
          </div>

          {/* Google Connection */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-3xl shadow-sm p-6 sm:p-8">
            <h4 className="text-xs sm:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{t("profile.google.title")}</h4>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-slate-150 dark:border-slate-800/80">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 block">Google OAuth</span>
                  <span className={`text-xs font-bold uppercase tracking-wider block mt-0.5 ${profile.googleLinked ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {profile.googleLinked ? (language === 'id' ? '✓ Tertaut' : '✓ Linked') : (language === 'id' ? 'Belum tertaut' : 'Not linked')}
                  </span>
                </div>
              </div>
              {profile.googleLinked ? (
                <button onClick={handleUnlinkGoogle} disabled={isUnlinkingGoogle || !profile.hasPassword}
                  className="px-4 py-2.5 text-xs sm:text-sm font-extrabold text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer shrink-0">
                  {isUnlinkingGoogle ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> : t("profile.google.btn_unlink")}
                </button>
              ) : (
                <div className="w-full sm:w-auto sm:max-w-[200px] shrink-0">
                  <GoogleSignInButton mode="link" onSuccess={handleGoogleLinkSuccess} onError={handleGoogleLinkError} />
                </div>
              )}
            </div>
            {profile.googleLinked && !profile.hasPassword && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 text-xs mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-relaxed">{t("profile.google.err_unlink_no_pass")}</p>
              </div>
            )}
            {!profile.googleLinked && (
              <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-slate-500">{t("profile.google.unlinked_desc")}</p>
            )}
          </div>
        </div>

        {/* Right: Password + Sync */}
        <div className="space-y-6 md:space-y-8">
          {/* Password Management Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-3xl shadow-sm p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 dark:bg-violet-600/[0.02] blur-xl pointer-events-none" />
            <h4 className="text-xs sm:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              {profile.hasPassword ? t("profile.password.title_change") : t("profile.password.title_set")}
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-450 dark:text-slate-500 mb-6 leading-relaxed">
              {profile.hasPassword ? t("profile.password.desc_change") : t("profile.password.desc_set")}
            </p>

            <div className="space-y-5">
              {/* Current password (only if has password) */}
              {profile.hasPassword && (
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-0.5">{t("profile.password.label_current")}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-violet-500 transition-colors">
                      <FontAwesomeIcon icon={faKey} className="text-xs" />
                    </div>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder={t("profile.password.placeholder_current")}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-50/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-10 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-500/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-650 transition-colors cursor-pointer">
                      <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-0.5">{t("profile.password.label_new")}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-violet-500 transition-colors">
                    <FontAwesomeIcon icon={faLock} className="text-xs" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t("profile.password.placeholder_new")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-10 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-500/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-650 transition-colors cursor-pointer">
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-0.5">{t("profile.password.label_confirm")}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-violet-500 transition-colors">
                    <FontAwesomeIcon icon={faLock} className="text-xs" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("profile.password.placeholder_confirm")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-10 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-500/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-650 transition-colors cursor-pointer">
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleUpdatePassword}
                disabled={isSavingPassword || !newPassword.trim() || !confirmPassword.trim() || (profile.hasPassword && !currentPassword.trim())}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-550 active:scale-[0.99] disabled:opacity-40 text-white rounded-2xl text-sm font-extrabold transition-all shadow-md shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-3"
              >
                {isSavingPassword ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="text-xs" />
                    <span>{t("profile.password.btn_submit")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sync Notice — expanded */}
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800 backdrop-blur-xl p-5 sm:p-6 rounded-3xl flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faChartBar} className="text-sm animate-pulse" />
            </div>
            <div className="min-w-0">
              <h5 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">{t("profile.sync.title")}</h5>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mt-1">{t("profile.sync.desc")}</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* Cropper Modal */}
    <AnimatePresence>
      {imageSrc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {language === 'en' ? 'Crop Profile Picture' : 'Potong Foto Profil'}
              </h3>
            </div>
            <div className="relative w-full h-72 bg-slate-100 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-12">{language === 'en' ? 'Zoom' : 'Perbesar'}</span>
                <input type="range" value={zoom} min={1} max={3} step={0.05} aria-label="Zoom" onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-violet-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
              <button type="button" onClick={() => setImageSrc(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button type="button" onClick={handleCropSave} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-xs shadow-md shadow-violet-500/20 transition-all active:scale-[0.98] cursor-pointer">
                {language === 'en' ? 'Apply Crop' : 'Terapkan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
);
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center py-40 opacity-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
