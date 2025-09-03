import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
    id: string;
}

const API_URL = process.env.API_URL;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const { id } = await params;

    const res = await fetch(`${API_URL}/v1/categories/${id}/image`, { next: { revalidate: 3600 }});

    if (!res.ok) {
        return NextResponse.json({ error: 'Image not found' }, { status: res.status });
    }

    const imageBuffer = await res.arrayBuffer();
    
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
        },
    });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const { id } = await params;
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value || "redondi";

    // Get the form from request
    const formData = await request.formData();
    
    // Prepare form data for API server
    const apiFormData = new FormData();
    const imageFile = formData.get('image') as File;
    
    if (imageFile) {
        apiFormData.append('image', imageFile);
    }

    const res = await fetch(`${API_URL}/v1/categories/${id}/image`, {
        method: "PATCH",
        headers: {
            "authorization": `Bearer ${token}`
        },
        body: apiFormData
    });

    revalidatePath(`/api/categories/${id}/image`);
    revalidatePath('/admin');
    revalidatePath('/menu');

    if (!res.ok) {
        const error = await res.text();
        return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}