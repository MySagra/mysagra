"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { API_ENDPOINTS, Session } from "@/lib/api-types";
import { ActionResult, extractErrorMessage } from "@/lib/action-result";
import { z } from "zod";

export async function login(username: string, password: string) {
  try {
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: "Credenziali non valide" };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          if ((error as any).cause?.message === "role_not_allowed") {
            return { success: false, error: "role_not_allowed" };
          }
          return { success: false, error: "Credenziali non valide" };
        default:
          return { success: false, error: "Errore durante il login" };
      }
    }

    return { success: false, error: "Errore durante il login" };
  }
}

export async function logout() {
  // Redirect to the force-logout route handler which properly
  // clears both backend and NextAuth cookies via Set-Cookie headers
  redirect("/api/auth/force-logout");
}

export async function getSessions(): Promise<Session[]> {
  return fetchApi<Session[]>(
    API_ENDPOINTS.AUTH.SESSIONS,
    {},
    z.array(z.object({
      sessionId: z.string(),
      userAgent: z.string().nullable(),
      expiresAt: z.string(),
      createdAt: z.string(),
      revokedAt: z.string().nullable(),
    }))
  );
}

export async function revokeSession(sessionId: string): Promise<ActionResult<void>> {
  try {
    await fetchApi(API_ENDPOINTS.AUTH.SESSION_BY_ID(sessionId), {
      method: "DELETE",
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: extractErrorMessage(error, "Errore nella revoca della sessione") };
  }
}

