import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';

export async function GET() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminId = (session.user as any).id;
    const res = await fetch(`${BACKEND_URL}/api/admin/pricing/plans?adminId=${adminId}`);
    return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminId = (session.user as any).id;
    const body = await req.json();
    body.adminId = adminId;

    const res = await fetch(`${BACKEND_URL}/api/admin/pricing/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return NextResponse.json(await res.json(), { status: res.status });
}
