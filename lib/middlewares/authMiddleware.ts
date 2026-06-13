import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "accessKey";

type JwtPayload = {
  exp?: number;
  roles?: string[];
  schoolId?: number;
  sub?: string;
};

const decodeJwtPayload = (token: string) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  try {
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }
  return Date.now() >= payload.exp * 1000;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/login/", "/not-found", "/not-found/"];

  // Next.js internals — always skip
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Public pages — always allow
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;

  if (!token || isTokenExpired(token)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const payload = decodeJwtPayload(token);
  const roles = payload?.roles ?? [];

  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
  const isTeacher = roles.includes("ROLE_TEACHER") || roles.includes("TEACHER");
  const isStudent = roles.includes("ROLE_STUDENT") || roles.includes("STUDENT");

  // ── Root redirect → role home ──
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    if (isAdmin) {
      url.pathname = "/admin";
    } else if (isTeacher || isAdmin) {
      url.pathname = "/teacher";
    } else if (isStudent || isAdmin) {
      url.pathname = "/student";
    }
    return NextResponse.redirect(url);
  }

  // ── Admin route guard ──
  // All /admin/* routes require ROLE_ADMIN
  if (pathname.startsWith("/admin") && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

