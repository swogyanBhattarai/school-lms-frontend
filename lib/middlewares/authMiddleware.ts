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
  if (parts.length !== 3) return null;
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
  // If the JWT can't be decoded at all, treat it as expired/invalid
  if (!payload) return true;
  // If there's no expiry claim, treat it as expired (defensive)
  if (!payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

// ── Slug cache (module-level, survives warm middleware invocations) ──
let slugCache: { slugs: string[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function getValidSlugs(): Promise<string[]> {
  if (slugCache && Date.now() - slugCache.timestamp < CACHE_TTL) {
    return slugCache.slugs;
  }
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api/school/slugs`,
    );
    const slugs: string[] = await res.json();
    slugCache = { slugs, timestamp: Date.now() };
    return slugs;
  } catch {
    return slugCache?.slugs ?? [];
  }
}

// ── Subdomain extraction ──
// "slug.localhost"         → "slug"
// "slug.domain.com"        → "slug"
// "slug.domain.com.np"     → "slug"
// "localhost"              → null
// "www.domain.com"         → null (www is ignored)
function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");
  if (parts.length === 1) return null;
  if (parts.length === 2) {
    return parts[0] === "localhost" ? null : parts[0];
  }
  const candidate = parts[0];
  return candidate === "www" ? null : candidate;
}

// ── Exact public path match (NOT startsWith) ──
function isPublicPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === "/login" || normalized === "/not-found";
}

// ── Middleware ──
export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Skip Next.js internals
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Allow API calls through (login, slug fetch, etc.)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ── Subdomain validation ──
  let schoolSlug: string | null = null;

  if (hostname === "localhost") {
    // Bare localhost is allowed for development — no slug needed
  } else {
    schoolSlug = extractSubdomain(hostname);
    if (!schoolSlug || schoolSlug === "www") {
      return NextResponse.redirect(new URL("/not-found", request.url));
    }

    const validSlugs = await getValidSlugs();

    // If the slug fetch fails (empty list), still allow the request through
    // so the backend can validate at login time rather than hard-blocking.
    if (validSlugs.length > 0 && !validSlugs.includes(schoolSlug)) {
      return NextResponse.redirect(new URL("/not-found", request.url));
    }
  }

  // ── Public paths (login, not-found) ──
  if (isPublicPath(pathname)) {
    const res = NextResponse.next();
    if (schoolSlug) res.cookies.set("schoolSlug", schoolSlug, { path: "/", httpOnly: false });
    return res;
  }

  // ── Auth check ──
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token || isTokenExpired(token)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ── Role routing ──
  const payload = decodeJwtPayload(token);
  const roles = payload?.roles ?? [];

  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
  const isTeacher = roles.includes("ROLE_TEACHER") || roles.includes("TEACHER");

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    if (isAdmin) {
      url.pathname = "/admin";
    } else if (isTeacher) {
      url.pathname = "/teacher";
    } else {
      url.pathname = "/student";
    }
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/teacher") && !isTeacher && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Final response with cookie ──
  const res = NextResponse.next();
  if (schoolSlug) res.cookies.set("schoolSlug", schoolSlug, { path: "/", httpOnly: false });
  return res;
}
