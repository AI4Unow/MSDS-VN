import { auth } from "@/lib/auth/auth-config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes — no auth needed
  const publicPaths = ["/login", "/api/auth", "/public"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Root redirects to dashboard or login
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/login", req.nextUrl)
    );
  }

  // Protected routes — redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
