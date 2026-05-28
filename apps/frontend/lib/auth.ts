import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";

const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours

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

          // Propagate the mysagra_session cookie from the backend response to the browser.
          // The backend sets it via Set-Cookie header, but since this is a server-to-server
          // fetch, the cookie would otherwise be lost and never reach the user's browser.
          const setCookieHeader = response.headers.getSetCookie();
          if (setCookieHeader) {
            const cookieStore = await cookies();
            for (const rawCookie of setCookieHeader) {
              if (rawCookie.startsWith("mysagra_session=")) {
                const sessionValue = rawCookie
                  .split(";")[0]
                  .split("=")
                  .slice(1)
                  .join("=");

                cookieStore.set("mysagra_session", sessionValue, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  path: "/",
                  maxAge: SESSION_MAX_AGE,
                });
              }
            }
          }

          const data = await response.json();

          const role = data.role as string | undefined;
          if (role !== "admin" && role !== "maintainer") {
            throw new Error("role_not_allowed");
          }

          return {
            id: String(data.userId || data.id || "1"),
            name: data.username || (credentials.username as string),
            email: `${credentials.username}@myamministratore.local`,
            role,
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
    maxAge: SESSION_MAX_AGE,
  },
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `myamministratore.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE,
      },
    },
    callbackUrl: {
      name: `myamministratore.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE,
      },
    },
    csrfToken: {
      name: `myamministratore.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  debug: false,
});
