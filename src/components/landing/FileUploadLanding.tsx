"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudUploadAlt,
  faLock,
  faSpinner,
  faCheckCircle,
  faCopy,
  faFileAlt,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/contexts/LanguageContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888";
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

interface FileUploadLandingProps {
  isTab?: boolean;
}

export default function FileUploadLanding({ isTab = false }: FileUploadLandingProps) {
  const { data: session, status: authStatus } = useSession();
  const { language } = useLanguage();
  const isId = language === "id";

  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "completed" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadEta, setUploadEta] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [uploadedLink, setUploadedLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentXhr, setCurrentXhr] = useState<XMLHttpRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up ongoing XHR on unmount
  useEffect(() => {
    return () => {
      if (currentXhr) {
        currentXhr.abort();
      }
    };
  }, [currentXhr]);

  // Format bytes helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (uploadStatus === "uploading") return;
    setFileName(file.name);
    setFileSize(file.size);
    setErrorMsg("");
    setUploadProgress(0);
    setUploadedLink("");
    setIsCopied(false);

    // Call actual chunked upload
    startChunkedUpload(file);
  };

  const startChunkedUpload = async (file: File) => {
    if (!session?.user) {
      toast.error(isId ? "Silakan masuk terlebih dahulu!" : "Please login first!");
      return;
    }
    // @ts-expect-error user id
    const userId = session.user.id;
    setUploadStatus("uploading");

    try {
      const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadStartTime = Date.now();
      let completedBytesSoFar = 0;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const xhr = new XMLHttpRequest();
        setCurrentXhr(xhr);

        await new Promise<void>((resolve, reject) => {
          xhr.open("POST", `${BACKEND_URL}/api/files/upload-chunk`);

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const currentTotalLoaded = completedBytesSoFar + e.loaded;
              const elapsedMs = Date.now() - uploadStartTime;
              const elapsedSecs = elapsedMs / 1000;
              let speed = 0;
              let eta = 0;
              if (elapsedSecs > 0) {
                speed = currentTotalLoaded / elapsedSecs;
                eta = speed > 0 ? (file.size - currentTotalLoaded) / speed : 0;
              }

              const percent = Math.round((currentTotalLoaded / file.size) * 100);
              setUploadProgress(percent);
              setUploadSpeed(speed);
              setUploadEta(eta);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              try {
                const errData = JSON.parse(xhr.responseText);
                reject(new Error(errData.error || "Chunk upload failed"));
              } catch {
                reject(new Error("Chunk upload failed"));
              }
            }
          });

          xhr.addEventListener("error", () => reject(new Error(isId ? "Kesalahan jaringan" : "Network error")));
          xhr.addEventListener("abort", () => reject(new Error(isId ? "Dibatalkan" : "Aborted")));

          const formData = new FormData();
          formData.append("chunk", chunk);
          formData.append("uploadId", uploadId);
          formData.append("chunkIndex", i.toString());

          xhr.send(formData);
        });

        completedBytesSoFar += chunk.size;
      }

      // Merge chunks into a complete file
      const mergeRes = await fetch(`${BACKEND_URL}/api/files/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          uploadId,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          totalChunks,
          totalSize: file.size,
        }),
      });

      const mergeJson = await mergeRes.json();
      if (!mergeRes.ok) {
        throw new Error(mergeJson.error || "Failed to finalize upload");
      }

      if (mergeJson.success && mergeJson.file) {
        const fileObj = mergeJson.file;
        const link = `${window.location.origin}/f/${fileObj.filename}`;
        setUploadedLink(link);
        setUploadStatus("completed");
        setUploadProgress(100);
        toast.success(isId ? "File berhasil diunggah!" : "File uploaded successfully!");
      } else {
        throw new Error("Invalid finalization response");
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to upload file");
      setUploadStatus("error");
      toast.error(isId ? `Gagal mengunggah: ${err.message}` : `Failed to upload: ${err.message}`);
    } finally {
      setCurrentXhr(null);
    }
  };

  const handleCopyLink = () => {
    if (!uploadedLink) return;
    navigator.clipboard.writeText(uploadedLink);
    setIsCopied(true);
    toast.success(isId ? "Link berhasil disalin!" : "Link copied successfully!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancelUpload = () => {
    if (currentXhr) {
      currentXhr.abort();
      setCurrentXhr(null);
    }
    setUploadStatus("idle");
    setUploadProgress(0);
    setFileName("");
    setErrorMsg("");
  };

  const content = (
    <AnimatePresence mode="wait">
      {/* STATE 1: UNUATHENTICATED / LOCK */}
      {authStatus === "unauthenticated" && (
        <motion.div
          key="locked"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="py-8 px-4 flex flex-col items-center justify-center relative"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-violet-500/25 blur-3xl rounded-full animate-pulse" />
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 transform group-hover:rotate-6 transition-transform relative z-10">
              <FontAwesomeIcon icon={faLock} className="text-xl animate-bounce" />
            </div>
          </div>
          <h3 className="font-extrabold text-sm text-slate-700 dark:text-zinc-200 uppercase tracking-wider mb-2">
            {isId ? "Akses Terkunci" : "Locked Access"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed max-w-sm mb-8 font-medium">
            {isId 
              ? "Fitur unggah file instan merupakan fitur premium khusus pengguna terdaftar. Silakan masuk terlebih dahulu untuk memulai." 
              : "Instant file uploading is a premium feature for registered users. Please login first to get started."}
          </p>
          <Link href="/login" className="w-full sm:w-auto">
            <button className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-98 transition-transform shadow-xl flex items-center justify-center gap-2">
              <span>{isId ? "Masuk ke Akun" : "Log In to Upload"}</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </button>
          </Link>
        </motion.div>
      )}

      {/* STATE 2: LOADING AUTH */}
      {authStatus === "loading" && (
        <motion.div
          key="auth-loading"
          className="py-16 flex flex-col items-center justify-center"
        >
          <FontAwesomeIcon icon={faSpinner} className="text-violet-600 text-3xl animate-spin mb-4" />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{isId ? "Menghubungkan..." : "Authenticating..."}</p>
        </motion.div>
      )}

      {/* STATE 3: AUTHENTICATED / ACTIVE */}
      {authStatus === "authenticated" && (
        <motion.div
          key="active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* IDLE DROPZONE */}
          {uploadStatus === "idle" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 cursor-pointer transition-all duration-300 relative overflow-hidden group/zone ${
                isDragging 
                  ? "border-violet-500 bg-violet-500/10 scale-[1.01]" 
                  : "border-slate-200 dark:border-white/10 hover:border-violet-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="absolute inset-0 bg-violet-600/[0.01] pointer-events-none" />
              <div className="w-14 h-14 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-violet-200/20 dark:border-violet-800/40 shadow-sm group-hover/zone:scale-110 transition-transform duration-300">
                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-xl" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                {isId ? "Tarik & Lepas File di Sini" : "Drag & Drop File Here"}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1.5">
                {isId ? "atau klik untuk menelusuri file komputer" : "or click to browse computer files"}
              </p>
            </div>
          )}

          {/* UPLOADING PROGRESS */}
          {uploadStatus === "uploading" && (
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-white/5 text-left space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-violet-500/10 text-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 border border-violet-200/20">
                  <FontAwesomeIcon icon={faFileAlt} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold truncate text-slate-800 dark:text-white leading-none mb-1.5">{fileName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold leading-none uppercase tracking-wide">{formatBytes(fileSize)}</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faSpinner} className="text-violet-500 text-sm animate-spin" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  <span>{isId ? "Kemajuan" : "Progress"}: {uploadProgress}%</span>
                  <span>{formatBytes(uploadSpeed)}/s</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/40 dark:border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  {isId ? "Sisa waktu" : "ETA"}: {uploadEta > 0 ? `${Math.ceil(uploadEta)}s` : "-"}
                </span>
                <button
                  onClick={handleCancelUpload}
                  className="text-xs font-black text-red-500 hover:text-red-400 uppercase tracking-widest"
                >
                  {isId ? "Batalkan" : "Cancel"}
                </button>
              </div>
            </div>
          )}

          {/* COMPLETED LINK VIEW */}
          {uploadStatus === "completed" && (
            <div className="p-6 bg-emerald-500/[0.03] rounded-3xl border border-emerald-500/20 text-center space-y-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5">
                  {isId ? "Unggahan Selesai!" : "Upload Completed!"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-sm mx-auto">
                  {isId 
                    ? "File Anda siap dibagikan! Salin link di bawah ini untuk membagikannya secara instan." 
                    : "Your file is ready! Copy the link below to share it instantly."}
                </p>
              </div>

              {/* Copy Link Input */}
              <div 
                onClick={handleCopyLink}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between gap-6 cursor-pointer group/link hover:border-emerald-500/50 transition-colors shadow-inner-sm"
              >
                <div className="text-left truncate min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Download Link</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono truncate block leading-none">{uploadedLink}</span>
                </div>
                <button
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                    isCopied 
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105" 
                      : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/5 group-hover/link:text-emerald-500 shadow-sm"
                  }`}
                >
                  <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} className="text-xs" />
                </button>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setUploadStatus("idle")}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-102 active:scale-98 transition-transform"
                >
                  {isId ? "Unggah File Lain" : "Upload Another"}
                </button>
              </div>
            </div>
          )}

          {/* UPLOAD ERROR */}
          {uploadStatus === "error" && (
            <div className="p-6 bg-red-500/[0.03] rounded-3xl border border-red-500/20 text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
                <span className="text-2xl font-black">!</span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-red-500 uppercase tracking-widest mb-1.5">
                  {isId ? "Unggahan Gagal" : "Upload Failed"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                  {errorMsg || (isId ? "Terjadi kesalahan yang tidak diketahui saat mengunggah file." : "An unknown error occurred during upload.")}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setUploadStatus("idle")}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  {isId ? "Kembali" : "Back"}
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                >
                  {isId ? "Coba Lagi" : "Try Again"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isTab) {
    return <div className="w-full text-center">{content}</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-5 w-full mt-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 shadow-2xl relative overflow-hidden text-center group"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

        <div className="mb-6">
          <span className="px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest inline-block border border-violet-200 dark:border-violet-800/50">
            ☁️ {isId ? "PENYIMPANAN AWAN" : "CLOUD FILE STORAGE"}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-4 tracking-tight leading-tight text-slate-800 dark:text-white">
            {isId ? "Unggah & Bagikan File Instan" : "Upload & Share Files Instantly"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 font-medium">
            {isId 
              ? "Dapatkan link unduhan langsung yang aman untuk file Anda dalam hitungan detik." 
              : "Get direct, secure download links for your files in seconds."}
          </p>
        </div>

        {content}
      </motion.div>
    </div>
  );
}
