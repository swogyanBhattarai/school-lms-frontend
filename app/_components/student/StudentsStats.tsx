import { BookOpen, CheckCircle2, School, Users } from "lucide-react";

type StudentsStatsProps = {
  totalStudents: number;
  classesCount: number;
  sectionsCount: number;
  currentPage: number;
  totalPages: number;
  studentsLoading: boolean;
  classesLoading: boolean;
};

export default function StudentsStats({
  totalStudents,
  classesCount,
  sectionsCount,
  currentPage,
  totalPages,
  studentsLoading,
  classesLoading,
}: StudentsStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-xl font-bold">
                {studentsLoading ? (
                <span className="inline-block h-5 w-12 bg-muted rounded animate-pulse" />
              ) : (
                totalStudents
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <School className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Classes</p>
            <p className="text-xl font-bold">
                {classesLoading ? (
                <span className="inline-block h-5 w-12 bg-muted rounded animate-pulse" />
              ) : (
                classesCount
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <BookOpen className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sections</p>
            <p className="text-xl font-bold">{sectionsCount}</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Page</p>
            <p className="text-xl font-bold">
              {currentPage} / {totalPages}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
