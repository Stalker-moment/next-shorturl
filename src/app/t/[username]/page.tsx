"use client";

import React, { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { resolveTheme, resolveDesignStyle } from "@/lib/themes";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  type?: string;
  parentId?: string | null;
  layout?: string;
  thumbnail: string | null;
  isActive?: boolean;
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

export default function BiolinkView() {
  const params = useParams();
  const username = params?.username as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
          const res = await fetch(`/api/biolink/${username}`);
          if (res.ok) {
              const json = await res.json();
              if (json.data) {
                  setProfile(json.data);
              } else {
                  notFound();
              }
          } else {
              notFound();
          }
      } catch (e) {
          console.error(e);
          notFound();
      } finally {
          setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f0f0f]">
         <div className="flex flex-col items-center gap-3">
           <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bentar ya...</p>
         </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentTheme = resolveTheme(profile.theme);
  const designStyles = resolveDesignStyle(profile.designConfig);

  const finalBgStyle = designStyles.bgType ? designStyles.bgStyle : currentTheme.bgStyle;
  const isCustomBg = !!designStyles.bgType;
  
  // Only apply theme item class if no custom button style is set
  const themeItemClass = designStyles.buttonStyle && Object.keys(designStyles.buttonStyle).length > 1 ? '' : currentTheme.item;

  return (
    <div 
      className={`min-h-screen ${!isCustomBg ? currentTheme.bg : ''} ${currentTheme.text} flex justify-center transition-colors duration-500 relative overflow-hidden`}
      style={{ ...finalBgStyle, fontFamily: getFontFamilyStyle(designStyles.fontFamily) }}
    >
       
       {/* Subtle decorative blurs for dark themes */}
       {(profile.theme === 'default' || profile.theme === 'carbon' || profile.theme === 'midnight_blue' || (profile.theme.startsWith('custom:') && resolveTheme(profile.theme).textMode === 'light')) && (
         <>
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
         </>
       )}
       
       <div className="w-full max-w-md flex flex-col items-center px-5 relative z-10 pb-24">
            {/* Avatar */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.8, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
               className="mt-12 sm:mt-16 mb-4"
            >
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center font-black text-3xl sm:text-4xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[4px] border-white/20 overflow-hidden relative group transition-transform hover:scale-105"
                style={designStyles.profileStyle}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar"/>
                ) : (
                  <span>{profile.username[0].toUpperCase()}</span>
                )}
              </div>
            </motion.div>
            
            {/* Username */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} 
              className="font-black text-2xl tracking-tighter"
            >
              @{profile.username}
            </motion.h1>
 
            {/* Bio */}
            {profile.bio && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} 
                  className={`text-xs sm:text-sm text-center mt-3 max-w-xs font-bold leading-relaxed opacity-80 ${currentTheme.sub}`}
                >
                    {profile.bio}
                </motion.p>
            )}
 
            {/* Socials */}
            {profile.designConfig && (() => {
                try {
                    const config = JSON.parse(profile.designConfig);
                    if (!config.socials || !Object.values(config.socials).some(val => val)) return null;
                    return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="flex flex-wrap justify-center items-center gap-4 mt-6 mb-2 max-w-[320px] mx-auto"
                        >
                           {['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin', 'github', 'whatsapp'].map(soc => {
                               const url = config.socials[soc];
                               if (!url) return null;
                               return (
                                   <motion.a 
                                      key={soc} 
                                      href={url.startsWith('http') ? url : `https://${url}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      whileHover={{ scale: 1.1, y: -2 }}
                                      whileTap={{ scale: 0.9 }}
                                      className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-shrink-0 items-center justify-center transition-all hover:bg-white/10 shadow-lg`}
                                   >
                                      <img src={`https://cdn.simpleicons.org/${soc}/${soc === 'github' || soc === 'tiktok' ? 'white' : soc !== 'whatsapp' ? 'default' : '25D366'}`} className="w-5 h-5 object-contain" alt={soc} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                   </motion.a>
                               )
                           })}
                        </motion.div>
                    );
                } catch(e) { return null; }
            })()}
 
            {/* Links */}
            <div className="mt-8 sm:mt-10 w-full space-y-4">
                <AnimatePresence>
                    {(() => {
                        const activeLinks = profile.links.filter(l => l.isActive);
                        const roots = activeLinks.filter(l => !l.parentId);
                        let globalIndex = 0;
 
                        return roots.map((root) => {
                            const isHeader = root.type === 'header';
                            
                            if (!isHeader) {
                                const l = root;
                                const idx = globalIndex++;
                                return (
                                  <motion.a 
                                    key={l.id} 
                                    href={l.url.startsWith("http") ? l.url : `https://${l.url}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={() => fetch(`/api/track-click/biolink/${l.id}`, { method: 'POST' })}
                                    initial={{ opacity: 0, y: 15, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.2 + idx * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex w-full transition-all duration-300 shadow-xl mb-4 overflow-hidden relative group font-black text-xs ${l.layout === 'featured' ? 'flex-col p-0' : 'flex-row items-center justify-center gap-3 p-4 sm:p-5'} ${themeItemClass} ${designStyles.buttonStyle && designStyles.buttonStyle.borderStyle === 'solid' && designStyles.buttonStyle.backgroundColor === 'transparent' ? 'border' : ''} ${!designStyles.buttonStyle?.borderRadius ? 'rounded-2xl' : ''}`}
                                    style={designStyles.buttonStyle || {}}
                                >
                                    {l.thumbnail && (
                                      <div className={l.layout === 'featured' ? 'w-full aspect-[16/9]' : 'shrink-0'}>
                                        <img src={l.thumbnail} className={l.layout === 'featured' ? 'w-full h-full object-cover' : 'w-6 h-6 rounded-lg object-cover flex-shrink-0 shadow-md border border-white/10'} alt="icon"/>
                                      </div>
                                    )}
                                    <span className={`truncate ${l.layout === 'featured' ? 'w-full text-center py-4 px-4' : 'max-w-[85%]'}`}>{l.title}</span>
                                    {l.layout === 'featured' && (
                                       <div className="absolute top-2 right-2 w-7 h-7 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                       </div>
                                    )}
                                  </motion.a>
                                );
                            } else {
                                const headerLink = root;
                                const children = activeLinks.filter(l => l.parentId === headerLink.id);
                                const idx = globalIndex++;
                                return (
                                  <motion.div
                                    key={headerLink.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    className="w-full rounded-[2rem] p-5 mb-6 border shadow-2xl relative overflow-hidden backdrop-blur-xl"
                                    style={{
                                      backgroundColor: designStyles.buttonStyle?.backgroundColor && designStyles.buttonStyle?.backgroundColor !== 'transparent' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.03)',
                                      borderColor: designStyles.buttonStyle?.borderColor || 'rgba(255,255,255,0.08)',
                                    }}
                                  >
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    <h3 className="font-black text-xs sm:text-sm mb-5 px-3 uppercase tracking-widest opacity-60">{headerLink.title}</h3>
                                    <div className={
                                          headerLink.layout === 'grid'
                                            ? "grid grid-cols-2 gap-4"
                                            : headerLink.layout === 'carousel' 
                                              ? "flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4 hide-scrollbar -mx-2 px-2"
                                              : headerLink.layout === 'showcase'
                                                ? "space-y-5"
                                                : "space-y-4"
                                        }>
                                      {children.map((child) => {
                                          const sIdx = globalIndex++;
                                          const isFeatured = child.layout === 'featured';
                                          return (
                                            <motion.a
                                                key={child.id}
                                                href={child.url.startsWith("http") ? child.url : `https://${child.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => fetch(`/api/track-click/biolink/${child.id}`, { method: 'POST' })}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 + sIdx * 0.03, duration: 0.3 }}
                                                whileHover={{ scale: 1.02, x: 2 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`transition-all duration-300 shadow-lg flex overflow-hidden relative group font-black text-xs ${themeItemClass} ${designStyles.buttonStyle && designStyles.buttonStyle.borderStyle === 'solid' && designStyles.buttonStyle.backgroundColor === 'transparent' ? 'border' : ''} ${!designStyles.buttonStyle?.borderRadius ? (headerLink.layout === 'stack' || !headerLink.layout ? 'rounded-2xl' : 'rounded-3xl') : ''}
                                                ${headerLink.layout === 'grid'
                                                  ? "flex-col items-center justify-center p-3 aspect-square snap-center shrink-0" 
                                                  : headerLink.layout === 'carousel'
                                                    ? "flex-col items-center justify-center py-8 px-6 snap-center shrink-0 min-w-[80%]"
                                                    : headerLink.layout === 'showcase'
                                                      ? "flex-col items-center justify-center gap-5 py-10 text-center w-full"
                                                      : (isFeatured ? 'flex-col p-0 w-full' : 'items-center justify-center gap-3 w-full px-4 py-4 sm:py-5')}`}
                                                style={designStyles.buttonStyle || {}}
                                            >
                                                {child.thumbnail && (
                                                  <div className={(headerLink.layout === 'showcase' || isFeatured) ? 'w-full aspect-[16/9] mb-2' : ''}>
                                                    <img src={child.thumbnail} className={`${(headerLink.layout === 'grid' || headerLink.layout === 'carousel') ? 'w-12 h-12 mb-3 rounded-2xl shadow-xl' : (headerLink.layout === 'showcase' || isFeatured) ? 'w-full h-full object-cover' : 'w-6 h-6 rounded-lg object-cover flex-shrink-0 shadow-md border border-white/10'} border-white/20`} alt="icon"/>
                                                  </div>
                                                )}
                                                <span className={`truncate text-center w-full px-2 ${headerLink.layout === 'grid' ? 'whitespace-normal line-clamp-2 leading-tight' : (headerLink.layout === 'carousel' || headerLink.layout === 'showcase' || isFeatured) ? 'pb-2 pt-2' : 'max-w-[80%]'}`}>{child.title}</span>
                                            </motion.a>
                                          );
                                      })}
                                      {children.length === 0 && (
                                          <p className="text-center text-[10px] opacity-40 py-4 italic font-bold">Belum ada tautan</p>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                            }
                        });
                    })()}
                </AnimatePresence>
            </div>
 
            {/* Premium Footer Sidebar Style */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 0.4, y: 0 }}
               whileHover={{ opacity: 1 }}
               transition={{ delay: 0.6, duration: 0.8 }}
               className={`mt-auto mb-8 px-10 py-3 glass dark:bg-black/20 rounded-full border border-slate-200 dark:border-white/5 text-[10px] font-black tracking-widest flex items-center gap-3 transition-all cursor-pointer ${currentTheme.sub}`}
               onClick={() => window.open('/', '_blank')}
            >
              <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center text-white shadow-lg text-[10px]">N</div>
              NYOO.ME
            </motion.div>

            <Link
              href={`/report?type=biolink&slug=${profile.username}`}
              className="text-[9px] font-bold tracking-widest opacity-40 hover:opacity-100 hover:text-red-500 transition-all uppercase mb-8 -mt-4 cursor-pointer"
            >
              Report Abuse
            </Link>
       </div>
    </div>
  );
}
