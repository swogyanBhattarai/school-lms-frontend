export function AcademicYearsSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-2">
          <div className="h-7 sm:h-9 w-44 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted rounded-md" />
        </div>
        <div className="h-9 sm:h-10 w-40 bg-muted rounded-xl" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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

      {/* Search */}
      <div className="h-9 sm:h-10 w-full sm:w-80 bg-muted rounded-xl" />

      {/* Accordion items */}
      <div className="space-y-2 sm:space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
              <div className="h-8 w-8 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
