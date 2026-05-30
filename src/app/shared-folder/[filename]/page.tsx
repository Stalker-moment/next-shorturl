"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faFolderOpen,
  faDatabase,
  faSearch,
  faSpinner,
  faFile,
  faFilePdf,
  faFileImage,
  faFileVideo,
  faFileAudio,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faDownload,
  faEye,
  faCopy,
  faGlobe,
  faArrowLeft,
  faCalendarAlt,
  faHdd,
  faPlay,
  faPause,
  faCode,
  faThLarge,
  faList,
  faLock,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface SharedFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  createdAt: string;
}

interface SharedFolderData {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888";

export default function SharedFolderPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isId = language === "id";

  const folderFilename = params?.filename as string;  const [folder, setFolder] = useState<SharedFolderData | null>(null);
  const [allFiles, setAllFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeLimit, setPageSizeLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFilesCount, setTotalFilesCount] = useState(0);

  // Password protect states
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  // View Mode
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  useEffect(() => {
    const saved = localStorage.getItem("awan-view-mode");
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  // Preview Modal states
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [previewActiveTab, setPreviewActiveTab] = useState<"direct" | "html" | "markdown">("direct");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement>(null);

  const dict = {
    back: isId ? "Kembali ke Beranda" : "Back to Home",
    loadingText: isId ? "Memuat isi folder..." : "Loading folder contents...",
    notFoundTitle: isId ? "Folder Tidak Ditemukan 🔍" : "Folder Not Found 🔍",
    notFoundDesc: isId
      ? "Maaf, folder yang Anda cari tidak ditemukan atau telah dihapus."
      : "Sorry, the folder you are looking for was not found or has been deleted.",
    errorTitle: isId ? "Terjadi Kesalahan 🚫" : "An Error Occurred 🚫",
    errorDesc: isId ? "Gagal memuat isi folder bersama." : "Failed to retrieve shared folder data.",
    folderTitle: isId ? "Folder Bersama" : "Shared Folder",
    searchPlaceholder: isId ? "Cari berkas..." : "Search files...",
    tableName: isId ? "Nama Berkas" : "File Name",
    tableSize: isId ? "Ukuran" : "Size",
    tableDate: isId ? "Tanggal Unggah" : "Uploaded At",
    tableAction: isId ? "Aksi" : "Action",
    emptyState: isId ? "Folder ini kosong" : "This folder is empty",
    emptyStateSub: isId ? "Tidak ada berkas yang ditemukan di dalam direktori ini." : "No files were found in this directory.",
    copiedToast: isId ? "Tautan berhasil disalin!" : "Link copied successfully!",
    totalFiles: isId ? "Total Berkas" : "Total Files",
    createdDate: isId ? "Dibuat Pada" : "Created At",
  };

  const fetchFolderData = async (
    page = currentPage,
    limit = pageSizeLimit,
    path = currentPath,
    search = searchQuery,
    providedPassword?: string
  ) => {
    if (!folderFilename) return;
    setError(null);
    setPasswordError("");

    try {
      const prefix = path.join("/");
      const pwd = providedPassword !== undefined ? providedPassword : (verifiedPassword || "");
      const passwordQuery = pwd ? `&password=${encodeURIComponent(pwd)}` : "";
      
      const res = await fetch(
        `${BACKEND_URL}/api/files/shared-folder/${folderFilename}?page=${page}&limit=${limit}&prefix=${encodeURIComponent(
          prefix
        )}&search=${encodeURIComponent(search)}${passwordQuery}`
      );
      
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
        setFolder(json.folder);
        setAllFiles(json.files);
        setTotalFilesCount(json.totalFilesCount || 0);
        setRequiresPassword(false);
        if (providedPassword) {
          setVerifiedPassword(providedPassword);
        }
        if (json.pagination) {
          setCurrentPage(json.pagination.page);
          setTotalItems(json.pagination.total);
          setTotalPages(json.pagination.totalPages);
        }
      } else {
        setError("server_error");
      }
    } catch (err) {
      console.error("Fetch shared folder error:", err);
      setError("server_error");
    } finally {
      setLoading(false);
      setIsSubmittingPassword(false);
    }
  };

  useEffect(() => {
    fetchFolderData(currentPage, pageSizeLimit, currentPath, searchQuery);
  }, [folderFilename, currentPage, pageSizeLimit, currentPath, searchQuery, verifiedPassword]);

  // Reset pagination to first page when folder prefix or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentPath, searchQuery]);

  // Audio events hook
  useEffect(() => {
    const audio = previewAudioRef.current;
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
  }, [previewFile]);

  // Format file size helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return faFile;
    const mime = mimeType.toLowerCase();
    if (mime === "directory") return faFolder;
    if (mime.includes("pdf")) return faFilePdf;
    if (mime.includes("image")) return faFileImage;
    if (mime.includes("video")) return faFileVideo;
    if (mime.includes("audio")) return faFileAudio;
    if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar") || mime.includes("gzip")) return faFileArchive;
    if (mime.includes("javascript") || mime.includes("typescript") || mime.includes("json") || mime.includes("html") || mime.includes("css") || mime.includes("code")) return faFileCode;
    if (mime.includes("text") || mime.includes("plain")) return faFileAlt;
    return faFile;
  };

