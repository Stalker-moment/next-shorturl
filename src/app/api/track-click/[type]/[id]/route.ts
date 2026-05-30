import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string, id: string }> }) {
    const { type, id } = await params;
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:1888";

    try {
        const res = await fetch(`${BACKEND_URL}/api/track-click/${type}/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': req.headers.get('user-agent') || '',
                'X-Forwarded-For': req.headers.get('x-forwarded-for') || ''
            }
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: "Track failed" }, { status: 500 });
    }
}
