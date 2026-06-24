import { Suspense } from "react";
import AttendancePageClient from "./AttendancePageClient";
import { AttendanceSkeleton } from "@/app/_components/skeletons/AttendanceSkeleton";

export default function TakeAttendancePage() {
  return (
    <Suspense fallback={<AttendanceSkeleton />}>
      <AttendancePageClient />
    </Suspense>
  );
}
