// app/admin/(dashboard)/students/page.tsx
import StudentsPageClient from "./StudentsPageClient";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    studentName?: string;
    classId?: string;
    sectionId?: string;
    sortBy?: string;
    sortDir?: string;
    pageNum?: string;
    pageSize?: string;
    hasSectionAssignment?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <StudentsPageClient
      initialStudentName={params.studentName}
      initialClassId={params.classId}
      initialSectionId={params.sectionId}
      initialSortBy={params.sortBy}
      initialSortDir={params.sortDir}
      initialPageNum={params.pageNum}
      initialPageSize={params.pageSize}
      initialHasSectionAssignment={params.hasSectionAssignment}
    />
  );
}
