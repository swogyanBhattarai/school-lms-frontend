"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  BookOpen,
  Calendar,
  Search,
  RotateCcw,
  Save,
  ChevronRight,
  Clock,
  X,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";

import { getStudents } from "@/lib/api/student";
import { getSectionById } from "@/lib/api/section";
import {
  createMassAttendanceByTeacher,
  getAttendanceBySectionAndSubjectAndTeacher,
} from "@/lib/api/attendance";
import type {
  AttendanceResponse,
  AttendanceStatus,
  MassAttendance,
  StudentAttendance as StudentAttendancePayload,
} from "@/types/lms";

// Status Configuration
const STATUS_CONFIG = {
  UNMARKED: {
    label: "Unmarked",
    icon: HelpCircle,
    color: "slate",
    bg: "bg-slate-50",
    text: "text-slate-400",
    border: "border-slate-200",
    activeBg: "bg-slate-400",
    activeText: "text-white",
  },
  PRESENT: {
    label: "Present",
    icon: CheckCircle2,
    color: "emerald",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    activeBg: "bg-emerald-500",
    activeText: "text-white",
  },
  ABSENT: {
    label: "Absent",
    icon: XCircle,
    color: "red",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    activeBg: "bg-red-500",
    activeText: "text-white",
  },
  LEAVE: {
    label: "Leave",
    icon: AlertCircle,
    color: "amber",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    activeBg: "bg-amber-500",
    activeText: "text-white",
  },
};

interface StudentState {
  studentId: number;
  studentName: string;
  status: AttendanceStatus | "UNMARKED";
}

