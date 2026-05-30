import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminId = (session.user as { id?: string }).id;

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/dns/admin/blocked-prefixes/${id}?adminId=${adminId}`,
        {
            method: "DELETE"
        }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
