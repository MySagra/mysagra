import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${process.env.API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          // Propagate the mysagra_token cookie from the backend response to the browser.
          // The backend sets it via Set-Cookie header, but since this is a server-to-server
          // fetch, the cookie would otherwise be lost and never reach the user's browser.
          const setCookieHeader = response.headers.getSetCookie();
          if (setCookieHeader) {
            const cookieStore = await cookies();
            for (const rawCookie of setCookieHeader) {
              // Parse the mysagra_token cookie from the Set-Cookie header
              if (rawCookie.startsWith("mysagra_token=")) {
                const tokenValue = rawCookie
                  .split(";")[0]           // "mysagra_token=<value>"
                  .split("=")
                  .slice(1)
                  .join("=");              // handle '=' in token value

                cookieStore.set("mysagra_token", tokenValue, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  path: "/",
                  maxAge: 6 * 60 * 60, // 6 hours — matches backend
                });
              }
            }
          }

          const data = await response.json();

          return {
            id: String(data.id || "1"),
            name: data.username || (credentials.username as string),
            email: `${credentials.username}@myamministratore.local`,
            role: data.role || "admin",
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
    maxAge: 6 * 60 * 60, // 6 hours
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
        maxAge: 6 * 60 * 60, // 6 hours — matches session.maxAge
      },
    },
    callbackUrl: {
      name: `myamministratore.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 6 * 60 * 60,
      },
    },
    csrfToken: {
      name: `myamministratore.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 6 * 60 * 60,
      },
    },
  },
  debug: false,
});
