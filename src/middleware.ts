import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get('parkbnb_auth_token')?.value;
  const hasAuth = Boolean(authToken && authToken.length > 10);

  // 1. Protect Customer Portal routes (/account/*)
  if (pathname.startsWith('/account')) {
    if (!hasAuth) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Host / Owner Portal routes (/host/*)
  if (pathname.startsWith('/host')) {
    if (!hasAuth) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Protect Admin Console routes (/admin/*)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!hasAuth) {
      const adminLoginUrl = new URL('/admin/login', request.url);
      adminLoginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // 4. Response with Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/account/:path*',
    '/host/:path*',
    '/admin/:path*',
  ],
};
