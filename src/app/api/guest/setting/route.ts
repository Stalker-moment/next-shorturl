// app/api/guest/setting/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Pastikan ini adalah singleton di proyek Anda

export async function POST(
    request: NextRequest
): Promise<NextResponse> {
    try {
        const body = await request.json();
        const code = body.code as string;
        const useLanding = body.useLanding.toString() as string; // Pastikan ini adalah string

        console.log('Received data:', { code, useLanding });

        if (!code || typeof useLanding !== 'string') {
            return NextResponse.json({ error: 'Invalid input. "code" and "useLanding" are required.' }, { status: 400 });
        }

        const updatedGuestUrl = await prisma.guesturl.update({
            where: { shortUrl: code },
            data: { useLanding },
        });

        return NextResponse.json({ message: 'Setting updated successfully.', data: updatedGuestUrl });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}