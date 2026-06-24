import { Suspense } from "react";
import TeacherStudentDetailPageClient from "./TeacherStudentDetailPageClient";
import { TeacherStudentDetailSkeleton } from "@/app/_components/skeletons/TeacherStudentDetailSkeleton";

export default function StudentDetailsPage() {
  return (
    <Suspense fallback={<TeacherStudentDetailSkeleton />}>
      <TeacherStudentDetailPageClient />
    </Suspense>
  );
}
