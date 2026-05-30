// components/GoogleSignInButton.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";

interface GoogleSignInButtonProps {
  mode?: "login" | "signup" | "link";
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
          revoke: (email: string, done: () => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function GoogleSignInButton({
  mode = "login",
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/google-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential, mode }),
        });

        const data = await res.json();
        if (!res.ok) {
          onError?.(data.error || "Gagal masuk dengan Google");
          setLoading(false);
          return;
        }

        if (mode === "link") {
          onSuccess?.();
          setLoading(false);
          return;
        }

        // Hard redirect so Next.js re-fetches everything with the new session cookie.
        // router.push + router.refresh alone can leave the page blank because the
        // router cache doesn't pick up the Set-Cookie header reliably.
        window.location.href = "/manage";
      } catch (e) {
        console.error("GSI callback error:", e);
        onError?.("Terjadi kesalahan. Coba lagi nanti.");
        setLoading(false);
      }
    },
    [mode, onSuccess, onError, router]
  );

  // Initialize and Render official Google Button
  const initAndRender = useCallback(() => {
    if (!window.google?.accounts?.id || !containerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        ux_mode: "popup",
        context: mode === "signup" ? "signup" : "signin",
      });

      // Clear container before rendering
      containerRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: theme === "dark" ? "filled_black" : "outline",
        size: "large",
        shape: "rectangular",
        width: mode === "link" ? 240 : 320,
        text: mode === "signup" ? "signup_with" : (mode === "link" ? "continue_with" : "signin_with"),
        logo_alignment: "left",
      });
    } catch (e) {
      console.error("Error rendering GSI button:", e);
    }
  }, [theme, mode, handleCredentialResponse]);

  // Load GSI script and render button
  useEffect(() => {
    const scriptId = "gsi-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const handleScriptLoad = () => {
      initAndRender();
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = handleScriptLoad;
      document.body.appendChild(script);
    } else {
      if (window.google?.accounts?.id) {
        initAndRender();
      } else {
        script.addEventListener("load", handleScriptLoad);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener("load", handleScriptLoad);
      }
    };
  }, [initAndRender]);

  // Re-render button if theme changes
  useEffect(() => {
    if (window.google?.accounts?.id) {
      initAndRender();
    }
  }, [theme, initAndRender]);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 py-1">
      {loading && (
        <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 animate-pulse">
          <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
          <span>Memproses masuk Google...</span>
        </div>
      )}
      <div 
        ref={containerRef} 
        id={mode === "signup" ? "google-signup-btn-container" : "google-login-btn-container"}
        className="min-h-[44px] flex items-center justify-center w-full"
      />
    </div>
  );
}
