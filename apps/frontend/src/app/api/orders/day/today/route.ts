import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL;

export async function GET() {

    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value || "redondi";

    const res = await fetch(`${API_URL}/v1/orders/day/today`, {
        next: { tags: ['oredrs']},
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