'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const RedirectPage = () => {
  const router = useRouter();
  const pathname = usePathname(); // /abc123
  const code = pathname?.split('/')[1]; // Ambil kode dari URL path

  useEffect(() => {
    const resolveUrl = async () => {
      if (!code) return;

      const res = await fetch(`/api/resolve-url/${code}`);
      if (!res.ok) {
        router.replace('/404');
        return;
      }

      const data = await res.json();

      if (data.useLanding) {
        router.replace(`/confirm/${code}`);
      } else {
        window.location.href = data.url;
      }
    };

    resolveUrl();
  }, [code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-800 p-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Redirecting...</h1>
    </div>
  );
};

export default RedirectPage;