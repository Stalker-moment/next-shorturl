"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLink,
  faPaintBrush,
  faPlus,
  faLayerGroup,
  faImage,
  faSave,
  faTimes,
  faCheck,
  faExternalLinkAlt,
  faSearch,
  faUser,
  faShareNodes,
  faTrashAlt,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import Cropper from "react-easy-crop";
import { PRESET_THEMES, resolveTheme, encodeCustomTheme } from "@/lib/themes";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLanguage } from "@/contexts/LanguageContext";

interface Profile {
  username: string;
  bio?: string;
  theme?: string;
  avatar?: string;
  designConfig?: string | null;
  links: LinkItem[];
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  order: number;
  isActive: boolean;
  type?: string;
  parentId?: string | null;
  layout?: string;
  designConfig?: string | null;
}

// Fungsi pembantu untuk memuat tipe Font yang ramah web
const getFontFamilyStyle = (font: string) => {
  switch (font) {
    case "serif":
      return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
    case "mono":
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace';
    case "rounded":
      return 'ui-rounded, "Nunito", "Quicksand", "Arial Rounded MT Bold", sans-serif';
    case "inter":
      return '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif';
    case "poppins":
      return '"Poppins", ui-sans-serif, system-ui, -apple-system, sans-serif';
    case "playfair":
      return '"Playfair Display", ui-serif, Georgia, serif';
    case "montserrat":
      return '"Montserrat", ui-sans-serif, system-ui, -apple-system, sans-serif';
    case "lato":
      return '"Lato", ui-sans-serif, system-ui, -apple-system, sans-serif';
    case "roboto":
      return '"Roboto", ui-sans-serif, system-ui, -apple-system, sans-serif';
    case "comic":
      return '"Comic Sans MS", "Marker Felt", cursive, sans-serif';
    case "impact":
      return "Impact, fantasy, sans-serif";
    case "garamond":
      return '"Garamond", "EB Garamond", ui-serif, Georgia, serif';
    case "courier":
      return '"Courier New", Courier, ui-monospace, monospace';
    case "arial":
      return "Arial, Helvetica, sans-serif";
    case "verdana":
      return "Verdana, Geneva, sans-serif";
    case "tahoma":
      return "Tahoma, Geneva, sans-serif";
    case "trebuchet":
      return '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif';
    case "sans":
    default:
      return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  }
};

