// app/admin/(dashboard)/teachers/page.tsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  Calendar,
  Download,
  Filter,
  X,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  UserCheck,
  UserX,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  School,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Activity,
  Star,
  LayoutGrid,
  List,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createTeacher,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
} from "@/lib/api/teacher";
import type {
  PageResponse,
  TeacherCreate,
  TeacherUpdate,
  TeacherResponse,
} from "@/types/lms";
import { TeacherListSkeleton } from "@/app/_components/skeletons/TeacherListSkeleton";

const TABS = [
  { id: "all", label: "All Teachers" },
  { id: "department", label: "By Department" },
  { id: "schedule", label: "Schedule" },
  { id: "performance", label: "Performance" },
];

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    icon: UserCheck,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  ON_LEAVE: {
    label: "On Leave",
    icon: Clock,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  INACTIVE: {
    label: "Inactive",
    icon: UserX,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};

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

type ViewState = "loading" | "error" | "empty" | "content";

export default function TeachersPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherPhoneNumber, setNewTeacherPhoneNumber] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherResponse | null>(
    null,
  );
  const [editTeacherName, setEditTeacherName] = useState("");
  const [editTeacherPhoneNumber, setEditTeacherPhoneNumber] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<TeacherResponse | null>(
    null,
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageNum(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch teachers
  const {
    data: teachersData,
    isLoading: teachersLoading,
    isError: teachersError,
    refetch: refetchTeachers,
  } = useQuery({
    queryKey: [
      "teachers",
      debouncedSearch,
      selectedDepartment,
      pageNum,
      pageSize,
    ],
    queryFn: async () => {
      const allTeachers = await getAllTeachers();
      const normalizedSearch = debouncedSearch.trim().toLowerCase();
      const filteredTeachers = normalizedSearch
        ? allTeachers.filter((teacher) =>
            teacher.teacherName.toLowerCase().includes(normalizedSearch),
          )
        : allTeachers;

      const startIndex = (pageNum - 1) * pageSize;
      const pagedTeachers = filteredTeachers.slice(
        startIndex,
        startIndex + pageSize,
      );

      const page: PageResponse<TeacherResponse> = {
        content: pagedTeachers,
        pageNum,
        pageSize,
        numOfElements: pagedTeachers.length,
        totalElements: filteredTeachers.length,
      };

      return page;
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: (payload: TeacherCreate) => createTeacher(payload),
    onSuccess: () => {
      setAddDialogOpen(false);
      setNewTeacherName("");
      setNewTeacherPhoneNumber("");
      refetchTeachers();
      toast({
        title: "Teacher added",
        description: "New teacher has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add teacher",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TeacherUpdate }) =>
      updateTeacher(id, payload),
    onSuccess: () => {
      setEditDialogOpen(false);
      setEditingTeacher(null);
      setEditTeacherName("");
      setEditTeacherPhoneNumber("");
      refetchTeachers();
      toast({
        title: "Teacher updated",
        description: "Teacher details have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update teacher",
        description: getApiErrorMessage(
          error,
          "Please check the details and try again.",
        ),
        variant: "destructive",
      });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: (id: number) => deleteTeacher(id),
    onSuccess: () => {
      setDeleteDialog(null);
      refetchTeachers();
      toast({
        title: "Teacher deleted",
        description: "The teacher has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete teacher",
        description: getApiErrorMessage(error, "Please try again later."),
        variant: "destructive",
      });
    },
  });

  const displayActivities = [
    {
      id: 1,
      teacherId: 1,
      teacherName: "Ram Prasad Bhattarai",
      action: "Grades submitted",
      details: "Class 10 · Mathematics",
      timestamp: "Today, 9:41 AM",
      type: "grade",
    },
    {
      id: 2,
      teacherId: 5,
      teacherName: "Nabin KC",
      action: "Attendance marked",
      details: "Class 9 · Computer Science",
      timestamp: "Today, 8:15 AM",
      type: "attendance",
    },
    {
      id: 3,
      teacherId: 3,
      teacherName: "Bikash Tamang",
      action: "Leave requested",
      details: "Medical leave - 3 days",
      timestamp: "Yesterday, 4:30 PM",
      type: "leave",
    },
    {
      id: 4,
      teacherId: 2,
      teacherName: "Sita Kumari Sharma",
      action: "Assignment created",
      details: "Class 8 · English",
      timestamp: "Yesterday, 2:10 PM",
      type: "assignment",
    },
  ];

  const getActivityTypeStyle = (type: string) => {
    switch (type) {
      case "grade":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "attendance":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "leave":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "assignment":
        return "bg-violet-100 text-violet-700 border-violet-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Stats calculations
  const teachers = teachersData?.content || [];
  const totalTeachers = teachersData?.totalElements || 0;

  const viewState: ViewState = teachersLoading
  ? "loading"
  : teachersError
  ? "error"
  : teachers.length === 0
  ? "empty"
  : "content";

  const handleExport = () => {
    const data = teachers.map((teacher) => ({
      teacherId: teacher.teacherId,
      teacherName: teacher.teacherName,
      teacherPhoneNumber: teacher.teacherPhoneNumber,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teachers-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: `${teachers.length} teachers exported successfully.`,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Teachers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Manage faculty, departments, and teaching assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Teacher</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Total Teachers
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {teachersLoading ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
                ) : (
                  totalTeachers
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-semibold">
            All Teachers
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-2">
              {totalTeachers} total
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 sm:h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="flex border rounded-md overflow-hidden flex-shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 sm:p-2 transition-colors",
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
                "p-2 sm:p-2 transition-colors",
                viewMode === "list"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

            {/* Teachers Display with smooth transitions */}
      <div className="relative">
        {/* Loading State */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            viewState === "loading"
              ? "opacity-100 visible"
              : "opacity-0 invisible absolute inset-0"
          )}
        >
          <TeacherListSkeleton viewMode={viewMode} />
        </div>

        {/* Error State */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            viewState === "error"
              ? "opacity-100 visible"
              : "opacity-0 invisible absolute inset-0"
          )}
        >
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Failed to load teachers
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTeachers()}
                className="text-xs sm:text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />{" "}
                Retry
              </Button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            viewState === "empty"
              ? "opacity-100 visible"
              : "opacity-0 invisible absolute inset-0"
          )}
        >
          <div className="rounded-xl border bg-card py-16 sm:py-20 text-center">
            <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No teachers found</p>
            {(debouncedSearch || selectedDepartment !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setSelectedDepartment("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Content State */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            viewState === "content"
              ? "opacity-100 visible"
              : "opacity-0 invisible absolute inset-0"
          )}
        >
          {viewMode === "grid" ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teachers.map((teacher, index) => {
                const statusConfig = STATUS_CONFIG.ACTIVE;
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const initials = teacher.teacherName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={teacher.teacherId}
                    className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
                    onClick={() =>
                      router.push(`/admin/teachers/${teacher.teacherId}`)
                    }
                  >
                    <div className="p-3 sm:p-5">
                      {/* Top Section */}
                      <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
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
                            {teacher.teacherName}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {teacher.teacherPhoneNumber}
                          </p>
                          <Badge
                            className={cn(
                              "mt-1.5 sm:mt-2 border text-[10px]",
                              statusConfig.bg,
                              statusConfig.text,
                              statusConfig.border,
                            )}
                          >
                            <statusConfig.icon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t mb-3 sm:mb-4" />

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-center bg-muted/30 rounded-lg p-2.5 sm:p-3">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-sm sm:text-base font-bold">
                            {teacher.assignmentResponse?.classesTaught ?? 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Classes
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-sm sm:text-base font-bold">
                            {teacher.assignmentResponse?.subjectsTaught ?? 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Subjects
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 sm:mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/teachers/${teacher.teacherId}`);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 sm:mr-1.5" /> View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTeacher(teacher);
                            setEditTeacherName(teacher.teacherName);
                            setEditTeacherPhoneNumber(teacher.teacherPhoneNumber);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1 sm:mr-1.5" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog(teacher);
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
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Teacher
                      </th>
                      <th className="hidden sm:table-cell px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Phone
                      </th>
                      <th className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Classes & Subjects
                      </th>
                      <th className="px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>
                      <th className="px-3 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {teachers.map((teacher, index) => {
                      const statusConfig = STATUS_CONFIG.ACTIVE;
                      const avatarColor =
                        AVATAR_COLORS[index % AVATAR_COLORS.length];

                      return (
                        <tr
                          key={teacher.teacherId}
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(`/admin/teachers/${teacher.teacherId}`)
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
                                {teacher.teacherName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                                  {teacher.teacherName}
                                </p>
                                <p className="sm:hidden text-[11px] text-muted-foreground">
                                  {teacher.teacherPhoneNumber}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-5 py-3 text-sm text-muted-foreground">
                            {teacher.teacherPhoneNumber}
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-5 py-3 text-center text-sm font-medium">
                            {teacher.assignmentResponse?.classesTaught ?? 0} Cls •{" "}
                            {teacher.assignmentResponse?.subjectsTaught ?? 0} Sub
                          </td>
                          <td className="px-3 sm:px-5 py-3 text-center">
                            <Badge
                              className={cn(
                                "border text-[10px] px-2 py-0 h-5",
                                statusConfig.bg,
                                statusConfig.text,
                                statusConfig.border,
                              )}
                            >
                              {statusConfig.label}
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
                                      `/admin/teachers/${teacher.teacherId}`,
                                    );
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTeacher(teacher);
                                    setEditTeacherName(teacher.teacherName);
                                    setEditTeacherPhoneNumber(
                                      teacher.teacherPhoneNumber,
                                    );
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialog(teacher);
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
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
          <h2 className="text-base sm:text-lg font-semibold">
            Recent Activity
          </h2>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Teacher
                </th>
                <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action
                </th>
                <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                  Details
                </th>
                <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                  Date & Time
                </th>
                <th className="px-3 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayActivities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 sm:px-5 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0",
                          AVATAR_COLORS[
                            activity.teacherId % AVATAR_COLORS.length
                          ].bg,
                          AVATAR_COLORS[
                            activity.teacherId % AVATAR_COLORS.length
                          ].text,
                        )}
                      >
                        {activity.teacherName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[100px] sm:max-w-none">
                          {activity.teacherName}
                        </p>
                        <p className="sm:hidden text-[11px] text-muted-foreground">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-5 py-3">
                    <Badge
                      className={cn(
                        "border text-[10px] sm:text-xs",
                        getActivityTypeStyle(activity.type),
                      )}
                    >
                      {activity.action}
                    </Badge>
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {activity.details}
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                    {activity.timestamp}
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 sm:px-6 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>{displayActivities.length} recent activities</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => router.push("/admin/activities")}
          >
            View all <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Add Teacher
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Add a new teacher to the school.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold">Teacher Information</h4>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter teacher's full name"
                className="h-10 sm:h-11"
                value={newTeacherName}
                onChange={(event) => setNewTeacherName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                className="h-10 sm:h-11"
                value={newTeacherPhoneNumber}
                onChange={(event) =>
                  setNewTeacherPhoneNumber(event.target.value)
                }
              />
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
                if (!newTeacherName.trim()) {
                  toast({
                    title: "Missing name",
                    description: "Teacher name is required.",
                  });
                  return;
                }
                if (!newTeacherPhoneNumber.trim()) {
                  toast({
                    title: "Missing phone",
                    description: "Teacher phone number is required.",
                  });
                  return;
                }
                createTeacherMutation.mutate({
                  teacherName: newTeacherName.trim(),
                  teacherPhoneNumber: newTeacherPhoneNumber.trim(),
                });
              }}
              disabled={createTeacherMutation.isPending}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {createTeacherMutation.isPending ? "Adding..." : "Add Teacher"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Edit Teacher
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Update teacher information.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold">Teacher Information</h4>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter teacher's full name"
                className="h-10 sm:h-11"
                value={editTeacherName}
                onChange={(event) => setEditTeacherName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                className="h-10 sm:h-11"
                value={editTeacherPhoneNumber}
                onChange={(event) =>
                  setEditTeacherPhoneNumber(event.target.value)
                }
              />
            </div>
          </div>

          <div className="border-t" />

          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingTeacher(null);
              }}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editTeacherName.trim()) {
                  toast({
                    title: "Missing name",
                    description: "Teacher name is required.",
                  });
                  return;
                }
                if (!editTeacherPhoneNumber.trim()) {
                  toast({
                    title: "Missing phone",
                    description: "Teacher phone number is required.",
                  });
                  return;
                }
                if (editingTeacher?.teacherId) {
                  updateTeacherMutation.mutate({
                    id: editingTeacher.teacherId,
                    payload: {
                      teacherName: editTeacherName.trim(),
                      teacherPhoneNumber: editTeacherPhoneNumber.trim(),
                    },
                  });
                }
              }}
              disabled={updateTeacherMutation.isPending}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Pencil className="h-4 w-4" />
              {updateTeacherMutation.isPending
                ? "Updating..."
                : "Update Teacher"}
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-base sm:text-lg">
                Delete Teacher?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
              This will permanently remove{" "}
              <strong>{deleteDialog?.teacherName}</strong> and all associated
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border-t my-2" />
          <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto text-xs sm:text-sm"
              disabled={deleteTeacherMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteDialog?.teacherId) {
                  deleteTeacherMutation.mutate(deleteDialog.teacherId);
                }
              }}
            >
              {deleteTeacherMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
