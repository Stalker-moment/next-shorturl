// app/api-docs/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faKey, 
    faLink, 
    faQrcode, 
    faListUl, 
    faBook, 
    faPlay, 
    faCopy, 
    faCheck, 
    faSpinner, 
    faTerminal,
    faLock
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

type EndpointId = 'overview' | 'auth' | 'shorten' | 'list' | 'qrcode';
type CodeLang = 'curl' | 'js' | 'python';

interface EndpointSpec {
    id: EndpointId;
    icon: any;
    method: 'GET' | 'POST' | 'DELETE' | 'NONE';
    path: string;
    title: { en: string; id: string };
    desc: { en: string; id: string };
    params?: { name: string; type: string; required: boolean; desc: { en: string; id: string } }[];
    code: {
        curl: string;
        js: string;
        python: string;
    };
    response: any;
}

const ENDPOINTS: EndpointSpec[] = [
    {
        id: 'overview',
        icon: faBook,
        method: 'NONE',
        path: '',
        title: {
            en: 'Overview & Sandbox',
            id: 'Ringkasan & Sandbox'
        },
        desc: {
            en: 'The nyoo.me REST API allows you to programmatically shorten links, manage dynamic QR codes, and fetch link analytics. All requests are securely routed through HTTPS and return JSON-formatted responses.',
            id: 'REST API nyoo.me memungkinkan Anda memprogram pemendekan link, mengelola kode QR dinamis, dan mengambil analitik link. Semua permintaan dikirim secara aman melalui HTTPS dan mengembalikan respons berformat JSON.'
        },
        code: {
            curl: `# Get started by checking the API status\ncurl -X GET "https://nyoo.me/api/v1/status"`,
            js: `// Check system status\nfetch("https://nyoo.me/api/v1/status")\n  .then(res => res.json())\n  .then(data => console.log(data));`,
            python: `import requests\n\n# Check API Status\nresponse = requests.get("https://nyoo.me/api/v1/status")\nprint(response.json())`
        },
        response: {
            status: "online",
            version: "v1.0.0",
            message: "nyoo.me API services are fully operational"
        }
    },
    {
        id: 'auth',
        icon: faKey,
        method: 'NONE',
        path: '',
        title: {
            en: 'Authentication',
            id: 'Otentikasi'
        },
        desc: {
            en: 'Authentication is managed via a private API Key. To obtain your API Key, navigate to your Account Settings in the user dashboard. Pass this token in your requests via the Authorization header using the Bearer scheme.',
            id: 'Otentikasi dikelola melalui API Key privat. Untuk mendapatkan API Key Anda, buka Pengaturan Akun di dashboard pengguna. Kirim token ini dalam permintaan Anda melalui header Authorization menggunakan skema Bearer.'
        },
        code: {
            curl: `curl -H "Authorization: Bearer YOUR_API_KEY" \\\n     "https://nyoo.me/api/v1/urls"`,
            js: `fetch("https://nyoo.me/api/v1/urls", {\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY"\n  }\n});`,
            python: `import requests\n\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY"\n}\nresponse = requests.get("https://nyoo.me/api/v1/urls", headers=headers)`
        },
        response: {
            authenticated: true,
            user: {
                id: "usr_99f2x8z",
                name: "John Doe",
                email: "john@example.com"
            }
        }
    },
    {
        id: 'shorten',
        icon: faLink,
        method: 'POST',
        path: '/v1/urls',
        title: {
            en: 'Shorten a URL',
            id: 'Perpendek URL'
        },
        desc: {
            en: 'Create a new shortened link pointing to a long destination URL. You can optionally request a custom alias (slug) and set an expiration time in days.',
            id: 'Buat tautan pendek baru yang mengarah ke URL tujuan panjang. Anda dapat meminta alias kustom (slug) secara opsional dan menetapkan masa aktif dalam hitungan hari.'
        },
        params: [
            { name: 'originalUrl', type: 'string', required: true, desc: { en: 'The long destination URL to redirect to.', id: 'URL tujuan panjang untuk dialihkan.' } },
            { name: 'customAlias', type: 'string', required: false, desc: { en: 'A custom text slug (e.g. "promo2026").', id: 'Teks slug kustom (contoh: "promo2026").' } },
            { name: 'expirationDays', type: 'number', required: false, desc: { en: 'Number of days before the link expires.', id: 'Jumlah hari sebelum link kedaluwarsa.' } }
        ],
        code: {
            curl: `curl -X POST "https://nyoo.me/api/v1/urls" \\\n     -H "Authorization: Bearer YOUR_API_KEY" \\\n     -H "Content-Type: application/json" \\\n     -d '{\n       "originalUrl": "https://google.com",\n       "customAlias": "googlesearch",\n       "expirationDays": 30\n     }'`,
            js: `fetch("https://nyoo.me/api/v1/urls", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    originalUrl: "https://google.com",\n    customAlias: "googlesearch",\n    expirationDays: 30\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
            python: `import requests\n\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json"\n}\ndata = {\n    "originalUrl": "https://google.com",\n    "customAlias": "googlesearch",\n    "expirationDays": 30\n}\nres = requests.post("https://nyoo.me/api/v1/urls", headers=headers, json=data)\nprint(res.json())`
        },
        response: {
            id: "url_58x92a7",
            originalUrl: "https://google.com",
            shortUrl: "https://nyoo.me/googlesearch",
            customAlias: "googlesearch",
            clicks: 0,
            expiresAt: "2026-06-23T23:59:59.000Z",
            createdAt: "2026-05-24T23:10:42.000Z"
        }
    },
    {
        id: 'list',
        icon: faListUl,
        method: 'GET',
        path: '/v1/urls',
        title: {
            en: 'List My URLs',
            id: 'Daftar URL Saya'
        },
        desc: {
            en: 'Retrieve a list of shortened links created by your account, sorted by date of creation.',
            id: 'Ambil daftar link pendek yang telah dibuat oleh akun Anda, diurutkan berdasarkan tanggal pembuatan.'
        },
        code: {
            curl: `curl -H "Authorization: Bearer YOUR_API_KEY" \\\n     "https://nyoo.me/api/v1/urls"`,
            js: `fetch("https://nyoo.me/api/v1/urls", {\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY"\n  }\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
            python: `import requests\n\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY"\n}\nres = requests.get("https://nyoo.me/api/v1/urls", headers=headers)\nprint(res.json())`
        },
        response: [
            {
                id: "url_58x92a7",
                originalUrl: "https://google.com",
                shortUrl: "https://nyoo.me/googlesearch",
                customAlias: "googlesearch",
                clicks: 142,
                createdAt: "2026-05-24T12:00:00.000Z"
            },
            {
                id: "url_72b38f1",
                originalUrl: "https://github.com",
                shortUrl: "https://nyoo.me/gitrepo",
                customAlias: "gitrepo",
                clicks: 89,
                createdAt: "2026-05-23T15:30:00.000Z"
            }
        ]
    },
    {
        id: 'qrcode',
        icon: faQrcode,
        method: 'POST',
        path: '/v1/qrcodes',
        title: {
            en: 'Create a QR Code',
            id: 'Buat Kode QR'
        },
        desc: {
            en: 'Generate a dynamic, customized QR Code linked to a specific target URL. You can optional specify design parameters such as primary color and logo URL.',
            id: 'Buat Kode QR dinamis kustom yang terhubung ke URL tujuan tertentu. Anda dapat secara opsional menentukan parameter desain seperti warna utama dan URL logo.'
        },
        params: [
            { name: 'name', type: 'string', required: true, desc: { en: 'Name of the QR Code for display.', id: 'Nama Kode QR untuk tampilan.' } },
            { name: 'targetUrl', type: 'string', required: true, desc: { en: 'Destination URL for the QR Code scans.', id: 'URL tujuan untuk hasil scan Kode QR.' } },
            { name: 'primaryColor', type: 'string', required: false, desc: { en: 'Hex color code (e.g. "#4F46E5").', id: 'Kode warna hex (contoh: "#4F46E5").' } }
        ],
        code: {
            curl: `curl -X POST "https://nyoo.me/api/v1/qrcodes" \\\n     -H "Authorization: Bearer YOUR_API_KEY" \\\n     -H "Content-Type: application/json" \\\n     -d '{\n       "name": "Restaurant Menu",\n       "targetUrl": "https://nyoo.me/menu",\n       "primaryColor": "#6D28D9"\n     }'`,
            js: `fetch("https://nyoo.me/api/v1/qrcodes", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    name: "Restaurant Menu",\n    targetUrl: "https://nyoo.me/menu",\n    primaryColor: "#6D28D9"\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
            python: `import requests\n\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json"\n}\ndata = {\n    "name": "Restaurant Menu",\n    "targetUrl": "https://nyoo.me/menu",\n    "primaryColor": "#6D28D9"\n}\nres = requests.post("https://nyoo.me/api/v1/qrcodes", headers=headers, json=data)\nprint(res.json())`
        },
        response: {
            id: "qr_28a9b3c",
            name: "Restaurant Menu",
            targetUrl: "https://nyoo.me/menu",
            qrImageUrl: "https://nyoo.me/qr-images/qr_28a9b3c.png",
            primaryColor: "#6D28D9",
            scans: 0,
            createdAt: "2026-05-24T23:10:42.000Z"
        }
    }
];

