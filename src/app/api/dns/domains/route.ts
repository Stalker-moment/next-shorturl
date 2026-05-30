import { NextResponse } from "next/server";

export async function GET() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/dns/domains`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
