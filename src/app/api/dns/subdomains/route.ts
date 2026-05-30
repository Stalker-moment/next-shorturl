import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/dns/subdomains?userId=${userId}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/dns/subdomains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, userId })
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
