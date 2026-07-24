// app/teacher/(dashboard)/students/page.tsx
import TeacherStudentsPageClient from "./TeacherStudentsPageClient";

export default async function TeacherStudentsPage({
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
    <TeacherStudentsPageClient
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
