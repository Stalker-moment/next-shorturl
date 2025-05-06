"use client"; // Required for hooks

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faCalendarAlt,
  faGlobe,
  faArrowLeft,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";

// --- Type Definitions ---
// Describes the actual link data structure inside the 'data' field
interface ApiLinkDetail {
  id: string;
  url: string;
  shortUrl: string;
  title: string | null;
  description: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
  useLanding: string; // Keep as string to match API response
}

// Describes the overall API response structure for fetching a link
interface ApiFetchResponse {
  message: string;
  data: ApiLinkDetail; // The link details are nested here
}

// Standard error response structure
interface ApiErrorResponse {
  error: string;
  message?: string; // Optional message field in error response
}

// --- Helper Functions ---
const formatDate = (dateString: string): string => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return "Invalid Date";
  }
};

const COPY_TIMEOUT_MS = 2000;

// --- API Endpoint Placeholders ---
// !! Replace with your actual API endpoints !!
const getApiEndpointForLink = (id: string) => `/api/links/${id}`; // Example: GET
const getApiEndpointForSetting = (id: string) => `/api/links/${id}/setting`; // Example: POST/PATCH

// --- Main Page Component ---
export default function ManageLinkPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // State now uses ApiLinkDetail for the actual data
  const [linkData, setLinkData] = useState<ApiLinkDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isProtectModeEnabled, setIsProtectModeEnabled] =
    useState<boolean>(false);
  const [isUpdatingSetting, setIsUpdatingSetting] = useState<boolean>(false);
  const [settingError, setSettingError] = useState<string | null>(null);
  const [settingSuccess, setSettingSuccess] = useState<string | null>(null);

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // 1. Fetch Data Link Awal
  useEffect(() => {
    if (!id) {
      setError("Link ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchLinkData = async () => {
      setIsLoading(true);
      setError(null);
      setLinkData(null);

      try {
        // !! Add Authentication headers if your API requires it !!
        // const headers = { 'Authorization': `Bearer ${token}` };
        const response = await fetch(getApiEndpointForLink(id), {
          method: "GET",
          // headers: headers,
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
          let errorMsg = `Failed to load link data (${response.status})`;
          if (contentType && contentType.includes("application/json")) {
            const errorData: ApiErrorResponse = await response
              .json()
              .catch(() => ({}));
            errorMsg = errorData.error || errorData.message || errorMsg;
          } else {
            errorMsg = response.statusText || errorMsg;
          }
          throw new Error(errorMsg);
        }

        if (contentType && contentType.includes("application/json")) {
          // Parse the structured response
          const result: ApiFetchResponse = await response.json();

          // Extract the 'data' field and set state
          if (result.data) {
            setLinkData(result.data);
            setIsProtectModeEnabled(result.data.useLanding === "true");
          } else {
            throw new Error(
              "API response successful, but 'data' field is missing."
            );
          }
        } else {
          throw new Error(`Unexpected content type received: ${contentType}`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An unknown network error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkData();
  }, [id]);

  // 2. Handler for Update Setting (Protect Mode)
  const handleToggleProtectMode = useCallback(
    async (newCheckedState: boolean) => {
      if (!linkData) return; // Should not happen if UI is enabled

      setIsUpdatingSetting(true);
      setSettingError(null);
      setSettingSuccess(null);

      try {
        // !! Add Authentication headers if needed !!
        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        const response = await fetch(getApiEndpointForSetting(linkData.id), {
          method: "POST", // Or PATCH/PUT depending on your API
          headers: headers,
          body: JSON.stringify({ useLanding: newCheckedState }),
        });

        if (!response.ok) {
          let errorMsg = `Failed to update setting (${response.status})`;
          try {
            // Attempt to parse JSON error response
            const errorData: ApiErrorResponse = await response.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch {
            errorMsg = response.statusText || errorMsg;
          } // Fallback
          throw new Error(errorMsg);
        }

        // Assuming success if response.ok is true
        setIsProtectModeEnabled(newCheckedState);
        // Optional: Refetch or update linkData if API returns updated object
        setSettingSuccess("Setting updated successfully!");
        setTimeout(() => setSettingSuccess(null), 3000);
      } catch (err: unknown) {
        console.error("Error updating setting:", err);
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setSettingError(`Update failed: ${message}`);
      } finally {
        setIsUpdatingSetting(false);
      }
    },
    [linkData]
  ); // Depends on linkData to get the ID

  // 3. Handler for Copy Short URL
  const fullShortUrl = useMemo(() => {
    if (!linkData || typeof window === "undefined") return "";
    return `${window.location.origin}/${linkData.shortUrl}`;
  }, [linkData]);

  const handleCopy = useCallback(async () => {
    if (!fullShortUrl || !navigator.clipboard) {
      setCopyError("Cannot copy URL at this moment.");
      return;
    }
    try {
      await navigator.clipboard.writeText(fullShortUrl);
      setIsCopied(true);
      setCopyError(null);
      setTimeout(() => setIsCopied(false), COPY_TIMEOUT_MS);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyError("Failed to copy URL.");
      setIsCopied(false);
    }
  }, [fullShortUrl]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 dark:text-gray-400">
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin h-8 w-8 mr-3"
        />
        Loading link details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back
        </button>
        <div className="p-6 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600/50 rounded-lg max-w-md mx-auto">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="h-12 w-12 text-red-500 mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Error Loading Link
          </h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!linkData) {
    // Should ideally not be reached if loading and error states are handled
    return (
      <div className="container mx-auto px-4 py-10 text-center text-gray-500">
        Link data could not be loaded.
      </div>
    );
  }

  // --- Render Page Content ---
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Manage Link
          </h1>
        </div>
        <a
          href={fullShortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 text-sm font-medium transition-colors"
          title={`Visit ${fullShortUrl}`}
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3.5 h-3.5" />
          Visit Link
        </a>
      </div>

      {/* Card: Main Details */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden mb-8 border border-gray-200 dark:border-gray-700">
        <div className="p-5 sm:p-6">
          {/* Short URL & Copy */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Short Link
              </p>
              <a
                href={fullShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl sm:text-2xl font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {fullShortUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center shrink-0 gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out ${
                isCopied
                  ? "bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label={isCopied ? "URL Copied" : "Copy short URL"}
            >
              <FontAwesomeIcon
                icon={isCopied ? faCheck : faCopy}
                className={`h-4 w-4 ${
                  isCopied ? "text-green-600 dark:text-green-400" : ""
                }`}
              />
              <span>{isCopied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
          {copyError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {copyError}
            </p>
          )}

          {/* Original URL & Metadata */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              {linkData.logo && (
                <Image
                  src={linkData.logo}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded border border-gray-200 dark:border-gray-600 object-contain bg-white mt-0.5"
                  unoptimized={true}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
                {linkData.title && (
                  <p
                    className="font-medium text-gray-800 dark:text-gray-100 truncate mb-0.5"
                    title={linkData.title}
                  >
                    {linkData.title}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon
                    icon={faGlobe}
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  <a
                    href={linkData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate block"
                    title={linkData.url}
                  >
                    {linkData.url}
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-gray-500 dark:text-gray-400 text-xs">
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="w-3 h-3 shrink-0"
                />
                <span>Created: {formatDate(linkData.createdAt)}</span>
              </div>
              {linkData.createdAt !== linkData.updatedAt && (
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    className="w-3 h-3 shrink-0"
                  />
                  <span>Updated: {formatDate(linkData.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card: Settings */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold px-5 py-4 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white">
          Link Settings
        </h2>
        <div className="p-5 sm:p-6 space-y-5">
          {/* Protect Mode Setting */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <label
                  htmlFor="protect-mode-switch"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Protect Mode (Landing Page)
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Show a preview page before redirecting visitors.
                </p>
              </div>
              <button
                id="protect-mode-switch"
                type="button"
                role="switch"
                aria-checked={isProtectModeEnabled}
                onClick={() => handleToggleProtectMode(!isProtectModeEnabled)}
                disabled={isUpdatingSetting}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 ${
                  isProtectModeEnabled
                    ? "bg-indigo-600"
                    : "bg-gray-300 dark:bg-gray-600"
                } ${
                  isUpdatingSetting
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                aria-label="Toggle Protect Mode"
              >
                {isUpdatingSetting && (
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white/80 animate-spin"
                  />
                )}
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                    isProtectModeEnabled ? "translate-x-6" : "translate-x-1"
                  } ${isUpdatingSetting ? "opacity-0" : "opacity-100"}`}
                />
              </button>
            </div>
            {/* Feedback Messages for Setting Update */}
            {settingError && (
              <p
                role="alert"
                className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="w-3 h-3"
                />
                {settingError}
              </p>
            )}
            {settingSuccess && (
              <p
                role="status"
                className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                {settingSuccess}
              </p>
            )}
          </div>

          {/* --- Placeholder for Future Settings --- */}
        </div>
      </div>
    </div>
  );
}
