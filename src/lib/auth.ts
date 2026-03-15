/**
 * auth.ts — Authentication utilities
 * bcryptjs for hashing, jsonwebtoken for stateless sessions.
 * All functions are server-only.
 */
import "server-only";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? "7d") as jwt.SignOptions["expiresIn"];
const COOKIE_NAME = "aura_session";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TokenPayload {
    userId: number;
    email: string;
    username: string;
    iat?: number;
    exp?: number;
}

// ── Password helpers ──────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export function signToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

// ── Cookie session ────────────────────────────────────────────────────────────
export async function setSessionCookie(token: string): Promise<void> {
    const jar = await cookies();
    jar.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

export async function clearSessionCookie(): Promise<void> {
    const jar = await cookies();
    jar.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<TokenPayload | null> {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}
