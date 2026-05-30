import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as {id?: string}).id;
    const body = await req.json();

    try {
        const backendRes = await fetch(`${BACKEND_URL}/api/user/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, userId })
        });
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Change Password Proxy Error:", err);
        return NextResponse.json({ error: "Gagal terhubung ke server backend" }, { status: 500 });
    }
}
