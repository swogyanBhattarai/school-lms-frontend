"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  BookOpen,
  User,
  Mail,
  GraduationCap,
  Users,
  CheckCircle2,
  FileText,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  Settings,
  UserPlus,
  Phone,
  Eye,
  CreditCard,
  Wallet,
  CalendarClock,
  AlertTriangle,
  History,
  BookMarked,
  RotateCcw,
  Search,
  LayoutGrid,
  List,
  MapPin,
  Copy,
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
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import { cn } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AnimatedPieChart from "@/app/_components/AnimatedPieChart";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStudentById,
  updateStudent as apiUpdateStudent,
} from "@/lib/api/student";
import {
  getStudentAttendanceSummary,
  getStudentDailyAttendance,
} from "@/lib/api/attendance";
import { getClassAssignmentsBySection } from "@/lib/api/classAssignment";
import {
  getAllStudentFeesFiltered,
  createStudentFee as apiCreateStudentFee,
  createFeePayment as apiCreateFeePayment,
  updateStudentFee as apiUpdateStudentFee,
  updateFeePayment as apiUpdateFeePayment,
  deleteStudentFee as apiDeleteStudentFee,
  deleteFeePayment as apiDeleteFeePayment,
} from "@/lib/api/studentFee";
import { studentFeeKeys } from "@/lib/api/hooks/studentFee";
import { academicYearKeys } from "@/lib/api/hooks/academicYear";
import { getAcademicYears } from "@/lib/api/academicYear";
import { getApiErrorMessage } from "@/lib/utils";
import { toast } from "@/app/_components/ui/use-toast";
import type {
  ClassAssignmentResponse,
  StudentFeeResponse,
  FeePaymentResponse,
  FeePaymentCreate,
  StudentFeeCreate,
  StudentUpdate,
  ParentCreate,
  ParentUpdate,
  FeeStatus,
  FeeTypes,
  PaymentType,
  DiaryResponse,
} from "@/types/lms";
import {
  addParentToStudent,
  updateParentOfStudent,
  removeParentFromStudent,
} from "@/lib/api/parent";
import { findAllFiltered } from "@/lib/api/diary";
import { MiniCalendar } from "@/app/_components/MiniNepaliCalendarPicker";
import { MonthYearNavigator } from "@/app/_components/YearMonthNavigator";
import {
  convertADToBS,
  getTodayADString,
  formatBSDate,
  getTodayBS,
  getBSMonthDays,
  convertBSToAD,
} from "@/lib/nepali-calendar";

interface ParentInfo {
  parentId?: number | null;
  parentName: string;
  parentNumber: string;
  parentEmail?: string;
  relation?: string;
}

type TabType =
  | "overview"
  | "parents"
  | "academic"
  | "attendance"
  | "documents"
  | "fees";

function AttendanceStatusBadge({ status }: { status: string | undefined }) {
  if (!status)
    return (
      <Badge className="text-[9px] uppercase font-bold text-slate-400 border-slate-200 px-2 py-0.5 bg-slate-50">
        Not Taken
      </Badge>
    );

  const config = {
    PRESENT: {
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      label: "Present",
    },
    ABSENT: {
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "Absent",
    },
    LEAVE: {
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      label: "Leave",
    },
  }[status] || {
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    label: status,
  };

  return (
    <Badge
      className={cn(
        "text-[9px] uppercase font-bold border px-2 py-0.5",
        config.bg,
        config.border,
        config.color,
      )}
    >
      {config.label}
    </Badge>
  );
}

function FeeStatusBadge({ status }: { status: FeeStatus }) {
  const config = {
    UNPAID: {
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      label: "Unpaid",
    },
    PARTIAL: {
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "Partial",
    },
    PAID: {
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      label: "Paid",
    },
    OVERDUE: {
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "Overdue",
    },
  }[status];

  return (
    <Badge
      className={cn(
        "border font-bold text-[9px] sm:text-[10px]",
        config.bg,
        config.border,
        config.color,
      )}
    >
      {config.label}
    </Badge>
  );
}

function FeeTypeBadge({ type }: { type: FeeTypes }) {
  const config = {
    ADMISSION_FEE: {
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
      label: "Admission",
    },
    MONTHLY_FEE: {
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "Monthly",
    },
    ANNUAL_FEE: {
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      label: "Annual",
    },
    EXTRACURRICULAR_FEE: {
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-200",
      label: "Extra",
    },
    EXAMINATION_FEE: {
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      label: "Examination",
    },
  }[type];

  return (
    <Badge
      className={cn(
        "border font-bold text-[9px] sm:text-[10px]",
        config.bg,
        config.border,
        config.color,
      )}
    >
      {config.label}
    </Badge>
  );
}

function NepaliRupee({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="22"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="currentColor"
        stroke="none"
      >
        रु
      </text>
    </svg>
  );
}

function PaymentTypeBadge({ type }: { type: PaymentType }) {
  const config = {
    CASH: {
      icon: NepaliRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      label: "Cash",
    },
    CHEQUE: {
      icon: CreditCard,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
      label: "Cheque",
    },
    ESEWA: {
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "eSewa",
    },
    KHALTI: {
      icon: Wallet,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      label: "Khalti",
    },
    BANK_TRANSFER: {
      icon: CreditCard,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      label: "Bank Transfer",
    },
  }[type];

  const Icon = config.icon;
  return (
    <Badge
      className={cn(
        "border font-medium text-[9px] sm:text-[10px] flex items-center gap-1",
        config.bg,
        config.border,
        config.color,
      )}
    >
      <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
      {config.label}
    </Badge>
  );
}

