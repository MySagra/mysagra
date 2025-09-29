import { NextResponse, NextRequest } from 'next/server';
import { getAccessToken } from "@/lib/auth/getTokens";

interface Params {
    page: string;
}

const API_URL = process.env.API_URL;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {

    const token = await getAccessToken();
    const { page } = await params;

    const res = await fetch(`${API_URL}/v1/orders/pages/${page}`, {
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