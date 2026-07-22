export { middleware as proxy } from "./lib/middlewares/authMiddleware";

// Next.js requires config to be defined directly (not re-exported) for static analysis.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
