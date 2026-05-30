// Shared theme definitions used by dashboard, preview, and public biolink page.
import type React from "react";

export interface ThemeConfig {
  id: string;
  name: string;
  bg: string;
  bgStyle?: React.CSSProperties;
  text: string;
  item: string;
  sub: string;
  previewBg: string;          // small preview swatch for the design selector
}

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: "default",
    name: "Midnight Dark",
    bg: "bg-[#0f0f23]",
    text: "text-white",
    item: "bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.08]",
    sub: "text-slate-400",
    previewBg: "linear-gradient(135deg, #0f0f23, #1a1a3e)",
  },
  {
    id: "light",
    name: "Clean White",
    bg: "bg-[#f5f5f5]",
    text: "text-gray-900",
    item: "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm",
    sub: "text-gray-500",
    previewBg: "linear-gradient(135deg, #f5f5f5, #e8e8e8)",
  },
  {
    id: "violet",
    name: "Electric Violet",
    bg: "bg-gradient-to-br from-[#2d1054] to-[#0f0f23]",
    text: "text-white",
    item: "bg-violet-500/10 hover:bg-violet-500/20 text-white border border-violet-400/15",
    sub: "text-violet-300/60",
    previewBg: "linear-gradient(135deg, #5b21b6, #2d1054)",
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    bg: "bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#e11d48]",
    text: "text-white",
    item: "bg-white/15 hover:bg-white/25 text-white border border-white/10 backdrop-blur-md",
    sub: "text-white/70",
    previewBg: "linear-gradient(135deg, #f97316, #ec4899, #e11d48)",
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    bg: "bg-gradient-to-br from-[#06b6d4] via-[#3b82f6] to-[#4f46e5]",
    text: "text-white",
    item: "bg-white/12 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md",
    sub: "text-white/70",
    previewBg: "linear-gradient(135deg, #06b6d4, #3b82f6, #4f46e5)",
  },
  {
    id: "carbon",
    name: "Carbon Glossy",
    bg: "bg-gradient-to-br from-[#1a1a1a] via-[#111] to-black",
    text: "text-white",
    item: "bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06]",
    sub: "text-slate-500",
    previewBg: "linear-gradient(135deg, #333, #111, #000)",
  },
  {
    id: "forest",
    name: "Forest Green",
    bg: "bg-gradient-to-br from-[#065f46] via-[#064e3b] to-[#022c22]",
    text: "text-white",
    item: "bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-400/15",
    sub: "text-emerald-300/60",
    previewBg: "linear-gradient(135deg, #059669, #064e3b)",
  },
  {
    id: "rose",
    name: "Rose Quartz",
    bg: "bg-gradient-to-br from-[#fce7f3] via-[#fbcfe8] to-[#f9a8d4]",
    text: "text-pink-900",
    item: "bg-white/60 hover:bg-white/80 text-pink-900 border border-pink-200 shadow-sm",
    sub: "text-pink-700/60",
    previewBg: "linear-gradient(135deg, #fce7f3, #fbcfe8, #f9a8d4)",
  },
  {
    id: "aurora",
    name: "Aurora Borealis",
    bg: "bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#065f46]",
    text: "text-white",
    item: "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.08] backdrop-blur-sm",
    sub: "text-cyan-300/50",
    previewBg: "linear-gradient(135deg, #0f172a, #1e3a5f, #065f46)",
  },
  {
    id: "lavender",
    name: "Lavender Dream",
    bg: "bg-gradient-to-br from-[#ede9fe] via-[#ddd6fe] to-[#c4b5fd]",
    text: "text-violet-900",
    item: "bg-white/70 hover:bg-white/90 text-violet-900 border border-violet-200 shadow-sm",
    sub: "text-violet-600/60",
    previewBg: "linear-gradient(135deg, #ede9fe, #ddd6fe, #c4b5fd)",
  },
  {
    id: "midnight_blue",
    name: "Midnight Blue",
    bg: "bg-gradient-to-br from-[#0c1445] via-[#1e1b4b] to-[#312e81]",
    text: "text-white",
    item: "bg-indigo-500/10 hover:bg-indigo-500/18 text-white border border-indigo-400/12",
    sub: "text-indigo-300/50",
    previewBg: "linear-gradient(135deg, #0c1445, #312e81)",
  },
  {
    id: "warm_sand",
    name: "Warm Sand",
    bg: "bg-gradient-to-br from-[#fef3c7] via-[#fde68a] to-[#fbbf24]",
    text: "text-amber-900",
    item: "bg-white/60 hover:bg-white/80 text-amber-900 border border-amber-200 shadow-sm",
    sub: "text-amber-700/60",
    previewBg: "linear-gradient(135deg, #fef3c7, #fde68a, #fbbf24)",
  },
];

export interface DesignConfig {
  buttonShape?: string;
  buttonStyle?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonBorderColor?: string;
  buttonBorderWidth?: number;
  profileBorderRadius?: string;
  profileBorderColor?: string;
  profileBorderWidth?: number;
  bgType?: string;
  bgValue?: string;
  fontFamily?: string;
}

