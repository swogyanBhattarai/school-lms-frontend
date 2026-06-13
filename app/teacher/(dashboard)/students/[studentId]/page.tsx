"use client";
import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  BookOpen,
  User,
  Mail,
  MapPin,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import AnimatedPieChart from "@/app/_components/AnimatedPieChart";
import { useQuery } from "@tanstack/react-query";
import { getStudentById } from "@/lib/api/student";
import { getStudentAttendanceSummary, getStudentDailyAttendance } from "@/lib/api/attendance";
import { getClassAssignmentsBySection } from "@/lib/api/classAssignment";
import type { ClassAssignmentResponse } from "@/types/lms";
import { MiniCalendar } from "@/app/_components/MiniNepaliCalendarPicker";
import { convertADToBS } from "@/lib/nepali-calendar";

interface Subject {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
}

interface Assignment {
  assignmentId: number;
  subject: Subject;
  title: string;
  description: string;
  dueDate: string;
  status: "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";
  grade?: string;
  submittedDate?: string;
}

// Assignment Status Badge
function AssignmentStatusBadge({ status }: { status: Assignment["status"] }) {
  const config = {
    PENDING: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Pending" },
    SUBMITTED: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Submitted" },
    GRADED: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Graded" },
    OVERDUE: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Overdue" },
  }[status];
  
  return (
    <Badge className={cn("border font-medium text-[10px] sm:text-xs", config.bg, config.border, config.color)}>
      {config.label}
    </Badge>
  );
}

