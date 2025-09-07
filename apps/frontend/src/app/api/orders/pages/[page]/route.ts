import { NextResponse, NextRequest } from 'next/server';
import { cookies } from "next/headers";

interface Params {
    page: string;
}

const API_URL = process.env.API_URL;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {

    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value || "redondi";
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