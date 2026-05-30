import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888';

export async function GET() {
    const res = await fetch(`${BACKEND_URL}/api/user/pricing/plans`);
    return NextResponse.json(await res.json(), { status: res.status });
}
