"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudUploadAlt,
  faFile,
  faFilePdf,
  faFileImage,
  faFileVideo,
  faFileAudio,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faCopy,
  faTrashAlt,
  faDownload,
  faExclamationTriangle,
  faSpinner,
  faDatabase,
  faSearch,
  faCheckCircle,
  faEye,
  faEyeSlash,
  faLock,
  faFire,
  faPlay,
  faPause,
  faCalendarAlt,
  faHdd,
  faGlobe,
  faCode,
  faFolder,
  faFolderOpen,
  faFolderPlus,
  faEdit,
  faThLarge,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  createdAt: string;
}

interface QueueItem {
  id: string;
  file: File;
  progress: number;
  uploadedBytes: number;
  speed: number;
  eta: number;
  status: "queued" | "uploading" | "completed" | "error";
  step: string;
  error?: string;
  xhr?: XMLHttpRequest;
  customPath?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888";
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const PARALLEL_MAX_LIMIT = 3;
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

export default function FileStoragePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const isId = language === "id";

  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeLimit, setPageSizeLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFilesCount, setTotalFilesCount] = useState(0);

  // Storage info
  const [usedBytes, setUsedBytes] = useState(0);
  const [maxStorageMB, setMaxStorageMB] = useState(500);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(20);

  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
  const queueRef = useRef<QueueItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Delete Modal state
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<UserFile | null>(null);

  // Selection states
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Folder states
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Rename states
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameFile, setRenameFile] = useState<UserFile | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // View states
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  useEffect(() => {
    const saved = localStorage.getItem("awan-view-mode");
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  // Drag Hover states
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverBreadcrumbIndex, setDragOverBreadcrumbIndex] = useState<number | null>(null);

  // Preview Modal states
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [previewActiveTab, setPreviewActiveTab] = useState<"direct" | "html" | "markdown">("direct");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement>(null);

  // File Upload Security & Expiry Options States
  const [uploadPassword, setUploadPassword] = useState("");
  const [uploadExpiryOption, setUploadExpiryOption] = useState("forever");
  const [uploadCustomExpiry, setUploadCustomExpiry] = useState("");
  const [uploadBurnAfterRead, setUploadBurnAfterRead] = useState(false);
  const [showUploadPassword, setShowUploadPassword] = useState(false);
  const [isUploadConfigExpanded, setIsUploadConfigExpanded] = useState(false);

  // Folder Security & Expiry Options States
  const [folderPassword, setFolderPassword] = useState("");
  const [folderExpiryOption, setFolderExpiryOption] = useState("forever");
  const [folderCustomExpiry, setFolderCustomExpiry] = useState("");
  const [folderBurnAfterRead, setFolderBurnAfterRead] = useState(false);
  const [showFolderPassword, setShowFolderPassword] = useState(false);

  // Dictionary
  const dict = {
    title: isId ? "Penyimpanan Awan File" : "Awan File Storage",
    subtitle: isId
      ? "Unggah file apa saja dan dapatkan link instan yang bisa diakses dari mana saja."
      : "Upload any files and get instant downloadable links accessible from anywhere.",
    statsCardTitle: isId ? "Penggunaan Kapasitas" : "Capacity Usage",
    maxFileLabel: isId ? "Maks. ukuran file:" : "Max file size:",
    uploadAreaTitle: isId
      ? "Tarik & Lepaskan File di Sini"
      : "Drag & Drop Files Here",
    uploadAreaSub: isId
      ? "atau klik untuk memilih file dari komputer Anda"
      : "or click to select files from your computer",
    searchPlaceholder: isId ? "Cari nama file..." : "Search file name...",
    tableName: isId ? "Nama File" : "File Name",
    tableSize: isId ? "Ukuran" : "Size",
    tableDate: isId ? "Tanggal Unggah" : "Uploaded At",
    tableAction: isId ? "Aksi" : "Action",
    emptyState: isId ? "Belum ada file yang diunggah" : "No files uploaded yet",
    copiedToast: isId ? "Link berhasil disalin!" : "Link copied successfully!",
    deleteConfirm: isId ? "Apakah Anda yakin ingin menghapus file ini?" : "Are you sure you want to delete this file?",
    deleteSuccess: isId ? "File berhasil dihapus" : "File deleted successfully",
    uploadSuccess: isId ? "File berhasil diunggah!" : "File uploaded successfully!",
  };

  const fetchFiles = async (page = currentPage, limit = pageSizeLimit, path = currentPath, search = searchQuery) => {
    if (!session?.user) return;
    try {
      // @ts-expect-error user id
      const userId = session.user.id;
      const prefix = path.join("/");
      const res = await fetch(
        `${BACKEND_URL}/api/files?userId=${userId}&page=${page}&limit=${limit}&prefix=${encodeURIComponent(
          prefix
        )}&search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error("Failed to fetch files");
      const json = await res.json();
      if (json.success) {
        setFiles(json.files);
        setUsedBytes(json.usedBytes);
        setTotalFilesCount(json.totalFilesCount);
        setMaxStorageMB(json.maxStorage);
        setMaxFileSizeMB(json.maxFileSize);
        if (json.pagination) {
          setCurrentPage(json.pagination.page);
          setTotalItems(json.pagination.total);
          setTotalPages(json.pagination.totalPages);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Gagal memuat daftar file" : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      fetchFiles(currentPage, pageSizeLimit, currentPath, searchQuery);
    }
  }, [authStatus, session, currentPage, pageSizeLimit, currentPath, searchQuery]);

  // Reset pagination to first page when folder prefix or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentPath, searchQuery]);

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

  const renderThumbnail = (file: UserFile) => {
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

  // Handle Drag & Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Traversing directory drops recursively
  const traverseFileTree = async (entry: any, path = ""): Promise<{ file: File; relativePath: string }[]> => {
    const files: { file: File; relativePath: string }[] = [];
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        entry.file(resolve, reject);
      });
      files.push({ file, relativePath: path ? `${path}/${file.name}` : file.name });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (reader: any): Promise<any[]> => {
        const allEntries: any[] = [];
        const read = async () => {
          const entries = await new Promise<any[]>((resolve, reject) => {
            reader.readEntries(resolve, reject);
          });
          if (entries.length > 0) {
            allEntries.push(...entries);
            await read();
          }
        };
        await read();
        return allEntries;
      };

      const entries = await readAllEntries(dirReader);
      for (const subEntry of entries) {
        const subFiles = await traverseFileTree(subEntry, path ? `${path}/${entry.name}` : entry.name);
        files.push(...subFiles);
      }
    }
    return files;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const filesWithPaths: { file: File; relativePath: string }[] = [];
      const promises: Promise<void>[] = [];

      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === "file") {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            promises.push(
              (async () => {
                const results = await traverseFileTree(entry);
                filesWithPaths.push(...results);
              })()
            );
          }
        }
      }

      await Promise.all(promises);

      if (filesWithPaths.length > 0) {
        handleAddFilesWithPathToQueue(filesWithPaths);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFilesToQueue(e.target.files);
    }
  };

  // Queue Item helper updates
  const updateQueue = (updater: QueueItem[] | ((prev: QueueItem[]) => QueueItem[])) => {
    if (typeof updater === "function") {
      const next = updater(queueRef.current);
      queueRef.current = next;
      setUploadQueue(next);
    } else {
      queueRef.current = updater;
      setUploadQueue(updater);
    }
  };

  const updateQueueItem = (id: string, updates: Partial<QueueItem>) => {
    updateQueue(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // ADD FILES TO QUEUE & PROCESS
  const handleAddFilesToQueue = (filesList: FileList | File[]) => {
    if (!session?.user) return;
    // @ts-expect-error user id
    const userId = session.user.id;

    const filesArray = Array.from(filesList);
    const newItems: QueueItem[] = [];

    // Predictive storage check
    let predictedTotalBytes = usedBytes + queueRef.current
      .filter(item => item.status === "queued" || item.status === "uploading")
      .reduce((sum, item) => sum + item.file.size, 0);

    const maxStorageBytes = maxStorageMB * 1024 * 1024;
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const currentPathPrefix = currentPath.length > 0 ? `${currentPath.join("/")}/` : "";

    filesArray.forEach(file => {
      // 1. Check size limit client-side
      if (file.size > maxFileSizeBytes) {
        toast.error(
          isId
            ? `File "${file.name}" terlalu besar! Limit Anda ${maxFileSizeMB}MB. Upgrade paket untuk unggah file hingga 100MB!`
            : `File "${file.name}" is too large! Your limit is ${maxFileSizeMB}MB. Upgrade your plan to upload up to 100MB!`,
          {
            duration: 8000,
            action: {
              label: isId ? "Upgrade Sekarang" : "Upgrade Now",
              onClick: () => router.push("/manage/billing")
            }
          }
        );
        return;
      }

      // 2. Check total storage quota limit client-side
      if (predictedTotalBytes + file.size > maxStorageBytes) {
        toast.error(
          isId
            ? `Kapasitas penyimpanan tidak cukup untuk "${file.name}". Upgrade paket Anda untuk menambah kapasitas!`
            : `Insufficient storage capacity to upload "${file.name}". Upgrade your plan to get more space!`,
          {
            duration: 8000,
            action: {
              label: isId ? "Upgrade Sekarang" : "Upgrade Now",
              onClick: () => router.push("/manage/billing")
            }
          }
        );
        return;
      }

      predictedTotalBytes += file.size;

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        uploadedBytes: 0,
        speed: 0,
        eta: 0,
        status: "queued",
        step: isId ? "Dalam antrean" : "Queued",
        customPath: `${currentPathPrefix}${file.name}`
      });
    });

    if (newItems.length > 0) {
      updateQueue(prev => [...prev, ...newItems]);
      // Process queue after state is updated
      setTimeout(() => {
        processQueue();
      }, 50);
    }
  };

  const handleAddFilesWithPathToQueue = (filesList: { file: File; relativePath: string }[]) => {
    if (!session?.user) return;
    // @ts-expect-error user id
    const userId = session.user.id;

    const newItems: QueueItem[] = [];

    // Predictive storage check
    let predictedTotalBytes = usedBytes + queueRef.current
      .filter(item => item.status === "queued" || item.status === "uploading")
      .reduce((sum, item) => sum + item.file.size, 0);

    const maxStorageBytes = maxStorageMB * 1024 * 1024;
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const currentPathPrefix = currentPath.length > 0 ? `${currentPath.join("/")}/` : "";

    filesList.forEach(({ file, relativePath }) => {
      const destPath = `${currentPathPrefix}${relativePath}`;

      // 1. Check size limit client-side
      if (file.size > maxFileSizeBytes) {
        toast.error(
          isId
            ? `File "${file.name}" terlalu besar! Limit Anda ${maxFileSizeMB}MB. Upgrade paket untuk unggah file hingga 100MB!`
            : `File "${file.name}" is too large! Your limit is ${maxFileSizeMB}MB. Upgrade your plan to upload up to 100MB!`,
          {
            duration: 8000,
            action: {
              label: isId ? "Upgrade Sekarang" : "Upgrade Now",
              onClick: () => router.push("/manage/billing")
            }
          }
        );
        return;
      }

      // 2. Check total storage quota limit client-side
      if (predictedTotalBytes + file.size > maxStorageBytes) {
        toast.error(
          isId
            ? `Kapasitas penyimpanan tidak cukup untuk "${file.name}". Upgrade paket Anda untuk menambah kapasitas!`
            : `Insufficient storage capacity to upload "${file.name}". Upgrade your plan to get more space!`,
          {
            duration: 8000,
            action: {
              label: isId ? "Upgrade Sekarang" : "Upgrade Now",
              onClick: () => router.push("/manage/billing")
            }
          }
        );
        return;
      }

      predictedTotalBytes += file.size;

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        uploadedBytes: 0,
        speed: 0,
        eta: 0,
        status: "queued",
        step: isId ? "Dalam antrean" : "Queued",
        customPath: destPath
      });
    });

    if (newItems.length > 0) {
      updateQueue(prev => [...prev, ...newItems]);
      setTimeout(() => {
        processQueue();
      }, 50);
    }
  };

  // QUEUE ORCHESTRATOR
  const processQueue = () => {
    const queue = queueRef.current;
    
    // Find active large files and active small files
    const activeLarge = queue.filter(
      item => item.status === "uploading" && item.file.size > LARGE_FILE_THRESHOLD
    );
    const activeSmall = queue.filter(
      item => item.status === "uploading" && item.file.size <= LARGE_FILE_THRESHOLD
    );

    // Can we run a large file? (strict single-concurrency queue)
    if (activeLarge.length === 0) {
      const nextLarge = queue.find(
        item => item.status === "queued" && item.file.size > LARGE_FILE_THRESHOLD
      );
      if (nextLarge) {
        startSingleUpload(nextLarge.id);
        return; 
      }
    }

    // Process small files (up to parallel limit)
    if (activeSmall.length < PARALLEL_MAX_LIMIT) {
      const availableSlots = PARALLEL_MAX_LIMIT - activeSmall.length;
      const nextSmallFiles = queue
        .filter(item => item.status === "queued" && item.file.size <= LARGE_FILE_THRESHOLD)
        .slice(0, availableSlots);

      nextSmallFiles.forEach(item => {
        startSingleUpload(item.id);
      });
    }
  };

  // UPLOAD SINGLE FILE METHOD
  const startSingleUpload = async (itemId: string) => {
    const item = queueRef.current.find(i => i.id === itemId);
    if (!item || item.status !== "queued") return;

    updateQueueItem(itemId, { status: "uploading", step: isId ? "Menyiapkan..." : "Preparing..." });

    const file = item.file;
    if (!session?.user) {
      updateQueueItem(itemId, { status: "error", error: "Unauthorized", step: isId ? "Sesi Habis" : "Session Expired" });
      return;
    }
    // @ts-expect-error user id
    const userId = session.user.id;

    try {
      const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadStartTime = Date.now();
      let completedBytesSoFar = 0;

      for (let i = 0; i < totalChunks; i++) {
        // Double check if upload was aborted
        const currentItem = queueRef.current.find(q => q.id === itemId);
        if (!currentItem || currentItem.status !== "uploading") {
          return;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        updateQueueItem(itemId, {
          step: isId
            ? `Mengunggah bag. ${i + 1}/${totalChunks}...`
            : `Uploading chunk ${i + 1}/${totalChunks}...`
        });

        const xhr = new XMLHttpRequest();
        updateQueueItem(itemId, { xhr });

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
              updateQueueItem(itemId, {
                progress: percent,
                uploadedBytes: currentTotalLoaded,
                speed,
                eta
              });
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

      updateQueueItem(itemId, { step: isId ? "Menggabungkan..." : "Merging..." });
      
      let expiresAtPayload = null;
      if (uploadExpiryOption !== "forever") {
        if (uploadExpiryOption === "custom" && uploadCustomExpiry) {
          expiresAtPayload = new Date(uploadCustomExpiry).toISOString();
        } else {
          expiresAtPayload = new Date(Date.now() + parseInt(uploadExpiryOption) * 24 * 60 * 60 * 1500).toISOString();
        }
      }

      const mergeRes = await fetch(`${BACKEND_URL}/api/files/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          uploadId,
          filename: item.customPath || file.name,
          mimeType: file.type || "application/octet-stream",
          totalChunks,
          totalSize: file.size,
          password: uploadPassword || null,
          expiresAt: expiresAtPayload,
          burnAfterRead: uploadBurnAfterRead
        }),
      });

      if (!mergeRes.ok) {
        const mergeErr = await mergeRes.json();
        throw new Error(mergeErr.error || "File merge failed");
      }

      updateQueueItem(itemId, {
        status: "completed",
        progress: 100,
        uploadedBytes: file.size,
        step: isId ? "Selesai" : "Completed"
      });

      toast.success(
        isId
          ? `File "${file.name}" berhasil diunggah!`
          : `File "${file.name}" uploaded successfully!`
      );
      
      fetchFiles();

    } catch (error: any) {
      const currentItem = queueRef.current.find(q => q.id === itemId);
      if (currentItem && currentItem.status === "uploading") {
        updateQueueItem(itemId, {
          status: "error",
          error: error.message || "Upload failed",
          step: isId ? "Gagal" : "Failed"
        });
        toast.error(
          isId
            ? `Gagal mengunggah "${file.name}": ${error.message}`
            : `Failed to upload "${file.name}": ${error.message}`
        );
      }
    } finally {
      processQueue();
    }
  };

  // CANCEL UPLOAD
  const handleCancelUpload = (itemId: string) => {
    const item = queueRef.current.find(i => i.id === itemId);
    if (!item) return;

    if (item.status === "uploading") {
      if (item.xhr) {
        item.xhr.abort();
      }
    }

    updateQueue(prev => prev.filter(i => i.id !== itemId));

    setTimeout(() => {
      processQueue();
    }, 50);
  };

  // Copy Download Link to Clipboard
  const handleCopyLink = (filename: string) => {
    const link = `${window.location.origin}/f/${filename}`;
    navigator.clipboard.writeText(link);
    toast.success(dict.copiedToast);
  };

  // Trigger Deletion Modal
  const handleDeleteFile = (file: UserFile) => {
    setDeleteConfirmFile(file);
  };

  // Execute actual deletion API
  const executeDeleteFile = async (fileId: string) => {
    if (!session?.user) return;
    // @ts-expect-error user id
    const userId = session.user.id;

    try {
      const res = await fetch(`${BACKEND_URL}/api/files/${fileId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete file");
      }

      toast.success(dict.deleteSuccess);
      setSelectedFileIds(prev => prev.filter(id => id !== fileId));
      fetchFiles();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || (isId ? "Gagal menghapus file" : "Failed to delete file"));
    }
  };

  const executeCreateFolder = async () => {
    if (!session?.user || !newFolderName.trim()) return;
    // @ts-expect-error user id
    const userId = session.user.id;

    const currentPathPrefix = currentPath.length > 0 ? `${currentPath.join("/")}/` : "";
    const fullFolderName = `${currentPathPrefix}${newFolderName.trim()}`;

    try {
      let expiresAtPayload = null;
      if (folderExpiryOption !== "forever") {
        if (folderExpiryOption === "custom" && folderCustomExpiry) {
          expiresAtPayload = new Date(folderCustomExpiry).toISOString();
        } else {
          expiresAtPayload = new Date(Date.now() + parseInt(folderExpiryOption) * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      const res = await fetch(`${BACKEND_URL}/api/files/create-folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          folderName: fullFolderName,
          password: folderPassword || null,
          expiresAt: expiresAtPayload,
          burnAfterRead: folderBurnAfterRead
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create folder");
      }

      toast.success(isId ? `Folder "${newFolderName}" berhasil dibuat` : `Folder "${newFolderName}" created successfully`);
      setNewFolderName("");
      setFolderPassword("");
      setFolderExpiryOption("forever");
      setFolderCustomExpiry("");
      setFolderBurnAfterRead(false);
      setIsCreateFolderOpen(false);
      fetchFiles();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || (isId ? "Gagal membuat folder" : "Failed to create folder"));
    }
  };

  const executeDeleteFolder = async (folder: UserFile) => {
    if (!session?.user) return;
    // @ts-expect-error user id
    const userId = session.user.id;

    try {
      const res = await fetch(`${BACKEND_URL}/api/files/${folder.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete folder");
      }

      toast.success(
        isId
          ? `Folder "${folder.originalName.split("/").pop()}" berhasil dihapus`
          : `Folder "${folder.originalName.split("/").pop()}" deleted successfully`
      );
      setSelectedFileIds(prev => prev.filter(id => id !== folder.id));
      fetchFiles(currentPage, pageSizeLimit, currentPath, searchQuery);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || (isId ? "Gagal menghapus folder" : "Failed to delete folder"));
    }
  };

  const executeRenameFile = async () => {
    if (!session?.user || !renameFile || !renameValue.trim()) return;
    // @ts-expect-error user id
    const userId = session.user.id;

    try {
      const res = await fetch(`${BACKEND_URL}/api/files/rename`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          fileId: renameFile.id,
          newName: renameValue.trim()
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rename");
      }

      toast.success(isId ? "Berhasil mengubah nama" : "Renamed successfully");
      setIsRenameOpen(false);
      setRenameFile(null);
      setRenameValue("");
      fetchFiles();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || (isId ? "Gagal mengubah nama" : "Failed to rename"));
    }
  };

  const handleMoveFile = async (fileId: string, targetFolderId: string | null) => {
    if (!session?.user || !fileId) return;
    // @ts-expect-error user id
    const userId = session.user.id;

    try {
      const res = await fetch(`${BACKEND_URL}/api/files/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          fileId,
          targetFolderId
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to move file");
      }

      toast.success(isId ? "Berkas berhasil dipindahkan" : "File moved successfully");
      fetchFiles();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || (isId ? "Gagal memindahkan berkas" : "Failed to move file"));
    }
  };

  // Selection Handlers
  const handleSelectAll = () => {
    const allFilteredIds = filteredFiles.map(f => f.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedFileIds.includes(id));
    if (allSelected) {
      setSelectedFileIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedFileIds(prev => {
        const union = new Set([...prev, ...allFilteredIds]);
        return Array.from(union);
      });
    }
  };

  const handleSelectFile = (id: string) => {
    setSelectedFileIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const executeBulkDelete = async () => {
    if (!session?.user || selectedFileIds.length === 0) return;
    // @ts-expect-error user id
    const userId = session.user.id;

    try {
      const res = await fetch(`${BACKEND_URL}/api/files/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedFileIds, userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete files");
      }

      toast.success(
        isId
          ? `${selectedFileIds.length} berkas berhasil dihapus`
          : `${selectedFileIds.length} files deleted successfully`
      );
      setSelectedFileIds([]);
      fetchFiles(currentPage, pageSizeLimit, currentPath, searchQuery);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || (isId ? "Gagal menghapus berkas" : "Failed to delete files"));
    }
  };

  // Filtered files is pre-paginated and pre-filtered in database/backend
  const filteredFiles = files;

  const usedStorageMB = usedBytes / (1024 * 1024);
  const storagePercentage = Math.min(100, Math.round((usedStorageMB / maxStorageMB) * 100));

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto px-4 py-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-300">
            {dict.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {dict.subtitle}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Capacity Meter Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-100/50 dark:shadow-none md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <FontAwesomeIcon icon={faDatabase} className="text-lg" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                  {dict.statsCardTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {dict.maxFileLabel} {maxFileSizeMB}MB
                </p>
              </div>
            </div>
            <span className="font-mono font-black text-sm text-violet-600 dark:text-violet-400">
              {usedStorageMB.toFixed(1)} / {maxStorageMB} MB ({storagePercentage}%)
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
              <span>0 MB</span>
              <span>{maxStorageMB} MB</span>
            </div>
          </div>
        </div>        {/* Upload Stats Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-slate-500 dark:text-slate-400 font-bold text-xs">
                {isId ? "TOTAL FILE" : "TOTAL FILES"}
              </h4>
              <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                {totalFilesCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FontAwesomeIcon icon={faFile} className="text-xl" />
            </div>
          </div>
          <div className="text-xs font-bold text-slate-450 dark:text-slate-550 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            {isId ? "Ukuran Rata-rata:" : "Average size:"}{" "}
            <span className="text-slate-700 dark:text-slate-350">
              {totalFilesCount > 0
                ? formatBytes(usedBytes / totalFilesCount)
                : "0 Bytes"}
            </span>
          </div>
        </div>
      </div>

      {/* Drag and Drop Uploader */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`bg-white dark:bg-slate-900 border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
          isDragging
            ? "border-violet-500 bg-violet-50/30 dark:bg-violet-950/10 scale-[1.01]"
            : "border-slate-200 dark:border-slate-800 hover:border-violet-500/70 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-violet-50 dark:bg-violet-950/40 rounded-3xl flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300">
            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white text-base">
              {dict.uploadAreaTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {dict.uploadAreaSub}
            </p>
          </div>
          <div className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-xl font-bold uppercase tracking-wider">
            {isId ? "Maksimal" : "Max"} {maxFileSizeMB}MB / File
          </div>
        </div>
      </div>

      {/* Premium Security & Expiration Options Accordion */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-4">
        <button
          type="button"
          onClick={() => setIsUploadConfigExpanded(!isUploadConfigExpanded)}
          className="w-full flex items-center justify-between font-extrabold text-sm text-slate-850 dark:text-white"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <FontAwesomeIcon icon={faLock} className="text-xs" />
            </div>
            <span>{isId ? "Opsi Keamanan & Masa Kedaluwarsa Premium" : "Premium Security & Expiration Options"}</span>
          </div>
          <span className="text-xs text-slate-400">{isUploadConfigExpanded ? "▲" : "▼"}</span>
        </button>

        {isUploadConfigExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                {isId ? "Sandi Perlindungan (Opsional)" : "Optional Password"}
              </label>
              <div className="relative">
                <input
                  type={showUploadPassword ? "text" : "password"}
                  placeholder={isId ? "Masukkan sandi berkas..." : "Enter file password..."}
                  value={uploadPassword}
                  onChange={(e) => setUploadPassword(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-[11px] font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowUploadPassword(!showUploadPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-650 transition-colors p-1"
                >
                  <FontAwesomeIcon icon={showUploadPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Custom Expiry Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                {isId ? "Masa Berlaku Berkas" : "File Expiration"}
              </label>
              <select
                value={uploadExpiryOption}
                onChange={(e) => setUploadExpiryOption(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white rounded-xl text-[11px] font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all cursor-pointer"
              >
                <option value="forever">{isId ? "Selamanya" : "Forever"}</option>
                <option value="1">{isId ? "1 Hari" : "1 Day"}</option>
                <option value="3">{isId ? "3 Hari" : "3 Days"}</option>
                <option value="7">{isId ? "7 Hari" : "7 Days"}</option>
                <option value="30">{isId ? "30 Hari" : "30 Days"}</option>
                <option value="custom">{isId ? "Custom Tanggal & Waktu" : "Custom Date & Time"}</option>
              </select>
              {uploadExpiryOption === "custom" && (
                <input
                  type="datetime-local"
                  required
                  value={uploadCustomExpiry}
                  onChange={(e) => setUploadCustomExpiry(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white rounded-xl text-[11px] font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all mt-2"
                />
              )}
            </div>

            {/* Burn after read */}
            <div className="flex items-center sm:pt-6 px-1">
              <label className="flex items-center gap-2.5 text-xs font-bold select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadBurnAfterRead}
                  onChange={(e) => setUploadBurnAfterRead(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-350 dark:border-slate-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-slate-700 dark:text-slate-300">
                    {isId ? "Sekali unduh langsung hangus" : "Burn after download (once-off)"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal">
                    {isId ? "Berkas terhapus setelah unduhan pertama" : "File deletes after first download"}
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Upload Queue Panel */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-600 dark:bg-violet-400 animate-pulse" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                  {isId ? "Antrean Unggahan" : "Upload Queue"}
                </h3>
                <span className="text-[10px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-lg font-bold">
                  {uploadQueue.filter(i => i.status === "uploading" || i.status === "queued").length} {isId ? "Aktif" : "Active"}
                </span>
              </div>
              {uploadQueue.some(i => i.status === "completed" || i.status === "error") && (
                <button
                  onClick={() => {
                    updateQueue(prev => prev.filter(i => i.status !== "completed" && i.status !== "error"));
                  }}
                  className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350 transition-colors uppercase tracking-wider"
                >
                  {isId ? "Bersihkan Riwayat" : "Clear History"}
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1 space-y-3">
              {uploadQueue.map((item) => {
                const isLarge = item.file.size > LARGE_FILE_THRESHOLD;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 first:pt-0"
                  >
                    {/* Left Column: File Info & Status */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                        <FontAwesomeIcon icon={getFileIcon(item.file.type)} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                            {item.file.name}
                          </h4>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isLarge 
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" 
                              : "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400"
                          }`}>
                            {isLarge ? (isId ? "Besar" : "Large") : (isId ? "Kecil" : "Small")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-550 dark:text-slate-450 font-bold">
                          <span className={
                            item.status === "completed" 
                              ? "text-emerald-600 dark:text-emerald-450" 
                              : item.status === "error" 
                              ? "text-rose-600 dark:text-rose-400"
                              : item.status === "uploading"
                              ? "text-violet-600 dark:text-violet-400"
                              : "text-slate-450 dark:text-slate-500"
                          }>
                            {item.status === "uploading" ? item.step : (
                              item.status === "completed" ? (isId ? "Selesai" : "Completed") : (
                                item.status === "error" ? (item.error || (isId ? "Gagal" : "Failed")) : (
                                  isId ? "Dalam antrean" : "Queued"
                                )
                              )
                            )}
                          </span>
                          <span>•</span>
                          <span className="font-mono">
                            {formatBytes(item.uploadedBytes)} / {formatBytes(item.file.size)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Progress bar & Speed/ETA */}
                    <div className="flex flex-col sm:items-end justify-center w-full sm:w-48 shrink-0 space-y-1">
                      <div className="flex items-center justify-between sm:justify-end w-full gap-2 text-[10px] font-bold text-slate-450 dark:text-slate-500 font-mono">
                        {item.status === "uploading" && item.speed > 0 && (
                          <span>{formatBytes(item.speed)}/s</span>
                        )}
                        {item.status === "uploading" && item.eta > 0 && (
                          <span>
                            ETA: {item.eta > 60 ? `${Math.floor(item.eta / 60)}m ${Math.round(item.eta % 60)}s` : `${Math.round(item.eta)}s`}
                          </span>
                        )}
                        <span className="text-slate-800 dark:text-white font-black">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-205 ${
                            item.status === "completed"
                              ? "bg-emerald-500"
                              : item.status === "error"
                              ? "bg-rose-500"
                              : "bg-violet-600"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Right Column: Control button */}
                    <div className="flex items-center justify-end shrink-0 pl-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelUpload(item.id);
                        }}
                        title={
                          item.status === "uploading" || item.status === "queued"
                            ? (isId ? "Batalkan Unggahan" : "Cancel Upload")
                            : (isId ? "Hapus dari Riwayat" : "Remove from History")
                        }
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                          item.status === "uploading" || item.status === "queued"
                            ? "border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:bg-rose-50/45 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 dark:text-slate-555 hover:text-slate-650 dark:hover:text-slate-350"
                        }`}
                      >
                        <span className="font-bold text-xs">✕</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Files List / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="font-black text-lg text-slate-800 dark:text-white self-start sm:self-center">
            {isId ? "Berkas Unggahan" : "Uploaded Files"}
          </h2>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Create Folder Button */}
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <FontAwesomeIcon icon={faFolderPlus} className="text-sm text-violet-500" />
              {isId ? "Buat Folder" : "New Folder"}
            </button>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-550">
                <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder={dict.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 placeholder-slate-400 transition-all"
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

        {/* Breadcrumbs Navigation */}
        <div className="px-6 py-3 bg-slate-50/40 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCurrentPath([])}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverBreadcrumbIndex(-1);
            }}
            onDragLeave={() => setDragOverBreadcrumbIndex(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverBreadcrumbIndex(null);
              const fileId = e.dataTransfer.getData("text/plain");
              handleMoveFile(fileId, null);
            }}
            className={`hover:text-violet-600 dark:hover:text-violet-400 transition-all flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-xl border border-transparent ${
              dragOverBreadcrumbIndex === -1 ? "bg-violet-100/60 dark:bg-violet-950/40 border-dashed border-violet-500/80 text-violet-600 dark:text-violet-400 scale-[1.02]" : ""
            }`}
          >
            <FontAwesomeIcon icon={faDatabase} className="w-3 h-3 text-violet-500" />
            <span>Storage</span>
          </button>
          {currentPath.map((folder, index) => {
            const isHovered = dragOverBreadcrumbIndex === index;
            return (
              <React.Fragment key={index}>
                <span className="text-slate-350 dark:text-slate-700 shrink-0">/</span>
                <button
                  onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverBreadcrumbIndex(index);
                  }}
                  onDragLeave={() => setDragOverBreadcrumbIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverBreadcrumbIndex(null);
                    const fileId = e.dataTransfer.getData("text/plain");
                    const pathStr = currentPath.slice(0, index + 1).join("/");
                    const folderRecord = files.find(f => f.originalName === pathStr && f.mimeType === "directory");
                    if (folderRecord) {
                      handleMoveFile(fileId, folderRecord.id);
                    }
                  }}
                  className={`hover:text-violet-600 dark:hover:text-violet-400 transition-all max-w-[120px] truncate shrink-0 px-2 py-1 rounded-xl border border-transparent ${
                    isHovered ? "bg-violet-100/60 dark:bg-violet-950/40 border-dashed border-violet-500/80 text-violet-600 dark:text-violet-400 scale-[1.02]" : ""
                  }`}
                >
                  {folder}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <FontAwesomeIcon
              icon={faSpinner}
              className="w-8 h-8 text-violet-600 animate-spin"
            />
            <p className="text-xs text-slate-450 dark:text-slate-500 font-bold">
              {isId ? "Memuat berkas..." : "Loading files..."}
            </p>
          </div>
        ) : filteredFiles.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl flex items-center justify-center text-slate-350 dark:text-slate-600">
              <FontAwesomeIcon icon={faFile} className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                {dict.emptyState}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? (isId ? "Coba cari nama file yang berbeda." : "Try a different file name search.")
                  : (isId ? "Gunakan dropzone di atas untuk mengunggah file baru." : "Use the dropzone above to upload new files.")}
              </p>
            </div>
          </div>
        ) : viewMode === "list" ? (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55/40 dark:bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 font-black">
                  <th className="pl-6 pr-2 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredFiles.length > 0 && filteredFiles.every(f => selectedFileIds.includes(f.id))}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-violet-605 focus:ring-violet-500 accent-violet-600 bg-white dark:bg-slate-950 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4">{dict.tableName}</th>
                  <th className="px-6 py-4">{dict.tableSize}</th>
                  <th className="px-6 py-4">{dict.tableDate}</th>
                  <th className="px-6 py-4 text-right">{dict.tableAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredFiles.map((file) => {
                  const downloadUrl = `${BACKEND_URL}/files/${file.filename}`;
                  const isSelected = selectedFileIds.includes(file.id);
                  const isDir = file.mimeType === "directory";
                  const displayName = file.originalName.split("/").pop() || file.originalName;

                  return (
                    <tr
                      key={file.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", file.id);
                      }}
                      onDragOver={(e) => {
                        if (isDir) {
                          e.preventDefault();
                          if (dragOverFolderId !== file.id) {
                            setDragOverFolderId(file.id);
                          }
                        }
                      }}
                      onDragLeave={() => {
                        if (isDir) {
                          setDragOverFolderId(null);
                        }
                      }}
                      onDrop={(e) => {
                        if (isDir) {
                          e.preventDefault();
                          setDragOverFolderId(null);
                          const fileId = e.dataTransfer.getData("text/plain");
                          if (fileId && fileId !== file.id) {
                            handleMoveFile(fileId, file.id);
                          }
                        }
                      }}
                      onClick={() => {
                        if (isDir) {
                          setCurrentPath([...currentPath, displayName]);
                        }
                      }}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors ${
                        isSelected ? "bg-violet-50/20 dark:bg-violet-950/10" : ""
                      } ${isDir ? "cursor-pointer" : ""} ${
                        dragOverFolderId === file.id
                          ? "border-2 border-dashed border-violet-500/80 bg-violet-100/30 dark:bg-violet-950/20 scale-[1.005] transition-all"
                          : ""
                      }`}
                    >
                      {/* Checkbox Selection */}
                      <td className="pl-6 pr-2 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectFile(file.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-violet-605 focus:ring-violet-500 accent-violet-600 bg-white dark:bg-slate-950 cursor-pointer"
                        />
                      </td>

                      {/* Filename & Mime */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDir) {
                                setCurrentPath([...currentPath, displayName]);
                              }
                            }}
                            disabled={!isDir}
                            className={`w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 border border-transparent ${
                              isDir ? "hover:border-violet-500 hover:text-violet-500 bg-violet-50/20 dark:bg-violet-950/10 cursor-pointer" : ""
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
                                className="text-xs font-black text-slate-800 dark:text-white truncate hover:text-violet-600 dark:hover:text-violet-400 text-left focus:outline-none"
                              >
                                {displayName}
                              </button>
                            ) : (
                              <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                                {displayName}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 dark:text-slate-555 font-bold truncate">
                              {isDir ? (isId ? "Folder Direktori" : "Folder Directory") : file.mimeType}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
                        {isDir ? "—" : formatBytes(file.size)}
                      </td>

                      {/* Date Uploaded */}
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {new Date(file.createdAt).toLocaleString(
                          language === "id" ? "id-ID" : "en-US",
                          { dateStyle: "medium", timeStyle: "short" }
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {!isDir ? (
                            <>
                              {/* Preview File */}
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

                              {/* Copy URL */}
                              <button
                                onClick={() => handleCopyLink(file.filename)}
                                title={isId ? "Salin Link" : "Copy Link"}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-all"
                              >
                                <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                              </button>

                              {/* Download Link */}
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={isId ? "Unduh File" : "Download File"}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 flex items-center justify-center transition-all"
                              >
                                <FontAwesomeIcon
                                  icon={faDownload}
                                  className="w-3.5 h-3.5"
                                />
                              </a>
                            </>
                          ) : (
                            <>
                              {/* Copy Folder Share Link */}
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}/shared-folder/${file.filename}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success(isId ? "Tautan folder berhasil disalin!" : "Folder link copied successfully!");
                                }}
                                title={isId ? "Salin Link Folder" : "Copy Folder Link"}
                                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-all"
                              >
                                <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Rename File / Folder */}
                          <button
                            onClick={() => {
                              setRenameFile(file);
                              setRenameValue(displayName);
                              setIsRenameOpen(true);
                            }}
                            title={isId ? "Ubah Nama" : "Rename"}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-all"
                          >
                            <FontAwesomeIcon
                              icon={faEdit}
                              className="w-3.5 h-3.5"
                            />
                          </button>

                          {/* Delete File */}
                          <button
                            onClick={() => handleDeleteFile(file)}
                            title={isId ? (isDir ? "Hapus Folder" : "Hapus File") : (isDir ? "Delete Folder" : "Delete File")}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-500 hover:bg-red-50/40 dark:hover:bg-red-950/20 text-slate-500 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-400 flex items-center justify-center transition-all"
                          >
                            <FontAwesomeIcon
                              icon={faTrashAlt}
                              className="w-3.5 h-3.5"
                            />
                          </button>
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
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredFiles.map((file) => {
                const displayName = file.originalName.split("/").pop() || file.originalName;
                const isDir = file.mimeType === "directory";
                const isSelected = selectedFileIds.includes(file.id);
                const isImage = file.mimeType.toLowerCase().includes("image");
                const isVideo = file.mimeType.toLowerCase().includes("video");

                const downloadUrl = `${BACKEND_URL}/files/${file.filename}`;

                return (
                  <motion.div
                    key={file.id}
                    layout
                    draggable={true}
                    onDragStart={(e: any) => {
                      e.dataTransfer.setData("text/plain", file.id);
                    }}
                    onDragOver={(e: any) => {
                      if (isDir) {
                        e.preventDefault();
                        if (dragOverFolderId !== file.id) {
                          setDragOverFolderId(file.id);
                        }
                      }
                    }}
                    onDragLeave={() => {
                      if (isDir) {
                        setDragOverFolderId(null);
                      }
                    }}
                    onDrop={(e: any) => {
                      if (isDir) {
                        e.preventDefault();
                        setDragOverFolderId(null);
                        const fileId = e.dataTransfer.getData("text/plain");
                        if (fileId && fileId !== file.id) {
                          handleMoveFile(fileId, file.id);
                        }
                      }
                    }}
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
                    className={`relative bg-slate-50/40 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300 group hover:shadow-lg hover:scale-[1.02] ${
                      isSelected ? "bg-violet-50/20 dark:bg-violet-950/10 border-violet-500/60" : ""
                    } ${
                      dragOverFolderId === file.id
                        ? "border-2 border-dashed border-violet-500/80 bg-violet-100/30 dark:bg-violet-950/20 scale-[1.005]"
                        : ""
                    }`}
                  >
                    {/* Checkbox Selection */}
                    <div 
                      className={`absolute top-3 left-3 z-10 transition-opacity ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectFile(file.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-violet-605 focus:ring-violet-500 accent-violet-600 bg-white dark:bg-slate-950 cursor-pointer"
                      />
                    </div>

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
                      <p className="text-[9px] text-slate-455 dark:text-slate-555 font-bold truncate">
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

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(file.filename)}
                            title={isId ? "Salin Link" : "Copy Link"}
                            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-550 dark:text-slate-400 hover:text-violet-650 dark:hover:text-violet-400 flex items-center justify-center transition-all"
                          >
                            <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                          </button>

                          {/* Download */}
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={isId ? "Unduh File" : "Download File"}
                            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 flex items-center justify-center transition-all"
                          >
                            <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                          </a>
                        </>
                      ) : null}

                      {/* Rename */}
                      <button
                        onClick={() => {
                          setRenameFile(file);
                          setRenameValue(displayName);
                          setIsRenameOpen(true);
                        }}
                        title={isId ? "Ubah Nama" : "Rename"}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-slate-550 dark:text-slate-400 hover:text-violet-650 dark:hover:text-violet-400 flex items-center justify-center transition-all"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteFile(file)}
                        title={isId ? (isDir ? "Hapus Folder" : "Hapus File") : (isDir ? "Delete Folder" : "Delete File")}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-500 hover:bg-red-55/40 dark:hover:bg-red-950/20 text-slate-500 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-400 flex items-center justify-center transition-all"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} className="w-3 h-3" />
                      </button>
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
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isId ? "Tampilkan:" : "Show:"}
              </span>
              <select
                value={pageSizeLimit}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value);
                  setPageSizeLimit(newLimit);
                  setCurrentPage(1);
                  fetchFiles(1, newLimit, currentPath, searchQuery);
                }}
                className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-slate-700 dark:text-slate-300 font-extrabold cursor-pointer transition-all"
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
                    fetchFiles(prev, pageSizeLimit, currentPath, searchQuery);
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
                        fetchFiles(pageNum, pageSizeLimit, currentPath, searchQuery);
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
                    fetchFiles(next, pageSizeLimit, currentPath, searchQuery);
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

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmFile && (() => {
          const isDir = deleteConfirmFile.mimeType === "directory";
          const folderName = deleteConfirmFile.originalName.split("/").pop() || deleteConfirmFile.originalName;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-55/10 dark:bg-red-950/40 flex items-center justify-center text-red-650 dark:text-red-400 shrink-0 border border-red-100 dark:border-red-900/30">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                      {isDir
                        ? (isId ? "Hapus Folder?" : "Delete Folder?")
                        : (isId ? "Hapus File?" : "Delete File?")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {isDir ? (
                        isId
                          ? `Apakah Anda yakin ingin menghapus folder "${folderName}" beserta seluruh isinya secara permanen? Tindakan ini tidak dapat dibatalkan.`
                          : `Are you sure you want to permanently delete folder "${folderName}" and all of its contents? This action cannot be undone.`
                      ) : (
                        isId
                          ? `Apakah Anda yakin ingin menghapus file "${deleteConfirmFile.originalName}"? Tindakan ini tidak dapat dibatalkan.`
                          : `Are you sure you want to delete "${deleteConfirmFile.originalName}"? This action cannot be undone.`
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeleteConfirmFile(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    onClick={() => {
                      const file = deleteConfirmFile;
                      setDeleteConfirmFile(null);
                      if (isDir) {
                        executeDeleteFolder(file);
                      } else {
                        executeDeleteFile(file.id);
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-red-650 to-rose-600 dark:from-red-600 dark:to-rose-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-red-500/20 hover:opacity-90 transition-opacity"
                  >
                    {isId ? "Hapus" : "Delete"}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Custom Create Folder Modal */}
      <AnimatePresence>
        {isCreateFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <FontAwesomeIcon icon={faFolderPlus} className="text-lg" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    {isId ? "Buat Folder Baru" : "Create New Folder"}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-555 font-bold">
                    {isId ? "Masukkan nama folder di bawah" : "Enter directory name below"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={isId ? "Nama Folder" : "Folder Name"}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) executeCreateFolder();
                  }}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 placeholder-slate-400 transition-all"
                  autoFocus
                />

                {/* Password Protection */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {isId ? "Sandi Folder (Opsional)" : "Folder Password (Optional)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showFolderPassword ? "text" : "password"}
                      placeholder={isId ? "Sandi..." : "Password..."}
                      value={folderPassword}
                      onChange={(e) => setFolderPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 placeholder-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFolderPassword(!showFolderPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-650 transition-colors p-1"
                    >
                      <FontAwesomeIcon icon={showFolderPassword ? faEyeSlash : faEye} className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Folder Expiration Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {isId ? "Masa Berlaku Folder" : "Folder Expiration"}
                  </label>
                  <select
                    value={folderExpiryOption}
                    onChange={(e) => setFolderExpiryOption(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer transition-all"
                  >
                    <option value="forever">{isId ? "Selamanya" : "Forever"}</option>
                    <option value="1">{isId ? "1 Hari" : "1 Day"}</option>
                    <option value="3">{isId ? "3 Hari" : "3 Days"}</option>
                    <option value="7">{isId ? "7 Hari" : "7 Days"}</option>
                    <option value="30">{isId ? "30 Hari" : "30 Days"}</option>
                    <option value="custom">{isId ? "Custom Tanggal & Waktu" : "Custom Date & Time"}</option>
                  </select>
                  {folderExpiryOption === "custom" && (
                    <input
                      type="datetime-local"
                      required
                      value={folderCustomExpiry}
                      onChange={(e) => setFolderCustomExpiry(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 mt-2 transition-all"
                    />
                  )}
                </div>

                {/* Burn after read */}
                <div className="flex items-center px-1 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={folderBurnAfterRead}
                      onChange={(e) => setFolderBurnAfterRead(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-350 dark:border-slate-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-slate-700 dark:text-slate-300">
                        {isId ? "Sekali akses langsung hangus" : "Burn after view (once-off)"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsCreateFolderOpen(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button
                  onClick={executeCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-500 dark:to-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-violet-650/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isId ? "Buat" : "Create"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Rename Modal */}
      <AnimatePresence>
        {isRenameOpen && renameFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <FontAwesomeIcon icon={faEdit} className="text-lg" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    {isId ? "Ubah Nama" : "Rename"}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-555 font-bold">
                    {isId ? "Masukkan nama baru di bawah" : "Enter new name below"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={isId ? "Nama Baru" : "New Name"}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && renameValue.trim()) executeRenameFile();
                  }}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 placeholder-slate-400 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsRenameOpen(false);
                    setRenameFile(null);
                    setRenameValue("");
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button
                  onClick={executeRenameFile}
                  disabled={!renameValue.trim() || renameValue.trim() === (renameFile.originalName.split("/").pop() || renameFile.originalName)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-500 dark:to-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-violet-650/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isId ? "Simpan" : "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedFileIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center justify-between gap-6 shadow-2xl max-w-md w-[90%] sm:w-auto"
          >
            <div className="flex items-center gap-2 text-white shrink-0">
              <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-black">
                {selectedFileIds.length}
              </div>
              <span className="text-xs font-bold">
                {isId ? `${selectedFileIds.length} berkas terpilih` : `${selectedFileIds.length} files selected`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFileIds([])}
                className="px-3 py-1.5 border border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-colors"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-red-650 to-rose-600 dark:from-red-600 dark:to-rose-500 rounded-xl text-[10px] font-black text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faTrashAlt} className="w-2.5 h-2.5" />
                {isId ? "Hapus Terpilih" : "Delete Selected"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {isBulkDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-55/10 dark:bg-red-950/40 flex items-center justify-center text-red-650 dark:text-red-400 shrink-0 border border-red-100 dark:border-red-900/30">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    {isId ? "Hapus Banyak Berkas?" : "Delete Multiple Files?"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isId
                      ? `Apakah Anda yakin ingin menghapus ${selectedFileIds.length} berkas yang dipilih? Tindakan ini tidak dapat dibatalkan.`
                      : `Are you sure you want to delete ${selectedFileIds.length} selected files? This action cannot be undone.`}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button
                  onClick={() => {
                    setIsBulkDeleteConfirmOpen(false);
                    executeBulkDelete();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-650 to-rose-600 dark:from-red-600 dark:to-rose-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-red-500/20 hover:opacity-90 transition-opacity"
                >
                  {isId ? "Hapus Berkas" : "Delete Files"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium File Preview Modal */}
      <AnimatePresence>
        {previewFile && (() => {
          const mime = previewFile.mimeType.toLowerCase();
          const isImage = mime.includes("image");
          const isVideo = mime.includes("video");
          const isAudio = mime.includes("audio");
          const isPdf = mime.includes("pdf");

          const previewRawUrl = `${BACKEND_URL}/files/${previewFile.filename}`;
          const secureDownloadUrl = `${BACKEND_URL}/api/files/download/${previewFile.filename}`;

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
                  className="absolute top-4 right-4 w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-white dark:bg-slate-900 z-10"
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
                        {previewFile.originalName}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 truncate">
                        {previewFile.mimeType}
                      </p>
                    </div>
                  </div>

                  {/* Media Player Area */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/80 overflow-hidden flex items-center justify-center p-2 sm:p-4 min-h-[140px]">
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
                          onTimeUpdate={() => {
                            const audio = previewAudioRef.current;
                            if (audio && audio.duration) {
                              setAudioProgress((audio.currentTime / audio.duration) * 100);
                            }
                          }}
                          onLoadedMetadata={() => {
                            const audio = previewAudioRef.current;
                            if (audio) {
                              setAudioDuration(audio.duration);
                            }
                          }}
                          onEnded={() => {
                            setIsPlaying(false);
                            setAudioProgress(0);
                          }}
                        />
                        <button
                          onClick={togglePlayAudio}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-violet-600 hover:bg-violet-750 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition-transform duration-200 active:scale-90 shrink-0"
                        >
                          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-xs sm:text-sm" />
                        </button>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-800 dark:text-white truncate">
                            {previewFile.originalName}
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
                            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 font-mono shrink-0 select-none">
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
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700">
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
                        <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{isId ? "Ukuran" : "Size"}</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5 block truncate">{formatBytes(previewFile.size)}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
                      <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950/40 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                      </div>
                      <div className="min-w-0 w-full">
                        <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{isId ? "Tanggal" : "Date"}</span>
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
                        <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{isId ? "Tipe" : "Type"}</span>
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
                            : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300"
                        }`}
                      >
                        {isId ? "Link Langsung" : "Direct Link"}
                      </button>
                      <button
                        onClick={() => setPreviewActiveTab("html")}
                        className={`pb-1 text-[10px] font-black uppercase tracking-wider transition-all relative shrink-0 ${
                          previewActiveTab === "html"
                            ? "text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full"
                            : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300"
                        }`}
                      >
                        HTML Embed
                      </button>
                      <button
                        onClick={() => setPreviewActiveTab("markdown")}
                        className={`pb-1 text-[10px] font-black uppercase tracking-wider transition-all relative shrink-0 ${
                          previewActiveTab === "markdown"
                            ? "text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600 after:rounded-full"
                            : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300"
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
