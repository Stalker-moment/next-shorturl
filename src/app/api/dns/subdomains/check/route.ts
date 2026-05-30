import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const subdomain = searchParams.get("subdomain");

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/dns/subdomains/check?domainId=${domainId}&subdomain=${subdomain}`
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
