export function StudentDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-4 sm:pt-6">
          <div className="h-5 w-24 bg-muted rounded-lg" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted rounded-xl" />
            <div className="h-9 w-28 bg-muted rounded-xl" />
          </div>
        </div>

        {/* Student header card */}
        <div className="rounded-[1.5rem] sm:rounded-[2rem] bg-white border border-slate-200 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 items-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-muted mx-auto sm:mx-0" />
            <div className="flex-1 w-full space-y-3">
              <div className="h-7 sm:h-8 md:h-9 w-48 bg-muted rounded-lg mx-auto sm:mx-0" />
              <div className="h-4 w-64 bg-muted rounded-md mx-auto sm:mx-0" />
              <div className="flex justify-center sm:justify-start gap-3">
                <div className="h-6 w-28 bg-muted rounded-full" />
                <div className="h-6 w-24 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 flex-1 bg-muted rounded-xl" />
          ))}
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 md:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-muted" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
              <div className="h-7 sm:h-8 w-20 bg-muted rounded mb-1" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
          ))}
        </div>

        {/* Two-column content */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
            <div className="h-5 w-36 bg-muted rounded" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
            <div className="h-5 w-28 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
