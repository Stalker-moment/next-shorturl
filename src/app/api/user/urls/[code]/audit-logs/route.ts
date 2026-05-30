import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ code: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await context.params;
    if (!code) {
        return NextResponse.json({ error: "Missing short code" }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role || "USER";

    try {
        const backendRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/user/urls/${code}/audit-logs?userId=${userId}&role=${role}`,
            {
                headers: {
                    "x-forwarded-for": request.headers.get("x-forwarded-for") || "127.0.0.1",
                    "user-agent": request.headers.get("user-agent") || ""
                }
            }
        );

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (error) {
        console.error(`Error proxying audit logs for ${code}:`, error);
        return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
    }
}
