export function FeesSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-2">
          <div className="h-7 sm:h-9 w-32 bg-muted rounded-lg" />
          <div className="h-4 w-48 bg-muted rounded-md" />
        </div>
        <div className="h-9 w-28 bg-muted rounded-xl" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-36 bg-muted rounded-xl" />
        <div className="h-9 w-36 bg-muted rounded-xl" />
        <div className="h-9 w-20 bg-muted rounded-xl" />
      </div>

      {/* Fee list */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg sm:rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-muted rounded-full" />
                  <div className="h-5 w-14 bg-muted rounded-full" />
                </div>
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-2 bg-muted rounded-full w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
