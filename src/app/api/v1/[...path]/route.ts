import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const url = new URL(req.url);
  const searchParams = url.search;

  const backendUrl = `${
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888"
  }/api/v1/${pathStr}${searchParams}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  try {
    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Developer GET proxy error:", err);
    return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");

  const backendUrl = `${
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888"
  }/api/v1/${pathStr}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  try {
    const body = await req.json().catch(() => null);
    const backendRes = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Developer POST proxy error:", err);
    return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");

  const backendUrl = `${
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888"
  }/api/v1/${pathStr}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  try {
    const body = await req.json().catch(() => null);
    const backendRes = await fetch(backendUrl, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Developer PUT proxy error:", err);
    return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");

  const backendUrl = `${
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888"
  }/api/v1/${pathStr}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  try {
    const backendRes = await fetch(backendUrl, {
      method: "DELETE",
      headers,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("Developer DELETE proxy error:", err);
    return NextResponse.json({ error: "Proxy server error" }, { status: 500 });
  }
}

