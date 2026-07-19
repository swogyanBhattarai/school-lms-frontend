"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  BookOpen,
  BookMarked,
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  Search,
  GraduationCap,
  UserCircle,
  Calendar,
  Star,

  AlertCircle,
  Phone,
  ArrowUpRight,
  LayoutGrid,
  List,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  X,
  Filter,
  RotateCcw,
} from "lucide-react";
import SectionHeader from "@/app/_components/SectionHeader";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Badge } from "@/app/_components/ui/badge";
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
import { DeleteConfirmationDialog } from "@/app/_components/DeleteConfirmationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/app/_components/ui/sheet";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MiniCalendar } from "@/app/_components/MiniNepaliCalendarPicker";
import { convertADToBS, getTodayADString } from "@/lib/nepali-calendar";
import { getSectionById } from "@/lib/api/section";
import { getAllSubjects } from "@/lib/api/subject";
import { getAllTeachers } from "@/lib/api/teacher";
import {
  bulkCreateAndAssignStudents,
  getBulkUploadResultBySectionId,
} from "@/lib/api/bulkUploadStudent";
import {
  createStudentAndAssignToSection,
  removeStudentFromSection,
  deleteAllStudentsFromSection,
} from "@/lib/api/sectionAssignment";
import api from "@/lib/api";
import type {
  ClassAssignmentResponse,
  SectionResponse,
  SectionAssignmentStudentResponse,
  StudentCreate,
  StudentUpdate,
  TeacherRoles,
  ClassAssignmentCreate,
  ClassAssignmentUpdate,
  SubjectResponse,
  TeacherResponse,
  StudentBulkUploadResponse,
  StudentBulkUploadRowResponse,
  DiaryResponse,
  DiaryCreate,
  DiaryUpdate,
  DiaryUpdateAdmin,
} from "@/types/lms";
import {
  createClassAssignment,
  updateClassAssignment,
  deleteClassAssignment,
} from "@/lib/api/classAssignment";
import {
  createDiary,
  findAllFiltered,
  updateDiary,
  updateDiaryAdmin,
  deleteDiary as deleteDiaryApi,
} from "@/lib/api/diary";

type AssignmentRole = TeacherRoles;

type Tab = "students" | "assignments" | "diary";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "students", label: "Students", icon: Users },
  { id: "assignments", label: "Class Assignments", icon: BookOpen },
  { id: "diary", label: "Daily Diary", icon: BookMarked },
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

