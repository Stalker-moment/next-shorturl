import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const code = pathname?.split('/').pop();

  console.log('code', code);

  if (!code) {
    return NextResponse.json({ error: 'Missing short code.' }, { status: 400 });
  }

  try {
    const guestUrl = await prisma.guesturl.findUnique({
      where: { shortUrl: code },
    });

    console.log('guestUrl', guestUrl);

    if (!guestUrl || !guestUrl.url) {
      return NextResponse.json({ error: 'Short URL not found or invalid.' }, { status: 404 });
    }

    return NextResponse.json({
      url: guestUrl.url,
      useLanding: guestUrl.useLanding === 'true',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching URL:', error.message);
    } else {
      console.error('Error fetching URL:', error);
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
