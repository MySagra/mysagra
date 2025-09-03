import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // For all other paths, let intl middleware handle locale routing
  const intlResponse = intlMiddleware(request);

  // Get the pathname that would be used after intl processing
  const finalPathname = intlResponse?.headers?.get('x-pathname') || pathname;

  // Check if the final route (after locale processing) is protected
  const isProtectedRoute = finalPathname.match(/^\/[a-z]{2}\/(admin|operator)/);

  if (isProtectedRoute) {
    const token = request.cookies.get('token');

    if (!token) {
      // Extract locale from the processed pathname
      const localeMatch = finalPathname.match(/^\/([a-z]{2})\//);
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;

      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  // Return the intl response (which may be a redirect to add locale prefix)
  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};