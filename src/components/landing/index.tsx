"use client";

// components/LandingUrlShortener.tsx
import React, { useState, FormEvent, useCallback, useMemo, ChangeEvent, useEffect } from 'react';
import Link from 'next/link'; // Make sure Link is imported
import Image from 'next/image'; // Assuming Next.js Image optimization
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLink, faCopy, faCheck, faSpinner, faExclamationTriangle,
    faArrowRight, faCalendarAlt, faGlobe, faShieldAlt,
    faCog // Added icon for Manage button
} from '@fortawesome/free-solid-svg-icons';

// --- Constants ---
const API_ENDPOINT_CREATE = "/api/guest/create";
const API_ENDPOINT_SETTING = "/api/guest/setting";
const COPY_TIMEOUT_MS = 2000;

// --- Type Definitions ---
interface ApiSuccessResponse {
    id: string; // This is the ID we need for the manage link
    url: string; // Original URL
    shortUrl: string; // The short ID/slug
    title: string | null;
    description: string | null;
    logo: string | null; // URL to the logo image
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    useLanding: string; // String "true" or "false"
}

interface ApiErrorResponse {
    error: string;
}

// --- Helper Functions ---
const isValidUrl = (url: string): boolean => {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

const formatDate = (dateString: string): string => {
    try {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short', // Use short month for brevity
            day: 'numeric',
        }).format(new Date(dateString));
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Invalid Date";
    }
};


// --- Child Component for Result Display ---
interface ShortUrlResultProps {
    data: ApiSuccessResponse;
    onError: (message: string | null) => void; // For copy errors
}