// Komponen Visual Kartu Link (Bisa dipakai di List maupun di Overlay saat Drag)
const LinkCardContent = ({
  l,
  isDragging,
  isChild,
  listeners,
  editingLinkId,
  startEditLink,
  handleUpdateLink,
  handleUpdateLinkDirectly,
  handleToggleLink,
  handleEditThumbUpload,
  uploadingEditThumb,
  editTitle,
  setEditTitle,
  editUrl,
  setEditUrl,
  editThumbnail,
  setEditThumbnail,
  editLayout,
  setEditLayout,
  setEditingLinkId,
  showAlert,
  handleDeleteLink,
  handleMoveOut,
}: any) => {
  const { t, language } = useLanguage();
  const isEditing = editingLinkId === l?.id;

  if (l?.type === "end_collection") {
    return (
      <div
        className={`bg-white dark:bg-slate-800/50 border border-dashed rounded-xl overflow-hidden transition-all duration-200 
 ${l.isActive ? "border-slate-300 dark:border-zinc-700" : "border-slate-200 dark:border-white/5 opacity-40"} 
 ${isDragging ? "opacity-0" : "opacity-100"}
 `}
      >
        <div className="p-2 sm:p-2.5 flex items-center gap-3">
          {!isEditing && (
            <div
              {...listeners}
              className="text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:text-white cursor-grab active:cursor-grabbing p-1 touch-none rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="8" cy="6" r="1.5" />
                <circle cx="16" cy="6" r="1.5" />
                <circle cx="8" cy="12" r="1.5" />
                <circle cx="16" cy="12" r="1.5" />
                <circle cx="8" cy="18" r="1.5" />
                <circle cx="16" cy="18" r="1.5" />
              </svg>
            </div>
          )}
          <div className="flex-1 flex items-center justify-center opacity-70">
            <div className="h-px bg-zinc-700 flex-1"></div>
            <span className="px-3 text-xs font-bold text-slate-500 dark:text-zinc-500 font-semibold">
              {language === 'en' ? "End of Group Link" : "Selesai Grup Link"}
            </span>
            <div className="h-px bg-zinc-700 flex-1"></div>
          </div>
          {!isEditing && (
            <button
              onClick={() => handleDeleteLink(l.id)}
              className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (l.type === "header") {
    return (
      <div
        className={`bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 
 ${l.isActive ? "" : "opacity-60"} 
 ${isDragging ? "opacity-0" : "opacity-100 hover:border-violet-500/20"}
 `}
      >
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {!isEditing && (
              <div
                {...listeners}
                className="text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:text-white cursor-grab active:cursor-grabbing p-1 touch-none"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="8" cy="6" r="1.5" />
                  <circle cx="16" cy="6" r="1.5" />
                  <circle cx="8" cy="12" r="1.5" />
                  <circle cx="16" cy="12" r="1.5" />
                  <circle cx="8" cy="18" r="1.5" />
                  <circle cx="16" cy="18" r="1.5" />
                </svg>
              </div>
            )}

            <div className="flex-1 flex items-center gap-2.5">
              <div className="bg-violet-500/20 text-violet-400 p-1.5 rounded-xl flex-shrink-0">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 w-full"
                  autoFocus
                  onBlur={() => handleUpdateLink(l.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateLink(l.id)}
                />
              ) : (
                <h3
                  className="font-bold text-[15px] text-slate-900 dark:text-white truncate cursor-pointer hover:text-violet-300 transition-colors"
                  onClick={() => startEditLink(l)}
                  title={language === 'en' ? "Click to edit" : "Klik untuk edit"}
                >
                  {l.title}
                </h3>
              )}
            </div>

            {!isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleLink(l.id, l.isActive)}
                  className={`relative inline-flex h-6 w-10 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${l.isActive ? "bg-emerald-500" : "bg-zinc-600"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${l.isActive ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
                <button
                  onClick={() => startEditLink(l)}
                  className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                  title={language === 'en' ? "Edit collection name" : "Edit nama koleksi"}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteLink(l.id)}
                  className="p-1.5 text-slate-500 dark:text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 mx-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 font-semibold bg-white/5 px-2.5 py-1.5 rounded-lg shrink-0 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9h18M9 21V9"
                  />
                </svg>{" "}
                Layout
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  {
                    id: "stack",
                    icon: (
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    ),
                    label: "Stack",
                  },
                  {
                    id: "grid",
                    icon: (
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="7"
                          height="7"
                          rx="1"
                          strokeWidth="2"
                        />
                        <rect
                          x="14"
                          y="3"
                          width="7"
                          height="7"
                          rx="1"
                          strokeWidth="2"
                        />
                        <rect
                          x="3"
                          y="14"
                          width="7"
                          height="7"
                          rx="1"
                          strokeWidth="2"
                        />
                        <rect
                          x="14"
                          y="14"
                          width="7"
                          height="7"
                          rx="1"
                          strokeWidth="2"
                        />
                      </svg>
                    ),
                    label: "Grid",
                  },
                  {
                    id: "carousel",
                    icon: (
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="2"
                          y="6"
                          width="14"
                          height="12"
                          rx="2"
                          strokeWidth="2"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M22 8v8"
                        />
                      </svg>
                    ),
                    label: "Carousel",
                  },
                  {
                    id: "showcase",
                    icon: (
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="12"
                          rx="2"
                          strokeWidth="2"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 20h18M8 16v4m8-4v4"
                        />
                      </svg>
                    ),
                    label: "Showcase",
                  },
                ].map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateLinkDirectly(l.id, { layout: layout.id });
                    }}
                    className={`flex items-center px-3 py-1.5 gap-1.5 rounded-lg text-xs font-bold transition-all ${l.layout === layout.id || (!l.layout && layout.id === "stack") ? "bg-violet-600 text-slate-900 dark:text-white shadow-md" : "bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:text-white"}`}
                  >
                    {layout.icon}
                    {layout.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start ${isChild ? "ml-8 relative" : ""}`}>
      {isChild && (
        <div className="absolute -left-5 top-0 bottom-0 w-px bg-white/10" />
      )}
      {isChild && (
        <div className="absolute -left-5 top-1/2 w-4 h-px bg-white/10" />
      )}
      <div
        className={`flex-1 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl overflow-hidden transition-all duration-200 
 ${l.isActive ? "border-slate-200 dark:border-white/10" : "border-slate-200 dark:border-white/5"} 
 ${isDragging ? "opacity-0" : "opacity-100 hover:border-white/20 shadow-sm"}
 ${!l.isActive && !isDragging ? "opacity-60 grayscale-[30%]" : ""}
 `}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Drag Handle */}
            {!isEditing && (
              <div
                {...listeners}
                className="mt-2 text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:text-white cursor-grab active:cursor-grabbing p-1.5 touch-none rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="8" cy="6" r="1.5" />
                  <circle cx="16" cy="6" r="1.5" />
                  <circle cx="8" cy="12" r="1.5" />
                  <circle cx="16" cy="12" r="1.5" />
                  <circle cx="8" cy="18" r="1.5" />
                  <circle cx="16" cy="18" r="1.5" />
                </svg>
              </div>
            )}

            {/* Edit Mode vs View Mode */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3 bg-white dark:bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                  <input
                    type="text"
                    placeholder="Judul Tautan"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    autoFocus
                  />
                  <input
                    type="url"
                    placeholder="URL Tautan"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />

                  <div className="flex items-center gap-4 py-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                      {uploadingEditThumb ? (
                        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      ) : editThumbnail ? (
                        <img
                          src={editThumbnail}
                          className="w-full h-full object-cover"
                          alt="icon"
                        />
                      ) : (
                        <svg
                          className="w-5 h-5 text-zinc-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-slate-900 dark:text-white cursor-pointer transition-colors shadow-sm">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        {language === 'en' ? "Change Icon" : "Ganti Ikon"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditThumbUpload}
                          className="hidden"
                        />
                      </label>
                      {editThumbnail && (
                        <button
                          onClick={() => setEditThumbnail(null)}
                          className="ml-3 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                        >
                          {language === 'en' ? "Delete" : "Hapus"}
                        </button>
                      )}
                    </div>
                  </div>

                  {l.type !== "header" && (
                    <div className="pt-2 pb-1 border-t border-slate-200 dark:border-white/5 space-y-3">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 font-semibold block">
                        {language === 'en' ? "Link Display Design Style" : "Gaya Desain Tampilan Link"}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            id: "classic",
                            label: "Classic",
                            desc: language === 'en' ? "Thumbnail on left" : "Thumbnail di kiri",
                            preview: (
                              <div className="w-10 h-5 bg-zinc-700 rounded-sm flex items-center pr-2">
                                <div className="w-2.5 h-2.5 bg-zinc-500 rounded-sm mr-auto ml-1" />
                              </div>
                            ),
                          },
                          {
                            id: "featured",
                            label: "Featured",
                            desc: language === 'en' ? "Large image on top" : "Gambar besar di atas",
                            preview: (
                              <div className="w-10 h-5 bg-zinc-700 rounded-sm flex flex-col items-center justify-center p-0.5">
                                <div className="w-full h-2 bg-zinc-500 rounded-t-sm mb-1" />
                                <div className="w-[80%] h-0.5 bg-zinc-600 rounded-full" />
                              </div>
                            ),
                          },
                        ].map((layout) => (
                          <button
                            key={layout.id}
                            onClick={() => setEditLayout(layout.id)}
                            type="button"
                            className={`p-3 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-2 transition-all ${editLayout === layout.id || (layout.id === "classic" && !editLayout) ? "bg-violet-500/10 border-violet-500 text-violet-400" : "bg-slate-100 dark:bg-black/50 border-slate-200 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:border-white/20"}`}
                          >
                            {layout.preview}
                            <div className="text-center">
                              <div>{layout.label}</div>
                              <div className="text-[8px] font-normal opacity-50">
                                {layout.desc}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {l.type === "header" && (
                    <div className="pt-2 pb-1 border-t border-slate-200 dark:border-white/5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 font-semibold mb-2 block">
                        {language === 'en' ? "Group Layout" : "Layout Grup"}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          {
                            id: "stack",
                            icon: (
                              <svg
                                className="w-4 h-4 mx-auto mb-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 6h16M4 12h16M4 18h16"
                                />
                              </svg>
                            ),
                            label: "Stack",
                          },
                          {
                            id: "grid",
                            icon: (
                              <svg
                                className="w-4 h-4 mx-auto mb-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect
                                  x="3"
                                  y="3"
                                  width="7"
                                  height="7"
                                  rx="1"
                                  strokeWidth="2"
                                />
                                <rect
                                  x="14"
                                  y="3"
                                  width="7"
                                  height="7"
                                  rx="1"
                                  strokeWidth="2"
                                />
                                <rect
                                  x="3"
                                  y="14"
                                  width="7"
                                  height="7"
                                  rx="1"
                                  strokeWidth="2"
                                />
                                <rect
                                  x="14"
                                  y="14"
                                  width="7"
                                  height="7"
                                  rx="1"
                                  strokeWidth="2"
                                />
                              </svg>
                            ),
                            label: "Grid",
                          },
                          {
                            id: "carousel",
                            icon: (
                              <svg
                                className="w-4 h-4 mx-auto mb-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect
                                  x="2"
                                  y="6"
                                  width="14"
                                  height="12"
                                  rx="2"
                                  strokeWidth="2"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M22 8v8"
                                />
                              </svg>
                            ),
                            label: "Carousel",
                          },
                          {
                            id: "showcase",
                            icon: (
                              <svg
                                className="w-4 h-4 mx-auto mb-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect
                                  x="3"
                                  y="4"
                                  width="18"
                                  height="12"
                                  rx="2"
                                  strokeWidth="2"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M3 20h18M8 16v4m8-4v4"
                                />
                              </svg>
                            ),
                            label: "Showcase",
                          },
                        ].map((layout) => (
                          <button
                            key={layout.id}
                            onClick={() => setEditLayout(layout.id)}
                            type="button"
                            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${editLayout === layout.id ? "bg-violet-500/10 border-violet-500 text-violet-400" : "bg-slate-100 dark:bg-black/50 border-slate-200 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:border-white/20"}`}
                          >
                            {layout.icon}
                            {layout.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                    <button
                      onClick={() => {
                        setEditingLinkId(null);
                        setEditThumbnail(null);
                      }}
                      className="flex-1 px-3 py-2.5 bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      {t("biolink.form.btn_cancel")}
                    </button>
                    <button
                      onClick={() => handleUpdateLink(l.id)}
                      className="flex-1 px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-slate-900 dark:text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-violet-500/20"
                    >
                      {language === 'en' ? "Save Link" : "Simpan Tautan"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  {/* Thumbnail Icon in View Mode */}
                  <div className="w-10 h-10 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl flex flex-shrink-0 items-center justify-center overflow-hidden">
                    {l.thumbnail ? (
                      <img
                        src={l.thumbnail}
                        className="w-full h-full object-cover"
                        alt="thumbnail"
                      />
                    ) : (
                      <svg
                        className="w-5 h-5 text-zinc-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {l.title}
                    </h3>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 dark:text-zinc-400 hover:text-violet-400 truncate block mt-0.5 transition-colors"
                    >
                      {l.url}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Switch */}
            {!isEditing && (
              <div className="flex items-center flex-shrink-0 ml-auto mt-2">
                <button
                  type="button"
                  onClick={() => handleToggleLink(l.id, l.isActive)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${l.isActive ? "bg-emerald-500" : "bg-white/10"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-300 ease-in-out ${l.isActive ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-white/5 pl-11 sm:pl-14 flex-wrap">
              <button
                onClick={() => startEditLink(l)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:text-white rounded-lg text-[11px] font-semibold transition-colors border border-slate-200 dark:border-white/5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                {t("biolink.card.edit")}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(l.url);
                  showAlert(language === 'en' ? "Copied!" : "Disalin!", language === 'en' ? "URL copied successfully." : "URL berhasil disalin.", "success");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:text-white rounded-lg text-[11px] font-semibold transition-colors border border-slate-200 dark:border-white/5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {t("biolink.card.copy")}
              </button>
              {isChild && (
                <button
                  onClick={() => handleMoveOut && handleMoveOut(l.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 rounded-lg text-[11px] font-semibold transition-colors border border-violet-500/20"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  {t("biolink.card.remove_group")}
                </button>
              )}
              <div className="flex-1 min-w-[20px]" />
              <button
                onClick={() => handleDeleteLink(l.id)}
                className="p-1.5 text-slate-500 dark:text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title={t("biolink.card.delete")}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sortable Wrapper
function SortableLinkCard(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.l.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      id={props.l.id}
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="mb-3"
    >
      <LinkCardContent
        {...props}
        listeners={listeners}
        isDragging={isDragging}
        isChild={props.isChild}
      />
    </div>
  );
}

function EmptyDropZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`text-center py-6 mx-3 mt-2 text-[11px] font-bold rounded-xl transition-all duration-300 ${isOver ? "bg-violet-500/20 text-violet-300 border-2 border-dashed border-violet-500/50 scale-[1.02]" : "text-slate-500 dark:text-zinc-500 bg-slate-50 dark:bg-black/20 border-2 border-dashed border-slate-200 dark:border-white/10"}`}
    >
      {isOver ? "✨ Lepas link di sini" : "Masukin link ke sini"}
    </div>
  );
}

export default function BiolinkDashboard() {
  const { t, language } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Profile Edit States
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState("default");
  const [avatar, setAvatar] = useState("");

  // Uploading States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingEditThumb, setUploadingEditThumb] = useState(false);
  const [designConfig, setDesignConfig] = useState<string | null>(null);
  const [buttonShape, setButtonShape] = useState<string>("");
  const [buttonStyle, setButtonStyle] = useState<string>("");
  const [buttonBgColor, setButtonBgColor] = useState("#ffffff");
  const [buttonTextColor, setButtonTextColor] = useState("#000000");
  const [buttonBorderColor, setButtonBorderColor] = useState("#ffffff");
  const [buttonBorderWidth, setButtonBorderWidth] = useState(0);
  const [profileBorderRadius, setProfileBorderRadius] =
    useState<string>("circle");
  const [profileBorderColor, setProfileBorderColor] = useState("#ffffff");
  const [profileBorderWidth, setProfileBorderWidth] = useState(2);
  const [bgType, setBgType] = useState<string>("");
  const [bgValue, setBgValue] = useState("#0f0f15");
  const [fontFamily, setFontFamily] = useState<string>("sans");

  // Links States
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [newType, setNewType] = useState<"link" | "header">("link");
  const [addingLink, setAddingLink] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [socials, setSocials] = useState<any>({});

  // Inline editing & Drag states
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [draggedWidth, setDraggedWidth] = useState<number | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editThumbnail, setEditThumbnail] = useState<string | null>(null);
  const [editLayout, setEditLayout] = useState<string>("stack");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "thumbnail">("avatar");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropAspect, setCropAspect] = useState<number>(1);
  const [selectedCropShape, setSelectedCropShape] = useState<"round" | "rect">(
    "round",
  );

  // Mobile Sheet State
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({ show: false, title: "", message: "", type: "success" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [notification.show]);

  // Active sidebar tab
  const [activeTab, setActiveTab] = useState<"links" | "profile" | "design">(
    "links",
  );

  // Mobile preview modal state
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Lock body scroll when mobile preview is open to prevent double scrollbars
  useEffect(() => {
    if (showMobilePreview) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showMobilePreview]);

  // Design sub-tabs
  const [designTab, setDesignTab] = useState<
    "template" | "background" | "button" | "font"
  >("template");

  // Saving states
  const [savingProfile, setSavingProfile] = useState(false);

  // Custom gradient states
  const [customColor1, setCustomColor1] = useState("#667eea");
  const [customColor2, setCustomColor2] = useState("#764ba2");
  const [customTextMode, setCustomTextMode] = useState<"light" | "dark">(
    "light",
  );
  const [hostname, setHostname] = useState("nyoo.me");

  // Track hasChanges
  const [hasChanges, setHasChanges] = useState(false);
  const [initialState, setInitialState] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.host);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setEditingLinkId(null);
    setActiveDragId(event.active.id as string);
    const element = document.getElementById(event.active.id as string);
    if (element) {
      setDraggedWidth(element.offsetWidth);
    }
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setLinks((prev) => {
      const activeIndex = prev.findIndex((l) => l.id === activeId);
      const overIndex = prev.findIndex((l) => l.id === overId);

      const activeLink = prev[activeIndex];
      const overLink = overIndex !== -1 ? prev[overIndex] : null;

      if (!activeLink) return prev;

      // PROTEKSI: Jika yang di-drag adalah Grup (header), dia tidak boleh punya parent.
      // Langsung return prev untuk mencegah perubahan parentId yang memicu loop.
      if (activeLink.type === "header") return prev;

      let newParentId = activeLink.parentId || null;

      // Jika menjatuhkan ke area kosong dalam koleksi
      if (String(overId).startsWith("container-")) {
        newParentId = String(overId).replace("container-", "");
      } else if (overLink && String(overId) !== "root") {
        // Jika overLink adalah header (Grup), keluarkan/tetap di root agar bisa di-sort ke atas/bawah grup
        if (overLink.type === "header") {
          newParentId = null;
        } else {
          // Ikuti parent dari item yang di-hover
          newParentId = overLink.parentId || null;
        }
      } else if (String(overId) === "root") {
        newParentId = null;
      }

      // Pastikan tidak merujuk ke diri sendiri
      if (newParentId === activeId) return prev;

      if (activeLink.parentId !== newParentId) {
        const newLinks = [...prev];
        newLinks[activeIndex] = { ...activeLink, parentId: newParentId };
        return newLinks;
      }

      return prev;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    setDraggedWidth(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLinks((prev) => {
        const sortedArray: any[] = [];
        const roots = prev
          .filter((l) => !l.parentId)
          .sort((a, b) => a.order - b.order);
        const rootIds = new Set(roots.map((l) => l.id));
        prev.forEach((l) => {
          if (
            l.parentId &&
            !prev.find((p) => p.id === l.parentId) &&
            !rootIds.has(l.id)
          ) {
            roots.push({ ...l, parentId: null });
            rootIds.add(l.id);
          }
        });
        roots.forEach((root) => {
          sortedArray.push(root);
          if (root.type === "header") {
            const children = prev
              .filter((l) => l.parentId === root.id)
              .sort((a, b) => a.order - b.order);
            sortedArray.push(...children);
          }
        });

        const oldIndex = sortedArray.findIndex((l) => l.id === active.id);
        const overIndex = sortedArray.findIndex((l) => l.id === over.id);

        let newIndex = overIndex;
        // Jika dijatuhkan pada space kosong target collection
        if (String(over.id).startsWith("container-")) {
          const containerId = String(over.id).replace("container-", "");
          const containerIndex = sortedArray.findIndex(
            (l) => l.id === containerId,
          );
          newIndex = containerIndex + 1;
        }

        const reordered = arrayMove(sortedArray, oldIndex, newIndex).map(
          (l, i) => ({ ...l, order: i }),
        );

        setTimeout(() => {
          fetch("/api/user/biolink/links/reorder", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              links: reordered.map((l) => ({
                id: l.id,
                order: l.order,
                parentId: l.parentId || null,
              })),
            }),
          });
        }, 100);

        return reordered;
      });
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setDraggedWidth(null);
  };

  const fetchProfile = async () => {
    try {
      const userId = (session?.user as { id?: string })?.id;
      if (!userId) return;

      const res = await fetch(`/api/user/biolink?userId=${userId}`);
      if (res.ok) {
        const json = await res.json();

        if (json.data) {
          setProfile(json.data);
          setUsername(json.data.username || "");
          setBio(json.data.bio || "");
          setTheme(json.data.theme || "default");
          setAvatar(json.data.avatar || "");
          setLinks(json.data.links || []);

          let normalizedDesignConfig = null;

          if (json.data.designConfig) {
            setDesignConfig(json.data.designConfig);
            try {
              const config: any = JSON.parse(json.data.designConfig);
              setButtonShape(config.buttonShape || "");
              setButtonStyle(config.buttonStyle || "");
              if (config.buttonBgColor) setButtonBgColor(config.buttonBgColor);
              if (config.buttonTextColor)
                setButtonTextColor(config.buttonTextColor);
              if (config.buttonBorderColor)
                setButtonBorderColor(config.buttonBorderColor);
              if (config.buttonBorderWidth !== undefined)
                setButtonBorderWidth(config.buttonBorderWidth);
              if (config.profileBorderRadius)
                setProfileBorderRadius(config.profileBorderRadius as any);
              if (config.profileBorderColor)
                setProfileBorderColor(config.profileBorderColor);
              if (config.profileBorderWidth !== undefined)
                setProfileBorderWidth(config.profileBorderWidth);
              setBgType(config.bgType || "");
              if (config.bgValue) setBgValue(config.bgValue);
              if (config.fontFamily) setFontFamily(config.fontFamily);
              if ((config as any).socials) setSocials((config as any).socials);

              normalizedDesignConfig = JSON.stringify({
                buttonShape: config.buttonShape || "",
                buttonStyle: config.buttonStyle || "",
                buttonBgColor: config.buttonBgColor || "#ffffff",
                buttonTextColor: config.buttonTextColor || "#000000",
                buttonBorderColor: config.buttonBorderColor || "#ffffff",
                buttonBorderWidth:
                  config.buttonBorderWidth !== undefined
                    ? config.buttonBorderWidth
                    : 0,
                profileBorderRadius: config.profileBorderRadius || "circle",
                profileBorderColor: config.profileBorderColor || "#ffffff",
                profileBorderWidth:
                  config.profileBorderWidth !== undefined
                    ? config.profileBorderWidth
                    : 2,
                bgType: config.bgType || "",
                bgValue: config.bgValue || "#0f0f15",
                fontFamily: config.fontFamily || "sans",
                socials: (config as any).socials || {},
              });
            } catch (e) {}
          }

          setInitialState({
            username: json.data.username || "",
            bio: json.data.bio || "",
            theme: json.data.theme || "default",
            avatar: json.data.avatar || "",
            designConfig: normalizedDesignConfig || null,
          });
        } else {
          setInitialState({
            username: "",
            bio: "",
            theme: "default",
            avatar: "",
            designConfig: null,
          });
        }
      } else {
        setInitialState({
          username: "",
          bio: "",
          theme: "default",
          avatar: "",
          designConfig: null,
        });
      }
    } catch (e) {
      console.error(e);
      setInitialState({
        username: "",
        bio: "",
        theme: "default",
        avatar: "",
        designConfig: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const currentDesignConfig = JSON.stringify({
    buttonShape,
    buttonStyle,
    buttonBgColor,
    buttonTextColor,
    buttonBorderColor,
    buttonBorderWidth,
    profileBorderRadius,
    profileBorderColor,
    profileBorderWidth,
    bgType,
    bgValue,
    fontFamily,
    socials,
  });

  useEffect(() => {
    if (!initialState) return;

    const isChanged =
      username !== initialState.username ||
      bio !== initialState.bio ||
      theme !== initialState.theme ||
      avatar !== initialState.avatar ||
      currentDesignConfig !==
        (initialState.designConfig ||
          JSON.stringify({
            buttonShape: "",
            buttonStyle: "",
            buttonBgColor: "#ffffff",
            buttonTextColor: "#000000",
            buttonBorderColor: "#ffffff",
            buttonBorderWidth: 0,
            profileBorderRadius: "circle",
            profileBorderColor: "#ffffff",
            profileBorderWidth: 2,
            bgType: "",
            bgValue: "#0f0f15",
            fontFamily: "sans",
            socials: {},
          }));

    setHasChanges(isChanged);
  }, [username, bio, theme, avatar, currentDesignConfig, initialState]);

  const handleUpdateProfile = async (
    e?: React.FormEvent | React.MouseEvent,
  ) => {
    if (e) e.preventDefault();
    if (!username) {
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "Username cannot be empty." : "Username tidak boleh kosong.",
        "error"
      );
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/biolink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as { id?: string })?.id,
          username,
          bio,
          theme,
          avatar,
          designConfig: currentDesignConfig,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.data);
        setInitialState({
          username,
          bio,
          theme,
          avatar,
          designConfig: currentDesignConfig,
        });
        setHasChanges(false);
        showAlert(
          language === 'en' ? "Success" : "Berhasil",
          language === 'en' ? "Your Biolink profile has been updated successfully!" : "Profil biolink Anda berhasil diperbarui!",
          "success",
        );
      } else {
        showAlert(
          language === 'en' ? "Failed" : "Gagal",
          data.error || (language === 'en' ? "Failed to update profile." : "Gagal memperbarui profil."),
          "error"
        );
      }
    } catch {
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "Network issue." : "Jaringan bermasalah.",
        "error"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "Title is required!" : "Judul harus diisi!",
        "error"
      );
      return;
    }
    if (newType === "link" && !newUrl) {
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "URL is required!" : "URL harus diisi!",
        "error"
      );
      return;
    }

    setAddingLink(true);
    try {
      const res = await fetch("/api/user/biolink/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as { id?: string })?.id,
          title: newTitle,
          url: newUrl || "",
          type: newType,
          thumbnail: newThumbnail || null,
          order: links.length,
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewUrl("");
        setNewThumbnail("");
        setNewType("link");
        setShowAddForm(false);
        fetchProfile();
        showAlert(
          language === 'en' ? "Success" : "Berhasil",
          language === 'en' ? "New link added successfully!" : "Link baru berhasil ditambahkan!",
          "success"
        );
      }
    } catch (e) {
      console.error(e);
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "Failed to add link." : "Gagal menambahkan link.",
        "error"
      );
    } finally {
      setAddingLink(false);
    }
  };
  const handleDeleteLink = (id: string) => {
    setLinkToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLink = async () => {
    if (!linkToDelete) return;
    try {
      const res = await fetch(`/api/user/biolink/links/${linkToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProfile();
        showAlert(
          language === 'en' ? "Success" : "Berhasil",
          language === 'en' ? "Link deleted successfully." : "Link berhasil dihapus.",
          "success"
        );
      }
    } catch (e) {
      console.error(e);
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "Failed to delete link." : "Gagal menghapus link.",
        "error"
      );
    } finally {
      setShowDeleteConfirm(false);
      setLinkToDelete(null);
    }
  };

  const handleToggleLink = async (id: string, isActive: boolean) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !isActive } : l)),
    );
    try {
      await fetch(`/api/user/biolink/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
    } catch {
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isActive } : l)),
      );
    }
  };

  const handleUpdateLink = async (id: string) => {
    const link = links.find((l) => l.id === id);
    if (!editTitle) return;
    if (link?.type !== "header" && !editUrl) return;

    try {
      const updateData: any = { title: editTitle, url: editUrl || "" };
      if (editThumbnail !== undefined) updateData.thumbnail = editThumbnail;
      if (editLayout) updateData.layout = editLayout;

      const res = await fetch(`/api/user/biolink/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        setEditingLinkId(null);
        setEditThumbnail(null);
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLinkDirectly = async (id: string, updateData: any) => {
    // Optimistic UI update
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updateData } : l)),
    );
    try {
      const res = await fetch(`/api/user/biolink/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        fetchProfile(); // Revert state if failed
      }
    } catch (e) {
      console.error(e);
      fetchProfile();
    }
  };

  const handleMoveOut = async (id: string) => {
    try {
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, parentId: null } : l)),
      );
      const res = await fetch(`/api/user/biolink/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: null }),
      });
      if (!res.ok) fetchProfile();
    } catch (e) {
      console.error(e);
      fetchProfile();
    }
  };

  const startEditLink = (link: LinkItem) => {
    setEditingLinkId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditThumbnail(link.thumbnail);
    setEditLayout(link.layout || "stack");
  };

  const handleEditThumbUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "File too large. Maximum size 5MB." : "File terlalu besar. Maksimal 5MB.",
        "error"
      );
      return;
    }
    setCropType("thumbnail");
    setCropAspect(1);
    setSelectedCropShape("rect");
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error",
  ) => {
    setNotification({ show: true, title, message, type });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "thumbnail",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "File too large. Maximum size 5MB." : "File terlalu besar. Maksimal file 5MB.",
        "error"
      );
      return;
    }
    setCropType(type);
    setCropAspect(1);
    setSelectedCropShape(type === "avatar" ? "round" : "rect");
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCropAndUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    if (cropType === "avatar") {
      setUploadingAvatar(true);
    } else if (editingLinkId) {
      setUploadingEditThumb(true);
    } else {
      setUploadingThumb(true);
    }

    setImageSrc(null);
    try {
      const croppedImageNode = await createCroppedImage(
        imageSrc,
        croppedAreaPixels,
      );
      const res = await fetch("/api/user/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64: croppedImageNode,
          userId: (session?.user as { id?: string })?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (cropType === "avatar") {
          setAvatar(data.url);
        } else if (editingLinkId) {
          setEditThumbnail(data.url);
        } else {
          setNewThumbnail(data.url);
        }
      } else {
        showAlert(
          language === 'en' ? "Failed" : "Gagal",
          data.error || (language === 'en' ? "Failed to upload image." : "Gagal mengupload gambar."),
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      showAlert(
        language === 'en' ? "Failed" : "Gagal",
        language === 'en' ? "Failed to upload image." : "Gagal mengupload gambar.",
        "error"
      );
    } finally {
      if (cropType === "avatar") {
        setUploadingAvatar(false);
      } else if (editingLinkId) {
        setUploadingEditThumb(false);
      } else {
        setUploadingThumb(false);
      }
    }
  };

  const createCroppedImage = (imageSrc: string, crop: any): Promise<string> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = crop.width;
        canvas.height = crop.height;
        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
    });
  };

  const copyBiolinkUrl = () => {
    const url = `${hostname}/t/${username}`;
    navigator.clipboard.writeText(url);
    showAlert(
      language === 'en' ? "Copied!" : "Disalin!",
      language === 'en' ? `Link ${url} copied successfully.` : `Link ${url} berhasil disalin.`,
      "success"
    );
  };

  const resolvedTheme = resolveTheme(theme);
  const activeLinks = links.filter((l) => l.isActive);

  const previewBgStyle: React.CSSProperties = bgType
    ? {
        ...(bgType === "color"
          ? { background: bgValue, backgroundColor: bgValue }
          : {}),
        ...(bgType === "gradient" ? { background: bgValue } : {}),
        ...(bgType === "image" || bgType === "gif"
          ? {
              backgroundImage: `url(${bgValue})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}),
      }
    : {};

  const previewButtonStyle: React.CSSProperties = buttonStyle
    ? {
        borderRadius:
          buttonShape === "rounded-none"
            ? "0"
            : buttonShape === "rounded"
              ? "8px"
              : buttonShape === "rounded-xl"
                ? "16px"
                : buttonShape === "rounded-full"
                  ? "9999px"
                  : "12px",
        borderStyle: buttonStyle === "solid" ? "none" : "solid",
        borderWidth: buttonStyle === "solid" ? "0" : "2px",
        borderColor:
          buttonStyle === "outline" ? buttonTextColor : "transparent",
        backgroundColor:
          buttonStyle === "solid" ? buttonBgColor : "transparent",
        color: buttonTextColor,
        boxShadow:
          buttonStyle === "solid"
            ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            : "none",
      }
    : {
        borderRadius:
          buttonShape === "rounded-none"
            ? "0"
            : buttonShape === "rounded"
              ? "8px"
              : buttonShape === "rounded-xl"
                ? "16px"
                : buttonShape === "rounded-full"
                  ? "9999px"
                  : "12px",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      };

  useEffect(() => {
    if (theme.startsWith("custom:")) {
      const resolved = resolveTheme(theme);
      if (resolved.color1) setCustomColor1(resolved.color1);
      if (resolved.color2) setCustomColor2(resolved.color2);
      if (resolved.textMode)
        setCustomTextMode(resolved.textMode as "light" | "dark");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
            {language === 'en' ? "Loading Biolink..." : "Memuat biolink..."}
          </p>
        </div>
      </div>
    );
  }

  const activeDragLink = activeDragId
    ? links.find((l) => l.id === activeDragId)
    : null;

  const sortedLinks: any[] = [];
  const rootsToRender = links.filter((l) => !l.parentId);
  rootsToRender.sort((a, b) => a.order - b.order);
  const rootIdsForRender = new Set(rootsToRender.map((l) => l.id));
  links.forEach((l) => {
    if (
      l.parentId &&
      !links.find((p) => p.id === l.parentId) &&
      !rootIdsForRender.has(l.id)
    ) {
      rootsToRender.push({ ...l, parentId: null });
      rootIdsForRender.add(l.id);
    }
  });

  rootsToRender.forEach((root) => {
    sortedLinks.push(root);
    if (root.type === "header") {
      const children = links
        .filter((l) => l.parentId === root.id)
        .sort((a, b) => a.order - b.order);
      sortedLinks.push(...children);
    }
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="text-slate-900 dark:text-white font-sans flex flex-col selection:bg-violet-500/30 w-full h-full relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 dark:bg-violet-600/20 rounded-full blur-[120px] animate-blob -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 -z-10" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-fuchsia-600/10 dark:bg-fuchsia-600/15 rounded-full blur-[100px] animate-blob animation-delay-4000 -z-10" />
        {/* ========== MAIN LAYOUT ========== */}
        <div className="flex-1 flex flex-col w-full relative pb-24 xl:pb-0 z-10">
          {/* ========== WRAPPER FOR CONTENT & PREVIEW ========== */}
          <div className="flex-1 flex flex-col xl:flex-row min-w-0 gap-0 xl:gap-4">
            {/* ========== CENTER CONTENT ========== */}
            <main
              className="z-40 flex-1 flex flex-col min-w-0 lg:h-[calc(100vh-56px)] lg:overflow-y-auto pb-4 lg:pb-12"
            >
              {/* Drag Handle for Mobile Sheet */}
              <div className="hidden" />

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 xl:px-4 pb-36 xl:pb-6 xl:pt-6">
                {/* Top Management Tabs - Desktop only (sticky top) */}
                <nav className="hidden lg:flex sticky top-0 z-[100] mb-6 p-1.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl items-center justify-center gap-1">
                  {[
                    {
                      id: "links",
                      label: t("biolink.tab.links"),
                      icon: faLink,
                    },
                    {
                      id: "profile",
                      label: t("biolink.tab.profile"),
                      icon: faUser,
                    },
                    {
                      id: "design",
                      label: t("biolink.tab.design"),
                      icon: faPaintBrush,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"}`}
                    >
                      <FontAwesomeIcon
                        icon={tab.icon}
                        className="text-xs opacity-80"
                      />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="max-w-4xl mx-auto">
                  {/* LINKS TAB */}
                  {activeTab === "links" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                      {/* Profile Overview Hero - Minimalist Style */}
                      <div className="relative group bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-md overflow-hidden mb-6 transition-all hover:shadow-xl">
                        <div className="absolute -top-12 -right-12 p-16 opacity-[0.03] pointer-events-none group-hover:rotate-[15deg] transition-transform duration-1000 blur-xl">
                          <FontAwesomeIcon
                            icon={faLink}
                            className="text-[12rem] rotate-12"
                          />
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl border-2 border-white/20 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                            {avatar ? (
                              <img
                                src={avatar}
                                className="w-full h-full object-cover"
                                alt="avatar"
                              />
                            ) : (
                              username?.[0]?.toUpperCase() || "U"
                            )}
                          </div>

                          <div className="text-center sm:text-left flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 break-words">
                              {username
                                ? `u/${username}`
                                : language === "en"
                                  ? "New Username"
                                  : "Username Baru"}
                            </h1>
                            <div
                              className="flex bg-slate-100/50 dark:bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/30 dark:border-white/5 items-center justify-center sm:justify-start gap-4 hover:border-violet-400/30 transition-all group/url cursor-pointer w-fit mx-auto sm:mx-0"
                              onClick={() =>
                                username &&
                                window.open(`/t/${username}`, "_blank")
                              }
                            >
                              <div className="flex items-center text-xs font-black tracking-tight text-slate-400 dark:text-slate-500">
                                <span>nyoo.me/</span>
                                <span className="text-violet-600 dark:text-violet-400 font-black">
                                  {username || "username"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setActiveTab("profile")}
                              className="w-12 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-500 hover:text-violet-600 dark:text-violet-400 border border-slate-200 dark:border-slate-700 transition-all hover:scale-110 shadow-sm"
                              title="Edit Profil"
                            >
                              <FontAwesomeIcon
                                icon={faUser}
                                className="text-lg"
                              />
                            </button>
                            {username && (
                              <>
                                <button
                                  onClick={() => setShowMobilePreview(true)}
                                  className="xl:hidden w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-500 transition-all hover:scale-110 shadow-lg shadow-indigo-600/30"
                                  title="Lihat Pratinjau"
                                >
                                  <FontAwesomeIcon
                                    icon={faEye}
                                    className="text-lg"
                                  />
                                </button>
                                <button
                                  onClick={() =>
                                    window.open(`/t/${username}`, "_blank")
                                  }
                                  className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center hover:bg-violet-500 transition-all hover:scale-110 shadow-lg shadow-violet-600/30"
                                  title="Buka Halaman"
                                >
                                  <FontAwesomeIcon
                                    icon={faExternalLinkAlt}
                                    className="text-lg"
                                  />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {!username && (
                        <div className="bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-[2rem] p-8 text-center mb-10 animate-in fade-in zoom-in duration-700">
                          <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl">
                            <FontAwesomeIcon icon={faUser} />
                          </div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                            {t("biolink.hero.username_req")}
                          </h3>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                            {t("biolink.hero.username_req_desc")}
                          </p>
                          <button
                            onClick={() => setActiveTab("profile")}
                            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                          >
                            {t("biolink.hero.username_req_btn")}
                          </button>
                        </div>
                      )}

                      {/* Add Link Section - Compact & Modern */}
                      <div
                        className={`relative z-10 transition-all duration-500 ${!username ? "opacity-40 grayscale pointer-events-none" : ""}`}
                      >
                        <button
                          onClick={() =>
                            showAddForm
                              ? setShowAddForm(false)
                              : setShowAddForm(true)
                          }
                          disabled={!username}
                          className={`w-full group relative overflow-hidden flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-2 border-dashed transition-all duration-500 
                  ${showAddForm ? "border-violet-500/50 bg-violet-500/5 text-violet-500" : "border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-white/5 hover:border-violet-500/30 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"}`}
                        >
                          <motion.div
                            animate={{ rotate: showAddForm ? 135 : 0 }}
                            className="w-8 h-8 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-lg shadow-lg border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </motion.div>
                          <span className="text-xs font-black uppercase tracking-widest">
                            {showAddForm ? (language === 'en' ? "Cancel Add" : "Batalkan Tambah") : t("biolink.btn.add")}
                          </span>
                        </button>
                      </div>

                      <AnimatePresence>
                        {showAddForm && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -20 }}
                            className="relative z-20"
                          >
                            <form
                              onSubmit={handleAddLink}
                              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl p-4 sm:p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl space-y-8"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-100/50 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                {[
                                  {
                                    id: "link",
                                    label: t("biolink.form.type.web"),
                                    icon: faLink,
                                  },
                                  {
                                    id: "header",
                                    label: t("biolink.form.type.group"),
                                    icon: faLayerGroup,
                                  },
                                ].map((type) => (
                                  <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setNewType(type.id as any)}
                                    className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-black transition-all ${newType === type.id ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
                                  >
                                    <FontAwesomeIcon icon={type.icon} />{" "}
                                    {type.label}
                                  </button>
                                ))}
                              </div>

                              <div className="space-y-6">
                                <div className="space-y-3 px-2">
                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                    {t("biolink.form.title")}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={
                                      newType === "header"
                                        ? t("biolink.form.placeholder.title")
                                        : t("biolink.form.placeholder.title_web")
                                    }
                                    value={newTitle}
                                    onChange={(e) =>
                                      setNewTitle(e.target.value)
                                    }
                                    className="w-full px-6 py-5 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/20 shadow-inner-sm transition-all"
                                    autoFocus
                                  />
                                </div>

                                {newType === "link" && (
                                  <div className="space-y-6">
                                    <div className="space-y-3">
                                      <label className="text-xs font-bold font-semibold text-slate-400 dark:text-slate-500 ml-1">
                                        {t("biolink.form.url")}
                                      </label>
                                      <input
                                        type="url"
                                        placeholder="https://..."
                                        value={newUrl}
                                        onChange={(e) =>
                                          setNewUrl(e.target.value)
                                        }
                                        className="w-full px-5 py-3.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-zinc-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all font-mono"
                                      />
                                    </div>
                                    <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                                      <label className="text-xs font-bold font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-3">
                                        <FontAwesomeIcon icon={faImage} />
                                        {t("biolink.form.icon")}{" "}
                                        {uploadingThumb && (
                                          <span className="text-violet-400 animate-pulse">
                                            {language === 'en' ? "(Uploading...)" : "(Mengunggah...)"}
                                          </span>
                                        )}
                                      </label>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                          handleFileChange(e, "thumbnail")
                                        }
                                        className="w-[110px] text-xs text-transparent file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:uppercase file:tracking-widest file:bg-violet-600/10 file:text-violet-400 hover:file:bg-violet-600/20 cursor-pointer transition-all"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                  <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 py-3.5 glass text-slate-500 dark:text-zinc-400 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                                  >
                                    {t("biolink.form.btn_cancel")}
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={addingLink}
                                    className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-500 text-slate-900 dark:text-white font-bold text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
                                  >
                                    {addingLink
                                      ? (language === 'en' ? "Adding..." : "Menambahkan...")
                                      : newType === "header"
                                        ? t("biolink.form.btn_submit_group")
                                        : t("biolink.form.btn_submit")}
                                  </button>
                                </div>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Link Cards List */}
                      <div
                        className={`space-y-0 transition-all duration-500 ${!username ? "opacity-40 grayscale pointer-events-none scale-95 origin-top" : ""}`}
                      >
                        {links.length === 0 && (
                          <div className="text-center py-16 px-10 glass dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/5">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner text-slate-300 dark:text-slate-600">
                              <FontAwesomeIcon
                                icon={faLayerGroup}
                                className="text-2xl"
                              />
                            </div>
                            <p className="text-base font-bold text-slate-900 dark:text-white mb-2 font-semibold">
                              {t("biolink.empty")}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium leading-relaxed">
                              {t("biolink.empty_desc")}
                            </p>
                          </div>
                        )}

                        <SortableContext
                          items={sortedLinks.map((l) => l.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {(() => {
                            return sortedLinks.map((l, index) => {
                              const isHeader = l.type === "header";
                              const isChild = !!l.parentId;
                              const nextItem = sortedLinks[index + 1];
                              const hasChildren =
                                isHeader && nextItem?.parentId === l.id;
                              const isLastChild =
                                isChild &&
                                (!nextItem || nextItem.parentId !== l.parentId);

                              return (
                                <div
                                  key={l.id}
                                  className={`
                              ${isHeader && hasChildren ? "mb-0 mt-5 rounded-t-[1.5rem] border-t border-l border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#141417] shadow-xl pt-2 px-2" : ""}
                              ${isHeader && !hasChildren ? "mb-5 mt-5 rounded-[1.5rem] border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#141417] shadow-xl pt-2 px-2" : ""}
                              ${isChild ? "mx-0 bg-slate-50 dark:bg-[#141417] border-l border-r border-slate-200 dark:border-white/5 px-2 relative" : ""}
                              ${isChild && isLastChild ? "mb-5 rounded-b-[1.5rem] border-b pb-3" : ""}
                              ${!isHeader && !isChild ? "mb-4 mt-4" : ""}
                           `}
                                >
                                  <SortableLinkCard
                                    key={l.id}
                                    l={l}
                                    isChild={isChild}
                                    editingLinkId={editingLinkId}
                                    startEditLink={startEditLink}
                                    handleUpdateLink={handleUpdateLink}
                                    handleUpdateLinkDirectly={
                                      handleUpdateLinkDirectly
                                    }
                                    handleToggleLink={handleToggleLink}
                                    handleMoveOut={handleMoveOut}
                                    handleEditThumbUpload={
                                      handleEditThumbUpload
                                    }
                                    uploadingEditThumb={uploadingEditThumb}
                                    editTitle={editTitle}
                                    setEditTitle={setEditTitle}
                                    editUrl={editUrl}
                                    setEditUrl={setEditUrl}
                                    editThumbnail={editThumbnail}
                                    setEditThumbnail={setEditThumbnail}
                                    editLayout={editLayout}
                                    setEditLayout={setEditLayout}
                                    setEditingLinkId={setEditingLinkId}
                                    showAlert={showAlert}
                                    handleDeleteLink={handleDeleteLink}
                                  />
                                  {isHeader && !hasChildren && (
                                    <div className="px-3 pb-3">
                                      <EmptyDropZone id={`container-${l.id}`} />
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </SortableContext>
                      </div>
                    </div>
                  )}
                  {/* PROFILE TAB - Minimalist */}
                  {activeTab === "profile" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
                      <div className="relative group bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-500">
                          <FontAwesomeIcon
                            icon={faUser}
                            className="text-8xl -rotate-12"
                          />
                        </div>

                        <div className="relative z-10">
                          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
                            {language === 'en' ? "Your Identity" : "Identitas Kamu"}
                          </h2>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-60">
                            {language === 'en' ? "Set your basic info and main visual profile." : "Atur info dasar dan visual utama profilmu."}
                          </p>
                        </div>
                      </div>

                      <form
                        onSubmit={handleUpdateProfile}
                        className="space-y-6"
                      >
                        {/* Avatar Profile Section */}
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 block ml-1">
                              {language === 'en' ? "Profile Picture" : "Foto Profil"}
                            </label>
                            <div className="flex items-center gap-8">
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl border-2 border-white/20 overflow-hidden shrink-0 relative group transition-transform hover:scale-105 duration-500">
                                {avatar ? (
                                  <img
                                    src={avatar}
                                    className="w-full h-full object-cover"
                                    alt="avatar"
                                  />
                                ) : (
                                  username?.[0]?.toUpperCase() || "U"
                                )}
                                <AnimatePresence>
                                  {uploadingAvatar && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                                    >
                                      <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <div className="space-y-3">
                                <label className="inline-flex items-center gap-2.5 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all shadow-md shadow-violet-600/30 hover:scale-105 active:scale-95">
                                  <FontAwesomeIcon icon={faImage} />
                                  <span>{language === 'en' ? "Change Photo" : "Ganti Foto"}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleFileChange(e, "avatar")
                                    }
                                    className="hidden"
                                  />
                                </label>
                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 italic opacity-60">
                                  {language === 'en' ? "Max file size: 5MB" : "Maksimal file: 5MB"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Basic Info Inputs */}
                          <div className="grid grid-cols-1 gap-6 pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                {language === 'en' ? "Username" : "Nama Pengguna"}
                              </label>
                              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-black/40 focus-within:ring-3 focus-within:ring-violet-500/20 transition-all shadow-sm">
                                <span className="flex items-center text-[10px] font-black text-slate-400 dark:text-slate-500 px-4 py-3 bg-slate-50 dark:bg-white/5 border-r border-slate-200 dark:border-slate-800">
                                  /t/
                                </span>
                                <input
                                  type="text"
                                  value={username}
                                  onChange={(e) =>
                                    setUsername(
                                      e.target.value
                                        .replace(/[^a-zA-Z0-9]/g, "")
                                        .toLowerCase(),
                                    )
                                  }
                                  className="w-full px-4 py-3 bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
                                  placeholder={language === 'en' ? "new-username" : "username-baru"}
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                {language === 'en' ? "Short Bio" : "Bio Singkat"}
                              </label>
                              <textarea
                                rows={3}
                                placeholder={language === 'en' ? "Write something about yourself..." : "Tuliskan sesuatu tentang dirimu..."}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full px-5 py-4 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-violet-500/20 shadow-sm resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Social Media Links Section */}
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 sm:p-6 space-y-6 shadow-md">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-violet-600/20 text-violet-600 dark:text-violet-400 rounded-lg flex items-center justify-center text-base border border-violet-500/20">
                              <FontAwesomeIcon icon={faShareNodes} />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                {language === 'en' ? "Social Media" : "Media Sosial"}
                              </h3>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1 opacity-50">
                                {language === 'en' ? "Appears automatically on your page." : "Muncul otomatis di halaman."}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              "instagram",
                              "tiktok",
                              "youtube",
                              "facebook",
                              "linkedin",
                              "github",
                              "whatsapp",
                            ].map((soc) => (
                              <div
                                key={soc}
                                className="flex items-center gap-3 p-2 bg-white/50 dark:bg-black/20 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:border-violet-500/30 transition-all group/soc shadow-sm"
                              >
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 border border-slate-200/50 dark:border-slate-700 flex items-center justify-center transition-transform group-hover/soc:scale-105">
                                  <img
                                    src={`https://cdn.simpleicons.org/${soc}/${soc === "github" || soc === "tiktok" ? "white" : soc !== "whatsapp" ? "default" : "25D366"}`}
                                    className="w-4 h-4 object-contain opacity-70 group-hover/soc:opacity-100 transition-opacity"
                                    alt={soc}
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={socials[soc] || ""}
                                  onChange={(e) =>
                                    setSocials({
                                      ...socials,
                                      [soc]: e.target.value,
                                    })
                                  }
                                  className="flex-1 bg-transparent border-0 text-[11px] font-black text-slate-900 dark:text-white focus:outline-none focus:ring-0 placeholder-slate-400"
                                  placeholder={`${soc.charAt(0).toUpperCase() + soc.slice(1)} URL`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </form>
                    </div>
                  )}{" "}
                  {/* DESIGN TAB - Minimalist Studio */}
                  {activeTab === "design" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
                      <div className="relative group bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-500">
                          <FontAwesomeIcon
                            icon={faPaintBrush}
                            className="text-8xl rotate-12"
                          />
                        </div>
                        <div className="relative z-10">
                          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
                            {language === 'en' ? "Page Design" : "Tampilan Halaman"}
                          </h2>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-60">
                            {language === 'en' ? "Personalize colors, buttons, and typography." : "Personalisaikan warna, tombol, dan tipografi."}
                          </p>
                        </div>
                      </div>

                      {/* Design Sub-Tabs - Compact Pill */}
                      <div className="flex bg-white/20 dark:bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/30 dark:border-white/5 overflow-x-auto shadow-xl no-scrollbar gap-1">
                        {[
                          { id: "template", label: language === 'en' ? "Preset" : "Preset" },
                          { id: "background", label: language === 'en' ? "Background" : "Latar" },
                          { id: "button", label: language === 'en' ? "Button" : "Tombol" },
                          { id: "font", label: language === 'en' ? "Typography" : "Tipografi" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={(e) => {
                              e.preventDefault();
                              setDesignTab(tab.id as any);
                            }}
                            className={`flex-1 min-w-[80px] py-4 px-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${
                              designTab === tab.id
                                ? "bg-violet-600 text-white shadow-xl shadow-violet-600/30"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <form
                        onSubmit={handleUpdateProfile}
                        className="space-y-10"
                      >
                        {/* TEMPLATE SUBTAB */}
                        <div
                          style={{
                            display:
                              designTab === "template" ? "block" : "none",
                          }}
                        >
                          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-8 block ml-1">
                              {language === 'en' ? "Choose Preset Theme" : "Pilih Tema Preset"}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                              {PRESET_THEMES.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setTheme(t.id);
                                    setBgType("");
                                    setButtonStyle("");
                                    setButtonShape("");
                                  }}
                                  className={`relative p-4 rounded-2xl border-2 transition-all duration-500 text-left group/theme ${
                                    theme === t.id
                                      ? "border-violet-500 bg-violet-500/10 scale-[1.03] shadow-lg"
                                      : "border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-black/40 hover:border-violet-500/40"
                                  }`}
                                >
                                  <div
                                    className="w-full h-24 rounded-xl mb-4 shadow-lg border border-white/20 overflow-hidden"
                                    style={{ background: t.previewBg }}
                                  />
                                  <p className="text-[10px] font-black text-slate-900 dark:text-white text-center truncate">
                                    {t.name}
                                  </p>
                                  {theme === t.id && (
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 animate-in zoom-in duration-300">
                                      <FontAwesomeIcon
                                        icon={faCheck}
                                        className="text-xs"
                                      />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* BACKGROUND SUBTAB */}
                        <div
                          style={{
                            display:
                              designTab === "background" ? "block" : "none",
                          }}
                          className="space-y-6"
                        >
                          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-8 block ml-1">
                              {language === 'en' ? "Background Color" : "Warna Latar Belakang"}
                            </h3>

                            <div className="w-full h-24 rounded-2xl mb-8 border-2 border-white/20 shadow-lg relative overflow-hidden">
                              <div
                                className="absolute inset-0 transition-all duration-1000"
                                style={{
                                  background: `linear-gradient(135deg, ${customColor1}, ${customColor2})`,
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white mix-blend-overlay">
                                  {language === 'en' ? "Background Preview" : "Preview Latar"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                  {language === 'en' ? "Primary Color" : "Warna Utama"}
                                </label>
                                <div className="flex items-center gap-4">
                                  <input
                                    type="color"
                                    value={customColor1}
                                    onChange={(e) =>
                                      setCustomColor1(e.target.value)
                                    }
                                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white/20 bg-transparent shadow-md flex-shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={customColor1}
                                    onChange={(e) =>
                                      setCustomColor1(e.target.value)
                                    }
                                    className="flex-1 px-5 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-3 focus:ring-violet-500/20 shadow-sm"
                                  />
                                </div>
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                  {language === 'en' ? "Secondary Color" : "Warna Sekunder"}
                                </label>
                                <div className="flex items-center gap-4">
                                  <input
                                    type="color"
                                    value={customColor2}
                                    onChange={(e) =>
                                      setCustomColor2(e.target.value)
                                    }
                                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white/20 bg-transparent shadow-md flex-shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={customColor2}
                                    onChange={(e) =>
                                      setCustomColor2(e.target.value)
                                    }
                                    className="flex-1 px-5 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-3 focus:ring-violet-500/20 shadow-sm"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="pt-10 border-t border-slate-200/50 dark:border-slate-800/50">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 block ml-2">
                                {language === 'en' ? "Text Contrast Mode" : "Mode Kontras Teks"}
                              </label>
                              <div className="flex gap-4 p-2 bg-slate-100/50 dark:bg-white/5 rounded-[1.5rem] border border-slate-200/50 dark:border-white/5">
                                <button
                                  type="button"
                                  onClick={() => setCustomTextMode("light")}
                                  className={`flex-1 py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-3 ${customTextMode === "light" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl scale-[1.02]" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
                                >
                                  <div className="w-5 h-5 bg-white rounded-full border border-slate-200 shadow-inner" />{" "}
                                  <span>{language === 'en' ? "Light Mode" : "Mode Terang"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCustomTextMode("dark")}
                                  className={`flex-1 py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-3 ${customTextMode === "dark" ? "bg-slate-900 text-white shadow-xl scale-[1.02]" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
                                >
                                  <div className="w-5 h-5 bg-slate-900 rounded-full border border-white/20 shadow-inner" />{" "}
                                  <span>{language === 'en' ? "Dark Mode" : "Mode Gelap"}</span>
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setTheme(
                                  encodeCustomTheme(
                                    customColor1,
                                    customColor2,
                                    customTextMode,
                                  ),
                                )
                              }
                              className="w-full mt-10 py-6 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] transition-all shadow-2xl shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {theme.startsWith("custom:")
                                ? (language === 'en' ? "✓ Gradient Theme Active" : "✓ Tema Gradient Aktif")
                                : (language === 'en' ? "Use This Gradient" : "Gunakan Gradient Ini")}
                            </button>
                          </div>
                        </div>{" "}
                        {/* BUTTONS SUBTAB */}
                        <div
                          style={{
                            display: designTab === "button" ? "block" : "none",
                          }}
                          className="space-y-6"
                        >
                          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                            <div className="space-y-6">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                {language === 'en' ? "Primary Button Shape" : "Bentuk Tombol Utama"}
                              </h3>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                  { id: "rounded-none", label: language === 'en' ? "Sharp" : "Tajam" },
                                  { id: "rounded-xl", label: language === 'en' ? "Soft" : "Soft" },
                                  { id: "rounded-[1.25rem]", label: language === 'en' ? "Curve" : "Curve" },
                                  { id: "rounded-full", label: language === 'en' ? "Pill" : "Pill" },
                                ].map((shape) => (
                                  <button
                                    type="button"
                                    key={shape.id}
                                    onClick={() =>
                                      setButtonShape(shape.id as any)
                                    }
                                    className={`h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all duration-300 ${buttonShape === shape.id ? "bg-violet-600/10 border-violet-500 shadow-lg scale-[1.03]" : "bg-white/50 dark:bg-black/40 border-slate-200 dark:border-white/5 hover:border-violet-500/30"}`}
                                  >
                                    <div
                                      className={`w-12 h-6 bg-slate-400/30 border border-slate-400/20 ${shape.id === "rounded-none" ? "rounded-none" : shape.id === "rounded-xl" ? "rounded-md" : shape.id === "rounded-[1.25rem]" ? "rounded-lg" : "rounded-full"}`}
                                    />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                      {shape.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-6 pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                {language === 'en' ? "Visual Style" : "Gaya Visual"}
                              </h3>
                              <div className="grid grid-cols-3 gap-4">
                                {[
                                  {
                                    id: "solid",
                                    label: language === 'en' ? "Solid" : "Solid",
                                    preview: (
                                      <div className="w-12 h-6 bg-violet-600/50 rounded-md shadow-md border border-white/20" />
                                    ),
                                  },
                                  {
                                    id: "outline",
                                    label: language === 'en' ? "Outline" : "Outline",
                                    preview: (
                                      <div className="w-12 h-6 border-2 border-violet-500/50 rounded-md" />
                                    ),
                                  },
                                  {
                                    id: "transparent",
                                    label: language === 'en' ? "Glass" : "Glass",
                                    preview: (
                                      <div className="w-12 h-6 bg-white/10 backdrop-blur-sm rounded-md border border-white/10" />
                                    ),
                                  },
                                ].map((style) => (
                                  <button
                                    type="button"
                                    key={style.id}
                                    onClick={() =>
                                      setButtonStyle(style.id as any)
                                    }
                                    className={`h-24 flex flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all duration-300 ${buttonStyle === style.id ? "bg-violet-600/10 border-violet-500 shadow-lg scale-[1.03]" : "bg-white/50 dark:bg-black/40 border-slate-200 dark:border-white/5 hover:border-violet-500/30"}`}
                                  >
                                    {style.preview}
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                      {style.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* TYPOGRAPHY SUBTAB */}
                        <div
                          style={{
                            display: designTab === "font" ? "block" : "none",
                          }}
                        >
                          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-8 block ml-1">
                              {language === 'en' ? "Typography" : "Tipografi"}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[
                                {
                                  id: "sans",
                                  name: "Standard",
                                  preview: "Aa",
                                  desc: language === 'en' ? "Modern" : "Modern",
                                },
                                {
                                  id: "serif",
                                  name: language === 'en' ? "Classic" : "Klasik",
                                  preview: "Aa",
                                  desc: language === 'en' ? "Elegant" : "Anggun",
                                },
                                {
                                  id: "mono",
                                  name: language === 'en' ? "System" : "Sistem",
                                  preview: "Aa",
                                  desc: language === 'en' ? "Technical" : "Teknis",
                                },
                                {
                                  id: "rounded",
                                  name: language === 'en' ? "Friendly" : "Humanis",
                                  preview: "Aa",
                                  desc: language === 'en' ? "Friendly" : "Ramah",
                                },
                                {
                                  id: "inter",
                                  name: language === 'en' ? "Dynamic" : "Dinamis",
                                  preview: "Aa",
                                  desc: "Inter",
                                },
                                {
                                  id: "poppins",
                                  name: "Pop",
                                  preview: "Aa",
                                  desc: "Poppins",
                                },
                                {
                                  id: "montserrat",
                                  name: language === 'en' ? "Bold" : "Gaya",
                                  preview: "Aa",
                                  desc: language === 'en' ? "Bold" : "Tebal",
                                },
                                {
                                  id: "impact",
                                  name: language === 'en' ? "Heavy" : "Berat",
                                  preview: "Aa",
                                  desc: language === 'en' ? "Strong" : "Kuat",
                                },
                                {
                                  id: "playfair",
                                  name: language === 'en' ? "Luxury" : "Mewah",
                                  preview: "Aa",
                                  desc: language === 'en' ? "Artistic" : "Seni",
                                },
                              ].map((f) => (
                                <button
                                  type="button"
                                  key={f.id}
                                  onClick={() => setFontFamily(f.id)}
                                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-500 text-left ${
                                    fontFamily === f.id
                                      ? "bg-violet-600/10 border-violet-500 shadow-lg scale-[1.02] ring-3 ring-violet-500/10"
                                      : "bg-white/50 dark:bg-black/40 border-slate-200/50 dark:border-white/5 hover:border-violet-500/30"
                                  }`}
                                >
                                  <div
                                    className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-xl font-black text-slate-900 dark:text-white border-2 border-white/20 shadow-md"
                                    style={{
                                      fontFamily: getFontFamilyStyle(f.id),
                                    }}
                                  >
                                    {f.preview}
                                  </div>
                                  <div className="flex-1">
                                    <p
                                      className="text-xs font-black text-slate-900 dark:text-white mb-0.5"
                                      style={{
                                        fontFamily: getFontFamilyStyle(f.id),
                                      }}
                                    >
                                      {f.name}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest opacity-50 italic">
                                      {f.desc}
                                    </p>
                                  </div>
                                  {fontFamily === f.id && (
                                    <div className="w-8 h-8 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
                                      <FontAwesomeIcon
                                        icon={faCheck}
                                        className="text-xs"
                                      />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== MOBILE STICKY SAVE FOOTER (inside sheet) ===== */}
              <AnimatePresence>
                {(hasChanges || savingProfile) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="lg:hidden flex-shrink-0 px-4 pt-3 pb-[80px] border-t border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl"
                  >
                    <button
                      onClick={handleUpdateProfile}
                      disabled={savingProfile}
                      className="w-full flex items-center justify-center gap-3 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} />
                          <span>{language === 'en' ? "Save Changes" : "Simpan Perubahan"}</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
            {/* ========== RIGHT SIDEBAR - PHONE PREVIEW ========== */}
            <aside
              className="hidden xl:flex xl:static xl:h-auto xl:w-[450px] xl:border-l xl:border-slate-200 dark:border-white/5 xl:p-6 xl:flex-shrink-0 bg-transparent overflow-hidden"
            >
              <div className="w-full max-w-[340px] xl:scale-110 origin-center">
                <div className="xl:sticky top-24 pointer-events-auto">
                  <div className="hidden xl:flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 font-semibold">
                        {t("biolink.live_preview")}
                      </p>
                    </div>
                    {username && (
                      <a
                        href={`/t/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 glass border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-violet-500 dark:text-violet-400 hover:bg-violet-600 hover:text-slate-900 dark:text-white transition-all flex items-center gap-2 font-semibold"
                      >
                        {t("biolink.live_preview_btn")}{" "}
                        <FontAwesomeIcon
                          icon={faExternalLinkAlt}
                          className="text-xs"
                        />
                      </a>
                    )}
                  </div>

                  {/* Phone Frame - Premium iPhone 15 Pro Look */}
                  <div className="bg-[#1e1e24] dark:bg-[#0a0a0c] rounded-[3.5rem] p-1.5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border-[1.5px] border-slate-600/30 relative ring-[6px] ring-slate-800/90 shadow-2xl transition-all duration-700">
                    {/* Physical Buttons - Left Side (Action + Volume) */}
                    <div className="absolute -left-[9px] top-28 w-[3px] h-8 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />{" "}
                    {/* Action Button */}
                    <div className="absolute -left-[9px] top-[148px] w-[3px] h-14 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />{" "}
                    {/* Volume Up */}
                    <div className="absolute -left-[9px] top-[216px] w-[3px] h-14 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />{" "}
                    {/* Volume Down */}
                    {/* Physical Buttons - Right Side (Power) */}
                    <div className="absolute -right-[9px] top-40 w-[3px] h-24 bg-gradient-to-b from-slate-600 to-slate-800 rounded-r shadow-sm" />
                    {/* Dynamic Island */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[100px] h-8 bg-black rounded-full z-[100] flex items-center justify-end px-4 shadow-xl border border-white/5">
                      <div className="w-2.5 h-2.5 bg-[#080808] rounded-full border border-white/5 flex items-center justify-center">
                        <div className="w-1 h-1 bg-[#1a1a2e] rounded-full opacity-40" />
                      </div>
                    </div>
                    {/* Inner Display Container */}
                    <div
                      className={`w-full ${!bgType ? resolvedTheme.bg : ""} ${resolvedTheme.text} rounded-[3rem] overflow-hidden flex flex-col items-center relative transition-all duration-700 shadow-inner`}
                      style={{
                        minHeight: "640px",
                        maxHeight: "640px",
                        fontFamily: getFontFamilyStyle(fontFamily),
                        ...(resolvedTheme.bgStyle || {}),
                        ...previewBgStyle,
                      }}
                    >
                      {/* Status bar - iOS Style */}
                      <div className="w-full flex justify-between items-center px-10 pt-5 pb-2 text-[10px] sm:text-[11px] font-bold tracking-tight z-50">
                        <span className="opacity-90">
                          {currentTime
                            .toLocaleTimeString("id-ID", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            .replace(".", ":")}
                        </span>
                        <div className="flex gap-1.5 items-center opacity-90">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 21l-12-18h24z" />
                          </svg>
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M2 20h20v-2h-20v2zm0-4h20v-2h-20v2zm0-4h20v-2h-20v2zm0-4h20v-2h-20v2z"
                              opacity=".3"
                            />
                            <path d="M2 20h20v-2h-20v2zm0-4h15v-2h-15v2zm0-4h10v-2h-10v2zm0-4h5v-2h-5v2z" />
                          </svg>
                          <div className="w-6 h-3 border-[1.5px] border-current rounded-[4px] p-[1px] relative">
                            <div className="w-full h-full bg-current rounded-[1px]" />
                            <div className="absolute -right-[3.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-[3px] bg-current rounded-r-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Profile Area */}
                      <div className="flex flex-col items-center mt-12 px-8 w-full animate-in fade-in slide-in-from-top-4 duration-1000">
                        <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center font-bold text-4xl text-slate-900 dark:text-white shadow-2xl border-2 border-white/20 overflow-hidden mb-6 transition-transform hover:scale-105 duration-500">
                          {avatar ? (
                            <img
                              src={avatar}
                              className="w-full h-full object-cover"
                              alt="pfp"
                            />
                          ) : (
                            username?.[0]?.toUpperCase() || "N"
                          )}
                        </div>
                        <h3 className="font-bold text-lg tracking-tight mb-2">
                          @{username || "username"}
                        </h3>
                        {bio && (
                          <p
                            className={`text-[11px] font-medium text-center max-w-[240px] leading-relaxed break-words line-clamp-3 opacity-90 tracking-wide ${resolvedTheme.sub}`}
                          >
                            {bio}
                          </p>
                        )}

                        {/* Preview Socials */}
                        {Object.values(socials).some((val) => val) && (
                          <div className="flex flex-wrap justify-center gap-3 mt-6 mb-2">
                            {[
                              "instagram",
                              "youtube",
                              "tiktok",
                              "facebook",
                              "linkedin",
                              "github",
                              "whatsapp",
                            ].map((soc) => {
                              if (!socials[soc]) return null;
                              return (
                                <div
                                  key={soc}
                                  className="w-10 h-10 rounded-2xl glass dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 transition-transform hover:scale-110"
                                >
                                  <img
                                    src={`https://cdn.simpleicons.org/${soc}/${soc === "github" || soc === "tiktok" ? "white" : soc !== "whatsapp" ? "default" : "25D366"}`}
                                    className="w-5 h-5 object-contain"
                                    style={{
                                      filter: "brightness(1) invert(1)",
                                    }}
                                    alt={soc}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Links Preview */}
                      <div className="mt-10 w-full space-y-5 overflow-y-auto pb-12 px-8 flex-1 no-scrollbar animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        {activeLinks.length === 0 && (
                          <div className="text-center py-16 opacity-30 flex flex-col items-center gap-4">
                            <FontAwesomeIcon
                              icon={faSearch}
                              className="text-3xl"
                            />
                            <p className="text-xs font-bold font-semibold">
                              {language === 'en' ? "You haven't created any links yet" : "Kamu belum bikin link"}
                            </p>
                          </div>
                        )}
                        {(() => {
                          const roots = activeLinks.filter((l) => !l.parentId);

                          return roots.map((root) => {
                            const isHeader = root.type === "header";

                            if (!isHeader) {
                              const l = root;
                              return (
                                <motion.div
                                  layout
                                  key={l.id}
                                  className={`w-full font-bold text-[11px] font-semibold flex transition-all hover:scale-[1.03] active:scale-[0.98] shadow-xl mb-4 ${l.layout === "featured" ? "flex-col p-0 overflow-hidden" : "flex-row items-center justify-center gap-3 p-4"} ${buttonStyle === "outline" ? "border-2" : ""} ${!buttonStyle?.includes("rounded") ? "rounded-2xl" : ""} ${resolvedTheme.item}`}
                                  style={{ ...previewButtonStyle }}
                                >
                                  {l.thumbnail && (
                                    <div
                                      className={
                                        l.layout === "featured"
                                          ? "w-full aspect-[16/9] mb-4"
                                          : ""
                                      }
                                    >
                                      <img
                                        src={l.thumbnail}
                                        className={
                                          l.layout === "featured"
                                            ? "w-full h-full object-cover"
                                            : "w-6 h-6 rounded-xl object-cover flex-shrink-0 shadow-lg"
                                        }
                                        alt=""
                                      />
                                    </div>
                                  )}
                                  <span
                                    className={`truncate px-4 ${l.layout === "featured" ? "w-full text-center pb-5 pt-1 mb-1" : "max-w-[80%]"}`}
                                  >
                                    {l.title}
                                  </span>
                                </motion.div>
                              );
                            } else {
                              const headerLink = root;
                              const children = activeLinks.filter(
                                (child) => child.parentId === headerLink.id,
                              );
                              return (
                                <motion.div
                                  layout
                                  key={headerLink.id}
                                  className="w-full rounded-2xl p-5 mb-6 glass dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden"
                                >
                                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                                  <h3 className="font-bold text-[9px] font-semibold mb-4 px-2 opacity-60">
                                    {headerLink.title}
                                  </h3>
                                  <div
                                    className={
                                      headerLink.layout === "grid"
                                        ? "grid grid-cols-2 gap-4"
                                        : headerLink.layout === "carousel"
                                          ? "flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2 no-scrollbar"
                                          : headerLink.layout === "showcase"
                                            ? "space-y-5"
                                            : "space-y-4"
                                    }
                                  >
                                    {children.map((l) => (
                                      <motion.div
                                        layout
                                        key={l.id}
                                        className={`
 ${
   headerLink.layout === "grid"
     ? "flex-col aspect-square p-3 text-center"
     : headerLink.layout === "carousel"
       ? "min-w-[80%] flex-col py-8 snap-center text-center"
       : headerLink.layout === "showcase"
         ? "flex-col gap-5 py-10 text-center w-full"
         : l.layout === "featured"
           ? "flex-col p-0 w-full overflow-hidden"
           : "w-full p-4 flex-row items-center justify-center gap-3"
 }
 flex transition-all hover:rotate-1 active:scale-[0.98] shadow-2xl font-bold text-xs font-semibold
 ${buttonStyle === "outline" ? "border-2" : ""} 
 ${!buttonStyle?.includes("rounded") ? (headerLink.layout === "stack" || !headerLink.layout ? "rounded-[1.25rem]" : "rounded-3xl") : ""} 
 ${resolvedTheme.item}
 `}
                                        style={{ ...previewButtonStyle }}
                                      >
                                        {l.thumbnail && (
                                          <div
                                            className={
                                              l.layout === "featured" &&
                                              (headerLink.layout === "stack" ||
                                                !headerLink.layout)
                                                ? "w-full aspect-[16/9]"
                                                : ""
                                            }
                                          >
                                            <img
                                              src={l.thumbnail}
                                              className={`
 ${
   headerLink.layout === "grid" || headerLink.layout === "carousel"
     ? "w-12 h-12 mb-2 rounded-2xl"
     : headerLink.layout === "showcase"
       ? "w-20 h-20 rounded-2xl mb-2"
       : l.layout === "featured"
         ? "w-full h-full object-cover"
         : "w-6 h-6 rounded-xl"
 } 
 object-cover flex-shrink-0 border-2 border-white/20 shadow-xl
  `}
                                              alt="icon"
                                            />
                                          </div>
                                        )}
                                        <span
                                          className={`truncate px-2 ${l.layout === "featured" ? "pb-5 pt-3" : ""} ${headerLink.layout === "grid" ? "max-w-[100%] px-1 whitespace-pre-wrap line-clamp-2 leading-tight" : "max-w-[90%]"} ${headerLink.layout !== "stack" && headerLink.layout ? "text-[9px]" : "text-[11px]"}`}
                                        >
                                          {l.title}
                                        </span>
                                      </motion.div>
                                    ))}
                                    {children.length === 0 && (
                                      <p className="text-center text-[9px] font-medium font-semibold opacity-20 py-2 italic col-span-full w-full">
                                        {language === 'en' ? "No content yet" : "Belum ada isi"}
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            }
                          });
                        })()}
                      </div>

                      {/* Footer Logo */}
                      <div
                        className={`absolute bottom-6 px-10 py-3 glass dark:bg-black/20 rounded-full border border-slate-200 dark:border-white/5 text-xs font-bold font-semibold opacity-40 flex items-center gap-3 transition-opacity hover:opacity-100 ${resolvedTheme.sub}`}
                      >
                        <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center text-slate-900 dark:text-white shadow-lg">
                          N
                        </div>
                        NYOO.ME
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile Floating Preview Button */}
        {username && (
          <div className="xl:hidden fixed bottom-6 right-6 z-[99]">
            <button
              onClick={() => setShowMobilePreview(true)}
              className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(124,58,237,0.4)] active:scale-95 transition-all border border-white/20 cursor-pointer"
            >
              <FontAwesomeIcon icon={faEye} className="text-sm" />
              <span>Preview</span>
            </button>
          </div>
        )}

        {/* Mobile Live Preview Modal */}
        <AnimatePresence>
          {showMobilePreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="xl:hidden fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4"
            >
              {/* Tap backdrop to close */}
              <div 
                className="absolute inset-0 z-0" 
                onClick={() => setShowMobilePreview(false)}
              />
              
              <motion.div
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white/10 dark:bg-slate-955/40 border border-white/10 dark:border-white/5 rounded-[3rem] p-6 max-w-sm w-full relative z-10 flex flex-col items-center justify-center shadow-2xl backdrop-blur-2xl"
              >
                {/* Tutup Button */}
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all z-[110] shadow-lg border border-white/10 cursor-pointer active:scale-95"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-sm" />
                </button>

                <div className="w-full text-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 bg-white/10 px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
                    📱 {language === "en" ? "Live Preview" : "Pratinjau Langsung"}
                  </span>
                </div>

                {/* Phone Frame - Premium iPhone 15 Pro Look */}
                <div className="w-full max-w-[320px] scale-95 origin-center">
                  <div className="bg-[#1e1e24] dark:bg-[#0a0a0c] rounded-[3.5rem] p-1.5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border-[1.5px] border-slate-600/30 relative ring-[6px] ring-slate-800/90 shadow-2xl transition-all duration-700">
                    {/* Physical Buttons - Left Side (Action + Volume) */}
                    <div className="absolute -left-[9px] top-28 w-[3px] h-8 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />
                    <div className="absolute -left-[9px] top-[148px] w-[3px] h-14 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />
                    <div className="absolute -left-[9px] top-[216px] w-[3px] h-14 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />
                    {/* Physical Buttons - Right Side (Power) */}
                    <div className="absolute -right-[9px] top-40 w-[3px] h-24 bg-gradient-to-b from-slate-600 to-slate-800 rounded-r shadow-sm" />
                    
                    {/* Dynamic Island */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[100px] h-8 bg-black rounded-full z-[100] flex items-center justify-end px-4 shadow-xl border border-white/5">
                      <div className="w-2.5 h-2.5 bg-[#080808] rounded-full border border-white/5 flex items-center justify-center">
                        <div className="w-1 h-1 bg-[#1a1a2e] rounded-full opacity-40" />
                      </div>
                    </div>

                    {/* Inner Display Container */}
                    <div
                      className={`w-full ${!bgType ? resolvedTheme.bg : ""} ${resolvedTheme.text} rounded-[3rem] overflow-hidden flex flex-col items-center relative transition-all duration-700 shadow-inner`}
                      style={{
                        minHeight: "560px",
                        maxHeight: "560px",
                        fontFamily: getFontFamilyStyle(fontFamily),
                        ...(resolvedTheme.bgStyle || {}),
                        ...previewBgStyle,
                      }}
                    >
                      {/* Status bar - iOS Style */}
                      <div className="w-full flex justify-between items-center px-10 pt-5 pb-2 text-[10px] font-bold tracking-tight z-50">
                        <span className="opacity-90">
                          {currentTime
                            .toLocaleTimeString("id-ID", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            .replace(".", ":")}
                        </span>
                        <div className="flex gap-1.5 items-center opacity-90">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21l-12-18h24z" />
                          </svg>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2 20h20v-2h-20v2zm0-4h20v-2h-20v2zm0-4h20v-2h-20v2zm0-4h20v-2h-20v2z" opacity=".3" />
                            <path d="M2 20h20v-2h-15v2z" />
                          </svg>
                          <div className="w-6 h-3 border-[1.5px] border-current rounded-[4px] p-[1px] relative">
                            <div className="w-full h-full bg-current rounded-[1px]" />
                            <div className="absolute -right-[3.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-[3px] bg-current rounded-r-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Profile Area */}
                      <div className="flex flex-col items-center mt-8 px-8 w-full">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center font-bold text-3xl text-slate-900 dark:text-white shadow-2xl border-2 border-white/20 overflow-hidden mb-4">
                          {avatar ? (
                            <img src={avatar} className="w-full h-full object-cover" alt="pfp" />
                          ) : (
                            username?.[0]?.toUpperCase() || "N"
                          )}
                        </div>
                        <h3 className="font-bold text-base tracking-tight mb-1">
                          @{username || "username"}
                        </h3>
                        {bio && (
                          <p className={`text-[10px] font-medium text-center max-w-[200px] leading-relaxed break-words line-clamp-2 opacity-90 tracking-wide ${resolvedTheme.sub}`}>
                            {bio}
                          </p>
                        )}

                        {/* Preview Socials */}
                        {Object.values(socials).some((val) => val) && (
                          <div className="flex flex-wrap justify-center gap-2 mt-4 mb-1">
                            {[
                              "instagram",
                              "youtube",
                              "tiktok",
                              "facebook",
                              "linkedin",
                              "github",
                              "whatsapp",
                            ].map((soc) => {
                              if (!socials[soc]) return null;
                              return (
                                <div key={soc} className="w-8 h-8 rounded-xl glass dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                  <img
                                    src={`https://cdn.simpleicons.org/${soc}/${soc === "github" || soc === "tiktok" ? "white" : soc !== "whatsapp" ? "default" : "25D366"}`}
                                    className="w-4 h-4 object-contain"
                                    style={{ filter: "brightness(1) invert(1)" }}
                                    alt={soc}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Links Preview */}
                      <div className="mt-6 w-full space-y-4 overflow-y-auto pb-8 px-8 flex-1 no-scrollbar">
                        {activeLinks.length === 0 && (
                          <div className="text-center py-10 opacity-30 flex flex-col items-center gap-2">
                            <FontAwesomeIcon icon={faSearch} className="text-2xl" />
                            <p className="text-[10px] font-bold">
                              {language === 'en' ? "You haven't created any links yet" : "Kamu belum bikin link"}
                            </p>
                          </div>
                        )}
                        {(() => {
                          const roots = activeLinks.filter((l) => !l.parentId);

                          return roots.map((root) => {
                            const isHeader = root.type === "header";

                            if (!isHeader) {
                              const l = root;
                              return (
                                <div
                                  key={l.id}
                                  className={`w-full font-bold text-[10px] flex shadow-xl mb-3 ${l.layout === "featured" ? "flex-col p-0 overflow-hidden" : "flex-row items-center justify-center gap-2.5 p-3"} ${buttonStyle === "outline" ? "border-2" : ""} ${!buttonStyle?.includes("rounded") ? "rounded-2xl" : ""} ${resolvedTheme.item}`}
                                  style={{ ...previewButtonStyle }}
                                >
                                  {l.thumbnail && (
                                    <div className={l.layout === "featured" ? "w-full aspect-[16/9] mb-2" : ""}>
                                      <img
                                        src={l.thumbnail}
                                        className={l.layout === "featured" ? "w-full h-full object-cover" : "w-5 h-5 rounded-lg object-cover"}
                                        alt="icon"
                                      />
                                    </div>
                                  )}
                                  <span className="truncate px-1">{l.title}</span>
                                </div>
                              );
                            } else {
                              const headerLink = root;
                              const children = activeLinks.filter((l) => l.parentId === headerLink.id);
                              return (
                                <div key={headerLink.id} className="w-full mb-5 text-center">
                                  <h4 className={`text-xs font-black tracking-wider uppercase mb-3 ${resolvedTheme.text}`}>
                                    {headerLink.title}
                                  </h4>
                                  <div className={
                                    headerLink.layout === "grid"
                                      ? "grid grid-cols-2 gap-3 w-full"
                                      : headerLink.layout === "carousel"
                                        ? "flex gap-3 overflow-x-auto no-scrollbar w-full pb-2"
                                        : "flex flex-col gap-3 w-full"
                                  }>
                                    {children.map((l) => (
                                      <div
                                        key={l.id}
                                        className={`
                                          ${
                                            headerLink.layout === "grid"
                                              ? "flex-col gap-2.5 py-4 text-center w-full"
                                              : headerLink.layout === "carousel"
                                                ? "flex-col gap-2.5 py-4 text-center min-w-[110px] max-w-[110px] shrink-0"
                                                : headerLink.layout === "showcase"
                                                  ? "flex-col gap-4 py-8 text-center w-full"
                                                  : l.layout === "featured"
                                                    ? "flex-col p-0 w-full overflow-hidden"
                                                    : "w-full p-3 flex-row items-center justify-center gap-2.5"
                                          }
                                          flex shadow-2xl font-bold text-[10px]
                                          ${buttonStyle === "outline" ? "border-2" : ""}
                                          ${!buttonStyle?.includes("rounded") ? (headerLink.layout === "stack" || !headerLink.layout ? "rounded-[1.25rem]" : "rounded-3xl") : ""}
                                          ${resolvedTheme.item}
                                        `}
                                        style={{ ...previewButtonStyle }}
                                      >
                                        {l.thumbnail && (
                                          <div className={
                                            l.layout === "featured" && (headerLink.layout === "stack" || !headerLink.layout)
                                              ? "w-full aspect-[16/9]"
                                              : ""
                                          }>
                                            <img
                                              src={l.thumbnail}
                                              className={`
                                                ${
                                                  headerLink.layout === "grid" || headerLink.layout === "carousel"
                                                    ? "w-10 h-10 mb-1 rounded-xl"
                                                    : headerLink.layout === "showcase"
                                                      ? "w-16 h-16 rounded-xl mb-1"
                                                      : l.layout === "featured"
                                                        ? "w-full h-full object-cover"
                                                        : "w-5 h-5 rounded-lg"
                                                }
                                                object-cover flex-shrink-0 border border-white/10 shadow-lg
                                              `}
                                              alt="icon"
                                            />
                                          </div>
                                        )}
                                        <span className="truncate px-1">{l.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          });
                        })()}
                      </div>

                      {/* Footer Logo */}
                      <div className={`absolute bottom-4 px-6 py-2 glass dark:bg-black/20 rounded-full border border-slate-200/50 dark:border-white/5 text-[9px] font-bold opacity-40 flex items-center gap-2 ${resolvedTheme.sub}`}>
                        <div className="w-4 h-4 bg-violet-600 rounded flex items-center justify-center text-white">N</div>
                        NYOO.ME
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== MODALS ========== */}
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-2xl flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-sm max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)]"
              >
                <div className="p-8 sm:p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-red-500/20">
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {language === 'en' ? "Delete Link?" : "Hapus Tautan?"}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                      {language === 'en' ? "Are you sure you want to delete this? Deleted data cannot be recovered." : "Apa kamu yakin ingin menghapus ini? Data yang terhapus tidak bisa dikembalikan."}
                    </p>
                  </div>
                </div>
                <div className="flex border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-6 px-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all outline-none"
                  >
                    {language === 'en' ? "Cancel" : "Batal"}
                  </button>
                  <button
                    onClick={confirmDeleteLink}
                    className="flex-1 py-6 px-4 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all outline-none border-l border-slate-100 dark:border-white/5"
                  >
                    {language === 'en' ? "Delete Data" : "Hapus Tautan"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Image Crop Modal */}
        <AnimatePresence>
          {imageSrc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="glass dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]"
              >
                <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white/5">
                  <div>
                    <h3 className="font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
                      {language === 'en' ? "Crop Image" : "Atur Posisi Gambar"}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 font-semibold mt-1">
                      {language === 'en' ? "Drag and zoom the image to fit." : "Geser dan zoom gambar biar pas."}
                    </p>
                  </div>
                  <button
                    onClick={() => setImageSrc(null)}
                    className="w-12 h-12 flex items-center justify-center glass dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-90"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className="flex-1 relative bg-slate-50 dark:bg-black/20 shadow-inner">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={cropAspect}
                    cropShape={selectedCropShape}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="p-8 border-t border-slate-200 dark:border-white/5 space-y-8 bg-white/5">
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 w-full">
                      <div className="px-5 py-3 glass dark:bg-black/20 rounded-xl text-xs font-bold text-slate-400 font-semibold whitespace-nowrap">
                        Zoom
                      </div>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-violet-600 h-2 rounded-full cursor-pointer"
                      />
                    </div>

                    {cropType !== "avatar" && (
                      <div className="flex flex-wrap gap-3 items-center justify-center p-2 glass dark:bg-black/20 rounded-[1.5rem] border border-slate-200 dark:border-white/5">
                        {[
                          {
                            id: "round",
                            label: "Orbital",
                            aspect: 1,
                            shape: "round",
                          },
                          {
                            id: "rect-1",
                            label: "Kotak",
                            aspect: 1,
                            shape: "rect",
                          },
                          {
                            id: "rect-169",
                            label: "Lebar",
                            aspect: 16 / 9,
                            shape: "rect",
                          },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSelectedCropShape(opt.shape as any);
                              setCropAspect(opt.aspect);
                            }}
                            className={`flex-1 min-w-[100px] px-6 py-3 text-xs font-bold font-semibold rounded-xl transition-all ${selectedCropShape === opt.shape && cropAspect === opt.aspect ? "bg-violet-600 text-slate-900 dark:text-white shadow-xl shadow-violet-600/20" : "text-slate-400 hover:text-slate-900 dark:text-white"}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setImageSrc(null)}
                      className="flex-1 py-5 glass border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-xs font-semibold rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95"
                    >
                      {language === 'en' ? "Cancel" : "Batal"}
                    </button>
                    <button
                      onClick={handleCropAndUpload}
                      className="flex-1 py-5 bg-violet-600 hover:bg-violet-500 text-slate-900 dark:text-white font-bold text-xs font-semibold rounded-2xl transition-all shadow-2xl shadow-violet-600/30 border-2 border-white/20 active:scale-95"
                    >
                      {language === 'en' ? "Use Image" : "Pakai Gambar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>{" "}
        {/* Improved Toast Notification */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="fixed bottom-10 right-10 z-[9999] flex items-center gap-4 bg-slate-900/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[300px]"
            >
              <div
                className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl shadow-lg border ${notification.type === "success" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-500 border-red-500/30"}`}
              >
                <FontAwesomeIcon
                  icon={notification.type === "success" ? faCheck : faTimes}
                />
              </div>
              <div className="flex-1 pr-4">
                <h3 className="font-black text-[11px] uppercase tracking-wider text-white/50 mb-0.5">
                  {notification.title}
                </h3>
                <p className="text-xs font-bold text-white leading-snug">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() =>
                  setNotification({ ...notification, show: false })
                }
                className="p-2 text-white/20 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* ========== UNIFIED FLOATING SAVE BUTTON ========== */}
        <AnimatePresence>
          {(hasChanges || savingProfile) && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="hidden lg:flex fixed bottom-10 inset-x-0 z-[100] justify-center px-6 pointer-events-none"
            >
              <button
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="pointer-events-auto w-full max-w-xs flex items-center justify-center gap-3 py-4 px-8 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(124,58,237,0.4)] border-2 border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {savingProfile ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    <span>{language === 'en' ? "Save Changes" : "Simpan Perubahan"}</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Floating Mobile Preview Button */}
        <div className="lg:hidden fixed bottom-24 right-6 z-[160]">
          <button
            onClick={() => setShowMobilePreview(true)}
            className="w-14 h-14 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(124,58,237,0.4)] border-2 border-white/20 active:scale-95 transition-all cursor-pointer"
            title={language === 'en' ? "Live Preview" : "Tinjau Live"}
          >
            <FontAwesomeIcon icon={faEye} className="text-xl" />
          </button>
        </div>

        {/* Mobile Preview Modal */}
        <AnimatePresence>
          {showMobilePreview && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobilePreview(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-[320px] sm:max-w-[340px] relative z-10 flex flex-col items-center"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className="absolute -top-12 right-2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center border border-white/10 transition-all active:scale-90 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>

                {/* Phone Mockup Content */}
                <div className="bg-[#1e1e24] dark:bg-[#0a0a0c] rounded-[3.5rem] p-1.5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border-[1.5px] border-slate-600/30 relative ring-[6px] ring-slate-800/90 shadow-2xl transition-all duration-700 w-full">
                  {/* Physical Buttons - Left Side */}
                  <div className="absolute -left-[9px] top-28 w-[3px] h-8 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />
                  <div className="absolute -left-[9px] top-[148px] w-[3px] h-14 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />
                  <div className="absolute -left-[9px] top-[216px] w-[3px] h-14 bg-gradient-to-b from-slate-600 to-slate-800 rounded-l shadow-sm" />
                  {/* Physical Buttons - Right Side */}
                  <div className="absolute -right-[9px] top-40 w-[3px] h-24 bg-gradient-to-b from-slate-600 to-slate-800 rounded-r shadow-sm" />
                  {/* Dynamic Island */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[100px] h-8 bg-black rounded-full z-[100] flex items-center justify-end px-4 shadow-xl border border-white/5">
                    <div className="w-2.5 h-2.5 bg-[#080808] rounded-full border border-white/5 flex items-center justify-center">
                      <div className="w-1 h-1 bg-[#1a1a2e] rounded-full opacity-40" />
                    </div>
                  </div>
                  
                  {/* Inner Display Container */}
                  <div
                    className={`w-full ${!bgType ? resolvedTheme.bg : ""} ${resolvedTheme.text} rounded-[3rem] overflow-hidden flex flex-col items-center relative transition-all duration-700 shadow-inner`}
                    style={{
                      minHeight: "560px",
                      maxHeight: "560px",
                      fontFamily: getFontFamilyStyle(fontFamily),
                      ...(resolvedTheme.bgStyle || {}),
                      ...previewBgStyle,
                    }}
                  >
                    {/* Status bar - iOS Style */}
                    <div className="w-full flex justify-between items-center px-10 pt-5 pb-2 text-[10px] sm:text-[11px] font-bold tracking-tight z-50">
                      <span className="opacity-90">
                        {currentTime
                          .toLocaleTimeString("id-ID", {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          .replace(".", ":")}
                      </span>
                      <div className="flex gap-1.5 items-center opacity-90">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21l-12-18h24z" />
                        </svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2 20h20v-2h-20v2zm0-4h20v-2h-20v2zm0-4h20v-2h-20v2zm0-4h20v-2h-20v2z" opacity=".3" />
                          <path d="M2 20h20v-2h-20v2zm0-4h15v-2h-15v2zm0-4h10v-2h-10v2zm0-4h5v-2h-5v2z" />
                        </svg>
                        <div className="w-6 h-3 border-[1.5px] border-current rounded-[4px] p-[1px] relative">
                          <div className="w-full h-full bg-current rounded-[1px]" />
                          <div className="absolute -right-[3.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-[3px] bg-current rounded-r-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Profile Area */}
                    <div className="flex flex-col items-center mt-8 px-8 w-full">
                      <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center font-bold text-3xl text-white shadow-xl border-2 border-white/20 overflow-hidden mb-4">
                        {avatar ? (
                          <img src={avatar} className="w-full h-full object-cover" alt="pfp" />
                        ) : (
                          username?.[0]?.toUpperCase() || "N"
                        )}
                      </div>
                      <h3 className="font-bold text-base tracking-tight mb-1">
                        @{username || "username"}
                      </h3>
                      {bio && (
                        <p className={`text-[10px] font-medium text-center max-w-[220px] leading-relaxed break-words line-clamp-2 opacity-90 tracking-wide ${resolvedTheme.sub}`}>
                          {bio}
                        </p>
                      )}

                      {/* Preview Socials */}
                      {Object.values(socials).some((val) => val) && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4 mb-1">
                          {[
                            "instagram",
                            "youtube",
                            "tiktok",
                            "facebook",
                            "linkedin",
                            "github",
                            "whatsapp",
                          ].map((soc) => {
                            if (!socials[soc]) return null;
                            return (
                              <div key={soc} className="w-8 h-8 rounded-xl glass dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                <img
                                  src={`https://cdn.simpleicons.org/${soc}/${soc === "github" || soc === "tiktok" ? "white" : soc !== "whatsapp" ? "default" : "25D366"}`}
                                  className="w-4 h-4 object-contain"
                                  style={{ filter: "brightness(1) invert(1)" }}
                                  alt={soc}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Links Preview */}
                    <div className="mt-6 w-full space-y-4 overflow-y-auto pb-8 px-8 flex-1 no-scrollbar">
                      {activeLinks.length === 0 && (
                        <div className="text-center py-10 opacity-30 flex flex-col items-center gap-3">
                          <FontAwesomeIcon icon={faSearch} className="text-2xl" />
                          <p className="text-[10px] font-bold">
                            {language === 'en' ? "You haven't created any links yet" : "Kamu belum bikin link"}
                          </p>
                        </div>
                      )}
                      {(() => {
                        const roots = activeLinks.filter((l) => !l.parentId);
                        return roots.map((root) => {
                          const isHeader = root.type === "header";
                          if (!isHeader) {
                            const l = root;
                            return (
                              <div
                                key={l.id}
                                className={`w-full font-bold text-[10px] flex items-center justify-center gap-2 p-3 ${buttonStyle === "outline" ? "border-2" : ""} ${!buttonStyle?.includes("rounded") ? "rounded-xl" : ""} ${resolvedTheme.item}`}
                                style={{ ...previewButtonStyle }}
                              >
                                {l.thumbnail && (
                                  <img src={l.thumbnail} className="w-5 h-5 rounded-lg object-cover flex-shrink-0 shadow-md" alt="" />
                                )}
                                <span className="truncate max-w-[80%]">{l.title}</span>
                              </div>
                            );
                          } else {
                            const headerLink = root;
                            const children = activeLinks.filter((child) => child.parentId === headerLink.id);
                            return (
                              <div key={headerLink.id} className="w-full rounded-xl p-4 mb-4 glass dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden">
                                <h3 className="font-bold text-[8px] mb-3 opacity-60">{headerLink.title}</h3>
                                <div className="space-y-3">
                                  {children.map((l) => (
                                    <div
                                      key={l.id}
                                      className={`w-full p-3 flex items-center justify-center gap-2 font-bold text-[9px] ${buttonStyle === "outline" ? "border-2" : ""} ${!buttonStyle?.includes("rounded") ? "rounded-xl" : ""} ${resolvedTheme.item}`}
                                      style={{ ...previewButtonStyle }}
                                    >
                                      {l.thumbnail && (
                                        <img src={l.thumbnail} className="w-5 h-5 rounded-lg object-cover flex-shrink-0 shadow-md" alt="" />
                                      )}
                                      <span className="truncate max-w-[90%]">{l.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========== MOBILE BOTTOM TAB BAR ========== */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-[150] flex items-center justify-around px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
          style={{
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {[
            { id: "links", label: t("biolink.tab.links"), icon: faLink },
            { id: "profile", label: t("biolink.tab.profile"), icon: faUser },
            { id: "design", label: t("biolink.tab.design"), icon: faPaintBrush },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as "links" | "profile" | "design");
                setIsSheetExpanded(true);
              }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/40 scale-105"
                    : "bg-transparent"
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="text-base" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* DragOverlay rendered at the root page level (completely outside transformed elements) */}
      <DragOverlay
        adjustScale={false}
        dropAnimation={{ duration: 200, easing: "ease-out" }}
        zIndex={9999}
      >
        {activeDragId && activeDragLink ? (
          <div
            className="shadow-2xl cursor-grabbing ring-2 ring-violet-500 rounded-2xl bg-white dark:bg-slate-800"
            style={{ width: draggedWidth ? `${draggedWidth}px` : "auto" }}
          >
            <LinkCardContent
              l={activeDragLink}
              isDragging={false}
              isChild={false}
              editingLinkId={null}
              listeners={undefined}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
