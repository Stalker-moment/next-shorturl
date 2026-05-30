import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    username: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    const { username } = await params;
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/biolink/${username}`);
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
}
