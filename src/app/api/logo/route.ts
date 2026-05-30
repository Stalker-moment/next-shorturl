// next-shorturl/src/app/api/logo/route.ts
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  request: NextRequest
): Promise<NextResponse | Response> {
    try {
        const { searchParams } = new URL(request.url);
        const domain = searchParams.get('domain');

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        const res = await fetch(`http://localhost:1888/api/logo?domain=${encodeURIComponent(domain)}`);
        
        if (!res.ok) {
            return NextResponse.json({ error: 'Logo not found' }, { status: res.status });
        }

        // Return the image as binary response
        const blob = await res.blob();
        const headers = new Headers();
        headers.set('Content-Type', res.headers.get('Content-Type') || 'image/png');
        headers.set('Cache-Control', 'public, max-age=86400');

        return new Response(blob, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Error proxying logo:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
