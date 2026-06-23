import { cn } from "@/lib/utils";

export function StudentListSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="h-7 sm:h-8 w-32 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted rounded-md" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 sm:h-28 bg-muted rounded-xl" />
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 bg-muted rounded-md" />
          <div className="h-4 w-20 bg-muted rounded-md" />
        </div>
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <div className="h-9 w-48 lg:w-64 bg-muted rounded-md" />
          <div className="h-9 w-[130px] sm:w-[140px] bg-muted rounded-md" />
          <div className="h-9 w-[130px] sm:w-[140px] bg-muted rounded-md" />
          <div className="h-9 w-[110px] sm:w-[120px] bg-muted rounded-md" />
          <div className="h-9 w-[72px] bg-muted rounded-md" />
        </div>
      </div>

      {/* Student cards/list */}
      {viewMode === "grid" ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 sm:h-52 bg-muted rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="h-10 bg-muted" />
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-muted border-b" />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 border rounded-xl bg-card">
        <div className="h-4 w-32 bg-muted rounded-md" />
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 bg-muted rounded-md" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-8 bg-muted rounded-md" />
          ))}
          <div className="h-8 w-8 bg-muted rounded-md" />
          <div className="h-8 w-[60px] sm:w-[65px] bg-muted rounded-md ml-1 sm:ml-2" />
        </div>
      </div>
    </div>
  );
}