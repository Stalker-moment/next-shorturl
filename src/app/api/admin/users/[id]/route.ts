
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';

export async function PUT(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const adminId = (session.user as any).id;

    const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}?adminId=${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, adminId })
    });

    return NextResponse.json(await res.json(), { status: res.status });
}

export async function DELETE(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const adminId = (session.user as any).id;

    const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}?adminId=${adminId}`, {
        method: 'DELETE'
    });

    return NextResponse.json(await res.json(), { status: res.status });
}
