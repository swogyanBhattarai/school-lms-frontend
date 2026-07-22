"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  BookOpen,
  Users,
  GraduationCap,
  School,
  Clock,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  User,
  Phone,
  MapPin,
  PenLine,
  Pencil,
  Save,
  X,
  Loader2,
  Key,
  Copy,
  Shield,
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
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";
import MobileFilterBar from "@/app/_components/ui/MobileFilterBar";
import ClearFiltersButton from "@/app/_components/ui/ClearFiltersButton";
import { useUser } from "@/lib/contexts/UserContext";
import { getClassAssignmentsByTeacherId } from "@/lib/api/classAssignment";
import { getActiveSchoolClasses } from "@/lib/api/schoolClass";
import { getTeacherInfoById, updateTeacher } from "@/lib/api/teacher";
import { getTeacherUser, updateTeacherCredentials } from "@/lib/api/user";
import { MiniCalendar } from "@/app/_components/MiniNepaliCalendarPicker";
import { convertADToBS, getTodayADString } from "@/lib/nepali-calendar";
import type {
  ClassAssignmentAttendanceResponse,
  TeacherInfo,
} from "@/types/lms";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Label } from "@/app/_components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";

export default function TeacherDetailPageClient() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const teacherId = params?.id as string;

  // UI States
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "grade" | "section" | "subject" | "students"
  >("grade");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [isQuickOverviewFilter, setIsQuickOverviewFilter] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");

  // Attendance date filter — defaults to today like section diary page
  const [selectedDate, setSelectedDate] = useState<string>(getTodayADString());
  const selectedDateBS = useMemo(
    () => convertADToBS(new Date(selectedDate)),
    [selectedDate],
  );

  // Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Credentials States
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const parsedTeacherId = parseInt(teacherId);

  const { data: teacherInfo } = useQuery({
    queryKey: ["teacher-info", parsedTeacherId],
    queryFn: () => getTeacherInfoById(parsedTeacherId),
    enabled: !!parsedTeacherId,
  });

  const { data: classAssignments = [] } = useQuery({
    queryKey: [
      "admin-teacher-class-assignments",
      parsedTeacherId,
      selectedDate,
    ],
    queryFn: () =>
      getClassAssignmentsByTeacherId(parsedTeacherId, selectedDate),
    enabled: !!parsedTeacherId,
  });

  const { data: teacherUser } = useQuery({
    queryKey: ["teacher-user", parsedTeacherId],
    queryFn: () => getTeacherUser(parsedTeacherId),
    enabled: !!parsedTeacherId,
  });

  // Initialize edit fields when teacherInfo loads
  useEffect(() => {
    if (teacherInfo) {
      setEditName(teacherInfo.teacherName);
      setEditPhone(teacherInfo.teacherPhoneNumber);
    }
  }, [teacherInfo]);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (payload: {
      teacherName: string;
      teacherPhoneNumber: string;
    }) => updateTeacher(parsedTeacherId, payload),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Teacher information has been saved successfully.",
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({
        queryKey: ["teacher-info", parsedTeacherId],
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(
          error,
          "Failed to update teacher profile.",
        ),
      });
    },
  });

  // Credentials Update Mutation
  const updateCredentialsMutation = useMutation({
    mutationFn: (payload: { username: string; password?: string }) =>
      updateTeacherCredentials(parsedTeacherId, {
        username: payload.username,
        password: payload.password || null,
      }),
    onSuccess: () => {
      toast({
        title: "Credentials Updated",
        description: "Teacher credentials have been updated successfully.",
      });
      setIsEditingCredentials(false);
      setShowCredentialsDialog(false);
      queryClient.invalidateQueries({
        queryKey: ["teacher-info", parsedTeacherId],
      });
      queryClient.invalidateQueries({
        queryKey: ["teacher-user", parsedTeacherId],
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(error, "Failed to update credentials."),
      });
    },
  });

  const getClassName = (assignment: ClassAssignmentAttendanceResponse) =>
    `Class ${assignment.grade}`;

  // Get unique subjects and grades for filters
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(classAssignments.map((a) => a.subjectName));
    return Array.from(subjects).sort();
  }, [classAssignments]);

  const { data: schoolClasses } = useQuery({
    queryKey: ["activeSchoolClasses"],
    queryFn: () => getActiveSchoolClasses(),
  });

  const uniqueGrades = useMemo(() => {
    if (!schoolClasses) return [];
    return schoolClasses
      .map((c) => c.grade)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }, [schoolClasses]);

  // Active filters count — date is active when not today
  const isDateActive = selectedDate !== getTodayADString();
  const activeFiltersCount = [
    subjectFilter !== "all" ? subjectFilter : "",
    gradeFilter !== "all" ? gradeFilter : "",
    sortBy !== "grade" ? sortBy : "",
    isDateActive ? "date" : "",
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
  const totalStudents = teacherInfo?.totalStudents ?? 0;
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
    router.push(
      `/admin/teachers/attendance/${sectionId}?subjectId=${subjectId}&teacherId=${parsedTeacherId}&attendanceDate=${selectedDate}`,
    );
  };

  const handleDiaryClick = (sectionId: number, subjectId: number) => {
    router.push(`/teacher/diary/${sectionId}?subjectId=${subjectId}`);
  };

  const todayLabel = (() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return d.toLocaleDateString("en-NP", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  })();

  const teacherDisplayName = teacherInfo?.teacherName || "Teacher";
  const teacherPhoneNumber = teacherInfo?.teacherPhoneNumber || "";
  const teacherUsername =
    teacherUser?.teacherUsername ||
    teacherInfo?.loginUsername ||
    `teacher_${teacherId}`;

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
    setSelectedDate(getTodayADString());
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 px-1 sm:px-0">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-2 sm:pt-0">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
                Teacher Details
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-7">
              {academicYearLabel} &bull; {todayLabel}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-7 sm:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
              className="h-9 rounded-xl text-xs sm:text-sm"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCredentialsDialog(true)}
              className="h-9 rounded-xl text-xs sm:text-sm"
            >
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Credentials
            </Button>
          </div>
        </div>

        {/* Teacher Profile Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 rounded-2xl sm:rounded-3xl" />
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/60 backdrop-blur-sm overflow-hidden">
            {/* Profile Content */}
            <div className="p-4 sm:p-6">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Edit Profile</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          updateProfileMutation.mutate({
                            teacherName: editName,
                            teacherPhoneNumber: editPhone,
                          });
                        }}
                        disabled={updateProfileMutation.isPending}
                        className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Save className="h-3.5 w-3.5 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditName(teacherInfo?.teacherName || "");
                          setEditPhone(teacherInfo?.teacherPhoneNumber || "");
                        }}
                        className="h-8 rounded-lg text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Teacher name"
                          className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Phone number"
                          className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex flex-col items-center sm:flex-row gap-4 sm:gap-6 sm:items-center flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center ring-4 ring-blue-100">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          {teacherInitials}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-lg sm:text-xl font-bold">
                        {teacherDisplayName}
                      </h2>
                      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        {teacherPhoneNumber && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{teacherPhoneNumber}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 justify-center sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-6">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        Students
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {totalStudents}
                      </p>
                    </div>
                    <div className="w-px h-10 sm:h-12 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        Classes
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-cyan-600">
                        {totalAssignments}
                      </p>
                    </div>
                  </div>
                  {/* Mobile Edit & Credentials */}
                  <div className="sm:hidden flex flex-col items-center gap-2 pt-3 mt-2 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(true)}
                        className="h-9 px-4 rounded-xl text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit Profile
                      </Button>
                      <div className="w-px h-9 bg-slate-200" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCredentialsDialog(true)}
                        className="h-9 px-4 rounded-xl text-xs"
                      >
                        <Key className="h-3.5 w-3.5 mr-1.5" />
                        Credentials
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-600 mb-1.5 sm:mb-2">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">
                Subjects
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {uniqueSubjectsCount}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Unique subjects
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 mb-1.5 sm:mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">
                Completed
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{completedToday}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {selectedDate
                ? "Attendance done on selected date"
                : "Attendance done today"}
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-600 mb-1.5 sm:mb-2">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">
                Pending
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{pendingAttendance}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {selectedDate ? "Not marked for selected date" : "Need attention"}
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-violet-600 mb-1.5 sm:mb-2">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">
                Students
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{totalStudents}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Total enrolled
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          {/* Mobile tab dropdown */}
          <div className="sm:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
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
                className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="diary"
                className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <PenLine className="h-3.5 w-3.5 mr-1.5" />
                Diary
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="attendance" className="space-y-4">
            {/* Quick Overview */}
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-semibold">
                Quick Overview by Subject
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-blue-600" />
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
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {
                          assignments.filter((a) => a.attendanceCompleted)
                            .length
                        }
                        /{assignments.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters & Search — full width matching cards */}
            <div className="hidden sm:flex flex-wrap items-center gap-3">
              {/* Change the search container to flex-1 */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 bg-white border-slate-200 text-sm rounded-xl w-full"
                />
              </div>
              <MiniCalendar
                value={selectedDateBS}
                onChange={(date) => setSelectedDate(date)}
                placeholder="Select date"
                className="w-[160px]"
              />
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-10 bg-white text-sm rounded-xl w-[140px]">
                  <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Grade" />
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
                <SelectTrigger className="h-10 bg-white text-sm rounded-xl w-[140px]">
                  <ArrowUpDown className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                </SelectContent>
              </Select>
              <ClearFiltersButton
                activeFiltersCount={activeFiltersCount}
                onClick={clearFilters}
              />
            </div>
            {/* Mobile filter bar */}
            <MobileFilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search classes..."
              datePicker={
                <MiniCalendar
                  value={selectedDateBS}
                  onChange={(date) => setSelectedDate(date)}
                  placeholder="Select date"
                />
              }
              gradeValue={gradeFilter}
              onGradeChange={setGradeFilter}
              gradeOptions={[
                { value: "all", label: "All" },
                ...uniqueGrades.map((g) => ({ value: g, label: `Grade ${g}` })),
              ]}
              sortValue={sortBy}
              onSortChange={(v) =>
                setSortBy(v as "grade" | "section" | "subject" | "students")
              }
              sortOptions={[
                { value: "grade", label: "Grade" },
                { value: "section", label: "Section" },
                { value: "subject", label: "Subject" },
                { value: "students", label: "Students" },
              ]}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
            />

            {/* Attendance List */}
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No assignments found
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={assignment.classAssignmentId}
                    onClick={() =>
                      handleAssignmentClick(
                        assignment.sectionId,
                        assignment.subjectId,
                      )
                    }
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        assignment.attendanceCompleted
                          ? "bg-emerald-100"
                          : "bg-amber-100",
                      )}
                    >
                      {assignment.attendanceCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {assignment.subjectName}
                      </h4>
                      <div className="flex items-center gap-1 text-xs sm:text-xs text-muted-foreground truncate sm:overflow-visible">
                        <span className="text-[11px] sm:text-xs">
                          {getClassName(assignment)}
                        </span>
                        <span className="text-[10px] sm:text-xs shrink-0">
                          •
                        </span>
                        <span className="text-[11px] sm:text-xs truncate sm:overflow-visible">
                          Section {assignment.sectionName}
                        </span>
                        <span className="text-[10px] sm:text-xs shrink-0">
                          •
                        </span>
                        <span className="text-[11px] sm:text-xs whitespace-nowrap">
                          {assignment.studentCount} students
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        className={cn(
                          "text-[10px] border whitespace-nowrap",
                          assignment.attendanceCompleted
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        {assignment.attendanceCompleted ? "Done" : "Pending"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Attendance records cannot be deleted or modified.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="diary" className="space-y-4">
            {classAssignments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <PenLine className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No diary entries available
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {classAssignments.map((assignment) => (
                  <div
                    key={assignment.classAssignmentId}
                    onClick={() =>
                      handleDiaryClick(
                        assignment.sectionId,
                        assignment.subjectId,
                      )
                    }
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {assignment.subjectName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getClassName(assignment)}</span>
                        <span>•</span>
                        <span>Section {assignment.sectionName}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-indigo-600 font-medium text-xs"
                    >
                      View Diary
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Credentials Dialog */}
        <Dialog
          open={showCredentialsDialog}
          onOpenChange={setShowCredentialsDialog}
        >
          <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Key className="h-4.5 w-4.5 text-blue-600" />
                </div>
                Teacher Credentials
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pl-[2.75rem]">
                Manage login credentials for {teacherDisplayName}
              </DialogDescription>
            </DialogHeader>

            <div className="border-t" />

            {isEditingCredentials ? (
              <div className="px-6 py-5 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Enter username"
                      className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pl-10 h-11 text-sm rounded-xl bg-white border-slate-200"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Username
                        </p>
                        <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                          {teacherUsername}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(teacherUsername, "Username")
                      }
                      className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Key className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Password
                        </p>
                        <p className="text-sm font-mono font-semibold text-foreground mt-0.5 tracking-widest">
                          ••••••••
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      These credentials are used by the teacher to log into
                      their account. Share them securely with the teacher.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t" />

            <div className="px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              {isEditingCredentials ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditingCredentials(false)}
                    className="rounded-xl text-sm font-medium w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editPassword && editPassword !== confirmPassword) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Passwords do not match.",
                        });
                        return;
                      }
                      updateCredentialsMutation.mutate({
                        username: editUsername,
                        ...(editPassword ? { password: editPassword } : {}),
                      });
                    }}
                    disabled={updateCredentialsMutation.isPending}
                    className="rounded-xl text-sm font-medium w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {updateCredentialsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Save className="h-4 w-4 mr-1.5" />
                    )}
                    Save Credentials
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowCredentialsDialog(false)}
                    className="rounded-xl text-sm w-full sm:w-auto"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setEditUsername(teacherUsername);
                      setEditPassword("");
                      setConfirmPassword("");
                      setIsEditingCredentials(true);
                    }}
                    className="rounded-xl text-sm font-medium w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit Credentials
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