  const renderThumbnail = (file: SharedFile) => {
    const isImage = file.mimeType.toLowerCase().includes("image");
    const isVideo = file.mimeType.toLowerCase().includes("video");
    const isDir = file.mimeType === "directory";

    if (isDir) {
      return (
        <FontAwesomeIcon
          icon={faFolder}
          className="w-4 h-4 text-amber-500 dark:text-amber-400"
        />
      );
    }

    if (isImage) {
      return (
        <img
          src={`${BACKEND_URL}/files/${file.filename}`}
          alt={file.originalName}
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }

    if (isVideo) {
      return (
        <div className="w-full h-full relative overflow-hidden rounded-xl">
          <video
            src={`${BACKEND_URL}/files/${file.filename}`}
            preload="metadata"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-[10px] text-white">
            ▶
          </div>
        </div>
      );
    }

    return (
      <FontAwesomeIcon
        icon={getFileIcon(file.mimeType)}
        className="w-4 h-4"
      />
    );
  };

  const togglePlayAudio = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleAudioSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    const newProgress = parseFloat(e.target.value);
    audio.currentTime = (newProgress / 100) * audio.duration;
    setAudioProgress(newProgress);
  };

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

  // 1. Check if the folder is expired (410 Status)
  if (error === "expired") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-amber-100 dark:border-amber-950 shadow-2xl shadow-amber-500/10">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100 dark:border-amber-900/30">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            {isId ? "Folder Telah Kedaluwarsa ⏳" : "Folder Has Expired ⏳"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-8">
            {isId
              ? "Maaf, folder bersama yang Anda cari telah mencapai batas waktu penyimpanan kustom atau disetel untuk dihapus secara otomatis."
              : "Sorry, the shared folder you are looking for has reached its custom storage expiry time or was set to auto-delete."}
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
            <FontAwesomeIcon icon={faLock} className="w-8 h-8 text-violet-600 dark:text-violet-450 animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            {isId ? "Folder Terproteksi Sandi 🔒" : "Password Protected Folder 🔒"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-6">
            {isId
              ? "Folder bersama ini dilindungi oleh kata sandi pemilik. Silakan masukkan kata sandi yang benar untuk membuka akses isi berkas."
              : "This shared folder is protected by the owner's custom password. Please enter the correct password to unlock and view its files."}
          </p>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmittingPassword(true);
              fetchFolderData(currentPage, pageSizeLimit, currentPath, searchQuery, password);
            }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                type="password"
                required
                placeholder={isId ? "Masukkan kata sandi folder..." : "Enter folder password..."}
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
                  <FontAwesomeIcon icon={faFolderOpen} className="w-4 h-4" />
                  <span>{isId ? "Buka Akses Folder" : "Unlock Folder Access"}</span>
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

