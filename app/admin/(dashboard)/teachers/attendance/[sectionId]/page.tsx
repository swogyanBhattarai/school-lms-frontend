import { Suspense } from "react";
import AdminAttendancePageClient from "./AdminAttendancePageClient";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-500" />
    </div>
  );
}

export default function AdminAttendancePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminAttendancePageClient />
    </Suspense>
  );
}
