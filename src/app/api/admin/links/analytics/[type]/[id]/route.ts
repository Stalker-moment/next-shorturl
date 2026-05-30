import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string, id: string }> }) {
    const session = await getServerSession(authOptions);
    // @ts-expect-error session role
    if (!session || session.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id } = await params;
    const adminId = (session.user as any).id;
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:1888";

    try {
        const res = await fetch(`${BACKEND_URL}/api/admin/links/${type}/${id}/analytics?adminId=${adminId}`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
