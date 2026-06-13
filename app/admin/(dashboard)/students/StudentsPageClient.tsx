// app/admin/(dashboard)/students/StudentsPageClient.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MoreHorizontal,
  UserX,
  UserCheck,
  Filter,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/app/_components/ui/alert-dialog";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/app/_components/ui/sheet";
import  useHasMounted  from "@/lib/hooks/useHasMounted";

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

export default function StudentsPageClient() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
    if (hasMounted) {
      updateUrlParams();
    }
  }, [updateUrlParams, hasMounted]);

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

  if (!hasMounted) return null;

  // Mobile filter content
  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Class
        </label>
        <Select
          value={selectedClassId || "all"}
          onValueChange={(value) =>
            setSelectedClassId(normalizeFilterValue(value))
          }
        >
          <SelectTrigger className="h-10 text-sm w-full">
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
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Section
        </label>
        <Select
          value={selectedSectionId || "all"}
          onValueChange={(value) =>
            setSelectedSectionId(normalizeFilterValue(value))
          }
          disabled={!selectedClassId}
        >
          <SelectTrigger className="h-10 text-sm w-full">
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
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Status
        </label>
        <Select
          value={hasSectionAssignment}
          onValueChange={(value) => {
            setHasSectionAssignment(value);
            setPageNum(1);
          }}
        >
          <SelectTrigger className="h-10 text-sm w-full">
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Sort By
        </label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-10 text-sm w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Order
        </label>
        <Select value={sortDir} onValueChange={setSortDir}>
          <SelectTrigger className="h-10 text-sm w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASC">Ascending</SelectItem>
            <SelectItem value="DESC">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleClearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

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
          (sum, schoolClass) => sum + (schoolClass.sectionNames?.length || 0),
          0,
        )}
        currentPage={currentPage}
        totalPages={totalPages}
        studentsLoading={studentsLoading}
        classesLoading={classesLoading}
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

        {/* Mobile Search + Filter Bar */}
        <div className="flex items-center gap-2 w-full sm:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 bg-white text-sm focus-visible:ring-[#185FA5]/20"
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

          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 px-3 rounded-xl border-slate-200 gap-2 text-sm font-medium transition-all",
                  activeFiltersCount > 0
                    ? "border-[#185FA5]/30 bg-[#185FA5]/5 text-[#185FA5]"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-[#185FA5] text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] p-0">
              {/* Sheet Header */}
              <div className="px-5 py-4 border-b border-slate-100">
                <SheetHeader className="text-left space-y-0 p-0">
                  <SheetTitle className="text-lg font-bold text-slate-900">
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="flex items-center justify-between mt-0.5">
                  <SheetDescription className="text-xs text-slate-500 p-0">
                    Refine your student list
                  </SheetDescription>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleClearFilters();
                        setMobileFilterOpen(false);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2 -mr-2"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Reset filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Content */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)]">
                {/* Quick Filters Row */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    {
                      label: "Active",
                      value: "active",
                      current: hasSectionAssignment,
                    },
                    {
                      label: "Inactive",
                      value: "inactive",
                      current: hasSectionAssignment,
                    },
                  ].map((chip) => (
                    <button
                      key={chip.value}
                      onClick={() => {
                        setHasSectionAssignment(
                          hasSectionAssignment === chip.value
                            ? "all"
                            : chip.value,
                        );
                        setPageNum(1);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        hasSectionAssignment === chip.value
                          ? "bg-[#185FA5] text-white border-[#185FA5]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100" />

                {/* Class Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Class
                  </label>
                  <Select
                    value={selectedClassId || "all"}
                    onValueChange={(value) =>
                      setSelectedClassId(normalizeFilterValue(value))
                    }
                  >
                    <SelectTrigger className="h-10 text-sm w-full rounded-xl">
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
                </div>

                {/* Section Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Section
                  </label>
                  <Select
                    value={selectedSectionId || "all"}
                    onValueChange={(value) =>
                      setSelectedSectionId(normalizeFilterValue(value))
                    }
                    disabled={!selectedClassId}
                  >
                    <SelectTrigger className="h-10 text-sm w-full rounded-xl">
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
                </div>

                <div className="border-t border-slate-100" />

                {/* Sort Options */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-10 text-sm flex-1 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSortDir(sortDir === "ASC" ? "DESC" : "ASC")
                      }
                      className="h-10 w-10 rounded-xl border-slate-200 flex-shrink-0"
                    >
                      {sortDir === "ASC" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
                <Button
                  className="w-full h-11 rounded-xl bg-[#185FA5] hover:bg-[#0C447C] text-sm font-semibold"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  Show Results
                  {totalStudents > 0 && (
                    <span className="ml-2 text-white/70">
                      ({totalStudents})
                    </span>
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Filters */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <div className="relative w-48 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select
            value={selectedClassId || "all"}
            onValueChange={(value) =>
              setSelectedClassId(normalizeFilterValue(value))
            }
          >
            <SelectTrigger className="h-9 w-[130px] sm:w-[140px] text-xs sm:text-sm">
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
            value={selectedSectionId || "all"}
            onValueChange={(value) =>
              setSelectedSectionId(normalizeFilterValue(value))
            }
            disabled={!selectedClassId}
          >
            <SelectTrigger className="h-9 w-[130px] sm:w-[140px] text-xs sm:text-sm">
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
            <SelectTrigger className="h-9 w-[110px] sm:w-[120px] text-xs sm:text-sm">
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
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="flex flex-col items-center gap-3">
            <span className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Loading students...
            </p>
          </div>
        </div>
      ) : studentsError ? (
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
      ) : students.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 sm:py-20 text-center">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No students found</p>
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
                  {/* Top Section */}
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

                  {/* Divider */}
                  <div className="border-t mb-3 sm:mb-4" />

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center bg-muted/30 rounded-lg p-2.5 sm:p-3">
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
        /* List View */
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Student
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Class & Section
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Attendance
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16"></th>
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
                        router.push(`/admin/students/${student.studentId}`)
                      }
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
                            <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                              {student.studentName}
                            </p>
                            {/* Mobile sub-info */}
                            <p className="sm:hidden text-[11px] text-muted-foreground">
                              {formatStudentGrade(student)}{" "}
                              {formatStudentSection(student) !== "—"
                                ? `• ${formatStudentSection(student)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-sm font-medium">
                        {formatStudentGrade(student)}{" "}
                        {formatStudentSection(student) !== "—"
                          ? `• ${formatStudentSection(student)}`
                          : ""}
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-sm font-medium">
                        {formatStudentAttendance(student)}
                      </td>
                      <td className="px-3 sm:px-5 py-3 text-center">
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
                          ) : (
                            <UserX className="h-3 w-3 mr-1" />
                          )}
                          {statusText}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-5 py-3 text-right">
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
                                  `/admin/students/${student.studentId}`,
                                );
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialog(student);
                              }}
                            >
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
      )}

      {/* Pagination */}
      {students.length > 0 && (
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

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
      >
        <AlertDialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-base sm:text-lg">
                Delete Student?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
              This will permanently remove{" "}
              <strong>{deleteDialog?.studentName}</strong> and all associated
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border-t my-2" />
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
              disabled={deleteStudentMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteDialog?.studentId) {
                  deleteStudentMutation.mutate(deleteDialog.studentId);
                }
              }}
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
