import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminId = (session.user as { id?: string }).id;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/dns/admin/subdomains?adminId=${adminId}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
