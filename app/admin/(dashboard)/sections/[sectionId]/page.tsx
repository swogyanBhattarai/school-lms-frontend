import { Suspense } from "react";
import SectionDetailPageClient from "./SectionDetailPageClient";
import { SectionDetailSkeleton } from "@/app/_components/skeletons/SectionDetailSkeleton";

export default function SectionDetailsPage() {
  return (
    <Suspense fallback={<SectionDetailSkeleton />}>
      <SectionDetailPageClient />
    </Suspense>
  );
}
