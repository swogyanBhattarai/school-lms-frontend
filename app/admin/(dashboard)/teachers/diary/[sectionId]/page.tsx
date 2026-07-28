import AdminDiaryPageClient from "./AdminDiaryPageClient";

export default async function AdminDiaryPage({
  searchParams,
}: {
  searchParams: Promise<{
    subjectId?: string;
    teacherId?: string;
    diaryDate?: string;
    subjectName?: string;
    teacherName?: string;
    grade?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <AdminDiaryPageClient
      initialSubjectId={params.subjectId}
      initialTeacherId={params.teacherId}
      initialDiaryDate={params.diaryDate}
      initialSubjectName={params.subjectName}
      initialTeacherName={params.teacherName}
      initialGrade={params.grade}
    />
  );
}
