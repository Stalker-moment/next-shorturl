import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role || "USER";
    const body = await req.json();

    try {
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/user/setting`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-forwarded-for": req.headers.get("x-forwarded-for") || "127.0.0.1",
                "user-agent": req.headers.get("user-agent") || ""
            },
            body: JSON.stringify({ ...body, userId, role })
        });
        
        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (error) {
        console.error("Error proxying user settings update:", error);
        return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
    }
}
