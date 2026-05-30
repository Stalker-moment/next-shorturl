// app/api/url-info/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const code = pathname?.split('/').pop();

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter.' }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {
      'x-forwarded-for': request.headers.get('x-forwarded-for') || '127.0.0.1',
      'user-agent': request.headers.get('user-agent') || '',
      'referer': request.headers.get('referer') || '',
    };
    const passwordHeader = request.headers.get('x-link-password');
    if (passwordHeader) {
      headers['x-link-password'] = passwordHeader;
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const queryStr = searchParams ? `?${searchParams}` : '';

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';
    const res = await fetch(`${BACKEND_URL}/api/url-info/${code}${queryStr}`, {
      headers,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Error fetching proxy URL info for code ${code}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}