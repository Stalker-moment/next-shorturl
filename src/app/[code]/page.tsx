// File: src/app/[code]/page.tsx
'use client';

import { useEffect } from 'react';

type PageProps = {
  params: {
    code: string;
  };
};

export default function Page({ params }: PageProps) {
  const { code } = params;

  useEffect(() => {
    const resolveUrl = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resolve-url/${code}`);

      if (!res.ok) {
        window.location.href = '/404';
        return;
      }

      const data = await res.json();

      if (data.useLanding) {
        window.location.href = `/confirm/${code}`;
      } else {
        window.location.href = data.url;
      }
    };

    resolveUrl();
  }, [code]);

  return null;
}
