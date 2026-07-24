import DiaryPageClient from "./DiaryPageClient";

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectId?: string }>;
}) {
  const params = await searchParams;
  return <DiaryPageClient initialSubjectId={params.subjectId} />;
}
