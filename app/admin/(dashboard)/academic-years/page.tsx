import { Suspense } from "react";
import AcademicYearsPageClient from "./AcademicYearsPageClient";
import { AcademicYearsSkeleton } from "@/app/_components/skeletons/AcademicYearsSkeleton";

export default function AcademicYearsPage() {
  return (
    <Suspense fallback={<AcademicYearsSkeleton />}>
      <AcademicYearsPageClient />
    </Suspense>
  );
}
