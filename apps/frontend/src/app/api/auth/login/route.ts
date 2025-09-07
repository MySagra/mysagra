import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

export async function POST(request: Request) {

    const { username, password } = await request.json();

    if(!(username && password)){
        return NextResponse.json({ message: "Bad request"}, { status: 400 });
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.message || 'Login fallito' }, { status: response.status });
        }

        const inProd = process.env.NODE_ENV === 'production';

        const nextResponse = NextResponse.json(
            data.user,
            { status: 200 }
        )

        nextResponse.cookies.set({
            name: "token",
            value: data.token,
            httpOnly: true,
            secure: inProd,
            path: "/",
            sameSite: inProd ? "none" : "lax"
        })

        return nextResponse;
    } catch (e) {
        return NextResponse.json({ error: e }, { status: 500 });
    }
}