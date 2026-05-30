import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const isAdmin = searchParams.get("isAdmin") || "false";
        const password = searchParams.get("password") || "";
        
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/paste-room/${id}?isAdmin=${isAdmin}&password=${encodeURIComponent(password)}`, {
            method: "GET"
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (e) {
        console.error("Paste Room Get Proxy Error", e);
        return NextResponse.json({ error: "Terjadi kesalahan server proxy" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/paste-room/${id}`, {
            method: "DELETE"
        });
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (e) {
        console.error("Paste Room Delete Proxy Error", e);
        return NextResponse.json({ error: "Terjadi kesalahan server proxy" }, { status: 500 });
    }
}
