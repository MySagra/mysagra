"use server";

import { z } from "zod";
import { CreateSetupSchema } from "@mysagra/schemas";
import { API_ENDPOINTS } from "@/lib/api-types";

const API_URL = process.env.API_URL || "";

export type CreateSetupInput = z.input<typeof CreateSetupSchema>;

export type SetupResult =
  | { ok: true }
  | { ok: false; error: "invalid_token" | "already_setup" | "too_many_attempts" | "invalid_data" | "generic"; message?: string };

// true when the instance has no users yet and the wizard must be shown
export async function getSetupStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}${API_ENDPOINTS.SETUP.STATUS}`, { cache: "no-store" });
    if (!response.ok) return false;
    const data = (await response.json()) as { required?: boolean };
    return data.required === true;
  } catch {
    return false;
  }
}

// Plain fetch instead of fetchApi: a 401 here means "wrong setup token", not an expired session
export async function runSetup(input: CreateSetupInput): Promise<SetupResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${API_ENDPOINTS.SETUP.CREATE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "generic" };
  }

  if (!response.ok) {
    switch (response.status) {
      case 401:
        return { ok: false, error: "invalid_token" };
      case 409:
        return { ok: false, error: "already_setup" };
      case 429:
        return { ok: false, error: "too_many_attempts" };
      case 400: {
        const body = await response.json().catch(() => null) as { errors?: { message: string }[] } | null;
        return { ok: false, error: "invalid_data", message: body?.errors?.[0]?.message };
      }
      default:
        return { ok: false, error: "generic" };
    }
  }

  // No sign in here: setting the session cookie inside this action would make Next.js refresh
  // the route, and /setup (now completed) would redirect away before the completion screen.
  // The wizard signs in when the user presses "Start".
  return { ok: true };
}
