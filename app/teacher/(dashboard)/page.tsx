"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/contexts/UserContext";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  BookOpen,
  Users,
  GraduationCap,
  School,
  Clock,
  Calendar,
  ChevronRight,
  LayoutGrid,
  List,
  CheckCircle2,
  RotateCcw,
  ArrowUpDown,
  Hash,
  User,
  Mail,
  Phone,
  MapPin,
  PenLine,
  X,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Badge } from "@/app/_components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { cn } from "@/lib/utils";
import { getClassAssignmentsByTeacherId } from "@/lib/api/teacher";
import type { ClassAssignmentAttendanceResponse } from "@/types/lms";

interface TeacherInfo {
  teacherId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  department: string;
  joiningDate: string;
}

export default function TeacherClassAssignmentsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "grade" | "section" | "subject" | "students"
  >("grade");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isQuickOverviewFilter, setIsQuickOverviewFilter] = useState(false);

  const username = user?.username || "";
  const schoolNameFromContext = user?.schoolName || "";

  const { data: classAssignments = [] } = useQuery({
    queryKey: ["teacher-class-assignments"],
    queryFn: getClassAssignmentsByTeacherId,
  });

  const getClassName = (assignment: ClassAssignmentAttendanceResponse) =>
    `Class ${assignment.grade}`;

  // Get unique subjects and grades for filters
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(classAssignments.map((a) => a.subjectName));
    return Array.from(subjects).sort();
  }, [classAssignments]);

  const uniqueGrades = useMemo(() => {
    const grades = new Set(classAssignments.map((a) => a.grade));
    return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b));
  }, [classAssignments]);

  // Active filters count
  const activeFiltersCount = [
    subjectFilter !== "all" ? subjectFilter : "",
    gradeFilter !== "all" ? gradeFilter : "",
    sortBy !== "grade" ? sortBy : "",
  ].filter(Boolean).length;

  // Filter and sort assignments
  const filteredAssignments = useMemo(() => {
    let filtered = [...classAssignments];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.subjectName.toLowerCase().includes(searchLower) ||
          a.sectionName.toLowerCase().includes(searchLower) ||
          getClassName(a).toLowerCase().includes(searchLower) ||
          a.grade.toLowerCase().includes(searchLower),
      );
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter((a) => a.subjectName === subjectFilter);
    }

    if (gradeFilter !== "all") {
      filtered = filtered.filter((a) => a.grade === gradeFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "grade":
          return (
            parseInt(a.grade) - parseInt(b.grade) ||
            a.sectionName.localeCompare(b.sectionName)
          );
        case "section":
          return (
            a.sectionName.localeCompare(b.sectionName) ||
            a.subjectName.localeCompare(b.subjectName)
          );
        case "subject":
          return (
            a.subjectName.localeCompare(b.subjectName) ||
            a.sectionName.localeCompare(b.sectionName)
          );
        case "students":
          return b.studentCount - a.studentCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [classAssignments, search, subjectFilter, gradeFilter, sortBy]);

  // Stats
  const totalAssignments = classAssignments.length;
  const uniqueSubjectsCount = uniqueSubjects.length;
  const totalStudents = classAssignments.reduce(
    (sum, a) => sum + a.studentCount,
    0,
  );
  const pendingAttendance = classAssignments.filter(
    (a) => !a.attendanceCompleted,
  ).length;
  const completedToday = classAssignments.filter(
    (a) => a.attendanceCompleted,
  ).length;

  // Group assignments by subject for quick overview
  const assignmentsBySubject = useMemo(() => {
    const grouped = new Map<string, ClassAssignmentAttendanceResponse[]>();
    classAssignments.forEach((assignment) => {
      if (!grouped.has(assignment.subjectName)) {
        grouped.set(assignment.subjectName, []);
      }
      grouped.get(assignment.subjectName)!.push(assignment);
    });
    return Array.from(grouped.entries());
  }, [classAssignments]);

  const handleAssignmentClick = (sectionId: number, subjectId: number) => {
    router.push(`/teacher/attendance/${sectionId}?subjectId=${subjectId}`);
  };

  const handleDiaryClick = (sectionId: number, subjectId: number) => {
    router.push(`/teacher/diary/${sectionId}?subjectId=${subjectId}`);
  };

  const formatDate = (date: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-NP", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const today = new Date().toLocaleDateString("en-NP", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const teacherDisplayName = useMemo(() => {
    if (classAssignments.length > 0) return classAssignments[0].teacherName;
    return username
      ? username
          .replace(/[._]/g, " ")
          .split(" ")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ")
      : loading
        ? ""
        : `Teacher at ${schoolNameFromContext}`;
  }, [classAssignments, username, loading]);

  const academicYearLabel = useMemo(() => {
    const year = classAssignments[0]?.academicYear?.trim();
    return year ? `Academic Year ${year}` : "Academic Year";
  }, [classAssignments]);

  const teacherInitials = teacherDisplayName
    ? teacherDisplayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("all");
    setGradeFilter("all");
    setSortBy("grade");
  };

  // Mobile Filter Content
  const MobileFilterContent = () => (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Subject
        </label>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="h-10 text-sm w-full rounded-xl">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Grade
        </label>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="h-10 text-sm w-full rounded-xl">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {uniqueGrades.map((grade) => (
              <SelectItem key={grade} value={grade}>
                Grade {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Sort By
        </label>
        <Select
          value={sortBy}
          onValueChange={(
            value: "grade" | "section" | "subject" | "students",
          ) => setSortBy(value)}
        >
          <SelectTrigger className="h-10 text-sm w-full rounded-xl">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grade">Sort by Grade</SelectItem>
            <SelectItem value="section">Sort by Section</SelectItem>
            <SelectItem value="subject">Sort by Subject</SelectItem>
            <SelectItem value="students">Sort by Students</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          View Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode("grid");
              setMobileFilterOpen(false);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
              viewMode === "grid"
                ? "border-blue-500/30 bg-blue-50 text-blue-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Grid
          </button>
          <button
            onClick={() => {
              setViewMode("list");
              setMobileFilterOpen(false);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
              viewMode === "list"
                ? "border-blue-500/30 bg-blue-50 text-blue-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </div>
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            clearFilters();
            setMobileFilterOpen(false);
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 px-1 sm:px-0">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-2 sm:pt-0">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
              Teacher Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {academicYearLabel} • {today}
            </p>
          </div>
        </div>

        {/* Teacher Profile Summary */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 rounded-2xl sm:rounded-3xl" />
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center animate-pulse">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-200 ring-4 ring-slate-100" />
                <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                  <div className="h-5 sm:h-6 w-40 sm:w-48 bg-slate-200 rounded" />
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="h-4 w-28 sm:w-32 bg-slate-200 rounded" />
                    <div className="h-4 w-36 sm:w-40 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center sm:flex-row gap-4 sm:gap-6 sm:items-center">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center ring-4 ring-blue-100">
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      {teacherInitials}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-bold">
                    {teacherDisplayName}
                  </h2>
                  <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <School className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{schoolNameFromContext}</span>
                    </span>
                    <span className="hidden sm:inline w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>
                        {username
                          ? `${username.toLowerCase()}@school.edu.np`
                          : schoolNameFromContext}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-center pt-3 sm:pt-0 border-t sm:border-t-0 mt-3 sm:mt-0">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Total Students
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {totalStudents}
                    </p>
                  </div>
                  <div className="w-px h-10 sm:h-12 bg-slate-200" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Classes</p>
                    <p className="text-xl sm:text-2xl font-bold text-cyan-600">
                      {totalAssignments}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-600 mb-1.5 sm:mb-2">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">
                Subjects
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">
              {uniqueSubjectsCount}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              Unique subjects assigned
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 mb-1.5 sm:mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">
                Completed Today
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{completedToday}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              Attendance marked
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-600 mb-1.5 sm:mb-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">
                Pending Today
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{pendingAttendance}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              Attendance pending
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-violet-600 mb-1.5 sm:mb-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">
                Total Students
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{totalStudents}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              Across all classes
            </p>
          </div>
        </div>

        {/* Filters & Search - Desktop */}
        <div className="hidden sm:flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject, class, or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 focus:bg-white transition-colors"
            />
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[160px] h-11 bg-white">
              <BookOpen className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {uniqueSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[150px] h-11 bg-white">
              <GraduationCap className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(
              value: "grade" | "section" | "subject" | "students",
            ) => setSortBy(value)}
          >
            <SelectTrigger className="w-[160px] h-11 bg-white">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade">Sort by Grade</SelectItem>
              <SelectItem value="section">Sort by Section</SelectItem>
              <SelectItem value="subject">Sort by Subject</SelectItem>
              <SelectItem value="students">Sort by Students</SelectItem>
            </SelectContent>
          </Select>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-11 px-3 text-muted-foreground hover:text-foreground shrink-0"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Subject Quick Overview */}
<div className="space-y-3 sm:space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-base sm:text-lg font-semibold">
      Quick Overview by Subject
    </h3>
    {isQuickOverviewFilter && subjectFilter !== "all" && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSubjectFilter("all");
          setIsQuickOverviewFilter(false);
        }}
        className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 gap-1"
      >
        <X className="h-3.5 w-3.5" />
        Clear
      </Button>
    )}
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
    {assignmentsBySubject.map(([subject, assignments]) => (
      <div
        key={subject}
        className={cn(
          "rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer",
          subjectFilter === subject && isQuickOverviewFilter
            ? "border-blue-300/80 bg-blue-50/50 ring-1 ring-blue-300"
            : "border-slate-200/80",
        )}
        onClick={() => {
          if (subjectFilter === subject && isQuickOverviewFilter) {
            setSubjectFilter("all");
            setIsQuickOverviewFilter(false);
          } else {
            setSubjectFilter(subject);
            setIsQuickOverviewFilter(true);
            setSearch("");
          }
        }}
      >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm truncate">
                      {subject}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {assignments.length} sections
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${(assignments.filter((a) => a.attendanceCompleted).length / assignments.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                    {assignments.filter((a) => a.attendanceCompleted).length}/
                    {assignments.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Class Assignments Grid/List */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold">
              Attendance Overview
              {filteredAssignments.length !== classAssignments.length && (
                <span className="ml-2 text-xs sm:text-sm text-muted-foreground font-normal">
                  ({filteredAssignments.length} of {classAssignments.length})
                </span>
              )}
            </h3>
            <div className="hidden sm:flex border rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                No Assignments Found
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-sm mx-auto px-4">
                {search || subjectFilter !== "all" || gradeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No class assignments available"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.classAssignmentId}
                  onClick={() =>
                    handleAssignmentClick(
                      assignment.sectionId,
                      assignment.subjectId,
                    )
                  }
                  className={cn(
                    "group rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden hover:shadow-lg transition-all cursor-pointer",
                    "hover:border-blue-300/80 hover:translate-y-[-2px]",
                  )}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 pb-3 sm:pb-4">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0",
                            assignment.subjectName === "Mathematics"
                              ? "bg-gradient-to-br from-blue-500 to-blue-600"
                              : "bg-gradient-to-br from-cyan-500 to-teal-600",
                          )}
                        >
                          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base sm:text-lg truncate">
                            {assignment.subjectName}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                              {getClassName(assignment)} • Section{" "}
                              {assignment.sectionName}
                            </p>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 hidden sm:inline shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline shrink-0">
                              {assignment.teacherRole.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "border text-[10px] flex-shrink-0",
                          assignment.attendanceCompleted
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        {assignment.attendanceCompleted
                          ? "Completed"
                          : "Pending"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>{assignment.studentCount} students</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-t border-slate-100">
                    <Button
                      variant={
                        assignment.attendanceCompleted ? "outline" : "default"
                      }
                      size="sm"
                      className={cn(
                        "w-full justify-between group/btn h-9 rounded-xl font-semibold transition-all text-xs sm:text-sm",
                        !assignment.attendanceCompleted &&
                          "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200",
                      )}
                    >
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        {assignment.attendanceCompleted ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>View Attendance</span>
                          </>
                        ) : (
                          <>
                            <Users className="h-3.5 w-3.5" />
                            <span>Take Attendance</span>
                          </>
                        )}
                      </span>
                      <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              {/* List Header - Hidden on mobile */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-3">Subject</div>
                <div className="col-span-2 flex justify-start">
                  Class • Section
                </div>
                <div className="col-span-2 flex justify-center">Students</div>
                <div className="col-span-2 flex justify-start">Role</div>
                <div className="col-span-2 flex justify-center">Status</div>
                <div className="col-span-1 flex justify-start">Action</div>
              </div>

              {/* List Items */}
              {filteredAssignments.map((assignment, index) => (
                <div
                  key={assignment.classAssignmentId}
                  onClick={() =>
                    handleAssignmentClick(
                      assignment.sectionId,
                      assignment.subjectId,
                    )
                  }
                  className={cn(
                    "flex sm:grid sm:grid-cols-12 gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 items-center hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                  )}
                >
                  <div className="sm:col-span-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                          assignment.subjectName === "Mathematics"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-cyan-100 text-cyan-600",
                        )}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-900 truncate block">
                          {assignment.subjectName}
                        </span>
                        <span className="sm:hidden text-[10px] text-muted-foreground font-medium">
                          {getClassName(assignment)} • Section{" "}
                          {assignment.sectionName} • {assignment.studentCount}{" "}
                          students
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex sm:col-span-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">
                        {getClassName(assignment)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Section {assignment.sectionName}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex sm:col-span-2 justify-center">
                    <Badge className="font-medium">
                      {assignment.studentCount}
                    </Badge>
                  </div>
                  <div className="hidden sm:flex sm:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                      {assignment.teacherRole.replace("_", " ")}
                    </span>
                  </div>
                  <div className="sm:col-span-2 sm:flex sm:justify-center flex-shrink-0">
                    <Badge
                      className={cn(
                        "border text-[10px] px-2 py-0 h-5 font-bold uppercase tracking-tighter whitespace-nowrap",
                        assignment.attendanceCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200",
                      )}
                    >
                      {assignment.attendanceCompleted ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                  <div className="hidden sm:flex sm:col-span-1 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 font-bold"
                    >
                      <span className="text-xs">
                        {assignment.attendanceCompleted ? "View" : "Take"}
                      </span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  {/* Mobile action */}
                  <div className="sm:hidden flex-shrink-0">
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Classroom Diary */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
                <PenLine className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold">
                  Daily Classroom Diary
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Log progress and notes for your classes today
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {classAssignments.map((assignment) => (
                <div
                  key={assignment.classAssignmentId}
                  onClick={() =>
                    handleDiaryClick(assignment.sectionId, assignment.subjectId)
                  }
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 group-hover:text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                        {assignment.subjectName}
                      </h4>
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                        {getClassName(assignment)} • Section{" "}
                        {assignment.sectionName}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl font-bold text-indigo-600 group-hover:bg-indigo-100 transition-all text-xs sm:text-sm flex-shrink-0"
                  >
                    <PenLine className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Log Diary</span>
                    <span className="sm:hidden">Log</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
