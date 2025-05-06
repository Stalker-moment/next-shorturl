// src/app/[code]/page.tsx
import { redirect } from 'next/navigation';

type PageProps = {
  params: {
    code: string;
  };
};

export default async function Page({ params }: PageProps) {
  const { code } = params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resolve-url/${code}`);
  if (!res.ok) {
    redirect('/404');
  }

  const data = await res.json();

  if (data.useLanding) {
    redirect(`/confirm/${code}`);
  } else {
    redirect(data.url);
  }
}