const ShortUrlResult: React.FC<ShortUrlResultProps> = React.memo(({ data, onError }) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [isProtectModeEnabled, setIsProtectModeEnabled] = useState<boolean>(data.useLanding === 'true');
    const [isUpdatingSetting, setIsUpdatingSetting] = useState<boolean>(false);
    const [settingError, setSettingError] = useState<string | null>(null);

    // Destructure id along with other fields
    const { id, shortUrl, title, logo, url: originalUrl, createdAt } = data;

    // Sync local state if prop changes externally
    useEffect(() => {
        setIsProtectModeEnabled(data.useLanding === 'true');
    }, [data.useLanding]);

    const fullShortUrl = useMemo(() => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/${shortUrl}`;
        }
        return `/${shortUrl}`;
    }, [shortUrl]);

    const handleCopy = useCallback(async () => {
        if (!navigator.clipboard) {
            onError('Clipboard API not available. Please copy manually.');
            console.warn('Clipboard API not supported or context is not secure.');
            return;
        }
        try {
            await navigator.clipboard.writeText(fullShortUrl);
            setIsCopied(true);
            onError(null); // Clear parent's copy error on success
            setTimeout(() => setIsCopied(false), COPY_TIMEOUT_MS);
        } catch (err) {
            console.error('Failed to copy URL:', err);
            onError('Failed to copy URL. Please try again or copy manually.');
            setIsCopied(false);
        }
    }, [fullShortUrl, onError]);

    const formattedDate = useMemo(() => formatDate(createdAt), [createdAt]);

    // Handler for toggling Protect Mode
    const handleToggleProtectMode = useCallback(async () => {
        setIsUpdatingSetting(true);
        setSettingError(null);
        const newUseLandingValue = !isProtectModeEnabled;

        try {
            const response = await fetch(API_ENDPOINT_SETTING, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ code: data.shortUrl, useLanding: newUseLandingValue }),
            });

            if (response.ok) {
                setIsProtectModeEnabled(newUseLandingValue);
                // Optionally: Call a function passed via props to update parent state if needed
                // onSuccessUpdate?.(newUseLandingValue);
            } else {
                let errorMsg = `Failed to update setting (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = (errorData as ApiErrorResponse)?.error || errorMsg;
                } catch {
                     errorMsg = response.statusText || errorMsg;
                }
                throw new Error(errorMsg);
            }
        } catch (err: unknown) {
            console.error("Error updating setting:", err);
            const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setSettingError(`Update failed: ${message}`);
            // Keep the visual state as is, letting the error message indicate failure
        } finally {
            setIsUpdatingSetting(false);
        }
    }, [isProtectModeEnabled, data.shortUrl]); // Dependencies

    return (
        <div
            className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md transition-all duration-300 ease-in-out overflow-hidden"
            aria-live="polite"
        >
            {/* Top Section: Short URL & Copy */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your shortened link:</p>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <a
                        href={fullShortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-grow text-blue-600 dark:text-blue-400 font-semibold break-all hover:underline text-base sm:text-lg text-left w-full sm:w-auto"
                        aria-label={`Shortened link: ${fullShortUrl}`}
                    >
                        {fullShortUrl}
                    </a>
                    <button
                        onClick={handleCopy}
                        className={`flex items-center shrink-0 gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out transform active:scale-95 ${
                            isCopied
                                ? 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
                        }`}
                        aria-label={isCopied ? "URL Copied" : "Copy short URL"}
                    >
                        <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className={`h-4 w-4 ${isCopied ? 'text-green-600 dark:text-green-400' : ''}`} />
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>
            </div>

            {/* Middle Section: Metadata */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">Original Link Details:</p>
                <div className="flex items-start gap-4">
                    {logo && (
                        <div className="shrink-0">
                            <Image
                                src={logo}
                                alt={title ? `${title} Logo` : 'Website Logo'}
                                width={48}
                                height={48}
                                className="rounded border border-gray-200 dark:border-gray-600 object-contain bg-white" // Added white bg for transparent logos
                                unoptimized={true} // Use if external domain or no next.config setup
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                    )}
                    <div className="flex-grow space-y-1 text-sm min-w-0"> {/* Added min-w-0 for truncation */}
                        {title && (
                            <p className="font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate" title={title}>
                                {title}
                            </p>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faGlobe} className="w-3.5 h-3.5 shrink-0" />
                            <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block" title={originalUrl}>
                                {originalUrl}
                            </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs pt-1">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 shrink-0" />
                            <span>Created: {formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Actions (Protect Mode & Manage) */}
            <div className="p-4 space-y-4">
                {/* Protect Mode Row */}
                <div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Protect Mode
                            </span>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isProtectModeEnabled}
                            onClick={handleToggleProtectMode}
                            disabled={isUpdatingSetting}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 ${
                                isProtectModeEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                            } ${isUpdatingSetting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            aria-label={`Toggle Protect Mode ${isProtectModeEnabled ? 'off' : 'on'}`}
                        >
                            {isUpdatingSetting && (
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white/80 animate-spin"
                                />
                            )}
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                                    isProtectModeEnabled ? 'translate-x-6' : 'translate-x-1'
                                } ${isUpdatingSetting ? 'opacity-0' : 'opacity-100'}`}
                            />
                        </button>
                    </div>
                    {settingError && (
                        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3" />
                            {settingError}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Enable to show a preview page before redirection.
                    </p>
                </div>

                {/* Manage Link Row */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href={`/manage/${id}`} // Use the ID from the data prop
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                        aria-label={`Manage link with ID ${id}`} // Added aria-label for accessibility
                    >
                        <FontAwesomeIcon icon={faCog} className="w-4 h-4" />
                        <span>Manage this Link</span>
                    </Link>
                     <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        View stats and edit settings (requires login for full access).
                     </p>
                </div>
            </div>
        </div>
    );
});
ShortUrlResult.displayName = 'ShortUrlResult'; // Helps in React DevTools


// --- Main Landing Page Shortener Component ---
const LandingUrlShortener: React.FC = () => {
    const [longUrl, setLongUrl] = useState<string>('');
    const [shortenedUrlData, setShortenedUrlData] = useState<ApiSuccessResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [copyError, setCopyError] = useState<string | null>(null); // For copy feedback/errors

    const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setCopyError(null);
        setShortenedUrlData(null);

        const trimmedUrl = longUrl.trim();
        if (!trimmedUrl) {
            setError('Please enter a URL to shorten.');
            setIsLoading(false);
            return;
        }
        if (!isValidUrl(trimmedUrl)) {
            setError('Please provide a valid URL including http:// or https://');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(API_ENDPOINT_CREATE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ url: trimmedUrl }),
            });

            const contentType = response.headers.get("content-type");
            if (!response.ok || !contentType || !contentType.includes("application/json")) {
                let errorMsg = `Request failed (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = (errorData as ApiErrorResponse)?.error || errorMsg;
                } catch { errorMsg = response.statusText || errorMsg; }
                throw new Error(errorMsg);
            }

            const data = await response.json() as ApiSuccessResponse;
            // Validate essential fields received from API
            if (data.shortUrl && data.id && data.url && data.createdAt && typeof data.useLanding === 'string') {
                setShortenedUrlData(data);
                 // Optionally clear the input after successful shortening
                 // setLongUrl('');
            } else {
                console.error("Incomplete data received:", data);
                throw new Error("Incomplete or invalid data received from server.");
            }
        } catch (err: unknown) {
            console.error("Shortening Error:", err);
            const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
            setError(`${message}`); // Removed "Error: " prefix for cleaner display
            setShortenedUrlData(null);
        } finally {
            setIsLoading(false);
        }
    }, [longUrl]); // Dependency array

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setLongUrl(e.target.value);
        if (error) setError(null);
        if (copyError) setCopyError(null);
        if (shortenedUrlData) setShortenedUrlData(null); // Clear result when typing new URL
    }, [error, copyError, shortenedUrlData]); // Dependencies

    return (
        <div className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-slate-900 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4 tracking-tight">
                    Shorten Links, <span className="text-indigo-500 dark:text-indigo-400">Expand Reach</span>
                </h1>

                <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
                    Create short, powerful links in seconds. Paste your long URL below to get started instantly.
                </p>

                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto" noValidate>
                   <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900 transition-all duration-200">
                        <div className="relative flex-grow w-full">
                            <FontAwesomeIcon
                                icon={faLink}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none"
                            />
                            <input
                                type="url"
                                value={longUrl}
                                onChange={handleInputChange}
                                placeholder="Paste your long URL here..."
                                required
                                className="w-full pl-12 pr-4 py-3 text-base sm:text-lg bg-transparent border-none focus:ring-0 outline-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-60"
                                disabled={isLoading}
                                aria-label="Long URL input"
                                aria-describedby={error ? "form-error-message" : undefined}
                                aria-invalid={!!error}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !longUrl.trim()}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.03] active:scale-[0.97] shrink-0 font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin h-5 w-5" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Shorten</span>
                                    <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Form Creation Error */}
                {error && (
                    <div
                        id="form-error-message"
                        className="mt-4 max-w-2xl mx-auto p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center justify-center gap-2 transition-opacity duration-300"
                        role="alert"
                        aria-live="assertive"
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 shrink-0"/>
                        <span>{error}</span>
                    </div>
                )}

                 {/* Copy Operation Feedback/Error */}
                 {copyError && !error && (
                    <div
                        className="mt-4 max-w-2xl mx-auto p-3 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-400 dark:border-yellow-600/50 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm flex items-center justify-center gap-2 transition-opacity duration-300"
                        role="alert"
                        aria-live="polite"
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 shrink-0"/>
                        <span>{copyError}</span>
                    </div>
                )}

                {/* Result Display Area */}
                {shortenedUrlData && !isLoading && !error && (
                     <div className="mt-8 max-w-2xl mx-auto animate-fade-in"> {/* Added subtle fade-in animation */}
                        <ShortUrlResult data={shortenedUrlData} onError={setCopyError} />
                    </div>
                )}

                {/* Auth Prompt */}
                 <div className="mt-16 text-center">
                    <p className="text-base text-gray-600 dark:text-gray-400">
                        Need more features like tracking and custom links?
                    </p>
                    <div className="mt-3 space-x-4">
                        <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
                            Log In
                        </Link>
                        <span className="text-gray-400 dark:text-gray-500">or</span>
                        <Link href="/signup" className="inline-block px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors text-sm">
                            Create Free Account
                        </Link>
                    </div>
                </div>

            </div> {/* End max-w-4xl */}
        </div> // End Section Container
    );
};

// Add this to your global CSS or Tailwind config if you haven't already
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
*/

export default LandingUrlShortener;