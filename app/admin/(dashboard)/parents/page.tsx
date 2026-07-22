// app/admin/(dashboard)/parents/page.tsx
import { Suspense } from "react";
import ParentsPageClient from "./ParentsPageClient";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-500" />
    </div>
  );
}

export default function ParentsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ParentsPageClient />
    </Suspense>
  );
}
