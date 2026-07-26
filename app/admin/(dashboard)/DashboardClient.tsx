"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Calendar,
  Clock,
  DollarSign,
  Banknote,
  BookText,
  XCircle,
  UserX,
  ClipboardList,
  ClipboardCheck,
  Activity,
  FileText,
  UserPlus,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudents } from "@/lib/api/student";
import { getAllTeachers } from "@/lib/api/teacher";
import { getFeeStats, getOverdueStudents } from "@/lib/api/studentFee";
import { findAllFiltered } from "@/lib/api/diary";
import type {
  TeacherResponse,
  DiaryResponse,
  OverdueStudentResponse,
} from "@/types/lms";

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};
const today = todayStr();

const yesterdayDate = new Date(Date.now() - 86400000);
const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatCurrencyCompact = (amount: number) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
};

const getProgressColor = (rate: number) => {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 60) return "bg-amber-500";
  return "bg-red-500";
};

const getStatusColor = (rate: number) => {
  if (rate >= 80) return "text-emerald-600";
  if (rate >= 60) return "text-amber-600";
  return "text-red-600";
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getGradeColor = (grade: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> =
    {
      "10": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
      "9": { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
      "8": { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
      "7": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
      "6": { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
      "5": { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
      "4": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
      "3": { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
      "2": { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
      "1": { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
    };
  return (
    colors[grade] || { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" }
  );
};

// ── Activity icon/color map ──
const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  student: UserPlus,
  attendance: ClipboardList,
  diary: BookText,
  fee: Receipt,
  teacher: Users,
  section: Layers,
  system: Settings,
};

const ACTIVITY_COLORS: Record<string, string> = {
  student: "text-blue-600",
  attendance: "text-amber-600",
  diary: "text-primary",
  fee: "text-emerald-600",
  teacher: "text-orange-600",
  section: "text-violet-600",
  system: "text-slate-600",
};

const ACTIVITY_BGS: Record<string, string> = {
  student: "bg-blue-100",
  attendance: "bg-amber-100",
  diary: "bg-primary/10",
  fee: "bg-emerald-100",
  teacher: "bg-orange-100",
  section: "bg-violet-100",
  system: "bg-slate-100",
};

// ─────────────────────────────────────────────
//  Mock data
// ─────────────────────────────────────────────

const MOCK_ATTENDANCE = {
  totalSections: 18,
  markedSections: 12,
  unmarkedSections: [
    { id: 1, grade: "10", name: "A", teacher: "Sarah Smith", period: "1st" },
    { id: 2, grade: "9", name: "B", teacher: "Mike Johnson", period: "2nd" },
    { id: 3, grade: "8", name: "A", teacher: "Emma Wilson", period: "3rd" },
    { id: 4, grade: "7", name: "C", teacher: "Rajesh Sharma", period: "4th" },
    { id: 5, grade: "6", name: "B", teacher: "Priya Patel", period: "5th" },
    { id: 6, grade: "10", name: "C", teacher: "David Thapa", period: "6th" },
  ],
};

const MOCK_SECTIONS_WITHOUT_DIARY = [
  { id: 1, grade: "10", name: "A" },
  { id: 2, grade: "9", name: "B" },
  { id: 3, grade: "8", name: "A" },
  { id: 4, grade: "7", name: "C" },
  { id: 5, grade: "6", name: "B" },
];

const MOCK_STUDENTS_WITHOUT_PARENTS = 45;

const MOCK_TEACHER_ATTENDANCE_PENDING = [
  {
    teacherName: "Sarah Smith",
    pendingSections: [
      { grade: "10", name: "A" },
      { grade: "10", name: "B" },
    ],
  },
  {
    teacherName: "Mike Johnson",
    pendingSections: [{ grade: "9", name: "B" }],
  },
  {
    teacherName: "Emma Wilson",
    pendingSections: [
      { grade: "8", name: "A" },
      { grade: "8", name: "C" },
    ],
  },
  {
    teacherName: "Rajesh Sharma",
    pendingSections: [{ grade: "7", name: "C" }],
  },
  {
    teacherName: "Priya Patel",
    pendingSections: [{ grade: "6", name: "B" }],
  },
];

const MOCK_TEACHER_DIARY_PENDING = [
  {
    teacherName: "Anita Gurung",
    pendingSections: [
      { grade: "10", name: "A" },
      { grade: "9", name: "A" },
    ],
  },
  {
    teacherName: "David Thapa",
    pendingSections: [{ grade: "9", name: "B" }],
  },
  {
    teacherName: "Emma Wilson",
    pendingSections: [{ grade: "8", name: "A" }],
  },
  {
    teacherName: "Suman Rai",
    pendingSections: [
      { grade: "7", name: "C" },
      { grade: "7", name: "A" },
    ],
  },
];

const MOCK_RECENT_PAYMENTS = [
  { studentName: "Anita Kumari", amount: 3200, time: "2 hrs ago" },
  { studentName: "Rohan Thapa", amount: 15000, time: "3 hrs ago" },
  { studentName: "Sita KC", amount: 4500, time: "4 hrs ago" },
];

interface ActivityEntry {
  id: number;
  action: string;
  detail: string;
  user: string;
  time: string;
  type:
    | "student"
    | "attendance"
    | "diary"
    | "fee"
    | "teacher"
    | "section"
    | "system";
}

const MOCK_ACTIVITY: ActivityEntry[] = [
  {
    id: 1,
    action: "New student enrolled",
    detail: "Rahul Sharma joined Grade 10-A",
    user: "Admin",
    time: "12 min ago",
    type: "student",
  },
  {
    id: 2,
    action: "Attendance marked",
    detail: "Grade 9-B · Science · 28/30 present",
    user: "Mike Johnson",
    time: "25 min ago",
    type: "attendance",
  },
  {
    id: 3,
    action: "Diary entry posted",
    detail: "Math · Algebra: Linear Equations",
    user: "Sarah Smith",
    time: "40 min ago",
    type: "diary",
  },
  {
    id: 4,
    action: "Fee payment recorded",
    detail: "Priya K. · ₹3,200 · Monthly Fee",
    user: "Accountant",
    time: "1 hr ago",
    type: "fee",
  },
  {
    id: 5,
    action: "Teacher assignment updated",
    detail: "Emma Wilson → Grade 8-A Class Teacher",
    user: "Admin",
    time: "1 hr ago",
    type: "teacher",
  },
  {
    id: 6,
    action: "Diary entry posted",
    detail: "Science · Chemical Reactions Lab",
    user: "Rajesh Sharma",
    time: "1 hr ago",
    type: "diary",
  },
  {
    id: 7,
    action: "Attendance marked",
    detail: "Grade 10-A · English · 26/30 present",
    user: "Sarah Smith",
    time: "2 hr ago",
    type: "attendance",
  },
  {
    id: 8,
    action: "New student enrolled",
    detail: "Sita KC joined Grade 8-A",
    user: "Admin",
    time: "2 hr ago",
    type: "student",
  },
  {
    id: 9,
    action: "Fee payment recorded",
    detail: "Rahul S. · ₹4,500 · Annual Fee",
    user: "Accountant",
    time: "3 hr ago",
    type: "fee",
  },
  {
    id: 10,
    action: "Section created",
    detail: "Grade 6-C added to Academic Year 2083",
    user: "Admin",
    time: "4 hr ago",
    type: "section",
  },
  {
    id: 11,
    action: "Bulk upload completed",
    detail: "15 students added to Grade 9-B · 2 failures",
    user: "Admin",
    time: "5 hr ago",
    type: "system",
  },
  {
    id: 12,
    action: "Diary entry posted",
    detail: "Nepali · Poetry: Mero Desh",
    user: "Anita Gurung",
    time: "5 hr ago",
    type: "diary",
  },
];

const MOCK_WEEKLY_DIARY_TREND = [
  { day: "Mon", count: 18 },
  { day: "Tue", count: 22 },
  { day: "Wed", count: 15 },
  { day: "Thu", count: 24 },
  { day: "Fri", count: 12 },
];

const MOCK_WEEKLY_ATTENDANCE = [
  { day: "Mon", marked: 16, total: 18 },
  { day: "Tue", marked: 18, total: 18 },
  { day: "Wed", marked: 14, total: 18 },
  { day: "Thu", marked: 17, total: 18 },
  { day: "Fri", marked: 12, total: 18 },
];

// ─────────────────────────────────────────────
//  Data fetching hooks
// ─────────────────────────────────────────────

const useStudentUnassignedCount = () =>
  useQuery({
    queryKey: ["dashboard", "unassigned-students"],
    queryFn: async () => {
      const res = await getStudents({
        hasSectionAssignment: false,
        pageSize: 1,
        pageNum: 1,
      });
      return res.totalElements;
    },
  });

const useTeachers = () =>
  useQuery({
    queryKey: ["dashboard", "teachers"],
    queryFn: () => getAllTeachers(),
  });

const useFeeStatsData = () =>
  useQuery({
    queryKey: ["dashboard", "fee-stats"],
    queryFn: () => getFeeStats(),
  });

const useOverdueData = () =>
  useQuery({
    queryKey: ["dashboard", "overdue"],
    queryFn: () => getOverdueStudents(),
  });

const useDiaryToday = () =>
  useQuery({
    queryKey: ["dashboard", "diary-today"],
    queryFn: () =>
      findAllFiltered({
        startDate: today,
        endDate: today,
        pageSize: 4,
        pageNum: 1,
      }),
  });

const useDiaryYesterday = () =>
  useQuery({
    queryKey: ["dashboard", "diary-yesterday"],
    queryFn: () =>
      findAllFiltered({
        startDate: yesterdayStr,
        endDate: yesterdayStr,
        pageSize: 1,
        pageNum: 1,
      }),
  });

// ─────────────────────────────────────────────
//  Skeleton components
// ─────────────────────────────────────────────

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div className={cn("bg-slate-200 rounded animate-pulse", className)} />
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card animate-pulse p-4 sm:p-5",
        className,
      )}
    >
      <SkeletonBar className="h-4 w-28 mb-3" />
      <SkeletonBar className="h-8 w-20 mb-2" />
      <SkeletonBar className="h-3 w-36" />
    </div>
  );
}

// ─────────────────────────────────────────────
//  Compact Alert Cell (for alert grid)
// ─────────────────────────────────────────────

function AlertCell({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subtext,
  actionLabel,
  onClick,
  isGood = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  subtext?: string;
  actionLabel?: string;
  onClick?: () => void;
  isGood?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-2.5 p-3 sm:p-3.5 text-left transition-colors w-full",
        isGood ? "bg-emerald-50/60" : "hover:bg-slate-50",
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
          isGood ? "bg-emerald-100" : iconBg,
        )}
      >
        {isGood ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Icon className={cn("h-3.5 w-3.5", iconColor)} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </p>
        <p
          className={cn(
            "text-base sm:text-lg font-bold leading-tight mt-0.5",
            isGood ? "text-emerald-700" : "text-foreground",
          )}
        >
          {isGood ? "All clear" : value}
        </p>
        {subtext && !isGood && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {subtext}
          </p>
        )}
        {actionLabel && !isGood && (
          <p className="text-[11px] font-medium text-primary mt-0.5 flex items-center gap-0.5">
            {actionLabel} <ChevronRight className="h-3 w-3" />
          </p>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
//  Progress Bar
// ─────────────────────────────────────────────

function ProgressBar({
  value,
  color,
  height = "h-2",
  className,
}: {
  value: number;
  color: string;
  height?: string;
  className?: string;
}) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className={cn(
        "bg-slate-100 rounded-full overflow-hidden",
        height,
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  Mini Bar Chart (inline sparkline)
// ─────────────────────────────────────────────

function MiniBarChart({
  data,
  color,
}: {
  data: { day: string; count: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1">
      {data.map((d) => (
        <div
          key={d.day}
          className="flex flex-col items-center flex-1 gap-0.5"
        >
          <div
            className={cn("w-full max-w-[16px] rounded-sm", color)}
            style={{ height: `${Math.max((d.count / max) * 20, 2)}px` }}
            title={`${d.day}: ${d.count}`}
          />
          <span className="text-[9px] text-muted-foreground leading-none">
            {d.day}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Diary Entry Row
// ─────────────────────────────────────────────

function DiaryEntryRow({ entry }: { entry: DiaryResponse }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0">
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <BookText className="h-3 w-3 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {entry.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {entry.subjectName} · {entry.grade}-{entry.sectionName} ·{" "}
          {entry.teacherName}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Overdue Student Row
// ─────────────────────────────────────────────

function OverdueStudentRow({
  student,
  onClick,
}: {
  student: OverdueStudentResponse;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[9px] font-bold text-red-600">
            {getInitials(student.studentName)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {student.studentName}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Grade {student.grade}-{student.sectionName}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className="text-sm font-bold text-red-600">
          {formatCurrencyCompact(student.overdueAmount)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Due{" "}
          {new Date(student.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
//  Activity Row
// ─────────────────────────────────────────────

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const Icon = ACTIVITY_ICONS[entry.type] || FileText;
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-slate-50 last:border-0">
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
          ACTIVITY_BGS[entry.type],
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", ACTIVITY_COLORS[entry.type])} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{entry.action}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {entry.detail}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {entry.user} · {entry.time}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Section Chip (for inline missing-section lists)
// ─────────────────────────────────────────────

function SectionChip({
  grade,
  name,
}: {
  grade: string;
  name: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
      <XCircle className="h-2.5 w-2.5" />
      {grade}-{name}
    </span>
  );
}

// ─────────────────────────────────────────────
//  Teacher Pending Row (for combined completion card)
// ─────────────────────────────────────────────

function TeacherPendingRow({
  teacherName,
  pendingSections,
  accentBg,
  accentColor,
  chipBg,
  chipText,
  chipBorder,
}: {
  teacherName: string;
  pendingSections: { grade: string; name: string }[];
  accentBg: string;
  accentColor: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
}) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          accentBg,
        )}
      >
        <span className={cn("text-[8px] font-bold", accentColor)}>
          {getInitials(teacherName)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{teacherName}</p>
        <div className="flex flex-wrap gap-1 mt-0.5">
          {pendingSections.map((sec) => (
            <span
              key={`${sec.grade}-${sec.name}`}
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5 border",
                chipBg,
                chipText,
                chipBorder,
              )}
            >
              <Clock className="h-3 w-3" />
              {sec.grade}-{sec.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Quick Link (compact)
// ─────────────────────────────────────────────

function QuickLink({
  label,
  icon: Icon,
  iconBg,
  iconColor,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 hover:shadow-sm hover:border-slate-300 transition-all text-left active:bg-slate-50"
    >
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
          iconBg,
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", iconColor)} />
      </div>
      <p className="text-xs font-medium text-foreground">{label}</p>
    </button>
  );
}

// ═════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════

export default function DashboardClient() {
  const router = useRouter();

  // Data
  const { data: unassignedStudents, isLoading: loadingUnassigned } =
    useStudentUnassignedCount();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const { data: feeStats, isLoading: loadingFee } = useFeeStatsData();
  const { data: overdue = [], isLoading: loadingOverdue } = useOverdueData();
  const { data: diaryToday, isLoading: loadingDiaryToday } = useDiaryToday();
  const { data: diaryYesterday, isLoading: loadingDiaryYesterday } =
    useDiaryYesterday();

  const isLoading = loadingUnassigned || loadingTeachers || loadingFee;
  const isLoadingDiary = loadingDiaryToday || loadingDiaryYesterday;

  // Derived
  const unassignedTeacherCount = useMemo(
    () =>
      teachers.filter(
        (t: TeacherResponse) =>
          (t.assignmentResponse?.subjectsTaught ?? 0) === 0,
      ).length,
    [teachers],
  );

  const collectionRate =
    feeStats && feeStats.totalNeeded > 0
      ? Math.round((feeStats.totalCollected / feeStats.totalNeeded) * 100)
      : 0;

  const diaryTodayCount = diaryToday?.totalElements ?? 0;
  const diaryYesterdayCount = diaryYesterday?.totalElements ?? 0;
  const diaryChange = diaryTodayCount - diaryYesterdayCount;

  const attendanceRate = Math.round(
    (MOCK_ATTENDANCE.markedSections / MOCK_ATTENDANCE.totalSections) * 100,
  );

  const topOverdue = useMemo(
    () =>
      [...(overdue as OverdueStudentResponse[])]
        .sort((a, b) => b.overdueAmount - a.overdueAmount)
        .slice(0, 5),
    [overdue],
  );

  // ─── RENDER ───

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1600px] mx-auto">
      {/* ───────────────────────────────────── */}
      {/*  Header                               */}
      {/* ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
      </div>

      {/* ═════════════════════════════════════ */}
      {/*  ROW 1: Alert Panel (single card,    */}
      {/*  internal 2×2 grid)                  */}
      {/* ═════════════════════════════════════ */}
      {isLoading ? (
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2.5 animate-pulse">
                <SkeletonBar className="h-7 w-7 rounded-lg" />
                <div className="flex-1">
                  <SkeletonBar className="h-3 w-24 mb-1" />
                  <SkeletonBar className="h-5 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <AlertCell
              icon={UserX}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              label="Unassigned Students"
              value={unassignedStudents ?? 0}
              subtext={
                unassignedStudents && unassignedStudents > 0
                  ? "Not placed in any section"
                  : undefined
              }
              actionLabel={
                unassignedStudents && unassignedStudents > 0
                  ? "Place students"
                  : undefined
              }
              isGood={unassignedStudents === 0}
              onClick={() => router.push("/admin/students")}
            />
            <AlertCell
              icon={UserX}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              label="Unassigned Teachers"
              value={unassignedTeacherCount}
              subtext={
                unassignedTeacherCount > 0
                  ? "No subjects or classes"
                  : undefined
              }
              actionLabel={
                unassignedTeacherCount > 0 ? "Assign teachers" : undefined
              }
              isGood={unassignedTeacherCount === 0}
              onClick={() => router.push("/admin/teachers")}
            />
            <AlertCell
              icon={Users}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
              label="Students w/o Parents"
              value={MOCK_STUDENTS_WITHOUT_PARENTS}
              subtext="No parent linked to account"
              actionLabel="Link parents"
              isGood={false}
              onClick={() => router.push("/admin/students")}
            />
            <AlertCell
              icon={AlertTriangle}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              label="Overdue Fees"
              value={
                feeStats
                  ? formatCurrencyCompact(feeStats.totalOverdue)
                  : "—"
              }
              subtext={
                feeStats && feeStats.overdueStudents > 0
                  ? `${feeStats.overdueStudents} students overdue`
                  : undefined
              }
              actionLabel={
                feeStats && feeStats.overdueStudents > 0
                  ? "Collect fees"
                  : undefined
              }
              isGood={feeStats ? feeStats.overdueStudents === 0 : false}
              onClick={() => router.push("/admin/fees")}
            />
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════ */}
      {/*  ROW 2: Fee Collection (65/35)       */}
      {/* ═════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4 sm:gap-5">
        {/* ─── Collection Overview ─── */}
        {loadingFee ? (
          <CardSkeleton className="lg:col-span-1" />
        ) : (
          <div className="rounded-xl border bg-card shadow-sm flex flex-col">
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                Fee Collection Overview
              </h2>
              <button
                onClick={() => router.push("/admin/fees")}
                className="ml-auto text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
              >
                Details <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="px-4 sm:px-5 py-4 flex-1 flex flex-col">
              {/* Rate + bar */}
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className={cn(
                    "text-3xl font-bold",
                    getStatusColor(collectionRate),
                  )}
                >
                  {collectionRate}%
                </span>
                <span className="text-sm text-muted-foreground">collected</span>
              </div>
              <ProgressBar
                value={collectionRate}
                color={getProgressColor(collectionRate)}
                height="h-2"
                className="mb-4"
              />

              {/* Amounts - compact 4-col */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Expected
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {formatCurrencyCompact(feeStats?.totalNeeded ?? 0)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider">
                    Collected
                  </p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">
                    {formatCurrencyCompact(feeStats?.totalCollected ?? 0)}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-amber-600 uppercase tracking-wider">
                    Pending
                  </p>
                  <p className="text-sm font-bold text-amber-700 mt-0.5">
                    {formatCurrencyCompact(
                      (feeStats?.totalNeeded ?? 0) -
                        (feeStats?.totalCollected ?? 0) -
                        (feeStats?.totalOverdue ?? 0),
                    )}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-red-600 uppercase tracking-wider">
                    Overdue
                  </p>
                  <p className="text-sm font-bold text-red-700 mt-0.5">
                    {formatCurrencyCompact(feeStats?.totalOverdue ?? 0)}
                  </p>
                </div>
              </div>

              {/* Payment status - inline legend beside bar */}
              {feeStats && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 transition-all"
                          style={{
                            width: `${(feeStats.paidStudents / feeStats.totalStudents) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-blue-500 transition-all"
                          style={{
                            width: `${(feeStats.partialStudents / feeStats.totalStudents) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-amber-500 transition-all"
                          style={{
                            width: `${(feeStats.unpaidStudents / feeStats.totalStudents) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-red-500 transition-all"
                          style={{
                            width: `${(feeStats.overdueStudents / feeStats.totalStudents) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Paid {feeStats.paidStudents}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Partial {feeStats.partialStudents}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Unpaid {feeStats.unpaidStudents}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Overdue {feeStats.overdueStudents}
                    </span>
                  </div>
                </div>
              )}

              {/* Recent Payments */}
              <div className="mt-auto pt-3 border-t border-slate-100">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Recent Payments
                </p>
                <div className="space-y-1.5">
                  {MOCK_RECENT_PAYMENTS.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">
                          {p.studentName}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-sm font-semibold text-emerald-600">
                          {formatCurrencyCompact(p.amount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          {p.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Overdue Students ─── */}
        {loadingOverdue ? (
          <CardSkeleton />
        ) : (
          <div className="rounded-xl border bg-card shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  Top Overdue
                </h2>
              </div>
              <button
                onClick={() => router.push("/admin/fees")}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="px-3 py-2 flex-1">
              {topOverdue.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No overdue fees
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {topOverdue.map((s: OverdueStudentResponse) => (
                    <OverdueStudentRow
                      key={`${s.studentId}-${s.feeType}`}
                      student={s}
                      onClick={() =>
                        router.push(
                          `/admin/students/${s.studentId}?tab=fees`,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════ */}
      {/*  ROW 3: Today's Operations (50/50)  */}
      {/* ═════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* ─── Attendance Status ─── */}
        <div className="rounded-xl border bg-card shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Today&apos;s Attendance
              </h2>
              <p className="text-[11px] text-muted-foreground">{today}</p>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-4 flex-1 flex flex-col">
            {/* Stat + MiniBarChart (matching classwork style) */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {MOCK_ATTENDANCE.markedSections}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {MOCK_ATTENDANCE.totalSections} sections
                </span>
              </div>
              <MiniBarChart
                data={MOCK_WEEKLY_ATTENDANCE.map((d) => ({
                  day: d.day,
                  count: d.marked,
                }))}
                color="bg-blue-300"
              />
            </div>

            <ProgressBar
              value={attendanceRate}
              color={getProgressColor(attendanceRate)}
              height="h-2"
              className="mb-3"
            />

            {/* Detailed rows for first 3 unmarked sections */}
            {MOCK_ATTENDANCE.unmarkedSections.length > 0 && (
              <div className="space-y-0.5 mb-3">
                {MOCK_ATTENDANCE.unmarkedSections.slice(0, 3).map((sec) => {
                  const gc = getGradeColor(sec.grade);
                  return (
                    <div
                      key={sec.id}
                      className="flex items-center gap-2 py-1.5"
                    >
                      <span
                        className={cn(
                          "text-[11px] font-bold rounded px-1.5 py-0.5 whitespace-nowrap",
                          gc.bg,
                          gc.text,
                        )}
                      >
                        {sec.grade}-{sec.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {sec.teacher} · {sec.period} Period
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending attendance at bottom with divider (matching classwork style) */}
            {MOCK_ATTENDANCE.unmarkedSections.length > 0 && (
              <div className="mt-auto pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                    {MOCK_ATTENDANCE.unmarkedSections.length} pending
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {MOCK_ATTENDANCE.unmarkedSections.map((sec) => (
                    <SectionChip
                      key={sec.id}
                      grade={sec.grade}
                      name={sec.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Today's Diary Activity ─── */}
        <div className="rounded-xl border bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Today&apos;s Classwork
                </h2>
                <p className="text-[11px] text-muted-foreground">{today}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/admin/sections")}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {isLoadingDiary ? (
            <div className="p-5 space-y-3">
              <SkeletonBar className="h-6 w-24" />
              {[1, 2, 3].map((i) => (
                <SkeletonBar key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="px-4 sm:px-5 py-4 flex-1 flex flex-col">
              {/* Count + change + sparkline */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      {diaryTodayCount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      entries
                    </span>
                  </div>
                  {diaryChange !== 0 && (
                    <div
                      className={cn(
                        "flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full",
                        diaryChange > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600",
                      )}
                    >
                      <TrendingUp
                        className={cn(
                          "h-3 w-3",
                          diaryChange < 0 && "rotate-180",
                        )}
                      />
                      {Math.abs(diaryChange)}
                    </div>
                  )}
                </div>
                <MiniBarChart
                  data={MOCK_WEEKLY_DIARY_TREND}
                  color="bg-primary/60"
                />
              </div>

              {/* Recent entries */}
              {(diaryToday?.content ?? []).length > 0 ? (
                <div className="mb-3">
                  {(diaryToday?.content ?? [])
                    .slice(0, 3)
                    .map((entry: DiaryResponse) => (
                      <DiaryEntryRow key={entry.diaryId} entry={entry} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <BookText className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-sm text-muted-foreground">
                    No diary entries today
                  </p>
                </div>
              )}

              {/* Missing classwork - inline chips */}
              {MOCK_SECTIONS_WITHOUT_DIARY.length > 0 && (
                <div className="mt-auto pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                      {MOCK_SECTIONS_WITHOUT_DIARY.length} no classwork
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {MOCK_SECTIONS_WITHOUT_DIARY.map((sec) => (
                      <SectionChip
                        key={sec.id}
                        grade={sec.grade}
                        name={sec.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/*  ROW 4: Teacher Completion (single card, 2-col)   */}
      {/* ════════════════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <ClipboardList className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Teacher Completion Status
            </h2>
            <p className="text-[11px] text-muted-foreground">{today}</p>
          </div>
          <button
            onClick={() => router.push("/admin/teachers")}
            className="ml-auto text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            View all teachers <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Attendance Pending Column */}
          <div className="px-4 sm:px-5 py-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-foreground">
                Attendance Pending
              </span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">
                {MOCK_TEACHER_ATTENDANCE_PENDING.length}
              </span>
            </div>
            {MOCK_TEACHER_ATTENDANCE_PENDING.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  All attendance marked
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {MOCK_TEACHER_ATTENDANCE_PENDING.map((teacher) => (
                  <TeacherPendingRow
                    key={teacher.teacherName}
                    teacherName={teacher.teacherName}
                    pendingSections={teacher.pendingSections}
                    accentBg="bg-amber-100"
                    accentColor="text-amber-700"
                    chipBg="bg-amber-50"
                    chipText="text-amber-700"
                    chipBorder="border-amber-200"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Diary Pending Column */}
          <div className="px-4 sm:px-5 py-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <ClipboardCheck className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-foreground">
                Diary Pending
              </span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full px-1.5 py-0.5">
                {MOCK_TEACHER_DIARY_PENDING.length}
              </span>
            </div>
            {MOCK_TEACHER_DIARY_PENDING.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  All diary entries posted
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {MOCK_TEACHER_DIARY_PENDING.map((teacher) => (
                  <TeacherPendingRow
                    key={teacher.teacherName}
                    teacherName={teacher.teacherName}
                    pendingSections={teacher.pendingSections}
                    accentBg="bg-blue-100"
                    accentColor="text-blue-700"
                    chipBg="bg-blue-50"
                    chipText="text-blue-700"
                    chipBorder="border-blue-200"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════ */}
      {/*  ROW 5: Recent Activity (full width) */}
      {/* ═════════════════════════════════════ */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-slate-600" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              Recent Activity
            </h2>
          </div>
          <button className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-1">
          {MOCK_ACTIVITY.slice(0, 8).map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}