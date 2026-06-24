import { Suspense } from "react";
import SubjectsPageClient from "./SubjectsPageClient";
import { ListPageSkeleton } from "@/app/_components/skeletons/ListPageSkeleton";

export default function SubjectsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <SubjectsPageClient />
    </Suspense>
  );
}
