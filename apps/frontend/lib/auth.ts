import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

function extractRefreshTokenFromCookies(response: Response): string | null {
  const setCookieHeader = response.headers.get("set-cookie");
  if (!setCookieHeader) return null;

  // set-cookie can contain multiple cookies separated by commas (or multiple headers)
  const cookies = setCookieHeader.split(/,(?=\s*\w+=)/);
  for (const cookie of cookies) {
    const match = cookie.match(/refreshToken=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${process.env.API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${token.refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Refresh token failed");
    }

    const data = await response.json();

    // Check if the backend sent a new refresh token cookie
    const newRefreshToken = extractRefreshTokenFromCookies(response);

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: newRefreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + (data.expiresIn || 3600) * 1000,
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

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

          const data = await response.json();

          if (!data.accessToken) {
            return null;
          }

          // Extract refresh token from Set-Cookie header (backend sends it as HTTP-only cookie)
          const refreshToken = extractRefreshTokenFromCookies(response);

          return {
            id: String(data.user?.id || "1"),
            name: data.user?.username || (credentials.username as string),
            email: `${credentials.username}@myamministratore.local`,
            token: data.accessToken,
            refreshToken: refreshToken || undefined,
            role: data.user?.role || "admin",
            expiresIn: data.expiresIn || 3600,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && account) {
        return {
          ...token,
          accessToken: (user as any).token,
          refreshToken: (user as any).refreshToken || null,
          accessTokenExpires: Date.now() + ((user as any).expiresIn || 3600) * 1000,
          id: user.id,
          role: (user as any).role,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it if we have a refresh token
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      // No refresh token available, return token as is (will trigger re-login)
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.user.role = token.role as string;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
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
      },
    },
    callbackUrl: {
      name: `myamministratore.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `myamministratore.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: false,
});
