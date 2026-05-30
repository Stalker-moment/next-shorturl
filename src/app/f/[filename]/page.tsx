"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFile,
  faFilePdf,
  faFileImage,
  faFileVideo,
  faFileAudio,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faCopy,
  faSpinner,
  faCalendarAlt,
  faHdd,
  faArrowLeft,
  faCode,
  faGlobe,
  faPlay,
  faPause,
  faLock,
  faUnlockAlt,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888";

export default function FilePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isId = language === "id";

  const filename = params?.filename as string;

  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"direct" | "html" | "markdown">("direct");

  // Password protect states
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  
  // Audio Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Dictionary
  const dict = {
    back: isId ? "Kembali" : "Back",
    loadingText: isId ? "Memuat pratinjau berkas..." : "Loading file preview...",
    notFoundTitle: isId ? "Berkas Tidak Ditemukan 🔍" : "File Not Found 🔍",
    notFoundDesc: isId
      ? "Maaf, berkas yang Anda cari tidak ditemukan atau telah dihapus."
      : "Sorry, the file you are looking for was not found or has been deleted.",
    errorTitle: isId ? "Terjadi Kesalahan 🚫" : "An Error Occurred 🚫",
    errorDesc: isId ? "Gagal mengambil data pratinjau file." : "Failed to retrieve file preview data.",
    fileTitle: isId ? "Detail Berkas" : "File Details",
    downloadBtn: isId ? "Unduh Aman (Secure)" : "Secure Download",
    downloadCount: isId ? "Ukuran File" : "File Size",
    uploadedDate: isId ? "Tanggal Unggah" : "Uploaded At",
    fileType: isId ? "Tipe Berkas" : "File Type",
    embedTitle: isId ? "Kode Sematan (Embed Code)" : "Embed Code Templates",
    embedHtml: isId ? "Kode HTML" : "HTML Sematan",
    embedMarkdown: isId ? "Kode Markdown" : "Markdown Sematan",
    directLink: isId ? "Link CDN Langsung" : "Direct CDN Link",
    copiedToast: isId ? "Berhasil disalin ke papan klip!" : "Copied successfully to clipboard!",
    copiedDesc: isId ? "Tempel di mana saja Anda inginkan." : "Paste it anywhere you want.",
  };

  const fetchFileInfo = async (providedPassword?: string) => {
    if (!filename) return;
    setError(null);
    setPasswordError("");

    try {
      const passwordQuery = providedPassword ? `?password=${encodeURIComponent(providedPassword)}` : "";
      const res = await fetch(`${BACKEND_URL}/api/files/info/${filename}${passwordQuery}`);
      
      if (res.status === 401) {
        const json = await res.json();
        if (json.requiresPassword) {
          setRequiresPassword(true);
          if (providedPassword) {
            setPasswordError(isId ? "Sandi yang dimasukkan salah." : "The password you entered is incorrect.");
          }
          return;
        }
      }

      if (res.status === 410) {
        setError("expired");
        return;
      }

      if (!res.ok) {
        if (res.status === 404) {
          setError("not_found");
        } else {
          setError("server_error");
        }
        return;
      }

      const json = await res.json();
      if (json.success) {
        setFile(json.file);
        setRequiresPassword(false);
        if (providedPassword) {
          setVerifiedPassword(providedPassword);
        }
      } else {
        setError("server_error");
      }
    } catch (err) {
      console.error("Fetch file error:", err);
      setError("server_error");
    } finally {
      setLoading(false);
      setIsSubmittingPassword(false);
    }
  };

  useEffect(() => {
    fetchFileInfo();
  }, [filename]);

  // Audio events hook
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [file]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-6 text-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 animate-pulse mb-6">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
        <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-350">{dict.loadingText}</h3>
      </div>
    );
  }

  // 1. Check if the file is expired (410 Status)
  if (error === "expired") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-amber-100 dark:border-amber-950 shadow-2xl shadow-amber-500/10">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100 dark:border-amber-900/30">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            {isId ? "Tautan Telah Kedaluwarsa ⏳" : "Link Has Expired ⏳"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-8">
            {isId
              ? "Maaf, berkas yang Anda cari telah mencapai batas waktu penyimpanan kustom atau disetel untuk dihapus secara otomatis."
              : "Sorry, the file you are looking for has reached its custom storage expiry time or was set to auto-delete."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-violet-600/20"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            {isId ? "Kembali ke Beranda" : "Back to Home"}
          </button>
        </div>
      </div>
    );
  }

  // 2. Check if password is required (401 requiresPassword)
  if (requiresPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative">
          <div className="w-20 h-20 bg-violet-55/10 dark:bg-violet-950/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-violet-100 dark:border-violet-900/30">
            <FontAwesomeIcon icon={faLock} className="w-8 h-8 text-violet-600 dark:text-violet-450" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            {isId ? "Berkas Terproteksi Sandi 🔒" : "Password Protected File 🔒"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-6">
            {isId
              ? "Unggahan berkas ini dilindungi oleh kata sandi pemilik. Silakan masukkan kata sandi yang benar untuk membuka akses pratinjau dan unduhan."
              : "This file upload is protected by the owner's custom password. Please enter the correct password to unlock preview and download access."}
          </p>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmittingPassword(true);
              fetchFileInfo(password);
            }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                type="password"
                required
                placeholder={isId ? "Masukkan kata sandi berkas..." : "Enter file password..."}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all text-center animate-in fade-in"
                autoFocus
              />
            </div>
            
            {passwordError && (
              <p className="text-red-500 text-[11px] font-bold text-center mt-1">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmittingPassword || !password.trim()}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-750 hover:to-indigo-650 text-white font-black rounded-2xl transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmittingPassword ? (
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faUnlockAlt} className="w-4 h-4" />
                  <span>{isId ? "Buka Akses Berkas" : "Unlock File Access"}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => router.push("/")}
              className="w-full h-10 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all text-xs"
            >
              {dict.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error === "not_found" || !file) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-850 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faFile} className="w-8 h-8 text-slate-400 dark:text-slate-550" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">{dict.notFoundTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-8">{dict.notFoundDesc}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-violet-600/20"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            {isId ? "Kembali ke Beranda" : "Back to Home"}
          </button>
        </div>
      </div>
    );
  }

  if (error === "server_error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-red-100 dark:border-red-950 shadow-2xl shadow-red-500/10 dark:shadow-none">
          <div className="w-20 h-20 bg-red-55/10 dark:bg-red-950/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
            <FontAwesomeIcon icon={faFile} className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">{dict.errorTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-8">{dict.errorDesc}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            {isId ? "Kembali ke Beranda" : "Back to Home"}
          </button>
        </div>
      </div>
    );
  }

  // Format size helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    const m = mime.toLowerCase();
    if (m.includes("pdf")) return faFilePdf;
    if (m.includes("image")) return faFileImage;
    if (m.includes("video")) return faFileVideo;
    if (m.includes("audio")) return faFileAudio;
    if (m.includes("zip") || m.includes("rar") || m.includes("tar") || m.includes("gzip")) return faFileArchive;
    if (m.includes("javascript") || m.includes("typescript") || m.includes("json") || m.includes("html") || m.includes("css") || m.includes("code")) return faFileCode;
    if (m.includes("text") || m.includes("plain")) return faFileAlt;
    return faFile;
  };

  const mime = file.mimeType.toLowerCase();
  const isImage = mime.includes("image");
  const isVideo = mime.includes("video");
  const isAudio = mime.includes("audio");
  const isPdf = mime.includes("pdf");

  const rawUrl = `${BACKEND_URL}/files/${file.filename}`;
  const secureDownloadUrl = `${BACKEND_URL}/api/files/download/${file.filename}${
    verifiedPassword ? `?password=${encodeURIComponent(verifiedPassword)}` : ""
  }`;

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(dict.copiedToast, { description: dict.copiedDesc });
  };

  // Embed elements templates
  const htmlEmbedCode = isImage
    ? `<img src="${rawUrl}" alt="${file.originalName}" style="max-width:100%; border-radius:12px;" />`
    : isVideo
    ? `<video src="${rawUrl}" controls style="max-width:100%; border-radius:12px;"></video>`
    : isAudio
    ? `<audio src="${rawUrl}" controls></audio>`
    : isPdf
    ? `<iframe src="${rawUrl}" width="100%" height="600px" style="border:none; border-radius:12px;"></iframe>`
    : `<a href="${window.location.origin}/f/${file.filename}" target="_blank">${file.originalName}</a>`;

  const mdEmbedCode = isImage
    ? `![${file.originalName}](${rawUrl})`
    : isPdf
    ? `[View PDF ${file.originalName}](${window.location.origin}/f/${file.filename})`
    : `[Download ${file.originalName}](${window.location.origin}/f/${file.filename})`;

  // Audio Play toggle
  const togglePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // Format audio seconds
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleAudioSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newProgress = parseFloat(e.target.value);
    audio.currentTime = (newProgress / 100) * audio.duration;
    setAudioProgress(newProgress);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-12">
      {/* Background soft glowing blur blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="w-full max-w-2xl z-10 space-y-4 sm:space-y-6">
        {/* Nyoo.me Header logo */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs sm:text-base font-black shadow-lg shadow-violet-600/20">
              N
            </div>
            <span className="font-black text-sm sm:text-base text-slate-800 dark:text-white tracking-tight">nyoo<span className="text-violet-600 dark:text-violet-400">.me</span></span>
          </div>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-2.5 h-2.5" />
            {dict.back}
          </button>
        </div>

        {/* Primary Container Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[1.75rem] sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-10 space-y-6 sm:space-y-8 backdrop-blur-xl">
          {/* File Header Block */}
          <div className="flex items-center gap-3.5 pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shrink-0">
              <FontAwesomeIcon icon={getFileIcon(file.mimeType)} className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-xl font-black text-slate-900 dark:text-white leading-tight break-all line-clamp-2">
                {file.originalName}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5 sm:mt-1 truncate">
                {file.mimeType}
              </p>
            </div>
          </div>

          {/* Conditional Media Previewer */}
          <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-[1.25rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2 sm:p-4 min-h-[120px] sm:min-h-[160px]">
            {isImage && (
              <img
                src={rawUrl}
                alt={file.originalName}
                className="max-h-[250px] sm:max-h-[350px] w-auto object-contain rounded-xl sm:rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-800 transition-transform duration-300 hover:scale-[1.01]"
              />
            )}

            {isVideo && (
              <video
                src={rawUrl}
                controls
                className="max-h-[250px] sm:max-h-[350px] w-full rounded-xl sm:rounded-2xl shadow-md bg-black"
              />
            )}

            {isAudio && (
              <div className="w-full max-w-md p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl sm:rounded-[2rem] shadow-xl flex items-center gap-3.5 sm:gap-5">
                <audio ref={audioRef} src={rawUrl} />
                <button
                  onClick={togglePlayAudio}
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-violet-600 hover:bg-violet-750 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition-transform duration-200 active:scale-90 shrink-0"
                >
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-sm sm:text-lg" />
                </button>
                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                  <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-800 dark:text-white truncate">
                    {file.originalName}
                  </h4>
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioProgress}
                      onChange={handleAudioSliderChange}
                      className="w-full h-1 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-450 dark:text-slate-550 font-mono shrink-0 select-none">
                      {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(audioDuration)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isPdf && (
              <div className="w-full h-[360px] sm:h-[550px] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-md">
                <iframe
                  src={`${rawUrl}#toolbar=0`}
                  className="w-full h-full border-none rounded-xl sm:rounded-2xl bg-white"
                  title={file.originalName}
                />
              </div>
            )}

            {!isImage && !isVideo && !isAudio && !isPdf && (
              <div className="text-center py-4 sm:py-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-555 border border-slate-100 dark:border-slate-700">
                  <FontAwesomeIcon icon={getFileIcon(file.mimeType)} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold px-4">
                  {isId ? "Pratinjau tidak tersedia untuk jenis berkas ini." : "No interactive preview available for this file type."}
                </p>
              </div>
            )}
          </div>

          {/* Metadata details block */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 bg-slate-50/20 dark:bg-slate-900/10 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100/50 dark:border-slate-800/50">
            {/* Size */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3.5 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <FontAwesomeIcon icon={faHdd} className="text-xs sm:text-sm" />
              </div>
              <div className="min-w-0">
                <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider">{dict.downloadCount}</span>
                <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5 block truncate">{formatBytes(file.size)}</span>
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3.5 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-50 dark:bg-violet-950/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-xs sm:text-sm" />
              </div>
              <div className="min-w-0 w-full">
                <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider">{dict.uploadedDate}</span>
                <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-350 mt-0.5 block truncate">
                  {new Date(file.createdAt).toLocaleDateString(isId ? "id" : "en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
            </div>

            {/* Content type */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3.5 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <FontAwesomeIcon icon={faGlobe} className="text-xs sm:text-sm" />
              </div>
              <div className="min-w-0">
                <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider">{dict.fileType}</span>
                <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-350 mt-0.5 block truncate uppercase">{file.mimeType.split("/")[1] || "RAW"}</span>
              </div>
            </div>
          </div>

          {/* Secure Download CTA */}
          <div>
            <a
              href={secureDownloadUrl}
              className="w-full h-12 sm:h-16 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-750 hover:to-indigo-650 text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faDownload} className="text-sm sm:text-base animate-bounce" />
              {dict.downloadBtn}
            </a>
          </div>

          {/* Space Saving Tab System for Embed / Copy Templates */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="font-extrabold text-[11px] sm:text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faCode} className="text-violet-600 dark:text-violet-400 text-[10px] sm:text-xs" />
              {dict.embedTitle}
            </h3>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 pb-1.5 gap-2">
              <button
                onClick={() => setActiveTab("direct")}
                className={`pb-1 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all relative shrink-0 ${
                  activeTab === "direct"
                    ? "text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300"
                }`}
              >
                {isId ? "Link Langsung" : "Direct Link"}
              </button>
              <button
                onClick={() => setActiveTab("html")}
                className={`pb-1 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all relative shrink-0 ${
                  activeTab === "html"
                    ? "text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300"
                }`}
              >
                HTML Embed
              </button>
              <button
                onClick={() => setActiveTab("markdown")}
                className={`pb-1 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all relative shrink-0 ${
                  activeTab === "markdown"
                    ? "text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300"
                }`}
              >
                Markdown
              </button>
            </div>

            {/* Active Tab Input Content */}
            <div className="pt-1 select-all">
              {activeTab === "direct" && (
                <div className="relative flex items-center animate-in fade-in duration-200">
                  <input
                    type="text"
                    readOnly
                    value={rawUrl}
                    className="w-full h-10 pl-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-650 dark:text-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(rawUrl)}
                    className="absolute right-1 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm transition-colors active:scale-95"
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              )}

              {activeTab === "html" && (
                <div className="relative flex items-center animate-in fade-in duration-200">
                  <input
                    type="text"
                    readOnly
                    value={htmlEmbedCode}
                    className="w-full h-10 pl-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-650 dark:text-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(htmlEmbedCode)}
                    className="absolute right-1 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm transition-colors active:scale-95"
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              )}

              {activeTab === "markdown" && (
                <div className="relative flex items-center animate-in fade-in duration-200">
                  <input
                    type="text"
                    readOnly
                    value={mdEmbedCode}
                    className="w-full h-10 pl-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-650 dark:text-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(mdEmbedCode)}
                    className="absolute right-1 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm transition-colors active:scale-95"
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nyoo footer watermark */}
        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-555 text-center select-none">
          © {new Date().getFullYear()} nyoo.me Awan File Storage. All rights reserved.
        </p>
      </div>
    </div>
  );
}
