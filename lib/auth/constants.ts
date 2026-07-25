/**
 * مسارات المصادقة العامة
 * (أُزيل AUTH_COOKIE — الجلسة الآن من Auth.js)
 */

export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export const AUTH_ROUTES = PUBLIC_ROUTES;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isProtectedRoute(pathname: string): boolean {
  if (pathname === "/") return false;
  if (isPublicRoute(pathname)) return false;
  if (pathname.startsWith("/api/auth")) return false;
  if (pathname.startsWith("/api/webhooks")) return false;
  return true;
}
