// app/admin/(dashboard)/students/StudentsPageClient.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Phone,
  Plus,
  UserCircle,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Trash2,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MoreHorizontal,
  UserX,
  UserCheck,
  GraduationCap,
  Layers,
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
import DebouncedSearchInput from "@/app/_components/ui/DebouncedSearchInput";
import FilterDropdown from "@/app/_components/ui/FilterDropdown";
import ClearFiltersButton from "@/app/_components/ui/ClearFiltersButton";
import MobileFilterBar from "@/app/_components/ui/MobileFilterBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { DeleteConfirmationDialog } from "@/app/_components/DeleteConfirmationDialog";
import { useToast } from "@/app/_components/ui/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getStudents, deleteStudent } from "@/lib/api/student";
import { getActiveSchoolClasses } from "@/lib/api/schoolClass";
import { getSectionsBySchoolClassId } from "@/lib/api/section";
import type { SectionResponse, StudentResponse } from "@/types/lms";
import StudentsStats from "@/app/_components/student/StudentsStats";
import { cn } from "@/lib/utils";
import { isAxiosError } from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Badge } from "@/app/_components/ui/badge";

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }

      const fieldMessages = Object.values(data).filter(
        (value) => typeof value === "string" && value.trim(),
      );

      if (fieldMessages.length > 0) {
        return fieldMessages.join("\n");
      }
    }
  }

  return fallback;
};

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




