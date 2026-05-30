
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';

export async function PUT(
    req: NextRequest, 
    { params }: { params: Promise<{ type: string, id: string }> }
) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, id } = await params;
    const body = await req.json();
    const adminId = (session.user as any).id;

    const res = await fetch(`${BACKEND_URL}/api/admin/links/takedown/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, adminId })
    });

    return NextResponse.json(await res.json(), { status: res.status });
}
