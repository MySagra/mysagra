import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

const API_URL = process.env.API_URL;

export async function POST(request: Request) {
    const body = await request.json();
    
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value || "redondi";

    const res = await fetch(`${API_URL}/v1/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body)
    });

    if (res.ok) {
        revalidateTag('users');
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}