export default function StudentDetailPageClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = Number(params.studentId);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams?.get("tab");
    const validTabs: TabType[] = [
      "overview",
      "parents",
      "academic",
      "attendance",
      "fees",
      "documents",
    ];
    return tabParam && validTabs.includes(tabParam as TabType)
      ? (tabParam as TabType)
      : "overview";
  });

  const todayBS = getTodayBS();
  const [selectedNavYear, setSelectedNavYear] = useState<number>(todayBS.year);
  const [selectedNavMonth, setSelectedNavMonth] = useState<number>(
    todayBS.month,
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [attendanceDate, setAttendanceDate] =
    useState<string>(getTodayADString());

  // Parent management state
  const [editingParentIndex, setEditingParentIndex] = useState<number | null>(
    null,
  );
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

  // Fee queries and mutations
  const [expandedFees, setExpandedFees] = useState<Set<number>>(new Set());
  const [feeFilter, setFeeFilter] = useState<FeeStatus | "ALL">("ALL");
  const [selectedFeeAcademicYearId, setSelectedFeeAcademicYearId] = useState<
    number | null
  >(null);
  const [defaultFeeYearId, setDefaultFeeYearId] = useState<number | null>(null);

  // Record Payment Dialog state
  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] =
    useState(false);
  const [recordPaymentFeeId, setRecordPaymentFeeId] = useState<number | null>(
    null,
  );
  const [newPaymentData, setNewPaymentData] = useState({
    amountPaid: 0,
    paidBy: "",
    phoneNumber: "",
    paymentType: "CASH" as PaymentType,
    paymentDate: getTodayADString(),
  });

  // Edit Payment dialog state
  const [editingPaymentInfo, setEditingPaymentInfo] = useState<{
    feeId: number;
    payment: FeePaymentResponse;
  } | null>(null);

  // Edit Fee dialog state
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);
  const [editingFeeData, setEditingFeeData] = useState<
    Partial<StudentFeeResponse>
  >({});

  // Add Fee dialog state
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [newFeeData, setNewFeeData] = useState({
    feeType: "MONTHLY_FEE" as FeeTypes,
    originalAmount: 0,
    discountPercentage: 0,
    dueDate: "",
    academicYearId: 0,
  });

  // Delete confirmation dialog states
  const [deleteParentDialog, setDeleteParentDialog] = useState<{
    index: number;
    name: string;
  } | null>(null);
  const [deleteFeeDialog, setDeleteFeeDialog] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletePaymentDialog, setDeletePaymentDialog] = useState<{
    feeId: number;
    paymentId: number;
    amount: string;
  } | null>(null);

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
  const summaryEnabled =
    Number.isFinite(studentId) && typeof sectionId === "number";

  const dateRange = useMemo(() => {
    const monthDays = getBSMonthDays(selectedNavYear, selectedNavMonth);
    const fromAD = convertBSToAD(selectedNavYear, selectedNavMonth, 1);
    const toAD = convertBSToAD(selectedNavYear, selectedNavMonth, monthDays);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      fromDate: fmt(fromAD),
      toDate: fmt(toAD),
    };
  }, [selectedNavYear, selectedNavMonth]);

  const {
    data: attendanceSummary = [],
    isLoading: isAttendanceSummaryLoading,
  } = useQuery({
    queryKey: [
      "attendance-summary",
      studentId,
      sectionId,
      selectedSubjectId,
      dateRange.fromDate,
      dateRange.toDate,
    ],
    queryFn: () =>
      getStudentAttendanceSummary({
        studentId,
        sectionId: sectionId as number,
        ...(selectedSubjectId !== "all" && {
          subjectId: Number(selectedSubjectId),
        }),
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

  const { data: dailyAttendance = [] } = useQuery({
    queryKey: ["daily-attendance", studentId, attendanceDate],
    queryFn: () => getStudentDailyAttendance(studentId, attendanceDate),
    enabled: !!studentId && !!attendanceDate,
  });

  // Diary query — filter by today's date
  const todayDateStr = getTodayADString();
  const { data: diaryPage, isLoading: diaryLoading } = useQuery({
    queryKey: ["diary", sectionId, todayDateStr],
    queryFn: () =>
      findAllFiltered({
        sectionId: sectionId as number,
        startDate: todayDateStr,
        endDate: todayDateStr,
        pageSize: 100,
      }),
    enabled: typeof sectionId === "number",
  });
  const diaryEntries: DiaryResponse[] = diaryPage?.content ?? [];

  // Initialize edited parents when data loads
  useMemo(() => {
    if (studentData?.parents && editedParents.length === 0) {
      setEditedParents([...studentData.parents]);
    }
  }, [studentData?.parents]);

  const studentName = studentData?.studentName ?? "Student";
  const isStudentActive = Boolean(
    studentData?.schoolClassName && studentData?.sectionName,
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
      (subject) => String(subject.subjectId) === selectedSubjectId,
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
      { present: 0, absent: 0, leave: 0, total: 0 },
    );

    const percentage =
      totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0;

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
      const summary = attendanceSummary.find(
        (s) => s.subjectId === opt.subjectId,
      );
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

  const subjectCount = subjectOptions.length;

  // Fee queries
  const { data: fees = [] } = useQuery({
    queryKey: [
      ...studentFeeKeys.byStudent(studentId),
      selectedFeeAcademicYearId,
      feeFilter,
    ],
    queryFn: () =>
      getAllStudentFeesFiltered(
        studentId,
        selectedFeeAcademicYearId !== null && selectedFeeAcademicYearId !== -1
          ? selectedFeeAcademicYearId
          : undefined,
        feeFilter === "ALL" ? undefined : feeFilter,
      ),
    enabled: Number.isFinite(studentId) && selectedFeeAcademicYearId !== null,
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: academicYearKeys.all,
    queryFn: getAcademicYears,
  });

  // Default fee academic year filter to the active academic year
  useEffect(() => {
    if (selectedFeeAcademicYearId === null && academicYears.length > 0) {
      const active = academicYears.find((ay) => ay.isActive);
      setSelectedFeeAcademicYearId(active?.academicYearId ?? -1);
      setDefaultFeeYearId(active?.academicYearId ?? null);
    }
  }, [academicYears, selectedFeeAcademicYearId]);

  const { mutate: createStudentFee } = useMutation({
    mutationFn: ({
      academicYearId,
      data,
    }: {
      academicYearId: number;
      data: StudentFeeCreate;
    }) => apiCreateStudentFee(studentId, academicYearId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentFeeKeys.byStudent(studentId),
      });
      setIsAddingFee(false);
      setNewFeeData({
        feeType: "MONTHLY_FEE",
        originalAmount: 0,
        discountPercentage: 0,
        dueDate: "",
        academicYearId: 0,
      });
      toast({
        title: "Fee created",
        description: "Student fee has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create fee",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const { mutate: updateStudentFee } = useMutation({
    mutationFn: ({
      studentFeeId,
      data,
    }: {
      studentFeeId: number;
      data: StudentFeeCreate;
    }) => apiUpdateStudentFee(studentFeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentFeeKeys.byStudent(studentId),
      });
      setEditingFeeId(null);
      toast({
        title: "Fee updated",
        description: "Student fee has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update fee",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteStudentFee } = useMutation({
    mutationFn: (studentFeeId: number) => apiDeleteStudentFee(studentFeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentFeeKeys.byStudent(studentId),
      });
      toast({
        title: "Fee deleted",
        description: "Student fee has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete fee",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const { mutate: createFeePayment } = useMutation({
    mutationFn: ({
      studentFeeId,
      data,
    }: {
      studentFeeId: number;
      data: FeePaymentCreate;
    }) => apiCreateFeePayment(studentFeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentFeeKeys.byStudent(studentId),
      });
      setIsRecordPaymentDialogOpen(false);
      setRecordPaymentFeeId(null);
      setNewPaymentData({
        amountPaid: 0,
        paidBy: "",
        phoneNumber: "",
        paymentType: "CASH",
        paymentDate: getTodayADString(),
      });
      toast({
        title: "Payment recorded",
        description: "Fee payment has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to record payment",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const { mutate: updateFeePayment } = useMutation({
    mutationFn: ({
      feePaymentId,
      data,
    }: {
      feePaymentId: number;
      data: FeePaymentCreate;
    }) => apiUpdateFeePayment(feePaymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentFeeKeys.byStudent(studentId),
      });
      setEditingPaymentInfo(null);
      toast({
        title: "Payment updated",
        description: "Fee payment has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update payment",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteFeePayment } = useMutation({
    mutationFn: (feePaymentId: number) => apiDeleteFeePayment(feePaymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentFeeKeys.byStudent(studentId),
      });
      toast({
        title: "Payment deleted",
        description: "Fee payment has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete payment",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const { mutate: updateStudent } = useMutation({
    mutationFn: (data: StudentUpdate) => apiUpdateStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      setIsEditingStudent(false);
      toast({
        title: "Student updated",
        description: "Profile has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update student",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // Parent mutations
  const { mutate: addParent } = useMutation({
    mutationFn: (data: ParentCreate) => addParentToStudent(studentId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      setEditedParents((prev) => [
        ...prev,
        {
          parentId: response.parentId,
          parentName: response.parentName,
          parentNumber: response.parentPhoneNumber,
        },
      ]);
      setNewParent({ parentName: "", parentNumber: "" });
      setIsAddingParent(false);
      toast({
        title: "Parent added",
        description: "Parent has been added to student.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add parent",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const { mutate: updateParent } = useMutation({
    mutationFn: ({
      parentId,
      data,
    }: {
      parentId: number;
      data: ParentUpdate;
    }) => updateParentOfStudent(studentId, parentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      setEditingParentIndex(null);
      toast({
        title: "Parent updated",
        description: "Parent information has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update parent",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const { mutate: removeParent } = useMutation({
    mutationFn: (parentId: number) =>
      removeParentFromStudent(studentId, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      toast({
        title: "Parent removed",
        description: "Parent has been removed from student.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove parent",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  // Fee calculations
  const feeStats = useMemo(() => {
    const totalExpected = fees.reduce((sum, f) => sum + f.netFee, 0);
    const totalPaid = fees.reduce(
      (sum, f) => sum + f.feePayments.reduce((s, p) => s + p.amountPaid, 0),
      0,
    );
    const totalRemaining = totalExpected - totalPaid;
    const overdueFees = fees.filter((f) => f.feeStatus === "OVERDUE");
    const overdueAmount = overdueFees.reduce((sum, f) => {
      const paid = f.feePayments.reduce((s, p) => s + p.amountPaid, 0);
      return sum + (f.netFee - paid);
    }, 0);

    return {
      totalExpected,
      totalPaid,
      totalRemaining,
      overdueAmount,
      overdueCount: overdueFees.length,
      totalCount: fees.length,
    };
  }, [fees]);

  const toggleFee = (id: number) => {
    setExpandedFees((prev) => {
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

  const formatDateBS = (adDate: string) => {
    const bs = convertADToBS(new Date(adDate));
    return `${bs.year} ${bs.month + 1} ${bs.day}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Parent management functions
  const handleEditParent = (index: number) => {
    setEditingParentIndex(index);
    setIsAddingParent(false);
  };

  const handleSaveParent = (index: number) => {
    const parent = editedParents[index];
    if (parent.parentId) {
      updateParent({
        parentId: parent.parentId,
        data: {
          parentName: parent.parentName,
          parentPhoneNumber: parent.parentNumber,
        },
      });
    }
  };

  const handleAddParent = () => {
    if (newParent.parentName && newParent.parentNumber) {
      addParent({
        parentName: newParent.parentName,
        parentPhoneNumber: newParent.parentNumber,
      });
    }
  };

  const handleUpdateStudent = () => {
    updateStudent({
      studentName: editedStudentName,
      dateOfBirth: editedDOB,
    });
  };

  const startEditStudent = () => {
    setEditedStudentName(studentData?.studentName ?? "");
    setEditedDOB(studentData?.dateOfBirth ?? "");
    setIsEditingStudent(true);
  };

  // Fee management handlers

  const handleEditFee = (feeId: number) => {
    const fee = fees.find((f) => f.studentFeeId === feeId);
    if (fee) {
      setEditingFeeData({ ...fee });
      setEditingFeeId(feeId);
    }
  };

  const handleSaveFee = () => {
    if (editingFeeId === null) return;
    const missing = [];
    if (!editingFeeData.originalAmount) missing.push("Original Amount");
    if (!editingFeeData.dueDate) missing.push("Due Date");
    if (!editingFeeData.feeType) missing.push("Fee Type");
    if (missing.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    updateStudentFee({
      studentFeeId: editingFeeId,
      data: {
        originalAmount: editingFeeData.originalAmount!,
        discountPercentage: editingFeeData.discountPercentage || 0,
        feeType: editingFeeData.feeType!,
        dueDate: editingFeeData.dueDate!,
      },
    });
  };

  const handleConfirmDeleteParent = () => {
    if (!deleteParentDialog) return;
    const parent = editedParents[deleteParentDialog.index];
    if (parent.parentId) {
      removeParent(parent.parentId);
      const updated = editedParents.filter(
        (_, i) => i !== deleteParentDialog.index,
      );
      setEditedParents(updated);
    }
    setDeleteParentDialog(null);
  };

  const handleConfirmDeleteFee = () => {
    if (!deleteFeeDialog) return;
    deleteStudentFee(deleteFeeDialog.id, {
      onSuccess: () => setDeleteFeeDialog(null),
    });
  };

  const handleConfirmDeletePayment = () => {
    if (!deletePaymentDialog) return;
    deleteFeePayment(deletePaymentDialog.paymentId, {
      onSuccess: () => setDeletePaymentDialog(null),
    });
  };

  const handleAddPayment = () => {
    if (
      recordPaymentFeeId !== null &&
      newPaymentData.amountPaid > 0 &&
      newPaymentData.paidBy
    ) {
      const fee = fees.find((f) => f.studentFeeId === recordPaymentFeeId);
      if (
        fee &&
        fee.feeStatus !== "OVERDUE" &&
        newPaymentData.paymentDate > fee.dueDate
      ) {
        toast({
          title: "Invalid payment date",
          description: "Payment date cannot be after the fee due date.",
          variant: "destructive",
        });
        return;
      }

      createFeePayment({
        studentFeeId: recordPaymentFeeId,
        data: {
          amountPaid: newPaymentData.amountPaid,
          paidBy: newPaymentData.paidBy,
          phoneNumber: newPaymentData.phoneNumber,
          paymentType: newPaymentData.paymentType,
          paymentDate: newPaymentData.paymentDate,
        },
      });
    }
  };

  const handleEditPayment = (feeId: number, payment: FeePaymentResponse) => {
    setEditingPaymentInfo({ feeId, payment: { ...payment } });
  };

  const handleSavePaymentUpdate = () => {
    if (!editingPaymentInfo) return;

    const fee = fees.find((f) => f.studentFeeId === editingPaymentInfo.feeId);
    if (
      fee &&
      fee.feeStatus !== "OVERDUE" &&
      editingPaymentInfo.payment.paymentDate > fee.dueDate
    ) {
      toast({
        title: "Invalid payment date",
        description: "Payment date cannot be after the fee due date.",
        variant: "destructive",
      });
      return;
    }

    updateFeePayment({
      feePaymentId: editingPaymentInfo.payment.feePaymentId,
      data: {
        amountPaid: editingPaymentInfo.payment.amountPaid,
        paidBy: editingPaymentInfo.payment.paidBy,
        phoneNumber: editingPaymentInfo.payment.phoneNumber,
        paymentType: editingPaymentInfo.payment.paymentType,
        paymentDate: editingPaymentInfo.payment.paymentDate,
      },
    });
  };

  const handleDeletePayment = (feeId: number, paymentId: number) => {
    deleteFeePayment(paymentId);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    });
  };

  const todayLabel = (() => {
    const d = new Date();
    return d.toLocaleDateString("en-NP", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  })();

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
                Student Details
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-7">
              {studentData?.schoolClassName
                ? `Class ${studentData.schoolClassName} • Section ${studentData.sectionName}`
                : "Student Information"}{" "}
              &bull; {todayLabel}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-7 sm:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={startEditStudent}
              className="h-9 rounded-xl text-xs sm:text-sm"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 rounded-2xl sm:rounded-3xl" />
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/60 backdrop-blur-sm overflow-hidden">
            {/* Profile Content */}
            <div className="p-4 sm:p-6">
              {isEditingStudent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Edit Profile</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdateStudent}
                        className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingStudent(false);
                          setEditedStudentName(studentData?.studentName || "");
                          setEditedDOB(studentData?.dateOfBirth || "");
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
                          value={editedStudentName}
                          onChange={(e) => setEditedStudentName(e.target.value)}
                          placeholder="Student name"
                          className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Date of Birth</Label>
                      <MiniCalendar
                        value={
                          editedDOB
                            ? convertADToBS(new Date(editedDOB))
                            : undefined
                        }
                        onChange={(isoString) => setEditedDOB(isoString)}
                        placeholder="Select date of birth"
                        className="bg-white rounded-lg border-slate-200 w-full h-10"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex flex-col items-center sm:flex-row gap-4 sm:gap-6 sm:items-center flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ring-4 ring-violet-100">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          {studentInitials || "ST"}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-lg sm:text-xl font-bold">
                        {studentName}
                      </h2>
                      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        {isStudentActive && (
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              Class {studentData?.schoolClassName} • Section{" "}
                              {studentData?.sectionName}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold">
                            ID: #{String(studentId).padStart(5, "0")}
                          </span>
                        </span>
                        {studentData?.dateOfBirth && (
                          <span className="flex items-center gap-1.5">
                            <span className="font-semibold">
                              DOB: {formatDate(studentData.dateOfBirth)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">
                          Status
                        </p>
                        <Badge
                          className={cn(
                            "text-xs font-bold",
                            isStudentActive
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-amber-100 text-amber-700 border-amber-200",
                          )}
                        >
                          {isStudentActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {/* Separator - mobile only */}
                      <div className="w-px h-10 bg-slate-300 sm:hidden" />
                      {/* Edit button - mobile only */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEditStudent}
                        className="h-9 px-3.5 rounded-xl sm:hidden flex-shrink-0 gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Edit</span>
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
            <div className="flex items-center gap-1.5 sm:gap-2 text-violet-600 mb-1.5 sm:mb-2">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">
                Subjects
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{subjectCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Enrolled
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 mb-1.5 sm:mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">
                Attendance
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {isAttendanceSummaryLoading
                ? "..."
                : hasAttendanceData
                  ? `${attendanceStats.percentage}%`
                  : "—"}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {attendanceStats.present}/{attendanceStats.total} days present
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-600 mb-1.5 sm:mb-2">
              <NepaliRupee className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">Fees</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {feeStats.totalRemaining > 0
                ? formatCurrency(feeStats.totalRemaining)
                : "Paid"}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {formatCurrency(feeStats.totalPaid)} paid of{" "}
              {formatCurrency(feeStats.totalExpected)}
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-600 mb-1.5 sm:mb-2">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs font-medium">
                Parents
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {editedParents.length}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Guardians
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="space-y-4"
        >
          {/* Mobile dropdown */}
          <div className="sm:hidden">
            <Select
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabType)}
            >
              <SelectTrigger className="w-full h-10 rounded-xl bg-white border-slate-200 text-sm font-medium">
                <SelectValue placeholder="Select tab" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="overview">
                  <span className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> Overview
                  </span>
                </SelectItem>
                <SelectItem value="parents">
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" /> Parents
                  </span>
                </SelectItem>
                <SelectItem value="academic">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5" /> Academic
                  </span>
                </SelectItem>
                <SelectItem value="attendance">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Attendance
                  </span>
                </SelectItem>
                <SelectItem value="fees">
                  <span className="flex items-center gap-2">
                    <NepaliRupee className="h-3.5 w-3.5" /> Fees
                  </span>
                </SelectItem>
                <SelectItem value="documents">
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" /> Documents
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Desktop tab list */}
          <div className="hidden sm:block w-full">
            <TabsList className="grid grid-cols-6 h-auto p-1 bg-white rounded-xl border border-slate-200 w-full">
              <TabsTrigger
                value="overview"
                className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="parents"
                className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Parents
              </TabsTrigger>
              <TabsTrigger
                value="academic"
                className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                Academic
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="fees"
                className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <NepaliRupee className="h-3.5 w-3.5 mr-1.5" />
                Fees
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Academic Information */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 hover:shadow-md transition-all">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                  Academic Information
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    {
                      label: "Class",
                      value: studentData?.schoolClassName || "N/A",
                    },
                    {
                      label: "Section",
                      value: studentData?.sectionName || "N/A",
                    },
                    { label: "Enrolled Subjects", value: subjectCount },
                    {
                      label: "Status",
                      value: isStudentActive ? "Active" : "Inactive",
                      badge: true,
                      active: isStudentActive,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-slate-500">
                        {item.label}
                      </span>
                      {item.badge ? (
                        <Badge
                          className={cn(
                            "text-xs",
                            item.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200",
                          )}
                        >
                          {item.value}
                        </Badge>
                      ) : (
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 hover:shadow-md transition-all">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    {
                      icon: Pencil,
                      label: "Edit Profile",
                      action: startEditStudent,
                      color: "slate",
                    },
                    {
                      icon: UserPlus,
                      label: "Add Parent",
                      action: () => {
                        setActiveTab("parents");
                        setIsAddingParent(true);
                      },
                      color: "violet",
                    },
                    {
                      icon: NepaliRupee,
                      label: "Add Fee",
                      action: () => {
                        setActiveTab("fees");
                        setIsAddingFee(true);
                      },
                      color: "amber",
                    },
                    {
                      icon: BookOpen,
                      label: "Assign Subject",
                      action: () => {},
                      color: "blue",
                    },
                    {
                      icon: FileText,
                      label: "Report",
                      action: () => {},
                      color: "emerald",
                    },
                    {
                      icon: Calendar,
                      label: "Attendance",
                      action: () => setActiveTab("attendance"),
                      color: "violet",
                    },
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.action}
                      className={cn(
                        "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border transition-all hover:shadow-md text-center",
                        action.color === "red"
                          ? "border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200"
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center",
                          action.color === "slate" &&
                            "bg-slate-200 text-slate-600",
                          action.color === "violet" &&
                            "bg-violet-100 text-violet-600",
                          action.color === "blue" &&
                            "bg-blue-100 text-blue-600",
                          action.color === "emerald" &&
                            "bg-emerald-100 text-emerald-600",
                          action.color === "amber" &&
                            "bg-amber-100 text-amber-600",
                          action.color === "red" && "bg-red-100 text-red-600",
                        )}
                      >
                        <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span
                        className={cn(
                          "text-[10px] sm:text-xs font-semibold leading-tight",
                          action.color === "red"
                            ? "text-red-600"
                            : "text-slate-700",
                        )}
                      >
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parents" className="space-y-4">
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Parent / Guardian Management
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Manage parent information and contact details
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsAddingParent(true);
                      setEditingParentIndex(null);
                    }}
                    className="gap-2 rounded-xl text-sm"
                    disabled={isAddingParent}
                  >
                    <Plus className="h-4 w-4" />
                    Add Parent
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {isAddingParent && (
                  <div className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-violet-50 border-2 border-violet-200 animate-in slide-in-from-top-2">
                    <h4 className="font-bold text-violet-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                      New Parent Details
                    </h4>
                    <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="text"
                            value={newParent.parentName}
                            onChange={(e) =>
                              setNewParent({
                                ...newParent,
                                parentName: e.target.value,
                              })
                            }
                            placeholder="Parent full name"
                            className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Phone *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="text"
                            value={newParent.parentNumber}
                            onChange={(e) =>
                              setNewParent({
                                ...newParent,
                                parentNumber: e.target.value,
                              })
                            }
                            placeholder="Phone number"
                            className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddParent}
                        className="flex-1 sm:flex-none rounded-xl bg-violet-600 hover:bg-violet-700 text-sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Parent
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingParent(false);
                          setNewParent({
                            parentName: "",
                            parentNumber: "",
                            parentEmail: "",
                            relation: "Father",
                          });
                        }}
                        className="flex-1 sm:flex-none rounded-xl text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3">
                  {editedParents.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No parents added yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tap "Add Parent" to add a guardian
                      </p>
                    </div>
                  ) : (
                    editedParents.map((parent, index) => (
                      <div
                        key={index}
                        className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden transition-all hover:border-slate-300"
                      >
                        {editingParentIndex === index ? (
                          <div className="p-4 sm:p-5">
                            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Name</Label>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                  <Input
                                    type="text"
                                    value={parent.parentName}
                                    onChange={(e) => {
                                      const updated = [...editedParents];
                                      updated[index] = {
                                        ...updated[index],
                                        parentName: e.target.value,
                                      };
                                      setEditedParents(updated);
                                    }}
                                    className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Phone</Label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                  <Input
                                    type="text"
                                    value={parent.parentNumber}
                                    onChange={(e) => {
                                      const updated = [...editedParents];
                                      updated[index] = {
                                        ...updated[index],
                                        parentNumber: e.target.value,
                                      };
                                      setEditedParents(updated);
                                    }}
                                    className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-lg"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveParent(index)}
                                className="flex-1 sm:flex-none rounded-xl text-sm"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingParentIndex(null)}
                                className="flex-1 sm:flex-none rounded-xl text-sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 sm:p-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                  {parent.parentName}
                                </h4>
                                <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-xs shrink-0">
                                  {parent.relation || "Guardian"}
                                </Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                <span className="flex items-center gap-1.5 text-slate-500 min-w-0">
                                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm font-semibold truncate">
                                    {parent.parentNumber}
                                  </span>
                                </span>
                                {parent.parentEmail && (
                                  <span className="flex items-center gap-1.5 text-slate-500 min-w-0">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm font-semibold truncate">
                                      {parent.parentEmail}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditParent(index)}
                                className="h-9 w-9 rounded-lg hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4 text-slate-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDeleteParentDialog({
                                    index,
                                    name: parent.parentName,
                                  })
                                }
                                className="h-9 w-9 rounded-lg hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
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
          </TabsContent>

          <TabsContent value="academic" className="space-y-4">
            {/* Subjects Section */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Enrolled Subjects
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Current academic term subjects and teachers
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {classAssignments.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No subjects assigned
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assign subjects to this student
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {classAssignments.map((assignment) => (
                      <div
                        key={assignment.classAssignmentId}
                        className="p-3 sm:p-4 rounded-xl border border-slate-200/80 bg-white hover:border-violet-200 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                              {assignment.subjectName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {assignment.teacherRole === "CLASS_TEACHER" ? (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] sm:text-[11px] font-medium">
                                  Class Teacher
                                </Badge>
                              ) : assignment.teacherRole ===
                                "ASSISTANT_TEACHER" ? (
                                <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] sm:text-[11px] font-medium">
                                  Assistant Teacher
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] sm:text-[11px] font-medium">
                                  Subject Teacher
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 border-t border-slate-100">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                              {assignment.teacherName}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/admin/sections/${sectionId}#assignments`,
                              )
                            }
                            className="text-[11px] sm:text-xs rounded-lg h-8 sm:h-9 px-3 text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Daily Diary Section */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Daily Diary
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Daily diary entries for the student&apos;s section
                </p>
              </div>
              <div className="p-4 sm:p-6">
                {diaryEntries.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-violet-100 mx-auto flex items-center justify-center mb-3">
                      <BookMarked className="h-6 w-6 sm:h-7 sm:w-7 text-violet-600" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No diary entries
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Diary entries will appear here once created
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    {diaryEntries.map((entry) => (
                      <div
                        key={entry.diaryId}
                        className="rounded-xl border border-slate-200/80 bg-white hover:border-violet-200 hover:shadow-md transition-all group flex flex-col h-full"
                      >
                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                          <div className="flex items-start gap-3 sm:gap-4 mb-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <BookMarked className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-tight mb-1.5">
                                {entry.title}
                              </h4>
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <Badge className="text-[10px] sm:text-xs bg-violet-50 text-violet-700 border-violet-200 font-semibold px-2 py-0.5">
                                  {entry.subjectName}
                                </Badge>
                                <span className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {entry.diaryDate}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 mt-1">
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                              {entry.content}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                                  Teacher
                                </p>
                                <p className="text-xs sm:text-sm text-slate-700 font-semibold truncate">
                                  {entry.teacherName}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            {/* Attendance Overview */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Attendance Overview
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Comprehensive attendance analytics
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Select
                      value={selectedSubjectId}
                      onValueChange={setSelectedSubjectId}
                    >
                      <SelectTrigger className="w-full sm:w-[150px] h-9 rounded-xl text-xs sm:text-sm bg-white">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjectOptions.map((s) => (
                          <SelectItem
                            key={s.subjectId}
                            value={String(s.subjectId)}
                          >
                            {s.subjectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <MonthYearNavigator
                      value={{
                        year: selectedNavYear,
                        month: selectedNavMonth,
                      }}
                      onChange={(year, month) => {
                        setSelectedNavYear(year);
                        setSelectedNavMonth(month);
                      }}
                      className="w-full sm:w-auto"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubjectId("all");
                        const bs = getTodayBS();
                        setSelectedNavYear(bs.year);
                        setSelectedNavMonth(bs.month);
                      }}
                      className="w-full sm:w-auto shrink-0 gap-1.5 rounded-xl text-xs sm:text-sm h-9"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {!hasAttendanceData ? (
                  <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No attendance data
                    </p>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
                    <div className="lg:col-span-5 flex flex-col items-center">
                      <AnimatedPieChart
                        percentage={attendanceStats.percentage}
                        size={200}
                        strokeWidth={16}
                      />
                      <p className="mt-4 text-xs sm:text-sm text-center text-muted-foreground font-medium">
                        {selectedSubjectId === "all"
                          ? "Overall attendance across all subjects"
                          : `Attendance for ${selectedSubjectName}`}
                      </p>
                    </div>
                    <div className="lg:col-span-7">
                      {selectedSubjectId === "all" ? (
                        <div className="space-y-3 sm:space-y-4">
                          {subjectPerformance.map((subject) => (
                            <div key={subject.subjectId}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs sm:text-sm font-bold text-slate-700">
                                  {subject.subjectName}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                  {subject.percentage}%
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    subject.percentage >= 75
                                      ? "bg-emerald-500"
                                      : subject.percentage >= 60
                                        ? "bg-amber-500"
                                        : "bg-red-500",
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
                            {
                              label: "Present",
                              value: attendanceStats.present,
                              color: "emerald",
                            },
                            {
                              label: "Absent",
                              value: attendanceStats.absent,
                              color: "red",
                            },
                            {
                              label: "Leave",
                              value: attendanceStats.excused,
                              color: "amber",
                            },
                            {
                              label: "Total",
                              value: attendanceStats.total,
                              color: "slate",
                            },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className={cn(
                                "p-3 sm:p-4 rounded-xl border text-center",
                                stat.color === "emerald" &&
                                  "bg-emerald-50 border-emerald-100",
                                stat.color === "red" &&
                                  "bg-red-50 border-red-100",
                                stat.color === "amber" &&
                                  "bg-amber-50 border-amber-100",
                                stat.color === "slate" &&
                                  "bg-slate-50 border-slate-200",
                              )}
                            >
                              <p
                                className={cn(
                                  "text-xl sm:text-2xl font-bold",
                                  stat.color === "emerald" &&
                                    "text-emerald-600",
                                  stat.color === "red" && "text-red-600",
                                  stat.color === "amber" && "text-amber-600",
                                  stat.color === "slate" && "text-slate-600",
                                )}
                              >
                                {stat.value}
                              </p>
                              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">
                                {stat.label}
                              </p>
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
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Daily Attendance Record
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Subject-wise attendance for selected date
                  </p>
                </div>
                <MiniCalendar
                  value={attendanceDateBS}
                  onChange={setAttendanceDate}
                  className="w-full sm:w-[180px]"
                />
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  {classAssignments.map((assignment) => {
                    const attendance = dailyAttendance.find(
                      (a) => a.subjectId === assignment.subjectId,
                    );
                    return (
                      <div
                        key={assignment.classAssignmentId}
                        className="w-[calc(50%-0.5rem)] sm:w-[150px] p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center text-center hover:border-violet-200 transition-all"
                      >
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500 mb-1.5 sm:mb-2" />
                        <h4 className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full">
                          {assignment.subjectName}
                        </h4>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mb-1.5 sm:mb-2">
                          {assignment.teacherName}
                        </p>
                        <AttendanceStatusBadge
                          status={attendance?.attendanceStatus}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fees" className="space-y-4">
            {/* Fee Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {[
                {
                  icon: NepaliRupee,
                  label: "Total Expected",
                  value: formatCurrency(feeStats.totalExpected),
                  color: "violet",
                  subtext: `${feeStats.totalCount} fee items`,
                },
                {
                  icon: CreditCard,
                  label: "Total Paid",
                  value: formatCurrency(feeStats.totalPaid),
                  color: "emerald",
                  subtext: `${feeStats.totalExpected > 0 ? Math.round((feeStats.totalPaid / feeStats.totalExpected) * 100) : 0}% collected`,
                },
                {
                  icon: Wallet,
                  label: "Remaining",
                  value: formatCurrency(feeStats.totalRemaining),
                  color: feeStats.totalRemaining > 0 ? "amber" : "emerald",
                  subtext:
                    feeStats.totalRemaining > 0 ? "Still due" : "All cleared",
                },
                {
                  icon: AlertTriangle,
                  label: "Overdue",
                  value: formatCurrency(feeStats.overdueAmount),
                  color: feeStats.overdueAmount > 0 ? "red" : "emerald",
                  subtext: `${feeStats.overdueCount} overdue fees`,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center",
                        stat.color === "emerald" &&
                          "bg-emerald-100 text-emerald-600",
                        stat.color === "violet" &&
                          "bg-violet-100 text-violet-600",
                        stat.color === "amber" && "bg-amber-100 text-amber-600",
                        stat.color === "red" && "bg-red-100 text-red-600",
                      )}
                    >
                      <stat.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {stat.subtext}
                  </p>
                </div>
              ))}
            </div>

            {/* Fee Management */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Fee Management
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Manage student fees, payments, and track dues
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={
                      selectedFeeAcademicYearId !== null &&
                      selectedFeeAcademicYearId !== -1
                        ? String(selectedFeeAcademicYearId)
                        : "ALL"
                    }
                    onValueChange={(v) =>
                      setSelectedFeeAcademicYearId(v === "ALL" ? -1 : Number(v))
                    }
                  >
                    <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Years</SelectItem>
                      {academicYears.map((ay) => (
                        <SelectItem
                          key={ay.academicYearId}
                          value={String(ay.academicYearId)}
                        >
                          {ay.academicYear}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={feeFilter}
                    onValueChange={(v) => setFeeFilter(v as FeeStatus | "ALL")}
                  >
                    <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  {(selectedFeeAcademicYearId !== defaultFeeYearId ||
                    feeFilter !== "ALL") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFeeAcademicYearId(defaultFeeYearId);
                        setFeeFilter("ALL");
                      }}
                      className="h-9 px-3 rounded-xl text-xs font-medium"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Clear
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setIsAddingFee(true);
                      setEditingFeeId(null);
                    }}
                    className="gap-2 rounded-xl text-xs sm:text-sm"
                    size="sm"
                    disabled={isAddingFee}
                  >
                    <Plus className="h-4 w-4" />
                    Add Fee
                  </Button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  {fees.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <NepaliRupee className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No fees recorded
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click "Add Fee" to record a new fee
                      </p>
                    </div>
                  ) : (
                    fees.map((fee) => {
                      const totalPaid = fee.feePayments.reduce(
                        (sum, p) => sum + p.amountPaid,
                        0,
                      );
                      const remaining = fee.netFee - totalPaid;
                      const isExpanded = expandedFees.has(fee.studentFeeId);

                      return (
                        <div
                          key={fee.studentFeeId}
                          className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden transition-all hover:border-slate-300"
                        >
                          <div
                            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer"
                            onClick={() => toggleFee(fee.studentFeeId)}
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <NepaliRupee className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <FeeTypeBadge type={fee.feeType} />
                                <FeeStatusBadge status={fee.feeStatus} />
                                <span className="text-[10px] sm:text-xs text-slate-400">
                                  AY {fee.academicYear}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm">
                                <span className="font-bold text-slate-900">
                                  {formatCurrency(fee.netFee)}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span
                                  className={cn(
                                    "font-semibold",
                                    remaining > 0
                                      ? "text-amber-600"
                                      : "text-emerald-600",
                                  )}
                                >
                                  {remaining > 0
                                    ? `${formatCurrency(remaining)} due`
                                    : "Paid"}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    fee.feeStatus === "PAID"
                                      ? "bg-emerald-500"
                                      : fee.feeStatus === "OVERDUE"
                                        ? "bg-red-500"
                                        : "bg-violet-500",
                                  )}
                                  style={{
                                    width: `${Math.min((totalPaid / fee.netFee) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 sm:h-5 sm:w-5 text-slate-400 transition-transform flex-shrink-0",
                                isExpanded && "rotate-180",
                              )}
                            />
                          </div>

                          {isExpanded && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 animate-in slide-in-from-top-2">
                              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                                    <span className="font-medium">
                                      Due:{" "}
                                      <span className="font-semibold">
                                        {formatDate(fee.dueDate)}
                                      </span>
                                    </span>
                                    <span className="hidden sm:inline text-slate-300">
                                      |
                                    </span>
                                    <span className="font-medium">
                                      Net:{" "}
                                      <span className="font-semibold">
                                        {formatCurrency(fee.netFee)}
                                      </span>
                                    </span>
                                    <span className="hidden sm:inline text-slate-300">
                                      |
                                    </span>
                                    <span className="font-medium">
                                      Paid:{" "}
                                      <span className="font-semibold text-emerald-600">
                                        {formatCurrency(totalPaid)}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleEditFee(fee.studentFeeId)
                                      }
                                      className="h-9 w-9 rounded-lg hover:bg-slate-200"
                                    >
                                      <Pencil className="h-4 w-4 text-slate-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setDeleteFeeDialog({
                                          id: fee.studentFeeId,
                                          name: formatCurrency(fee.netFee),
                                        })
                                      }
                                      className="h-9 w-9 rounded-lg hover:bg-red-100"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Payment History */}
                                <div className="space-y-2">
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Payment History
                                  </h5>
                                  {fee.feePayments.length === 0 ? (
                                    <p className="text-xs sm:text-sm text-slate-400 italic">
                                      No payments recorded yet
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {fee.feePayments.map((payment) => (
                                        <div
                                          key={payment.feePaymentId}
                                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-white border border-slate-200/80"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-sm sm:text-base font-semibold text-slate-900">
                                                {formatCurrency(
                                                  payment.amountPaid,
                                                )}
                                              </span>
                                              <PaymentTypeBadge
                                                type={payment.paymentType}
                                              />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-xs sm:text-sm text-slate-500">
                                              <span className="flex items-center gap-1">
                                                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                {payment.paidBy}
                                              </span>
                                              <span className="hidden sm:inline">
                                                •
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                {payment.phoneNumber}
                                              </span>
                                              <span className="hidden sm:inline">
                                                •
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <CalendarClock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                {formatDate(
                                                  payment.paymentDate,
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleEditPayment(
                                                  fee.studentFeeId,
                                                  payment,
                                                )
                                              }
                                              className="h-9 w-9 rounded-lg hover:bg-slate-200"
                                            >
                                              <Pencil className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                setDeletePaymentDialog({
                                                  feeId: fee.studentFeeId,
                                                  paymentId:
                                                    payment.feePaymentId,
                                                  amount: formatCurrency(
                                                    payment.amountPaid,
                                                  ),
                                                })
                                              }
                                              className="h-9 w-9 rounded-lg hover:bg-red-100"
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Add Payment Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRecordPaymentFeeId(fee.studentFeeId);
                                    setNewPaymentData({
                                      amountPaid: remaining > 0 ? remaining : 0,
                                      paidBy: "",
                                      phoneNumber: "",
                                      paymentType: "CASH",
                                      paymentDate: getTodayADString(),
                                    });
                                    setIsRecordPaymentDialogOpen(true);
                                  }}
                                  className="rounded-lg sm:rounded-xl text-sm h-9 sm:h-10 w-full border-dashed border-violet-300 text-violet-700 hover:bg-violet-50"
                                >
                                  <Plus className="h-4 w-4 mr-1.5" />
                                  Record Payment
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Documents & Records
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Manage student documents and certificates
                  </p>
                </div>
                <Button
                  className="gap-2 rounded-xl text-xs sm:text-sm w-full sm:w-auto"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Upload Document
                </Button>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No documents uploaded
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload student documents, certificates, and records
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Edit Dialog */}
        <Dialog
          open={!!editingPaymentInfo}
          onOpenChange={(open) => !open && setEditingPaymentInfo(null)}
        >
          <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Pencil className="h-4.5 w-4.5 text-violet-600" />
                </div>
                Edit Payment Record
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pl-[2.75rem]">
                Update payment details
              </DialogDescription>
            </DialogHeader>

            <div className="border-t" />

            <div className="px-6 py-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Amount Paid</Label>
                  <Input
                    type="number"
                    value={editingPaymentInfo?.payment.amountPaid || ""}
                    onChange={(e) =>
                      setEditingPaymentInfo({
                        ...editingPaymentInfo!,
                        payment: {
                          ...editingPaymentInfo!.payment,
                          amountPaid: Number(e.target.value),
                        },
                      })
                    }
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Paid By</Label>
                  <Input
                    type="text"
                    value={editingPaymentInfo?.payment.paidBy || ""}
                    onChange={(e) =>
                      setEditingPaymentInfo({
                        ...editingPaymentInfo!,
                        payment: {
                          ...editingPaymentInfo!.payment,
                          paidBy: e.target.value,
                        },
                      })
                    }
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input
                    type="text"
                    value={editingPaymentInfo?.payment.phoneNumber || ""}
                    onChange={(e) =>
                      setEditingPaymentInfo({
                        ...editingPaymentInfo!,
                        payment: {
                          ...editingPaymentInfo!.payment,
                          phoneNumber: e.target.value,
                        },
                      })
                    }
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Type</Label>
                  <Select
                    value={editingPaymentInfo?.payment.paymentType || "CASH"}
                    onValueChange={(value) =>
                      setEditingPaymentInfo({
                        ...editingPaymentInfo!,
                        payment: {
                          ...editingPaymentInfo!.payment,
                          paymentType: value as PaymentType,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-11 text-sm rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="ESEWA">eSewa</SelectItem>
                      <SelectItem value="KHALTI">Khalti</SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        Bank Transfer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Date</Label>
                  <MiniCalendar
                    value={
                      editingPaymentInfo?.payment.paymentDate
                        ? convertADToBS(
                            new Date(editingPaymentInfo.payment.paymentDate),
                          )
                        : undefined
                    }
                    onChange={(isoString) =>
                      setEditingPaymentInfo({
                        ...editingPaymentInfo!,
                        payment: {
                          ...editingPaymentInfo!.payment,
                          paymentDate: isoString,
                        },
                      })
                    }
                    placeholder="Select payment date"
                  />
                </div>
              </div>
            </div>

            <div className="border-t" />

            <DialogFooter className="px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingPaymentInfo(null)}
                className="rounded-xl text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePaymentUpdate}
                className="rounded-xl text-sm font-medium w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
              >
                Update Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog
          open={isRecordPaymentDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsRecordPaymentDialogOpen(false);
              setRecordPaymentFeeId(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Plus className="h-4.5 w-4.5 text-violet-600" />
                </div>
                Record Payment
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pl-[2.75rem]">
                Add a new payment record for this fee
              </DialogDescription>
            </DialogHeader>

            <div className="border-t" />

            <div className="px-6 py-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Amount *</Label>
                  <Input
                    type="number"
                    value={newPaymentData.amountPaid || ""}
                    onChange={(e) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        amountPaid: Number(e.target.value),
                      })
                    }
                    placeholder="Enter amount"
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Paid By *</Label>
                  <Input
                    type="text"
                    value={newPaymentData.paidBy}
                    onChange={(e) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        paidBy: e.target.value,
                      })
                    }
                    placeholder="Payer name"
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input
                    type="text"
                    value={newPaymentData.phoneNumber}
                    onChange={(e) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        phoneNumber: e.target.value,
                      })
                    }
                    placeholder="Phone number"
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Type</Label>
                  <Select
                    value={newPaymentData.paymentType}
                    onValueChange={(value) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        paymentType: value as PaymentType,
                      })
                    }
                  >
                    <SelectTrigger className="h-11 text-sm rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="ESEWA">eSewa</SelectItem>
                      <SelectItem value="KHALTI">Khalti</SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        Bank Transfer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Date</Label>
                  <MiniCalendar
                    value={
                      newPaymentData.paymentDate
                        ? convertADToBS(new Date(newPaymentData.paymentDate))
                        : undefined
                    }
                    onChange={(isoString) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        paymentDate: isoString,
                      })
                    }
                    placeholder="Select payment date"
                  />
                </div>
              </div>
            </div>

            <div className="border-t" />

            <DialogFooter className="px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRecordPaymentDialogOpen(false);
                  setRecordPaymentFeeId(null);
                }}
                className="rounded-xl text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPayment}
                disabled={!newPaymentData.amountPaid || !newPaymentData.paidBy}
                className="rounded-xl text-sm font-medium w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
              >
                Save Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Fee Dialog */}
        <Dialog
          open={isAddingFee}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddingFee(false);
              setNewFeeData({
                feeType: "MONTHLY_FEE",
                originalAmount: 0,
                discountPercentage: 0,
                dueDate: "",
                academicYearId: 0,
              });
            }
          }}
        >
          <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] rounded-2xl p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                  <Plus className="h-4.5 w-4.5 text-white" />
                </div>
                New Fee Entry
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pl-[2.75rem]">
                Record a new fee requirement for this student
              </DialogDescription>
            </DialogHeader>

            <div className="border-t" />

            <div className="px-6 py-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Fee Type *</Label>
                  <Select
                    value={newFeeData.feeType}
                    onValueChange={(value) =>
                      setNewFeeData({
                        ...newFeeData,
                        feeType: value as FeeTypes,
                      })
                    }
                  >
                    <SelectTrigger className="h-11 text-sm rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMISSION_FEE">Admission</SelectItem>
                      <SelectItem value="MONTHLY_FEE">Monthly</SelectItem>
                      <SelectItem value="ANNUAL_FEE">Annual</SelectItem>
                      <SelectItem value="EXTRACURRICULAR_FEE">Extra</SelectItem>
                      <SelectItem value="EXAMINATION_FEE">
                        Examination
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Original Amount *
                  </Label>
                  <Input
                    type="number"
                    value={newFeeData.originalAmount || ""}
                    onChange={(e) =>
                      setNewFeeData({
                        ...newFeeData,
                        originalAmount: Number(e.target.value),
                      })
                    }
                    placeholder="Enter amount"
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Discount (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newFeeData.discountPercentage || ""}
                    onChange={(e) =>
                      setNewFeeData({
                        ...newFeeData,
                        discountPercentage: Math.min(
                          100,
                          Math.max(0, Number(e.target.value) || 0),
                        ),
                      })
                    }
                    placeholder="0"
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Due Date *</Label>
                  <MiniCalendar
                    value={
                      newFeeData.dueDate
                        ? convertADToBS(new Date(newFeeData.dueDate))
                        : undefined
                    }
                    onChange={(isoString) =>
                      setNewFeeData({ ...newFeeData, dueDate: isoString })
                    }
                    placeholder="Select due date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Academic Year *
                  </Label>
                  <Select
                    value={
                      newFeeData.academicYearId
                        ? String(newFeeData.academicYearId)
                        : ""
                    }
                    onValueChange={(value) =>
                      setNewFeeData({
                        ...newFeeData,
                        academicYearId: Number(value),
                      })
                    }
                  >
                    <SelectTrigger className="h-11 text-sm rounded-xl bg-white">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((ay) => (
                        <SelectItem
                          key={ay.academicYearId}
                          value={String(ay.academicYearId)}
                        >
                          {ay.academicYear}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(newFeeData.originalAmount || 0) > 0 && (
                <div className="p-4 rounded-xl bg-violet-50 border-2 border-violet-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">
                      Original
                    </p>
                    <p className="text-sm font-bold text-slate-600">
                      {formatCurrency(newFeeData.originalAmount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">
                      Discount
                    </p>
                    <p className="text-sm font-bold text-rose-500">
                      -
                      {formatCurrency(
                        ((newFeeData.originalAmount || 0) *
                          (newFeeData.discountPercentage || 0)) /
                          100,
                      )}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-violet-200 sm:pl-4">
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">
                      Net Fee Payable
                    </p>
                    <p className="text-lg font-black text-violet-700">
                      {formatCurrency(
                        (newFeeData.originalAmount || 0) *
                          (1 - (newFeeData.discountPercentage || 0) / 100),
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t" />

            <DialogFooter className="px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingFee(false);
                  setNewFeeData({
                    feeType: "MONTHLY_FEE",
                    originalAmount: 0,
                    discountPercentage: 0,
                    dueDate: "",
                    academicYearId: 0,
                  });
                }}
                className="rounded-xl text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const missing = [];
                  if (!newFeeData.originalAmount)
                    missing.push("Original Amount");
                  if (!newFeeData.dueDate) missing.push("Due Date");
                  if (!newFeeData.academicYearId) missing.push("Academic Year");
                  if (missing.length > 0) {
                    toast({
                      title: "Missing required fields",
                      description: `Please fill in: ${missing.join(", ")}`,
                      variant: "destructive",
                    });
                    return;
                  }
                  createStudentFee({
                    academicYearId: newFeeData.academicYearId,
                    data: {
                      originalAmount: newFeeData.originalAmount,
                      discountPercentage: newFeeData.discountPercentage || 0,
                      feeType: newFeeData.feeType,
                      dueDate: newFeeData.dueDate,
                    },
                  });
                }}
                className="rounded-xl text-sm font-medium w-full sm:w-auto"
              >
                Save Fee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Fee Dialog */}
        <Dialog
          open={editingFeeId !== null}
          onOpenChange={(open) => !open && setEditingFeeId(null)}
        >
          <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] rounded-2xl p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                  <Pencil className="h-4.5 w-4.5 text-white" />
                </div>
                Edit Fee Entry
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pl-[2.75rem]">
                Update existing fee details
              </DialogDescription>
            </DialogHeader>

            <div className="border-t" />

            <div className="px-6 py-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Fee Type</Label>
                  <Select
                    value={editingFeeData.feeType}
                    onValueChange={(value) =>
                      setEditingFeeData({
                        ...editingFeeData,
                        feeType: value as FeeTypes,
                      })
                    }
                  >
                    <SelectTrigger className="h-11 text-sm rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMISSION_FEE">Admission</SelectItem>
                      <SelectItem value="MONTHLY_FEE">Monthly</SelectItem>
                      <SelectItem value="ANNUAL_FEE">Annual</SelectItem>
                      <SelectItem value="EXTRACURRICULAR_FEE">Extra</SelectItem>
                      <SelectItem value="EXAMINATION_FEE">
                        Examination
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Original Amount
                  </Label>
                  <Input
                    type="number"
                    value={editingFeeData.originalAmount || ""}
                    onChange={(e) =>
                      setEditingFeeData({
                        ...editingFeeData,
                        originalAmount: Number(e.target.value),
                      })
                    }
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Discount (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editingFeeData.discountPercentage || ""}
                    onChange={(e) =>
                      setEditingFeeData({
                        ...editingFeeData,
                        discountPercentage: Math.min(
                          100,
                          Math.max(0, Number(e.target.value) || 0),
                        ),
                      })
                    }
                    className="h-11 text-sm rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Due Date</Label>
                  <MiniCalendar
                    value={
                      editingFeeData.dueDate
                        ? convertADToBS(new Date(editingFeeData.dueDate))
                        : undefined
                    }
                    onChange={(isoString) =>
                      setEditingFeeData({
                        ...editingFeeData,
                        dueDate: isoString,
                      })
                    }
                    placeholder="Select due date"
                  />
                </div>
              </div>

              {(editingFeeData.originalAmount || 0) > 0 && (
                <div className="p-4 rounded-xl bg-violet-50 border-2 border-violet-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">
                      Original
                    </p>
                    <p className="text-sm font-bold text-slate-600">
                      {formatCurrency(editingFeeData.originalAmount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">
                      Discount
                    </p>
                    <p className="text-sm font-bold text-rose-500">
                      -
                      {formatCurrency(
                        ((editingFeeData.originalAmount || 0) *
                          (editingFeeData.discountPercentage || 0)) /
                          100,
                      )}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-violet-200 sm:pl-4">
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">
                      Net Fee Payable
                    </p>
                    <p className="text-lg font-black text-violet-700">
                      {formatCurrency(
                        (editingFeeData.originalAmount || 0) *
                          (1 - (editingFeeData.discountPercentage || 0) / 100),
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t" />

            <DialogFooter className="px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingFeeId(null)}
                className="rounded-xl text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFee}
                className="rounded-xl text-sm font-medium w-full sm:w-auto"
              >
                Update Fee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Parent Confirmation */}
        <DeleteConfirmationDialog
          open={!!deleteParentDialog}
          onOpenChange={(open) => !open && setDeleteParentDialog(null)}
          title="Remove Parent?"
          description={
            <>
              This will permanently remove{" "}
              <strong>{deleteParentDialog?.name} </strong> from this
              student&apos;s record. This action cannot be undone.
            </>
          }
          confirmLabel="Remove"
          onConfirm={handleConfirmDeleteParent}
        />

        {/* Delete Fee Confirmation */}
        <DeleteConfirmationDialog
          open={!!deleteFeeDialog}
          onOpenChange={(open) => !open && setDeleteFeeDialog(null)}
          title="Delete Fee?"
          description={
            <>
              This will permanently remove the fee{" "}
              <strong>{deleteFeeDialog?.name}</strong> and all associated
              payments. This action cannot be undone.
            </>
          }
          onConfirm={handleConfirmDeleteFee}
        />

        {/* Delete Payment Confirmation */}
        <DeleteConfirmationDialog
          open={!!deletePaymentDialog}
          onOpenChange={(open) => !open && setDeletePaymentDialog(null)}
          title="Delete Payment?"
          description={
            <>
              This will permanently remove the payment of{" "}
              <strong>{deletePaymentDialog?.amount}</strong>. This action
              cannot be undone.
            </>
          }
          onConfirm={handleConfirmDeletePayment}
        />
      </div>
    </div>
  );
}
