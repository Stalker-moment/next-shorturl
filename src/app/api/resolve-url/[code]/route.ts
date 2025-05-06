// /app/api/resolve-url/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const code = pathname?.split('/')[1]; // Ambil kode dari URL path

  if (!code) {
    return NextResponse.json({ error: 'Missing short code.' }, { status: 400 });
  }

  try {
    const guestUrl = await prisma.guesturl.findUnique({
      where: { shortUrl: code },
    });

    if (!guestUrl) {
      return NextResponse.json({ error: 'Short URL not found.' }, { status: 404 });
    }

    return NextResponse.json({
      url: guestUrl.url,
      useLanding: guestUrl.useLanding === 'true',
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
