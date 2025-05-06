// pages/index.tsx
import React from 'react';
import Head from 'next/head';
import UrlShortenerForm from '@/components/landing'; // Pastikan path ini sesuai dengan struktur folder Anda

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>URL Shortener - Shorten Your Links</title>
        <meta name="description" content="A simple and fast URL shortener." />
      </Head>
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-800 p-4">
        <UrlShortenerForm />
      </main>
    </>
  );
};

export default HomePage;