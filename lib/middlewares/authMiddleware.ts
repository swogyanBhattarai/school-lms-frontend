import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "accessKey";

// ── Debug logging — gated so prod builds don't log on every request ──
const DEBUG =
  process.env.NODE_ENV !== "production" ||
  process.env.MIDDLEWARE_DEBUG === "1";
const log = DEBUG ? console.log : () => {};

// ── JWT — decoded WITHOUT signature verification ──
// This middleware uses the JWT payload for UX routing only (which dashboard to
// show). Every backend API call independently verifies the JWT signature and
// re-derives authority from the database. An attacker forging the payload here
// gains no backend access — they'll just see the wrong dashboard briefly.
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
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  try {
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  if (!payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

// ── Slug cache (module-level, survives warm middleware invocations) ──
// NOTE: On Vercel Edge / serverless, instances are ephemeral and
// geographically distributed. This cache is per-instance only — there is
// no shared/consistent cache across regions. Staleness varies by instance.
let slugCache: { slugs: string[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function getValidSlugs(): Promise<string[]> {
  if (slugCache && Date.now() - slugCache.timestamp < CACHE_TTL) {
    return slugCache.slugs;
  }

  const url = `${
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  }/api/school/slugs`;

  try {
    const res = await fetch(url);
    const slugs: string[] = await res.json();
    slugCache = { slugs, timestamp: Date.now() };
    return slugs;
  } catch (error) {
    console.error("Slug fetch failed:", error);
    // Fail-open: if the backend is unreachable AND cache is empty, every
    // slug is accepted. This is an intentional availability-over-strictness
    // tradeoff — the real tenant boundary is the backend's schoolId filter,
    // not this middleware pre-check. If the backend is down, individual
    // API calls will fail with 401/403, not silently leak data.
    return slugCache?.slugs ?? [];
  }
}

// ── Known root domain ──
const KNOWN_DOMAIN = process.env.KNOWN_DOMAIN;

log(`authMiddleware loaded with KNOWN_DOMAIN=${KNOWN_DOMAIN}`);

// ── Subdomain extraction ──
function extractSubdomain(hostname: string): string | null {
  if (hostname.endsWith(".localhost")) {
    const prefix = hostname.slice(0, -".localhost".length);
    return prefix.includes(".") ? null : prefix;
  }
  if (hostname === "localhost") return null;

  const domainSuffix = "." + KNOWN_DOMAIN;
  if (hostname.endsWith(domainSuffix)) {
    const prefix = hostname.slice(0, -domainSuffix.length);
    if (!prefix || prefix === "www") return null;
    return prefix.includes(".") ? null : prefix;
  }

  return null;
}

// ── Detect localhost development ──
function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname.endsWith(".localhost");
}

// ── Portal classification ──
// "parent"  → parents.domain.com      (parent-only portal)
// "tenant"  → school-a.domain.com     (school-specific tenant)
// "none"    → bare domain / localhost (no tenant context)
type Portal = "parent" | "tenant" | "none";

function resolvePortal(schoolSlug: string | null): Portal {
  if (schoolSlug === "parents") return "parent";
  if (schoolSlug) return "tenant";
  return "none";
}

// ── Table-driven home-routing ──
const HOME_BY_ROLE: Record<Portal, Record<string, string>> = {
  tenant: {
    admin: "/admin",
    teacher: "/teacher",
    parent: "/parent",
    default: "/student",
  },
  parent: {
    parent: "/parent",
    default: "/parent/login",
  },
  none: {
    admin: "/admin",
    teacher: "/teacher",
    parent: "/parent",
    default: "/student",
  },
};

// ── Public path detection — exact match only ──
function isPublicPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return (
    normalized === "/login" ||
    normalized === "/not-found" ||
    normalized === "/parent/login"
  );
}

// ── Build a cross-subdomain URL ──
// Uses .hostname (never .host) so the port from baseUrl is preserved on
// localhost and explicitly cleared in production. Per the URL spec, setting
// .hostname never touches the port — whatever port baseUrl carries (:3000
// in dev, nothing in prod) survives automatically. Only production needs an
// explicit .port = "" to scrub any dev port that may have been baked in.
function subdomainUrl(
  subdomain: string,
  hostname: string,
  baseUrl: string | URL,
  pathname: string,
): URL {
  const url = new URL(pathname, baseUrl);
  if (isLocalhost(hostname)) {
    url.hostname = `${subdomain}.localhost`;
    // Port from baseUrl (:3000) is preserved automatically — no need to set it.
  } else if (KNOWN_DOMAIN) {
    url.hostname = `${subdomain}.${KNOWN_DOMAIN}`;
    url.port = ""; // scrub any dev port — production serves on 443
  }
  return url;
}

// ── Role helpers — both forms for backward compat with old/new JWT formats ──
function hasRole(roles: string[], ...candidates: string[]): boolean {
  return candidates.some((c) => roles.includes(c));
}

type RoleSet = { isAdmin: boolean; isTeacher: boolean; isParent: boolean };
function classifyRoles(roles: string[]): RoleSet {
  return {
    isAdmin: hasRole(roles, "ROLE_ADMIN", "ADMIN"),
    isTeacher: hasRole(roles, "ROLE_TEACHER", "TEACHER"),
    isParent: hasRole(roles, "ROLE_PARENT", "PARENT"),
  };
}

// ── Helpers: should the middleware be bypassed? ──
function shouldBypass(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api")
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PHASE 1 — Tenant resolution
// ══════════════════════════════════════════════════════════════════════

type TenantInfo = {
  schoolSlug: string | null;
  isParentPortal: boolean;
  isLocalhostDev: boolean;
  portal: Portal;
  hostname: string; // from Host header (public-facing), NOT request.nextUrl.hostname
};

async function resolveTenant(
  request: NextRequest,
): Promise<{ tenant: TenantInfo } | { redirect: NextResponse }> {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  const isLocalhostDev = isLocalhost(hostname);

  // Bare localhost — no tenant context at all
  if (isLocalhostDev && hostname === "localhost") {
    log("[proxy] bare localhost, no tenant context");
    return {
      tenant: {
        schoolSlug: null,
        isParentPortal: false,
        isLocalhostDev: true,
        portal: "none",
        hostname,
      },
    };
  }

  const schoolSlug = extractSubdomain(hostname);
  log(`[proxy] extracted slug: ${schoolSlug}`);

  // Parent portal — not a tenant slug, skip validation
  if (schoolSlug === "parents") {
    log("[proxy] parent portal detected");
    return {
      tenant: {
        schoolSlug,
        isParentPortal: true,
        isLocalhostDev,
        portal: "parent",
        hostname,
      },
    };
  }

  // Must be a valid tenant slug
  if (!schoolSlug || schoolSlug === "www") {
    log("[proxy] no valid slug, redirecting to /not-found");
    return { redirect: NextResponse.redirect(new URL("/not-found", request.url)) };
  }

  const validSlugs = await getValidSlugs();
  log(`[proxy] validSlugs=${JSON.stringify(validSlugs)}`);

  if (validSlugs.length > 0 && !validSlugs.includes(schoolSlug)) {
    log(`[proxy] slug "${schoolSlug}" not in validSlugs, redirecting`);
    return { redirect: NextResponse.redirect(new URL("/not-found", request.url)) };
  }

  return {
    tenant: {
      schoolSlug,
      isParentPortal: false,
      isLocalhostDev,
      portal: "tenant",
      hostname,
    },
  };
}

// ══════════════════════════════════════════════════════════════════════
//  PHASE 2 — Public path handling
// ══════════════════════════════════════════════════════════════════════

function handlePublicPath(
  request: NextRequest,
  tenant: TenantInfo,
): NextResponse {
  // On parent portal, redirect /login → /parent/login so the parent-specific
  // login form (which never reads/sends schoolSlug) is used instead of the
  // regular form, which would pick up the "parents" cookie value as a tenant slug.
  if (tenant.isParentPortal && request.nextUrl.pathname === "/login") {
    log("[proxy] redirecting /login to /parent/login on parent portal");
    return NextResponse.redirect(new URL("/parent/login", request.url));
  }

  log("[proxy] public path, passing through");
  const res = NextResponse.next();
  // Don't set schoolSlug on parent portal — "parents" is not a valid tenant slug
  if (tenant.schoolSlug && !tenant.isParentPortal) {
    res.cookies.set("schoolSlug", tenant.schoolSlug, {
      path: "/",
      httpOnly: false,
    });
  }
  return res;
}

// ══════════════════════════════════════════════════════════════════════
//  PHASE 3 — Authentication
// ══════════════════════════════════════════════════════════════════════

type AuthInfo = { payload: JwtPayload } & RoleSet;

function requireAuth(
  request: NextRequest,
  tenant: TenantInfo,
): { auth: AuthInfo } | { redirect: NextResponse } {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  log(
    `[proxy] token present=${!!token}, expired=${token ? isTokenExpired(token) : "n/a"}`,
  );

  if (!token || isTokenExpired(token)) {
    const url = request.nextUrl.clone();
    url.pathname = tenant.isParentPortal ? "/parent/login" : "/login";
    log(`[proxy] no/expired token, redirecting to ${url.pathname}`);
    return { redirect: NextResponse.redirect(url) };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = tenant.isParentPortal ? "/parent/login" : "/login";
    log("[proxy] unparseable token, redirecting to login");
    return { redirect: NextResponse.redirect(url) };
  }

  const roles = payload.roles ?? [];
  return {
    auth: { payload, ...classifyRoles(roles) },
  };
}

// ══════════════════════════════════════════════════════════════════════
//  PHASE 4 — Routing by role
// ══════════════════════════════════════════════════════════════════════

function routeByRole(
  request: NextRequest,
  tenant: TenantInfo,
  auth: AuthInfo,
): NextResponse {
  const { pathname } = request.nextUrl;
  const { hostname } = tenant; // from Host header, NOT request.nextUrl.hostname
  const { isAdmin, isTeacher, isParent, payload } = auth;

  // ── School subdomain: PARENT user → redirect to parent portal ──
  // Checked FIRST, before any path-specific guard, so a parent landing on
  // school-a.domain/admin gets one hop to parents.domain/parent instead of
  // three (/admin → / → /parent → parents.domain/parent).
  // Always redirect to /parent, not the original path — preserving pathname
  // would send parents to /admin or /teacher on the parent portal, where
  // those routes have no meaning and would render broken pages or 404s.
  if (isParent && !tenant.isParentPortal) {
    if (tenant.isLocalhostDev && !tenant.schoolSlug) {
      log("[proxy] parent on bare localhost, allowing pass-through");
    } else {
      const dest = subdomainUrl("parents", hostname, request.url, "/parent");
      log(`[proxy] parent on school subdomain, redirecting to ${dest.host}/parent`);
      return NextResponse.redirect(dest);
    }
  }

  // ── Root path: table lookup by portal + role ──
  if (pathname === "/") {
    const table = HOME_BY_ROLE[tenant.portal];
    const target =
      table[auth.isAdmin ? "admin" : auth.isTeacher ? "teacher" : auth.isParent ? "parent" : "default"] ??
      table.default;
    const url = request.nextUrl.clone();
    url.pathname = target;
    log(`[proxy] redirecting / → ${target}`);
    return NextResponse.redirect(url);
  }

  // ── Admin route guard ──
  if (pathname.startsWith("/admin") && !isAdmin) {
    log("[proxy] non-admin accessing /admin, redirecting to /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Teacher route guard (admins can also access teacher pages) ──
  if (pathname.startsWith("/teacher") && !isTeacher && !isAdmin) {
    log("[proxy] non-teacher accessing /teacher, redirecting to /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── /parent/* guard: PARENT role only ──
  if (pathname.startsWith("/parent") && !isParent) {
    log("[proxy] non-parent accessing /parent/*, redirecting to own dashboard");
    const url = request.nextUrl.clone();
    if (isAdmin) url.pathname = "/admin";
    else if (isTeacher) url.pathname = "/teacher";
    else url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // ── Parent portal: NON-parent on parents.domain.com → redirect to their school ──
  if (tenant.isParentPortal && !isParent) {
    const slug = payload?.slug;
    if (slug && isAdmin) {
      const dest = subdomainUrl(slug, hostname, request.url, "/admin");
      log(`[proxy] non-parent on parent portal, redirecting to ${dest.host}/admin`);
      return NextResponse.redirect(dest);
    }
    if (slug && isTeacher) {
      const dest = subdomainUrl(slug, hostname, request.url, "/teacher");
      log(`[proxy] non-parent on parent portal, redirecting to ${dest.host}/teacher`);
      return NextResponse.redirect(dest);
    }
    log("[proxy] non-parent on parent portal, redirecting to /parent/login?error=unauthorized");
    return NextResponse.redirect(
      new URL("/parent/login?error=unauthorized", request.url),
    );
  }

  // ── Final response: pass through with cookie if applicable ──
  const res = NextResponse.next();
  if (tenant.schoolSlug && !tenant.isParentPortal) {
    res.cookies.set("schoolSlug", tenant.schoolSlug, {
      path: "/",
      httpOnly: false,
    });
  }
  return res;
}

// ══════════════════════════════════════════════════════════════════════
//  MIDDLEWARE — thin orchestrator
// ══════════════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  log(`[proxy] ${pathname} host=${request.headers.get("host")}`);

  // ── Bypass for assets and API ──
  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  // ── Phase 1: Resolve tenant context ──
  const tenantResult = await resolveTenant(request);
  if ("redirect" in tenantResult) return tenantResult.redirect;

  // ── Phase 2: Public paths ──
  if (isPublicPath(pathname)) {
    return handlePublicPath(request, tenantResult.tenant);
  }

  // ── Phase 3: Authenticate ──
  const authResult = requireAuth(request, tenantResult.tenant);
  if ("redirect" in authResult) return authResult.redirect;

  // ── Phase 4: Route by role ──
  return routeByRole(request, tenantResult.tenant, authResult.auth);
}

// config is exported from proxy.ts directly (Next.js requires it to be
// statically analyzable, so it cannot be re-exported from here).
