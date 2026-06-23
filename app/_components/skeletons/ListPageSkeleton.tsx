export function ListPageSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-2">
          <div className="h-7 sm:h-9 w-36 bg-muted rounded-lg" />
          <div className="h-4 w-56 bg-muted rounded-md" />
        </div>
        <div className="h-9 sm:h-10 w-36 bg-muted rounded-xl" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex-shrink-0" />
              <div className="min-w-0 space-y-1 flex-1">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-5 w-12 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="h-9 sm:h-10 w-full sm:w-72 bg-muted rounded-xl" />

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[...Array(cardCount)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="border-t" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="space-y-1 text-center">
                  <div className="h-4 w-10 bg-muted rounded mx-auto" />
                  <div className="h-3 w-12 bg-muted rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
