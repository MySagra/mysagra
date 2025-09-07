import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

interface Params {
    id: string;
}

const API_URL = process.env.API_URL;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const { id } = await params;
    const res = await fetch(`${API_URL}/v1/foods/${id}`, { next: { tags: ['foods'] }});
    const data = await res.json();
    return NextResponse.json(data);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const { id } = await params;
    const body = await request.json();

    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value || "redondi";

    const res = await fetch(`${API_URL}/v1/foods/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body)
    });

    if (res.ok) {
        revalidateTag('foods');
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const { id } = await params;
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value || "redondi";

    const res = await fetch(`${API_URL}/v1/foods/${id}`, {
        method: "DELETE",
        headers: {
            "authorization": `Bearer ${token}`
        }
    });

    if (res.ok) {
        revalidateTag('foods');
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}