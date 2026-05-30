'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faPaperPlane, faSpinner, faHome, 
  faExclamationTriangle, faSignal, faFileAlt, faComments,
  faHourglassHalf, faUserSecret, faLock
} from '@fortawesome/free-solid-svg-icons';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';

interface Message {
  id: string;
  roomId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface RoomData {
  id: string;
  name: string;
  userId: string | null;
  expiresAt: string | null;
  messages: Message[];
}

export default function CollaborativeRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string;
  const { data: session } = useSession();

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [roomFullMessage, setRoomFullMessage] = useState<string | null>(null);

  // Identity Modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [activeUsername, setActiveUsername] = useState('');

  // Editor states
  const [padContent, setPadContent] = useState('');
  const [isTypingRemote, setIsTypingRemote] = useState(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Password protect states
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [activeUserCount, setActiveUserCount] = useState(1);
  const [activeUsersList, setActiveUsersList] = useState<{username: string, socketId: string}[]>([]);

  // Fetch Room Info
  // Fetch Room Info
  const fetchRoomInfo = async (providedPassword?: string) => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);
    setPasswordError("");

    try {
      const passwordQuery = providedPassword ? `?password=${encodeURIComponent(providedPassword)}` : "";
      const res = await fetch(`/api/paste/room/${roomId}${passwordQuery}`);
      const json = await res.json();

      if (res.status === 401 && json.requiresPassword) {
        setRequiresPassword(true);
        if (providedPassword) {
          setPasswordError(json.error || "Sandi ruangan salah.");
        }
        return;
      }

      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat info ruangan.");
      }

      setRoom(json.data);
      setChatMessages(json.data.messages || []);
      setRequiresPassword(false);
      if (providedPassword) {
        setVerifiedPassword(providedPassword);
      }
      
