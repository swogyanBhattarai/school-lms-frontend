import { Suspense } from "react";
import FeesPageClient from "./FeesPageClient";
import { FeesSkeleton } from "@/app/_components/skeletons/FeesSkeleton";

export default function FeesPage() {
  return (
    <Suspense fallback={<FeesSkeleton />}>
      <FeesPageClient />
    </Suspense>
  );
}