  if (error === "not_found" || !folder) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-850 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faFolder} className="w-8 h-8 text-slate-400 dark:text-slate-555" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">{dict.notFoundTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-8">{dict.notFoundDesc}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-violet-650/20"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            {dict.back}
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
            <FontAwesomeIcon icon={faFolder} className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">{dict.errorTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-8">{dict.errorDesc}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            {dict.back}
          </button>
        </div>
      </div>
    );
  }

  // Filtered files is pre-paginated and pre-filtered in database/backend
  const filteredFiles = allFiles;

  const folderName = folder.originalName.split("/").pop() || folder.originalName;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Branding Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 dark:text-amber-450 shrink-0 border border-amber-100/40 dark:border-amber-900/20">
              <FontAwesomeIcon icon={faFolderOpen} className="text-2xl" />
            </div>
            <div>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 px-2 py-0.5 rounded-lg font-bold">
                {dict.folderTitle}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mt-1 leading-tight truncate max-w-xs md:max-w-md">
                {folderName}
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="grid grid-cols-2 gap-4 border-l border-slate-100 dark:border-slate-800 pl-0 md:pl-6 md:min-w-[240px]">
              <div>
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider">
                  {dict.totalFiles}
                </span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">
                  {totalFilesCount}
                </span>
              </div>
              <div>
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider">
                  {dict.createdDate}
                </span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono truncate block">
                  {new Date(folder.createdAt).toLocaleDateString(isId ? "id" : "en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <Link
              href={`/report?type=file&slug=${folderFilename}`}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-500 hover:text-white rounded-2xl text-xs font-black transition-all shadow-sm shrink-0"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5" />
              <span>{isId ? "Laporkan Penyalahgunaan" : "Report Abuse"}</span>
            </Link>
          </div>
        </div>

        {/* Files Browser Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Folder Navigation Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-550 dark:text-slate-400 overflow-x-auto scrollbar-none py-1.5 shrink-0 max-w-full sm:max-w-[60%]">
              <button
                onClick={() => setCurrentPath([])}
                className="hover:text-violet-650 dark:hover:text-violet-400 transition-all flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-xl"
              >
                <FontAwesomeIcon icon={faFolder} className="w-3 h-3 text-amber-500" />
                <span>{folderName}</span>
              </button>
              {currentPath.map((item, index) => (
                <React.Fragment key={index}>
                  <span className="text-slate-350 dark:text-slate-700 shrink-0">/</span>
                  <button
                    onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                    className="hover:text-violet-650 dark:hover:text-violet-400 transition-all max-w-[120px] truncate shrink-0 px-2 py-1 rounded-xl"
                  >
                    {item}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative w-full sm:w-60">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-555">
                  <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder={dict.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-55/30 dark:bg-slate-950/40 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 placeholder-slate-400 transition-all"
                />
              </div>

              {/* Grid/List View Toggle */}
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 p-0.5 shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  title={isId ? "Tampilan Daftar" : "List View"}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-850 text-violet-600 dark:text-violet-400 shadow-sm"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350"
                  }`}
                >
                  <FontAwesomeIcon icon={faList} className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  title={isId ? "Tampilan Grid" : "Grid View"}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-850 text-violet-600 dark:text-violet-400 shadow-sm"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350"
                  }`}
                >
                  <FontAwesomeIcon icon={faThLarge} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl flex items-center justify-center text-slate-350 dark:text-slate-600 border border-slate-100 dark:border-slate-800">
                <FontAwesomeIcon icon={faFolder} className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-slate-750 dark:text-slate-300 text-sm">
                  {dict.emptyState}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-555 mt-1.5 max-w-xs mx-auto">
                  {dict.emptyStateSub}
                </p>
              </div>
            </div>
          ) : viewMode === "list" ? (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-55/40 dark:bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 font-black">
                    <th className="pl-6 pr-4 py-4">{dict.tableName}</th>
                    <th className="px-6 py-4">{dict.tableSize}</th>
                    <th className="px-6 py-4">{dict.tableDate}</th>
                    <th className="px-6 py-4 text-right">{dict.tableAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredFiles.map((file) => {
                    const isDir = file.mimeType === "directory";
                    const displayName = file.originalName.split("/").pop() || file.originalName;
                    const secureDownloadUrl = `${BACKEND_URL}/api/files/download/${file.filename}${
                      verifiedPassword ? `?password=${encodeURIComponent(verifiedPassword)}` : ""
                    }`;

                    return (
                      <tr
                        key={file.id}
                        onClick={() => {
                          if (isDir) {
                            setCurrentPath([...currentPath, displayName]);
                          } else {
                            setPreviewFile(file);
                            setPreviewActiveTab("direct");
                            setIsPlaying(false);
                            setAudioProgress(0);
                          }
                        }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors cursor-pointer"
                      >
                        {/* Filename & Icon */}
                        <td className="pl-6 pr-4 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isDir) {
                                  setCurrentPath([...currentPath, displayName]);
                                } else {
                                  setPreviewFile(file);
                                  setPreviewActiveTab("direct");
                                  setIsPlaying(false);
                                  setAudioProgress(0);
                                }
                              }}
                              className={`w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 border border-transparent ${
                                isDir ? "bg-amber-50/20 dark:bg-amber-950/10 text-amber-500" : ""
                              }`}
                            >
                              {renderThumbnail(file)}
                            </button>
                            <div className="min-w-0 max-w-xs sm:max-w-md">
                              {isDir ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPath([...currentPath, displayName]);
                                  }}
                                  className="text-xs font-black text-slate-800 dark:text-white truncate hover:text-violet-650 dark:hover:text-violet-400 text-left focus:outline-none"
                                >
                                  {displayName}
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewFile(file);
                                    setPreviewActiveTab("direct");
                                    setIsPlaying(false);
                                    setAudioProgress(0);
                                  }}
                                  className="text-xs font-black text-slate-800 dark:text-white truncate hover:text-violet-650 dark:hover:text-violet-400 text-left focus:outline-none"
                                >
                                  {displayName}
                                </button>
                              )}
                              <p className="text-[10px] text-slate-400 dark:text-slate-555 font-bold truncate">
                                {isDir ? (isId ? "Folder Direktori" : "Folder Directory") : file.mimeType}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* File Size */}
                        <td className="px-6 py-4 text-xs font-bold text-slate-655 dark:text-slate-400 font-mono">
                          {isDir ? "—" : formatBytes(file.size)}
                        </td>

                        {/* Upload Date */}
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {new Date(file.createdAt).toLocaleDateString(
                            language === "id" ? "id-ID" : "en-US",
                            { dateStyle: "medium" }
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {!isDir ? (
                              <>
                                {/* Preview File Modal */}
                                <button
                                  onClick={() => {
                                    setPreviewFile(file);
                                    setPreviewActiveTab("direct");
                                    setIsPlaying(false);
                                    setAudioProgress(0);
                                  }}
                                  title={isId ? "Pratinjau File" : "Preview File"}
                                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-450 flex items-center justify-center transition-all"
                                >
                                  <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
                                </button>

                                {/* Secure Download */}
                                <a
                                  href={secureDownloadUrl}
                                  title={isId ? "Unduh Aman" : "Secure Download"}
                                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-500 dark:text-slate-400 hover:text-violet-650 dark:hover:text-violet-400 flex items-center justify-center transition-all"
                                >
                                  <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
                                </a>
                              </>
                            ) : (
                              /* Folder Navigation helper */
                              <button
                                onClick={() => setCurrentPath([...currentPath, displayName])}
                                className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-650 dark:text-slate-350 transition-colors"
                              >
                                {isId ? "Buka" : "Open"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredFiles.map((file) => {
                  const displayName = file.originalName.split("/").pop() || file.originalName;
                  const isDir = file.mimeType === "directory";
                  const isImage = file.mimeType.toLowerCase().includes("image");
                  const isVideo = file.mimeType.toLowerCase().includes("video");

                  const secureDownloadUrl = `${BACKEND_URL}/api/files/download/${file.filename}${
                    verifiedPassword ? `?password=${encodeURIComponent(verifiedPassword)}` : ""
                  }`;

                  return (
                    <motion.div
                      key={file.id}
                      layout
                      onClick={() => {
                        if (isDir) {
                          setCurrentPath([...currentPath, displayName]);
                        } else {
                          setPreviewFile(file);
                          setPreviewActiveTab("direct");
                          setIsPlaying(false);
                          setAudioProgress(0);
                        }
                      }}
                      className="relative bg-slate-50/40 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300 group hover:shadow-lg hover:scale-[1.02]"
                    >
                      {/* Media Thumbnail/Icon Box */}
                      <div className="w-full aspect-square max-h-[120px] rounded-2xl bg-white dark:bg-slate-850 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 overflow-hidden relative shadow-sm mb-3">
                        {isDir ? (
                          <FontAwesomeIcon icon={faFolder} className="text-5xl text-amber-500 dark:text-amber-400" />
                        ) : isImage ? (
                          <img
                            src={`${BACKEND_URL}/files/${file.filename}`}
                            alt={file.originalName}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : isVideo ? (
                          <div className="w-full h-full relative">
                            <video
                              src={`${BACKEND_URL}/files/${file.filename}`}
                              preload="metadata"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-lg rounded-xl">
                              ▶
                            </div>
                          </div>
                        ) : (
                          <FontAwesomeIcon icon={getFileIcon(file.mimeType)} className="text-4xl" />
                        )}
                      </div>

                      {/* Filename & Info */}
                      <div className="w-full px-1 space-y-0.5">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate" title={displayName}>
                          {displayName}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-555 font-bold truncate">
                          {isDir ? (isId ? "Folder" : "Folder") : formatBytes(file.size)}
                        </p>
                      </div>

                      {/* Floating quick actions overlay on hover */}
                      <div 
                        className="absolute inset-x-3 bottom-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 shadow-xl transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isDir ? (
                          <>
                            {/* Preview */}
                            <button
                              onClick={() => {
                                setPreviewFile(file);
                                setPreviewActiveTab("direct");
                                setIsPlaying(false);
                                setAudioProgress(0);
                              }}
                              title={isId ? "Pratinjau File" : "Preview File"}
                              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-450 flex items-center justify-center transition-all"
                            >
                              <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                            </button>

                            {/* Secure Download */}
                            <a
                              href={secureDownloadUrl}
                              title={isId ? "Unduh Aman" : "Secure Download"}
                              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-500 dark:text-slate-400 hover:text-violet-650 dark:hover:text-violet-400 flex items-center justify-center transition-all"
                            >
                              <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                            </a>
                          </>
                        ) : (
                          /* Open folder button */
                          <button
                            onClick={() => setCurrentPath([...currentPath, displayName])}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-650 dark:text-slate-350 transition-colors"
                          >
                            {isId ? "Buka" : "Open"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Glassmorphic Premium Pagination Controls */}
          {totalItems > 0 && (
            <div className="px-6 py-4 bg-slate-50/40 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
              {/* Page Size Selector & Count Stats */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-550">
                  {isId ? "Tampilkan:" : "Show:"}
                </span>
                <select
                  value={pageSizeLimit}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value);
                    setPageSizeLimit(newLimit);
                    setCurrentPage(1);
                    fetchFolderData(1, newLimit, currentPath, searchQuery);
                  }}
                  className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-slate-700 dark:text-slate-300 font-extrabold cursor-pointer transition-all bg-white dark:bg-slate-850"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-400 dark:text-slate-550 font-bold ml-1">
                  {isId
                    ? `Menampilkan ${Math.min(totalItems, (currentPage - 1) * pageSizeLimit + 1)}-${Math.min(totalItems, currentPage * pageSizeLimit)} dari ${totalItems} berkas`
                    : `Showing ${Math.min(totalItems, (currentPage - 1) * pageSizeLimit + 1)}-${Math.min(totalItems, currentPage * pageSizeLimit)} of ${totalItems} files`}
                </span>
              </div>

              {/* Navigation Page Numbers */}
              <div className="flex items-center gap-1.5">
                {/* Prev Button */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    if (currentPage > 1) {
                      const prev = currentPage - 1;
                      setCurrentPage(prev);
                      fetchFolderData(prev, pageSizeLimit, currentPath, searchQuery);
                    }
                  }}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90"
                >
                  ‹
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          fetchFolderData(pageNum, pageSizeLimit, currentPath, searchQuery);
                        }}
                        className={`w-8 h-8 rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center active:scale-90 ${
                          currentPage === pageNum
                            ? "bg-violet-600 dark:bg-violet-500 text-white shadow-lg shadow-violet-500/20 border border-violet-600 dark:border-violet-500"
                            : "border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === 2 && currentPage > 3) ||
                    (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={pageNum} className="text-slate-350 dark:text-slate-700 px-1 font-mono">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                {/* Next Button */}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    if (currentPage < totalPages) {
                      const next = currentPage + 1;
                      setCurrentPage(next);
                      fetchFolderData(next, pageSizeLimit, currentPath, searchQuery);
                    }
                  }}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>

      {/* Premium File Preview Modal */}
      <AnimatePresence>
        {previewFile && (() => {
          const mime = previewFile.mimeType.toLowerCase();
          const isImage = mime.includes("image");
          const isVideo = mime.includes("video");
          const isAudio = mime.includes("audio");
          const isPdf = mime.includes("pdf");

          const previewRawUrl = `${BACKEND_URL}/files/${previewFile.filename}`;
          const secureDownloadUrl = `${BACKEND_URL}/api/files/download/${previewFile.filename}${
            verifiedPassword ? `?password=${encodeURIComponent(verifiedPassword)}` : ""
          }`;

          // Embed elements templates
          const htmlEmbedCode = isImage
            ? `<img src="${previewRawUrl}" alt="${previewFile.originalName}" style="max-width:100%; border-radius:12px;" />`
            : isVideo
            ? `<video src="${previewRawUrl}" controls style="max-width:100%; border-radius:12px;"></video>`
            : isAudio
            ? `<audio src="${previewRawUrl}" controls></audio>`
            : isPdf
            ? `<iframe src="${previewRawUrl}" width="100%" height="600px" style="border:none; border-radius:12px;"></iframe>`
            : `<a href="${window.location.origin}/f/${previewFile.filename}" target="_blank">${previewFile.originalName}</a>`;

          const mdEmbedCode = isImage
            ? `![${previewFile.originalName}](${previewRawUrl})`
            : isPdf
            ? `[View PDF ${previewFile.originalName}](${window.location.origin}/f/${previewFile.filename})`
            : `[Download ${previewFile.originalName}](${window.location.origin}/f/${previewFile.filename})`;

          const activeEmbedCode = previewActiveTab === "direct"
            ? previewRawUrl
            : previewActiveTab === "html"
            ? htmlEmbedCode
            : mdEmbedCode;

          const copyPreviewToClipboard = (text: string) => {
            navigator.clipboard.writeText(text);
            toast.success(
              isId ? "Berhasil disalin ke papan klip!" : "Copied successfully to clipboard!",
              { description: isId ? "Tempel di mana saja Anda inginkan." : "Paste it anywhere you want." }
            );
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 sm:p-7 max-w-2xl w-full shadow-2xl relative my-8"
              >
                {/* Close Button */}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-555 hover:text-slate-700 dark:hover:text-white transition-colors bg-white dark:bg-slate-900 z-10"
                >
                  <span className="font-bold text-sm">✕</span>
                </button>

                <div className="space-y-6">
                  {/* File Header Block */}
                  <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800/80 pr-8">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shrink-0">
                      <FontAwesomeIcon icon={getFileIcon(previewFile.mimeType)} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight break-all line-clamp-1">
                        {previewFile.originalName.split("/").pop()}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-555 font-bold mt-0.5 truncate">
                        {previewFile.mimeType}
                      </p>
                    </div>
                  </div>

                  {/* Media Player Area */}
                  <div className="bg-slate-55/40 dark:bg-slate-950/30 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/80 overflow-hidden flex items-center justify-center p-2 sm:p-4 min-h-[140px]">
                    {isImage && (
                      <img
                        src={previewRawUrl}
                        alt={previewFile.originalName}
                        className="max-h-[250px] sm:max-h-[320px] w-auto object-contain rounded-xl shadow-md border border-slate-200/50 dark:border-slate-800/60 transition-transform duration-300 hover:scale-[1.01]"
                      />
                    )}

                    {isVideo && (
                      <video
                        src={previewRawUrl}
                        controls
                        className="max-h-[250px] sm:max-h-[320px] w-full rounded-xl shadow-md bg-black"
                      />
                    )}

                    {isAudio && (
                      <div className="w-full max-w-md p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xl flex items-center gap-3.5">
                        <audio
                          ref={previewAudioRef}
                          src={previewRawUrl}
                        />
                        <button
                          onClick={togglePlayAudio}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-violet-600 hover:bg-violet-750 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition-transform duration-200 active:scale-90 shrink-0"
                        >
                          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-xs sm:text-sm" />
                        </button>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-800 dark:text-white truncate">
                            {previewFile.originalName.split("/").pop()}
                          </h4>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={audioProgress}
                              onChange={handleAudioSliderChange}
                              className="w-full h-1 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
                            />
                            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-555 font-mono shrink-0 select-none">
                              {formatTime(previewAudioRef.current?.currentTime || 0)} / {formatTime(audioDuration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isPdf && (
                      <div className="w-full h-[280px] sm:h-[360px] rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 shadow-md">
                        <iframe
                          src={`${previewRawUrl}#toolbar=0`}
                          className="w-full h-full border-none rounded-xl bg-white"
                          title={previewFile.originalName}
                        />
                      </div>
                    )}

                    {!isImage && !isVideo && !isAudio && !isPdf && (
                      <div className="text-center py-5">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-550 border border-slate-100 dark:border-slate-700">
                          <FontAwesomeIcon icon={getFileIcon(previewFile.mimeType)} className="w-5 h-5" />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold px-4">
                          {isId ? "Pratinjau tidak tersedia untuk jenis berkas ini." : "No interactive preview available for this file type."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metadata details block */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/20 dark:bg-slate-900/10 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                    {/* Size */}
                    <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
                      <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FontAwesomeIcon icon={faHdd} className="text-xs" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider">{isId ? "Ukuran" : "Size"}</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5 block truncate">{formatBytes(previewFile.size)}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
                      <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950/40 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                      </div>
                      <div className="min-w-0 w-full">
                        <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider">{isId ? "Tanggal" : "Date"}</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 mt-0.5 block truncate">
                          {new Date(previewFile.createdAt).toLocaleDateString(isId ? "id" : "en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Content type */}
                    <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
                      <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FontAwesomeIcon icon={faGlobe} className="text-xs" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider">{isId ? "Tipe" : "Type"}</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-350 mt-0.5 block truncate uppercase">{previewFile.mimeType.split("/")[1] || "RAW"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Secure Download CTA */}
                  <div>
                    <a
                      href={secureDownloadUrl}
                      className="w-full h-11 sm:h-12 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-750 hover:to-indigo-650 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-650/20 flex items-center justify-center gap-2 text-xs active:scale-[0.98]"
                    >
                      <FontAwesomeIcon icon={faDownload} className="text-xs animate-bounce" />
                      {isId ? "Unduh Aman (Secure)" : "Secure Download"}
                    </a>
                  </div>

                  {/* Tabbed Embed Area */}
                  <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <h3 className="font-extrabold text-[11px] sm:text-xs text-slate-800 dark:text-white flex items-center gap-2">
                      <FontAwesomeIcon icon={faCode} className="text-violet-600 dark:text-violet-400 text-[10px]" />
                      {isId ? "Sematan & Salin Tautan" : "Embed & Link Templates"}
                    </h3>

                    {/* Tabs Selector */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 pb-1.5 gap-2">
                      <button
                        onClick={() => setPreviewActiveTab("direct")}
                        className={`pb-1 text-[10px] font-black uppercase tracking-wider transition-all relative shrink-0 ${
                          previewActiveTab === "direct"
                            ? "text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full"
                            : "text-slate-400 dark:text-slate-555 hover:text-slate-650 dark:hover:text-slate-300"
                        }`}
                      >
                        {isId ? "Link Langsung" : "Direct Link"}
                      </button>
                      <button
                        onClick={() => setPreviewActiveTab("html")}
                        className={`pb-1 text-[10px] font-black uppercase tracking-wider transition-all relative shrink-0 ${
                          previewActiveTab === "html"
                            ? "text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full"
                            : "text-slate-400 dark:text-slate-555 hover:text-slate-650 dark:hover:text-slate-300"
                        }`}
                      >
                        HTML Embed
                      </button>
                      <button
                        onClick={() => setPreviewActiveTab("markdown")}
                        className={`pb-1 text-[10px] font-black uppercase tracking-wider transition-all relative shrink-0 ${
                          previewActiveTab === "markdown"
                            ? "text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full"
                            : "text-slate-400 dark:text-slate-555 hover:text-slate-650 dark:hover:text-slate-300"
                        }`}
                      >
                        Markdown
                      </button>
                    </div>

                    {/* Active Tab Content */}
                    <div className="pt-1 select-all relative flex items-center animate-in fade-in duration-200">
                      <input
                        type="text"
                        readOnly
                        value={activeEmbedCode}
                        className="w-full h-10 pl-3 pr-10 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-650 dark:text-slate-400 focus:outline-none"
                      />
                      <button
                        onClick={() => copyPreviewToClipboard(activeEmbedCode)}
                        className="absolute right-1 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm transition-colors active:scale-95 bg-white dark:bg-slate-900"
                      >
                        <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
