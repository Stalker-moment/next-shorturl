'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCode, faUsers, faTrash, faCopy, faCheck,
  faLink, faPlus, faEye, faLock, faFire, faHistory,
  faCalendarAlt, faEyeSlash, faTimes, faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomDropdown } from "@/components/landing/CustomDropdown";

interface PasteEntry {
  id: string;
  title: string | null;
  content: string;
  language: string;
  expiresAt: string | null;
  burnAfterRead: boolean;
  views: number;
  createdAt: string;
}

interface RoomEntry {
  id: string;
  name: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function UserPastebinDashboard() {
  const { language } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pastes, setPastes] = useState<PasteEntry[]>([]);
  const [rooms, setRooms] = useState<RoomEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'paste' | 'room' } | null>(null);

  // Modal states for creating new paste / room
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pasteType, setPasteType] = useState<'url' | 'room'>('url');
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [pasteLanguage, setPasteLanguage] = useState("plaintext");
  const [duration, setDuration] = useState("30");
  const [pastePassword, setPastePassword] = useState("");
  const [pasteBurnAfterRead, setPasteBurnAfterRead] = useState(false);
  const [showPastePassword, setShowPastePassword] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [showRoomPassword, setShowRoomPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const isId = language === "id";

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      if (pasteType === 'url') {
        if (!pasteContent.trim()) {
          toast.error(isId ? 'Konten paste tidak boleh kosong.' : 'Paste content cannot be empty.');
          setIsCreating(false);
          return;
        }

        const payload = {
          title: pasteTitle.trim() || ("Paste - " + new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US')),
          content: pasteContent,
          language: pasteLanguage,
          expiresAt: duration === 'forever' ? null : new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString(),
          password: pastePassword || null,
          burnAfterRead: pasteBurnAfterRead,
          userId: session?.user ? (session.user as { id: string }).id : null
        };

        const res = await fetch("/api/paste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat paste.");

        toast.success(isId ? "Berhasil membuat paste!" : "Paste created successfully!");
        fetchUserPastes();
        setShowCreateModal(false);
      } else {
        if (!roomName.trim()) {
          toast.error(isId ? 'Nama ruangan tidak boleh kosong.' : 'Room name cannot be empty.');
          setIsCreating(false);
          return;
        }

        const payload = {
          name: roomName.trim(),
          password: roomPassword || null,
          userId: session?.user ? (session.user as { id: string }).id : null
        };

        const res = await fetch("/api/paste/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat ruangan.");

        toast.success(isId ? "Berhasil membuat ruangan kolaborasi!" : "Collaborative room created successfully!");
        fetchUserPastes();
        setShowCreateModal(false);
        // Automatically redirect to room
        router.push(`/paste/room/${json.data.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsCreating(false);
    }
  };

  const fetchUserPastes = async () => {
    try {
      const res = await fetch("/api/paste/user");
      const json = await res.json();
      if (res.ok) {
        setPastes(json.data.pastes || []);
        setRooms(json.data.rooms || []);
      }
    } catch (err) {
      toast.error(isId ? "Gagal memuat daftar paste Anda" : "Failed to load your pastes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchUserPastes();
    }
  }, [status, router]);

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success(isId ? "Tautan berhasil disalin!" : "Link copied successfully!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(isId ? "Gagal menyalin tautan" : "Failed to copy link");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const endpoint = deleteTarget.type === 'paste' 
        ? `/api/paste/${deleteTarget.id}` 
        : `/api/paste/room/${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        toast.success(isId ? "Berhasil dihapus!" : "Successfully deleted!");
        if (deleteTarget.type === 'paste') {
          setPastes(prev => prev.filter(p => p.id !== deleteTarget.id));
        } else {
          setRooms(prev => prev.filter(r => r.id !== deleteTarget.id));
        }
      } else {
        toast.error(isId ? "Gagal menghapus aset" : "Failed to delete asset");
      }
    } catch {
      toast.error(isId ? "Koneksi bermasalah" : "Network error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredPastes = pastes.filter(p => 
    (p.title || "Untitled").toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-40 opacity-50">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
          {isId ? "Memuat Pastebin Anda..." : "Loading your Pastebins..."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full text-slate-900 dark:text-white selection:bg-indigo-500/30 flex flex-col relative pb-20 font-sans">
      
      {/* Dynamic Header */}
      <div className="sticky top-0 z-[50] bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-b border-slate-200/30 dark:border-white/5 h-14 flex items-center px-4 sm:px-8 justify-between -mx-4 sm:-mx-10 -mt-6 sm:-mt-8 mb-8">
        <div className="w-[100px]" />
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <FontAwesomeIcon icon={faCode} />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 dark:text-white leading-none block mb-1">
              {isId ? "Dashboard Pastebin & Room" : "Pastebin & Room Dashboard"}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest hidden sm:block">
              {isId ? "Kelola Catatan Terenkripsi & Ruang Kolaborasi" : "Manage Encrypted Notes & Collaborative Rooms"}
            </span>
          </div>
        </div>
        <div className="w-[100px]" />
      </div>

      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full px-2 sm:px-8 py-6 space-y-8">
        
        {/* Statistics & Search bar */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              {isId ? "Pastebin & Room Saya" : "My Pastes & Rooms"}
            </h1>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-60">
              <span>{pastes.length} Snippets</span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              <span>{rooms.length} Rooms</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <input 
              type="text" 
              placeholder={isId ? "Cari judul, bahasa..." : "Search title, language..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm w-full sm:w-[220px]"
            />

            <button 
              onClick={() => {
                setPasteTitle("");
                setPasteContent("");
                setPasteLanguage("plaintext");
                setDuration("30");
                setPastePassword("");
                setPasteBurnAfterRead(false);
                setRoomName("");
                setRoomPassword("");
                setShowRoomPassword(false);
                setShowCreateModal(true);
              }} 
              className="px-6 h-12 bg-gradient-to-r from-violet-600 to-indigo-650 text-white rounded-2xl font-extrabold text-xs shadow-md shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shrink-0"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>{isId ? "Buat Paste & Room" : "Create Paste & Room"}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid Lists */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
          
          {/* Pastebin Snippets Panel */}
          <div className="bg-white/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-[32px] p-6 flex flex-col shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50 dark:border-white/5 mb-5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 text-sm">
                📋
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">
                  {isId ? "Catatan Pastebin" : "Pastebin Snippets"}
                </h3>
                <p className="text-[9px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
                  {isId ? `Total ${pastes.length} Snippets Terdaftar` : `Total ${pastes.length} Registered Snippets`}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar no-scrollbar max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/50 dark:bg-black/30 border-b border-slate-200/50 dark:border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-2.5">{isId ? "Judul & Detail" : "Title & Details"}</th>
                    <th className="px-2 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">{isId ? "Kelola" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold">
                  {filteredPastes.map((p) => {
                    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/paste/${p.id}` : `/paste/${p.id}`;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-3 py-4">
                          <div className="min-w-0">
                            <a 
                              href={`/paste/${p.id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-extrabold text-xs text-slate-900 dark:text-white hover:text-indigo-500 transition-colors hover:underline block truncate max-w-[150px]"
                            >
                              {p.title || "Untitled"}
                            </a>
                            <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                              <span className="capitalize bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded font-bold">{p.language}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <FontAwesomeIcon icon={faEye} />
                                {p.views} views
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          {p.burnAfterRead ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/25 animate-pulse">
                              <FontAwesomeIcon icon={faFire} />
                              Once-View
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleCopyLink(fullUrl, p.id)}
                              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all border ${
                                copiedId === p.id 
                                  ? 'bg-emerald-500 text-white border-emerald-500' 
                                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-white/5 hover:bg-indigo-50 hover:text-indigo-600'
                              }`}
                            >
                              <FontAwesomeIcon icon={copiedId === p.id ? faCheck : faCopy} className="text-xs" />
                            </button>
                            <button 
                              onClick={() => setDeleteTarget({ id: p.id, type: 'paste' })}
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPastes.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                        {isId ? "Tidak Ada Teks Terdaftar" : "No Registered Text Snippets"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Realtime Rooms Panel */}
          <div className="bg-white/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-[32px] p-6 flex flex-col shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50 dark:border-white/5 mb-5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm">
                💬
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">
                  {isId ? "Ruang Kolaborasi" : "Realtime Rooms"}
                </h3>
                <p className="text-[9px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
                  {isId ? `Total ${rooms.length} Ruangan Terdaftar` : `Total ${rooms.length} Registered Rooms`}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar no-scrollbar max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/50 dark:bg-black/30 border-b border-slate-200/50 dark:border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-2.5">{isId ? "Nama Ruang & Dibuat" : "Room Name & Created"}</th>
                    <th className="px-2 py-2.5">Masa Aktif</th>
                    <th className="px-3 py-2.5 text-right">{isId ? "Kelola" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold">
                  {filteredRooms.map((r) => {
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-3 py-4">
                          <div className="min-w-0">
                            <a 
                              href={`/paste/room/${r.id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-extrabold text-xs text-slate-900 dark:text-white hover:text-indigo-500 transition-colors hover:underline block truncate max-w-[150px]"
                            >
                              {r.name}
                            </a>
                            <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-[8px]" />
                              <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                            Permanent 🔒
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => router.push(`/paste/room/${r.id}`)}
                              className="px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-black/10"
                            >
                              {isId ? "Masuk" : "Join"}
                            </button>
                            <button 
                              onClick={() => setDeleteTarget({ id: r.id, type: 'room' })}
                              className="w-8 h-8 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shrink-0"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRooms.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                        {isId ? "Tidak Ada Ruang Aktif" : "No Active Collaborative Rooms"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </motion.main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-[32px] p-10 max-w-sm w-full relative z-10 text-center shadow-2xl border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 text-xl">
                <FontAwesomeIcon icon={faTrash} />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isId ? "Hapus aset ini?" : "Delete this asset?"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 leading-relaxed">
                {isId 
                  ? "Tindakan ini tidak dapat dikembalikan. Pengguna tidak akan dapat mengakses konten ini lagi."
                  : "This action cannot be undone. Users will no longer be able to access this content."}
              </p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-xs font-bold transition-all">
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button onClick={handleDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-bold shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                  {isId ? "Ya, Hapus" : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowCreateModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-slate-800 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-2xl text-slate-900 dark:text-white"
            >
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm">
                      <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight">
                      {isId ? "Buat Catatan & Room" : "Create Paste & Room"}
                    </h2>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all p-1">
                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                  </button>
                </div>

                {/* Concept Toggler Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1 border border-slate-200/50 dark:border-slate-800/80 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => setPasteType('url')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      pasteType === 'url'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCode} className="w-3.5 h-3.5" />
                    <span>Pastebin (URL)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasteType('room')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      pasteType === 'room'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5" />
                    <span>Realtime Room</span>
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  {pasteType === 'url' ? (
                    <>
                      {/* Paste Title */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                          {isId ? "Judul Catatan (Opsional)" : "Paste Title (Optional)"}
                        </label>
                        <input
                          type="text"
                          placeholder={isId ? "Misal: Solusi Bug Next.js" : "e.g. Next.js Bug Solution"}
                          value={pasteTitle}
                          onChange={(e) => setPasteTitle(e.target.value)}
                          className="w-full h-11 px-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
                        />
                      </div>

                      {/* Paste Content */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                          {isId ? "Konten Teks / Kode" : "Text / Code Content"}
                        </label>
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/50 shadow-inner">
                          <textarea
                            required
                            value={pasteContent}
                            onChange={(e) => setPasteContent(e.target.value)}
                            placeholder={isId ? "Tulis atau tempel kode Anda di sini..." : "Write or paste your code snippet here..."}
                            className="w-full h-32 p-4 text-xs font-mono bg-transparent border-none focus:ring-0 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none font-medium"
                          />
                        </div>
                      </div>

                      {/* Dropdown controls grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Language Selection */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                            Syntax Highlighting
                          </label>
                          <CustomDropdown
                            value={pasteLanguage}
                            onChange={(val) => setPasteLanguage(val)}
                            options={[
                              { value: "plaintext", label: "Plain Text" },
                              { value: "javascript", label: "JavaScript" },
                              { value: "typescript", label: "TypeScript" },
                              { value: "html", label: "HTML" },
                              { value: "css", label: "CSS" },
                              { value: "python", label: "Python" },
                              { value: "cpp", label: "C++" },
                              { value: "json", label: "JSON" }
                            ]}
                          />
                        </div>

                        {/* Expiration Selection */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                            Expiration Duration
                          </label>
                          <CustomDropdown
                            value={duration}
                            onChange={(val) => setDuration(val)}
                            options={[
                              { value: "1", label: isId ? "1 Hari" : "1 Day" },
                              { value: "3", label: isId ? "3 Hari" : "3 Days" },
                              { value: "7", label: isId ? "7 Hari" : "7 Days" },
                              { value: "30", label: isId ? "30 Hari" : "30 Days" },
                              { value: "forever", label: isId ? "Selamanya 🔒" : "Forever 🔒" }
                            ]}
                          />
                        </div>

                        {/* Password Protection */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                            Password Security
                          </label>
                          <div className="relative">
                            <input
                              type={showPastePassword ? "text" : "password"}
                              placeholder={isId ? "Sandi Opsional..." : "Optional Password..."}
                              value={pastePassword}
                              onChange={(e) => setPastePassword(e.target.value)}
                              className="w-full h-11 pl-4 pr-10 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPastePassword(!showPastePassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors p-1"
                            >
                              <FontAwesomeIcon icon={showPastePassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Burn after read */}
                        <div className="flex items-center pt-5 px-1">
                          <label className="flex items-center gap-2.5 text-xs font-bold select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pasteBurnAfterRead}
                              onChange={(e) => setPasteBurnAfterRead(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              {isId ? "Sekali lihat langsung hangus" : "Burn after read"}
                            </span>
                          </label>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Room Name Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                          {isId ? "Nama Ruangan Kolaborasi" : "Collaborative Room Name"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={isId ? "e.g. Mabar Coding, Diskusi Pemrograman" : "e.g. Live Coding Session, Tech Discussion"}
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          className="w-full h-11 px-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
                        />
                      </div>

                      {/* Room Password Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                          {isId ? "Sandi Ruangan (Opsional)" : "Room Password (Optional)"}
                        </label>
                        <div className="relative">
                          <input
                            type={showRoomPassword ? "text" : "password"}
                            placeholder={isId ? "Sandi Opsional..." : "Optional Password..."}
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                            className="w-full h-11 pl-4 pr-10 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-xs font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRoomPassword(!showRoomPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-650 transition-colors p-1"
                          >
                            <FontAwesomeIcon icon={showRoomPassword ? faEyeSlash : faEye} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Premium indicator info box */}
                      <div className="p-4 rounded-2xl border text-xs font-bold leading-relaxed flex items-start gap-3 shadow-inner bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <div className="text-base shrink-0">💡</div>
                        <div>
                          <p className="font-extrabold uppercase tracking-wide text-[10px] mb-0.5">
                            {isId ? "Status Akun Premium Aktif" : "Active Premium Account"}
                          </p>
                          <p className="font-semibold opacity-90">
                            {isId 
                              ? "Ruangan kolaborasi Anda bersifat permanen tanpa batas waktu, dan tidak ada batasan jumlah user terhubung secara bersamaan!"
                              : "Your collaborative rooms will live forever, and there are absolutely no limits on concurrent connected users!"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Submit buttons */}
                  <div className="flex gap-4 pt-4 border-t border-slate-200/50 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 rounded-2xl text-xs font-bold transition-all text-center dark:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                    >
                      {isId ? "Batal" : "Cancel"}
                    </button>
                    <button
                      disabled={isCreating}
                      type="submit"
                      className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-650 text-white rounded-2xl text-xs font-extrabold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-violet-500/20 flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>{isId ? "Buat Sekarang" : "Create Now"}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
