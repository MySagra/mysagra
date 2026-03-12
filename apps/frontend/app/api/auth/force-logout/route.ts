import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "";

// Cookie names from NextAuth config (lib/auth.ts)
const SESSION_COOKIES = [
  "myamministratore.session-token",
  "myamministratore.callback-url",
  "myamministratore.csrf-token",
];

// Backend auth cookie
const BACKEND_COOKIE = "mysagra_token";

export async function GET() {
  // 1. Read the backend cookie to forward it in the logout request
  const cookieStore = await cookies();
  const backendToken = cookieStore.get(BACKEND_COOKIE);

  // 2. Call backend logout to clear the backend HTTP-only cookie
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        ...(backendToken ? { Cookie: `${BACKEND_COOKIE}=${backendToken.value}` } : {}),
      },
    });
  } catch {
    // Ignore — proceed with cookie cleanup regardless
  }

  // 3. Build redirect response to /login
  const response = NextResponse.redirect(
    new URL("/login", process.env.AUTH_URL || "http://localhost:5000")
  );

  // 4. Delete all NextAuth session cookies via Set-Cookie headers
  for (const cookieName of SESSION_COOKIES) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  // 5. Delete the backend auth cookie as well
  response.cookies.set(BACKEND_COOKIE, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
