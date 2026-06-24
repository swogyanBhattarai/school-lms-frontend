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
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
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
import { StudentDetailSkeleton } from "@/app/_components/skeletons/StudentDetailSkeleton";
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
      <Badge className="text-[9px] uppercase font-bold text-slate-400 border-slate-200 px-2 py-0.5">
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
  const studentId = Number(params.studentId);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    enabled: Number.isFinite(studentId),
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: academicYearKeys.all,
    queryFn: getAcademicYears,
  });

  // Default fee academic year filter to the active academic year
  useEffect(() => {
    if (selectedFeeAcademicYearId === null && academicYears.length > 0) {
      const active = academicYears.find((ay) => ay.isActive);
      if (active) {
        setSelectedFeeAcademicYearId(active.academicYearId);
        setDefaultFeeYearId(active.academicYearId);
      }
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

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Eye },
    { id: "parents" as TabType, label: "Parents", icon: Users },
    { id: "academic" as TabType, label: "Academic", icon: GraduationCap },
    { id: "attendance" as TabType, label: "Attendance", icon: Calendar },
    { id: "fees" as TabType, label: "Fees", icon:  NepaliRupee },
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
              onClick={() => {
                /* Export action */
              }}
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
                        <MiniCalendar
                          value={
                            editedDOB
                              ? convertADToBS(new Date(editedDOB))
                              : undefined
                          }
                          onChange={(isoString) => setEditedDOB(isoString)}
                          placeholder="Select date of birth"
                          className="bg-white/80 rounded-xl border-slate-200 w-full sm:w-auto"
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
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                          {studentName}
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-slate-600">
                          {isStudentActive && (
                            <span className="flex items-center gap-1.5 font-semibold px-2 sm:px-2.5 py-1 bg-white/80 rounded-lg">
                              <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="whitespace-nowrap">
                                Class {studentData?.schoolClassName} • Section{" "}
                                {studentData?.sectionName}
                              </span>
                            </span>
                          )}
                          <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="font-semibold text-xs sm:text-sm">
                            ID: #{String(studentId).padStart(5, "0")}
                          </span>
                          <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="font-semibold text-xs sm:text-sm">
                            DOB:{" "}
                            {studentData?.dateOfBirth
                              ? formatDate(studentData.dateOfBirth)
                              : "-"}
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
                        : "bg-amber-100 text-amber-700 border-amber-200",
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
                const active = tabs.find((t) => t.id === activeTab);
                const Icon = active?.icon;
                return Icon ? <Icon className="h-4 w-4" /> : null;
              })()}
              {tabs.find((t) => t.id === activeTab)?.label}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-slate-400 transition-transform",
                mobileMenuOpen && "rotate-180",
              )}
            />
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
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
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
        <div className="hidden sm:flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-lg shadow-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
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
                  value: isAttendanceSummaryLoading
                    ? "..."
                    : hasAttendanceData
                      ? `${attendanceStats.percentage}%`
                      : "—",
                  color: "emerald",
                  subtext: `${attendanceStats.present}/${attendanceStats.total} days present`,
                },
                {
                  icon: BookOpen,
                  label: "Subjects",
                  value: subjectCount,
                  color: "violet",
                  subtext: "Enrolled",
                },
                {
                  icon: NepaliRupee,
                  label: "Fee Status",
                  value:
                    feeStats.totalRemaining > 0
                      ? formatCurrency(feeStats.totalRemaining)
                      : "Paid",
                  color: feeStats.totalRemaining > 0 ? "amber" : "emerald",
                  subtext: `${formatCurrency(feeStats.totalPaid)} paid of ${formatCurrency(feeStats.totalExpected)}`,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 md:p-5 transition-all hover:shadow-lg"
                >
                  <div
                    className={cn(
                      "absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 rounded-bl-[2rem] sm:rounded-bl-[3rem] -mr-4 sm:-mr-6 -mt-4 sm:-mt-6 opacity-[0.03]",
                      stat.color === "emerald" && "bg-emerald-500",
                      stat.color === "blue" && "bg-blue-500",
                      stat.color === "violet" && "bg-violet-500",
                      stat.color === "amber" && "bg-amber-500",
                    )}
                  />
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                        stat.color === "emerald" &&
                          "bg-emerald-500/10 text-emerald-600",
                        stat.color === "blue" && "bg-blue-500/10 text-blue-600",
                        stat.color === "violet" &&
                          "bg-violet-500/10 text-violet-600",
                        stat.color === "amber" &&
                          "bg-amber-500/10 text-amber-600",
                      )}
                    >
                      <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-1">
                    {stat.subtext}
                  </p>
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
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
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
          </>
        )}

        {activeTab === "parents" && (
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3 sm:mb-0">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Parent / Guardian Management
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Manage parent information and contact details
                  </p>
                </div>
                {/* Desktop Add Button */}
                <Button
                  onClick={() => {
                    setIsAddingParent(true);
                    setEditingParentIndex(null);
                  }}
                  className="hidden sm:inline-flex gap-2 rounded-xl text-sm"
                  disabled={isAddingParent}
                >
                  <Plus className="h-4 w-4" />
                  Add Parent
                </Button>
              </div>
              {/* Mobile Add Button - Full width below header */}
              <Button
                onClick={() => {
                  setIsAddingParent(true);
                  setEditingParentIndex(null);
                }}
                className="sm:hidden gap-2 rounded-xl text-sm w-full justify-center"
                disabled={isAddingParent}
              >
                <Plus className="h-4 w-4" />
                Add Parent
              </Button>
            </div>

            <div className="p-4 sm:p-6">
              {isAddingParent && (
                <div className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-violet-50 border-2 border-violet-200 animate-in slide-in-from-top-2">
                  <h4 className="font-bold text-violet-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                    New Parent Details
                  </h4>
                  <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newParent.parentName}
                        onChange={(e) =>
                          setNewParent({
                            ...newParent,
                            parentName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                        placeholder="Parent full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Phone *
                      </label>
                      <input
                        type="text"
                        value={newParent.parentNumber}
                        onChange={(e) =>
                          setNewParent({
                            ...newParent,
                            parentNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                        placeholder="Phone number"
                      />
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
                  <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-slate-500 font-bold text-sm">
                      No parents added yet
                    </p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      Tap "Add Parent" to add a guardian
                    </p>
                  </div>
                ) : (
                  editedParents.map((parent, index) => (
                    <div
                      key={index}
                      className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-300 active:bg-slate-50 sm:active:bg-white"
                    >
                      {editingParentIndex === index ? (
                        <div className="p-4 sm:p-5">
                          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Name
                              </label>
                              <input
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
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Phone
                              </label>
                              <input
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
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                              />
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
                        <div className="relative">
                          {/* Main card content - tappable for edit on mobile */}
                          <div
                            className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer sm:cursor-default"
                            onClick={() => {
                              // On mobile, tap the card to edit
                              if (window.innerWidth < 640) {
                                handleEditParent(index);
                              }
                            }}
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
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

                            {/* Desktop action buttons */}
                            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditParent(index);
                                }}
                                className="h-9 w-9 rounded-xl hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4 text-slate-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteParentDialog({
                                    index,
                                    name: parent.parentName,
                                  });
                                }}
                                className="h-9 w-9 rounded-xl hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>

                            {/* Mobile swipe/action indicator */}
                            <ChevronRight className="h-5 w-5 text-slate-300 sm:hidden flex-shrink-0" />
                          </div>

                          {/* Mobile action buttons - swipeable or bottom sheet style */}
                          <div className="sm:hidden flex border-t border-slate-100 divide-x divide-slate-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditParent(index);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteParentDialog({
                                  index,
                                  name: parent.parentName,
                                });
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
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
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Enrolled Subjects
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Current academic term subjects and teachers
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {classAssignments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                    <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-slate-500 font-bold text-sm">
                      No subjects assigned
                    </p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      Assign subjects to this student
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {classAssignments.map((assignment) => (
                      <div
                        key={assignment.classAssignmentId}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-white hover:border-violet-200 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
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
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Daily Diary
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Daily diary entries for the student&apos;s section
                </p>
              </div>
              <div className="p-4 sm:p-6">
                {diaryLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-32 sm:h-36 bg-muted rounded-xl" />
                    <div className="h-32 sm:h-36 bg-muted rounded-xl" />
                  </div>
                ) : diaryEntries.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-violet-100 mx-auto flex items-center justify-center mb-2 sm:mb-3">
                      <BookMarked className="h-6 w-6 sm:h-7 sm:w-7 text-violet-600" />
                    </div>
                    <p className="text-slate-500 font-bold text-sm sm:text-base">
                      No diary entries
                    </p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      Diary entries will appear here once created
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    {diaryEntries.map((entry) => (
                      <div
                        key={entry.diaryId}
                        className="rounded-xl border border-slate-200 bg-white hover:border-violet-200 hover:shadow-md transition-all group flex flex-col h-full"
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/admin/sections/${sectionId}#diary`,
                                )
                              }
                              className="text-[11px] sm:text-xs rounded-lg h-8 sm:h-9 px-3 text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Attendance Overview
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Comprehensive attendance analytics (Read-only)
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Select
                      value={selectedSubjectId}
                      onValueChange={setSelectedSubjectId}
                    >
                      <SelectTrigger className="w-full sm:w-[150px] h-8 sm:h-9 rounded-xl text-xs sm:text-sm">
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
                    <div className="relative w-full sm:w-auto">
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
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubjectId("all");
                        const bs = getTodayBS();
                        setSelectedNavYear(bs.year);
                        setSelectedNavMonth(bs.month);
                      }}
                      className="w-full sm:w-auto shrink-0 gap-1.5 rounded-xl text-xs sm:text-sm h-8 sm:h-9"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {isAttendanceSummaryLoading ? (
                  <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 animate-pulse">
                    <div className="lg:col-span-5 h-64 bg-muted rounded-xl" />
                    <div className="lg:col-span-7 space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded-xl" />
                      ))}
                    </div>
                  </div>
                ) : !hasAttendanceData ? (
                  <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                    <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-slate-500 font-bold text-sm">
                      No attendance data
                    </p>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
                    <div className="lg:col-span-5 flex flex-col items-center">
                      <div className="sm:hidden">
                        <AnimatedPieChart
                          percentage={attendanceStats.percentage}
                          size={160}
                          strokeWidth={14}
                        />
                      </div>
                      <div className="hidden sm:block">
                        <AnimatedPieChart
                          percentage={attendanceStats.percentage}
                          size={200}
                          strokeWidth={16}
                        />
                      </div>
                      <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-center text-slate-500 font-semibold">
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
                              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
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
                                "p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center",
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
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Daily Attendance Record
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
                        className="w-[calc(50%-0.5rem)] sm:w-[150px] p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center hover:border-violet-200 transition-all"
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
          </div>
        )}

        {activeTab === "fees" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Fee Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 md:p-5 transition-all hover:shadow-lg"
                >
                  <div
                    className={cn(
                      "absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 rounded-bl-[2rem] sm:rounded-bl-[3rem] -mr-4 sm:-mr-6 -mt-4 sm:-mt-6 opacity-[0.03]",
                      stat.color === "emerald" && "bg-emerald-500",
                      stat.color === "violet" && "bg-violet-500",
                      stat.color === "amber" && "bg-amber-500",
                      stat.color === "red" && "bg-red-500",
                    )}
                  />
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                        stat.color === "emerald" &&
                          "bg-emerald-500/10 text-emerald-600",
                        stat.color === "violet" &&
                          "bg-violet-500/10 text-violet-600",
                        stat.color === "amber" &&
                          "bg-amber-500/10 text-amber-600",
                        stat.color === "red" && "bg-red-500/10 text-red-600",
                      )}
                    >
                      <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-1">
                    {stat.subtext}
                  </p>
                </div>
              ))}
            </div>

            {/* Fee Management */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Fee Management
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Manage student fees, payments, and track dues
                  </p>
                </div>
                {/* Mobile: centered dropdowns + full-width Clear/Add Fee */}
                <div className="flex flex-col items-center gap-2 w-full sm:hidden">
                  <div className="flex justify-center gap-2 w-full">
                    <Select
                      value={
                        selectedFeeAcademicYearId !== null &&
                        selectedFeeAcademicYearId !== -1
                          ? String(selectedFeeAcademicYearId)
                          : "ALL"
                      }
                      onValueChange={(v) =>
                        setSelectedFeeAcademicYearId(
                          v === "ALL" ? -1 : Number(v),
                        )
                      }
                    >
                      <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs">
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
                      onValueChange={(v) =>
                        setFeeFilter(v as FeeStatus | "ALL")
                      }
                    >
                      <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs">
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
                  </div>
                  {selectedFeeAcademicYearId !== defaultFeeYearId ||
                  feeFilter !== "ALL" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFeeAcademicYearId(defaultFeeYearId);
                        setFeeFilter("ALL");
                      }}
                      className="w-full h-9 rounded-xl text-xs font-medium"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Clear Filters
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => {
                      setIsAddingFee(true);
                      setEditingFeeId(null);
                    }}
                    className="gap-2 rounded-xl text-xs w-full"
                    size="sm"
                    disabled={isAddingFee}
                  >
                    <Plus className="h-4 w-4" />
                    Add Fee
                  </Button>
                </div>
                {/* Desktop: inline row */}
                <div className="hidden sm:flex items-center gap-2">
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
                    <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs">
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
                    <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs">
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
                  {selectedFeeAcademicYearId !== defaultFeeYearId ||
                  feeFilter !== "ALL" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFeeAcademicYearId(defaultFeeYearId);
                        setFeeFilter("ALL");
                      }}
                      className="h-9 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Clear
                    </Button>
                  ) : null}
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
                    <div className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                      <NepaliRupee className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
                      <p className="text-slate-500 font-bold text-sm">
                        No fees recorded
                      </p>
                      <p className="text-slate-400 text-xs sm:text-sm mt-1">
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
                      const isEditing = editingFeeId === fee.studentFeeId;

                      return (
                        <div
                          key={fee.studentFeeId}
                          className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-300"
                        >
                          <div
                            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer"
                            onClick={() => toggleFee(fee.studentFeeId)}
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
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
                              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 space-y-3">
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
                                  {/* Fee Actions - Different for Mobile and Desktop */}
                                  <div className="flex items-center gap-1">
                                    {/* Mobile: Text buttons */}
                                    <div className="flex sm:hidden items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditFee(fee.studentFeeId);
                                        }}
                                        className="h-8 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-200 px-2"
                                      >
                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteFeeDialog({
                                            id: fee.studentFeeId,
                                            name: formatCurrency(fee.netFee),
                                          });
                                        }}
                                        className="h-8 rounded-lg text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                    {/* Desktop: Icon buttons with hover effects */}
                                    <div className="hidden sm:flex items-center gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditFee(fee.studentFeeId);
                                        }}
                                        className="h-9 w-9 rounded-lg hover:bg-slate-200 hover:shadow-sm transition-all"
                                      >
                                        <Pencil className="h-4 w-4 text-slate-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteFeeDialog({
                                            id: fee.studentFeeId,
                                            name: formatCurrency(fee.netFee),
                                          });
                                        }}
                                        className="h-9 w-9 rounded-lg hover:bg-red-100 hover:shadow-sm transition-all"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
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
                                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg sm:rounded-xl bg-white border border-slate-100"
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
                                          {/* Action Buttons - Different for Mobile and Desktop */}
                                          <div className="flex items-center gap-2 self-stretch sm:self-center">
                                            {/* Mobile: Text buttons centered */}
                                            <div className="flex sm:hidden items-center gap-1 w-full border-t border-slate-100 pt-2 mt-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleEditPayment(
                                                    fee.studentFeeId,
                                                    payment,
                                                  )
                                                }
                                                className="flex-1 h-8 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                              >
                                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                                Edit
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
                                                className="flex-1 h-8 rounded-lg text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                Delete
                                              </Button>
                                            </div>
                                            {/* Desktop: Icon buttons with better visibility */}
                                            <div className="hidden sm:flex items-center gap-0.5">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleEditPayment(
                                                    fee.studentFeeId,
                                                    payment,
                                                  )
                                                }
                                                className="h-9 w-9 rounded-lg hover:bg-slate-200 hover:shadow-sm transition-all"
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
                                                className="h-9 w-9 rounded-lg hover:bg-red-100 hover:shadow-sm transition-all"
                                              >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </div>
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
          </div>
        )}

        {activeTab === "documents" && (
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Documents & Records
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
              <div className="text-center py-12 sm:py-16 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-slate-500 font-bold text-base sm:text-lg">
                  No documents uploaded
                </p>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Upload student documents, certificates, and records
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Edit Dialog */}
        <Dialog
          open={!!editingPaymentInfo}
          onOpenChange={(open) => !open && setEditingPaymentInfo(null)}
        >
          <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <DialogHeader className="text-left">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Pencil className="h-4 w-4 text-violet-600" />
                  </div>
                  Edit Payment Record
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500">
                  Update payment details
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Amount Paid
                  </label>
                  <input
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Paid By
                  </label>
                  <input
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Payment Type
                  </label>
                  <select
                    value={editingPaymentInfo?.payment.paymentType || "CASH"}
                    onChange={(e) =>
                      setEditingPaymentInfo({
                        ...editingPaymentInfo!,
                        payment: {
                          ...editingPaymentInfo!.payment,
                          paymentType: e.target.value as PaymentType,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ESEWA">eSewa</option>
                    <option value="KHALTI">Khalti</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Payment Date
                  </label>
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

            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingPaymentInfo(null)}
                className="flex-1 rounded-xl h-10 sm:h-11 font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePaymentUpdate}
                className="flex-1 rounded-xl h-10 sm:h-11 bg-violet-600 hover:bg-violet-700 font-bold"
              >
                Update Payment
              </Button>
            </div>
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
          <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <DialogHeader className="text-left">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-violet-600" />
                  </div>
                  Record Payment
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500">
                  Add a new payment record for this fee
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={newPaymentData.amountPaid || ""}
                    onChange={(e) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        amountPaid: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Paid By *
                  </label>
                  <input
                    type="text"
                    value={newPaymentData.paidBy}
                    onChange={(e) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        paidBy: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                    placeholder="Payer name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newPaymentData.phoneNumber}
                    onChange={(e) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Payment Type
                  </label>
                  <select
                    value={newPaymentData.paymentType}
                    onChange={(e) =>
                      setNewPaymentData({
                        ...newPaymentData,
                        paymentType: e.target.value as PaymentType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ESEWA">eSewa</option>
                    <option value="KHALTI">Khalti</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Payment Date
                  </label>
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

            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRecordPaymentDialogOpen(false);
                  setRecordPaymentFeeId(null);
                }}
                className="flex-1 rounded-xl h-10 sm:h-11 font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPayment}
                disabled={!newPaymentData.amountPaid || !newPaymentData.paidBy}
                className="flex-1 rounded-xl h-10 sm:h-11 bg-violet-600 hover:bg-violet-700 font-bold"
              >
                Save Payment
              </Button>
            </div>
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
          <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] rounded-2xl p-0 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <DialogHeader className="text-left">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  New Fee Entry
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500">
                  Record a new fee requirement for this student
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Fee Type *
                  </label>
                  <select
                    value={newFeeData.feeType}
                    onChange={(e) =>
                      setNewFeeData({
                        ...newFeeData,
                        feeType: e.target.value as FeeTypes,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                  >
                    <option value="ADMISSION_FEE">Admission</option>
                    <option value="MONTHLY_FEE">Monthly</option>
                    <option value="ANNUAL_FEE">Annual</option>
                    <option value="EXTRACURRICULAR_FEE">Extra</option>
                    <option value="EXAMINATION_FEE">Examination</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Original Amount *
                  </label>
                  <input
                    type="number"
                    value={newFeeData.originalAmount || ""}
                    onChange={(e) =>
                      setNewFeeData({
                        ...newFeeData,
                        originalAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Discount (%)
                  </label>
                  <input
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Due Date *
                  </label>
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
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Academic Year *
                  </label>
                  <select
                    value={newFeeData.academicYearId}
                    onChange={(e) =>
                      setNewFeeData({
                        ...newFeeData,
                        academicYearId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                  >
                    <option value={0} disabled>
                      Select year
                    </option>
                    {academicYears.map((ay) => (
                      <option key={ay.academicYearId} value={ay.academicYearId}>
                        {ay.academicYear}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(newFeeData.originalAmount || 0) > 0 && (
                <div className="p-3 sm:p-4 rounded-xl bg-violet-50 border-2 border-violet-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
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

            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
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
                className="flex-1 rounded-xl h-10 sm:h-11 font-bold"
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
                className="flex-1 rounded-xl h-10 sm:h-11 font-bold"
              >
                Save Fee
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Fee Dialog */}
        <Dialog
          open={editingFeeId !== null}
          onOpenChange={(open) => !open && setEditingFeeId(null)}
        >
          <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] rounded-2xl p-0 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <DialogHeader className="text-left">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Pencil className="h-4 w-4 text-white" />
                  </div>
                  Edit Fee Entry
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500">
                  Update existing fee details
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Fee Type
                  </label>
                  <select
                    value={editingFeeData.feeType}
                    onChange={(e) =>
                      setEditingFeeData({
                        ...editingFeeData,
                        feeType: e.target.value as FeeTypes,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none bg-white"
                  >
                    <option value="ADMISSION_FEE">Admission</option>
                    <option value="MONTHLY_FEE">Monthly</option>
                    <option value="ANNUAL_FEE">Annual</option>
                    <option value="EXTRACURRICULAR_FEE">Extra</option>
                    <option value="EXAMINATION_FEE">Examination</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Original Amount
                  </label>
                  <input
                    type="number"
                    value={editingFeeData.originalAmount || ""}
                    onChange={(e) =>
                      setEditingFeeData({
                        ...editingFeeData,
                        originalAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Discount (%)
                  </label>
                  <input
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Due Date
                  </label>
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
                <div className="p-3 sm:p-4 rounded-xl bg-violet-50 border-2 border-violet-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
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

            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingFeeId(null)}
                className="flex-1 rounded-xl h-10 sm:h-11 font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFee}
                className="flex-1 rounded-xl h-10 sm:h-11 font-bold"
              >
                Update Fee
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Parent Confirmation */}
        <AlertDialog
          open={!!deleteParentDialog}
          onOpenChange={(open) => !open && setDeleteParentDialog(null)}
        >
          <AlertDialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl">
            <AlertDialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-base sm:text-lg">
                  Remove Parent?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
                This will permanently remove{" "}
                <strong>{deleteParentDialog?.name} </strong> from this
                student&apos;s record. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="border-t my-2" />
            <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
              <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteParent}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Fee Confirmation */}
        <AlertDialog
          open={!!deleteFeeDialog}
          onOpenChange={(open) => !open && setDeleteFeeDialog(null)}
        >
          <AlertDialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl">
            <AlertDialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-base sm:text-lg">
                  Delete Fee?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
                This will permanently remove the fee{" "}
                <strong>{deleteFeeDialog?.name}</strong> and all associated
                payments. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="border-t my-2" />
            <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
              <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteFee}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Payment Confirmation */}
        <AlertDialog
          open={!!deletePaymentDialog}
          onOpenChange={(open) => !open && setDeletePaymentDialog(null)}
        >
          <AlertDialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl">
            <AlertDialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-base sm:text-lg">
                  Delete Payment?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
                This will permanently remove the payment of{" "}
                <strong>{deletePaymentDialog?.amount}</strong>. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="border-t my-2" />
            <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
              <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeletePayment}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
