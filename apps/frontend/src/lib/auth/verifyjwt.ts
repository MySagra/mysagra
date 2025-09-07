import { cookies } from 'next/headers';

export async function getJwtFromCookie() : Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "redondi";
  return token;
}