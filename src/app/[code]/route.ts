// app/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Pastikan ini adalah singleton di proyek Anda

export async function GET(
    request: NextRequest,
    { params }: { params: Record<string, string> }
): Promise<NextResponse> {
    const { code } = params;

    if (!code) {
        return NextResponse.json({ error: 'Missing short code.' }, { status: 400 });
    }

    try {
        // Cari URL asli berdasarkan kode pendek
        const guestUrl = await prisma.guesturl.findUnique({
            where: { shortUrl: code },
        });

        if (!guestUrl) {
            console.log(`Code not found: ${code}`);
            return NextResponse.json({ error: 'Short URL not found.' }, { status: 404 });
        }

        const useLandingPage = guestUrl.useLanding === "true"; // Pastikan tipe data di database adalah boolean

        if (useLandingPage) {
            console.log(`Code ${code} requires landing page. Redirecting to confirmation page.`);

            const confirmationPageUrl = new URL(`/confirm/${code}`, request.headers.get('host') ? `https://${request.headers.get('host')}` : request.nextUrl.origin);

            return NextResponse.redirect(confirmationPageUrl.toString());
        } else {
            console.log(`Code ${code} found. Redirecting directly to ${guestUrl.url}`);
            return NextResponse.redirect(guestUrl.url);
        }
    } catch (error) {
        console.error(`Error processing code ${code}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
