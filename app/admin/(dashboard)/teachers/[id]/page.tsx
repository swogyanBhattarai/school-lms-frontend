import TeacherDetailPageClient from "./TeacherDetailPageClient";

export default async function TeacherDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  return <TeacherDetailPageClient initialTab={params.tab} />;
}
