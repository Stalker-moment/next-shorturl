// app/api/links/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request
): Promise<NextResponse> {
    try {
        const { pathname } = new URL(request.url);
        const id = pathname.split('/').pop(); // Ambil ID dari URL

        if (!id) {
            return NextResponse.json({ error: 'Invalid input. "id" is required.' }, { status: 400 });
        }

        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';
        const res = await fetch(`${BACKEND_URL}/api/links/${id}`);
        const data = await res.json();
        
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error Proxying retrieving URL:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pathname } = new URL(request.url);
        const id = pathname.split('/').pop(); // Ambil ID dari URL

        if (!id) {
            return NextResponse.json({ error: 'Invalid input. "id" is required.' }, { status: 400 });
        }

        const userId = (session.user as { id?: string }).id;
        const role = (session.user as { role?: string }).role || 'USER';

        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/user/urls/${id}`;
        const res = await fetch(backendUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, role })
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error proxying delete link:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}