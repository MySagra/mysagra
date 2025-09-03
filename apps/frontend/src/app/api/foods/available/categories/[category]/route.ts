import { NextResponse, NextRequest } from 'next/server';

interface Params {
    category: string;
}

const API_URL = process.env.API_URL;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> } // params è il secondo argomento
) {
    const { category } = await params;
    const res = await fetch(`${API_URL}/v1/foods/available/categories/${category}`, { next: { tags: ['foods'] }});
    const data = await res.json();
    return NextResponse.json(data);
}