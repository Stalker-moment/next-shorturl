// app/api/guest/setting/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest
): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Proxy request to backend-shorturl
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';
        const backendUrl = `${BACKEND_URL}/api/guest/setting`;
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}