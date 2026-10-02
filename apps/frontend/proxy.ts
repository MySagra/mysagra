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

// Once the setup is done it can't be undone, so stop asking the backend
let setupDone = false;

async function isSetupRequired(): Promise<boolean> {
  if (setupDone) return false;
  try {
    const response = await fetch(`${process.env.API_URL}/v1/setup/status`, { cache: "no-store" });
    if (!response.ok) return false;
    const { required } = (await response.json()) as { required?: boolean };
    if (!required) setupDone = true;
    return required === true;
  } catch {
    // backend unreachable: let the normal pages show their errors
    return false;
  }
}

export default async function middleware(req: NextRequest) {
  const session = await getSession(req);
  const isLoggedIn = !!session;
  const { pathname } = req.nextUrl;
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnSetup = pathname === "/setup";
  // Server actions are POSTs to the current page: redirecting them returns a page instead of the
  // action response ("An unexpected response was received from the server"). Only page navigations
  // are redirected here; e.g. the login fired from /setup right after the setup must pass through.
  const isPageNavigation = req.method === "GET" || req.method === "HEAD";

  // New instance (no users yet): every page leads to the setup wizard
  if (await isSetupRequired()) {
    return isOnSetup || !isPageNavigation ? NextResponse.next() : NextResponse.redirect(new URL("/setup", req.nextUrl.origin));
  }

  if (isOnSetup && isPageNavigation) {
    return NextResponse.redirect(new URL(isLoggedIn ? "/dashboard" : "/login", req.nextUrl.origin));
  }

  if (isOnDashboard && !isLoggedIn) {
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
