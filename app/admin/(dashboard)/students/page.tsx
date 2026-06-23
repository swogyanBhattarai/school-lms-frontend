// app/admin/(dashboard)/students/page.tsx
import { Suspense } from "react";
import StudentsPageClient from "./StudentsPageClient";
import { StudentListSkeleton } from "@/app/_components/skeletons/StudentListSkeleton";

export default function StudentsPage() {
  return (
    <Suspense fallback={<StudentListSkeleton />}>
      <StudentsPageClient />
    </Suspense>
  );
}