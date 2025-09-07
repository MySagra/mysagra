import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

export async function GET() {
    const res = await fetch(`${API_URL}/v1/categories/available`, { next: { tags: ['categories']} });
    const data = await res.json();
    return NextResponse.json(data);
}