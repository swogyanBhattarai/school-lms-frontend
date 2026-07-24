import StudentDetailPageClient from "./StudentDetailPageClient";

export default async function StudentDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  return <StudentDetailPageClient initialTab={params.tab} />;
}
