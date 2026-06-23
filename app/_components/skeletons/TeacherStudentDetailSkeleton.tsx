export function TeacherStudentDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Back button */}
        <div className="pt-4 sm:pt-6">
          <div className="h-5 w-24 bg-muted rounded-lg" />
        </div>

        {/* Profile section */}
        <div className="rounded-[1.5rem] sm:rounded-[2rem] bg-white border border-slate-200 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted" />
            <div className="flex-1 w-full space-y-3 text-center sm:text-left">
              <div className="h-7 sm:h-8 w-44 bg-muted rounded-lg mx-auto sm:mx-0" />
              <div className="h-4 w-56 bg-muted rounded-md mx-auto sm:mx-0" />
              <div className="flex justify-center sm:justify-start gap-3">
                <div className="h-6 w-24 bg-muted rounded-full" />
                <div className="h-6 w-28 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-muted" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-5 w-12 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Attendance overview */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
            <div className="h-5 w-40 bg-muted rounded" />
          </div>
          <div className="p-4 sm:p-6 grid lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-5 h-56 bg-muted rounded-xl" />
            <div className="lg:col-span-7 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily attendance */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
            <div className="h-5 w-36 bg-muted rounded" />
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-[calc(50%-0.5rem)] sm:w-[150px] h-28 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Diary section */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
            <div className="h-5 w-28 bg-muted rounded" />
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
