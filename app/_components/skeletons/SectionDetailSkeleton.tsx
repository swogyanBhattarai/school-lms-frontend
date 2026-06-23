export function SectionDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded-lg" />
            <div className="h-4 w-56 bg-muted rounded-md" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted rounded-xl" />
          <div className="h-9 w-28 bg-muted rounded-xl" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
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

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-2xl w-full sm:w-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 sm:h-10 flex-1 sm:w-32 bg-muted rounded-xl" />
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-9 sm:h-10 flex-1 bg-muted rounded-xl" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted rounded-xl" />
          <div className="h-10 w-10 bg-muted rounded-xl" />
        </div>
      </div>

      {/* Content area */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-3">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
