import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  console.log("Middleware Check:", { pathname, hasToken: !!token });

  // Jika sudah login, redirect dari /login atau /signup atau /register ke /manage
  if (token && (pathname === '/login' || pathname === '/signup' || pathname === '/register')) {
    console.log("Redirecting to /manage because token exists");
    return NextResponse.redirect(new URL('/manage', req.url));
  }

  // Jika belum login, redirect dari /manage ke /login
  if (!token && pathname.startsWith('/manage')) {
    console.log("Redirecting to /login because NO token");
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup', '/register', '/manage/:path*'],
};
