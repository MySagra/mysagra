import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "myamministratore_session";
export const USER_COOKIE = "myamministratore_user";

export type AppRole = "admin" | "maintainer" | "operator";

export interface SessionUser {
  userId: string;
  username: string;
  role: AppRole;
}

// Mirror backend expiry: sessions die at the next 07:00.
export function getSessionMaxAge(): number {
  const now = new Date();
  const expires = new Date();
  expires.setHours(7, 0, 0, 0);
  if (now.getHours() >= 7) {
    expires.setDate(expires.getDate() + 1);
  }
  return Math.floor((expires.getTime() - now.getTime()) / 1000);
}

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET!);
}

export async function signUserJwt(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${getSessionMaxAge()}s`)
    .sign(getSecret());
}

export async function verifyUserJwt(token: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as SessionUser;
}

export async function getSession(): Promise<{
  user: { id: string; name: string; email: string; role: string };
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyUserJwt(token);
    return {
      user: {
        id: payload.userId,
        name: payload.username,
        email: `${payload.username}@myamministratore.local`,
        role: payload.role,
      },
    };
  } catch {
    return null;
  }
}

export async function getBackendSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
