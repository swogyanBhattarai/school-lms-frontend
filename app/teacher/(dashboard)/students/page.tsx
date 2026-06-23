// app/teacher/(dashboard)/students/page.tsx
import { Suspense } from "react";
import TeacherStudentsPageClient from "./TeacherStudentsPageClient";
import { StudentListSkeleton } from "@/app/_components/skeletons/StudentListSkeleton";

export default function TeacherStudentsPage() {
  return (
    <Suspense fallback={<StudentListSkeleton />}>
      <TeacherStudentsPageClient />
    </Suspense>
  );
}