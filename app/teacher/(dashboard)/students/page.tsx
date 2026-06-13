// app/teacher/(dashboard)/students/page.tsx
import { Suspense } from "react";
import TeacherStudentsPageClient from "./TeacherStudentsPageClient";

export default function TeacherStudentsPage() {
  return (
    <Suspense fallback={<div>Loading students…</div>}>
      <TeacherStudentsPageClient />
    </Suspense>
  );
}