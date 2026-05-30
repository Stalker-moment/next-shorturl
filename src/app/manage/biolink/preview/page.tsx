'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveTheme } from '@/lib/themes';

interface LinkItem {
 id: string;
 title: string;
 url: string;
 thumbnail: string | null;
 order: number;
 isActive: boolean;
 type?: string;
 parentId?: string | null;
}

interface Profile {
 id: string;
 username: string;
 bio: string | null;
 theme: string;
 avatar: string | null;
 links: LinkItem[];
 designConfig?: string | null;
}

const getFontFamilyStyle = (font: string) => {
 switch(font) {
 case 'serif': return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
 case 'mono': return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace';
 case 'rounded': return 'ui-rounded, "Nunito", "Quicksand", "Arial Rounded MT Bold", sans-serif';
 case 'inter': return '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif';
 case 'poppins': return '"Poppins", ui-sans-serif, system-ui, -apple-system, sans-serif';
 case 'playfair': return '"Playfair Display", ui-serif, Georgia, serif';
 case 'montserrat': return '"Montserrat", ui-sans-serif, system-ui, -apple-system, sans-serif';
 case 'lato': return '"Lato", ui-sans-serif, system-ui, -apple-system, sans-serif';
 case 'roboto': return '"Roboto", ui-sans-serif, system-ui, -apple-system, sans-serif';
 case 'comic': return '"Comic Sans MS", "Marker Felt", cursive, sans-serif';
 case 'impact': return 'Impact, fantasy, sans-serif';
 case 'garamond': return '"Garamond", "EB Garamond", ui-serif, Georgia, serif';
 case 'courier': return '"Courier New", Courier, ui-monospace, monospace';
 case 'arial': return 'Arial, Helvetica, sans-serif';
 case 'verdana': return 'Verdana, Geneva, sans-serif';
 case 'tahoma': return 'Tahoma, Geneva, sans-serif';
 case 'trebuchet': return '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif';
 case 'sans':
 default: return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
 }
}

