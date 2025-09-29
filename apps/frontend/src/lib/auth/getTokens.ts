import {cookies} from 'next/headers';

export async function getAccessToken() : Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value || "";
}

export async function getRefreshToken() : Promise<string> {
    const cookieStore = await cookies();
    return cookieStore.get("refreshToken")?.value || "";
}