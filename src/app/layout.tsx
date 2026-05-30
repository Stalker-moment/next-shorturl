// app/layout.tsx
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "./Providers"; // Sesuaikan path jika perlu
import './globals.css'; // Asumsi Anda punya file CSS global

const plusJakarta = Plus_Jakarta_Sans({ 
 subsets: ["latin"],
 variable: "--font-plus-jakarta",
 display: "swap"
});

export const metadata = {
 title: 'nyoo.me - Bikin Link Lebih Catchy!',
 description: 'Pusat manajemen link cerdas, halaman bio sosial, dan kode QR.',
}

export default function RootLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return (
 <html lang="id" suppressHydrationWarning className={plusJakarta.variable}>
 <body suppressHydrationWarning className="font-sans antialiased text-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-slate-200">
 <Providers> {/* Bungkus children dengan Providers */}
 {children}
 </Providers>
 </body>
 </html>
 )
}