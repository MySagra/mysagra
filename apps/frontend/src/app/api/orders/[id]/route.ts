import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAccessToken } from "@/lib/auth/getTokens";

interface Params {
    id: string;
}

const API_URL = process.env.API_URL;

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const { id } = await params;
    const token = await getAccessToken();

    const res = await fetch(`${API_URL}/v1/orders/${id}`, {
        method: "DELETE",
        headers: {
            "authorization": `Bearer ${token}`
        }
    });

    if(res.ok){
        revalidateTag('orders');
        revalidateTag('stats');
    }

    return NextResponse.json({ status: res.status });
}