"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  signUserJwt,
  getSessionMaxAge,
  SESSION_COOKIE,
  USER_COOKIE,
  type AppRole,
} from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Session } from "@/lib/api-types";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";
import { z } from "zod";

const API_URL = process.env.API_URL || "";

export async function login(username: string, password: string) {
  try {
    const reqHeaders = await headers();
    const userAgent = reqHeaders.get("user-agent");

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userAgent ? { "user-agent": userAgent } : {}),
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return { success: false, error: "Credenziali non valide" };
    }

    // Extract mysagra_session from the backend Set-Cookie header
    let sessionId: string | undefined;
    for (const raw of response.headers.getSetCookie()) {
      if (raw.startsWith("mysagra_session=")) {
        sessionId = raw.split(";")[0].split("=").slice(1).join("=");
        break;
      }
    }

    const data = await response.json();
    const role = data.role as AppRole | undefined;

    if (role !== "admin" && role !== "maintainer" && role !== "operator") {
      return { success: false, error: "role_not_allowed" };
    }

    const userJwt = await signUserJwt({
      userId: String(data.userId),
      username: data.username,
      role,
    });

    const maxAge = getSessionMaxAge();
    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();

    if (sessionId) {
      cookieStore.set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        maxAge,
      });
    }

    // Not httpOnly: client JS needs to decode this for useSession()
    cookieStore.set(USER_COOKIE, userJwt, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: isProduction,
      maxAge,
    });

    return { success: true };
  } catch {
    return { success: false, error: "Errore durante il login" };
  }
}

export async function logout() {
  redirect("/api/auth/force-logout");
}

export async function getSessions(): Promise<Session[]> {
  return fetchApi<Session[]>(
    API_ENDPOINTS.AUTH.SESSIONS,
    {},
    z.array(
      z.object({
        sessionId: z.string(),
        userAgent: z.string().nullable(),
        expiresAt: z.string(),
        createdAt: z.string(),
        revokedAt: z.string().nullable(),
      })
    )
  );
}

export async function revokeSession(sessionId: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.AUTH.SESSION_BY_ID(sessionId), { method: "DELETE" });
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: extractErrorMessage(error, "Errore nella revoca della sessione"),
    };
  }
}
