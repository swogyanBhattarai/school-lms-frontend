"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSubjectById, getSubjectAttendanceStats, getSubjectDiaryStats, updateSubject } from "@/lib/api/subject";
import { updateDiaryAdmin, deleteDiary } from "@/lib/api/diary";
import type { SubjectUpdate, DiaryUpdateAdmin } from "@/types/lms";
import { getActiveSchoolClasses } from "@/lib/api/schoolClass";
import {
  Search,
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  RotateCcw,
  PenLine,
  Pencil,
  Trash2,
  AlertTriangle,
  Filter,
  BookCheck,
  CircleDot,
  ArrowLeftRight,
  Settings,
  User,
  Eye,
  Loader2,
  Save,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import { MiniCalendar } from "@/app/_components/MiniNepaliCalendarPicker";
import { convertADToBS, getTodayADString } from "@/lib/nepali-calendar";
import type { SubjectAttendanceResponse, SubjectDiaryResponse } from "@/types/lms";
import { Label } from "@/app/_components/ui/label";
import { DeleteConfirmationDialog } from "@/app/_components/DeleteConfirmationDialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";

// Academic year
const ACADEMIC_YEAR = "2081";

// ============================================================

// Helper to group data by grade then by section
function groupByGradeAndSection<T extends { grade: string; section: string }>(
  data: T[],
): Map<string, Map<string, T[]>> {
  const gradeMap = new Map<string, Map<string, T[]>>();
  data.forEach((item) => {
    if (!gradeMap.has(item.grade)) {
      gradeMap.set(item.grade, new Map());
    }
    const sectionMap = gradeMap.get(item.grade)!;
    if (!sectionMap.has(item.section)) {
      sectionMap.set(item.section, []);
    }
    sectionMap.get(item.section)!.push(item);
  });
  return gradeMap;
}

export default function SubjectDetailPageClient({
  initialSubjectName,
}: {
  initialSubjectName?: string;
}) {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const subjectId = params.id ? Number(params.id) : undefined;

  // Fetch subject name from API
  const { data: subjectData } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => getSubjectById(subjectId!),
    enabled: !!subjectId,
  });
  const subjectName = subjectData?.subjectName || initialSubjectName || "Subject Name";

  // Edit subject state
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editedSubjectName, setEditedSubjectName] = useState("");
  const queryClient = useQueryClient();
  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SubjectUpdate }) =>
      updateSubject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setIsEditingSubject(false);
      toast({ title: "Subject updated", description: "Subject name has been updated." });
    },
    onError: () => {
      toast({ title: "Failed to update subject", description: "Please try again.", variant: "destructive" });
    },
  });

  const startEditSubject = () => {
    setEditedSubjectName(subjectName);
    setIsEditingSubject(true);
  };

  // Date filter
  const [selectedDate, setSelectedDate] = useState<string>(getTodayADString());
  const selectedDateBS = useMemo(
    () => convertADToBS(new Date(selectedDate)),
    [selectedDate],
  );
  const isToday = selectedDate === getTodayADString();
  const selectedDateLabel = useMemo(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  // Diary edit
  const [editDialogDiary, setEditDialogDiary] = useState<(typeof diaryData)[0] | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDiaryId, setDeletingDiaryId] = useState<number | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState("attendance");

  // Filters
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("grade");
  // Mobile filters visibility
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch active school classes for filters
  const { data: schoolClasses } = useQuery({
    queryKey: ["activeSchoolClasses"],
    queryFn: () => getActiveSchoolClasses(),
  });

  // Derive classId from the selected grade filter
  const classIdFilter = useMemo(() => {
    if (gradeFilter === "all" || !schoolClasses) return undefined;
    const match = schoolClasses.find((c) => c.grade === gradeFilter);
    return match?.schoolClassId;
  }, [gradeFilter, schoolClasses]);

  // Fetch attendance stats from API
  const { data: attendanceStatsData, isLoading: isAttendanceLoading } =
    useQuery<SubjectAttendanceResponse[]>({
      queryKey: ["subjectAttendanceStats", subjectId, classIdFilter, selectedDate],
      queryFn: () => getSubjectAttendanceStats(subjectId!, selectedDate, classIdFilter),
      enabled: !!subjectId && !!selectedDate,
    });

  // Fetch diary stats from API
  const { data: diaryStatsData } = useQuery<SubjectDiaryResponse[]>({
    queryKey: ["subjectDiaryStats", subjectId, classIdFilter, selectedDate],
    queryFn: () => getSubjectDiaryStats(subjectId!, selectedDate, classIdFilter),
    enabled: !!subjectId && !!selectedDate,
  });

  // Attendance data from API
  const attendanceData: {
    classAssignmentId: number;
    sectionId: number;
    teacherId: number;
    grade: string;
    section: string;
    teacherName: string;
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    completed: boolean;
  }[] = useMemo(() => {
    if (!attendanceStatsData) return [];
    return attendanceStatsData.map((item) => ({
      classAssignmentId: item.sectionId, // use sectionId as stable key
      sectionId: item.sectionId,
      teacherId: item.teacherId,
      grade: item.grade,
      section: item.sectionName,
      teacherName: item.teacherName,
      totalStudents: item.totalStudents,
      present: item.presentStudents,
      absent: item.absentStudents,
      late: item.leaveStudents,
      completed: item.attendanceCompleted,
    }));
  }, [attendanceStatsData]);

  // Derive header stats from API data
  const headerStats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
  } = useMemo(() => {
    if (!attendanceStatsData || attendanceStatsData.length === 0) {
      return { totalStudents: 0, totalTeachers: 0, totalClasses: 0 };
    }
    const uniqueTeachers = new Set(attendanceStatsData.map((s) => s.teacherId));
    const uniqueSections = new Set(attendanceStatsData.map((s) => s.sectionId));
    const totalStudents = attendanceStatsData.reduce(
      (sum, s) => sum + s.totalStudents,
      0,
    );
    return {
      totalStudents,
      totalTeachers: uniqueTeachers.size,
      totalClasses: uniqueSections.size,
    };
  }, [attendanceStatsData]);

  // Diary data from API, merged with attendance sections for pending status
  const formatDiaryDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const diaryData: {
    id: number;
    diaryId: number | null;
    grade: string;
    section: string;
    title: string | null;
    content: string | null;
    createdBy: string;
    diaryDate: string | null;
    status: "inserted" | "pending";
  }[] = useMemo(() => {
    const entries = new Map<number, SubjectDiaryResponse>();
    if (diaryStatsData) {
      diaryStatsData.forEach((d) => entries.set(d.sectionId, d));
    }
    // Use attendance stats sections as the source of all sections
    const sections = attendanceStatsData || [];
    return sections.map((sec) => {
      const diary = entries.get(sec.sectionId);
      if (diary) {
        return {
          id: diary.sectionId,
          diaryId: diary.diaryId,
          grade: diary.grade,
          section: diary.sectionName,
          title: diary.title,
          content: diary.content,
          createdBy: diary.teacherName,
          diaryDate: formatDiaryDate(diary.diaryDate),
          status: "inserted" as const,
        };
      }
      return {
        id: sec.sectionId,
        diaryId: null,
        grade: sec.grade,
        section: sec.sectionName,
        title: null,
        content: null,
        createdBy: sec.teacherName,
        diaryDate: null,
        status: "pending" as const,
      };
    });
  }, [diaryStatsData, attendanceStatsData]);

  const diaryStats = useMemo(() => {
    const inserted = diaryData.filter((d) => d.status === "inserted").length;
    const pending = diaryData.filter((d) => d.status === "pending").length;
    return { inserted, pending, total: diaryData.length };
  }, [diaryData]);

  // School classes for grade filter
  const uniqueGrades = useMemo(() => {
    if (!schoolClasses) return [];
    return schoolClasses
      .map((c) => c.grade)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }, [schoolClasses]);

  // Filtered data
  const filteredAttendance = useMemo(() => {
    let data = [...attendanceData];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (a) =>
          a.grade.includes(q) ||
          a.section.toLowerCase().includes(q) ||
          a.teacherName.toLowerCase().includes(q),
      );
    }
    if (gradeFilter !== "all")
      data = data.filter((a) => a.grade === gradeFilter);
    data.sort((a, b) => {
      switch (sortBy) {
        case "grade":
          return (
            parseInt(a.grade) - parseInt(b.grade) ||
            a.section.localeCompare(b.section)
          );
        case "section":
          return a.section.localeCompare(b.section);
        case "teacher":
          return a.teacherName.localeCompare(b.teacherName);
        case "status":
          return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
        default:
          return 0;
      }
    });
    return data;
  }, [attendanceData, search, gradeFilter, sortBy]);

  // Stats — derive from filteredAttendance so stat cards update immediately on filter change
  const attendanceStats = useMemo(() => {
    const data = filteredAttendance;
    const totalClasses = data.length;
    const completed = data.filter((a) => a.completed).length;
    const pending = totalClasses - completed;
    const totalPresent = data.reduce((s, a) => s + a.present, 0);
    const totalAbsent = data.reduce((s, a) => s + a.absent, 0);
    const totalLate = data.reduce((s, a) => s + a.late, 0);
    const rate =
      totalPresent + totalAbsent + totalLate > 0
        ? Math.round(
            (totalPresent / (totalPresent + totalAbsent + totalLate)) * 100,
          )
        : 0;
    return {
      totalClasses,
      completed,
      pending,
      totalPresent,
      totalAbsent,
      totalLate,
      rate,
    };
  }, [filteredAttendance]);

  const filteredDiary = useMemo(() => {
    let data = [...diaryData];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (d) =>
          d.grade.includes(q) ||
          d.section.toLowerCase().includes(q) ||
          (d.title && d.title.toLowerCase().includes(q)) ||
          (d.content && d.content.toLowerCase().includes(q)) ||
          d.createdBy.toLowerCase().includes(q),
      );
    }
    if (gradeFilter !== "all")
      data = data.filter((d) => d.grade === gradeFilter);
    data.sort((a, b) => {
      switch (sortBy) {
        case "grade":
          return (
            parseInt(a.grade) - parseInt(b.grade) ||
            a.section.localeCompare(b.section)
          );
        case "section":
          return a.section.localeCompare(b.section);
        case "teacher":
          return a.createdBy.localeCompare(b.createdBy);
        case "status":
          return (
            (a.status === "inserted" ? 1 : 0) -
            (b.status === "inserted" ? 1 : 0)
          );
        default:
          return 0;
      }
    });
    return data;
  }, [diaryData, search, gradeFilter, sortBy]);

  // Grouped data
  const groupedAttendance = useMemo(
    () => groupByGradeAndSection(filteredAttendance),
    [filteredAttendance],
  );
  const groupedDiary = useMemo(
    () => groupByGradeAndSection(filteredDiary),
    [filteredDiary],
  );

  const handleAttendanceCardClick = (sectionId: number, teacherId: number) => {
    router.push(
      `/admin/teachers/attendance/${sectionId}?subjectId=${subjectId}&teacherId=${teacherId}&attendanceDate=${selectedDate}`,
    );
  };

  const clearFilters = () => {
    setSearch("");
    setGradeFilter("all");
    setSortBy("grade");
    setSelectedDate(getTodayADString());
  };

  const activeFiltersCount = [
    search ? "search" : "",
    gradeFilter !== "all" ? "grade" : "",
    sortBy !== "grade" ? "sort" : "",
    !isToday ? "date" : "",
  ].filter(Boolean).length;

  // Diary handlers
  const handleEditDiary = (diary: (typeof diaryData)[0]) => {
    setEditTitle(diary.title || "");
    setEditContent(diary.content || "");
    setEditDialogDiary(diary);
  };

  const updateDiaryMutation = useMutation({
    mutationFn: ({ diaryId, data }: { diaryId: number; data: DiaryUpdateAdmin }) =>
      updateDiaryAdmin(diaryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjectDiaryStats"] });
      setEditDialogDiary(null);
      toast({
        title: "Diary Updated",
        description: "The diary entry has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update diary",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDiary = () => {
    if (!editDialogDiary) return;
    updateDiaryMutation.mutate({
      diaryId: editDialogDiary.diaryId!,
      data: {
        title: editTitle,
        content: editContent,
      } as DiaryUpdateAdmin,
    });
  };

  const deleteDiaryMutation = useMutation({
    mutationFn: (diaryId: number) => deleteDiary(diaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjectDiaryStats"] });
      setDeleteDialogOpen(false);
      setDeletingDiaryId(null);
      toast({ title: "Diary Deleted", description: "The diary entry has been removed." });
    },
    onError: () => {
      toast({ title: "Failed to delete diary", description: "Please try again.", variant: "destructive" });
    },
  });

  const handleDeleteClick = (id: number) => {
    setDeletingDiaryId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingDiaryId) return;
    deleteDiaryMutation.mutate(deletingDiaryId);
  };

  // Reset search when switching tabs
  useEffect(() => {
    setSearch("");
  }, [activeTab]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 px-3 sm:px-6 lg:px-0 pb-8">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 sm:pt-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
                Subject Details
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-7">
              Academic Year {ACADEMIC_YEAR} &bull; {selectedDateLabel}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={startEditSubject}
            className="hidden sm:flex h-9 px-4 rounded-xl text-sm font-medium border-slate-200 hover:bg-slate-100 ml-auto sm:ml-0"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Edit Subject
          </Button>
        </div>

                {/* ─── Subject Info Card ─── */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-cyan-500/5 rounded-2xl sm:rounded-3xl" />
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              {/* Mobile: stacked layout */}
              <div className="sm:hidden">
                {isEditingSubject ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">Edit Subject</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!editedSubjectName.trim()) return;
                            updateSubjectMutation.mutate({
                              id: subjectId!,
                              payload: { subjectName: editedSubjectName.trim() } as SubjectUpdate,
                            });
                          }}
                          disabled={updateSubjectMutation.isPending}
                          className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          {updateSubjectMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Save className="h-3.5 w-3.5 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingSubject(false)}
                          className="h-8 rounded-lg text-xs"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Subject Name</Label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={editedSubjectName}
                          onChange={(e) => setEditedSubjectName(e.target.value)}
                          placeholder="Subject name"
                          className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center ring-4 ring-indigo-100">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-center w-full">
                      <h2 className="text-lg font-bold">{subjectName}</h2>
                    </div>
                    <div className="w-3/4 h-px bg-slate-200" />
                    <div className="flex items-center justify-center gap-6 w-full">
                      <div className="text-center flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          Classes
                        </p>
                        <p className="text-xl font-bold text-indigo-600">
                          {headerStats.totalClasses}
                        </p>
                      </div>
                      <div className="w-px h-10 bg-slate-200" />
                      <div className="text-center flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          Teachers
                        </p>
                        <p className="text-xl font-bold text-emerald-600">
                          {headerStats.totalTeachers}
                        </p>
                      </div>
                      <div className="w-px h-10 bg-slate-200" />
                      <div className="text-center flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          Students
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                          {headerStats.totalStudents}
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-slate-200" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startEditSubject}
                      className="h-9 px-4 rounded-xl text-xs w-full"
                    >
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Edit Subject
                    </Button>
                  </div>
                )}
              </div>

              {/* Desktop: side-by-side layout */}
              <div className="hidden sm:flex items-center gap-8">
                {/* Left: Subject icon + name */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center ring-4 ring-indigo-100 flex-shrink-0">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    {isEditingSubject ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedSubjectName}
                          onChange={(e) => setEditedSubjectName(e.target.value)}
                          className="h-9 text-sm rounded-lg w-48"
                          placeholder="Subject name"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!editedSubjectName.trim()) return;
                            updateSubjectMutation.mutate({
                              id: subjectId!,
                              payload: { subjectName: editedSubjectName.trim() } as SubjectUpdate,
                            });
                          }}
                          disabled={updateSubjectMutation.isPending}
                          className="h-9 px-3 rounded-lg text-xs"
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingSubject(false)}
                          className="h-9 px-3 rounded-lg text-xs"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <h2 className="text-xl font-bold">{subjectName}</h2>
                    )}
                  </div>
                </div>

                {/* Right: Stats */}
                <div className="flex items-center gap-6 ml-auto sm:border-l sm:border-slate-200 sm:pl-6">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Classes
                    </p>
                    <p className="text-xl font-bold text-indigo-600">
                      {headerStats.totalClasses}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Teachers
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                      {headerStats.totalTeachers}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Students
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      {headerStats.totalStudents}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setGradeFilter("all");
            setSortBy("grade");
          }}
          className="space-y-4"
        >
          {/* Mobile tab dropdown */}
          <div className="sm:hidden">
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v)}>
              <SelectTrigger className="w-full h-10 rounded-xl bg-white border-slate-300 text-sm font-medium">
                <SelectValue placeholder="Select tab" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="attendance">
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" /> Attendance
                  </span>
                </SelectItem>
                <SelectItem value="diary">
                  <span className="flex items-center gap-2">
                    <PenLine className="h-3.5 w-3.5" /> Diary
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Desktop tab list */}
          <div className="hidden sm:block w-full">
            <TabsList className="grid grid-cols-2 h-auto p-1 bg-white rounded-xl border border-slate-200 w-full">
              <TabsTrigger
                value="attendance"
                className="rounded-lg text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="diary"
                className="rounded-lg text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <PenLine className="h-3.5 w-3.5 mr-1.5" />
                Diary
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ═══════════════════════════════════════════════════════
              ATTENDANCE TAB
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="attendance" className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <StatCard
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                label="Completed"
                value={attendanceStats.completed}
                sub={`of ${attendanceStats.totalClasses} classes`}
                color="text-emerald-600"
              />
              <StatCard
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Pending"
                value={attendanceStats.pending}
                sub="Need attention"
                color="text-amber-600"
              />
              <StatCard
                icon={<Users className="h-3.5 w-3.5" />}
                label="Present"
                value={attendanceStats.totalPresent}
                sub={`Absent: ${attendanceStats.totalAbsent}`}
                color="text-blue-600"
              />
              <StatCard
                icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
                label="Attendance Rate"
                value={`${attendanceStats.rate}%`}
                sub={`Leave: ${attendanceStats.totalLate}`}
                color="text-violet-600"
              />
            </div>

            {/* Filters — Desktop */}
            <div className="hidden sm:flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by grade, section, teacher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 bg-white border-slate-200 text-sm rounded-xl w-full"
                />
              </div>
              <MiniCalendar
                value={selectedDateBS}
                onChange={(date) => setSelectedDate(date)}
                placeholder="Select date"
                className="w-[180px]"
              />
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-10 bg-white text-sm rounded-xl w-[140px]">
                  <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {uniqueGrades.map((g) => (
                    <SelectItem key={g} value={g}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 bg-white text-sm rounded-xl w-[140px]">
                  <Calendar className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 px-3 rounded-xl shrink-0"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Clear
                </Button>
              )}
            </div>

            {/* Filters — Mobile */}
            <div className="sm:hidden space-y-2">
              {/* Collapsible Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full justify-between rounded-xl h-10 text-sm border-slate-300"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <span>Filters & Search</span>
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-slate-800 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center p-0">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </div>
                {showMobileFilters ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </Button>
              {/* Filter Content */}
              <div className={cn("space-y-2", showMobileFilters ? "block" : "hidden")}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search classes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 bg-white border-slate-200 text-sm rounded-xl w-full"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <MiniCalendar
                    value={selectedDateBS}
                    onChange={(date) => setSelectedDate(date)}
                    placeholder="Select date"
                    className="flex-1 min-w-[140px]"
                  />
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="h-10 bg-white text-xs rounded-xl flex-1">
                      <GraduationCap className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {uniqueGrades.map((g) => (
                        <SelectItem key={g} value={g}>
                          Grade {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 bg-white text-xs rounded-xl flex-1">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grade">Grade</SelectItem>
                      <SelectItem value="section">Section</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full h-9 rounded-xl text-xs border-slate-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance list — Grouped */}
            {filteredAttendance.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No attendance records found"
                subtitle="Try adjusting your filters or date"
              />
            ) : (
              <div className="space-y-6">
                {Array.from(groupedAttendance.entries()).map(
                  ([grade, sectionMap]) => (
                    <div key={grade} className="space-y-3">
                      {/* Grade heading */}
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-1 rounded-full bg-indigo-500" />
                        <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                          Grade {grade}
                        </h3>
                        <Badge
                          className="text-[10px] font-normal"
                        >
                          {Array.from(sectionMap.values()).flat().length}{" "}
                          classes
                        </Badge>
                      </div>
                      {/* Sections within grade */}
                      {Array.from(sectionMap.entries()).map(
                        ([section, items]) => (
                          <div
                            key={section}
                            className="ml-2 sm:ml-4 space-y-2"
                          >
                            <div className="flex items-center gap-2 pl-1">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Section {section}
                              </span>
                              <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            {items.map((item) => (
                              <div
                                key={item.classAssignmentId}
                                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white border border-slate-200/80 transition-all cursor-pointer hover:shadow-md"
                                onClick={() =>
                                  handleAttendanceCardClick(
                                    item.sectionId,
                                    item.teacherId,
                                  )
                                }
                              >
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                    item.completed
                                      ? "bg-emerald-100"
                                      : "bg-amber-100",
                                  )}
                                >
                                  {item.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-amber-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm">
                                    {item.teacherName}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {item.totalStudents} students
                                  </p>
                                </div>
                                <Badge
                                  className={cn(
                                    "text-[10px] border whitespace-nowrap",
                                    item.completed
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200",
                                  )}
                                >
                                  {item.completed ? "Done" : "Pending"}
                                </Badge>
                                {item.completed && (
                                  <>
                                    <div className="hidden sm:block w-px h-10 bg-slate-200" />
                                    <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs">
                                      <div className="text-center">
                                        <p className="font-bold text-emerald-600">
                                          {item.present}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                          Present
                                        </p>
                                      </div>
                                      <div className="text-center">
                                        <p className="font-bold text-red-500">
                                          {item.absent}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                          Absent
                                        </p>
                                      </div>
                                      <div className="text-center">
                                        <p className="font-bold text-amber-500">
                                          {item.late}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                          Leave
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ),
                      )}
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Attendance records cannot be deleted or modified.
              </p>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════
              DIARY TAB
          ═══════════════════════════════════════════════════════ */}
          <TabsContent value="diary" className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <StatCard
                icon={<BookCheck className="h-3.5 w-3.5" />}
                label="Inserted"
                value={diaryStats.inserted}
                sub={`of ${diaryStats.total} classes`}
                color="text-emerald-600"
              />
              <StatCard
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Pending"
                value={diaryStats.pending}
                sub="Awaiting teacher input"
                color="text-amber-600"
              />
            </div>

            {/* Filters — Desktop */}
            <div className="hidden sm:flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by grade, section, title, content..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 bg-white border-slate-200 text-sm rounded-xl w-full"
                />
              </div>
              <MiniCalendar
                value={selectedDateBS}
                onChange={(date) => setSelectedDate(date)}
                placeholder="Select date"
                className="w-[180px]"
              />
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-10 bg-white text-sm rounded-xl w-[140px]">
                  <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {uniqueGrades.map((g) => (
                    <SelectItem key={g} value={g}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 bg-white text-sm rounded-xl w-[140px]">
                  <Calendar className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-10 px-3 rounded-xl shrink-0"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Filters — Mobile */}
              <div className="sm:hidden space-y-2">
                {/* Collapsible Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full justify-between rounded-xl h-10 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span>Filters & Search</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="bg-slate-800 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center p-0">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </div>
                  {showMobileFilters ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
                {/* Filter Content */}
                <div className={cn("space-y-2", showMobileFilters ? "block" : "hidden")}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search diaries..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-10 bg-white border-slate-200 text-sm rounded-xl w-full"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                <MiniCalendar
                  value={selectedDateBS}
                  onChange={(date) => setSelectedDate(date)}
                  placeholder="Select date"
                  className="flex-1 min-w-[140px]"
                />
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="h-10 bg-white text-xs rounded-xl flex-1">
                    <GraduationCap className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {uniqueGrades.map((g) => (
                      <SelectItem key={g} value={g}>
                        Grade {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 bg-white text-xs rounded-xl flex-1">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade">Grade</SelectItem>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeFiltersCount > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full h-9 rounded-xl text-xs border-slate-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

                      {/* Diary list — Grouped */}
            {filteredDiary.length === 0 ? (
              <EmptyState
                icon={<PenLine className="h-8 w-8" />}
                title="No diary entries found"
                subtitle="Try adjusting your filters or date"
              />
            ) : (
              <div className="space-y-6">
                {Array.from(groupedDiary.entries()).map(
                  ([grade, sectionMap]) => (
                    <div key={grade} className="space-y-3">
                      {/* Grade heading */}
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-1 rounded-full bg-indigo-500" />
                        <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                          Grade {grade}
                        </h3>
                        <Badge className="text-[10px] font-normal">
                          {Array.from(sectionMap.values()).flat().length}{" "}
                          entries
                        </Badge>
                      </div>
                      {/* Sections within grade */}
                      {Array.from(sectionMap.entries()).map(
                        ([section, items]) => (
                          <div
                            key={section}
                            className="ml-2 sm:ml-4 space-y-2"
                          >
                            <div className="flex items-center gap-2 pl-1">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Section {section}
                              </span>
                              <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            {items.map((diary) => (
                              <div
                                key={diary.id}
                                className="rounded-xl bg-white border border-slate-200/80 overflow-hidden transition-all hover:shadow-sm"
                              >
                                {/* Content area */}
<div className="p-3">
  {diary.status === "inserted" ? (
    <div className="space-y-3">
      {/* Title row with date */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900 leading-snug flex-1 min-w-0">
          {diary.title}
        </h4>
        {diary.diaryDate && (
          <span className="sm:hidden text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mt-0.5">
            {diary.diaryDate}
          </span>
        )}
      </div>
      
      {/* Content with proper line height for readability */}
      <p className="text-sm text-slate-600 leading-relaxed">
        {diary.content}
      </p>

      {/* Bottom row: Author + Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User className="h-3 w-3 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">
              {diary.createdBy}
              {diary.diaryDate && (
                <span className="hidden sm:inline text-slate-400 font-normal">
                  {" "}&bull; {diary.diaryDate}
                </span>
              )}
            </p>
          </div>
        </div>
        {/* Action buttons aligned to the right */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              router.push(`/admin/sections/${diary.id}?tab=diary`);
            }}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditDiary(diary)}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
               handleDeleteClick(diary.diaryId!)
            }
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-800">
              Pending Entry
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Teacher has not submitted the diary for this class yet.
            </p>
          </div>
        </div>
      </div>
      
      {/* Author info for pending */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <User className="h-3 w-3 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">
            {diary.createdBy}
          </p>
          <p className="text-[10px] text-slate-400">
            Assigned teacher
          </p>
        </div>
      </div>
    </div>
  )}
</div>
                              </div>
                            ))}
                          </div>
                        ),
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </TabsContent>


        </Tabs>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setDeletingDiaryId(null);
          }
        }}
        title="Delete Diary Entry?"
        description="This will permanently remove the diary entry. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isPending={deleteDiaryMutation.isPending}
      />

      {/* ─── Edit Diary Dialog ─── */}
      <Dialog
        open={!!editDialogDiary}
        onOpenChange={(open) => !open && setEditDialogDiary(null)}
      >
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Edit Diary Entry
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Update the diary entry for Grade {editDialogDiary?.grade} —
                Section {editDialogDiary?.section}.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter diary title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-10 sm:h-11"
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Content <span className="text-destructive">*</span>
              </label>
              <textarea
                placeholder="Enter diary content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
              />
            </div>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setEditDialogDiary(null)}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={!editTitle.trim() || !editContent.trim() || updateDiaryMutation.isPending}
              onClick={handleSaveDiary}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Pencil className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Reusable Components ───

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all">
      <div
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2",
          color,
        )}
      >
        {icon}
        <span className="text-[10px] sm:text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold">{value}</p>
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
        {sub}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
      <div className="flex justify-center text-slate-300 mb-3">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}