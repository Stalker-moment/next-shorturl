import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-expect-error userId check
    const userId = session.user.id;

    try {
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/user/developer/regenerate-key`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch {
        return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
    }
}
