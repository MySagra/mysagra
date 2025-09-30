import { NextResponse } from "next/server";
import { getRefreshToken } from "@/lib/auth/getTokens";

const API_URL = process.env.API_URL;

export async function POST(request: Request) {
    const inProd = process.env.NODE_ENV === 'production';
    try {
        const cookieHeader = request.headers.get('Cookie');

        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                ...(cookieHeader && { 'Cookie': cookieHeader }),
                'Content-Type': 'application/json'
            },
            credentials: "include"
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Logout failed" },
                { status: response.status }
            );
        }
    }
    catch (err) {
        return NextResponse.json(
            { error: "Network error" },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { success: true },
        {
            status: 200,
            headers: [
                ["Set-Cookie", `accessToken=; Path=/; Max-Age=0; HttpOnly; SameSite=${inProd ? "none" : "lax"}; ${inProd ? "Secure" : ""}`],
                ["Set-Cookie", `refreshToken=; Path=/; Max-Age=0; HttpOnly; SameSite=${inProd ? "none" : "lax"}; ${inProd ? "Secure" : ""}`]
            ]
        }
    );
}