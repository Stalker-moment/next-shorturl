// src/app/api/guest/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// Removed node-fetch as Next.js provides a native fetch API
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

// Karakter untuk short URL
const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SHORT_URL_LENGTH = 8; // Tentukan panjang short URL yang diinginkan

// Fungsi untuk menggenerate short URL secara langsung
const generateShortUrl = () => {
  let shortUrl = '';
  for (let i = 0; i < SHORT_URL_LENGTH; i++) {
    shortUrl += BASE62_ALPHABET[Math.floor(Math.random() * BASE62_ALPHABET.length)];
  }
  return shortUrl;
};

// Fungsi untuk mendapatkan logo dan header text dari URL
const fetchMetadata = async (url: string) => {
  try {
    const response = await globalThis.fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("head > title").text() || "No title found";
    const logo =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      "No logo found";

    // Pastikan logo adalah URL absolut
    const absoluteLogo = logo.startsWith("http") ? logo : new URL(logo, url).href;

    return { title, logo: absoluteLogo };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return { title: "No title found", logo: "No logo found" };
  }
};

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  // Validasi URL
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Mendapatkan metadata dari URL
    const metadata = await fetchMetadata(url);

    // Membuat short URL dengan ID unik
    const shortUrl = generateShortUrl();

    // Simpan URL, shortUrl, dan metadata ke dalam database
    const guestUrl = await prisma.guesturl.create({
      data: {
        url,
        shortUrl,
        title: metadata.title,
        logo: metadata.logo,
      },
    });

    // Mengembalikan hasil yang disimpan di database
    return NextResponse.json(guestUrl, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