      // Determine username
      if (session?.user?.name) {
        setActiveUsername(session.user.name);
      } else {
        setShowNameModal(true);
      }
    } catch (err: any) {
      setError(err.message || "Ruangan tidak ditemukan atau sudah kedaluwarsa.");
    } finally {
      setIsLoading(false);
      setIsSubmittingPassword(false);
    }
  };

  useEffect(() => {
    fetchRoomInfo();
  }, [roomId, session]);

  // Socket Connection logic
  useEffect(() => {
    if (!roomId || !activeUsername || socketRef.current) return;
    if (requiresPassword) return;

    // Connect to WebSocket Server (port 1888)
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join Room
      socket.emit('room:join', { roomId, username: activeUsername, password: verifiedPassword || null });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Content typing updates
    socket.on('room:type', (content: string) => {
      setIsTypingRemote(true);
      setPadContent(content);
      // Reset indicator
      const timer = setTimeout(() => setIsTypingRemote(false), 800);
      return () => clearTimeout(timer);
    });

    // Chat Message updates
    socket.on('room:message', (message: Message) => {
      setChatMessages((prev) => {
        // Avoid duplicate messages
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    // User join/left notification
    socket.on('room:users-list', (users: { username: string; socketId: string }[]) => {
      setActiveUsersList((prev) => {
        const updatedList = [...prev];
        users.forEach((user) => {
          if (!updatedList.some((u) => u.socketId === user.socketId)) {
            updatedList.push(user);
          }
        });
        return updatedList;
      });
    });

    socket.on('room:user-joined', ({ username, socketId }) => {
      setActiveUsersList((prev) => {
        if (prev.some((u) => u.socketId === socketId)) return prev;
        return [...prev, { username, socketId }];
      });
    });

    socket.on('room:user-left', ({ username, socketId }) => {
      setActiveUsersList((prev) => prev.filter((u) => u.socketId !== socketId));
    });

    // Room Capacity limitations
    socket.on('room:full', (msg: string) => {
      setRoomFullMessage(msg);
      socket.disconnect();
    });

    socket.on('room:error', (msg: string) => {
      setError(msg);
      socket.disconnect();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, activeUsername, verifiedPassword, requiresPassword]);

  // Scroll to bottom when message list changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [chatMessages]);

  const handleJoinWithName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setActiveUsername(usernameInput.trim());
    setShowNameModal(false);
  };

  const handlePadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPadContent(val);
    if (socketRef.current && isConnected) {
      socketRef.current.emit('room:type', { roomId, content: val });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !isConnected) return;

    socketRef.current.emit('room:message', {
      roomId,
      senderName: activeUsername,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white dark:bg-slate-900 shadow-xl rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 mb-8">
            <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Mempersiapkan Ruangan... 🚀</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sedang memverifikasi ruangan kolaborasi.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-700">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Waduh, Gagal Masuk Ruangan 🚫</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-10">
            {error}
          </p>
          <Link
            href="/"
            className="w-full h-14 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  if (roomFullMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 shadow-2xl shadow-amber-500/10">
          <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100 dark:border-amber-800/50">
            <FontAwesomeIcon icon={faUsers} className="w-10 h-10 text-amber-500 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Kapasitas Penuh 🔒</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-10">
            {roomFullMessage}
          </p>
          <Link
            href="/"
            className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // Render password overlay if room is password-protected
  if (requiresPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl text-center">
          <div className="w-20 h-20 bg-violet-55/10 dark:bg-violet-950/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-100 dark:border-violet-900/30">
            <FontAwesomeIcon icon={faLock} className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          
          <h1 className="text-2xl font-black mb-2 tracking-tight">Ruangan Terproteksi Sandi 🔒</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
            Masukkan kata sandi ruangan kolaborasi untuk bergabung dan mulai mengobrol serta menulis bersama.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmittingPassword(true);
              fetchRoomInfo(password);
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="password"
                required
                placeholder="Masukkan kata sandi ruangan..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 font-medium text-sm transition-all text-center placeholder:text-slate-400 dark:placeholder:text-slate-650"
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
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-750 hover:to-indigo-650 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmittingPassword ? (
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
              ) : (
                "Buka Akses Ruangan"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              href="/"
              className="w-full h-12 bg-slate-100 dark:bg-slate-800/50 text-slate-650 dark:text-slate-350 font-bold rounded-2xl hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
              Batal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Name Input dialog if guest has no username set yet
  if (showNameModal && !activeUsername) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl text-center">
          <div className="w-20 h-20 bg-violet-50 dark:bg-violet-950/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-100 dark:border-violet-900/30">
            <FontAwesomeIcon icon={faUserSecret} className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-black mb-2 tracking-tight">Siapa Nama Kamu? 💬</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
            Silakan masukkan nama samaran Anda untuk bergabung ke ruang kolaborasi realtime **{room?.name}**.
          </p>

          <form onSubmit={handleJoinWithName} className="space-y-4">
            <div>
              <input
                type="text"
                maxLength={20}
                placeholder="Masukkan nama samaran..."
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full h-14 px-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 font-medium text-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!usernameInput.trim()}
              className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              Gabung Sekarang
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              href="/"
              className="w-full h-12 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
              Batal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden pb-12 sm:pb-24">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Grid Wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-6 sm:pt-12 space-y-6">
        
        {/* Realtime Room Top Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest leading-none">
                Realtime Room
              </span>
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                isConnected 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                <FontAwesomeIcon icon={faSignal} className="w-2 h-2" />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {room?.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Kamu bergabung sebagai: <span className="font-extrabold text-violet-600 dark:text-violet-400">{activeUsername}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            {room?.expiresAt && (
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-bold">
                <FontAwesomeIcon icon={faHourglassHalf} className="w-3.5 h-3.5 animate-pulse" />
                <span>Hancur otomatis dalam 1 jam</span>
              </div>
            )}
            <Link
              href={`/report?type=paste_room&slug=${roomId}`}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-650 border border-red-500/20 text-red-500 hover:text-white rounded-2xl text-xs font-bold transition-all shadow-sm animate-pulse"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5" />
              <span>Laporkan</span>
            </Link>
            <Link
              href="/"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              <FontAwesomeIcon icon={faHome} className="w-3.5 h-3.5" />
              <span>Keluar Ruangan</span>
            </Link>
          </div>
        </div>

        {/* Workspace Layout: Left (Editor), Right (Chat Room) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Collaborative Text Pad (8 columns) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFileAlt} className="text-slate-400 w-4 h-4" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pad Kolaboratif Realtime</span>
              </div>
              {isTypingRemote && (
                <span className="text-[10px] font-black text-violet-500 tracking-wide animate-pulse">
                  User lain sedang mengetik...
                </span>
              )}
            </div>

            <textarea
              value={padContent}
              onChange={handlePadChange}
              placeholder="Ketik apa saja di sini... Siapapun yang tergabung di ruangan kolaborasi ini dapat mengetik dan melihat perubahan tulisan Anda secara real-time instan!"
              className="flex-1 w-full p-6 text-sm font-medium bg-transparent border-none focus:ring-0 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Chat & active user list Panel (4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Live Chat Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[400px] overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-2 shrink-0">
                <FontAwesomeIcon icon={faComments} className="text-slate-400 w-4 h-4" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Obrolan Realtime</span>
              </div>

              {/* Message List */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Belum ada obrolan.</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-650 mt-0.5">Mulai ketik pesan pertama kamu sekarang!</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.senderName === activeUsername;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 mb-0.5 uppercase tracking-wide">
                          {isMe ? 'Kamu' : msg.senderName}
                        </span>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-violet-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Form */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Ketik pesan..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-11 px-4 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !isConnected}
                  className="w-11 h-11 bg-violet-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-700 active:scale-95 disabled:opacity-50 transition-all shrink-0"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Active Members Card */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-slate-400 w-3.5 h-3.5" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Anggota Aktif
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Always show self */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{activeUsername} (Kamu)</span>
                </div>

                {activeUsersList
                  .filter((u) => u.username !== activeUsername)
                  .map((u) => (
                    <div
                      key={u.socketId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-750"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{u.username}</span>
                    </div>
                  ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
