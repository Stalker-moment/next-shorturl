import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await backendRes.json();
        
        return NextResponse.json(data, { status: backendRes.status });
    } catch (e) {
        console.error("Register Proxy Error", e);
        return NextResponse.json({ error: "Terjadi kesalahan server proxy" }, { status: 500 });
    }
}
