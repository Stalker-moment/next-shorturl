// app/api/guest/setting/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Pastikan ini adalah singleton di proyek Anda

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const body = await request.json();
        const id = params.id; // Ambil id dari params
        const useLanding = body.useLanding.toString() as string; // Pastikan ini adalah string

        console.log('Received data:', { id, useLanding });

        if (!id || typeof useLanding !== 'string') {
            return NextResponse.json({ error: 'Invalid input. "id" and "useLanding" are required.' }, { status: 400 });
        }

        const updatedGuestUrl = await prisma.guesturl.update({
            where: { id: id },
            data: { useLanding },
        });

        return NextResponse.json({ message: 'Setting updated successfully.', data: updatedGuestUrl });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}