export function AttendanceSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-20 bg-muted rounded-lg" />
        <div className="h-6 w-44 bg-muted rounded-lg" />
      </div>

      {/* Section info + stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 flex-1 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-3 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-9 sm:h-10 flex-1 bg-muted rounded-xl" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-20 bg-muted rounded-full" />
          ))}
        </div>
      </div>

      {/* Student cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="flex gap-1">
                <div className="h-7 flex-1 bg-muted rounded-lg" />
                <div className="h-7 flex-1 bg-muted rounded-lg" />
                <div className="h-7 flex-1 bg-muted rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="h-14 sm:h-16 bg-muted rounded-xl" />
    </div>
  );
}