// Attendance Status Badge
function AttendanceStatusBadge({ status }: { status: string | undefined }) {
  if (!status) return (
    <Badge className="text-[9px] uppercase font-bold text-slate-400 border-slate-200 px-2 py-0.5">
      Not Taken
    </Badge>
  );

  const config = {
    PRESENT: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Present" },
    ABSENT: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Absent" },
    LEAVE: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Leave" },
  }[status] || { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: status };
  
  return (
    <Badge className={cn("text-[9px] uppercase font-bold border px-2 py-0.5", config.bg, config.border, config.color)}>
      {config.label}
    </Badge>
  );
}

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = Number(params.studentId);

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [diaryDate, setDiaryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expandedAssignments, setExpandedAssignments] = useState<Set<number>>(new Set());

  const {
    data: studentData,
    isLoading: isStudentLoading,
    isError: isStudentError,
  } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudentById(studentId),
    enabled: Number.isFinite(studentId),
  });
  
  const sectionId = studentData?.sectionId ?? null;
  const summaryEnabled = Number.isFinite(studentId) && typeof sectionId === "number";

  // Calculate date range from selected month
  const dateRange = useMemo(() => {
    if (selectedMonth === "all") return { fromDate: undefined, toDate: undefined };
    
    const [year, month] = selectedMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    
    return {
      fromDate: `${year}-${String(month).padStart(2, '0')}-01`,
      toDate: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }, [selectedMonth]);

  const {
    data: attendanceSummary = [],
    isLoading: isAttendanceSummaryLoading,
  } = useQuery({
    queryKey: ["attendance-summary", studentId, sectionId, selectedSubjectId, dateRange.fromDate, dateRange.toDate],
    queryFn: () =>
      getStudentAttendanceSummary({
        studentId,
        sectionId: sectionId as number,
        ...(selectedSubjectId !== "all" && { subjectId: Number(selectedSubjectId) }),
        ...(dateRange.fromDate && { fromDate: dateRange.fromDate }),
        ...(dateRange.toDate && { toDate: dateRange.toDate }),
      }),
    enabled: summaryEnabled,
  });

  const {
    data: classAssignments = [],
    isLoading: isClassAssignmentsLoading,
    isError: isClassAssignmentsError,
  } = useQuery<ClassAssignmentResponse[]>({
    queryKey: ["class-assignments", sectionId],
    queryFn: () => getClassAssignmentsBySection(sectionId as number),
    enabled: typeof sectionId === "number",
  });

  const {
    data: dailyAttendance = [],
    isLoading: isDailyAttendanceLoading,
  } = useQuery({
    queryKey: ["daily-attendance", studentId, attendanceDate],
    queryFn: () => getStudentDailyAttendance(studentId, attendanceDate),
    enabled: !!studentId && !!attendanceDate,
  });

  const studentName = studentData?.studentName ?? "Student";
  const isStudentActive = Boolean(
    studentData?.schoolClassName && studentData?.sectionName
  );
  const studentInitials = studentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  
  const attendanceDateBS = useMemo(() => {
    return convertADToBS(new Date(attendanceDate));
  }, [attendanceDate]);

  const diaryDateBS = useMemo(() => {
    return convertADToBS(new Date(diaryDate));
  }, [diaryDate]);

  const subjectOptions = useMemo(() => {
    const subjectMap = new Map<number, string>();
    classAssignments.forEach((assignment) => {
      const name = assignment.subjectName?.trim();
      if (!name) return;
      subjectMap.set(assignment.subjectId, name);
    });
    return Array.from(subjectMap.entries()).map(([subjectId, subjectName]) => ({
      subjectId,
      subjectName,
    }));
  }, [classAssignments]);

  const selectedSubjectName = useMemo(() => {
    if (selectedSubjectId === "all") return "all";
    const match = subjectOptions.find(
      (subject) => String(subject.subjectId) === selectedSubjectId
    );
    return match?.subjectName ?? "Selected Subject";
  }, [selectedSubjectId, subjectOptions]);

  const hasAttendanceData = attendanceSummary.length > 0;

  const summaryStats = useMemo(() => {
    if (attendanceSummary.length === 0) return null;
    
    const totals = attendanceSummary.reduce(
      (acc, summary) => {
        acc.present += summary.presentCount;
        acc.absent += summary.absentCount;
        acc.leave += summary.leaveCount;
        acc.total += summary.totalCount;
        return acc;
      },
      { present: 0, absent: 0, leave: 0, total: 0 }
    );
    
    const percentage =
      totals.total > 0
        ? Math.round((totals.present / totals.total) * 100)
        : 0;
    
    return {
      percentage,
      present: totals.present,
      absent: totals.absent,
      excused: totals.leave,
      late: 0,
      total: totals.total,
    };
  }, [attendanceSummary]);

  const attendanceStats = summaryStats ?? {
    percentage: 0,
    present: 0,
    absent: 0,
    excused: 0,
    late: 0,
    total: 0,
  };

  const subjectPerformance = useMemo(() => {
    return subjectOptions.map((opt) => {
      const summary = attendanceSummary.find((s) => s.subjectId === opt.subjectId);
      return {
        subjectId: opt.subjectId,
        subjectName: opt.subjectName,
        totalCount: summary?.totalCount ?? 0,
        percentage:
          summary && summary.totalCount > 0
            ? Math.round((summary.presentCount / summary.totalCount) * 100)
            : 0,
      };
    });
  }, [attendanceSummary, subjectOptions]);

  // Generate month options from attendance data
  const monthOptions = useMemo(() => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  }, []);

  const filteredAssignments: Assignment[] = useMemo(() => {
    return classAssignments.map(ca => ({
      assignmentId: ca.classAssignmentId,
      subject: {
        subjectId: ca.subjectId,
        subjectName: ca.subjectName,
        subjectCode: "",
        teacherName: ca.teacherName,
      },
      title: `${ca.subjectName} - ${ca.teacherRole}`,
      description: `Class assignment for ${ca.subjectName} taught by ${ca.teacherName}`,
      dueDate: new Date().toISOString().split('T')[0],
      status: "PENDING" as const,
    }));
  }, [classAssignments]);

  const assignmentCount = filteredAssignments.length;
  const pendingAssignmentCount = filteredAssignments.filter(
    (assignment) => assignment.status === "PENDING"
  ).length;
  const subjectCount = subjectOptions.length;
  
  const toggleAssignment = (id: number) => {
    setExpandedAssignments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-1.5 sm:gap-2 -ml-2 text-slate-500 hover:text-slate-900 font-medium text-sm"
            onClick={() => router.back()}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span className="hidden sm:inline">Go Back</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Student Profile Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-pink-500/[0.03] rounded-[1.5rem] sm:rounded-[2rem]" />
          <div className="relative rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6 md:p-8">
            <div className="flex flex-col items-center sm:flex-row gap-4 sm:gap-6 md:gap-8 sm:items-start">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ring-4 ring-violet-50 transition-transform group-hover:scale-105 duration-300">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {studentInitials || "ST"}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-emerald-500 border-[3px] sm:border-4 border-white flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between flex-wrap gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{studentName}</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm">
                      {isStudentActive && (
                        <span className="flex items-center gap-1.5 font-semibold px-2 sm:px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg">
                          <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="whitespace-nowrap">
                            Class {studentData?.schoolClassName} • Section {studentData?.sectionName}
                          </span>
                        </span>
                      )}
                      <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span className="font-semibold text-slate-600">
                        DOB: {studentData?.dateOfBirth ? formatDate(studentData.dateOfBirth) : "-"}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "h-7 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-full",
                      isStudentActive
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                    )}
                  >
                    {isStudentActive ? "Active Student" : "Inactive Student"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 md:mt-8">
                  {(studentData?.parents ?? []).map((parent, index) => (
                    <div key={`${parent.parentName}-${parent.parentNumber}-${index}`} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:border-slate-200">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Parent</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{parent.parentName}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{parent.parentNumber}</p>
                      </div>
                    </div>
                  ))}
                  {isStudentLoading && (
                    <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-200 animate-pulse" />
                      <div className="min-w-0 space-y-2">
                        <div className="h-2 w-20 bg-slate-200 rounded" />
                        <div className="h-3 w-28 bg-slate-200 rounded" />
                        <div className="h-2 w-24 bg-slate-200 rounded" />
                      </div>
                    </div>
                  )}
                  {isStudentError && (
                    <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-red-50 border border-red-100">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-red-400">Student</p>
                        <p className="text-xs sm:text-sm font-bold text-red-700 truncate">Unable to load</p>
                        <p className="text-[10px] font-semibold text-red-500">Try again later</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:border-slate-200">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Email Address</p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Not available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:border-slate-200">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Address</p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Not available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { 
              icon: CheckCircle2, 
              label: "Attendance", 
              value: isAttendanceSummaryLoading ? "..." : hasAttendanceData ? `${attendanceStats.percentage}%` : "—",
              color: "emerald",
              subtext: hasAttendanceData ? `${attendanceStats.present}/${attendanceStats.total} days present` : "No records"
            },
            { 
              icon: FileText, 
              label: "Assignments", 
              value: assignmentCount,
              color: "blue",
              subtext: `${pendingAssignmentCount} pending this month`
            },
            { 
              icon: BookOpen, 
              label: "Subjects", 
              value: subjectCount,
              color: "violet",
              subtext: "Enrolled"
            },
            { 
              icon: TrendingUp, 
              label: "Avg Grade", 
              value: "A-",
              color: "amber",
              subtext: "Overall Score"
            },
          ].map((stat, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 md:p-5 transition-all hover:shadow-lg">
              <div className={cn(
                "absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 rounded-bl-[2rem] sm:rounded-bl-[3rem] -mr-4 sm:-mr-6 -mt-4 sm:-mt-6 opacity-[0.03]",
                stat.color === "emerald" && "bg-emerald-500",
                stat.color === "blue" && "bg-blue-500",
                stat.color === "violet" && "bg-violet-500",
                stat.color === "amber" && "bg-amber-500",
              )} />
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                  stat.color === "emerald" && "bg-emerald-500/10 text-emerald-600",
                  stat.color === "blue" && "bg-blue-500/10 text-blue-600",
                  stat.color === "violet" && "bg-violet-500/10 text-violet-600",
                  stat.color === "amber" && "bg-amber-500/10 text-amber-600",
                )}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-1">{stat.subtext}</p>
            </div>
          ))}
        </div>
        
        {/* Attendance Statistics Section */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Attendance Overview</h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">Comprehensive analytical view of records</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="w-[140px] sm:w-[160px] h-9 sm:h-10 rounded-xl bg-white border-slate-200 font-semibold text-slate-700 text-xs sm:text-sm">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjectOptions.map((subject) => (
                      <SelectItem
                        key={subject.subjectId}
                        value={String(subject.subjectId)}
                      >
                        {subject.subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px] sm:w-[160px] h-9 sm:h-10 rounded-xl bg-white border-slate-200 font-semibold text-slate-700 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Months</SelectItem>
                    {monthOptions.map(month => (
                      <SelectItem key={month} value={month}>
                        {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {isAttendanceSummaryLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 sm:py-16 text-slate-500">
                <span className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
                <p className="text-xs sm:text-sm font-semibold">Loading attendance data...</p>
              </div>
            ) : !hasAttendanceData ? (
              <div className="text-center py-12 sm:py-16 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-base sm:text-lg tracking-tight">No attendance data yet</p>
                <p className="text-slate-400 text-xs sm:text-sm font-semibold mt-1">Attendance will appear once records are added</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                {/* Pie Chart Analysis */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="sm:hidden">
                    <AnimatedPieChart 
                      percentage={attendanceStats.percentage} 
                      size={160}
                      strokeWidth={14}
                    />
                  </div>
                  <div className="hidden sm:block">
                    <AnimatedPieChart 
                      percentage={attendanceStats.percentage} 
                      size={200}
                      strokeWidth={16}
                    />
                  </div>
                  <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-center text-slate-500 font-semibold max-w-xs leading-relaxed">
                    {selectedSubjectId === "all" 
                      ? "Overall student engagement score across all enrolled subjects for the selected period."
                      : `Specific subject engagement for ${selectedSubjectName}.`
                    }
                  </p>
                </div>
                
                {/* Right Column: Dynamic Stats or Subject Bars */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                  {selectedSubjectId === "all" ? (
                    <>
                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                        Subject Performance
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        {subjectPerformance.map((subject) => (
                            <div key={subject.subjectId}>
                              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                <span className="text-xs sm:text-sm font-bold text-slate-700">{subject.subjectName}</span>
                                <span className={cn(
                                  "text-xs sm:text-sm font-black",
                                  subject.percentage >= 75 ? "text-emerald-600" : subject.percentage >= 60 ? "text-amber-600" : "text-red-600"
                                )}>
                                  {subject.percentage}%
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    subject.percentage >= 75 ? "bg-emerald-500" : 
                                    subject.percentage >= 60 ? "bg-amber-500" : 
                                    "bg-red-500"
                                  )}
                                  style={{ width: `${subject.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {[
                        { label: "Present", value: attendanceStats.present, color: "emerald" },
                        { label: "Absent", value: attendanceStats.absent, color: "red" },
                        { label: "Leave", value: attendanceStats.excused + attendanceStats.late, color: "amber" },
                        { label: "Total", value: attendanceStats.total, color: "slate" },
                      ].map((stat) => (
                        <div key={stat.label} className={cn(
                          "p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition-all",
                          stat.color === "emerald" && "bg-emerald-50 border-emerald-100",
                          stat.color === "red" && "bg-red-50 border-red-100",
                          stat.color === "amber" && "bg-amber-50 border-amber-100",
                          stat.color === "slate" && "bg-slate-50 border-slate-200",
                        )}>
                          <p className={cn(
                            "text-xl sm:text-2xl font-black",
                            stat.color === "emerald" && "text-emerald-600",
                            stat.color === "red" && "text-red-600",
                            stat.color === "amber" && "text-amber-600",
                            stat.color === "slate" && "text-slate-600",
                          )}>{stat.value}</p>
                          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Attendance Section */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Daily Attendance Record</h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">Subject-wise presence tracking</p>
              </div>
              <MiniCalendar
                value={attendanceDateBS}
                onChange={setAttendanceDate}
                className="w-full sm:w-[200px]"
              />
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {isClassAssignmentsLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 sm:py-10 text-slate-500">
                <span className="h-6 w-6 sm:h-7 sm:w-7 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
                <p className="text-xs sm:text-sm font-semibold">Loading class teachers...</p>
              </div>
            ) : isClassAssignmentsError ? (
              <div className="text-center py-8 sm:py-10 rounded-xl sm:rounded-2xl bg-red-50 border-2 border-dashed border-red-200">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-400" />
                </div>
                <p className="text-red-600 font-bold text-sm sm:text-base tracking-tight">Unable to load class teachers</p>
                <p className="text-red-400 text-xs sm:text-sm font-semibold mt-1">Please try again later</p>
              </div>
            ) : classAssignments.length === 0 ? (
              <div className="text-center py-8 sm:py-10 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-sm sm:text-base tracking-tight">No class teachers assigned yet</p>
                <p className="text-slate-400 text-xs sm:text-sm font-semibold mt-1">Teachers will appear once assigned</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                {classAssignments.map((assignment) => {
                  const attendance = dailyAttendance.find(a => a.subjectId === assignment.subjectId);
                  return (
                    <div
                      key={assignment.classAssignmentId}
                      className="w-[calc(50%-0.5rem)] sm:w-[150px] p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/[0.03] transition-all duration-300"
                    >
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500 mb-1.5 sm:mb-2" />
                      <h4 className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full tracking-tight">
                        {assignment.subjectName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold mb-2 sm:mb-3 truncate w-full uppercase tracking-wider">
                        {assignment.teacherName}
                      </p>
                      <AttendanceStatusBadge status={attendance?.attendanceStatus} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Diary / Assignments Section */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Diary & Assignments</h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">Track classwork and homework</p>
              </div>
              <MiniCalendar
                value={diaryDateBS}
                onChange={setDiaryDate}
                className="w-full sm:w-[200px]"
              />
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-12 sm:py-16 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold text-base sm:text-lg tracking-tight">No assignments data yet</p>
                  <p className="text-slate-400 text-xs sm:text-sm font-semibold mt-1">Assignments will appear once added</p>
                </div>
              ) : (
                filteredAssignments.map(assignment => (
                  <div 
                    key={assignment.assignmentId}
                    className="group rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/[0.03] transition-all duration-300"
                  >
                    <div 
                      className="flex items-center gap-3 sm:gap-5 p-3 sm:p-5 cursor-pointer"
                      onClick={() => toggleAssignment(assignment.assignmentId)}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">{assignment.title}</h4>
                          <AssignmentStatusBadge status={assignment.status} />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-bold mt-1 sm:mt-1.5">
                          <span className="text-blue-600 uppercase tracking-wider">{assignment.subject.subjectName}</span>
                          <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-slate-200" />
                          <span className="text-slate-400 uppercase tracking-wider">Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-all duration-300 flex-shrink-0",
                        expandedAssignments.has(assignment.assignmentId) ? "rotate-180 bg-blue-50 text-blue-600" : "text-slate-400"
                      )}>
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    </div>
                    
                    {expandedAssignments.has(assignment.assignmentId) && (
                      <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                        <div className="mt-3 sm:mt-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                            {assignment.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-200/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                            <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-lg shadow-sm">
                              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500" />
                              <span className="text-slate-400">Teacher:</span> <span className="text-slate-700">{assignment.subject.teacherName}</span>
                            </span>
                            {assignment.submittedDate && (
                              <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-lg shadow-sm">
                                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                                <span className="text-slate-400">Submitted:</span> <span className="text-slate-700">{formatDate(assignment.submittedDate)}</span>
                              </span>
                            )}
                            {assignment.grade && (
                              <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-lg shadow-sm">
                                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-violet-500" />
                                <span className="text-slate-400">Grade:</span> <span className="text-violet-700">{assignment.grade}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}