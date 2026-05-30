import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const backendRes = await fetch(`${BACKEND_URL}/api/user/qrcodes/${id}?userId=${(session.user as any).id}`);
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (_err) {
        return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    try {
        const backendRes = await fetch(`${BACKEND_URL}/api/user/qrcodes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const backendRes = await fetch(`${BACKEND_URL}/api/user/qrcodes/${id}`, {
            method: "DELETE"
        });
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
    }
}
