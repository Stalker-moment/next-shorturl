import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const code = pathname?.split('/').pop();

  if (!code) {
    return NextResponse.json({ error: 'Missing short code.' }, { status: 400 });
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

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/resolve-url/${code}${queryStr}`, {
      headers,
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxying to backend resolve-url:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