export default function StudentsPageClient({
  initialStudentName,
  initialClassId,
  initialSectionId,
  initialSortBy,
  initialSortDir,
  initialPageNum,
  initialPageSize,
  initialHasSectionAssignment,
}: {
  initialStudentName?: string;
  initialClassId?: string;
  initialSectionId?: string;
  initialSortBy?: string;
  initialSortDir?: string;
  initialPageNum?: string;
  initialPageSize?: string;
  initialHasSectionAssignment?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // URL params initialization
  const [debouncedSearch, setDebouncedSearch] = useState(
    initialStudentName || "",
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || "all",
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialSectionId || "all",
  );
  const [sortBy, setSortBy] = useState(
    initialSortBy || "studentId",
  );
  const [sortDir, setSortDir] = useState(initialSortDir || "ASC");
  const [pageNum, setPageNum] = useState(
    Number(initialPageNum) || 1,
  );
  const [pageSize, setPageSize] = useState(
    Number(initialPageSize) || 20,
  );
  const [hasSectionAssignment, setHasSectionAssignment] = useState<string>(
    initialHasSectionAssignment || "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch students
  const studentsQueryParams = useMemo(
    () => ({
      sortBy,
      sortDir: sortDir as "ASC" | "DESC",
      pageSize,
      pageNum,
      studentName: debouncedSearch.trim() || undefined,
      classId:
        selectedClassId !== "all"
          ? Number(selectedClassId)
          : undefined,
      sectionId:
        selectedSectionId !== "all"
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

  // Delete mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => deleteStudent(id),
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "Student has been removed successfully.",
      });
      refetchStudents();
      setDeleteDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
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
    enabled: selectedClassId !== "all",
  });

  const selectedSectionName = useMemo(() => {
    return sections.find(
      (section) => String(section.sectionId) === selectedSectionId,
    )?.sectionName;
  }, [sections, selectedSectionId]);

  // Reset section when class changes
  useEffect(() => {
    if (selectedClassId !== "all") {
      // Check if current section belongs to selected class
      const sectionExists = sections.some(
        (s) => String(s.sectionId) === selectedSectionId,
      );
      if (!sectionExists) {
        setSelectedSectionId("all");
      }
    } else {
      setSelectedSectionId("all");
    }
  }, [selectedClassId, sections, selectedSectionId]);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentResponse | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<StudentResponse | null>(
    null,
  );

  // Stats
  const totalStudents = studentsData?.totalElements || 0;
  const currentPage = (studentsData?.pageNum ?? 0) + 1;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const students = studentsData?.content || [];

  const hasContent = students.length > 0;

  // Active filters count — includes search, class, section, status, sort
  const activeFiltersCount = [
    debouncedSearch.trim(),
    selectedClassId !== "all" ? selectedClassId : "",
    selectedSectionId !== "all" ? selectedSectionId : "",
    hasSectionAssignment !== "all" ? hasSectionAssignment : "",
    sortBy !== "studentId" ? sortBy : "",
    sortDir !== "ASC" ? sortDir : "",
  ].filter(Boolean).length;

  // Update URL params
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim())
      params.set("studentName", debouncedSearch.trim());
    if (selectedClassId !== "all") {
      params.set("classId", selectedClassId);
    }
    if (selectedSectionId !== "all") {
      params.set("sectionId", selectedSectionId);
    }
    if (hasSectionAssignment && hasSectionAssignment !== "all") {
      params.set("hasSectionAssignment", hasSectionAssignment);
    }
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("pageNum", String(pageNum));
    params.set("pageSize", String(pageSize));
    router.replace(`/admin/students?${params.toString()}`, { scroll: false });
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
    setDebouncedSearch("");
    setSelectedClassId("all");
    setSelectedSectionId("all");
    setHasSectionAssignment("all");
    setSortBy("studentId");
    setSortDir("ASC");
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
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Students
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Manage student enrollment, classes, and academic records
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StudentsStats
        totalStudents={totalStudents}
        classesCount={classes.length}
        sectionsCount={classes.reduce(
          (sum, schoolClass) => sum + (schoolClass.sections?.length || 0),
          0,
        )}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <h2 className="text-base sm:text-lg font-semibold">
            All Students
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-2">
              {totalStudents} total
            </span>
          </h2>
        </div>

        {/* Mobile filter bar */}
        <div className="w-full sm:hidden">
          <MobileFilterBar
            searchValue={debouncedSearch}
            onSearchChange={(val) => {
              setDebouncedSearch(val);
              setPageNum(1);
            }}
            searchPlaceholder="Search students..."
            gradeValue={selectedClassId}
            onGradeChange={setSelectedClassId}
            gradeOptions={[
              { value: "all", label: "All classes" },
              ...classes.map((c) => ({
                value: String(c.schoolClassId),
                label: `Grade ${c.grade}`,
              })),
            ]}
            sectionValue={selectedSectionId}
            onSectionChange={setSelectedSectionId}
            sectionOptions={[
              { value: "all", label: "All sections" },
              ...sections.map((s) => ({
                value: String(s.sectionId),
                label: s.sectionName,
              })),
            ]}
            sectionDisabled={selectedClassId === "all"}
            statusValue={hasSectionAssignment}
            onStatusChange={(v) => {
              setHasSectionAssignment(v);
              setPageNum(1);
            }}
            statusOptions={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            sortValue={sortBy}
            onSortChange={setSortBy}
            sortOptions={SORT_OPTIONS}
            sortDirValue={sortDir}
            onSortDirChange={setSortDir}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Desktop Filters */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <DebouncedSearchInput
            value={debouncedSearch}
            placeholder="Search students..."
            onChange={(val) => {
              setDebouncedSearch(val);
              setPageNum(1);
            }}
            className="w-48 lg:w-64"
            inputClassName="h-9"
          />
          <FilterDropdown
            icon={GraduationCap}
            placeholder="All classes"
            value={selectedClassId}
            onValueChange={setSelectedClassId}
            options={[
              { value: "all", label: "All classes" },
              ...classes.map((c) => ({
                value: String(c.schoolClassId),
                label: `Grade ${c.grade}`,
              })),
            ]}
            className="h-9 w-[130px] sm:w-[140px] text-xs sm:text-sm"
          />
          <FilterDropdown
            icon={Layers}
            placeholder="All sections"
            value={selectedSectionId}
            onValueChange={setSelectedSectionId}
            options={[
              { value: "all", label: "All sections" },
              ...sections.map((s) => ({
                value: String(s.sectionId),
                label: s.sectionName,
              })),
            ]}
            disabled={selectedClassId === "all"}
            className="h-9 w-[130px] sm:w-[140px] text-xs sm:text-sm"
          />
          <FilterDropdown
            icon={UserCheck}
            placeholder="Assignment"
            value={hasSectionAssignment}
            onValueChange={(value) => {
              setHasSectionAssignment(value);
              setPageNum(1);
            }}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            className="h-9 w-[110px] sm:w-[120px] text-xs sm:text-sm"
          />
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
          <ClearFiltersButton
            activeFiltersCount={activeFiltersCount}
            onClick={handleClearFilters}
            className="h-9 px-2 text-xs"
          />
        </div>
      </div>

      {/* Error State */}
      {studentsError && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-destructive rotate-45" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
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
      )}

      {/* Content or Empty State */}
      {!studentsError && (
        <>
        {hasContent ? (
          viewMode === "grid" ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      router.push(`/admin/students/${student.studentId}`)
                    }
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 mb-3 sm:mb-4">
                        <div
                          className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0",
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
                              "mt-1.5 sm:mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
                              statusBadgeClasses,
                            )}
                          >
                            {hasClassAndSection ? (
                              <UserCheck className="h-3 w-3 mr-1" />
                            ) : (
                              <UserX className="h-3 w-3 mr-1" />
                            )}
                            {statusText}
                          </div>
                        </div>
                      </div>
                      <div className="border-t mb-3 sm:mb-4" />
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center bg-muted/30 rounded-lg p-2.5 sm:p-3">
                        <div>
                          <p className="text-xs font-bold truncate">
                            {formatStudentGrade(student)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Class</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold truncate">
                            {formatStudentSection(student)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Section</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold">
                            {formatStudentAttendance(student)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Attendance</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 sm:mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/students/${student.studentId}`);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog(student);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
                      <th className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class & Section</th>
                      <th className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attendance</th>
                      <th className="px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-3 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student, index) => {
                      const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                      const hasClassAndSection =
                        Boolean(student.studentClass?.grade?.trim()) &&
                        Boolean(student.studentClass?.sectionName?.trim());
                      const statusText = hasClassAndSection ? "Active" : "Inactive";
                      return (
                        <tr
                          key={student.studentId}
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/students/${student.studentId}`)}
                        >
                          <td className="px-3 sm:px-5 py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div
                                className={cn(
                                  "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                  avatarColor.bg,
                                  avatarColor.text,
                                )}
                              >
                                {student.studentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{student.studentName}</p>
                                <p className="sm:hidden text-[11px] text-muted-foreground">
                                  {formatStudentGrade(student)} {formatStudentSection(student) !== "—" ? `• ${formatStudentSection(student)}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-sm font-medium">
                            {formatStudentGrade(student)} {formatStudentSection(student) !== "—" ? `• ${formatStudentSection(student)}` : ""}
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-sm font-medium">
                            {formatStudentAttendance(student)}
                          </td>
                          <td className="px-3 sm:px-5 py-3 text-center">
                            <Badge className={cn("text-[10px] px-2 py-0 h-5", hasClassAndSection ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm" : "bg-amber-50 text-amber-700 border-amber-200 shadow-sm")}>
                              {hasClassAndSection ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                              {statusText}
                            </Badge>
                          </td>
                          <td className="px-3 sm:px-5 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/students/${student.studentId}`); }}>
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialog(student); }}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
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
          )
        ) : (
          <div className="rounded-xl border bg-card py-16 sm:py-20 text-center">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No students found</p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" className="mt-3" onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
        </>
      )}

      {/* Pagination - only show when there's content */}
      {hasContent && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 border rounded-xl bg-card shadow-sm">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents}
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
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
              <SelectTrigger className="h-8 w-[60px] sm:w-[65px] text-xs ml-1 sm:ml-2">
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

      {/* Add Student Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 mx-4 sm:mx-auto">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Add Student
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Enroll a new student into the system.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
            {/* Student Info Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-semibold">Student Information</h4>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium">
                  Full Name
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="Enter student's full name"
                    className="h-10 sm:h-11 pl-10"
                  />
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Section</label>
                  <Select>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem
                          key={section.sectionId}
                          value={String(section.sectionId)}
                        >
                          Section {section.sectionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Parent Info Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600" />
                </div>
                <h4 className="text-sm font-semibold">Parent / Guardian</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <div className="relative">
                    <Input
                      placeholder="Parent name"
                      className="h-10 sm:h-11 pl-10"
                    />
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      className="h-10 sm:h-11 pl-10"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setAddDialogOpen(false)}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Student added",
                  description: "Student has been enrolled successfully.",
                });
                setAddDialogOpen(false);
              }}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        title="Delete Student?"
        description={
          <>
            This will permanently remove{" "}
            <strong>{deleteDialog?.studentName}</strong> and all associated
            data. This action cannot be undone.
          </>
        }
        onConfirm={() => {
          if (deleteDialog?.studentId) {
            deleteStudentMutation.mutate(deleteDialog.studentId);
          }
        }}
        isPending={deleteStudentMutation.isPending}
      />
    </div>
  );
}
