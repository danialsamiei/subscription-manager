import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicPaths = [
  '/auth/login',
  '/auth/error',
  '/api/auth',
  '/api/init',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/manifest') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for SSO bypass mode (for development/self-hosted without SSO)
  if (process.env.SSO_ENABLED !== 'true') {
    return NextResponse.next();
  }

  // Check authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'subcorist-orcest-ai-secret-key-change-in-production',
  });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
