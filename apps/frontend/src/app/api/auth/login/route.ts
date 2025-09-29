import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

export async function POST(request: Request) {

    const { username, password } = await request.json();

    if (!(username && password)) {
        return NextResponse.json({ message: "Bad request" }, { status: 400 });
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.message || 'Login fallito' }, { status: response.status });
        }

        const inProd = process.env.NODE_ENV === 'production';

        // Estrai il refreshToken dal cookie ricevuto dal backend
        const setCookieHeader = response.headers.get('set-cookie');
        let refreshToken = '';

        if (setCookieHeader) {
            const refreshTokenMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
            if (refreshTokenMatch) {
                refreshToken = refreshTokenMatch[1];
            }
        }

        if (!refreshToken) {
            return NextResponse.json({ error: data.message || 'Login fallito' }, { status: response.status });
        }

        const nextResponse = NextResponse.json(
            data.user,
            { status: 200 }
        )

        nextResponse.cookies.set({
            name: "refreshToken",
            value: refreshToken,
            httpOnly: true,
            secure: inProd,
            path: "/",
            sameSite: inProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni come nel backend
        });

        nextResponse.cookies.set({
            name: "accessToken",
            value: data.accessToken,
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