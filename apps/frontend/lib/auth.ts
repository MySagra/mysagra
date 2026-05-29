import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";

// NextAuth session cookie name. The encrypted JWT it holds also carries the
// backend session id (sessionId), so we never store a separate browser cookie.
const SESSION_COOKIE_NAME = "myamministratore.session-token";

// Mirror the backend expiry policy (sessions.service.ts getExpiresAt):
// sessions die at the next 07:00. Computed per-call (not a const) so the
// value is fresh at each login/encode instead of frozen at module load.
function getSessionMaxAge(): number {
  const now = new Date();
  const expires = new Date();
  expires.setHours(7, 0, 0, 0);
  if (now.getHours() >= 7) {
    expires.setDate(expires.getDate() + 1);
  }
  return Math.floor((expires.getTime() - now.getTime()) / 1000);
}

// Decode the backend session id out of the encrypted NextAuth JWT cookie.
// Server-only: keeps the session id httpOnly (never exposed to client JS via
// the session object). Returns undefined when there is no valid session.
export async function getBackendSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return undefined;

  try {
    const decoded = await decode({
      token: raw,
      secret: process.env.AUTH_SECRET!,
      salt: SESSION_COOKIE_NAME,
    });
    return (decoded as { sessionId?: string } | null)?.sessionId;
  } catch {
    return undefined;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const userAgent = request?.headers?.get("user-agent") ?? undefined;

        try {
          const response = await fetch(`${process.env.API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(userAgent ? { "user-agent": userAgent } : {}),
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          // Extract the backend session id from its Set-Cookie header. We do NOT
          // store it as a separate browser cookie — instead it is carried inside
          // the encrypted NextAuth JWT (see jwt callback + getBackendSessionId).
          let sessionId: string | undefined;
          const setCookieHeader = response.headers.getSetCookie();
          for (const rawCookie of setCookieHeader) {
            if (rawCookie.startsWith("mysagra_session=")) {
              sessionId = rawCookie
                .split(";")[0]
                .split("=")
                .slice(1)
                .join("=");
              break;
            }
          }

          const data = await response.json();

          const role = data.role as string | undefined;
          if (role !== "admin" && role !== "maintainer" && role !== "operator") {
            throw new Error("role_not_allowed");
          }

          return {
            id: String(data.userId || data.id || "1"),
            name: data.username || (credentials.username as string),
            email: `${credentials.username}@myamministratore.local`,
            role,
            sessionId,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as any).role,
          sessionId: (user as any).sessionId,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    get maxAge() {
      return getSessionMaxAge();
    },
  },
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        get maxAge() {
          return getSessionMaxAge();
        },
      },
    },
    callbackUrl: {
      name: `myamministratore.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        get maxAge() {
          return getSessionMaxAge();
        },
      },
    },
    csrfToken: {
      name: `myamministratore.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        get maxAge() {
          return getSessionMaxAge();
        },
      },
    },
  },
  debug: false,
});
