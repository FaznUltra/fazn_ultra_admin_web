import { NextRequest, NextResponse } from 'next/server';

// Auth pages — redirect authenticated users away to /
const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

// Always accessible regardless of auth state (e.g. mid-flow pages)
const ALWAYS_PUBLIC = ['/register/verify'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('fazn_access')?.value;

  if (ALWAYS_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const isAuthPage = AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Authenticated user hitting an auth page → send to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Unauthenticated user hitting a protected page → send to login
  if (!isAuthPage && !token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico|woff2?|ttf)).*)'],
};