export default function ApiDocsPage() {
    const { language } = useLanguage();
    const [activeEndpoint, setActiveEndpoint] = useState<EndpointId>('overview');
    const [activeLang, setActiveLang] = useState<CodeLang>('curl');
    const [isTesting, setIsTesting] = useState(false);
    const [showResponse, setShowResponse] = useState(false);
    const [copied, setCopied] = useState(false);

    const activeSpec = ENDPOINTS.find(e => e.id === activeEndpoint) || ENDPOINTS[0];

    useEffect(() => {
        setShowResponse(false);
        setCopied(false);
    }, [activeEndpoint]);

    const handleCopy = () => {
        navigator.clipboard.writeText(activeSpec.code[activeLang]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRunTest = () => {
        setIsTesting(true);
        setShowResponse(false);
        setTimeout(() => {
            setIsTesting(false);
            setShowResponse(true);
        }, 800);
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden selection:bg-violet-100 dark:selection:bg-violet-500/30">
            <Navbar />

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[10%] left-[-10%] w-[45%] h-[45%] bg-violet-600/5 dark:bg-violet-600/3 rounded-full blur-[140px]" />
                <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] bg-indigo-600/5 dark:bg-indigo-600/3 rounded-full blur-[140px]" />
            </div>

            <main className="flex-grow pt-32 pb-24 relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="mb-14 text-center lg:text-left">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-xs font-bold tracking-wider uppercase mb-4 shadow-sm">
                            <FontAwesomeIcon icon={faTerminal} className="w-3.5 h-3.5" />
                            {language === 'en' ? 'Developer Documentation' : 'Dokumentasi Developer'}
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                            {language === 'en' ? 'Developer API Reference' : 'Referensi API Developer'}
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                            {language === 'en' 
                                ? 'Integrate custom shortened links and dynamic QR codes into your own platforms seamlessly.'
                                : 'Integrasikan tautan pendek kustom dan kode QR dinamis ke dalam platform Anda secara mulus.'
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left Column: sticky navigation */}
                        <div className="lg:col-span-3 sticky top-28 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 backdrop-blur-xl p-5 rounded-3xl shadow-sm space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
                                {language === 'en' ? 'Navigation' : 'Navigasi'}
                            </p>
                            {ENDPOINTS.map((endpoint) => {
                                const isActive = activeEndpoint === endpoint.id;
                                return (
                                    <button
                                        key={endpoint.id}
                                        onClick={() => setActiveEndpoint(endpoint.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all relative ${
                                            isActive 
                                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={endpoint.icon} className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{language === 'en' ? endpoint.title.en : endpoint.title.id}</span>
                                        {endpoint.method !== 'NONE' && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto ${
                                                endpoint.method === 'POST'
                                                    ? (isActive ? 'bg-violet-700 text-white' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400')
                                                    : (isActive ? 'bg-violet-700 text-white' : 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400')
                                            }`}>
                                                {endpoint.method}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Middle Column: details & specifications */}
                        <div className="lg:col-span-5 space-y-8 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-sm min-h-[500px]">
                            <div>
                                <div className="flex items-center gap-3.5 mb-4">
                                    <div className="w-11 h-11 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400">
                                        <FontAwesomeIcon icon={activeSpec.icon} className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">{language === 'en' ? activeSpec.title.en : activeSpec.title.id}</h2>
                                        {activeSpec.method !== 'NONE' && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                                    activeSpec.method === 'POST'
                                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                                }`}>
                                                    {activeSpec.method}
                                                </span>
                                                <span className="text-xs font-mono font-bold text-slate-500">{activeSpec.path}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                    {language === 'en' ? activeSpec.desc.en : activeSpec.desc.id}
                                </p>
                            </div>

                            {/* Parameters Section if present */}
                            {activeSpec.params && activeSpec.params.length > 0 && (
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                                        {language === 'en' ? 'Request Parameters' : 'Parameter Permintaan'}
                                    </h3>
                                    <div className="space-y-4">
                                        {activeSpec.params.map((param) => (
                                            <div key={param.name} className="flex gap-4 text-sm pb-4 border-b border-slate-100/50 dark:border-slate-800/50 last:border-b-0 last:pb-0">
                                                <div className="w-1/3 shrink-0">
                                                    <p className="font-mono font-bold text-slate-900 dark:text-white">{param.name}</p>
                                                    <div className="flex gap-1.5 mt-1 items-center">
                                                        <span className="text-[10px] font-medium text-slate-400">{param.type}</span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                                            param.required 
                                                                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' 
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                        }`}>
                                                            {param.required ? (language === 'en' ? 'required' : 'wajib') : (language === 'en' ? 'optional' : 'opsional')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-2/3">
                                                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
                                                        {language === 'en' ? param.desc.en : param.desc.id}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeSpec.id === 'auth' && (
                                <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl flex gap-3 text-amber-800 dark:text-amber-300">
                                    <FontAwesomeIcon icon={faLock} className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div className="text-xs leading-relaxed font-medium">
                                        <p className="font-bold m-0 mb-1">{language === 'en' ? 'Keep your Token Secure!' : 'Jaga Keamanan Token Anda!'}</p>
                                        <p className="m-0">
                                            {language === 'en' 
                                                ? 'Never expose your API Key in front-end client code. Always execute calls from secure server-side environments.'
                                                : 'Jangan pernah memaparkan API Key Anda di kode klien front-end. Selalu jalankan panggilan dari lingkungan server-side yang aman.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Code viewer & simulator console */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* Code Snippet Card */}
                            <div className="bg-slate-900 dark:bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col text-slate-300 font-mono text-xs">
                                
                                {/* Header / Selector tabs */}
                                <div className="bg-slate-950/80 p-4 border-b border-slate-800 flex justify-between items-center">
                                    <div className="flex gap-1.5">
                                        {(['curl', 'js', 'python'] as CodeLang[]).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => setActiveLang(lang)}
                                                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                                    activeLang === lang 
                                                        ? 'bg-slate-800 text-white border border-slate-700' 
                                                        : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                            >
                                                {lang === 'curl' ? 'cURL' : lang === 'js' ? 'JS Fetch' : 'Python'}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        onClick={handleCopy} 
                                        className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-all active:scale-95"
                                        title="Copy Snippet"
                                    >
                                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`w-4 h-4 ${copied ? 'text-emerald-500' : ''}`} />
                                    </button>
                                </div>

                                {/* Code display */}
                                <div className="p-5 overflow-x-auto min-h-[140px] max-h-[220px] bg-slate-900 text-slate-300 select-all leading-normal whitespace-pre">
                                    {activeSpec.code[activeLang]}
                                </div>
                            </div>

                            {/* Interactive Console Sandbox */}
                            <div className="bg-slate-900 dark:bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col text-slate-300 font-mono text-xs">
                                <div className="bg-slate-950/80 p-4 border-b border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Interactive Console</span>
                                    </div>
                                    <button 
                                        onClick={handleRunTest} 
                                        disabled={isTesting}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isTesting ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
                                                <span>Running</span>
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
                                                <span>{language === 'en' ? 'Test Request' : 'Tes Request'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="p-5 min-h-[160px] bg-slate-950/30 flex flex-col justify-center text-slate-400">
                                    <AnimatePresence mode="wait">
                                        {!isTesting && !showResponse && (
                                            <motion.div 
                                                key="idle"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="text-center py-6 text-slate-500 leading-normal"
                                            >
                                                <p className="mb-2">⚡ {language === 'en' ? 'Ready to sandbox' : 'Siap untuk sandbox'}</p>
                                                <p className="text-[10px] uppercase font-semibold">{language === 'en' ? 'Click "Test Request" to run API simulation.' : 'Klik "Tes Request" untuk menjalankan simulasi API.'}</p>
                                            </motion.div>
                                        )}

                                        {isTesting && (
                                            <motion.div 
                                                key="testing"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center py-6 gap-3"
                                            >
                                                <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-violet-500 animate-spin" />
                                                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Connecting to API Gateway...</span>
                                            </motion.div>
                                        )}

                                        {showResponse && !isTesting && (
                                            <motion.div 
                                                key="response"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="w-full flex flex-col"
                                            >
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-3 border-b border-slate-800 pb-2">
                                                    <span>STATUS: 200 OK</span>
                                                    <span>CONTENT-TYPE: JSON</span>
                                                </div>
                                                <pre className="text-[11px] text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed max-h-[220px]">
                                                    {JSON.stringify(activeSpec.response, null, 2)}
                                                </pre>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
