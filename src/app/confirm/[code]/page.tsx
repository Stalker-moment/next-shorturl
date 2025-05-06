// app/confirm/[code]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ConfirmationCard from '@/components/card'; // Adjust import path
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';


const ConfirmRedirectPage: React.FC = () => {
  const params = useParams();
  const code = params?.code as string;

  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Invalid confirmation link.");
      setIsLoading(false);
      return;
    }

    const fetchUrlInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/url-info/${code}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch URL info (${response.status})`);
        }

        if (!data.originalUrl) {
            throw new Error("Original URL not found in API response.");
        }

        setTargetUrl(data.originalUrl);

      } catch (err: unknown) {
        console.error("Failed to fetch target URL:", err);
        if (err instanceof Error) {
          setError(err.message || "Could not load redirection details.");
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrlInfo();
  }, [code]); // Depend on 'code'

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="grid place-items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
         <div className="text-center text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl mb-4" />
            <p>Loading confirmation...</p>
         </div>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
       <div className="grid place-items-center min-h-screen bg-red-100 dark:bg-red-900/50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center max-w-md">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-red-700 dark:text-red-300">Error</h1>
                <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
                {/* Optional: Link back home */}
                {/* <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">Go Home</a> */}
            </div>
        </div>
    );
  }

  // --- Render Confirmation Card (Success State) ---
  if (targetUrl) {
    return (
      <>
        <Head>
          <title>Are you sure?</title> {/* Update title */}
        </Head>
        <div className="grid place-items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900 p-4 overflow-hidden">
          <ConfirmationCard url={targetUrl} />
        </div>
      </>
    );
  }

  // Fallback if targetUrl is somehow null after loading/no error (shouldn't happen)
  return null;
};

export default ConfirmRedirectPage;