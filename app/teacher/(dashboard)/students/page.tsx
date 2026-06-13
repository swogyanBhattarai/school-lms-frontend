// app/teacher/(dashboard)/students/page.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Plus,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MoreHorizontal,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getStudents } from "@/lib/api/student";
import { getActiveSchoolClasses } from "@/lib/api/schoolClass";
import { getSectionsBySchoolClassId } from "@/lib/api/section";
import type { SectionResponse, StudentResponse } from "@/types/lms";
import StudentsStats from "@/app/_components/student/StudentsStats";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Badge } from "@/app/_components/ui/badge";

// Constants
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const SORT_OPTIONS = [
  { value: "studentId", label: "Student ID" },
  { value: "studentName", label: "Name" },
];

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-cyan-100", text: "text-cyan-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
];

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params initialization
  const [search, setSearch] = useState(searchParams.get("studentName") || "");
  const [selectedClassId, setSelectedClassId] = useState<string>(
    searchParams.get("classId") || "",
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    searchParams.get("sectionId") || "",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "studentId",
  );
  const [sortDir, setSortDir] = useState(searchParams.get("sortDir") || "ASC");
  const [pageNum, setPageNum] = useState(
    Number(searchParams.get("pageNum")) || 1,
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize")) || 20,
  );
  const [hasSectionAssignment, setHasSectionAssignment] = useState<string>(
    searchParams.get("hasSectionAssignment") || "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const normalizeFilterValue = useCallback((value: string) => {
    return value === "all" ? "" : value;
  }, []);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageNum(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch students
  const studentsQueryParams = useMemo(
    () => ({
      sortBy,
      sortDir: sortDir as "ASC" | "DESC",
      pageSize,
      pageNum,
      studentName: debouncedSearch.trim() || undefined,
      classId:
        selectedClassId && selectedClassId !== "all"
          ? Number(selectedClassId)
          : undefined,
      sectionId:
        selectedSectionId && selectedSectionId !== "all"
          ? Number(selectedSectionId)
          : undefined,
      hasSectionAssignment:
        hasSectionAssignment === "active"
          ? true
          : hasSectionAssignment === "inactive"
            ? false
            : undefined,
    }),
    [
      sortBy,
      sortDir,
      pageSize,
      pageNum,
      debouncedSearch,
      selectedClassId,
      selectedSectionId,
      hasSectionAssignment,
    ],
  );

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isError: studentsError,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["students", studentsQueryParams],
    queryFn: () => getStudents(studentsQueryParams),
  });

  // Fetch classes for filter
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["school-classes"],
    queryFn: () => getActiveSchoolClasses(),
  });

  // Get sections for selected class
  const selectedClass = useMemo(
    () => classes.find((c) => String(c.schoolClassId) === selectedClassId),
    [classes, selectedClassId],
  );

  const { data: sections = [] } = useQuery<SectionResponse[]>({
    queryKey: ["class-sections", selectedClassId],
    queryFn: () => getSectionsBySchoolClassId(Number(selectedClassId)),
    enabled: Boolean(selectedClassId),
  });

  const selectedSectionName = useMemo(() => {
    return sections.find(
      (section) => String(section.sectionId) === selectedSectionId,
    )?.sectionName;
  }, [sections, selectedSectionId]);

  // Reset section when class changes
  useEffect(() => {
    if (selectedClassId) {
      // Check if current section belongs to selected class
      const sectionExists = sections.some(
        (s) => String(s.sectionId) === selectedSectionId,
      );
      if (!sectionExists) {
        setSelectedSectionId("");
      }
    } else {
      setSelectedSectionId("");
    }
  }, [selectedClassId, sections, selectedSectionId]);

  // Stats
  const totalStudents = studentsData?.totalElements || 0;
  const currentPage = (studentsData?.pageNum ?? 0) + 1;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const students = studentsData?.content || [];

  // Active filters count
  const activeFiltersCount = [
    selectedClassId,
    selectedSectionId,
    hasSectionAssignment !== "all" ? hasSectionAssignment : "",
  ].filter(Boolean).length;

  // Update URL params
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim())
      params.set("studentName", debouncedSearch.trim());
    if (selectedClassId && selectedClassId !== "all") {
      params.set("classId", selectedClassId);
    }
    if (selectedSectionId && selectedSectionId !== "all") {
      params.set("sectionId", selectedSectionId);
    }
    if (hasSectionAssignment && hasSectionAssignment !== "all") {
      params.set("hasSectionAssignment", hasSectionAssignment);
    }
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("pageNum", String(pageNum));
    params.set("pageSize", String(pageSize));
    router.replace(`/teacher/students?${params.toString()}`, { scroll: false });
  }, [
    debouncedSearch,
    selectedClassId,
    selectedSectionId,
    hasSectionAssignment,
    sortBy,
    sortDir,
    pageNum,
    pageSize,
    router,
  ]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Handlers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDir("ASC");
    }
    setPageNum(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedClassId("");
    setSelectedSectionId("");
    setHasSectionAssignment("all");
    setPageNum(1);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    }
    return sortDir === "ASC" ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  const formatStudentGrade = (student: StudentResponse) => {
    const grade = student.studentClass?.grade?.trim();
    if (!grade) return "—";
    return grade.startsWith("G") ? grade : `${grade}`;
  };

  const formatStudentSection = (student: StudentResponse) => {
    return student.studentClass?.sectionName?.trim() || "—";
  };

  const formatStudentAttendance = (student: StudentResponse) => {
    const average = student.averageAttendance;
    if (average === null || average === undefined || Number.isNaN(average)) {
      return "—";
    }
    return `${Math.round(average)}%`;
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student enrollment, classes, and academic records
          </p>
        </div>
        <div className="flex items-center gap-2" />
      </div>

      {/* Stats Cards */}
      <StudentsStats
        totalStudents={totalStudents}
        classesCount={classes.length}
        sectionsCount={classes.reduce(
          (sum, schoolClass) => sum + (schoolClass.sectionNames?.length || 0),
          0,
        )}
        currentPage={currentPage}
        totalPages={totalPages}
        studentsLoading={studentsLoading}
        classesLoading={classesLoading}
      />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">
            All Students
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {totalStudents} total
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select
            value={selectedClassId}
            onValueChange={(value) =>
              setSelectedClassId(normalizeFilterValue(value))
            }
          >
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem
                  key={cls.schoolClassId}
                  value={String(cls.schoolClassId)}
                >
                  Grade {cls.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedSectionId}
            onValueChange={(value) =>
              setSelectedSectionId(normalizeFilterValue(value))
            }
            disabled={!selectedClassId}
          >
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="All sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {sections.map((section) => (
                <SelectItem
                  key={section.sectionId}
                  value={String(section.sectionId)}
                >
                  {section.sectionName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={hasSectionAssignment}
            onValueChange={(value) => {
              setHasSectionAssignment(value);
              setPageNum(1);
            }}
          >
            <SelectTrigger className="h-9 w-[120px] text-sm">
              <SelectValue placeholder="Assignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden">
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
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs text-[#185FA5] hover:bg-transparent hover:text-[#0C447C]"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Students Display */}
      {studentsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading students...</p>
          </div>
        </div>
      ) : studentsError ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-destructive rotate-45" />
            </div>
            <p className="text-sm text-muted-foreground">
              Error loading students
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetchStudents()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border bg-card py-20 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No students found</p>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student, index) => {
            const initials = student.studentName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const hasClassAndSection =
              Boolean(student.studentClass?.grade?.trim()) &&
              Boolean(student.studentClass?.sectionName?.trim());
            const statusText = hasClassAndSection ? "Active" : "Inactive";
            const statusBadgeClasses = hasClassAndSection
              ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm"
              : "bg-amber-50 text-amber-700 border-amber-200 shadow-sm";

            return (
              <div
                key={student.studentId}
                className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
                onClick={() =>
                  router.push(`/teacher/students/${student.studentId}`)
                }
              >
                <div className="p-5">
                  {/* Top Section */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0",
                        avatarColor.bg,
                        avatarColor.text,
                      )}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {student.studentName}
                      </h3>
                      <div
                        className={cn(
                          "mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
                          statusBadgeClasses,
                        )}
                      >
                        {hasClassAndSection ? (
                          <UserCheck className="h-3 w-3 mr-1" />
                        ) : <UserX className="h-3 w-3 mr-1" />}
                        {statusText}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t mb-4" />

                  {/* Stats */}
                   <div className="grid grid-cols-3 gap-2 text-center bg-muted/30 rounded-lg p-3">
                      <div>
                        <p className="text-xs font-bold truncate">
                          {formatStudentGrade(student)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Class
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold truncate">
                          {formatStudentSection(student)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Section
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold">
                          {formatStudentAttendance(student)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Attendance
                        </p>
                      </div>
                    </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/teacher/students/${student.studentId}`);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Student
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Class & Section
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Attendance
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student, index) => {
                  const avatarColor =
                    AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const hasClassAndSection =
                    Boolean(student.studentClass?.grade?.trim()) &&
                    Boolean(student.studentClass?.sectionName?.trim());
                  const statusText = hasClassAndSection ? "Active" : "Inactive";

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/teacher/students/${student.studentId}`)
                      }
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                              avatarColor.bg,
                              avatarColor.text,
                            )}
                          >
                            {student.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {student.studentName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-sm font-medium">
                        {formatStudentGrade(student)} {formatStudentSection(student) !== "—" ? `• ${formatStudentSection(student)}` : ""}
                      </td>
                      <td className="px-5 py-3 text-center text-sm font-medium">
                        {formatStudentAttendance(student)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge
                          className={cn(
                            "text-[10px] px-2 py-0 h-5",
                            hasClassAndSection
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm"
                              : "bg-amber-50 text-amber-700 border-amber-200 shadow-sm",
                          )}
                        >
                          {hasClassAndSection ? (
                            <UserCheck className="h-3 w-3 mr-1" />
                          ) : <UserX className="h-3 w-3 mr-1" />}
                          {statusText}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/teacher/students/${student.studentId}`,
                                );
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {students.length > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border rounded-xl bg-card shadow-sm">
          <div className="text-xs text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={pageNum <= 1}
              onClick={() => setPageNum((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  className={`h-8 w-8 p-0 text-xs ${
                    pageNumber === currentPage
                      ? "bg-[#185FA5] hover:bg-[#0C447C]"
                      : ""
                  }`}
                  onClick={() => setPageNum(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={pageNum >= totalPages}
              onClick={() => setPageNum((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPageNum(1);
              }}
            >
              <SelectTrigger className="h-8 w-[65px] text-xs ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

    </div>
  );
}
