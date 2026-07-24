import SubjectDetailPageClient from "./SubjectDetailPageClient";

export default async function SubjectDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const params = await searchParams;
  return <SubjectDetailPageClient initialSubjectName={params.subject} />;
}
