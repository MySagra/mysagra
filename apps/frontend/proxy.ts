import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnSetup = pathname === "/setup";

  if ((isOnDashboard || isOnSetup) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se loggato e va su /login, rimanda alla dashboard
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Maintainer non può accedere agli utenti
  const role = (req.auth as any)?.user?.role as string | undefined;
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
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/setup"],
};
