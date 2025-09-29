import { NextResponse } from 'next/server';
import {getAccessToken} from "@/lib/auth/getTokens";

const API_URL = process.env.API_URL;

export async function GET() {
    const token = await getAccessToken();

    const res = await fetch(`${API_URL}/v1/orders/day/today`, {
        next: { tags: ['orders']},
        method: "GET",
        headers: {
            "authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();

    if (!res.ok) {
        return NextResponse.json({ error: data.message || 'Not Found' }, { status: res.status });
    }

    return NextResponse.json(data);
}