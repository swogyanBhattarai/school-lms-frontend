import SectionDetailPageClient from "./SectionDetailPageClient";

export default async function SectionDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  return <SectionDetailPageClient initialTab={params.tab} />;
}
