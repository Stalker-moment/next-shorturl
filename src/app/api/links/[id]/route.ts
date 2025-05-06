// app/api/guest/setting/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Pastikan ini adalah singleton di proyek Anda

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
  
    const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Invalid input. "id" is required.' }, { status: 400 });
        }

        const guestUrl = await prisma.guesturl.findUnique({
            where: { id: id },
        });

        if (!guestUrl) {
            return NextResponse.json({ error: 'URL not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'URL retrieved successfully.', data: guestUrl });
    } catch (error) {
        console.error('Error retrieving URL:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}