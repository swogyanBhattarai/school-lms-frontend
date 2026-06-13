// app/admin/(dashboard)/students/page.tsx
import { Suspense } from "react";
import StudentsPageClient from "./StudentsPageClient";

export default function StudentsPage() {
  return (
    <Suspense fallback={<div>Loading students...</div>}>
      <StudentsPageClient />
    </Suspense>
  );
}