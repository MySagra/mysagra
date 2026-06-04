import { NextResponse } from "next/server";
import { getBackendSessionId, SESSION_COOKIE, USER_COOKIE } from "@/lib/auth";

const API_URL = process.env.API_URL || "";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = await getBackendSessionId();
  const reason = url.searchParams.get("reason");
  const skipLogout = url.searchParams.has("skip-logout");

  if (!skipLogout) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: sessionId ? { Cookie: `mysagra_session=${sessionId}` } : {},
      });
    } catch {
      // Ignore — proceed with cookie cleanup regardless
    }
  }

  const loginUrl = new URL("/login", process.env.AUTH_URL || "http://localhost:5000");
  if (reason) loginUrl.searchParams.set("reason", reason);

  const response = NextResponse.redirect(loginUrl);

  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set(USER_COOKIE, "", { path: "/", maxAge: 0, expires: new Date(0) });

  return response;
}
