import { NextResponse, NextRequest } from 'next/server';
import { getAccessToken } from "@/lib/auth/getTokens";

interface Params {
    value: string;
}

const API_URL = process.env.API_URL;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {

    const token = await getAccessToken();
    const { value } = await params;

    const res = await fetch(`${API_URL}/v1/orders/search/daily/${value}`, {
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