// app/api/auth/google-callback/route.ts
// Receives the Google ID token from the frontend popup,
// verifies it via backend, then creates a NextAuth session.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encode } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1888";

export async function POST(req: NextRequest) {
  try {
    const { credential, mode } = await req.json();
    if (!credential) {
      return NextResponse.json({ error: "Missing credential" }, { status: 400 });
    }

    // Decode the JWT credential from Google (it's a signed JWT, base64url parts)
    const parts = credential.split(".");
    if (parts.length !== 3) {
      return NextResponse.json({ error: "Invalid credential format" }, { status: 400 });
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return NextResponse.json({ error: "No email in credential" }, { status: 400 });
    }

    // If mode === "link", get current session and link Google to existing account
    const session = await getServerSession(authOptions);
    let backendUser;

    if (mode === "link" && session?.user) {
      // Link Google to existing account
      const linkRes = await fetch(`${API_URL}/api/user/link-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: (session.user as any).id, googleEmail: email }),
      });
      if (!linkRes.ok) {
        const err = await linkRes.json();
        return NextResponse.json({ error: err.error || "Gagal menautkan akun Google" }, { status: 400 });
      }
      return NextResponse.json({ success: true, linked: true });
    }

    // Otherwise: login / register via Google
    const authRes = await fetch(`${API_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, image: picture, googleId }),
    });

    const data = await authRes.json();
    if (!authRes.ok) {
      return NextResponse.json({ error: data.error || "Gagal masuk dengan Google" }, { status: 400 });
    }

    backendUser = data.user;

    // Create a NextAuth JWT token manually
    const secret = process.env.NEXTAUTH_SECRET as string;
    const token = await encode({
      secret,
      token: {
        sub: backendUser.id,
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name,
        picture: picture || null,
        role: backendUser.role || "USER",
        googleLinked: backendUser.googleLinked,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
    });

    // Set the NextAuth session cookie
    const isProd = process.env.NODE_ENV === "production";
    const cookieName = isProd
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const response = NextResponse.json({ success: true, user: backendUser });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (e) {
    console.error("Google callback error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
