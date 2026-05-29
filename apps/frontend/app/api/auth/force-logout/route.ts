import { NextResponse } from "next/server";
import { getBackendSessionId } from "@/lib/auth";

const API_URL = process.env.API_URL || "";

// Cookie names from NextAuth config (lib/auth.ts)
const SESSION_COOKIES = [
  "myamministratore.session-token",
  "myamministratore.callback-url",
  "myamministratore.csrf-token",
];

export async function GET() {
  // 1. Read the backend session id out of the encrypted NextAuth JWT
  const sessionId = await getBackendSessionId();

  // 2. Call backend logout to revoke the server-side session
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        ...(sessionId ? { Cookie: `mysagra_session=${sessionId}` } : {}),
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

  // 5. Defensively clear any legacy mysagra_session browser cookie
  response.cookies.set("mysagra_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
