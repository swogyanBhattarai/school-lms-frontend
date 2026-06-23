import { cn } from "@/lib/utils";

export function TeacherListSkeleton({ viewMode = "grid", cardCount = 6 }: { viewMode?: "grid" | "list"; cardCount?: number }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-2">
          <div className="h-7 sm:h-8 w-32 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 sm:w-24 bg-muted rounded-md" />
          <div className="h-9 w-24 sm:w-32 bg-muted rounded-md" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex-shrink-0" />
            <div className="min-w-0 space-y-1 flex-1">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-5 sm:h-6 w-12 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 bg-muted rounded-md" />
          <div className="h-4 w-20 bg-muted rounded-md" />
        </div>
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <div className="h-9 w-64 bg-muted rounded-md" />
          <div className="h-9 w-[72px] bg-muted rounded-md" />
        </div>
      </div>

      {/* Teacher cards/list */}
      {viewMode === "grid" ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(cardCount)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-3 sm:p-5 space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded-full mt-1.5" />
                </div>
              </div>
              <div className="border-t" />
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 bg-muted/30 rounded-lg p-2.5 sm:p-3">
                <div className="space-y-1 text-center">
                  <div className="h-4 sm:h-5 w-8 bg-muted rounded mx-auto" />
                  <div className="h-3 w-12 bg-muted rounded mx-auto" />
                </div>
                <div className="space-y-1 text-center">
                  <div className="h-4 sm:h-5 w-8 bg-muted rounded mx-auto" />
                  <div className="h-3 w-12 bg-muted rounded mx-auto" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 flex-1 bg-muted rounded-md" />
                <div className="h-8 flex-1 bg-muted rounded-md" />
                <div className="h-8 w-8 bg-muted rounded-md" />
              </div>
            </div>
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
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
          <div className="h-6 w-32 bg-muted rounded-md" />
        </div>
        <div className="h-10 bg-muted" />
        <div className="space-y-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-muted border-b" />
          ))}
        </div>
        <div className="px-4 sm:px-6 py-3 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}