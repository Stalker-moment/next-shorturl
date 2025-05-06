// pages/confirm/example.tsx (contoh)
import React from 'react';
import ConfirmationCard from '@/components/card'; // Pastikan path ini sesuai dengan struktur folder Anda'
import Head from 'next/head';

const ConfirmPage: React.FC = () => {
  // Dapatkan URL dari query parameter, context, atau state lain
  // Contoh sederhana:
  const targetUrl = "https://example.com";

  return (
    <>
      <Head>
        <title>Are you sure?</title>
      </Head>
      {/* Pastikan layout parent memiliki styling untuk centering jika perlu */}
      {/* Body di _app.tsx atau layout parent bisa diatur: */}
      {/* className="grid place-items-center min-h-screen bg-gradient-..." */}
      <div className="grid place-items-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900 p-4 overflow-hidden">
         {/* Panggil komponennya */}
         <ConfirmationCard url={targetUrl} />
      </div>
    </>
  );
};

export default ConfirmPage;

// Jika Anda perlu mendapatkan URL dari server-side:
// export async function getServerSideProps(context) {
//   const { slug } = context.query; // Atau cara lain mendapatkan URL
//   const targetUrl = `https://${slug.join('/')}`; // Contoh logika
//   return {
//     props: { targetUrl },
//   }
// }
// Lalu di komponen page:
// const ConfirmPage: React.FC<{ targetUrl: string }> = ({ targetUrl }) => { ... }