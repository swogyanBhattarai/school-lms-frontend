import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "accessKey";

console.log("authMiddleware module loaded"); // top of file, outside any function

type JwtPayload = {
  exp?: number;
  roles?: string[];
  schoolId?: number;
  slug?: string;
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
  // Return cached slugs if still fresh
  if (slugCache && Date.now() - slugCache.timestamp < CACHE_TTL) {
    return slugCache.slugs;
  }

  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api/school/slugs`;

  try {
    const res = await fetch(url);
    const slugs: string[] = await res.json();
    slugCache = { slugs, timestamp: Date.now() };
    return slugs;
  } catch (error) {
    console.error("Slug fetch failed:", error);
    return slugCache?.slugs ?? [];
  }
}

// ── Known root domain ──
// Must be set in production, e.g. KNOWN_DOMAIN=swogyanbhattarai.com.np
// If not set, the middleware will reject all non-localhost requests.
const KNOWN_DOMAIN = process.env.KNOWN_DOMAIN;

console.log(`authMiddleware loaded with KNOWN_DOMAIN=${KNOWN_DOMAIN}`);

// ── Subdomain extraction ──
// Matches hostname against the known root domain or localhost.
// Returns the tenant slug, or null if no valid subdomain is found.
//
// Examples with KNOWN_DOMAIN = "swogyanbhattarai.com.np":
//   localhost                              → null
//   school-a.localhost                     → "school-a"
//   foo.school-a.localhost                 → null     (too many labels)
//   swogyanbhattarai.com.np                → null     (bare domain)
//   www.swogyanbhattarai.com.np            → null     (www ignored)
//   school-a.swogyanbhattarai.com.np       → "school-a"
//   foo.school-a.swogyanbhattarai.com.np   → null     (too many labels)
//   domain.com.np                          → null     (doesn't match known domain)
//   evil.com                               → null     (doesn't match known domain)
function extractSubdomain(hostname: string): string | null {
  // ── Localhost development ──
  if (hostname.endsWith(".localhost")) {
    const prefix = hostname.slice(0, -".localhost".length);
    // Must be a single label — "foo.school-a.localhost" is invalid
    return prefix.includes(".") ? null : prefix;
  }
  if (hostname === "localhost") return null;

  // ── Production ──
  const domainSuffix = "." + KNOWN_DOMAIN;
  if (hostname.endsWith(domainSuffix)) {
    const prefix = hostname.slice(0, -domainSuffix.length);
    if (!prefix || prefix === "www") return null;
    // Must be a single label — "foo.school-a.domain.com" is invalid
    return prefix.includes(".") ? null : prefix;
  }

  // Doesn't match our domain at all — no valid subdomain
  return null;
}

// ── Exact public path match (NOT startsWith) ──
function isPublicPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === "/login"
    || normalized === "/not-found"
    || normalized === "/parent/login";
}

// ── Detect localhost development ──
function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname.endsWith(".localhost");
}

// ── Build a cross-subdomain URL that works on both localhost and production ──
// On localhost:  subdomain.localhost:PORT/path
// On production: subdomain.KNOWN_DOMAIN/path
function subdomainUrl(subdomain: string, hostname: string, baseUrl: string | URL, pathname: string): URL {
  const url = new URL(pathname, baseUrl);
  if (isLocalhost(hostname)) {
    url.host = `${subdomain}.localhost`;
  } else if (KNOWN_DOMAIN) {
    url.host = `${subdomain}.${KNOWN_DOMAIN}`;
  }
  return url;
}

// ── Middleware ──
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  console.log(`[proxy] ${pathname} host=${hostname}`);

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  let schoolSlug: string | null = null;
  let isParentPortal = false;
  const isLocalhostDev = isLocalhost(hostname);

  if (isLocalhostDev && hostname === "localhost") {
    console.log("[proxy] bare localhost, skipping subdomain check");
  } else {
    schoolSlug = extractSubdomain(hostname);
    console.log(`[proxy] extracted slug: ${schoolSlug}`);

    // ── Parent portal subdomain — skip tenant slug validation ──
    isParentPortal = schoolSlug === "parents";

    if (isParentPortal) {
      console.log("[proxy] parent portal detected");
    } else {
      if (!schoolSlug || schoolSlug === "www") {
        console.log("[proxy] no valid slug, redirecting to /not-found");
        return NextResponse.redirect(new URL("/not-found", request.url));
      }

      const validSlugs = await getValidSlugs();
      console.log(`[proxy] validSlugs=${JSON.stringify(validSlugs)}`);

      if (validSlugs.length > 0 && !validSlugs.includes(schoolSlug)) {
        console.log(`[proxy] slug "${schoolSlug}" not in validSlugs, redirecting`);
        return NextResponse.redirect(new URL("/not-found", request.url));
      }
    }
  }

  if (isPublicPath(pathname)) {
    // On parent portal, redirect the regular /login to /parent/login
    // so the schoolSlug cookie isn't accidentally sent as a tenant slug.
    if (isParentPortal && pathname === "/login") {
      console.log("[proxy] redirecting /login to /parent/login on parent portal");
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }

    console.log("[proxy] public path, passing through");
    const res = NextResponse.next();
    // Don't set schoolSlug cookie on the parent portal — "parents" is not a tenant slug
    if (schoolSlug && !isParentPortal) res.cookies.set("schoolSlug", schoolSlug, { path: "/", httpOnly: false });
    return res;
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  console.log(`[proxy] token present=${!!token}, expired=${token ? isTokenExpired(token) : "n/a"}`);
  if (!token || isTokenExpired(token)) {
    const url = request.nextUrl.clone();
    url.pathname = isParentPortal ? "/parent/login" : "/login";
    console.log(`[proxy] no/expired token, redirecting to ${url.pathname}`);
    return NextResponse.redirect(url);
  }

  // ── Role routing ──
  const payload = decodeJwtPayload(token);
  const roles = payload?.roles ?? [];

  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");
  const isTeacher = roles.includes("ROLE_TEACHER") || roles.includes("TEACHER");
  const isParent = roles.includes("ROLE_PARENT") || roles.includes("PARENT");

  // ── Root path redirect ──
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    if (isParentPortal) {
      url.pathname = isParent ? "/parent" : "/parent/login";
    } else if (isAdmin) {
      url.pathname = "/admin";
    } else if (isTeacher) {
      url.pathname = "/teacher";
    } else if (isParent) {
      // Parent on bare localhost without tenant context — go to /parent directly
      url.pathname = "/parent";
    } else {
      url.pathname = "/student";
    }
    return NextResponse.redirect(url);
  }

  // ── Admin/teacher route guards (existing) ──
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/teacher") && !isTeacher && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Parent portal guard: NON-parent on parent portal → redirect to their school ──
  if (isParentPortal && !isParent && pathname !== "/parent/login") {
    const slug = payload?.slug;
    if (slug && isAdmin) {
      const dest = subdomainUrl(slug, hostname, request.url, "/admin");
      console.log(`[proxy] non-parent on parent portal, redirecting to ${dest.host}/admin`);
      return NextResponse.redirect(dest);
    }
    if (slug && isTeacher) {
      const dest = subdomainUrl(slug, hostname, request.url, "/teacher");
      console.log(`[proxy] non-parent on parent portal, redirecting to ${dest.host}/teacher`);
      return NextResponse.redirect(dest);
    }
    // Fallback — redirect to parent login with error
    console.log("[proxy] non-parent on parent portal, redirecting to /parent/login?error=unauthorized");
    return NextResponse.redirect(new URL("/parent/login?error=unauthorized", request.url));
  }

  // ── School subdomain guard: PARENT on school subdomain → redirect to parent portal ──
  if (isParent && !isParentPortal) {
    // On bare localhost without a tenant subdomain, there's no parent portal to redirect to
    if (isLocalhostDev && !schoolSlug) {
      console.log("[proxy] parent on bare localhost, allowing pass-through");
    } else {
      const dest = subdomainUrl("parents", hostname, request.url, pathname);
      console.log(`[proxy] parent on school subdomain, redirecting to ${dest.host}${pathname}`);
      return NextResponse.redirect(dest);
    }
  }

  // ── /parent/* guard: require PARENT role everywhere ──
  if (pathname.startsWith("/parent") && !isParent) {
    console.log("[proxy] non-parent accessing /parent/*, redirecting to own dashboard");
    const url = request.nextUrl.clone();
    if (isAdmin) url.pathname = "/admin";
    else if (isTeacher) url.pathname = "/teacher";
    else url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // ── Final response with cookie ──
  const res = NextResponse.next();
  // Don't set schoolSlug on parent portal — "parents" is not a valid tenant slug
  if (schoolSlug && !isParentPortal) res.cookies.set("schoolSlug", schoolSlug, { path: "/", httpOnly: false });
  return res;
}

// config is exported from proxy.ts directly (Next.js requires it to be statically analyzable)
