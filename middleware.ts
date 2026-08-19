import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/anmelden",
  "/api/login",
  "/api/logout",
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow public paths and assets
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/anmelden";
    url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/homepage/:path*",
    "/tagebuch/:path*",
    "/sponsoren/:path*",
    "/homepage",
    "/tagebuch",
    "/sponsoren",
  ],
};
