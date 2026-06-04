import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const USER_COOKIE = "myamministratore_user";

async function getSession(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; username: string; role: string };
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const session = await getSession(req);
  const isLoggedIn = !!session;
  const { pathname } = req.nextUrl;
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnSetup = pathname === "/setup";

  if ((isOnDashboard || isOnSetup) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  const role = session?.role;

  // Maintainer non può accedere agli utenti
  if (isLoggedIn && role === "maintainer") {
    const restricted = ["/dashboard/users"];
    if (restricted.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  // Operator può accedere solo a sezioni di sola lettura
  if (isLoggedIn && role === "operator") {
    const allowed = [
      "/dashboard",
      "/dashboard/categories",
      "/dashboard/foods",
      "/dashboard/ingredients",
      "/dashboard/stations",
      "/dashboard/printers",
      "/dashboard/cash-registers",
    ];
    const isAllowed = allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/setup"],
};
