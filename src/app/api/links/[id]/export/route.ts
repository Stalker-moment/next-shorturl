import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = (await params).id;
        if (!id) {
            return NextResponse.json({ error: 'Invalid input. "id" is required.' }, { status: 400 });
        }

        const userId = (session.user as { id?: string }).id;
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/user/urls/${id}/export?userId=${userId}`;
        
        const res = await fetch(backendUrl);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return NextResponse.json({ error: errData.error || 'Failed to export CSV from backend' }, { status: res.status });
        }

        const csvText = await res.text();
        return new Response(csvText, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': res.headers.get('Content-Disposition') || `attachment; filename=analytics-${id}.csv`
            }
        });
    } catch (error) {
        console.error('Error proxying export link analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