export default function AdminAttendancePageClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const sectionId = parseInt(params.sectionId as string);
  const subjectId = parseInt(searchParams?.get("subjectId") || "0");
  const teacherId = parseInt(searchParams?.get("teacherId") || "0");

  const [search, setSearch] = useState("");
  const [studentStates, setStudentStates] = useState<StudentState[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | "ALL">(
    "ALL",
  );

  // Fetch Section Data
  const { data: section, isLoading: isSectionLoading } = useQuery({
    queryKey: ["section", sectionId],
    queryFn: () => getSectionById(sectionId),
    enabled: !!sectionId,
  });

  // Fetch Students Data
  const { data: studentsResponse, isLoading: isStudentsLoading } = useQuery({
    queryKey: ["students", { sectionId }],
    queryFn: () =>
      getStudents({
        sectionId,
        pageSize: 100,
        sortBy: "studentName",
        sortDir: "ASC",
      }),
    enabled: !!sectionId,
  });

  const attendanceDate = searchParams?.get("attendanceDate") || undefined;

  const { data: attendanceResponse, isSuccess: isAttendanceLoaded } = useQuery({
    queryKey: ["admin-attendance", { sectionId, subjectId, teacherId, attendanceDate }],
    queryFn: () =>
      getAttendanceBySectionAndSubjectAndTeacher(sectionId, subjectId, teacherId, attendanceDate),
    enabled: !!sectionId && !!subjectId && !!teacherId,
  });

  // Initialize student states when data arrives
  useEffect(() => {
    if (studentsResponse?.content) {
      const statusByStudentId = new Map<number, AttendanceStatus>();
      (attendanceResponse ?? []).forEach((record: AttendanceResponse) => {
        statusByStudentId.set(record.studentId, record.attendanceStatus);
      });

      setStudentStates(
        studentsResponse.content.map((s) => ({
          studentId: s.studentId,
          studentName: s.studentName,
          status: statusByStudentId.has(s.studentId)
            ? statusByStudentId.get(s.studentId)!
            : "UNMARKED",
        })),
      );
    }
  }, [studentsResponse, attendanceResponse]);

  const isAttendanceLocked =
    isAttendanceLoaded && (attendanceResponse?.length ?? 0) > 0;

  // Mass Attendance Mutation
  const attendanceMutation = useMutation({
    mutationFn: (payload: MassAttendance) =>
      createMassAttendanceByTeacher(sectionId, subjectId, teacherId, payload),
    onSuccess: () => {
      toast({
        title: "Attendance Saved",
        description: "Attendance records have been successfully saved.",
      });
      router.push(`/admin/teachers/${teacherId}`);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(error, "Failed to save attendance."),
      });
    },
  });

  // Statistics
  const stats = useMemo(() => {
    const present = studentStates.filter((s) => s.status === "PRESENT").length;
    const absent = studentStates.filter((s) => s.status === "ABSENT").length;
    const leave = studentStates.filter((s) => s.status === "LEAVE").length;
    const unmarked = studentStates.filter((s) => s.status === "UNMARKED").length;
    return {
      present,
      absent,
      leave,
      unmarked,
      total: studentStates.length,
    };
  }, [studentStates]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return studentStates.filter((s) => {
      const matchesSearch = s.studentName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filterStatus === "ALL" || s.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [studentStates, search, filterStatus]);

  const updateStatus = (studentId: number, status: AttendanceStatus) => {
    setStudentStates((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s)),
    );
  };

  const markAll = (status: AttendanceStatus) => {
    setStudentStates((prev) => prev.map((s) => ({ ...s, status })));
  };

  const resetAll = () => {
    setStudentStates((prev) => prev.map((s) => ({ ...s, status: "UNMARKED" })));
  };

  const handleSave = () => {
    // Check if there are any unmarked students
    if (stats.unmarked > 0) {
      toast({
        variant: "destructive",
        title: "Unmarked Students",
        description: `Please mark all students before saving. ${stats.unmarked} student(s) are still unmarked.`,
      });
      return;
    }
    if (stats.total === 0 || isAttendanceLocked) return;
    setShowConfirmDialog(true);
  };

  const confirmSave = () => {
    const payload: MassAttendance = {
      attendanceDate: new Date().toISOString().split("T")[0],
      studentAttendances: studentStates
        .filter((s) => s.status !== "UNMARKED")
        .map((s) => ({
          studentId: s.studentId,
          attendanceStatus: s.status as AttendanceStatus,
        })),
    };
    attendanceMutation.mutate(payload);
    setShowConfirmDialog(false);
  };

  const displayDate = attendanceDate
    ? new Date(attendanceDate).toLocaleDateString("en-NP", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-NP", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  // Filter out UNMARKED from the card buttons
  const selectableStatuses = (Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>)
    .filter(status => status !== "UNMARKED");

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-24 sm:pb-28">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-slate-100 h-9 w-9 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
              Record Attendance
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {displayDate}
            </p>
          </div>
        </div>

        {/* Section Info Card - Refactored */}
<div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-6">
  {/* Main Info Card - Takes 3 columns on desktop */}
  <div className="lg:col-span-3 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm h-full">
    <div className="absolute right-0 top-0 h-full w-24 sm:w-32 bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
    <div className="flex flex-col h-full">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 flex-shrink-0">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <h2 className="text-base sm:text-xl font-bold truncate">
            Grade {section?.grade} - {section?.sectionName}
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              {stats.total} Students
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="flex items-center gap-1.5">
              Teacher ID: {teacherId}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions - pushed to bottom */}
      <div className="mt-auto pt-4 sm:pt-6 flex flex-wrap items-start gap-1.5 sm:gap-2">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground w-full sm:w-auto mr-1 sm:mr-2 pt-1">
          Quick Mark All:
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll("PRESENT")}
            disabled={isAttendanceLocked}
            className={cn(
              "rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-emerald-600 font-medium text-xs h-8",
              isAttendanceLocked && "opacity-60 cursor-not-allowed",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
            All Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll("ABSENT")}
            disabled={isAttendanceLocked}
            className={cn(
              "rounded-xl border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-red-600 font-medium text-xs h-8",
              isAttendanceLocked && "opacity-60 cursor-not-allowed",
            )}
          >
            <XCircle className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
            All Absent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll("LEAVE")}
            disabled={isAttendanceLocked}
            className={cn(
              "rounded-xl border-amber-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-amber-600 font-medium text-xs h-8",
              isAttendanceLocked && "opacity-60 cursor-not-allowed",
            )}
          >
            <Clock className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
            All Leave
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            disabled={isAttendanceLocked}
            className={cn(
              "rounded-xl text-slate-500 text-xs h-8",
              isAttendanceLocked && "opacity-60 cursor-not-allowed",
            )}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  </div>

  {/* Stats Summary Card - Takes 2 columns on desktop */}
  <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
    <h3 className="text-xs sm:text-sm font-bold mb-2 sm:mb-3">
      Live Summary
    </h3>
    <div className="space-y-2 sm:space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          Present
        </span>
        <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          {stats.present}
        </span>
      </div>
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{
            width: `${(stats.present / (stats.total || 1)) * 100}%`,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          Absent
        </span>
        <span className="text-[10px] sm:text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
          {stats.absent}
        </span>
      </div>
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-500 rounded-full transition-all duration-300"
          style={{
            width: `${(stats.absent / (stats.total || 1)) * 100}%`,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          Leave
        </span>
        <span className="text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          {stats.leave}
        </span>
      </div>
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300"
          style={{
            width: `${(stats.leave / (stats.total || 1)) * 100}%`,
          }}
        />
      </div>


    </div>
  </div>
</div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 py-3 px-1 border-y border-slate-200 -mx-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white h-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <Button
            variant={filterStatus === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("ALL")}
            disabled={isAttendanceLocked}
            className={cn(
              "rounded-full whitespace-nowrap text-xs h-8 flex-shrink-0",
              filterStatus === "ALL" ? "" : "",
              isAttendanceLocked && "opacity-60 cursor-not-allowed",
            )}
          >
            All
          </Button>
          <Button
            variant={filterStatus === "PRESENT" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("PRESENT")}
            className={cn(
              "rounded-full whitespace-nowrap text-xs h-8 flex-shrink-0",
              filterStatus !== "PRESENT" &&
                "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200",
              isAttendanceLocked && "opacity-60 cursor-not-allowed",
            )}
            disabled={isAttendanceLocked}
          >
            Present ({stats.present})
          </Button>
          <Button
            variant={filterStatus === "ABSENT" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("ABSENT")}
            className={cn(
              "rounded-full whitespace-nowrap text-xs h-8 flex-shrink-0",
              filterStatus !== "ABSENT" &&
                "hover:bg-red-50 hover:text-red-700 hover:border-red-200",
              isAttendanceLocked && "opacity-60 cursor-not-allowed",
            )}
            disabled={isAttendanceLocked}
          >
            Absent ({stats.absent})
          </Button>
          <Button
            variant={filterStatus === "LEAVE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("LEAVE")}
            className={cn(
              "rounded-full whitespace-nowrap text-xs h-8 flex-shrink-0",
              filterStatus !== "LEAVE" &&
                "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200",
              isAttendanceLocked && "opacity-60 cursor-not-allowed",
            )}
            disabled={isAttendanceLocked}
          >
            Leave ({stats.leave})
          </Button>
        </div>
      </div>

      {/* Student List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              key={student.studentId}
              className={cn(
                "group relative rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4 transition-all duration-200 hover:shadow-md",
                STATUS_CONFIG[student.status].border,
                STATUS_CONFIG[student.status].bg,
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl font-bold shadow-sm flex-shrink-0",
                    student.status === "PRESENT"
                      ? "bg-emerald-100 text-emerald-700"
                      : student.status === "ABSENT"
                        ? "bg-red-100 text-red-700"
                        : student.status === "LEAVE"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-400",
                  )}
                >
                  {student.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                    {student.studentName}
                  </h4>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2">
                <div className="flex w-full rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 p-0.5 sm:p-1 bg-slate-50/50">
                  {selectableStatuses.map((status) => {
                    const config = STATUS_CONFIG[status];
                    const isActive = student.status === status;
                    const Icon = config.icon;

                    return (
                      <button
                        key={status}
                        onClick={() =>
                          updateStatus(student.studentId, status as AttendanceStatus)
                        }
                        disabled={isAttendanceLocked}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all",
                          isActive
                            ? `${config.activeBg} ${config.activeText} shadow-sm`
                            : "text-slate-500 hover:text-slate-900 hover:bg-white",
                          isAttendanceLocked &&
                            "opacity-60 cursor-not-allowed",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-3 w-3 sm:h-3.5 sm:w-3.5",
                            !isActive && config.text,
                          )}
                        />
                        <span className="hidden sm:inline">
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-10 sm:py-12 text-center bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-200">
            <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              No students found
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed sm:sticky bottom-0 sm:bottom-6 left-0 right-0 z-40 px-3 sm:px-4 pb-3 sm:pb-0 pt-3 sm:pt-0 sm:mt-4 bg-gradient-to-t from-white via-white to-transparent sm:bg-none">
        <div
          className={cn(
            "mx-auto max-w-lg rounded-xl sm:rounded-2xl bg-white shadow-xl shadow-slate-200/60 p-3 sm:p-4 border border-slate-200",
            isAttendanceLocked && "border-slate-200",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Marked Status
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {stats.present} P
                </span>
                <span className="text-red-400 text-xs sm:text-sm font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {stats.absent} A
                </span>
                <span className="text-amber-400 text-xs sm:text-sm font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {stats.leave} Lv
                </span>
                {stats.unmarked > 0 && (
                  <span className="text-slate-400 text-xs sm:text-sm font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {stats.unmarked} U
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-slate-700 hover:bg-slate-100 text-xs h-8",
                  isAttendanceLocked && "opacity-60 cursor-not-allowed",
                )}
                onClick={resetAll}
                disabled={isAttendanceLocked}
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className={cn(
                  "bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-200/60 px-4 sm:px-6 rounded-xl font-bold transition-all text-xs h-8 sm:h-9",
                  (isAttendanceLocked || stats.unmarked > 0) && "opacity-60 cursor-not-allowed",
                )}
                disabled={attendanceMutation.isPending || isAttendanceLocked || stats.unmarked > 0}
              >
                {attendanceMutation.isPending ? (
                  <span className="text-sm">Saving...</span>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Save Attendance</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl sm:rounded-3xl p-0 gap-0">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                Finalize Attendance
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm pt-1 sm:pt-2">
                You are about to submit the attendance for{" "}
                <span className="font-bold text-slate-900">{displayDate}</span>.
                Please review the summary below.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-t" />

          <div className="grid grid-cols-3 gap-2 sm:gap-3 px-4 sm:px-6 py-4">
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-lg sm:text-xl font-bold text-emerald-700">
                {stats.present}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-600">
                Present
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-red-50 border border-red-100">
              <span className="text-lg sm:text-xl font-bold text-red-700">
                {stats.absent}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase text-red-600">
                Absent
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-lg sm:text-xl font-bold text-amber-700">
                {stats.leave}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase text-amber-600">
                Leave
              </span>
            </div>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowConfirmDialog(false)}
              className="rounded-xl text-sm font-medium w-full sm:w-auto"
            >
              Go Back
            </Button>
            <Button
              onClick={confirmSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 rounded-xl font-bold shadow-lg shadow-blue-200 w-full sm:w-auto text-sm"
            >
              Submit Now
              <ChevronRight className="h-4 w-4 ml-1.5 sm:ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}