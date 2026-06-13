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
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  Settings,
  UserPlus,
  Phone,
  Clock,
  MoreHorizontal,
  Eye,
  EyeOff,
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

interface ParentInfo {
  parentName: string;
  parentNumber: string;
  parentEmail?: string;
  relation?: string;
}

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

type TabType = "overview" | "parents" | "academic" | "attendance" | "documents";

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
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expandedAssignments, setExpandedAssignments] = useState<Set<number>>(new Set());

  // Parent management state
  const [editingParentIndex, setEditingParentIndex] = useState<number | null>(null);
  const [isAddingParent, setIsAddingParent] = useState(false);
  const [newParent, setNewParent] = useState<ParentInfo>({
    parentName: "",
    parentNumber: "",
    parentEmail: "",
    relation: "Father",
  });
  const [editedParents, setEditedParents] = useState<ParentInfo[]>([]);

  // Student info editing state
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editedStudentName, setEditedStudentName] = useState("");
  const [editedDOB, setEditedDOB] = useState("");

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
  } = useQuery({
    queryKey: ["daily-attendance", studentId, attendanceDate],
    queryFn: () => getStudentDailyAttendance(studentId, attendanceDate),
    enabled: !!studentId && !!attendanceDate,
  });

  // Initialize edited parents when data loads
  useMemo(() => {
    if (studentData?.parents && editedParents.length === 0) {
      setEditedParents([...studentData.parents]);
    }
  }, [studentData?.parents]);

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
    
    const percentage = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0;
    
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
        percentage: summary && summary.totalCount > 0
          ? Math.round((summary.presentCount / summary.totalCount) * 100)
          : 0,
      };
    });
  }, [attendanceSummary, subjectOptions]);

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
  const pendingAssignmentCount = filteredAssignments.filter(a => a.status === "PENDING").length;
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

  // Parent management functions
  const handleEditParent = (index: number) => {
    setEditingParentIndex(index);
    setIsAddingParent(false);
  };

  const handleSaveParent = (index: number) => {
    // TODO: API call to update parent
    console.log("Save parent:", editedParents[index]);
    setEditingParentIndex(null);
  };

  const handleRemoveParent = (index: number) => {
    // TODO: API call to remove parent
    const updated = editedParents.filter((_, i) => i !== index);
    setEditedParents(updated);
  };

  const handleAddParent = () => {
    if (newParent.parentName && newParent.parentNumber) {
      // TODO: API call to add parent
      setEditedParents([...editedParents, { ...newParent }]);
      setNewParent({ parentName: "", parentNumber: "", parentEmail: "", relation: "Father" });
      setIsAddingParent(false);
    }
  };

  const handleUpdateStudent = () => {
    // TODO: API call to update student
    console.log("Update student:", { name: editedStudentName, dob: editedDOB });
    setIsEditingStudent(false);
  };

  const startEditStudent = () => {
    setEditedStudentName(studentData?.studentName ?? "");
    setEditedDOB(studentData?.dateOfBirth ?? "");
    setIsEditingStudent(true);
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Eye },
    { id: "parents" as TabType, label: "Parents", icon: Users },
    { id: "academic" as TabType, label: "Academic", icon: GraduationCap },
    { id: "attendance" as TabType, label: "Attendance", icon: Calendar },
    { id: "documents" as TabType, label: "Documents", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between pt-4 sm:pt-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1 sm:gap-2 -ml-2 text-slate-500 hover:text-slate-900 font-medium text-sm"
              onClick={() => router.back()}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span className="hidden sm:inline">Back to Students</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-2 rounded-xl border-slate-200 text-xs sm:text-sm"
              onClick={() => {/* Export action */}}
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              size="sm"
              className="gap-1 sm:gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs sm:text-sm"
              onClick={startEditStudent}
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>
        </div>

        {/* Student Header Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-slate-100 rounded-[1.5rem] sm:rounded-[2rem]" />
          <div className="relative rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 text-slate-900">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 items-start">
              <div className="relative group mx-auto sm:mx-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/60 transition-transform group-hover:scale-105 duration-300">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">
                    {studentInitials || "ST"}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-emerald-500 border-[3px] sm:border-4 border-white flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between flex-wrap gap-3 sm:gap-4">
                  <div className="w-full">
                    {isEditingStudent ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editedStudentName}
                          onChange={(e) => setEditedStudentName(e.target.value)}
                          className="text-xl sm:text-2xl md:text-3xl font-bold bg-white/80 rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 border border-slate-200 w-full"
                          placeholder="Student Name"
                        />
                        <input
                          type="date"
                          value={editedDOB}
                          onChange={(e) => setEditedDOB(e.target.value)}
                          className="bg-white/80 rounded-xl px-4 py-2 text-slate-900 border border-slate-200 w-full sm:w-auto text-sm"
                        />
                        <div className="flex gap-2 justify-center sm:justify-start">
                          <Button
                            size="sm"
                            onClick={handleUpdateStudent}
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs sm:text-sm"
                          >
                            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingStudent(false)}
                            className="rounded-xl border-slate-200 text-slate-700 hover:bg-white text-xs sm:text-sm"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{studentName}</h2>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-slate-600">
                          {isStudentActive && (
                            <span className="flex items-center gap-1.5 font-semibold px-2 sm:px-2.5 py-1 bg-white/80 rounded-lg">
                              <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="whitespace-nowrap">
                                Class {studentData?.schoolClassName} • Section {studentData?.sectionName}
                              </span>
                            </span>
                          )}
                          <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="font-semibold text-xs sm:text-sm">
                            ID: #{String(studentId).padStart(5, '0')}
                          </span>
                          <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="font-semibold text-xs sm:text-sm">
                            DOB: {studentData?.dateOfBirth ? formatDate(studentData.dateOfBirth) : "-"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      "h-7 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-full",
                      isStudentActive
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    )}
                  >
                    {isStudentActive ? "Active Student" : "Inactive Student"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Dropdown + Desktop Tabs */}
        <div className="sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm"
          >
            <span className="flex items-center gap-2 font-semibold text-sm text-slate-700">
              {(() => {
                const active = tabs.find(t => t.id === activeTab);
                const Icon = active?.icon;
                return Icon ? <Icon className="h-4 w-4" /> : null;
              })()}
              {tabs.find(t => t.id === activeTab)?.label}
            </span>
            <ChevronDown className={cn(
              "h-5 w-5 text-slate-400 transition-transform",
              mobileMenuOpen && "rotate-180"
            )} />
          </button>
          {mobileMenuOpen && (
            <div className="mt-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-lg animate-in slide-in-from-top-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="hidden sm:flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-lg shadow-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { 
                  icon: CheckCircle2, 
                  label: "Attendance", 
                  value: isAttendanceSummaryLoading ? "..." : hasAttendanceData ? `${attendanceStats.percentage}%` : "—",
                  color: "emerald",
                  subtext: `${attendanceStats.present}/${attendanceStats.total} days present`
                },
                { 
                  icon: FileText, 
                  label: "Assignments", 
                  value: assignmentCount,
                  color: "blue",
                  subtext: `${pendingAssignmentCount} pending`
                },
                { 
                  icon: BookOpen, 
                  label: "Subjects", 
                  value: subjectCount,
                  color: "violet",
                  subtext: "Enrolled"
                },
                { 
                  icon: Users, 
                  label: "Parents", 
                  value: editedParents.length,
                  color: "amber",
                  subtext: "Guardians"
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

            {/* Recent Activity / Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Class & Section Info */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                  Academic Information
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { label: "Class", value: studentData?.schoolClassName || "N/A" },
                    { label: "Section", value: studentData?.sectionName || "N/A" },
                    { label: "Enrolled Subjects", value: subjectCount },
                    { 
                      label: "Status", 
                      value: isStudentActive ? "Active" : "Inactive",
                      badge: true,
                      active: isStudentActive
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50">
                      <span className="text-xs sm:text-sm font-semibold text-slate-500">{item.label}</span>
                      {item.badge ? (
                        <Badge className={cn(
                          "text-xs",
                          item.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {item.value}
                        </Badge>
                      ) : (
                        <span className="text-xs sm:text-sm font-bold text-slate-900">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { icon: Pencil, label: "Edit Profile", action: startEditStudent, color: "slate" },
                    { icon: UserPlus, label: "Add Parent", action: () => { setActiveTab("parents"); setIsAddingParent(true); }, color: "violet" },
                    { icon: BookOpen, label: "Assign Subject", action: () => {}, color: "blue" },
                    { icon: FileText, label: "Report", action: () => {}, color: "emerald" },
                    { icon: Calendar, label: "Attendance", action: () => setActiveTab("attendance"), color: "amber" },
                    { icon: Trash2, label: "Deactivate", action: () => {}, color: "red" },
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.action}
                      className={cn(
                        "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border transition-all hover:shadow-md text-center",
                        action.color === "red" 
                          ? "border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200"
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center",
                        action.color === "slate" && "bg-slate-200 text-slate-600",
                        action.color === "violet" && "bg-violet-100 text-violet-600",
                        action.color === "blue" && "bg-blue-100 text-blue-600",
                        action.color === "emerald" && "bg-emerald-100 text-emerald-600",
                        action.color === "amber" && "bg-amber-100 text-amber-600",
                        action.color === "red" && "bg-red-100 text-red-600",
                      )}>
                        <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className={cn(
                        "text-[10px] sm:text-xs font-semibold leading-tight",
                        action.color === "red" ? "text-red-600" : "text-slate-700"
                      )}>
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "parents" && (
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Parent / Guardian Management</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage parent information and contact details</p>
              </div>
              <Button
                onClick={() => { setIsAddingParent(true); setEditingParentIndex(null); }}
                className="gap-2 rounded-xl text-xs sm:text-sm w-full sm:w-auto"
                disabled={isAddingParent}
              >
                <Plus className="h-4 w-4" />
                Add Parent
              </Button>
            </div>
            <div className="p-4 sm:p-6">
              {isAddingParent && (
                <div className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-violet-50 border-2 border-violet-200 animate-in slide-in-from-top-2">
                  <h4 className="font-bold text-violet-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <UserPlus className="h-4 w-4" />
                    New Parent Details
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name *</label>
                      <input
                        type="text"
                        value={newParent.parentName}
                        onChange={(e) => setNewParent({ ...newParent, parentName: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                        placeholder="Parent full name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone *</label>
                      <input
                        type="text"
                        value={newParent.parentNumber}
                        onChange={(e) => setNewParent({ ...newParent, parentNumber: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email"
                        value={newParent.parentEmail || ""}
                        onChange={(e) => setNewParent({ ...newParent, parentEmail: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Relation</label>
                      <select
                        value={newParent.relation}
                        onChange={(e) => setNewParent({ ...newParent, relation: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddParent} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-xs sm:text-sm">
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Save Parent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setIsAddingParent(false); setNewParent({ parentName: "", parentNumber: "", parentEmail: "", relation: "Father" }); }}
                      className="rounded-xl text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                {editedParents.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-slate-500 font-bold text-sm">No parents added yet</p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">Click "Add Parent" to add a guardian</p>
                  </div>
                ) : (
                  editedParents.map((parent, index) => (
                    <div
                      key={index}
                      className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-300"
                    >
                      {editingParentIndex === index ? (
                        <div className="p-4 sm:p-5">
                          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                            <div>
                              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                              <input
                                type="text"
                                value={parent.parentName}
                                onChange={(e) => {
                                  const updated = [...editedParents];
                                  updated[index] = { ...updated[index], parentName: e.target.value };
                                  setEditedParents(updated);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
                              <input
                                type="text"
                                value={parent.parentNumber}
                                onChange={(e) => {
                                  const updated = [...editedParents];
                                  updated[index] = { ...updated[index], parentNumber: e.target.value };
                                  setEditedParents(updated);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveParent(index)} className="rounded-xl text-xs sm:text-sm">
                              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingParentIndex(null)} className="rounded-xl text-xs sm:text-sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              <h4 className="text-sm sm:text-base font-bold text-slate-900">{parent.parentName}</h4>
                              <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] sm:text-xs">
                                {parent.relation || "Guardian"}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs sm:text-sm">
                              <span className="flex items-center gap-1.5 text-slate-500">
                                <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                <span className="font-semibold truncate">{parent.parentNumber}</span>
                              </span>
                              {parent.parentEmail && (
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                  <span className="font-semibold truncate">{parent.parentEmail}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditParent(index)}
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-slate-100"
                            >
                              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveParent(index)}
                              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "academic" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Subjects Section */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Enrolled Subjects</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Current academic term subjects and teachers</p>
                </div>
                <Button className="gap-2 rounded-xl text-xs sm:text-sm w-full sm:w-auto" size="sm">
                  <Plus className="h-4 w-4" />
                  Assign Subject
                </Button>
              </div>
              <div className="p-4 sm:p-6">
                {classAssignments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                    <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-slate-500 font-bold text-sm">No subjects assigned</p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">Assign subjects to this student</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {classAssignments.map((assignment) => (
                      <div
                        key={assignment.classAssignmentId}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-violet-200 hover:bg-white transition-all group"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{assignment.subjectName}</h4>
                            <Badge className="text-[9px] sm:text-[10px] mt-0.5 bg-slate-100 text-slate-500 border-slate-200">
                              {assignment.teacherRole}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500">
                          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="font-semibold">{assignment.teacherName}</span>
                        </div>
                        <div className="flex gap-2 mt-3 sm:mt-4 pt-3 border-t border-slate-100">
                          <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs rounded-lg h-7 sm:h-8 flex-1">
                            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs rounded-lg h-7 sm:h-8 flex-1 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assignments Section */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Assignments & Diary</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Track classwork and homework submissions</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  {filteredAssignments.map(assignment => (
                    <div 
                      key={assignment.assignmentId}
                      className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-blue-300 transition-all"
                    >
                      <div 
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer"
                        onClick={() => toggleAssignment(assignment.assignmentId)}
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{assignment.title}</h4>
                            <AssignmentStatusBadge status={assignment.status} />
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-bold mt-1">
                            <span className="text-blue-600">{assignment.subject.subjectName}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:inline" />
                            <span className="text-slate-400">Due: {formatDate(assignment.dueDate)}</span>
                          </div>
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 sm:h-5 sm:w-5 text-slate-400 transition-transform flex-shrink-0",
                          expandedAssignments.has(assignment.assignmentId) && "rotate-180"
                        )} />
                      </div>
                      
                      {expandedAssignments.has(assignment.assignmentId) && (
                        <div className="px-3 sm:px-4 pb-3 sm:pb-4 animate-in slide-in-from-top-2">
                          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50">
                            <p className="text-xs sm:text-sm text-slate-600">{assignment.description}</p>
                            <div className="flex items-center gap-4 mt-3 sm:mt-4 pt-3 border-t border-slate-200 text-[10px] sm:text-xs text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                {assignment.subject.teacherName}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                      <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                      <p className="text-slate-500 font-bold text-sm">No assignments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Attendance Overview */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Attendance Overview</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Comprehensive attendance analytics (Read-only)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                      <SelectTrigger className="w-[130px] sm:w-[150px] h-8 sm:h-9 rounded-xl text-[10px] sm:text-xs">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjectOptions.map((s) => (
                          <SelectItem key={s.subjectId} value={String(s.subjectId)}>{s.subjectName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-[130px] sm:w-[150px] h-8 sm:h-9 rounded-xl text-[10px] sm:text-xs">
                        <SelectValue placeholder="All Months" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {monthOptions.map(m => (
                          <SelectItem key={m} value={m}>
                            {new Date(m + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {isAttendanceSummaryLoading ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <span className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-[3px] sm:border-4 border-slate-200 border-t-emerald-500" />
                  </div>
                ) : !hasAttendanceData ? (
                  <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                    <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-slate-500 font-bold text-sm">No attendance data</p>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
                    <div className="lg:col-span-5 flex flex-col items-center">
  <div className="sm:hidden">
    <AnimatedPieChart percentage={attendanceStats.percentage} size={160} strokeWidth={14} />
  </div>
  <div className="hidden sm:block">
    <AnimatedPieChart percentage={attendanceStats.percentage} size={200} strokeWidth={16} />
  </div>
  <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-center text-slate-500 font-semibold">
    {selectedSubjectId === "all" ? "Overall attendance across all subjects" : `Attendance for ${selectedSubjectName}`}
  </p>
</div>
                    <div className="lg:col-span-7">
                      {selectedSubjectId === "all" ? (
                        <div className="space-y-3 sm:space-y-4">
                          {subjectPerformance.map((subject) => (
                            <div key={subject.subjectId}>
                              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                <span className="text-xs sm:text-sm font-bold text-slate-700">{subject.subjectName}</span>
                                <span className="text-xs sm:text-sm font-black text-slate-900">{subject.percentage}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    subject.percentage >= 75 ? "bg-emerald-500" : subject.percentage >= 60 ? "bg-amber-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${subject.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {[
                            { label: "Present", value: attendanceStats.present, color: "emerald" },
                            { label: "Absent", value: attendanceStats.absent, color: "red" },
                            { label: "Leave", value: attendanceStats.excused, color: "amber" },
                            { label: "Total", value: attendanceStats.total, color: "slate" },
                          ].map((stat) => (
                            <div key={stat.label} className={cn(
                              "p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center",
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

            {/* Daily Attendance */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Daily Attendance Record</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Subject-wise attendance for selected date</p>
                </div>
                <MiniCalendar value={attendanceDateBS} onChange={setAttendanceDate} className="w-full sm:w-[180px]" />
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  {classAssignments.map((assignment) => {
                    const attendance = dailyAttendance.find(a => a.subjectId === assignment.subjectId);
                    return (
                      <div
                        key={assignment.classAssignmentId}
                        className="w-[calc(50%-0.5rem)] sm:w-[150px] p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center hover:border-violet-200 transition-all"
                      >
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500 mb-1.5 sm:mb-2" />
                        <h4 className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full">{assignment.subjectName}</h4>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mb-1.5 sm:mb-2">{assignment.teacherName}</p>
                        <AttendanceStatusBadge status={attendance?.attendanceStatus} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Documents & Records</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage student documents and certificates</p>
              </div>
              <Button className="gap-2 rounded-xl text-xs sm:text-sm w-full sm:w-auto" size="sm">
                <Plus className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-center py-12 sm:py-16 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-slate-500 font-bold text-base sm:text-lg">No documents uploaded</p>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">Upload student documents, certificates, and records</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}