import { NextRequest, NextResponse } from "next/server";
import { searchMusic } from "@/lib/youtube";

/**
 * GET /api/radio?artist=The+Weeknd&title=Blinding+Lights&exclude=id1,id2,id3
 *
 * Returns up to 8 recommended tracks based on the current artist.
 * Excludes any IDs passed via `exclude` param to avoid repeats.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const artist = searchParams.get("artist")?.trim();
    const title = searchParams.get("title")?.trim();
    const exclude = new Set((searchParams.get("exclude") ?? "").split(",").filter(Boolean));

    if (!artist) {
        return NextResponse.json({ tracks: [] }, { status: 400 });
    }

    try {
        // Build a varied query to get similar/adjacent music, not just the same artist
        const queries = [
            `${artist} mix`,
            `songs like ${artist}`,
            title ? `${artist} ${title.split(" ").slice(0, 3).join(" ")} similar` : `${artist} best songs`,
        ];

        // Pick query by time-based rotation so repeated requests vary
        const query = queries[Math.floor(Date.now() / 30000) % queries.length];

        const results = await searchMusic(query, "relevance", 20);

        // Deduplicate, exclude currently played history, take 8
        const seen = new Set<string>();
        const tracks = results
            .filter(t => {
                if (exclude.has(t.id) || seen.has(t.id)) return false;
                seen.add(t.id);
                return true;
            })
            .slice(0, 8);

        return NextResponse.json({ tracks });
    } catch (err) {
        console.error("[radio] Error fetching radio tracks:", err);
        return NextResponse.json({ tracks: [] }, { status: 500 });
    }
}
