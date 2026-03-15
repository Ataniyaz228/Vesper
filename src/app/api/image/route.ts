import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
        }

        const buffer = await res.arrayBuffer();

        const headers = new Headers();
        headers.set("Content-Type", res.headers.get("Content-Type") || "image/jpeg");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(buffer, { headers });
    } catch (e) {
        console.error("Image proxy error:", e);
        return new NextResponse("Error fetching image", { status: 500 });
    }
}
