import { Suspense } from "react";
import StudentDetailPageClient from "./StudentDetailPageClient";
import { StudentDetailSkeleton } from "@/app/_components/skeletons/StudentDetailSkeleton";

export default function StudentDetailsPage() {
  return (
    <Suspense fallback={<StudentDetailSkeleton />}>
      <StudentDetailPageClient />
    </Suspense>
  );
}
