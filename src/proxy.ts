import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_TOKEN, COOKIE_USER_ROLE } from '@/lib/cookies';

// User roles enum (mirror of the actual enum for middleware use)
enum UserRole {
  Admin = "admin",
  SubAdmin = "sub-admin",
  ProjectEngineers = "project-engineers",
}

// Define route patterns with role-based access control
const ROUTE_CONFIG = {
  // Protected routes that require authentication
  // More specific routes should come before less specific ones
  protected: [
    { path: '/home', roles: null }, // All authenticated users
    // Projects module routes - all roles can access
    { path: '/projects/create', roles: [UserRole.Admin, UserRole.SubAdmin, UserRole.ProjectEngineers] },
    { path: '/projects', roles: [UserRole.Admin, UserRole.SubAdmin, UserRole.ProjectEngineers] },
    // Users management - Admin and SubAdmin only
    { path: '/users', roles: [UserRole.Admin, UserRole.SubAdmin] },
  ],
  
  // Authentication routes (based on actual app structure)
  auth: [
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password'
  ],
  
  // Public routes that don't require authentication
  public: [
    '/about',
    '/contact',
    '/terms'
  ],
  
  // API routes
  api: ['/api'],
  
  // Static assets and Next.js internal routes
  static: ['/_next', '/favicon.ico', '/assets', '/public', '/fonts', '/icons', '/locales']
} as const;

/**
 * Check if a pathname matches any of the given route patterns
 */
function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some(route => {
    if (route.endsWith('*')) {
      // Wildcard matching
      return pathname.startsWith(route.slice(0, -1));
    }
    // Exact matching or prefix matching for directories
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Find the matching protected route config for a pathname
 */
function findRouteConfig(pathname: string) {
  // Sort by path length descending to match most specific route first
  const sortedRoutes = [...ROUTE_CONFIG.protected];
  sortedRoutes.sort((a, b) => b.path.length - a.path.length);
  
  for (const route of sortedRoutes) {
    if (pathname === route.path || pathname.startsWith(route.path + '/')) {
      return route;
    }
  }
  return null;
}

/**
 * Check if user role has access to a route
 */
function hasRoleAccess(userRole: string | null, allowedRoles: readonly UserRole[] | null | undefined): boolean {
  // If no roles specified, all authenticated users have access
  if (!allowedRoles) return true;
  
  // If user has no role, deny access
  if (!userRole) return false;
  
  // Check if user's role is in the allowed list
  return allowedRoles.includes(userRole as UserRole);
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets and API routes
  if (matchesRoute(pathname, ROUTE_CONFIG.static) || 
      matchesRoute(pathname, ROUTE_CONFIG.api)) {
    return NextResponse.next();
  }

  // Get the token and role from cookies
  const token = request.cookies.get(COOKIE_TOKEN)?.value;
  const userRole = request.cookies.get(COOKIE_USER_ROLE)?.value || null;

  // Find the route config for the current path
  const routeConfig = findRouteConfig(pathname);
  const isProtectedRoute = !!routeConfig;
  const isAuthRoute = matchesRoute(pathname, ROUTE_CONFIG.auth);
  const isPublicRoute = matchesRoute(pathname, ROUTE_CONFIG.public);

  // Check if user is authenticated
  const hasToken = !!token;
  
  // Handle root route first (special case)
  if (pathname === '/') {
    if (hasToken) {
      return NextResponse.redirect(new URL('/home', request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }
  
  // Handle protected routes (dashboard, home, etc.)
  if (isProtectedRoute) {
    // Check authentication first
    if (!hasToken) {
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check role-based access
    if (routeConfig && routeConfig.roles && !hasRoleAccess(userRole, routeConfig.roles)) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    return NextResponse.next();
  }
  
  // Handle auth routes (login, register, etc.)
  if (isAuthRoute) {
    if (hasToken) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return NextResponse.next();
  }
  
  // Handle public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};