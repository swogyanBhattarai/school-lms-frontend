import AttendancePageClient from "./AttendancePageClient";

export default async function TakeAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ subjectId?: string }>;
}) {
  const params = await searchParams;
  return <AttendancePageClient initialSubjectId={params.subjectId} />;
}
