import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as {id?: string}).id;
    try {
        const res = await fetch(`${BACKEND_URL}/api/user/profile?userId=${userId}`);
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("Profile GET Proxy Error:", err);
        return NextResponse.json({ error: "Gagal terhubung ke server backend" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as {id?: string}).id;
    const body = await req.json();

    try {
        const backendRes = await fetch(`${BACKEND_URL}/api/user/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, userId })
        });
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Profile PUT Proxy Error:", err);
        return NextResponse.json({ error: "Gagal memperbarui profil di backend" }, { status: 500 });
    }
}