export default function MobilePreviewEdit() {
 const { data: session, status } = useSession();
 const router = useRouter();

 const [loading, setLoading] = useState(true);
 const [profile, setProfile] = useState<Profile | null>(null);
 const [links, setLinks] = useState<LinkItem[]>([]);
 const [theme, setTheme] = useState("default");
 const [username, setUsername] = useState("");
 const [bio, setBio] = useState("");
 const [avatar, setAvatar] = useState("");

 const [designConfig, setDesignConfig] = useState<any>({});

 const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

 useEffect(() => {
 if (status === "unauthenticated") {
 router.push("/login");
 } else if (status === "authenticated") {
 fetchProfile();
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [status]);

 const fetchProfile = async () => {
 try {
 const res = await fetch("/api/user/biolink");
 if (res.ok) {
 const json = await res.json();
 if (json.data) {
 setProfile(json.data);
 setUsername(json.data.username);
 setBio(json.data.bio || "");
 setTheme(json.data.theme || "default");
 setAvatar(json.data.avatar || "");
 setLinks(json.data.links || []);
 
 if (json.data.designConfig) {
 try {
 setDesignConfig(JSON.parse(json.data.designConfig));
 } catch {}
 }
 }
 }
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 const handleToggleLink = async (id: string, isActive: boolean) => {
 setLinks(prev => prev.map(l => l.id === id ? { ...l, isActive: !isActive } : l));
 try {
 await fetch(`/api/user/biolink/links/${id}`, { 
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ isActive: !isActive })
 });
 } catch {
 setLinks(prev => prev.map(l => l.id === id ? { ...l, isActive } : l));
 }
 };

 const resolvedTheme = resolveTheme(theme);
 const activeLinks = links.filter(l => l.isActive);

 const previewBgStyle: React.CSSProperties = designConfig?.bgType ? {
 ...(designConfig?.bgType === 'color' ? { background: designConfig.bgValue, backgroundColor: designConfig.bgValue } : {}),
 ...(designConfig?.bgType === 'gradient' ? { background: designConfig.bgValue } : {}),
 ...(designConfig?.bgType === 'image' || designConfig?.bgType === 'gif' ? { backgroundImage: `url(${designConfig.bgValue})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
 } : {};

 const previewButtonStyle: React.CSSProperties = designConfig?.buttonStyle ? {
 borderRadius: designConfig?.buttonShape === 'rounded-none' ? '0' : designConfig?.buttonShape === 'rounded' ? '4px' : designConfig?.buttonShape === 'rounded-xl' ? '12px' : designConfig?.buttonShape === 'rounded-2xl' ? '16px' : designConfig?.buttonShape === 'rounded-full' ? '9999px' : undefined,
 borderStyle: designConfig?.buttonStyle === 'solid' ? 'none' : 'solid',
 borderWidth: designConfig?.buttonStyle === 'solid' ? '0' : '1px',
 borderColor: designConfig?.buttonStyle === 'outline' ? designConfig?.buttonTextColor : 'transparent',
 backgroundColor: designConfig?.buttonStyle === 'solid' ? designConfig?.buttonBgColor : 'transparent',
 color: designConfig?.buttonTextColor
 } : {
 borderRadius: designConfig?.buttonShape === 'rounded-none' ? '0' : designConfig?.buttonShape === 'rounded' ? '4px' : designConfig?.buttonShape === 'rounded-xl' ? '12px' : designConfig?.buttonShape === 'rounded-2xl' ? '16px' : designConfig?.buttonShape === 'rounded-full' ? '9999px' : undefined,
 };

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
 <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center p-4">
 {/* Back to Dashboard */}
 <div className="w-full max-w-sm mb-4 flex items-center justify-between">
 <Link href="/manage/biolink" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
 Kembali ke Dashboard
 </Link>
 <span className="text-xs font-semibold text-slate-600 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">Mobile View</span>
 </div>

 {/* Standalone View Mockup Screen Frame */}
 <div className="w-full max-w-md bg-[#111] rounded-[2.5rem] p-3 shadow-2xl border border-white/5 relative overflow-hidden flex-1 flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
 <div className={`w-full ${!designConfig?.bgType ? resolvedTheme.bg : ''} ${resolvedTheme.text} rounded-[2rem] flex flex-col items-center relative flex-1 overflow-y-auto`} style={{ ...(resolvedTheme.bgStyle || {}), ...previewBgStyle, fontFamily: getFontFamilyStyle(designConfig?.fontFamily || 'sans') }}>
 
 {/* Status bar */}
 <div className="w-full flex justify-between items-center px-6 pt-3 text-[9px] opacity-40">
 <span>9:41</span>
 <div className="w-16 h-4 bg-black rounded-full" />
 <span>🔋</span>
 </div>

 <div className="w-full h-full flex flex-col items-center px-4">
 {/* Profile */}
 <div className="flex flex-col items-center mt-6">
 <div className="w-[72px] h-[72px] bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center font-black text-xl text-white shadow-lg border-2 border-white/20 overflow-hidden mb-3 relative group">
 {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="pfp" /> : (username?.[0]?.toUpperCase() || "N")}
 </div>
 <h3 className="font-bold text-sm tracking-tight flex items-center gap-1">
 @{username || "username"}
 </h3>
 {bio && <p className={`text-xs mt-1 text-center max-w-[180px] break-words line-clamp-2 ${resolvedTheme.sub}`}>{bio}</p>}
 </div>

 {/* Links preview with toggle switch overlays inline */}
 <div className="mt-5 w-full space-y-3 pb-6 flex-1 px-2">
 {(() => {
 const roots = links.filter((l) => !l.parentId);

 return roots.map((root) => {
 const isHeader = root.type === 'header';

 if (!isHeader) {
 const l = root;
 return (
 <div key={l.id} className="relative group mb-3">
 <div className={`w-full p-3 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${designConfig?.buttonStyle ? (designConfig?.buttonStyle === 'outline' ? 'border' : '') : resolvedTheme.item} ${l.isActive ? '' : 'opacity-40'}`} style={{ ...previewButtonStyle }}>
 {l.thumbnail && <img src={l.thumbnail} className="w-4 h-4 rounded-full object-cover" alt="" />}
 <span className="truncate">{l.title}</span>
 </div>
 {/* Inline Toggle switch overlay */}
 <div className="absolute inset-y-0 right-2 flex items-center">
 <button 
 onClick={() => handleToggleLink(l.id, l.isActive)}
 className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${l.isActive ? 'bg-emerald-500/80 shadow-emerald-500/30' : 'bg-slate-700/80'} shadow-sm`}
 >
 <span className={`absolute top-[1.5px] w-[15px] h-[15px] bg-white rounded-full shadow-sm transition-transform duration-200 ${l.isActive ? 'left-[14px]' : 'left-[1.5px]'}`} />
 </button>
 </div>
 </div>
 );
 } else {
 const l = root;
 const children = links.filter((child) => child.parentId === l.id);
 return (
 <div key={l.id} className={`w-full rounded-[1.25rem] p-3 transition-opacity ${l.isActive ? '' : 'opacity-50'} bg-black/10 backdrop-blur-md border border-white/10 mb-3 shadow-inner`}>
 <div className="flex items-center justify-between mb-3 px-1">
 <h4 className="font-bold text-xs pl-1">{l.title}</h4>
 <button 
 onClick={() => handleToggleLink(l.id, l.isActive)}
 className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${l.isActive ? 'bg-emerald-500/80 shadow-emerald-500/30' : 'bg-slate-700/80'} shadow-sm`}
 >
 <span className={`absolute top-[1.5px] w-[15px] h-[15px] bg-white rounded-full shadow-sm transition-transform duration-200 ${l.isActive ? 'left-[14px]' : 'left-[1.5px]'}`} />
 </button>
 </div>
 <div className="space-y-2">
 {children.map(subLink => (
 <div key={subLink.id} className="relative group">
 <div className={`w-full p-2.5 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${designConfig?.buttonStyle ? (designConfig?.buttonStyle === 'outline' ? 'border' : '') : resolvedTheme.item} ${subLink.isActive ? '' : 'opacity-40'}`} style={{ ...previewButtonStyle }}>
 {subLink.thumbnail && <img src={subLink.thumbnail} className="w-4 h-4 rounded-full object-cover" alt="" />}
 <span className="truncate">{subLink.title}</span>
 </div>
 <div className="absolute inset-y-0 right-2 flex items-center">
 <button 
 onClick={() => handleToggleLink(subLink.id, subLink.isActive)}
 className={`relative w-7 h-4 rounded-full transition-colors duration-200 ${subLink.isActive ? 'bg-emerald-500/80 shadow-emerald-500/30' : 'bg-slate-700/80'} shadow-sm`}
 >
 <span className={`absolute top-[1px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200 ${subLink.isActive ? 'left-[13px]' : 'left-[1px]'}`} />
 </button>
 </div>
 </div>
 ))}
 {children.length === 0 && (
 <div className="py-3 text-center text-[9px] text-white/40 italic">Kosong</div>
 )}
 </div>
 </div>
 );
 }
 });
 })()}
 </div>

 {/* Footer */}
 <div className={`py-4 text-[9px] font-medium ${resolvedTheme.sub}`}>
 Made with ❤️ nyoo.me
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
