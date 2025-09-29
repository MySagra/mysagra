import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAccessToken } from "@/lib/auth/getTokens";

interface Params {
    id: string;
}

const API_URL = process.env.API_URL;

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const { id } = await params;
    const token = await getAccessToken();

    const res = await fetch(`${API_URL}/v1/foods/available/${id}`, {
        method: "PATCH",
        headers: {
            "authorization": `Bearer ${token}`
        }
    });

    if(res.ok){
        revalidateTag('foods');
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}