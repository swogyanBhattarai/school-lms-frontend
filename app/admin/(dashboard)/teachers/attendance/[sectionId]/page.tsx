import AdminAttendancePageClient from "./AdminAttendancePageClient";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    subjectId?: string;
    teacherId?: string;
    attendanceDate?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <AdminAttendancePageClient
      initialSubjectId={params.subjectId}
      initialTeacherId={params.teacherId}
      initialAttendanceDate={params.attendanceDate}
    />
  );
}
