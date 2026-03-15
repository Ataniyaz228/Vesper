import { NextResponse } from "next/server";
import { searchMusic } from "@/lib/youtube";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json({ error: "Missing search query" }, { status: 400 });
    }

    try {
        const results = await searchMusic(query);
        return NextResponse.json(results);
    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: "Failed to fetch from YouTube" }, { status: 500 });
    }
}
