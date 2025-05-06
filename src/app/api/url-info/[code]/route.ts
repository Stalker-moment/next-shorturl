// app/api/url-info/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'; // Assuming prisma is setup
const prisma = new PrismaClient(); // Replace with your singleton instance

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse> {

  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter.' }, { status: 400 });
  }

  try {
    const guestUrl = await prisma.guesturl.findUnique({
      where: { shortUrl: code },
      select: { // Only select the field needed
        url: true
      }
    });

    if (guestUrl && guestUrl.url) {
      // Return the original URL
      return NextResponse.json({ originalUrl: guestUrl.url });
    } else {
      // Code not found in database
      return NextResponse.json({ error: 'URL information not found for this code.' }, { status: 404 });
    }

  } catch (error) {
    console.error(`Error fetching URL info for code ${code}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
  // Disconnect Prisma if needed
  // finally {
  //   await prisma.$disconnect();
  // }
}