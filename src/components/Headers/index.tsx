// components/Header.tsx
"use client";

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function Header() {
 const { data: session, status } = useSession();

 return (
 <header className="bg-gray-800 text-white p-4">
 <nav className="container mx-auto flex justify-between items-center">
 <Link href="/" className="text-xl font-bold">MyApp</Link>
 <div>
 {status === 'loading' && <p>Memuat...</p>}
 {status === 'unauthenticated' && (
 <>
 <button
 onClick={() => signIn()}
 className="mr-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
 >
 Login
 </button>
 {/* Atau arahkan ke halaman login kustom Anda:
 <Link href="/login" className="mr-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
 Login
 </Link>
 */}
 </>
 )}
 {status === 'authenticated' && session?.user && (
 <div className="flex items-center">
 <Image
 src={session.user.image || '/default-avatar.png'}
 alt={session.user.name || "User"}
 width={32}
 height={32}
 className="w-8 h-8 rounded-full mr-2"
 />
 <span className="mr-4">Halo, {session.user.name || session.user.email}</span>
 <button
 onClick={() => signOut({ callbackUrl: '/login' })}
 className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
 >
 Logout
 </button>
 </div>
 )}
 </div>
 </nav>
 </header>
 );
}