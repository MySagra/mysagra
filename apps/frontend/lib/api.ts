import { redirect } from "next/navigation";
import { z } from "zod";
import { getBackendSessionId } from "@/lib/auth";

const API_URL = process.env.API_URL || "";

const buildHeaders = (): HeadersInit => {
  return {
    "Content-Type": "application/json",
  };
};

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodType<T>
): Promise<T> {
  // Backend session id lives inside the encrypted NextAuth JWT, not a browser cookie.
  const sessionId = await getBackendSessionId();

  // Merge default headers with custom headers, remove Content-Type for FormData
  const headers: HeadersInit = {
    ...buildHeaders(),
    ...options.headers,
    // Forward the backend session cookie so the API can authenticate the request
    ...(sessionId ? { Cookie: `mysagra_session=${sessionId}` } : {}),
  };

  if (options.body instanceof FormData) {
    delete (headers as Record<string, string>)["Content-Type"];
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized and 403 Forbidden
  // Redirect to the force-logout Route Handler which can properly clear cookies
  if (response.status === 401 || response.status === 403) {
    redirect("/api/auth/force-logout");
  }

  // Handle other error responses
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Errore sconosciuto" }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();

  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.warn(`[API] Response validation warning for ${endpoint}:`, result.error.issues);
    } else {
      return result.data;
    }
  }

  return data as T;
}
