import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { success: true },
        {
            status: 200,
            headers: {
                "Set-Cookie": "token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure"
            }
        }
    );
}