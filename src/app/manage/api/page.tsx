"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faKey,
  faCopy,
  faEye,
  faEyeSlash,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faClock,
  faTerminal,
  faPaperPlane,
  faBookOpen,
  faSync,
  faTimes,
  faCheck,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// PrismJS Syntax Highlighting
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";

interface DeveloperProfile {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "NONE";
  purpose: string;
  projectProof: string | null;
  rejectionReason: string | null;
  apiKey: string | null;
  apiHitsCurrent: number;
  playgroundHitsCurrent: number;
  apiHitsLimit: number;
  lastReset: string;
  createdAt: string;
}

export default function DeveloperApiPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { language } = useLanguage();
  const isId = language === "id";

  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Apply Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [projectProof, setProjectProof] = useState("");
  const [submittingApply, setSubmittingApply] = useState(false);

  // Key state
  const [showApiKey, setShowApiKey] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Interactive sandbox states
  const [activeSandboxTab, setActiveSandboxTab] = useState<"curl" | "js" | "python">("curl");
  const [activeCategory, setActiveCategory] = useState<"shortlink" | "qrcode">("shortlink");
  const [activeOperation, setActiveOperation] = useState<"create" | "list" | "detail" | "update" | "delete">("create");

  // Playground & Try It Out states
  const [sandboxRightTab, setSandboxRightTab] = useState<"snippets" | "playground">("snippets");
  const [playgroundInputs, setPlaygroundInputs] = useState<Record<string, any>>({});
  const [playgroundResponse, setPlaygroundResponse] = useState<{ status: number; statusText: string; data: any } | null>(null);
  const [executingRequest, setExecutingRequest] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<"params" | "response">("params");

  // Helper to parse syntax coloring with PrismJS
  const getHighlightedCode = (code: string, lang: string) => {
    try {
      let grammar: Prism.Grammar | undefined;
      if (lang === "javascript" || lang === "js") {
        grammar = Prism.languages.javascript;
      } else if (lang === "python") {
        grammar = Prism.languages.python;
      } else if (lang === "bash" || lang === "curl") {
        grammar = Prism.languages.bash;
      } else if (lang === "json") {
        grammar = Prism.languages.json;
      }

      if (grammar) {
        return Prism.highlight(code, grammar, lang);
      }
    } catch (e) {
      console.error("Prism highlight error:", e);
    }
    return code;
  };

  // Reset inputs and response on endpoint changes
  useEffect(() => {
    setPlaygroundInputs({});
    setPlaygroundResponse(null);
  }, [activeCategory, activeOperation]);

  const handleRunPlayground = async () => {
    const details = detailsMap[activeCategory][activeOperation];
    setExecutingRequest(true);
    setPlaygroundResponse(null);

    try {
      // 1. Construct URL (substitute path params)
      let finalPath = details.path;
      if (details.pathParams) {
        details.pathParams.forEach((p) => {
          const val = playgroundInputs[p.field] || (p.field === "id" ? "clx9xyz12" : "");
          finalPath = finalPath.replace(`:${p.field}`, val);
        });
      }

      const requestUrl = `/api/v1${finalPath.replace("/api/v1", "")}`;

      // 2. Construct headers
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${profile?.apiKey || ""}`,
        "X-Playground": "true"
      };

      let body: any = undefined;

      // 3. Construct body if applicable
      if (details.body) {
        body = {};
        details.body.forEach((b) => {
          let val = playgroundInputs[b.field];
          if (val === undefined) {
            // Apply default placeholder values
            if (b.field === "url" || b.field === "targetUrl") val = "https://google.com";
            else if (b.field === "name") val = "QR Google";
            else if (b.field === "isActive") val = true;
            else val = "";
          }

          // Handle type coercions
          if (b.type === "boolean") {
            body[b.field] = val === "true" || val === true;
          } else if (b.type === "number") {
            body[b.field] = val === "" ? undefined : Number(val);
          } else {
            body[b.field] = val;
          }
        });
        headers["Content-Type"] = "application/json";
      }

      // 4. Fire request
      const res = await fetch(requestUrl, {
        method: details.method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const resText = await res.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(resText);
      } catch {
        resJson = resText;
      }

      setPlaygroundResponse({
        status: res.status,
        statusText: res.statusText,
        data: resJson
      });

      // Reload profile to update quota display
      loadProfile();
    } catch (err: any) {
      console.error(err);
      setPlaygroundResponse({
        status: 500,
        statusText: "Client Execution Error",
        data: { error: err.message || "Failed to make local proxy request." }
      });
    } finally {
      setExecutingRequest(false);
    }
  };

  // Redirect if unauthenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Load Developer Profile data
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/developer/profile");
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data || null);
      } else {
        toast.error(isId ? "Gagal memuat profil developer." : "Failed to load developer profile.");
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Kesalahan koneksi ke server." : "Server connection error.");
    } finally {
      setLoading(false);
    }
  }, [isId]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadProfile();
    }
  }, [authStatus, loadProfile]);

  // Handle Application Submit
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast.error(isId ? "Tujuan penggunaan wajib diisi." : "Purpose of usage is required.");
      return;
    }

    setSubmittingApply(true);
    try {
      const res = await fetch("/api/developer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: purpose.trim(),
          projectProof: projectProof.trim() || null
        })
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(
          isId
            ? "Akses API Developer berhasil diaktifkan secara instan!"
            : "Developer API access has been successfully activated instantly!"
        );
        setShowApplyModal(false);
        setPurpose("");
        setProjectProof("");
        loadProfile();
      } else {
        toast.error(json.error || (isId ? "Gagal mengajukan permohonan." : "Failed to submit appeal."));
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Kesalahan jaringan." : "Network error.");
    } finally {
      setSubmittingApply(false);
    }
  };

  // Handle Key Regeneration
  const handleRegenerateKey = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/developer/regenerate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(
          isId ? "API Key baru berhasil dibuat!" : "New API Key generated successfully!"
        );
        setShowRegenModal(false);
        loadProfile();
      } else {
        toast.error(json.error || (isId ? "Gagal memproses kunci baru." : "Failed to regenerate key."));
      }
    } catch (e) {
      console.error(e);
      toast.error(isId ? "Kesalahan jaringan." : "Network error.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyKey = () => {
    if (!profile?.apiKey) return;
    navigator.clipboard.writeText(profile.apiKey);
    toast.success(isId ? "API Key disalin ke papan klip!" : "API Key copied to clipboard!");
  };

  const maskedKey = profile?.apiKey || "dev_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  const apiEndpointUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}/api/v1/links`
    : "https://nyoo.me/api/v1/links";

  const apiQrEndpointUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}/api/v1/qrcodes`
    : "https://nyoo.me/api/v1/qrcodes";

  interface EndpointParam {
    field: string;
    type: string;
    required: boolean;
    descId: string;
    descEn: string;
  }

  interface EndpointDetail {
    method: "POST" | "GET" | "PUT" | "DELETE";
    path: string;
    descId: string;
    descEn: string;
    headers: { name: string; value: string }[];
    body?: EndpointParam[];
    pathParams?: EndpointParam[];
    responseExample: any;
  }

  const detailsMap: Record<"shortlink" | "qrcode", Record<"create" | "list" | "detail" | "update" | "delete", EndpointDetail>> = {
    shortlink: {
      create: {
        method: "POST",
        path: "/api/v1/links",
        descId: "Membuat tautan pendek baru dengan opsi custom alias.",
        descEn: "Generates a dynamic short URL with a custom alias slug option.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" },
          { name: "Content-Type", value: "application/json" }
        ],
        body: [
          { field: "url", type: "string", required: true, descId: "URL target panjang asli.", descEn: "Destination long URL link." },
          { field: "customizedUrl", type: "string", required: false, descId: "Custom alias slug yang diinginkan (opsional).", descEn: "Optional custom short slug." }
        ],
        responseExample: {
          success: true,
          message: "Shortened URL successfully created.",
          data: {
            id: "clx9xyz12",
            originalUrl: "https://google.com",
            shortCode: "google-kustom",
            shortUrl: `${apiEndpointUrl.replace("/api/v1/links", "")}/google-kustom`,
            title: "Google",
            description: "Search the world's information...",
            logo: "https://google.com/favicon.ico",
            isActive: true,
            createdAt: new Date().toISOString()
          }
        }
      },
      list: {
        method: "GET",
        path: "/api/v1/links",
        descId: "Mengambil daftar semua tautan pendek yang dibuat oleh akun Anda.",
        descEn: "Returns a chronological history of short links generated on this account.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" }
        ],
        responseExample: {
          success: true,
          count: 1,
          data: [
            {
              id: "clx9xyz12",
              originalUrl: "https://google.com",
              shortCode: "google-kustom",
              shortUrl: `${apiEndpointUrl.replace("/api/v1/links", "")}/google-kustom`,
              title: "Google",
              views: 12,
              isActive: true,
              createdAt: new Date().toISOString()
            }
          ]
        }
      },
      detail: {
        method: "GET",
        path: "/api/v1/links/:id",
        descId: "Mengambil detail informasi dan statistik klik dari shortlink tertentu.",
        descEn: "Retrieve metadata and click statistics for a specific short link.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" }
        ],
        pathParams: [
          { field: "id", type: "string", required: true, descId: "ID dari shortlink (misal: clx...) yang ingin dicari.", descEn: "The shortlink ID to retrieve." }
        ],
        responseExample: {
          success: true,
          data: {
            id: "clx9xyz12",
            originalUrl: "https://google.com",
            shortCode: "google-kustom",
            shortUrl: `${apiEndpointUrl.replace("/api/v1/links", "")}/google-kustom`,
            title: "Google",
            description: "Search the world's information...",
            logo: "https://google.com/favicon.ico",
            views: 12,
            analyticsCount: 10,
            isActive: true,
            createdAt: new Date().toISOString()
          }
        }
      },
      update: {
        method: "PUT",
        path: "/api/v1/links/:id",
        descId: "Memperbarui target URL, judul, deskripsi, atau status aktif dari shortlink.",
        descEn: "Update target URL, title, description, or activation status of a short link.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" },
          { name: "Content-Type", value: "application/json" }
        ],
        pathParams: [
          { field: "id", type: "string", required: true, descId: "ID dari shortlink yang ingin diperbarui.", descEn: "The shortlink ID to update." }
        ],
        body: [
          { field: "url", type: "string", required: false, descId: "URL target panjang baru.", descEn: "New destination long URL." },
          { field: "title", type: "string", required: false, descId: "Judul metadata kustom.", descEn: "Custom metadata title." },
          { field: "description", type: "string", required: false, descId: "Deskripsi metadata kustom.", descEn: "Custom metadata description." },
          { field: "isActive", type: "boolean", required: false, descId: "Status aktif link (true/false).", descEn: "Shortlink active state (true/false)." }
        ],
        responseExample: {
          success: true,
          message: "Short URL successfully updated.",
          data: {
            id: "clx9xyz12",
            originalUrl: "https://newdestination.com",
            shortCode: "google-kustom",
            shortUrl: `${apiEndpointUrl.replace("/api/v1/links", "")}/google-kustom`,
            title: "Tautan Baru",
            description: "Search the world's information...",
            logo: "https://google.com/favicon.ico",
            isActive: true,
            createdAt: new Date().toISOString()
          }
        }
      },
      delete: {
        method: "DELETE",
        path: "/api/v1/links/:id",
        descId: "Menghapus shortlink secara permanen/soft-delete.",
        descEn: "Deletes a specific short link from your account.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" }
        ],
        pathParams: [
          { field: "id", type: "string", required: true, descId: "ID dari shortlink yang ingin dihapus.", descEn: "The shortlink ID to delete." }
        ],
        responseExample: {
          success: true,
          message: "Short URL successfully deleted."
        }
      }
    },
    qrcode: {
      create: {
        method: "POST",
        path: "/api/v1/qrcodes",
        descId: "Membuat QR Code dinamis baru yang terhubung ke target URL.",
        descEn: "Generates a new dynamic QR Code pointing to a destination URL.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" },
          { name: "Content-Type", value: "application/json" }
        ],
        body: [
          { field: "targetUrl", type: "string", required: true, descId: "URL target tujuan QR Code.", descEn: "Destination target URL for the QR Code." },
          { field: "name", type: "string", required: false, descId: "Nama deskriptif untuk QR Code.", descEn: "Descriptive name for the QR Code." },
          { field: "logo", type: "string", required: false, descId: "URL gambar logo di tengah QR Code.", descEn: "Image URL for the central logo of the QR Code." },
          { field: "styleConfig", type: "object", required: false, descId: "Konfigurasi style visual QR Code (warna, bentuk, dll).", descEn: "Optional visual customization options object." }
        ],
        responseExample: {
          success: true,
          message: "QR Code successfully created.",
          data: {
            id: "clx9qr567",
            name: "QR Google",
            targetUrl: "https://google.com",
            qrShortUrl: `${apiQrEndpointUrl.replace("/api/v1/qrcodes", "")}/qr-ab12cd`,
            qrShortCode: "qr-ab12cd",
            logo: "https://google.com/favicon.ico",
            isActive: true,
            createdAt: new Date().toISOString()
          }
        }
      },
      list: {
        method: "GET",
        path: "/api/v1/qrcodes",
        descId: "Mengambil daftar semua QR Code milik akun Anda.",
        descEn: "Returns a list of all QR Codes created on this account.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" }
        ],
        responseExample: {
          success: true,
          count: 1,
          data: [
            {
              id: "clx9qr567",
              name: "QR Google",
              targetUrl: "https://google.com",
              qrShortUrl: `${apiQrEndpointUrl.replace("/api/v1/qrcodes", "")}/qr-ab12cd`,
              qrShortCode: "qr-ab12cd",
              logo: "https://google.com/favicon.ico",
              views: 5,
              isActive: true,
              createdAt: new Date().toISOString()
            }
          ]
        }
      },
      detail: {
        method: "GET",
        path: "/api/v1/qrcodes/:id",
        descId: "Mengambil detail informasi dan statistik scan dari QR Code tertentu.",
        descEn: "Retrieve details and scan counts for a specific QR Code.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" }
        ],
        pathParams: [
          { field: "id", type: "string", required: true, descId: "ID dari QR Code yang ingin dicari.", descEn: "The QR Code ID to retrieve." }
        ],
        responseExample: {
          success: true,
          data: {
            id: "clx9qr567",
            name: "QR Google",
            targetUrl: "https://google.com",
            qrShortUrl: `${apiQrEndpointUrl.replace("/api/v1/qrcodes", "")}/qr-ab12cd`,
            qrShortCode: "qr-ab12cd",
            logo: "https://google.com/favicon.ico",
            views: 5,
            analyticsCount: 3,
            isActive: true,
            createdAt: new Date().toISOString()
          }
        }
      },
      update: {
        method: "PUT",
        path: "/api/v1/qrcodes/:id",
        descId: "Memperbarui target URL, nama, logo, atau status aktif dari QR Code.",
        descEn: "Update target URL, name, logo URL, or active status of a QR Code.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" },
          { name: "Content-Type", value: "application/json" }
        ],
        pathParams: [
          { field: "id", type: "string", required: true, descId: "ID dari QR Code yang ingin diperbarui.", descEn: "The QR Code ID to update." }
        ],
        body: [
          { field: "targetUrl", type: "string", required: false, descId: "URL target tujuan baru.", descEn: "New target URL for the QR Code." },
          { field: "name", type: "string", required: false, descId: "Nama baru QR Code.", descEn: "New QR Code descriptive name." },
          { field: "logo", type: "string", required: false, descId: "URL logo tengah baru.", descEn: "New central logo image URL." },
          { field: "isActive", type: "boolean", required: false, descId: "Status aktif (true/false).", descEn: "QR Code active state (true/false)." }
        ],
        responseExample: {
          success: true,
          message: "QR Code successfully updated.",
          data: {
            id: "clx9qr567",
            name: "Nama QR Baru",
            targetUrl: "https://newtarget.com",
            qrShortUrl: `${apiQrEndpointUrl.replace("/api/v1/qrcodes", "")}/qr-ab12cd`,
            qrShortCode: "qr-ab12cd",
            logo: "https://google.com/favicon.ico",
            isActive: true,
            createdAt: new Date().toISOString()
          }
        }
      },
      delete: {
        method: "DELETE",
        path: "/api/v1/qrcodes/:id",
        descId: "Menghapus QR Code dari akun Anda secara permanen.",
        descEn: "Deletes a specific QR Code from your account.",
        headers: [
          { name: "Authorization", value: "Bearer <YOUR_API_KEY>" }
        ],
        pathParams: [
          { field: "id", type: "string", required: true, descId: "ID dari QR Code yang ingin dihapus.", descEn: "The QR Code ID to delete." }
        ],
        responseExample: {
          success: true,
          message: "QR Code successfully deleted."
        }
      }
    }
  };

  const codeSnippets = {
    shortlink: {
      create: {
        curl: `curl -X POST "${apiEndpointUrl}" \\
  -H "Authorization: Bearer ${maskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://google.com",
    "customizedUrl": "google-kustom"
  }'`,
        js: `fetch("${apiEndpointUrl}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${maskedKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://google.com",
    customizedUrl: "google-kustom"
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiEndpointUrl}"
headers = {
    "Authorization": "Bearer ${maskedKey}",
    "Content-Type": "application/json"
}
payload = {
    "url": "https://google.com",
    "customizedUrl": "google-kustom"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`
      },
      list: {
        curl: `curl -X GET "${apiEndpointUrl}" \\
  -H "Authorization: Bearer ${maskedKey}"`,
        js: `fetch("${apiEndpointUrl}", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${maskedKey}"
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiEndpointUrl}"
headers = {
    "Authorization": "Bearer ${maskedKey}"
}

response = requests.get(url, headers=headers)
print(response.json())`
      },
      detail: {
        curl: `curl -X GET "${apiEndpointUrl}/clx9xyz12" \\
  -H "Authorization: Bearer ${maskedKey}"`,
        js: `fetch("${apiEndpointUrl}/clx9xyz12", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${maskedKey}"
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiEndpointUrl}/clx9xyz12"
headers = {
    "Authorization": "Bearer ${maskedKey}"
}

response = requests.get(url, headers=headers)
print(response.json())`
      },
      update: {
        curl: `curl -X PUT "${apiEndpointUrl}/clx9xyz12" \\
  -H "Authorization: Bearer ${maskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://newdestination.com",
    "title": "Tautan Baru",
    "isActive": true
  }'`,
        js: `fetch("${apiEndpointUrl}/clx9xyz12", {
  method: "PUT",
  headers: {
    "Authorization": "Bearer ${maskedKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://newdestination.com",
    title: "Tautan Baru",
    isActive: true
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiEndpointUrl}/clx9xyz12"
headers = {
    "Authorization": "Bearer ${maskedKey}",
    "Content-Type": "application/json"
}
payload = {
    "url": "https://newdestination.com",
    "title": "Tautan Baru",
    "isActive": True
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`
      },
      delete: {
        curl: `curl -X DELETE "${apiEndpointUrl}/clx9xyz12" \\
  -H "Authorization: Bearer ${maskedKey}"`,
        js: `fetch("${apiEndpointUrl}/clx9xyz12", {
  method: "DELETE",
  headers: {
    "Authorization": "Bearer ${maskedKey}"
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiEndpointUrl}/clx9xyz12"
headers = {
    "Authorization": "Bearer ${maskedKey}"
}

response = requests.delete(url, headers=headers)
print(response.json())`
      }
    },
    qrcode: {
      create: {
        curl: `curl -X POST "${apiQrEndpointUrl}" \\
  -H "Authorization: Bearer ${maskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://google.com",
    "name": "QR Google",
    "logo": "https://google.com/favicon.ico"
  }'`,
        js: `fetch("${apiQrEndpointUrl}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${maskedKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    targetUrl: "https://google.com",
    name: "QR Google",
    logo: "https://google.com/favicon.ico"
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiQrEndpointUrl}"
headers = {
    "Authorization": "Bearer ${maskedKey}",
    "Content-Type": "application/json"
}
payload = {
    "targetUrl": "https://google.com",
    "name": "QR Google",
    "logo": "https://google.com/favicon.ico"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`
      },
      list: {
        curl: `curl -X GET "${apiQrEndpointUrl}" \\
  -H "Authorization: Bearer ${maskedKey}"`,
        js: `fetch("${apiQrEndpointUrl}", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${maskedKey}"
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiQrEndpointUrl}"
headers = {
    "Authorization": "Bearer ${maskedKey}"
}

response = requests.get(url, headers=headers)
print(response.json())`
      },
      detail: {
        curl: `curl -X GET "${apiQrEndpointUrl}/clx9qr567" \\
  -H "Authorization: Bearer ${maskedKey}"`,
        js: `fetch("${apiQrEndpointUrl}/clx9qr567", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${maskedKey}"
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiQrEndpointUrl}/clx9qr567"
headers = {
    "Authorization": "Bearer ${maskedKey}"
}

response = requests.get(url, headers=headers)
print(response.json())`
      },
      update: {
        curl: `curl -X PUT "${apiQrEndpointUrl}/clx9qr567" \\
  -H "Authorization: Bearer ${maskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://newtarget.com",
    "name": "Nama QR Baru",
    "isActive": true
  }'`,
        js: `fetch("${apiQrEndpointUrl}/clx9qr567", {
  method: "PUT",
  headers: {
    "Authorization": "Bearer ${maskedKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    targetUrl: "https://newtarget.com",
    name: "Nama QR Baru",
    isActive: true
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiQrEndpointUrl}/clx9qr567"
headers = {
    "Authorization": "Bearer ${maskedKey}",
    "Content-Type": "application/json"
}
payload = {
    "targetUrl": "https://newtarget.com",
    "name": "Nama QR Baru",
    "isActive": True
}

response = requests.put(url, headers=headers, json=payload)
print(response.json())`
      },
      delete: {
        curl: `curl -X DELETE "${apiQrEndpointUrl}/clx9qr567" \\
  -H "Authorization: Bearer ${maskedKey}"`,
        js: `fetch("${apiQrEndpointUrl}/clx9qr567", {
  method: "DELETE",
  headers: {
    "Authorization": "Bearer ${maskedKey}"
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
        python: `import requests

url = "${apiQrEndpointUrl}/clx9qr567"
headers = {
    "Authorization": "Bearer ${maskedKey}"
}

response = requests.delete(url, headers=headers)
print(response.json())`
      }
    }
  };

  // Calculate percentage usage
  const hitsLimit = profile?.apiHitsLimit || 100;
  const hitsCurrent = profile?.apiHitsCurrent || 0;
  const usagePercentage = Math.min(Math.round((hitsCurrent / hitsLimit) * 100), 100);

  // Colors based on usage
  const getUsageColor = (pct: number) => {
    if (pct >= 90) return "bg-rose-500 text-rose-500";
    if (pct >= 70) return "bg-amber-500 text-amber-500";
    return "bg-emerald-500 text-emerald-500";
  };

  const activeStatus = profile?.status || "NONE";

  if (loading || authStatus === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-xl rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
          <FontAwesomeIcon
            icon={faSpinner}
            className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin"
          />
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-4 animate-pulse">
          {isId ? "Memverifikasi Kredensial Developer..." : "Verifying Developer Credentials..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-grow space-y-8 pb-12">
      {/* Premium Gradient Top Header */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[40%] h-[120%] bg-gradient-to-bl from-violet-600/30 to-fuchsia-600/5 rounded-bl-[100px] pointer-events-none blur-2xl" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-black tracking-widest text-violet-400 uppercase">
            <FontAwesomeIcon icon={faCode} className="w-3 h-3 animate-pulse" />
            Developer Platform
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
            {isId ? "Developer API & Sandbox" : "Developer API & Sandbox"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-350 font-medium leading-relaxed max-w-3xl">
            {isId
              ? "Ubah nyoo.me menjadi platform shorten link milik Anda dengan integrasi API kami. Buat, kelola, dan pantau tautan Anda secara dinamis dari server Anda."
              : "Transform nyoo.me into your own short link platform using our developer API. Dynamically build, manage, and monitor links programmatically from your backend."}
          </p>
        </div>
      </div>

      {/* Main Conditionals based on developer status */}
      <AnimatePresence mode="wait">
        {activeStatus === "NONE" || activeStatus === "REJECTED" ? (
          <motion.div
            key="none-rejected"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* If Rejected Alert Banner */}
            {activeStatus === "REJECTED" && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-2xl flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 dark:text-red-400 text-xl" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-red-800 dark:text-red-300">
                    {isId ? "Permohonan Anda Sebelumnya Ditolak" : "Your Previous Application Was Rejected"}
                  </h3>
                  <p className="text-sm text-red-700/90 dark:text-red-400/90 font-medium">
                    {isId ? "Alasan penolakan dari Administrator:" : "Reason of rejection from Administrator:"}
                  </p>
                  <div className="bg-white/60 dark:bg-black/30 rounded-2xl p-4 mt-2 border border-red-200/50 dark:border-red-900/30 italic text-sm text-red-900 dark:text-red-300 font-semibold font-sans">
                    &ldquo;{profile?.rejectionReason || (isId ? "Tidak ada alasan spesifik." : "No specific reason provided.")}&rdquo;
                  </div>
                  <p className="text-xs text-red-500/80 mt-3 font-semibold">
                    {isId
                      ? "Anda dipersilakan untuk merevisi data dan mengajukan permohonan banding kembali di bawah ini."
                      : "You are welcome to revise details and resubmit a developer account appeal below."}
                  </p>
                </div>
              </div>
            )}

            {/* Premium Features Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: faKey,
                  color: "from-violet-500 to-indigo-500",
                  title: isId ? "Autentikasi API Key Aman" : "Secure API Key Auth",
                  desc: isId
                    ? "Gunakan kunci API cryptographically-secure yang dapat Anda regenerate kapan saja untuk memverifikasi request server-to-server."
                    : "Employ cryptographically-secure token credentials that you can regenerate anytime to authorize backend requests."
                },
                {
                  icon: faClock,
                  color: "from-fuchsia-500 to-pink-500",
                  title: isId ? "Freemium & Limit Fleksibel" : "Freemium & High Quota",
                  desc: isId
                    ? "Mulailah secara gratis dengan limit harian. Hubungi admin atau ajukan banding dengan detail project untuk alokasi limit yang lebih tinggi."
                    : "Begin fully free with daily rolling counters. Request customized quotas directly from our administration for premium platforms."
                },
                {
                  icon: faTerminal,
                  color: "from-amber-500 to-orange-500",
                  title: isId ? "Route API Khusus Developer" : "Dedicated Developer Routes",
                  desc: isId
                    ? "Endpoint terpisah di bawah namespace v1. Memberikan perlindungan penuh, bebas dari interferensi session cookie frontend."
                    : "Isolated routing mounted under the secure v1 namespace, protecting your integration from internal browser state."
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-md shadow-violet-500/10`}>
                      <FontAwesomeIcon icon={item.icon} className="text-white text-lg group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Application Block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center md:text-left max-w-lg">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {isId ? "Aktifkan Akses Developer Sekarang" : "Activate Developer Access Now"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {isId
                    ? "Aktifkan akses API Developer Anda secara instan dengan mengisi formulir tujuan penggunaan di bawah ini."
                    : "Activate your Developer API access instantly by completing the usage purpose form below."}
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                className="w-full md:w-auto shrink-0 bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                {isId ? "Aktifkan API Developer" : "Enable Developer API"}
              </button>
            </div>
          </motion.div>
        ) : activeStatus === "PENDING" ? (
          <motion.div
            key="pending-state"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Glowing Pulsing Status Card */}
            <div className="bg-white dark:bg-slate-900 border border-amber-300/40 dark:border-amber-900/40 rounded-3xl p-8 text-center space-y-6 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 rounded-3xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/50 animate-pulse">
                <FontAwesomeIcon icon={faClock} className="text-amber-500 dark:text-amber-400 text-2xl" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {isId ? "Permohonan Developer Sedang Ditinjau" : "Application Under Manual Review"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {isId
                    ? "Permohonan manual Anda sedang kami tinjau secara saksama. Administrator akan memverifikasi permohonan Anda secepat mungkin."
                    : "Our administration is manually reviewing your developer credentials. Once verified, your API tokens will be unlocked immediately."}
                </p>
              </div>

              {/* Submitted Details Box */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-6 text-left max-w-2xl mx-auto space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-black uppercase text-amber-500 tracking-widest">
                    {isId ? "Detail Pengajuan Anda" : "Your Submission Details"}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 block">
                      {isId ? "Tujuan Penggunaan (Purpose)" : "Usage Purpose"}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {profile?.purpose}
                    </p>
                  </div>
                  {profile?.projectProof && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 block">
                        {isId ? "Bukti / Dokumen Proyek" : "Project Documents / Links"}
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 truncate select-all">
                        {profile?.projectProof}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faSync} className="animate-spin text-violet-500" />
                {isId ? "Halaman ini akan otomatis terupdate jika status berubah." : "This dashboard updates automatically once approved."}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="approved-state"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Top row: Metrics Gauges & API Key controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* API Key Panel */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <FontAwesomeIcon icon={faKey} className="w-3.5 h-3.5" />
                      </div>
                      {isId ? "Kredensial Developer API Key" : "Developer API Credentials"}
                    </h2>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {isId ? "AKTIF & AMAN" : "ACTIVE & SECURE"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {isId
                      ? "Gunakan kunci pribadi ini untuk mengautentikasi permintaan API Anda. Jaga kerahasiaan kunci ini dan jangan bagikan kepada siapa pun."
                      : "Use this private key to authorize your developer actions. Do not commit it to client code repositories or expose it publicly."}
                  </p>
                </div>

                {/* Masked API Key input with tools */}
                <div className="space-y-4">
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden px-4 py-3.5">
                    <input
                      type={showApiKey ? "text" : "password"}
                      readOnly
                      value={profile?.apiKey || ""}
                      className="bg-transparent border-none outline-none font-mono text-sm tracking-wide text-slate-800 dark:text-slate-200 w-full pr-24 select-all"
                    />
                    <div className="absolute right-3 flex items-center gap-1">
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        title={showApiKey ? (isId ? "Sembunyikan" : "Hide") : (isId ? "Tampilkan" : "Show")}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 active:scale-95 transition-all"
                      >
                        <FontAwesomeIcon icon={showApiKey ? faEyeSlash : faEye} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCopyKey}
                        title={isId ? "Salin Kunci" : "Copy Key"}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 active:scale-95 transition-all"
                      >
                        <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Prefix: <span className="font-mono text-slate-500 dark:text-slate-300">dev_sk_...</span>
                    </span>
                    <button
                      onClick={() => setShowRegenModal(true)}
                      className="text-xs font-extrabold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1.5 select-none"
                    >
                      <FontAwesomeIcon icon={faSync} className="w-3 h-3" />
                      {isId ? "Buat Ulang API Key" : "Regenerate API Key"}
                    </button>
                  </div>
                </div>
              </div>

              {/* API Hits Rate Quota Gauge */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="text-violet-600 dark:text-violet-400" />
                      {isId ? "Kuota Harian API" : "Daily Hits Quota"}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-tight">
                      {isId
                        ? "Akses API Freemium beroperasi di bawah counter 24 jam bergulir."
                        : "Freemium API operates on a rolling 24-hour rate limit."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(isId ? "Reset usage limit panggilan harian Anda? (Hanya untuk testing)" : "Reset your daily API call hits usage counter? (For testing purposes only)")) return;
                      try {
                        const res = await fetch("/api/v1/reset-usage", { method: "POST" });
                        if (res.ok) {
                          toast.success(isId ? "Usage hit harian berhasil di-reset!" : "Daily usage hits successfully reset!");
                          loadProfile();
                        } else {
                          toast.error(isId ? "Gagal mereset usage." : "Failed to reset usage.");
                        }
                      } catch {
                        toast.error(isId ? "Kesalahan jaringan." : "Network error.");
                      }
                    }}
                    className="px-2.5 py-1.5 bg-violet-500/10 hover:bg-violet-600 text-violet-650 dark:text-violet-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all select-none shrink-0"
                  >
                    🔄 {isId ? "Reset Hit" : "Reset Usage"}
                  </button>
                </div>

                {/* Premium Quota Tracker Display */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-mono">
                        {hitsCurrent.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400 block">
                        {isId ? "Total hit hari ini" : "Total daily hits"}
                      </span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 block font-mono">
                        / {hitsLimit.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400 block">
                        {isId ? "Kuota maks" : "Max Limit"}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar gradient */}
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getUsageColor(usagePercentage).split(" ")[0]}`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1">
                    <span>{usagePercentage}% {isId ? "terpakai" : "used"}</span>
                    <span className="flex items-center gap-1 font-mono">
                      <FontAwesomeIcon icon={faSync} className="text-[9px] animate-pulse" />
                      Reset: {new Date(profile?.lastReset ? new Date(profile.lastReset).getTime() + 24 * 60 * 60 * 1000 : Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {profile && profile.playgroundHitsCurrent !== undefined && (
                    <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold border-t border-slate-100 dark:border-white/5 pt-2 mt-1">
                      🎮 Web Playground Free Hits: <strong className="text-violet-650 dark:text-violet-400 font-mono font-black">{profile.playgroundHitsCurrent} / 10</strong> {isId ? "panggilan gratis hari ini" : "free calls today"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Sandbox API Documentation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              {/* Sandbox Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <FontAwesomeIcon icon={faTerminal} className="text-violet-600 dark:text-violet-400" />
                    {isId ? "Developer API Sandbox & Dokumentasi" : "Developer API Sandbox & Docs"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isId
                      ? "Salin kode contoh untuk mengintegrasikan program backend Anda secepat kilat."
                      : "Copy code snippets to integrate our shortener API into your systems instantly."}
                  </p>
                </div>

                {/* Endpoint Toggle Buttons (Grouped) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Category Toggle */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory("shortlink");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all select-none ${activeCategory === "shortlink" ? "bg-white dark:bg-slate-900 text-violet-650 dark:text-violet-400 shadow-sm" : "text-slate-500 hover:text-slate-750 dark:hover:text-slate-355"}`}
                    >
                      🔗 {isId ? "Tautan" : "Links"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory("qrcode");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all select-none ${activeCategory === "qrcode" ? "bg-white dark:bg-slate-900 text-violet-650 dark:text-violet-400 shadow-sm" : "text-slate-500 hover:text-slate-750 dark:hover:text-slate-355"}`}
                    >
                      🔲 QR Code
                    </button>
                  </div>

                  {/* Operation Toggle */}
                  <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 gap-0.5">
                    {(["create", "list", "detail", "update", "delete"] as const).map((op) => {
                      const methodColors = {
                        create: { bg: "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400", label: "POST" },
                        list: { bg: "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400", label: "GET List" },
                        detail: { bg: "bg-teal-500/10 text-teal-655 dark:text-teal-400", label: "GET Detail" },
                        update: { bg: "bg-amber-500/10 text-amber-655 dark:text-amber-400", label: "PUT" },
                        delete: { bg: "bg-rose-500/10 text-rose-650 dark:text-rose-450", label: "DELETE" }
                      };
                      const active = activeOperation === op;
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setActiveOperation(op)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all select-none ${active ? "bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-white/5 " + methodColors[op].bg : "text-slate-500 hover:text-slate-750 dark:hover:text-slate-350"}`}
                        >
                          {methodColors[op].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Doc Body */}
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:h-[580px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
                {/* Method / Request spec list */}
                <div className="p-6 overflow-y-auto space-y-6 lg:h-full">
                  {(() => {
                    const currentDetails = detailsMap[activeCategory][activeOperation];
                    return (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-black ${
                            currentDetails.method === "POST" ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400" :
                            currentDetails.method === "GET" ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400" :
                            currentDetails.method === "PUT" ? "bg-amber-100 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400" :
                            "bg-rose-100 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400"
                          }`}>
                            {currentDetails.method}
                          </span>
                          <code className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 ml-2 block sm:inline">
                            {currentDetails.path}
                          </code>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-1">
                            {isId ? currentDetails.descId : currentDetails.descEn}
                          </p>
                        </div>

                        {/* Doc switch tab tabs */}
                        <div className="flex border-b border-slate-100 dark:border-slate-800/80 mb-2">
                          <button
                            type="button"
                            onClick={() => setActiveDocTab("params")}
                            className={`pb-2 text-xs font-black tracking-wider uppercase border-b-2 mr-4 transition-all ${
                              activeDocTab === "params"
                                ? "border-violet-500 text-slate-850 dark:text-white"
                                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {isId ? "Parameter Request" : "Request Parameters"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDocTab("response")}
                            className={`pb-2 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
                              activeDocTab === "response"
                                ? "border-violet-500 text-slate-850 dark:text-white"
                                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {isId ? "Contoh Response" : "Response Example"}
                          </button>
                        </div>

                        {activeDocTab === "params" ? (
                          <div className="space-y-4">
                            {/* Request headers section */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                Request Headers
                              </span>
                              <table className="w-full text-xs font-medium text-slate-600 dark:text-slate-350">
                                <thead>
                                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-bold">
                                    <th className="text-left py-1.5 font-bold">Header</th>
                                    <th className="text-left py-1.5 font-bold">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                  {currentDetails.headers.map((h, i) => (
                                    <tr key={i}>
                                      <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{h.name}</td>
                                      <td className="py-2 font-mono text-[11px] text-slate-500 dark:text-slate-450">{h.value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Path Parameters section */}
                            {currentDetails.pathParams && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                  Path Parameters
                                </span>
                                <table className="w-full text-xs font-medium text-slate-600 dark:text-slate-350">
                                  <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-bold">
                                      <th className="text-left py-1.5 font-bold">Parameter</th>
                                      <th className="text-left py-1.5 font-bold">Type</th>
                                      <th className="text-left py-1.5 font-bold">Required</th>
                                      <th className="text-left py-1.5 font-bold">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {currentDetails.pathParams.map((p, i) => (
                                      <tr key={i}>
                                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{p.field}</td>
                                        <td className="py-2 font-mono text-violet-505 text-[11px]">{p.type}</td>
                                        <td className="py-2 font-mono text-rose-505 text-[11px]">{p.required ? "true" : "false"}</td>
                                        <td className="py-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                          {isId ? p.descId : p.descEn}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Request body section */}
                            {currentDetails.body && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                  Request Body (JSON)
                                </span>
                                <table className="w-full text-xs font-medium text-slate-600 dark:text-slate-350">
                                  <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-bold">
                                      <th className="text-left py-1.5 font-bold">Field</th>
                                      <th className="text-left py-1.5 font-bold">Type</th>
                                      <th className="text-left py-1.5 font-bold">Required</th>
                                      <th className="text-left py-1.5 font-bold">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {currentDetails.body.map((b, i) => (
                                      <tr key={i}>
                                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{b.field}</td>
                                        <td className="py-2 font-mono text-violet-505 text-[11px]">{b.type}</td>
                                        <td className="py-2 font-mono text-rose-505 text-[11px]">{b.required ? "true" : "false"}</td>
                                        <td className="py-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                          {isId ? b.descId : b.descEn}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Response Example */
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span>Expected JSON Response (200 OK / 201 Created)</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(currentDetails.responseExample, null, 2));
                                  toast.success(isId ? "Contoh JSON disalin!" : "JSON Example copied!");
                                }}
                                className="text-violet-550 dark:text-violet-400 hover:text-violet-750 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <FontAwesomeIcon icon={faCopy} />
                                {isId ? "Salin JSON" : "Copy JSON"}
                              </button>
                            </div>
                            <pre className="language-json bg-slate-950 border border-slate-900 rounded-xl p-3.5 overflow-auto font-mono text-[11px] leading-relaxed text-slate-300 select-all max-h-[350px]" style={{ fontSize: '11px' }}>
                              <code
                                className="language-json"
                                style={{ fontSize: '11px' }}
                                dangerouslySetInnerHTML={{
                                  __html: getHighlightedCode(
                                    JSON.stringify(currentDetails.responseExample, null, 2),
                                    "json"
                                  )
                                }}
                              />
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Visual execution & snippets block */}
                <div className="flex flex-col bg-slate-950 text-slate-200 relative lg:h-full overflow-hidden">
                  {/* Top Tab Bar: Snippets vs Playground */}
                  <div className="flex items-center bg-slate-900 border-b border-slate-800/80 px-4 justify-between shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSandboxRightTab("snippets")}
                        className={`px-4 py-3 text-xs font-black tracking-wider uppercase transition-all select-none border-b-2 ${sandboxRightTab === "snippets" ? "border-violet-500 text-white bg-slate-850/50" : "border-transparent text-slate-400 hover:text-slate-350"}`}
                      >
                        💻 {isId ? "Snippet Kode" : "Code Snippets"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSandboxRightTab("playground")}
                        className={`px-4 py-3 text-xs font-black tracking-wider uppercase transition-all select-none border-b-2 ${sandboxRightTab === "playground" ? "border-violet-500 text-white bg-slate-855/50" : "border-transparent text-slate-400 hover:text-slate-350"}`}
                      >
                        🎮 Playground
                      </button>
                    </div>
                  </div>

                  {sandboxRightTab === "snippets" ? (
                    /* SNIPPETS CONTENT */
                    <div className="flex flex-col flex-1 min-h-0">
                      {/* Language Tab bar */}
                      <div className="flex items-center bg-slate-900/60 border-b border-slate-850 px-4 py-2 justify-between shrink-0">
                        <div className="flex items-center gap-1.5">
                          {(["curl", "js", "python"] as const).map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setActiveSandboxTab(tab)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all select-none ${activeSandboxTab === tab ? "bg-slate-800 text-violet-400 border border-slate-700" : "text-slate-400 hover:text-slate-350"}`}
                            >
                              {tab === "js" ? "JS" : tab}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const text = codeSnippets[activeCategory][activeOperation][activeSandboxTab];
                            navigator.clipboard.writeText(text);
                            toast.success(isId ? "Script disalin!" : "Script copied!");
                          }}
                          title={isId ? "Salin Kode" : "Copy Code"}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-750 flex items-center justify-center text-slate-300 active:scale-90 transition-all select-none"
                        >
                          <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Snippet Code Area */}
                      <pre className={`language-${activeSandboxTab === "curl" ? "bash" : activeSandboxTab} p-5 flex-1 overflow-auto font-mono text-[11px] leading-relaxed select-all text-slate-355 bg-transparent`} style={{ fontSize: '11px' }}>
                        <code
                          className={`language-${activeSandboxTab === "curl" ? "bash" : activeSandboxTab}`}
                          style={{ fontSize: '11px' }}
                          dangerouslySetInnerHTML={{
                            __html: getHighlightedCode(
                              codeSnippets[activeCategory][activeOperation][activeSandboxTab],
                              activeSandboxTab === "curl" ? "bash" : activeSandboxTab
                            )
                          }}
                        />
                      </pre>
                    </div>
                  ) : (
                    /* PLAYGROUND CONTENT */
                    <div className="flex flex-col flex-1 min-h-0 p-5 space-y-4 overflow-y-auto">
                      {/* Playground free calls notice */}
                      <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-[10px] text-violet-455 font-bold leading-relaxed">
                        💡 <strong>Web Playground Quota:</strong> {isId ? "Panggilan API dari halaman playground ini mendapatkan keuntungan 10 panggilan gratis harian pertama yang tidak memotong kuota harian Anda." : "API requests sent directly from this playground benefit from 10 free daily requests that do not deduct your main API hit limits."}
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                          <span>{isId ? "Playground hit hari ini" : "Playground hits today"}: <strong className="text-white font-mono">{profile?.playgroundHitsCurrent || 0} / 10</strong></span>
                        </div>
                      </div>

                      {/* Playground Inputs Form */}
                      <div className="space-y-3.5">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Parameters / Payload Inputs</h4>
                        
                        {/* Render path parameters fields */}
                        {detailsMap[activeCategory][activeOperation].pathParams?.map((p) => (
                          <div key={p.field} className="space-y-1">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">{p.field} <span className="text-rose-500">*</span> <span className="text-[8px] text-slate-650 font-normal">({p.type} in path)</span></span>
                            <input
                              type="text"
                              required
                              placeholder={p.field === "id" ? "e.g. clx9xyz12" : "Enter path value"}
                              value={playgroundInputs[p.field] || ""}
                              onChange={(e) => setPlaygroundInputs(prev => ({ ...prev, [p.field]: e.target.value }))}
                              className="w-full h-8 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 outline-none focus:border-violet-500 transition-all font-mono"
                            />
                          </div>
                        ))}

                        {/* Render request body fields */}
                        {detailsMap[activeCategory][activeOperation].body?.map((b) => (
                          <div key={b.field} className="space-y-1">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              {b.field} {b.required && <span className="text-rose-500">*</span>} <span className="text-[8px] text-slate-655 font-normal">({b.type} in body)</span>
                            </span>
                            {b.type === "boolean" ? (
                              <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                                <input
                                  type="checkbox"
                                  checked={playgroundInputs[b.field] === "true" || playgroundInputs[b.field] === true}
                                  onChange={(e) => setPlaygroundInputs(prev => ({ ...prev, [b.field]: e.target.checked ? "true" : "false" }))}
                                  className="w-3.5 h-3.5 rounded border border-slate-800 bg-slate-900 checked:bg-violet-600 transition-all cursor-pointer"
                                />
                                <span className="text-xs text-slate-350 font-medium">True</span>
                              </label>
                            ) : (
                              <input
                                type={b.type === "number" ? "number" : "text"}
                                placeholder={
                                  b.field === "url" || b.field === "targetUrl" ? "e.g. https://google.com" :
                                  b.field === "customizedUrl" ? "e.g. google-alias" :
                                  b.field === "name" ? "e.g. My QR Name" : `Enter ${b.field}`
                                }
                                value={playgroundInputs[b.field] || ""}
                                onChange={(e) => setPlaygroundInputs(prev => ({ ...prev, [b.field]: e.target.value }))}
                                className="w-full h-8 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 outline-none focus:border-violet-500 transition-all font-mono"
                              />
                            )}
                          </div>
                        ))}

                        {/* Exec Button */}
                        <button
                          type="button"
                          onClick={handleRunPlayground}
                          disabled={executingRequest}
                          className="w-full py-2 bg-violet-650 hover:bg-violet-750 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all select-none shadow-md shadow-violet-950/20 active:scale-98 flex items-center justify-center gap-2"
                        >
                          {executingRequest ? (
                            <>
                              <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
                              {isId ? "Mengirim..." : "Sending..."}
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" />
                              {isId ? "Jalankan Panggilan API" : "Run Request"}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Response block output */}
                      {playgroundResponse && (
                        <div className="space-y-2 border-t border-slate-900 pt-4 flex-1 flex flex-col min-h-[150px]">
                          <div className="flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Response Output</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black font-mono ${playgroundResponse.status >= 200 && playgroundResponse.status < 300 ? "bg-emerald-500/10 text-emerald-450" : "bg-rose-500/10 text-rose-450"}`}>
                              {playgroundResponse.status} {playgroundResponse.statusText}
                            </span>
                          </div>
                          <pre className="language-json flex-grow bg-slate-900/50 border border-slate-900 rounded-xl p-3 overflow-auto font-mono text-[11px] leading-relaxed text-slate-350 select-all max-h-[250px]" style={{ fontSize: '11px' }}>
                            <code
                              className="language-json"
                              style={{ fontSize: '11px' }}
                              dangerouslySetInnerHTML={{
                                __html: getHighlightedCode(
                                  JSON.stringify(playgroundResponse.data, null, 2),
                                  "json"
                                )
                              }}
                            />
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplyModal(false)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative z-10"
            >
              {/* Modal Head */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <FontAwesomeIcon icon={faPaperPlane} className="text-violet-600 dark:text-violet-400" />
                    {isId ? "Aktifkan API Developer" : "Enable Developer API"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isId
                      ? "Lengkapi data di bawah ini untuk mengaktifkan kunci API secara langsung."
                      : "Fill in the details below to activate your API key instantly."}
                  </p>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleApply} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-300 block uppercase tracking-wider">
                    {isId ? "Tujuan Penggunaan" : "Usage Purpose"} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={4}
                    placeholder={
                      isId
                        ? "Jelaskan dengan detail untuk apa API ini digunakan (contoh: Integrasi bot WhatsApp, otomatisasi CMS, dll.)."
                        : "Describe in detail what you plan to build with this API (e.g. WhatsApp Bot, CMS automation integration, etc.)."
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-all font-sans resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-300 block uppercase tracking-wider">
                    {isId ? "Bukti / Dokumen Proyek (Proof)" : "Project Proof / Link / Document"}
                  </label>
                  <input
                    type="text"
                    value={projectProof}
                    onChange={(e) => setProjectProof(e.target.value)}
                    placeholder={
                      isId
                        ? "URL repository GitHub, demo web, PDF, atau keterangan tambahan."
                        : "GitHub repo URL, web demo link, PDF or additional text evidence."
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-650 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-all font-sans"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors"
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApply}
                    className="px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {submittingApply ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3.5 h-3.5" />
                        {isId ? "Mengaktifkan..." : "Activating..."}
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                        {isId ? "Aktifkan Sekarang" : "Activate Now"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Regenerate Key Modal */}
      <AnimatePresence>
        {showRegenModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegenModal(false)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-6 space-y-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 border border-amber-200 dark:border-amber-900/50">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                  {isId ? "Buat Ulang API Key Anda?" : "Regenerate API Key?"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {isId
                    ? "Tindakan ini akan menonaktifkan API Key Anda yang sekarang dengan segera. Semua backend terintegrasi yang menggunakan API Key lama akan gagal melakukan request."
                    : "This will revoke your existing developer credentials immediately. Any connected apps using the old key will stop working immediately."}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRegenModal(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button
                  onClick={handleRegenerateKey}
                  disabled={regenerating}
                  className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {regenerating ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3.5 h-3.5" />
                      {isId ? "Membuat Ulang..." : "Regenerating..."}
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                      {isId ? "Ya, Buat Ulang" : "Yes, Regenerate"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
