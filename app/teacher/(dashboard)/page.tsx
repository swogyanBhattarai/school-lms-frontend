"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
  PenLine,
  FileText,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/lib/utils";
import { getClassAssignmentsByTeacherId } from "@/lib/api/teacher";
import type { ClassAssignmentAttendanceResponse } from "@/types/lms";
import useHasMounted from "@/lib/hooks/useHasMounted";

export default function TeacherDashboard() {
  const hasMounted = useHasMounted();
  const router = useRouter();

  const { data: classAssignments = [], isLoading } = useQuery({
    queryKey: ["teacher-class-assignments"],
    queryFn: getClassAssignmentsByTeacherId,
  });

  const totalAssignments = classAssignments.length;
  const pendingCount = classAssignments.filter((a) => !a.attendanceCompleted).length;
  const completedCount = classAssignments.filter((a) => a.attendanceCompleted).length;

  const handleAttendance = (sectionId: number, subjectId: number) => {
    router.push(`/teacher/attendance/${sectionId}?subjectId=${subjectId}`);
  };

  const handleDiary = (sectionId: number, subjectId: number) => {
    router.push(`/teacher/diary/${sectionId}?subjectId=${subjectId}`);
  };

  if (!hasMounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Take attendance and log diary entries for your assigned classes.
        </p>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold">{totalAssignments}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Assignments</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Done</span>
          </div>
          <p className="text-2xl font-bold">{completedCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Attendance taken</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Needs attention</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-violet-600 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Students</span>
          </div>
          <p className="text-2xl font-bold">
            {classAssignments.reduce((s, a) => s + a.studentCount, 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Across classes</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-500" />
        </div>
      ) : classAssignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600">No assignments yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You haven&apos;t been assigned to any classes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Attendance Section */}
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Attendance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classAssignments.map((a) => (
                <div
                  key={a.classAssignmentId}
                  className="rounded-xl border bg-white overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shrink-0">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {a.subjectName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Grade {a.grade} &bull; Section {a.sectionName}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 text-[10px] border",
                          a.attendanceCompleted
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        {a.attendanceCompleted ? "Done" : "Due"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{a.studentCount} students</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-slate-50 border-t">
                    <Button
                      size="sm"
                      variant={a.attendanceCompleted ? "outline" : "default"}
                      className="w-full justify-between h-9 text-xs"
                      onClick={() => handleAttendance(a.sectionId, a.subjectId)}
                    >
                      <span>
                        {a.attendanceCompleted ? "View Attendance" : "Take Attendance"}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diary Section */}
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Daily Diary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classAssignments.map((a) => (
                <div
                  key={`diary-${a.classAssignmentId}`}
                  className="rounded-xl border bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => handleDiary(a.sectionId, a.subjectId)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <PenLine className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{a.subjectName}</p>
                      <p className="text-xs text-muted-foreground">
                        Grade {a.grade} &bull; Section {a.sectionName}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
