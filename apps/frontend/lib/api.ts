import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.API_URL || "";

const buildHeaders = (): HeadersInit => {
  return {
    "Content-Type": "application/json",
  };
};

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Read the backend auth cookie from the incoming browser request
  const cookieStore = await cookies();
  const token = cookieStore.get("mysagra_token");

  // Merge default headers with custom headers, remove Content-Type for FormData
  const headers: HeadersInit = {
    ...buildHeaders(),
    ...options.headers,
    // Forward the backend auth cookie so the API can authenticate the request
    ...(token ? { Cookie: `mysagra_token=${token.value}` } : {}),
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

  return response.json();
}
