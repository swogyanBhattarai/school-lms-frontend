import Link from "next/link";

export default function NotFound() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you are looking for moved or was never published.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
