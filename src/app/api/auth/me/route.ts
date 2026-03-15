/**
 * GET /api/auth/me
 * Returns the currently authenticated user from the JWT cookie.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: { userId: user.userId, email: user.email, username: user.username } });
}