/**
 * Membantu meresolve style statis/dinamis dari profil
 */
export function resolveDesignStyle(configStr: string | null | undefined) {
  const styles: {
    bgStyle: React.CSSProperties;
    buttonStyle: React.CSSProperties;
    profileStyle: React.CSSProperties;
    bgType: string;
    bgValue: string;
    fontFamily: string;
  } = {
    bgStyle: {},
    buttonStyle: {},
    profileStyle: {},
    bgType: '',
    bgValue: '',
    fontFamily: 'sans'
  };

  if (!configStr) return styles;

  try {
    const config: DesignConfig = JSON.parse(configStr);

    if (config.fontFamily) {
      styles.fontFamily = config.fontFamily;
    }

    // 1. Background
    if (config.bgType && config.bgType !== '' && config.bgValue) {
      styles.bgType = config.bgType;
      styles.bgValue = config.bgValue;
      if (['image', 'gif'].includes(config.bgType)) {
        styles.bgStyle = {
          backgroundImage: `url(${config.bgValue})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      } else if (config.bgType === 'gradient') {
        styles.bgStyle = { background: config.bgValue };
      } else if (config.bgType === 'color') {
        styles.bgStyle = { backgroundColor: config.bgValue };
      }
    }

    // 2. Button
    if (config.buttonStyle && config.buttonStyle !== '') {
      if (config.buttonBgColor) styles.buttonStyle.backgroundColor = config.buttonBgColor;
      if (config.buttonTextColor) styles.buttonStyle.color = config.buttonTextColor;
      if (config.buttonBorderColor) styles.buttonStyle.borderColor = config.buttonBorderColor;
      if (config.buttonBorderWidth !== undefined) styles.buttonStyle.borderWidth = `${config.buttonBorderWidth}px`;
      
      if (config.buttonStyle === 'outline') {
        styles.buttonStyle.backgroundColor = 'transparent';
        styles.buttonStyle.borderStyle = 'solid';
      } else if (config.buttonStyle === 'transparent') {
        styles.buttonStyle.backgroundColor = 'transparent';
        styles.buttonStyle.borderColor = 'transparent';
      } else if (config.buttonStyle === 'solid') {
        styles.buttonStyle.borderStyle = 'solid';
      }
    }

    if (config.buttonShape && config.buttonShape !== '') {
       const map: Record<string, string> = {
         'rounded': '4px',
         'rounded-xl': '12px',
         'rounded-2xl': '16px',
         'rounded-none': '0px',
         'rounded-full': '9999px',
       };
       if (map[config.buttonShape]) {
         styles.buttonStyle.borderRadius = map[config.buttonShape];
       }
    }

    // 3. Profile
    if (config.profileBorderColor) styles.profileStyle.borderColor = config.profileBorderColor;
    if (config.profileBorderWidth !== undefined) styles.profileStyle.borderWidth = `${config.profileBorderWidth}px`;
    if (config.profileBorderColor || config.profileBorderWidth) styles.profileStyle.borderStyle = 'solid';
    if (config.profileBorderRadius) {
       const map = {
         'circle': '9999px',
         'squircle': '24px',
         'square': '8px',
         'none': '0px'
       };
       styles.profileStyle.borderRadius = (map as any)[config.profileBorderRadius] || '9999px';
    }

  } catch (e) {
    console.error("Failed to parse design config:", e);
  }

  return styles;
}

/**
 * Parse a theme string (preset ID or custom:color1,color2,textMode)
 * and return full theme config.
 */
export function resolveTheme(themeStr: string): ThemeConfig & { isCustom: boolean; color1?: string; color2?: string; textMode?: string } {
  if (themeStr.startsWith("custom:")) {
    const parts = themeStr.replace("custom:", "").split(",");
    const color1 = parts[0] || "#667eea";
    const color2 = parts[1] || "#764ba2";
    const textMode = parts[2] || "light"; // light = white text, dark = dark text
    const isLightText = textMode === "light";

    return {
      id: "custom",
      name: "Custom",
      isCustom: true,
      color1,
      color2,
      textMode,
      bg: "",
      bgStyle: { background: `linear-gradient(135deg, ${color1}, ${color2})` },
      text: isLightText ? "text-white" : "text-gray-900",
      item: isLightText
        ? "bg-white/12 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md"
        : "bg-black/[0.04] hover:bg-black/[0.08] text-gray-900 border border-black/[0.08]",
      sub: isLightText ? "text-white/60" : "text-gray-600",
      previewBg: `linear-gradient(135deg, ${color1}, ${color2})`,
    };
  }

  const preset = PRESET_THEMES.find((t) => t.id === themeStr) || PRESET_THEMES[0];
  return { ...preset, isCustom: false };
}

/**
 * Encode a custom gradient as a theme string for storage
 */
export function encodeCustomTheme(color1: string, color2: string, textMode: "light" | "dark"): string {
  return `custom:${color1},${color2},${textMode}`;
}
