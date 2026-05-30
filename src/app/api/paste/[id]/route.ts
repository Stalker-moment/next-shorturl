import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/paste/read/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (e) {
        console.error("Paste Read Proxy Error", e);
        return NextResponse.json({ error: "Terjadi kesalahan server proxy" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/paste/${id}`, {
            method: "DELETE"
        });
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (e) {
        console.error("Paste Delete Proxy Error", e);
        return NextResponse.json({ error: "Terjadi kesalahan server proxy" }, { status: 500 });
    }
}