export default function SectionDetailPageClient() {
  const router = useRouter();
  const params = useParams<{ sectionId: string }>();
  const { toast } = useToast();
  const bulkUploadInputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "students";
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab === "assignments" || initialTab === "diary" ? initialTab : "students",
  );

  // Support navigating to a specific tab via URL hash (e.g. #assignments)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (hash === "assignments" || hash === "diary") {
      setActiveTab(hash);
    }
  }, []);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Dialog states
  const [addStudentDialog, setAddStudentDialog] = useState(false);
  const [addAssignmentDialog, setAddAssignmentDialog] = useState(false);
  const [addDiaryDialog, setAddDiaryDialog] = useState(false);
  const [editStudentDialog, setEditStudentDialog] =
    useState<SectionAssignmentStudentResponse | null>(null);
  const [editAssignmentDialog, setEditAssignmentDialog] =
    useState<ClassAssignmentResponse | null>(null);
  const [editDiaryDialog, setEditDiaryDialog] = useState<DiaryResponse | null>(
    null,
  );
  const [addDiaryForm, setAddDiaryForm] = useState({
    diaryDate: "",
    subjectId: "",
    teacherId: "",
    title: "",
    content: "",
  });
  const [editDiaryForm, setEditDiaryForm] = useState({
    diaryDate: "",
    subjectId: "",
    teacherId: "",
    title: "",
    content: "",
  });
  const [diaryFilterDate, setDiaryFilterDate] = useState(getTodayADString());
  const [deleteDialog, setDeleteDialog] = useState<{
    type: string;
    id: number;
    name: string;
  } | null>(null);

  // Bulk upload result dialog
  const [bulkUploadResultDialog, setBulkUploadResultDialog] = useState(false);
  const [bulkUploadResultData, setBulkUploadResultData] =
    useState<StudentBulkUploadResponse | null>(null);
  const [bulkUploadResultFilter, setBulkUploadResultFilter] = useState<
    "all" | "success" | "error"
  >("all");

  // Form states
  const [addStudentForm, setAddStudentForm] = useState<StudentCreate>({
    studentName: "",
    dateOfBirth: "",
    parentName1: "",
    parentPhoneNumber1: "",
    parentName2: "",
    parentPhoneNumber2: "",
  });
  const [editStudentForm, setEditStudentForm] = useState<StudentUpdate>({
    studentName: "",
    dateOfBirth: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    teacherId: "",
    subjectId: "",
    teacherRole: "SUBJECT_TEACHER" as AssignmentRole,
  });
  const [editAssignmentForm, setEditAssignmentForm] = useState({
    teacherId: "",
    subjectId: "",
    teacherRole: "SUBJECT_TEACHER" as AssignmentRole,
  });

  const sectionId = Number(params.sectionId);
  const hasValidSectionId = Number.isFinite(sectionId);

  const {
    data: section,
    isLoading,
    isError,
  } = useQuery<SectionResponse>({
    queryKey: ["section", sectionId],
    queryFn: () => getSectionById(sectionId),
    enabled: hasValidSectionId,
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<
    SubjectResponse[]
  >({
    queryKey: ["subjects"],
    queryFn: () => getAllSubjects(),
  });

  const { data: teachers = [], isLoading: teachersLoading } = useQuery<
    TeacherResponse[]
  >({
    queryKey: ["teachers"],
    queryFn: () => getAllTeachers(),
  });

  const queryClient = useQueryClient();

  const createStudentMutation = useMutation({
    mutationFn: (payload: { sectionId: number; student: StudentCreate }) => {
      const studentData = {
        ...payload.student,
        parentName2: payload.student.parentName2?.trim()
          ? payload.student.parentName2
          : null,
        parentPhoneNumber2: payload.student.parentPhoneNumber2?.trim()
          ? payload.student.parentPhoneNumber2
          : null,
      };
      return createStudentAndAssignToSection(
        payload.sectionId,
        studentData as StudentCreate,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      toast({
        title: "Student added",
        description: "Student has been added successfully.",
      });
      setAddStudentDialog(false);
      setAddStudentForm({
        studentName: "",
        dateOfBirth: "",
        parentName1: "",
        parentPhoneNumber1: "",
        parentName2: "",
        parentPhoneNumber2: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add student",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      await bulkCreateAndAssignStudents(sectionId, file);
      return getBulkUploadResultBySectionId(sectionId);
    },
    onSuccess: (result: StudentBulkUploadResponse) => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      toast({
        title: "Bulk upload complete",
        description: `${result.successCount} students imported, ${result.failureCount} failed.`,
      });
      setBulkUploadResultData(result);
      setBulkUploadResultDialog(true);
      if (bulkUploadInputRef.current) {
        bulkUploadInputRef.current.value = "";
      }
    },
    onError: (error) => {
      toast({
        title: "Bulk upload failed",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
      if (bulkUploadInputRef.current) {
        bulkUploadInputRef.current.value = "";
      }
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: (payload: { studentId: number; student: StudentUpdate }) => {
      return api
        .put(`/api/student/${payload.studentId}`, payload.student)
        .then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      toast({
        title: "Updated",
        description: "Student has been updated successfully.",
      });
      setEditStudentDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update student",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (sectionAssignmentId: number) =>
      removeStudentFromSection(sectionAssignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      toast({
        title: "Removed",
        description: "Student has been removed from section.",
      });
      setDeleteDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to remove student",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const deleteAllStudentsMutation = useMutation({
    mutationFn: () => deleteAllStudentsFromSection(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      toast({
        title: "All students removed",
        description:
          "All students have been removed from this section successfully.",
      });
      setDeleteDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to remove students",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (payload: ClassAssignmentCreate) =>
      createClassAssignment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      toast({
        title: "Assignment created",
        description: "Teacher has been assigned successfully.",
      });
      setAddAssignmentDialog(false);
      setAssignmentForm({
        teacherId: "",
        subjectId: "",
        teacherRole: "SUBJECT_TEACHER",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to assign teacher",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: (payload: { id: number; data: ClassAssignmentUpdate }) =>
      updateClassAssignment(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      toast({
        title: "Updated",
        description: "Assignment has been updated successfully.",
      });
      setEditAssignmentDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update assignment",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: number) => deleteClassAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      toast({
        title: "Removed",
        description: "Assignment has been removed.",
      });
      setDeleteDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to remove assignment",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // Diary query
  const diaryDateBS = useMemo(() => {
    return convertADToBS(new Date(diaryFilterDate));
  }, [diaryFilterDate]);

  const { data: diaryPage, isLoading: diaryLoading } = useQuery({
    queryKey: ["diary", sectionId, diaryFilterDate],
    queryFn: () =>
      findAllFiltered({
        sectionId,
        startDate: diaryFilterDate,
        endDate: diaryFilterDate,
        pageSize: 100,
      }),
    enabled: hasValidSectionId,
  });
  const diaryEntries: DiaryResponse[] = diaryPage?.content ?? [];

  // Diary mutations
  const createDiaryMutation = useMutation({
    mutationFn: (payload: DiaryCreate) => createDiary(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary", sectionId] });
      toast({
        title: "Diary entry created",
        description: "Daily diary entry has been added successfully.",
      });
      setAddDiaryDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create diary entry",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const updateDiaryMutation = useMutation({
    mutationFn: (payload: { diaryId: number; data: DiaryUpdateAdmin }) =>
      updateDiaryAdmin(payload.diaryId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary", sectionId] });
      toast({
        title: "Diary entry updated",
        description: "Daily diary entry has been updated successfully.",
      });
      setEditDiaryDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update diary entry",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const deleteDiaryMutation = useMutation({
    mutationFn: (diaryId: number) => deleteDiaryApi(diaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary", sectionId] });
      toast({
        title: "Diary entry deleted",
        description: "Daily diary entry has been removed.",
      });
      setDeleteDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete diary entry",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // Stats
  const studentCount = section?.students.length ?? 0;
  const teacherCount = new Set(
    section?.classAssignments.map((a) => a.teacherId) ?? [],
  ).size;
  const classTeacher = section?.classAssignments.find(
    (a) => a.teacherRole === "CLASS_TEACHER",
  );

  // Filtered data
  const filteredStudents = [...(section?.students ?? [])]
    .filter((s) => s.studentName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      a.studentName.localeCompare(b.studentName, undefined, {
        sensitivity: "base",
      }),
    );
  const filteredAssignments = (section?.classAssignments ?? [])
    .filter(
      (a) =>
        a.teacherName.toLowerCase().includes(search.toLowerCase()) ||
        a.subjectName.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.classAssignmentId - b.classAssignmentId);
  const filteredDiary = diaryEntries.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      d.teacherName.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs = [
    {
      id: "students" as Tab,
      label: "Students",
      icon: Users,
      count: studentCount,
    },
    {
      id: "assignments" as Tab,
      label: "Class Assignments",
      icon: BookOpen,
      count: teacherCount,
    },
    {
      id: "diary" as Tab,
      label: "Daily Diary",
      icon: BookMarked,
      count: diaryEntries.length,
    },
  ];

  const getRoleBadge = (role: AssignmentRole) => {
    switch (role) {
      case "CLASS_TEACHER":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
            <Star className="h-3 w-3" />
            Class Teacher
          </Badge>
        );
      case "SUBJECT_TEACHER":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            Subject Teacher
          </Badge>
        );
    }
  };

  const openEditStudent = (student: SectionAssignmentStudentResponse) => {
    setEditStudentDialog(student);
    setEditStudentForm({
      studentName: student.studentName,
      dateOfBirth: "",
    });
  };

  const openEditAssignment = (assignment: ClassAssignmentResponse) => {
    setEditAssignmentDialog(assignment);
    setEditAssignmentForm({
      teacherId: String(assignment.teacherId),
      subjectId: String(assignment.subjectId),
      teacherRole: assignment.teacherRole,
    });
  };

  const handleViewBulkUploadResults = async () => {
    try {
      const result = await getBulkUploadResultBySectionId(sectionId);
      if (result.rowResults.length === 0) {
        toast({
          title: "No bulk upload data",
          description: "There are no bulk upload results to display.",
        });
        return;
      }
      setBulkUploadResultData(result);
      setBulkUploadResultDialog(true);
    } catch (error) {
      toast({
        title: "Failed to fetch results",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    }
  };

  const filteredBulkUploadResults =
    bulkUploadResultData?.rowResults.filter((row) => {
      if (bulkUploadResultFilter === "all") return true;
      if (bulkUploadResultFilter === "success")
        return row.rowStatus === "SUCCESS";
      if (bulkUploadResultFilter === "error") return row.rowStatus === "ERROR";
      return true;
    }) ?? [];

  if (!hasValidSectionId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Invalid section id.
      </div>
    );
  }

  if (isLoading) return null;

  if (isError || !section) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Unable to load section details.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden px-1 sm:px-0">
      {/* Header */}
      <SectionHeader
        grade={section.grade}
        sectionName={section.sectionName}
        studentCount={studentCount}
        teacherCount={teacherCount}
        onBack={() => router.back()}
      />

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-lg sm:text-xl font-bold">{studentCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Teachers</p>
              <p className="text-lg sm:text-xl font-bold">{teacherCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Class Teacher</p>
              <p className="text-sm font-semibold truncate">
                {classTeacher?.teacherName || "Not assigned"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="flex gap-1 border-b overflow-x-auto no-scrollbar scroll-smooth -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors relative flex items-center gap-1.5 sm:gap-2 flex-shrink-0",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">{tab.label}</span>
            <Badge className="ml-1 text-[10px] h-4.5 px-1.5">{tab.count}</Badge>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              {activeTab === "students" && "Students"}
              {activeTab === "assignments" && "Class Assignments"}
              {activeTab === "diary" && "Daily Diary"}
              <Badge className="hidden sm:inline-flex font-normal text-muted-foreground text-xs">
                {activeTab === "students" &&
                  `${filteredStudents.length}/${studentCount}`}
                {activeTab === "assignments" &&
                  `${filteredAssignments.length}/${teacherCount}`}
                {activeTab === "diary" &&
                  `${filteredDiary.length}/${diaryEntries.length}`}
              </Badge>
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Mobile Search + Filter */}
            <div className="flex items-center gap-2 w-full sm:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl border-slate-200 bg-white text-sm"
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
                    size="icon"
                    className="h-10 w-10 rounded-xl border-slate-200 flex-shrink-0"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[320px] sm:w-[400px] p-0"
                >
                  <div className="px-5 py-4 border-b border-slate-100">
                    <SheetHeader className="text-left space-y-0 p-0">
                      <SheetTitle className="text-lg font-bold text-slate-900">
                        View Options
                      </SheetTitle>
                      <SheetDescription className="text-xs text-slate-500 mt-0.5">
                        Customize your view
                      </SheetDescription>
                    </SheetHeader>
                  </div>
                  <div className="p-5 space-y-4">
                    {activeTab === "diary" && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                          Diary Date
                        </label>
                        <div className="flex flex-col gap-2">
                          <MiniCalendar
                            value={diaryDateBS}
                            onChange={(date) => {
                              setDiaryFilterDate(date);
                              setMobileFilterOpen(false);
                            }}
                            placeholder="Select date"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDiaryFilterDate(getTodayADString());
                              setMobileFilterOpen(false);
                            }}
                            className="w-full gap-1.5 rounded-xl text-xs h-9"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Today
                          </Button>
                        </div>
                      </div>
                    )}
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
                              ? "border-[#185FA5]/30 bg-[#185FA5]/5 text-[#185FA5]"
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
                              ? "border-[#185FA5]/30 bg-[#185FA5]/5 text-[#185FA5]"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50",
                          )}
                        >
                          <List className="h-4 w-4" />
                          List
                        </button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Search */}
            {/* Diary date filter — shown before search when diary tab is active */}
            {activeTab === "diary" && (
              <div className="hidden sm:flex items-center gap-2">
                <MiniCalendar
                  value={diaryDateBS}
                  onChange={setDiaryFilterDate}
                  placeholder="Select date"
                  className="w-[200px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDiaryFilterDate(getTodayADString())}
                  className="shrink-0 gap-1.5 rounded-xl text-xs h-9 px-3"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Today
                </Button>
              </div>
            )}
            <div className="relative hidden sm:block sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Desktop View Toggle */}
            <div className="hidden sm:flex border rounded-lg overflow-hidden bg-background shadow-sm">
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

            {/* Action Buttons */}
            {activeTab === "students" && (
              <div className="hidden sm:flex items-center gap-2">
                {studentCount > 0 && (
                  <Button
                    size="sm"
                    className="h-9 gap-2 px-4 shadow-sm"
                    onClick={() =>
                      setDeleteDialog({
                        type: "All Students",
                        id: sectionId,
                        name: `all ${studentCount} students`,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete All</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-9 gap-2 px-4 shadow-sm"
                  onClick={() => setAddStudentDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Student</span>
                </Button>
              </div>
            )}
            {activeTab === "assignments" && (
              <Button
                size="sm"
                className="hidden sm:flex h-9 gap-2 px-4 shadow-sm"
                onClick={() => setAddAssignmentDialog(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Assign Teacher</span>
              </Button>
            )}
            {activeTab === "diary" && (
              <Button
                size="sm"
                className="hidden sm:flex h-9 gap-2 px-4 shadow-sm"
                onClick={() => setAddDiaryDialog(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Add Entry</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex sm:hidden items-center gap-2 w-full">
          {activeTab === "students" && (
            <>
              {studentCount > 0 && (
                <Button
                  size="sm"
                  className="h-10 flex-1 gap-2 shadow-sm"
                  onClick={() =>
                    setDeleteDialog({
                      type: "All Students",
                      id: sectionId,
                      name: `all ${studentCount} students`,
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
              )}
              <Button
                size="sm"
                className="h-10 flex-1 gap-2 shadow-sm"
                onClick={() => setAddStudentDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </>
          )}
          {activeTab === "assignments" && (
            <Button
              size="sm"
              className="h-10 w-full gap-2 shadow-sm"
              onClick={() => setAddAssignmentDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Assign Teacher
            </Button>
          )}
          {activeTab === "diary" && (
            <Button
              size="sm"
              className="h-10 w-full gap-2 shadow-sm"
              onClick={() => setAddDiaryDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Section - Redesigned Card Grid */}
      {activeTab === "students" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={() => bulkUploadInputRef.current?.click()}
            disabled={bulkUploadMutation.isPending}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all text-left shadow-sm group relative overflow-hidden"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              {bulkUploadMutation.isPending ? (
                <span className="text-xs font-semibold text-blue-600">Uploading...</span>
              ) : (
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm">Upload CSV</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Import students in bulk
              </p>
            </div>
            <input
              ref={bulkUploadInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                bulkUploadMutation.mutate(file);
              }}
            />
          </button>

          <button
            onClick={handleViewBulkUploadResults}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all text-left shadow-sm group relative overflow-hidden"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm">View Results</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Check recent upload status
              </p>
            </div>
          </button>

          <a
            href="/student-import-template.xlsx"
            download
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all text-left shadow-sm group relative overflow-hidden"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Download className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm">
                Download Template
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Get CSV/Excel structure
              </p>
            </div>
          </a>
        </div>
      )}

      {/* Students List */}
      {activeTab === "students" && (
        <>
          {filteredStudents.length === 0 ? (
            <div className="rounded-xl border bg-card py-16 sm:py-20 text-center">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No students found</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStudents.map((student, index) => {
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const initials = student.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={student.studentId}
                    className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
                    onClick={() =>
                      router.push(`/admin/students/${student.studentId}`)
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
                            {student.studentName}
                          </h3>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/students/${student.studentId}`);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({
                              type: "Student - Section Assignment",
                              id: student.sectionAssignmentId,
                              name: student.studentName,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Student
                      </th>
                      <th className="px-3 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map((student, index) => {
                      const avatarColor =
                        AVATAR_COLORS[index % AVATAR_COLORS.length];
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
                                <p className="text-sm font-medium truncate max-w-[150px] sm:max-w-none">
                                  {student.studentName}
                                </p>
                              </div>
                            </div>
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
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialog({
                                      type: "Student - Section Assignment",
                                      id: student.sectionAssignmentId,
                                      name: student.studentName,
                                    });
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
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
        </>
      )}

      {/* Class Assignments List - Card style like teachers page */}
      {activeTab === "assignments" && (
        <>
          {filteredAssignments.length === 0 ? (
            <div className="rounded-xl border bg-card py-16 sm:py-20 text-center">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No assignments found
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAssignments.map((assignment, index) => {
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const initials = assignment.teacherName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={assignment.classAssignmentId}
                    className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  >
                    <div className="p-3 sm:p-5">
                      {/* Top Section */}
                      <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div
                          className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0",
                            assignment.teacherRole === "CLASS_TEACHER"
                              ? "bg-amber-100 text-amber-600"
                              : avatarColor.bg,
                            assignment.teacherRole === "CLASS_TEACHER"
                              ? "text-amber-600"
                              : avatarColor.text,
                          )}
                        >
                          {assignment.teacherRole === "CLASS_TEACHER" ? (
                            <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">
                            {assignment.teacherName}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {assignment.subjectName}
                          </p>
                          <div className="mt-1.5 sm:mt-2">
                            {getRoleBadge(assignment.teacherRole)}
                          </div>
                        </div>
                      </div>
                      {/* Divider */}
                      <div className="border-t mb-3 sm:mb-4" />
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={() =>
                            router.push(
                              `/admin/teachers/${assignment.teacherId}`,
                            )
                          }
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View Teacher
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditAssignment(assignment)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setDeleteDialog({
                                  type: "Teacher - Class Assignment",
                                  id: assignment.classAssignmentId,
                                  name: `${assignment.teacherName} - ${assignment.subjectName}`,
                                })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Teacher
                      </th>
                      <th className="hidden sm:table-cell px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Subject
                      </th>
                      <th className="px-3 sm:px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Role
                      </th>
                      <th className="px-3 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAssignments.map((assignment, index) => {
                      const avatarColor =
                        AVATAR_COLORS[index % AVATAR_COLORS.length];
                      return (
                        <tr
                          key={assignment.classAssignmentId}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 sm:px-5 py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div
                                className={cn(
                                  "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                  assignment.teacherRole === "CLASS_TEACHER"
                                    ? "bg-amber-100 text-amber-600"
                                    : avatarColor.bg,
                                  assignment.teacherRole === "CLASS_TEACHER"
                                    ? "text-amber-600"
                                    : avatarColor.text,
                                )}
                              >
                                {assignment.teacherRole === "CLASS_TEACHER" ? (
                                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                ) : (
                                  assignment.teacherName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                                  {assignment.teacherName}
                                </p>
                                <p className="sm:hidden text-[11px] text-muted-foreground">
                                  {assignment.subjectName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-5 py-3 text-sm text-muted-foreground">
                            {assignment.subjectName}
                          </td>
                          <td className="px-3 sm:px-5 py-3 text-center">
                            {getRoleBadge(assignment.teacherRole)}
                          </td>
                          <td className="px-3 sm:px-5 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/admin/teachers/${assignment.teacherId}`,
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Teacher
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openEditAssignment(assignment)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    setDeleteDialog({
                                      type: "Teacher - Class Assignment",
                                      id: assignment.classAssignmentId,
                                      name: `${assignment.teacherName} - ${assignment.subjectName}`,
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
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
        </>
      )}

      {/* Diary Tab */}
      {activeTab === "diary" && (
        <>
          {filteredDiary.length === 0 ? (
            <div className="rounded-xl border bg-card py-16 sm:py-20 text-center">
              <BookMarked className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No diary entries found
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDiary.map((entry, index) => {
                const SUBJECT_COLORS = [
                  { bg: "bg-blue-50", text: "text-blue-700" },
                  { bg: "bg-violet-50", text: "text-violet-700" },
                  { bg: "bg-teal-50", text: "text-teal-700" },
                  { bg: "bg-amber-50", text: "text-amber-700" },
                  { bg: "bg-emerald-50", text: "text-emerald-700" },
                  { bg: "bg-rose-50", text: "text-rose-700" },
                  { bg: "bg-cyan-50", text: "text-cyan-700" },
                  { bg: "bg-purple-50", text: "text-purple-700" },
                ];
                const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];

                return (
                  <div
                    key={entry.diaryId}
                    className="rounded-xl border bg-card shadow-sm hover:shadow-md hover:border-foreground/15 transition-all flex flex-col h-full"
                  >
                    <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
                      {/* Top: subject pill (primary identifier) + date (secondary, corner) */}
                      <div className="flex items-baseline justify-between gap-2 mb-3">
                        <Badge
                          className={cn(
                            "rounded-full text-[11px] font-medium px-2.5 py-0.5 border-0 shrink-0",
                            color.bg,
                            color.text,
                          )}
                        >
                          {entry.subjectName}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {entry.diaryDate}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold mb-1.5 break-words">
                        {entry.title}
                      </h3>

                      {/* Content — given the most room, since this is what readers scan for */}
                      <p className="text-[13px] text-muted-foreground leading-relaxed mb-3.5 flex-1 break-words">
                        {entry.content}
                      </p>

                      {/* Footer: teacher name (de-emphasized, no avatar) + direct actions */}
                      <div className="flex items-center justify-between border-t pt-2.5 gap-2">
                        <span className="text-xs text-muted-foreground truncate">
                          {entry.teacherName}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label={`Edit ${entry.title}`}
                            onClick={() => {
                              setEditDiaryDialog(entry);
                              setEditDiaryForm({
                                diaryDate: entry.diaryDate,
                                subjectId: String(entry.subjectId),
                                teacherId: String(entry.teacherId),
                                title: entry.title,
                                content: entry.content,
                              });
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label={`Delete ${entry.title}`}
                            onClick={() =>
                              setDeleteDialog({
                                type: "diary",
                                id: entry.diaryId,
                                name: entry.title,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Student Dialog */}
      <Dialog open={addStudentDialog} onOpenChange={setAddStudentDialog}>
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl">
          {/* Header */}
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Add Student
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Enroll a new student in Grade {section.grade} - Section{" "}
                {section.sectionName}.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          {/* Form */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
            {/* Student Information Section */}
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
                    value={addStudentForm.studentName}
                    onChange={(e) =>
                      setAddStudentForm((prev) => ({
                        ...prev,
                        studentName: e.target.value,
                      }))
                    }
                    className="h-10 sm:h-11 pl-10"
                  />
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium">
                  Date of Birth
                  <span className="text-destructive">*</span>
                </label>
                <MiniCalendar
                  value={
                    addStudentForm.dateOfBirth
                      ? (() => {
                          const ad = new Date(addStudentForm.dateOfBirth);
                          const bs = convertADToBS(ad);
                          return bs;
                        })()
                      : undefined
                  }
                  onChange={(isoString) => {
                    setAddStudentForm((prev) => ({
                      ...prev,
                      dateOfBirth: isoString,
                    }));
                  }}
                  placeholder="Select date of birth"
                />
              </div>
            </div>
            {/* Primary Parent Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600" />
                </div>
                <h4 className="text-sm font-semibold">
                  Primary Parent / Guardian
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <div className="relative">
                    <Input
                      placeholder="Parent name"
                      value={addStudentForm.parentName1}
                      onChange={(e) =>
                        setAddStudentForm((prev) => ({
                          ...prev,
                          parentName1: e.target.value,
                        }))
                      }
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
                      value={addStudentForm.parentPhoneNumber1}
                      onChange={(e) =>
                        setAddStudentForm((prev) => ({
                          ...prev,
                          parentPhoneNumber1: e.target.value,
                        }))
                      }
                      className="h-10 sm:h-11 pl-10"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
            {/* Secondary Parent Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-semibold">
                  Secondary Parent / Guardian
                </h4>
                <Badge className="text-[10px]">Optional</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <div className="relative">
                    <Input
                      placeholder="Parent name"
                      value={addStudentForm.parentName2}
                      onChange={(e) =>
                        setAddStudentForm((prev) => ({
                          ...prev,
                          parentName2: e.target.value,
                        }))
                      }
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
                      value={addStudentForm.parentPhoneNumber2}
                      onChange={(e) =>
                        setAddStudentForm((prev) => ({
                          ...prev,
                          parentPhoneNumber2: e.target.value,
                        }))
                      }
                      className="h-10 sm:h-11 pl-10"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
            {/* Preview Card */}
            {addStudentForm.studentName.trim() && (
              <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-2 sm:space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Student Preview
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-blue-600">
                      {addStudentForm.studentName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {addStudentForm.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Grade {section.grade} • Section {section.sectionName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                  {addStudentForm.parentName1 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="truncate">
                        {addStudentForm.parentName1}
                      </span>
                    </div>
                  )}
                  {addStudentForm.parentPhoneNumber1 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{addStudentForm.parentPhoneNumber1}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="border-t" />
          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setAddStudentDialog(false);
                setAddStudentForm({
                  studentName: "",
                  dateOfBirth: "",
                  parentName1: "",
                  parentPhoneNumber1: "",
                  parentName2: "",
                  parentPhoneNumber2: "",
                });
              }}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={createStudentMutation.isPending || !section?.sectionId}
              onClick={() => {
                if (!section?.sectionId) {
                  toast({
                    title: "Section is required",
                    variant: "destructive",
                  });
                  return;
                }
                if (!addStudentForm.studentName.trim()) {
                  toast({
                    title: "Student name is required",
                    description: "Please enter the student's full name.",
                    variant: "destructive",
                  });
                  return;
                }
                createStudentMutation.mutate({
                  sectionId: section.sectionId,
                  student: addStudentForm,
                });
              }}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              {createStudentMutation.isPending ? (
                <>
                  Adding Student...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Student
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog
        open={!!editStudentDialog}
        onOpenChange={(open) => !open && setEditStudentDialog(null)}
      >
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl">
          {/* Header */}
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Edit Student
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Update the details for this student in Grade {section.grade} -
                Section {section.sectionName}.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          {/* Form */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
            {/* Student Information Section */}
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
                    value={editStudentForm.studentName}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({
                        ...prev,
                        studentName: e.target.value,
                      }))
                    }
                    className="h-10 sm:h-11 pl-10"
                  />
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1 text-sm font-medium">
                  Date of Birth
                  <span className="text-destructive">*</span>
                </label>
                <MiniCalendar
                  value={
                    editStudentForm.dateOfBirth
                      ? (() => {
                          const ad = new Date(editStudentForm.dateOfBirth);
                          const bs = convertADToBS(ad);
                          return bs;
                        })()
                      : undefined
                  }
                  onChange={(isoString) => {
                    setEditStudentForm((prev) => ({
                      ...prev,
                      dateOfBirth: isoString,
                    }));
                  }}
                  placeholder="Select date of birth"
                />
              </div>
            </div>

            {/* Current Student Info */}
            {editStudentDialog && (
              <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-2 sm:space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Current Details
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-blue-600">
                      {editStudentDialog.studentName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {editStudentDialog.studentName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t" />
          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setEditStudentDialog(null)}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={updateStudentMutation.isPending}
              onClick={() => {
                if (!editStudentDialog) return;
                if (!editStudentForm.studentName.trim()) {
                  toast({
                    title: "Student name is required",
                    description: "Please enter the student's full name.",
                    variant: "destructive",
                  });
                  return;
                }
                updateStudentMutation.mutate({
                  studentId: editStudentDialog.studentId,
                  student: editStudentForm,
                });
              }}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              {updateStudentMutation.isPending ? (
                <>
                  
                  Saving Changes...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Assignment Dialog */}
      <Dialog open={addAssignmentDialog} onOpenChange={setAddAssignmentDialog}>
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl">
          {/* Header */}
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Assign Teacher
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Assign a teacher to Grade {section.grade} - Section{" "}
                {section.sectionName} with a subject and role.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          {/* Form */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            {/* Teacher Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Teacher
                <span className="text-destructive">*</span>
              </label>
              <Select
                value={assignmentForm.teacherId}
                onValueChange={(v) =>
                  setAssignmentForm((f) => ({ ...f, teacherId: v }))
                }
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a teacher" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {teachersLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Loading teachers...
                    </div>
                  ) : teachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>No teachers available</span>
                      <span className="text-xs">
                        Add teachers first to assign them here.
                      </span>
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <SelectItem
                        key={teacher.teacherId}
                        value={String(teacher.teacherId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-violet-600">
                              {teacher.teacherName.charAt(0)}
                            </span>
                          </div>
                          {teacher.teacherName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Subject Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Subject
                <span className="text-destructive">*</span>
              </label>
              <Select
                value={assignmentForm.subjectId}
                onValueChange={(v) =>
                  setAssignmentForm((f) => ({ ...f, subjectId: v }))
                }
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a subject" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {subjectsLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Loading subjects...
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>No subjects available</span>
                      <span className="text-xs">
                        Add subjects first to assign them here.
                      </span>
                    </div>
                  ) : (
                    subjects.map((subject) => (
                      <SelectItem
                        key={subject.subjectId}
                        value={String(subject.subjectId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-600">
                              {subject.subjectName.charAt(0)}
                            </span>
                          </div>
                          {subject.subjectName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    value: "CLASS_TEACHER" as const,
                    label: "Class Teacher",
                    icon: Star,
                    color: "amber",
                  },
                  {
                    value: "SUBJECT_TEACHER" as const,
                    label: "Subject Teacher",
                    icon: BookOpen,
                    color: "blue",
                  },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() =>
                      setAssignmentForm((f) => ({
                        ...f,
                        teacherRole: role.value,
                      }))
                    }
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-medium transition-all",
                      assignmentForm.teacherRole === role.value
                        ? role.color === "amber"
                          ? "border-amber-300 bg-amber-50 text-amber-700 shadow-sm"
                          : role.color === "blue"
                            ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-purple-300 bg-purple-50 text-purple-700 shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50",
                    )}
                  >
                    <role.icon className="h-4 w-4" />
                    <span className="text-center leading-tight">
                      {role.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Summary Preview */}
            {assignmentForm.teacherId && assignmentForm.subjectId && (
              <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assignment Preview
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      assignmentForm.teacherRole === "CLASS_TEACHER"
                        ? "bg-amber-100"
                        : "bg-violet-100",
                    )}
                  >
                    <GraduationCap
                      className={cn(
                        "h-4 w-4",
                        assignmentForm.teacherRole === "CLASS_TEACHER"
                          ? "text-amber-600"
                          : "text-violet-600",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {teachers.find(
                        (t) => String(t.teacherId) === assignmentForm.teacherId,
                      )?.teacherName || "Teacher"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subjects.find(
                        (s) => String(s.subjectId) === assignmentForm.subjectId,
                      )?.subjectName || "Subject"}
                      <span className="mx-1.5">•</span>
                      {assignmentForm.teacherRole === "CLASS_TEACHER"
                        ? "Class Teacher"
                        : "Subject Teacher"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t" />
          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setAddAssignmentDialog(false);
                setAssignmentForm({
                  teacherId: "",
                  subjectId: "",
                  teacherRole: "SUBJECT_TEACHER",
                });
              }}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={
                createAssignmentMutation.isPending ||
                !assignmentForm.teacherId ||
                !assignmentForm.subjectId
              }
              onClick={() => {
                if (!assignmentForm.teacherId) {
                  toast({
                    title: "Teacher is required",
                    variant: "destructive",
                  });
                  return;
                }
                if (!assignmentForm.subjectId) {
                  toast({
                    title: "Subject is required",
                    variant: "destructive",
                  });
                  return;
                }
                createAssignmentMutation.mutate({
                  teacherId: Number(assignmentForm.teacherId),
                  teacherRole: assignmentForm.teacherRole,
                  subjectId: Number(assignmentForm.subjectId),
                  sectionId: sectionId,
                });
              }}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              {createAssignmentMutation.isPending ? (
                <>
                  
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Assign Teacher
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog
        open={!!editAssignmentDialog}
        onOpenChange={(open) => !open && setEditAssignmentDialog(null)}
      >
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl">
          {/* Header */}
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Edit Assignment
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Update the teacher assignment details for Grade {section.grade}{" "}
                - Section {section.sectionName}.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          {/* Form */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            {/* Teacher Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Teacher
                <span className="text-destructive">*</span>
              </label>
              <Select
                value={editAssignmentForm.teacherId}
                onValueChange={(v) =>
                  setEditAssignmentForm((f) => ({ ...f, teacherId: v }))
                }
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a teacher" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {teachersLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Loading teachers...
                    </div>
                  ) : teachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>No teachers available</span>
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <SelectItem
                        key={teacher.teacherId}
                        value={String(teacher.teacherId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-violet-600">
                              {teacher.teacherName.charAt(0)}
                            </span>
                          </div>
                          {teacher.teacherName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Subject Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Subject
                <span className="text-destructive">*</span>
              </label>
              <Select
                value={editAssignmentForm.subjectId}
                onValueChange={(v) =>
                  setEditAssignmentForm((f) => ({ ...f, subjectId: v }))
                }
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a subject" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {subjectsLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Loading subjects...
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>No subjects available</span>
                    </div>
                  ) : (
                    subjects.map((subject) => (
                      <SelectItem
                        key={subject.subjectId}
                        value={String(subject.subjectId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-600">
                              {subject.subjectName.charAt(0)}
                            </span>
                          </div>
                          {subject.subjectName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    value: "CLASS_TEACHER" as const,
                    label: "Class Teacher",
                    icon: Star,
                    color: "amber",
                  },
                  {
                    value: "SUBJECT_TEACHER" as const,
                    label: "Subject Teacher",
                    icon: BookOpen,
                    color: "blue",
                  },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() =>
                      setEditAssignmentForm((f) => ({
                        ...f,
                        teacherRole: role.value,
                      }))
                    }
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-medium transition-all",
                      editAssignmentForm.teacherRole === role.value
                        ? role.color === "amber"
                          ? "border-amber-300 bg-amber-50 text-amber-700 shadow-sm"
                          : role.color === "blue"
                            ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-purple-300 bg-purple-50 text-purple-700 shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50",
                    )}
                  >
                    <role.icon className="h-4 w-4" />
                    <span className="text-center leading-tight">
                      {role.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Current Assignment Info */}
            {editAssignmentDialog && (
              <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Current Assignment
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      editAssignmentForm.teacherRole === "CLASS_TEACHER"
                        ? "bg-amber-100"
                        : "bg-violet-100",
                    )}
                  >
                    <GraduationCap
                      className={cn(
                        "h-4 w-4",
                        editAssignmentForm.teacherRole === "CLASS_TEACHER"
                          ? "text-amber-600"
                          : "text-violet-600",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {editAssignmentDialog.teacherName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {editAssignmentDialog.subjectName}
                      <span className="mx-1.5">•</span>
                      {editAssignmentForm.teacherRole === "CLASS_TEACHER"
                        ? "Class Teacher"
                        : "Subject Teacher"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t" />
          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setEditAssignmentDialog(null)}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={
                updateAssignmentMutation.isPending || !editAssignmentDialog
              }
              onClick={() => {
                if (!editAssignmentDialog) return;
                if (!editAssignmentForm.teacherId) {
                  toast({
                    title: "Teacher is required",
                    variant: "destructive",
                  });
                  return;
                }
                if (!editAssignmentForm.subjectId) {
                  toast({
                    title: "Subject is required",
                    variant: "destructive",
                  });
                  return;
                }
                updateAssignmentMutation.mutate({
                  id: editAssignmentDialog.classAssignmentId,
                  data: {
                    teacherId: Number(editAssignmentForm.teacherId),
                    teacherRole: editAssignmentForm.teacherRole,
                    subjectId: Number(editAssignmentForm.subjectId),
                    sectionId: sectionId,
                  },
                });
              }}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              {updateAssignmentMutation.isPending ? (
                <>
                  
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Results Dialog */}
      <Dialog
        open={bulkUploadResultDialog}
        onOpenChange={setBulkUploadResultDialog}
      >
        <DialogContent className="sm:max-w-5xl w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border mx-auto rounded-2xl">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-semibold">
                    Bulk Upload Results
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                    Grade {section.grade} • Section {section.sectionName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Summary + Filters - Sticky */}
          <div className="px-4 sm:px-6 pb-3 sm:pb-4 flex-shrink-0 space-y-3 sm:space-y-4">
            {/* Summary Cards */}
            {bulkUploadResultData && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-lg border bg-muted/30 p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Total Rows
                  </p>
                  <p className="text-base sm:text-lg font-bold">
                    {bulkUploadResultData.rowResults.length}
                  </p>
                </div>
                <div className="rounded-lg border bg-emerald-50/50 p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                    <p className="text-[10px] sm:text-xs text-emerald-700 font-medium">
                      Successful
                    </p>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-emerald-700">
                    {bulkUploadResultData.successCount}
                  </p>
                </div>
                <div className="rounded-lg border bg-red-50/50 p-2 sm:p-3">
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                    <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600" />
                    <p className="text-[10px] sm:text-xs text-red-700 font-medium">
                      Failed
                    </p>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-red-700">
                    {bulkUploadResultData.failureCount}
                  </p>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5 sm:gap-1 bg-muted rounded-lg p-0.5">
                {[
                  {
                    value: "all" as const,
                    label: "All",
                    count: bulkUploadResultData?.rowResults.length ?? 0,
                  },
                  {
                    value: "success" as const,
                    label: "Successful",
                    count: bulkUploadResultData?.successCount ?? 0,
                  },
                  {
                    value: "error" as const,
                    label: "Failed",
                    count: bulkUploadResultData?.failureCount ?? 0,
                  },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setBulkUploadResultFilter(filter.value)}
                    className={cn(
                      "px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors flex items-center gap-1 sm:gap-1.5",
                      bulkUploadResultFilter === filter.value
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {filter.label}
                    <span
                      className={cn(
                        "inline-flex items-center justify-center min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] rounded-full text-[9px] sm:text-[10px] font-medium px-1",
                        bulkUploadResultFilter === filter.value
                          ? "bg-muted text-muted-foreground"
                          : "bg-background/50 text-muted-foreground",
                      )}
                    >
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Showing {filteredBulkUploadResults.length} of{" "}
                {bulkUploadResultData?.rowResults.length ?? 0} records
              </p>
            </div>
          </div>

          {/* Results Table */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              {filteredBulkUploadResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center mb-2 sm:mb-3">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-medium">No records found</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try changing your filter to see more results.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-muted-foreground w-10 sm:w-12">
                            #
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-muted-foreground">
                            Student
                          </th>
                          <th className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-muted-foreground">
                            Parents
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-muted-foreground w-20 sm:w-24">
                            Status
                          </th>
                          <th className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-muted-foreground">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredBulkUploadResults.map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={cn(
                              row.rowStatus === "ERROR" && "bg-red-50/30",
                            )}
                          >
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-muted-foreground font-mono">
                              {row.rowNumber}
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center gap-2 sm:gap-2.5">
                                <div
                                  className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium flex-shrink-0",
                                    row.rowStatus === "ERROR"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-emerald-100 text-emerald-700",
                                  )}
                                >
                                  {(row.studentName || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium truncate">
                                    {row.studentName || "—"}
                                  </p>
                                  {row.dateOfBirth && (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                      DOB: {row.dateOfBirth}
                                    </p>
                                  )}
                                  {/* Mobile error */}
                                  {row.rowStatus === "ERROR" &&
                                    row.errorMessage && (
                                      <p className="sm:hidden text-[10px] text-red-600 mt-0.5 line-clamp-1">
                                        {row.errorMessage}
                                      </p>
                                    )}
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3">
                              <div className="space-y-1 sm:space-y-1.5">
                                <div>
                                  <p className="text-xs sm:text-sm">
                                    {row.parentName1 || "—"}
                                  </p>
                                  {row.parentPhoneNumber1 && (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                      {row.parentPhoneNumber1}
                                    </p>
                                  )}
                                </div>
                                {(row.parentName2 ||
                                  row.parentPhoneNumber2) && (
                                  <div>
                                    <p className="text-xs sm:text-sm">
                                      {row.parentName2 || "—"}
                                    </p>
                                    {row.parentPhoneNumber2 && (
                                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                                        {row.parentPhoneNumber2}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-center">
                              {row.rowStatus === "SUCCESS" ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-normal text-[10px] sm:text-xs">
                                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                  Success
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 border-red-200 font-normal text-[10px] sm:text-xs">
                                  <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-4 py-2 sm:py-3">
                              {row.errorMessage ? (
                                <div className="flex items-start gap-1 sm:gap-1.5">
                                  <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs text-red-600 leading-relaxed">
                                    {row.errorMessage}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] sm:text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-background flex justify-end flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkUploadResultDialog(false)}
              className="text-xs sm:text-sm"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Diary Dialog */}
      <Dialog
        open={addDiaryDialog}
        onOpenChange={(open) => {
          if (!open) {
            setAddDiaryDialog(false);
            setAddDiaryForm({
              diaryDate: "",
              subjectId: "",
              teacherId: "",
              title: "",
              content: "",
            });
          } else {
            setAddDiaryDialog(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Add Diary Entry
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Create a new daily diary entry for Grade {section.grade} -
                Section {section.sectionName}.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            {/* Date */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Date <span className="text-destructive">*</span>
              </label>
              <MiniCalendar
                value={
                  addDiaryForm.diaryDate
                    ? convertADToBS(new Date(addDiaryForm.diaryDate))
                    : undefined
                }
                onChange={(isoString) =>
                  setAddDiaryForm((f) => ({ ...f, diaryDate: isoString }))
                }
                placeholder="Select diary date"
              />
            </div>
            {/* Title */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter diary title"
                value={addDiaryForm.title}
                onChange={(e) =>
                  setAddDiaryForm((f) => ({ ...f, title: e.target.value }))
                }
                className="h-10 sm:h-11"
                maxLength={255}
              />
            </div>
            {/* Content */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Content <span className="text-destructive">*</span>
              </label>
              <textarea
                placeholder="Enter diary content"
                value={addDiaryForm.content}
                onChange={(e) =>
                  setAddDiaryForm((f) => ({ ...f, content: e.target.value }))
                }
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
              />
            </div>
            {/* Subject */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Subject <span className="text-destructive">*</span>
              </label>
              <Select
                value={addDiaryForm.subjectId}
                onValueChange={(v) =>
                  setAddDiaryForm((f) => ({ ...f, subjectId: v }))
                }
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a subject" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {subjectsLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Loading subjects...
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>No subjects available</span>
                    </div>
                  ) : (
                    subjects.map((subject) => (
                      <SelectItem
                        key={subject.subjectId}
                        value={String(subject.subjectId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-600">
                              {subject.subjectName.charAt(0)}
                            </span>
                          </div>
                          {subject.subjectName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Teacher */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Teacher <span className="text-destructive">*</span>
              </label>
              <Select
                value={addDiaryForm.teacherId}
                onValueChange={(v) =>
                  setAddDiaryForm((f) => ({ ...f, teacherId: v }))
                }
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a teacher" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {teachersLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Loading teachers...
                    </div>
                  ) : teachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>No teachers available</span>
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <SelectItem
                        key={teacher.teacherId}
                        value={String(teacher.teacherId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-violet-600">
                              {teacher.teacherName.charAt(0)}
                            </span>
                          </div>
                          {teacher.teacherName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setAddDiaryDialog(false);
                setAddDiaryForm({
                  diaryDate: "",
                  subjectId: "",
                  teacherId: "",
                  title: "",
                  content: "",
                });
              }}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={
                createDiaryMutation.isPending ||
                !addDiaryForm.diaryDate ||
                !addDiaryForm.title ||
                !addDiaryForm.content ||
                !addDiaryForm.subjectId ||
                !addDiaryForm.teacherId
              }
              onClick={() => {
                if (!addDiaryForm.diaryDate) {
                  toast({ title: "Date is required", variant: "destructive" });
                  return;
                }
                if (!addDiaryForm.title.trim()) {
                  toast({ title: "Title is required", variant: "destructive" });
                  return;
                }
                if (!addDiaryForm.content.trim()) {
                  toast({
                    title: "Content is required",
                    variant: "destructive",
                  });
                  return;
                }
                if (!addDiaryForm.subjectId) {
                  toast({
                    title: "Subject is required",
                    variant: "destructive",
                  });
                  return;
                }
                if (!addDiaryForm.teacherId) {
                  toast({
                    title: "Teacher is required",
                    variant: "destructive",
                  });
                  return;
                }
                createDiaryMutation.mutate({
                  diaryDate: addDiaryForm.diaryDate,
                  title: addDiaryForm.title,
                  content: addDiaryForm.content,
                  subjectId: Number(addDiaryForm.subjectId),
                  teacherId: Number(addDiaryForm.teacherId),
                  sectionId: sectionId,
                });
              }}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              {createDiaryMutation.isPending ? (
                <>
                  
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Entry
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Diary Dialog */}
      <Dialog
        open={!!editDiaryDialog}
        onOpenChange={(open) => !open && setEditDiaryDialog(null)}
      >
        <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 mx-auto max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Edit Diary Entry
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                Update the daily diary entry for Grade {section.grade} - Section{" "}
                {section.sectionName}.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            {/* Date */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Date
              </label>
              <MiniCalendar
                value={
                  editDiaryForm.diaryDate
                    ? convertADToBS(new Date(editDiaryForm.diaryDate))
                    : undefined
                }
                onChange={(isoString) =>
                  setEditDiaryForm((f) => ({ ...f, diaryDate: isoString }))
                }
                placeholder="Select diary date"
              />
            </div>
            {/* Subject */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Subject
              </label>
              <Select
                value={editDiaryForm.subjectId}
                onValueChange={(v) =>
                  setEditDiaryForm((f) => ({ ...f, subjectId: v }))
                }
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a subject" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {subjectsLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Loading subjects...
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>No subjects available</span>
                    </div>
                  ) : (
                    subjects.map((subject) => (
                      <SelectItem
                        key={subject.subjectId}
                        value={String(subject.subjectId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-600">
                              {subject.subjectName.charAt(0)}
                            </span>
                          </div>
                          {subject.subjectName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Teacher */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Teacher
              </label>
              <Select
                value={editDiaryForm.teacherId}
                onValueChange={(v) =>
                  setEditDiaryForm((f) => ({ ...f, teacherId: v }))
                }
              >
                <SelectTrigger className="h-10 sm:h-11">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a teacher" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {teachersLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Loading teachers...
                    </div>
                  ) : teachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>No teachers available</span>
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <SelectItem
                        key={teacher.teacherId}
                        value={String(teacher.teacherId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-violet-600">
                              {teacher.teacherName.charAt(0)}
                            </span>
                          </div>
                          {teacher.teacherName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Title */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter diary title"
                value={editDiaryForm.title}
                onChange={(e) =>
                  setEditDiaryForm((f) => ({ ...f, title: e.target.value }))
                }
                className="h-10 sm:h-11"
                maxLength={255}
              />
            </div>
            {/* Content */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Content <span className="text-destructive">*</span>
              </label>
              <textarea
                placeholder="Enter diary content"
                value={editDiaryForm.content}
                onChange={(e) =>
                  setEditDiaryForm((f) => ({ ...f, content: e.target.value }))
                }
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
              />
            </div>
          </div>
          <div className="border-t" />
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setEditDiaryDialog(null)}
              className="text-sm font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={
                updateDiaryMutation.isPending ||
                !editDiaryForm.title.trim() ||
                !editDiaryForm.content.trim()
              }
              onClick={() => {
                if (!editDiaryDialog) return;
                if (!editDiaryForm.title.trim()) {
                  toast({ title: "Title is required", variant: "destructive" });
                  return;
                }
                if (!editDiaryForm.content.trim()) {
                  toast({
                    title: "Content is required",
                    variant: "destructive",
                  });
                  return;
                }
                updateDiaryMutation.mutate({
                  diaryId: editDiaryDialog.diaryId,
                  data: {
                    diaryDate: editDiaryForm.diaryDate || undefined,
                    subjectId: editDiaryForm.subjectId
                      ? Number(editDiaryForm.subjectId)
                      : undefined,
                    teacherId: editDiaryForm.teacherId
                      ? Number(editDiaryForm.teacherId)
                      : undefined,
                    title: editDiaryForm.title,
                    content: editDiaryForm.content,
                  },
                });
              }}
              className="gap-2 text-sm font-medium w-full sm:w-auto"
            >
              {updateDiaryMutation.isPending ? (
                <>
                  
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        title={`Remove ${deleteDialog?.type || ""}?`}
        description={
          <>
            This will permanently remove <strong>{deleteDialog?.name}</strong>{" "}
            from this section. This action cannot be undone.
          </>
        }
        confirmLabel={deleteDialog?.type === "All Students" ? "Remove All" : "Remove"}
        onConfirm={() => {
          if (deleteDialog?.type === "All Students") {
            deleteAllStudentsMutation.mutate();
            return;
          }
          if (deleteDialog?.type?.startsWith("Student")) {
            deleteStudentMutation.mutate(deleteDialog.id);
            return;
          }
          if (
            deleteDialog?.type === "assignment" ||
            deleteDialog?.type?.startsWith("Teacher")
          ) {
            deleteAssignmentMutation.mutate(deleteDialog.id);
            return;
          }
          if (deleteDialog?.type === "diary") {
            deleteDiaryMutation.mutate(deleteDialog.id);
            return;
          }
          setDeleteDialog(null);
        }}
        isPending={
          deleteStudentMutation.isPending ||
          deleteAssignmentMutation.isPending ||
          deleteAllStudentsMutation.isPending ||
          deleteDiaryMutation.isPending
        }
      />
    </div>
  );
}
