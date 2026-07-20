"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  GraduationCap,
  CalendarDays,
  BookOpen,
  Users,
  BarChart3,
  BookMarked,
  RotateCcw,
  AlertCircle,
  FlaskConical,
  Globe,
  Cpu,
  Grid3X3,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";

/* ──────────── Types ──────────── */
interface SubjectInfo {
  subjectId: number;
  subjectName: string;
  teacherName: string;
  role: string;
  color: string;
  icon: "grid" | "flask" | "book" | "globe" | "cpu";
}

interface ParentInfo {
  name: string;
  role: string;
  phone?: string;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  leave: number;
  total: number;
  percentage: number;
}

interface SubjectAttendance {
  subjectName: string;
  present: number;
  total: number;
  percentage: number;
}

interface DiaryEntry {
  diaryId: number;
  subject: string;
  teacher: string;
  title: string;
  content: string;
  color: string;
}

interface DailyAttendanceRecord {
  subjectId: number;
  subjectName: string;
  teacherName: string;
  status: "PRESENT" | "ABSENT" | "LEAVE" | "NOT_TAKEN" | undefined;
}

/* ──────────── Mock Data ──────────── */
const MOCK_SUBJECTS: SubjectInfo[] = [
  { subjectId: 1, subjectName: "Mathematics", teacherName: "Rajan Koirala", role: "Subject Teacher", color: "#4E6E8E", icon: "grid" },
  { subjectId: 2, subjectName: "Science", teacherName: "Sabina Rai", role: "Subject Teacher", color: "#4C7A5E", icon: "flask" },
  { subjectId: 3, subjectName: "English", teacherName: "Priya Thapa", role: "Class Teacher", color: "#B14A3F", icon: "book" },
  { subjectId: 4, subjectName: "Nepali", teacherName: "Deepak Shrestha", role: "Subject Teacher", color: "#C67E1B", icon: "book" },
  { subjectId: 5, subjectName: "Social Studies", teacherName: "Anita Gurung", role: "Subject Teacher", color: "#7A5C9E", icon: "globe" },
  { subjectId: 6, subjectName: "Computer", teacherName: "Nabin Bhattarai", role: "Subject Teacher", color: "#3E8E8E", icon: "cpu" },
];

const MOCK_PARENTS: ParentInfo[] = [
  { name: "Bijay Sharma", role: "Father", phone: "9841234567" },
  { name: "Sunita Sharma", role: "Mother", phone: "9851234567" },
];

const MOCK_STUDENT = {
  studentName: "Aarohi Sharma",
  schoolClassName: "6",
  sectionName: "Gold",
  dateOfBirth: "2016-03-14",
  rollNumber: 14,
  isActive: true,
};

const MOCK_MONTHS = [
  {
    label: "Kartik 2082",
    startOffset: 5,
    days: 29,
    pattern: "p p p p p a p p p p h p p l p p p a p p h p p p p p p p p".split(" "),
  },
  {
    label: "Poush 2082",
    startOffset: 2,
    days: 30,
    pattern: "p p p p h a p p p l p h p p p p p a p p h p p p p p f f f f".split(" "),
  },
  {
    label: "Magh 2082",
    startOffset: 4,
    days: 29,
    pattern: Array(29).fill("f"),
  },
];

const MOCK_SUBJECT_ATTENDANCE: SubjectAttendance[] = [
  { subjectName: "Mathematics", present: 23, total: 24, percentage: 96 },
  { subjectName: "Science", present: 20, total: 24, percentage: 83 },
  { subjectName: "English", present: 24, total: 24, percentage: 100 },
  { subjectName: "Nepali", present: 19, total: 24, percentage: 79 },
  { subjectName: "Social Studies", present: 22, total: 24, percentage: 92 },
  { subjectName: "Computer", present: 21, total: 24, percentage: 88 },
];

const MOCK_DIARY: Record<string, DiaryEntry[]> = {
  "0": [
    {
      diaryId: 1,
      subject: "Science",
      teacher: "Sabina Rai",
      title: "States of matter",
      content:
        "Read pages 44\u201348 and complete the diagram of the water cycle for tomorrow\u2019s class. Bring colour pencils.",
      color: "#4C7A5E",
    },
    {
      diaryId: 2,
      subject: "Mathematics",
      teacher: "Rajan Koirala",
      title: "Practice set \u2014 fractions",
      content:
        "Finish exercise 4.3, questions 1 to 12. Quiz on fractions expected next week.",
      color: "#4E6E8E",
    },
  ],
  "-1": [
    {
      diaryId: 3,
      subject: "English",
      teacher: "Priya Thapa",
      title: "Grammar \u2014 reported speech",
      content:
        "Copied notes on reported speech. Worksheet to be submitted on Thursday.",
      color: "#B14A3F",
    },
  ],
  "-2": [],
  "1": [
    {
      diaryId: 4,
      subject: "Nepali",
      teacher: "Deepak Shrestha",
      title: "\u0915\u0935\u093F\u0924\u093E \u0935\u093E\u091A\u0928",
      content:
        "\u0915\u0915\u094D\u0937\u093E\u092E\u093E \u0915\u0935\u093F\u0924\u093E \u0935\u093E\u091A\u0928 \u0917\u0930\u093F\u092F\u094B\u0964 \u0918\u0930\u092E\u093E \u0915\u0935\u093F\u0924\u093E \u0915\u0923\u094D\u0920\u0938\u094D\u0925 \u092A\u093E\u0930\u094D\u0928\u0941\u0964",
      color: "#C67E1B",
    },
  ],
};

const MOCK_DAILY_ATTENDANCE: DailyAttendanceRecord[] = [
  { subjectId: 1, subjectName: "Mathematics", teacherName: "Rajan Koirala", status: "PRESENT" },
  { subjectId: 2, subjectName: "Science", teacherName: "Sabina Rai", status: "PRESENT" },
  { subjectId: 3, subjectName: "English", teacherName: "Priya Thapa", status: "PRESENT" },
  { subjectId: 4, subjectName: "Nepali", teacherName: "Deepak Shrestha", status: "ABSENT" },
  { subjectId: 5, subjectName: "Social Studies", teacherName: "Anita Gurung", status: "PRESENT" },
  { subjectId: 6, subjectName: "Computer", teacherName: "Nabin Bhattarai", status: "NOT_TAKEN" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const TODAY_DAY = 20;
const BASE_DATE = new Date(2026, 6, 20);

/* ──────────── Helpers ──────────── */
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

function hexToSoft(hex: string, alpha = "18"): string {
  return hex + alpha;
}

function barColor(pct: number): string {
  if (pct >= 90) return "var(--sage, #4C7A5E)";
  if (pct >= 75) return "var(--marigold-deep, #C67E1B)";
  return "var(--brick, #B14A3F)";
}

function formatDateAD(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ──────────── Icon map ──────────── */
function SubjectIcon({ type, className }: { type: string; className?: string }) {
  const props = { className: cn("w-5 h-5", className) };
  switch (type) {
    case "grid":
      return <Grid3X3 {...props} />;
    case "flask":
      return <FlaskConical {...props} />;
    case "globe":
      return <Globe {...props} />;
    case "cpu":
      return <Cpu {...props} />;
    default:
      return <BookOpen {...props} />;
  }
}

/* ──────────── Status Badge ──────────── */
function AttendanceStatusPill({ status }: { status: string | undefined }) {
  if (!status || status === "NOT_TAKEN")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint,#9BA3AF)] bg-[var(--paper-deep,#F1E7D4)] px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-faint,#9BA3AF)]" />
        Not Taken
      </span>
    );

  const map: Record<string, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
    PRESENT: { label: "Present", dotColor: "var(--sage,#4C7A5E)", textColor: "var(--sage,#4C7A5E)", bgColor: "var(--sage-soft,#E3EEE6)" },
    ABSENT: { label: "Absent", dotColor: "var(--brick,#B14A3F)", textColor: "var(--brick,#B14A3F)", bgColor: "var(--brick-soft,#F5E2DF)" },
    LEAVE: { label: "Leave", dotColor: "var(--marigold-deep,#C67E1B)", textColor: "var(--marigold-deep,#C67E1B)", bgColor: "var(--marigold-soft,#FBEACD)" },
  };
  const c = map[status] ?? map.PRESENT;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ color: c.textColor, background: c.bgColor }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dotColor }} />
      {c.label}
    </span>
  );
}

/* ──────────── Animated Ring Chart ──────────── */
function RingChart({ percentage, size = 180, stroke = 14 }: { percentage: number; size?: number; stroke?: number }) {
  const [offset, setOffset] = useState(0);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = circ - (circ * percentage) / 100;

  useEffect(() => {
    const t = setTimeout(() => setOffset(target), 120);
    return () => clearTimeout(t);
  }, [target]);

  const color =
    percentage >= 90 ? "var(--sage,#4C7A5E)" : percentage >= 75 ? "var(--marigold-deep,#C67E1B)" : "var(--brick,#B14A3F)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-soft,#EFE6D2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-slate-900" style={{ fontSize: size * 0.22 }}>
          {percentage}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint,#9BA3AF)]">Attendance</span>
      </div>
    </div>
  );
}

/* ──────────── Calendar Cell ──────────── */
function CalCell({
  day,
  code,
  isToday,
}: {
  day: number;
  code: string;
  isToday: boolean;
}) {
  const statusMap: Record<string, string> = {
    p: "present",
    a: "absent",
    l: "leave",
    h: "holiday",
    f: "future",
  };
  const cls = statusMap[code] ?? "future";
  const dotColors: Record<string, string> = {
    present: "var(--sage,#4C7A5E)",
    absent: "var(--brick,#B14A3F)",
    leave: "var(--marigold-deep,#C67E1B)",
  };

  if (code === "h") {
    return (
      <div
        className={cn(
          "aspect-square rounded-[10px] flex flex-col items-center justify-center font-mono text-[11px]",
          "text-[var(--ink-faint,#9BA3AF)]",
          "bg-[repeating-linear-gradient(135deg,var(--paper-deep,#F1E7D4),var(--paper-deep,#F1E7D4)_4px,var(--line-soft,#EFE6D2)_4px,var(--line-soft,#EFE6D2)_5px)]"
        )}
      >
        {day}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "aspect-square rounded-[10px] flex flex-col items-center justify-center font-mono text-[11px] transition-transform duration-100",
        "bg-[var(--paper-deep,#F1E7D4)] text-[var(--ink-soft,#667081)]",
        cls === "future" && "opacity-50",
        isToday && "border-2 border-[var(--marigold,#E39A2D)] shadow-[0_0_0_3px_var(--marigold-soft,#FBEACD)] font-bold !text-[var(--ink,#23303D)]",
        "hover:scale-105 cursor-default"
      )}
    >
      {day}
      {dotColors[cls] && <span className="w-[6px] h-[6px] rounded-full mt-[2px]" style={{ background: dotColors[cls] }} />}
    </div>
  );
}

/* ──────────── Main Component ──────────── */
export default function ParentStudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  /* State */
  const [monthIdx, setMonthIdx] = useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [dayOffset, setDayOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "classwork" | "subjects">("overview");

  /* Derived */
  const studentName = MOCK_STUDENT.studentName;
  const studentInitials = getInitials(studentName);
  const currentMonth = MOCK_MONTHS[monthIdx];

  const summaryStats: AttendanceSummary = useMemo(() => {
    const p = currentMonth.pattern.filter((c) => c === "p").length;
    const a = currentMonth.pattern.filter((c) => c === "a").length;
    const l = currentMonth.pattern.filter((c) => c === "l").length;
    const t = p + a + l;
    return { present: p, absent: a, leave: l, total: t, percentage: t > 0 ? Math.round((p / t) * 100) : 0 };
  }, [currentMonth]);

  const diaryDate = useMemo(() => {
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const diaryEntries = useMemo(() => {
    return MOCK_DIARY[String(dayOffset)] ?? [];
  }, [dayOffset]);

  const subjectPerformance = useMemo(() => {
    if (selectedSubjectId !== "all") {
      const found = MOCK_SUBJECT_ATTENDANCE.find((s) => s.subjectName === selectedSubjectId);
      return found ? [found] : [];
    }
    return MOCK_SUBJECT_ATTENDANCE;
  }, [selectedSubjectId]);

  const filteredDailyAttendance = useMemo(() => {
    if (selectedSubjectId === "all") return MOCK_DAILY_ATTENDANCE;
    return MOCK_DAILY_ATTENDANCE.filter(
      (d) => d.subjectName === selectedSubjectId
    );
  }, [selectedSubjectId]);

  const glanceDots = useMemo(() => {
    const seq = [
      "present", "present", "present", "present", "present", "absent",
      "present", "present", "present", "present", "holiday", "present",
      "present", "leave", "present", "present", "present", "absent",
      "present", "present", "holiday", "present", "present", "present",
    ];
    const dotColors: Record<string, string> = {
      present: "var(--sage,#4C7A5E)",
      absent: "var(--brick,#B14A3F)",
      leave: "var(--marigold,#E39A2D)",
      holiday: "var(--line,#E6D9BE)",
    };
    return seq;
  }, []);

  const tabItems = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "attendance" as const, label: "Attendance", icon: CalendarDays },
    { id: "classwork" as const, label: "Classwork", icon: BookOpen },
    { id: "subjects" as const, label: "Subjects & Teachers", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen pb-16 sm:pb-20" style={{ background: "var(--paper, #FAF4E8)", backgroundImage: "radial-gradient(circle at 1px 1px, rgba(35,48,61,0.035) 1px, transparent 0)", backgroundSize: "22px 22px" }}>
      <style>{`
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-custom { font-family: 'IBM Plex Mono', monospace; }
        ::selection { background: var(--marigold-soft, #FBEACD); color: var(--marigold-deep, #C67E1B); }
      `}</style>

      <div className="max-w-[980px] mx-auto px-4 sm:px-5 pt-4 sm:pt-5">
        {/* ──── Top Bar ──── */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-none cursor-pointer text-[var(--ink-soft,#667081)] hover:text-[var(--ink,#23303D)] hover:bg-[rgba(35,48,61,0.05)] font-semibold text-[13px] sm:text-[13.5px] py-2 px-2.5 sm:px-3 rounded-full transition-colors duration-150"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to my children</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div className="flex items-center gap-2 font-mono-custom text-[10.5px] sm:text-[11px] tracking-[0.06em] uppercase text-[var(--ink-faint,#9BA3AF)]">
            <span className="w-[6px] h-[6px] rounded-full bg-[var(--marigold,#E39A2D)]" />
            GyanJyoti School
          </div>
        </div>

        {/* ──── Hero Card ──── */}
        <div
          className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] p-5 sm:p-6 md:p-7 mb-5 sm:mb-6"
          style={{
            background: "var(--paper-card, #FFFDF8)",
            border: "1px solid var(--line, #E6D9BE)",
            boxShadow: "0 1px 2px rgba(35,48,61,0.04), 0 10px 26px -14px rgba(35,48,61,0.18)",
          }}
        >
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-[5px] opacity-90" style={{ background: "linear-gradient(90deg, var(--marigold,#E39A2D), var(--sage,#4C7A5E) 60%, var(--sky,#4E6E8E))" }} />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 md:gap-6">
            {/* Avatar */}
            <div
              className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-[18px] sm:rounded-[22px] flex items-center justify-center flex-shrink-0 font-display font-semibold text-[24px] sm:text-[28px] text-white"
              style={{
                background: "linear-gradient(150deg, var(--marigold,#E39A2D), #D6892A 55%, var(--brick,#B14A3F))",
                boxShadow: "0 8px 30px -12px rgba(196,126,27,0.35)",
              }}
            >
              {studentInitials}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0 w-full">
              <p className="font-mono-custom text-[10.5px] sm:text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--marigold-deep,#C67E1B)] mb-1">
                Report Book
              </p>
              <h1
                className="font-display font-semibold text-[clamp(24px,4.5vw,34px)] leading-[1.05] text-[var(--ink,#23303D)] mb-2 sm:mb-2.5"
              >
                {studentName}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-2.5">
                <span
                  className="inline-flex items-center gap-1.5 text-[11.5px] sm:text-[12.5px] font-semibold px-2.5 sm:px-3 py-1.5 sm:py-[6px] rounded-full"
                  style={{
                    background: "var(--sage-soft,#E3EEE6)",
                    color: "var(--sage,#4C7A5E)",
                  }}
                >
                  <GraduationCap className="w-[13px] h-[13px]" />
                  Class {MOCK_STUDENT.schoolClassName} · Section {MOCK_STUDENT.sectionName}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[11.5px] sm:text-[12.5px] font-semibold px-2.5 sm:px-3 py-1.5 sm:py-[6px] rounded-full border"
                  style={{
                    background: "var(--paper-deep,#F1E7D4)",
                    color: "var(--ink-soft,#667081)",
                    borderColor: "var(--line-soft,#EFE6D2)",
                  }}
                >
                  <CalendarDays className="w-[13px] h-[13px]" />
                  Born 14 Mar 2016
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[11.5px] sm:text-[12.5px] font-semibold px-2.5 sm:px-3 py-1.5 sm:py-[6px] rounded-full border"
                  style={{
                    background: "var(--paper-deep,#F1E7D4)",
                    color: "var(--ink-soft,#667081)",
                    borderColor: "var(--line-soft,#EFE6D2)",
                  }}
                >
                  <span className="font-mono-custom text-[11px]">#{MOCK_STUDENT.rollNumber}</span>
                  Roll No.
                </span>
              </div>

              {/* Note */}
              <p className="font-display italic font-normal text-[14px] sm:text-[15.5px] leading-[1.5] text-[var(--ink-soft,#667081)] mt-4 sm:mt-[18px] pt-3.5 sm:pt-4 border-t border-dashed" style={{ borderColor: "var(--line,#E6D9BE)" }}>
                Aarohi has been present for{" "}
                <b className="text-[var(--ink,#23303D)] font-semibold not-italic">{summaryStats.present} of {summaryStats.total}</b>{" "}
                school days this month and has{" "}
                <b className="text-[var(--ink,#23303D)] font-semibold not-italic">{diaryEntries.length} diary {diaryEntries.length === 1 ? "entry" : "entries"}</b>{" "}
                {diaryEntries.length > 0 ? "waiting for you today — take a look below." : "for today."}
              </p>
            </div>
          </div>
        </div>

        {/* ──── Tabs ──── */}
        <div className="flex gap-1.5 sm:gap-[6px] overflow-x-auto pb-0 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 sm:gap-[7px] font-semibold text-[12.5px] sm:text-[13.5px] py-2.5 sm:py-[11px] px-3 sm:px-4 rounded-t-[14px] cursor-pointer transition-all duration-150 relative border",
                activeTab === tab.id
                  ? "bg-[var(--paper-card,#FFFDF8)] text-[var(--ink,#23303D)] border-[var(--line,#E6D9BE)] border-b-transparent shadow-[0_-4px_14px_-8px_rgba(35,48,61,0.15)]"
                  : "bg-[var(--paper-deep,#F1E7D4)] text-[var(--ink-soft,#667081)] border-[var(--line-soft,#EFE6D2)] border-b-transparent hover:text-[var(--ink,#23303D)]"
              )}
              style={{ top: "1px" }}
            >
              <tab.icon
                className={cn(
                  "w-[15px] h-[15px]",
                  activeTab === tab.id ? "text-[var(--marigold-deep,#C67E1B)]" : "opacity-75"
                )}
              />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ──── Panel Shell ──── */}
        <div
          className="min-h-[340px] rounded-b-[20px] sm:rounded-b-[20px] rounded-tr-[20px] sm:rounded-tr-none overflow-hidden"
          style={{
            background: "var(--paper-card, #FFFDF8)",
            border: "1px solid var(--line, #E6D9BE)",
            boxShadow: "0 1px 2px rgba(35,48,61,0.04), 0 10px 26px -14px rgba(35,48,61,0.18)",
          }}
        >
          {/* ════════ OVERVIEW ════════ */}
          {activeTab === "overview" && (
            <div className="p-4 sm:p-5 md:p-6 animate-[fade_.35s_ease]">
              <div className="mb-5 sm:mb-6">
                <h3 className="font-display font-semibold text-[19px] sm:text-[21px] text-[var(--ink,#23303D)] mb-1">
                  This month at a glance
                </h3>
                <p className="text-[13px] sm:text-[13.5px] text-[var(--ink-soft,#667081)]">
                  A quick summary of how Aarohi&apos;s month is going.
                </p>
              </div>

              {/* Glance cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                {/* Attendance */}
                <div
                  className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:gap-0 rounded-[16px] sm:rounded-[18px] p-3 sm:p-4 border"
                  style={{ background: "var(--paper-deep,#F1E7D4)", borderColor: "var(--line-soft,#EFE6D2)" }}
                >
                  <div>
                    <div className="font-display font-bold text-[22px] sm:text-[26px] leading-none text-[var(--sage,#4C7A5E)]">
                      {summaryStats.percentage}%
                    </div>
                    <div className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.05em] font-semibold text-[var(--ink-faint,#9BA3AF)] mt-1.5 sm:mt-[6px]">
                      Attendance
                    </div>
                    <div className="text-[11.5px] sm:text-[12.5px] text-[var(--ink-soft,#667081)] mt-1">
                      {summaryStats.present} present · {summaryStats.absent} absent · {summaryStats.leave} leave
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-wrap gap-[3px] mt-2.5">
                    {glanceDots.map((d, i) => (
                      <span
                        key={i}
                        className="w-[7px] h-[7px] rounded-full"
                        style={{
                          background:
                            d === "present"
                              ? "var(--sage,#4C7A5E)"
                              : d === "absent"
                              ? "var(--brick,#B14A3F)"
                              : d === "leave"
                              ? "var(--marigold,#E39A2D)"
                              : "var(--line,#E6D9BE)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Subjects */}
                <div
                  className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start rounded-[16px] sm:rounded-[18px] p-3 sm:p-4 border"
                  style={{ background: "var(--paper-deep,#F1E7D4)", borderColor: "var(--line-soft,#EFE6D2)" }}
                >
                  <div>
                    <div className="font-display font-bold text-[22px] sm:text-[26px] leading-none text-[var(--marigold-deep,#C67E1B)]">
                      {MOCK_SUBJECTS.length}
                    </div>
                    <div className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.05em] font-semibold text-[var(--ink-faint,#9BA3AF)] mt-1.5 sm:mt-[6px]">
                      Subjects
                    </div>
                    <div className="text-[11.5px] sm:text-[12.5px] text-[var(--ink-soft,#667081)] mt-1">
                      Across {new Set(MOCK_SUBJECTS.map((s) => s.teacherName)).size} teachers this term
                    </div>
                  </div>
                </div>

                {/* Needs attention */}
                <div
                  className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start rounded-[16px] sm:rounded-[18px] p-3 sm:p-4 border"
                  style={{ background: "var(--paper-deep,#F1E7D4)", borderColor: "var(--line-soft,#EFE6D2)" }}
                >
                  <div>
                    <div className="font-display font-bold text-[22px] sm:text-[26px] leading-none text-[var(--brick,#B14A3F)]">
                      {summaryStats.absent}
                    </div>
                    <div className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.05em] font-semibold text-[var(--ink-faint,#9BA3AF)] mt-1.5 sm:mt-[6px]">
                      Needs attention
                    </div>
                    <div className="text-[11.5px] sm:text-[12.5px] text-[var(--ink-soft,#667081)] mt-1">
                      {summaryStats.absent} {summaryStats.absent === 1 ? "absence" : "absences"} this month
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's classwork preview */}
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-[15px] sm:text-[16px] font-semibold text-[var(--ink,#23303D)]">
                    Today&apos;s classwork
                  </h4>
                  <button
                    onClick={() => setActiveTab("classwork")}
                    className="bg-transparent border-none text-[var(--marigold-deep,#C67E1B)] font-semibold text-[12px] sm:text-[12.5px] cursor-pointer flex items-center gap-1 p-1 hover:underline"
                  >
                    Open classwork
                    <ChevronLeft className="w-3 h-3 rotate-180" />
                  </button>
                </div>
                {diaryEntries.length > 0 ? (
                  <div
                    className="flex gap-3 sm:gap-3.5 items-start rounded-[16px] sm:rounded-[18px] p-3.5 sm:p-4 border"
                    style={{
                      background: "var(--paper-deep,#F1E7D4)",
                      borderColor: "var(--line-soft,#EFE6D2)",
                    }}
                  >
                    <div
                      className="w-[38px] h-[38px] rounded-[11px] flex-shrink-0 flex items-center justify-center"
                      style={{ background: "var(--sky-soft,#E5ECF2)", color: "var(--sky,#4E6E8E)" }}
                    >
                      <FileText className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <span
                        className="inline-block text-[10.5px] sm:text-[11px] font-semibold px-2 py-[2px] rounded-full mb-1.5"
                        style={{ background: "var(--marigold-soft,#FBEACD)", color: "var(--marigold-deep,#C67E1B)" }}
                      >
                        {diaryEntries[0].subject}
                      </span>
                      <p className="font-bold text-[13.5px] sm:text-[14px] text-[var(--ink,#23303D)] mb-1 leading-tight">
                        {diaryEntries[0].title}
                      </p>
                      <p className="text-[12.5px] sm:text-[13px] text-[var(--ink-soft,#667081)] leading-[1.5]">
                        {diaryEntries[0].content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-center py-8 sm:py-10 rounded-[16px] sm:rounded-[18px] border-2 border-dashed"
                    style={{ background: "var(--paper-deep,#F1E7D4)", borderColor: "var(--line,#E6D9BE)" }}
                  >
                    <p className="font-bold text-[14px] sm:text-[14.5px] text-[var(--ink,#23303D)]">No classwork for today</p>
                    <p className="text-[12px] sm:text-[12.5px] text-[var(--ink-faint,#9BA3AF)] mt-1">Check back once teachers add notes.</p>
                  </div>
                )}
              </div>

              {/* Family on record */}
              <div>
                <h4 className="font-display text-[15px] sm:text-[16px] font-semibold text-[var(--ink,#23303D)] mb-3">
                  Family on record
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {MOCK_PARENTS.map((parent) => (
                    <div
                      key={parent.name}
                      className="flex items-center gap-2.5 sm:gap-3 rounded-[16px] sm:rounded-[18px] p-3 sm:p-3.5 border"
                      style={{
                        background: "var(--paper-deep,#F1E7D4)",
                        borderColor: "var(--line-soft,#EFE6D2)",
                      }}
                    >
                      <div
                        className="w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[12px]"
                        style={{ background: "var(--sage-soft,#E3EEE6)", color: "var(--sage,#4C7A5E)" }}
                      >
                        {getInitials(parent.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[12.5px] sm:text-[13px] text-[var(--ink,#23303D)]">{parent.name}</div>
                        <div className="font-mono-custom text-[10.5px] sm:text-[11.5px] text-[var(--ink-faint,#9BA3AF)]">
                          {parent.role}{parent.phone ? ` · ${parent.phone}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ ATTENDANCE ════════ */}
          {activeTab === "attendance" && (
            <div className="p-4 sm:p-5 md:p-6 animate-[fade_.35s_ease]">
              <div className="mb-5 sm:mb-6">
                <h3 className="font-display font-semibold text-[19px] sm:text-[21px] text-[var(--ink,#23303D)] mb-1">
                  Attendance
                </h3>
                <p className="text-[13px] sm:text-[13.5px] text-[var(--ink-soft,#667081)]">
                  Every school day this month, at a glance.
                </p>
              </div>

              {/* Subject filter */}
              <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
                {["all", ...MOCK_SUBJECTS.map((s) => s.subjectName)].map((name) => (
                  <button
                    key={name}
                    onClick={() => setSelectedSubjectId(name === "all" ? "all" : name)}
                    className={cn(
                      "font-semibold text-[11.5px] sm:text-[12.5px] px-3 sm:px-[13px] py-1.5 sm:py-[7px] rounded-full cursor-pointer transition-all duration-150 border",
                      selectedSubjectId === name
                        ? "bg-[var(--ink,#23303D)] text-[var(--paper,#FAF4E8)] border-[var(--ink,#23303D)]"
                        : "bg-[var(--paper-deep,#F1E7D4)] text-[var(--ink-soft,#667081)] border-[var(--line-soft,#EFE6D2)] hover:border-[var(--marigold,#E39A2D)] hover:text-[var(--ink,#23303D)]"
                    )}
                  >
                    {name === "all" ? "All subjects" : name}
                  </button>
                ))}
              </div>

              {/* Calendar card */}
              <div
                className="relative rounded-[16px] sm:rounded-[18px] p-4 sm:p-[18px] border mb-5 sm:mb-6"
                style={{
                  background: "var(--paper-card, #FFFDF8)",
                  borderColor: "var(--line, #E6D9BE)",
                }}
              >
                {/* Calendar ring decorations */}
                <div className="absolute top-0 left-0 right-0 flex justify-center gap-5 sm:gap-[26px]" style={{ transform: "translateY(-9px)" }}>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="w-[10px] h-[10px] rounded-full"
                      style={{
                        background: "var(--paper, #FAF4E8)",
                        border: "2.5px solid var(--line, #E6D9BE)",
                      }}
                    />
                  ))}
                </div>

                {/* Calendar nav */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display italic font-medium text-[17px] sm:text-[19px] text-[var(--ink,#23303D)]">
                    {currentMonth.label}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setMonthIdx(Math.max(0, monthIdx - 1))}
                      className="w-[30px] h-[30px] rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150"
                      style={{
                        background: "var(--paper-deep,#F1E7D4)",
                        borderColor: "var(--line-soft,#EFE6D2)",
                        color: "var(--ink-soft,#667081)",
                      }}
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-[15px] h-[15px]" />
                    </button>
                    <button
                      onClick={() => setMonthIdx(Math.min(MOCK_MONTHS.length - 1, monthIdx + 1))}
                      className="w-[30px] h-[30px] rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150"
                      style={{
                        background: "var(--paper-deep,#F1E7D4)",
                        borderColor: "var(--line-soft,#EFE6D2)",
                        color: "var(--ink-soft,#667081)",
                      }}
                      aria-label="Next month"
                    >
                      <ChevronLeft className="w-[15px] h-[15px] rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-[6px]">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="text-center font-mono-custom text-[10px] sm:text-[10.5px] font-medium text-[var(--ink-faint,#9BA3AF)] pb-1.5 sm:pb-[6px]">
                      {w}
                    </div>
                  ))}
                  {Array.from({ length: currentMonth.startOffset }).map((_, i) => (
                    <div key={`e-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: currentMonth.days }).map((_, i) => {
                    const day = i + 1;
                    const code = currentMonth.pattern[i] ?? "f";
                    const isToday = currentMonth.label === "Poush 2082" && day === TODAY_DAY;
                    return <CalCell key={day} day={day} code={code} isToday={isToday} />;
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 sm:gap-[14px] mt-4">
                  {[
                    { label: "Present", color: "var(--sage,#4C7A5E)" },
                    { label: "Absent", color: "var(--brick,#B14A3F)" },
                    { label: "Leave", color: "var(--marigold,#E39A2D)" },
                    { label: "Holiday", color: "var(--line,#E6D9BE)" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] font-medium text-[var(--ink-soft,#667081)]">
                      <span className="w-[9px] h-[9px] rounded-full" style={{ background: l.color }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ring chart + subject bars */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="sm:hidden">
                    <RingChart percentage={summaryStats.percentage} size={150} stroke={12} />
                  </div>
                  <div className="hidden sm:block">
                    <RingChart percentage={summaryStats.percentage} size={190} stroke={15} />
                  </div>
                  <p className="mt-4 text-[12px] sm:text-[13px] text-center text-[var(--ink-soft,#667081)] font-medium max-w-[280px] leading-relaxed">
                    {selectedSubjectId === "all"
                      ? "Overall student engagement across all enrolled subjects for the selected period."
                      : `Subject engagement for ${selectedSubjectId}.`}
                  </p>
                </div>

                <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
                  {selectedSubjectId === "all" ? (
                    <>
                      <h4 className="font-display text-[15px] sm:text-[16px] font-semibold text-[var(--ink,#23303D)] flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[var(--marigold-deep,#C67E1B)]" />
                        Subject Performance
                      </h4>
                      {subjectPerformance.map((s) => (
                        <div key={s.subjectName}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12.5px] sm:text-[13px] font-semibold text-[var(--ink,#23303D)]">{s.subjectName}</span>
                            <span className="font-mono-custom text-[12px] sm:text-[13px] font-semibold" style={{ color: barColor(s.percentage) }}>
                              {s.percentage}%
                            </span>
                          </div>
                          <div className="h-[7px] rounded-full overflow-hidden" style={{ background: "var(--paper-deep,#F1E7D4)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${s.percentage}%`, background: barColor(s.percentage) }}
                            />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      {[
                        { label: "Present", value: summaryStats.present, color: "var(--sage,#4C7A5E)", bg: "var(--sage-soft,#E3EEE6)" },
                        { label: "Absent", value: summaryStats.absent, color: "var(--brick,#B14A3F)", bg: "var(--brick-soft,#F5E2DF)" },
                        { label: "Leave", value: summaryStats.leave, color: "var(--marigold-deep,#C67E1B)", bg: "var(--marigold-soft,#FBEACD)" },
                        { label: "Total", value: summaryStats.total, color: "var(--ink-soft,#667081)", bg: "var(--paper-deep,#F1E7D4)" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="p-3 sm:p-4 rounded-[14px] sm:rounded-[16px] border text-center"
                          style={{ background: stat.bg, borderColor: "transparent" }}
                        >
                          <div className="text-xl sm:text-2xl font-bold" style={{ color: stat.color }}>
                            {stat.value}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint,#9BA3AF)] mt-1">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════ CLASSWORK ════════ */}
          {activeTab === "classwork" && (
            <div className="p-4 sm:p-5 md:p-6 animate-[fade_.35s_ease]">
              <div className="mb-5 sm:mb-6">
                <h3 className="font-display font-semibold text-[19px] sm:text-[21px] text-[var(--ink,#23303D)] mb-1">
                  Classwork &amp; diary
                </h3>
                <p className="text-[13px] sm:text-[13.5px] text-[var(--ink-soft,#667081)]">
                  What Aarohi&apos;s teachers noted down, day by day.
                </p>
              </div>

              {/* Date strip */}
              <div
                className="flex items-center justify-between rounded-[14px] sm:rounded-[16px] p-2.5 sm:p-3 mb-4 sm:mb-5 border"
                style={{
                  background: "var(--paper-deep,#F1E7D4)",
                  borderColor: "var(--line-soft,#EFE6D2)",
                }}
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <button
                    onClick={() => setDayOffset((d) => d - 1)}
                    className="w-[30px] h-[30px] rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150 flex-shrink-0"
                    style={{
                      background: "var(--paper-card,#FFFDF8)",
                      borderColor: "var(--line-soft,#EFE6D2)",
                      color: "var(--ink-soft,#667081)",
                    }}
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="w-[15px] h-[15px]" />
                  </button>
                  <div className="flex flex-col">
                    <span className="font-mono-custom text-[10.5px] sm:text-[11px] text-[var(--ink-faint,#9BA3AF)]">
                      Poush {5 + dayOffset}, 2082
                    </span>
                    <span className="font-bold text-[13.5px] sm:text-[14.5px] text-[var(--ink,#23303D)]">
                      {formatDateAD(diaryDate)}
                    </span>
                  </div>
                  <button
                    onClick={() => setDayOffset((d) => d + 1)}
                    className="w-[30px] h-[30px] rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150 flex-shrink-0"
                    style={{
                      background: "var(--paper-card,#FFFDF8)",
                      borderColor: "var(--line-soft,#EFE6D2)",
                      color: "var(--ink-soft,#667081)",
                    }}
                    aria-label="Next day"
                  >
                    <ChevronLeft className="w-[15px] h-[15px] rotate-180" />
                  </button>
                </div>
                <button
                  onClick={() => setDayOffset(0)}
                  className="border font-semibold text-[11.5px] sm:text-[12px] px-3 sm:px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-150 flex-shrink-0"
                  style={{
                    background: "var(--paper-card,#FFFDF8)",
                    borderColor: "var(--line-soft,#EFE6D2)",
                    color: "var(--ink-soft,#667081)",
                  }}
                >
                  Today
                </button>
              </div>

              {/* Diary content */}
              {diaryEntries.length === 0 ? (
                <div
                  className="text-center py-10 sm:py-12 rounded-[16px] sm:rounded-[18px] border-2 border-dashed"
                  style={{ background: "var(--paper-deep,#F1E7D4)", borderColor: "var(--line,#E6D9BE)" }}
                >
                  <div
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center mx-auto mb-3.5 border"
                    style={{
                      background: "var(--paper-card,#FFFDF8)",
                      borderColor: "var(--line-soft,#EFE6D2)",
                      color: "var(--ink-faint,#9BA3AF)",
                    }}
                  >
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-[14px] sm:text-[14.5px] text-[var(--ink,#23303D)] mb-1">
                    No classwork noted for this day
                  </div>
                  <div className="text-[12px] sm:text-[12.5px] text-[var(--ink-faint,#9BA3AF)]">
                    Try another date, or check back once teachers add notes.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {diaryEntries.map((entry) => {
                    const subjectInfo = MOCK_SUBJECTS.find((s) => s.subjectName === entry.subject);
                    const color = entry.color || subjectInfo?.color || "var(--sky,#4E6E8E)";
                    return (
                      <div
                        key={entry.diaryId}
                        className="relative overflow-hidden rounded-[14px] sm:rounded-[18px] border p-4 sm:p-4 group hover:shadow-md transition-all duration-200"
                        style={{
                          background: `repeating-linear-gradient(var(--paper-card,#FFFDF8) 0 30px, var(--line-soft,#EFE6D2) 30px 31px)`,
                          borderColor: "var(--line,#E6D9BE)",
                        }}
                      >
                        {/* Red margin line */}
                        <div
                          className="absolute left-[22px] top-0 bottom-0 w-[1px]"
                          style={{ background: "rgba(177,74,63,0.18)" }}
                        />
                        <div className="relative pl-1.5 sm:pl-1.5">
                          <span
                            className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-[3px] rounded-full mb-2.5 sm:mb-3"
                            style={{ background: hexToSoft(color), color }}
                          >
                            {entry.subject}
                          </span>
                          <h4 className="font-display italic font-medium text-[15.5px] sm:text-[17px] text-[var(--ink,#23303D)] mb-2 leading-tight">
                            {entry.title}
                          </h4>
                          <p className="text-[12.5px] sm:text-[13px] text-[var(--ink-soft,#667081)] leading-[1.6] mb-3.5">
                            {entry.content}
                          </p>
                          <div className="flex items-center gap-2 pt-2.5 border-t border-dashed" style={{ borderColor: "var(--line,#E6D9BE)" }}>
                            <div
                              className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                              style={{ background: "var(--sky-soft,#E5ECF2)", color: "var(--sky,#4E6E8E)" }}
                            >
                              {getInitials(entry.teacher)}
                            </div>
                            <div>
                              <div className="text-[12px] sm:text-[12.5px] font-semibold text-[var(--ink,#23303D)]">{entry.teacher}</div>
                              <div className="font-mono-custom text-[10px] sm:text-[10.5px] text-[var(--ink-faint,#9BA3AF)]">Teacher</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Daily Attendance Record */}
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h4 className="font-display text-[15px] sm:text-[16px] font-semibold text-[var(--ink,#23303D)]">
                    Daily attendance record
                  </h4>
                  <span className="font-mono-custom text-[10.5px] sm:text-[11px] text-[var(--ink-faint,#9BA3AF)]">
                    {formatDateAD(diaryDate)}
                  </span>
                </div>

                {filteredDailyAttendance.length === 0 ? (
                  <div
                    className="text-center py-8 sm:py-10 rounded-[14px] sm:rounded-[16px] border-2 border-dashed"
                    style={{ background: "var(--paper-deep,#F1E7D4)", borderColor: "var(--line,#E6D9BE)" }}
                  >
                    <div className="font-bold text-[13.5px] sm:text-[14px] text-[var(--ink,#23303D)]">No records for this filter</div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                    {filteredDailyAttendance.map((record) => {
                      const subjectInfo = MOCK_SUBJECTS.find((s) => s.subjectId === record.subjectId);
                      return (
                        <div
                          key={record.subjectId}
                          className="w-[calc(50%-0.375rem)] sm:w-[155px] p-3 sm:p-4 rounded-[14px] sm:rounded-[16px] border flex flex-col items-center text-center transition-all duration-300 group hover:shadow-lg"
                          style={{
                            background: "var(--paper-deep,#F1E7D4)",
                            borderColor: "var(--line-soft,#EFE6D2)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--marigold,#E39A2D)";
                            (e.currentTarget as HTMLElement).style.background = "var(--paper-card,#FFFDF8)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--line-soft,#EFE6D2)";
                            (e.currentTarget as HTMLElement).style.background = "var(--paper-deep,#F1E7D4)";
                          }}
                        >
                          <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[11px] flex items-center justify-center mb-1.5 sm:mb-2 transition-transform duration-200 group-hover:scale-110"
                            style={{ background: hexToSoft(subjectInfo?.color || "#667081"), color: subjectInfo?.color || "#667081" }}
                          >
                            <SubjectIcon type={subjectInfo?.icon || "book"} className="w-[18px] h-[18px]" />
                          </div>
                          <h4 className="text-[10px] sm:text-[11px] font-bold text-[var(--ink,#23303D)] truncate w-full leading-tight">
                            {record.subjectName}
                          </h4>
                          <p className="text-[9px] font-bold text-[var(--ink-faint,#9BA3AF)] mb-2 sm:mb-2.5 truncate w-full uppercase tracking-wider mt-0.5">
                            {record.teacherName}
                          </p>
                          <AttendanceStatusPill status={record.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ SUBJECTS ════════ */}
          {activeTab === "subjects" && (
            <div className="p-4 sm:p-5 md:p-6 animate-[fade_.35s_ease]">
              <div className="mb-5 sm:mb-6">
                <h3 className="font-display font-semibold text-[19px] sm:text-[21px] text-[var(--ink,#23303D)] mb-1">
                  Subjects &amp; teachers
                </h3>
                <p className="text-[13px] sm:text-[13.5px] text-[var(--ink-soft,#667081)]">
                  Everyone teaching Aarohi this term.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {MOCK_SUBJECTS.map((subject) => (
                  <div
                    key={subject.subjectId}
                    className="flex gap-3 sm:gap-3.5 items-start rounded-[14px] sm:rounded-[18px] p-3.5 sm:p-4 border transition-all duration-150 cursor-default group"
                    style={{
                      background: "var(--paper-deep,#F1E7D4)",
                      borderColor: "var(--line-soft,#EFE6D2)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--marigold,#E39A2D)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--line-soft,#EFE6D2)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-[12px] flex-shrink-0 flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110"
                      style={{ background: subject.color }}
                    >
                      <SubjectIcon type={subject.icon} className="w-[19px] h-[19px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[13.5px] sm:text-[14.5px] text-[var(--ink,#23303D)] mb-0.5 leading-tight">
                        {subject.subjectName}
                      </div>
                      <div className="text-[12px] sm:text-[12.5px] text-[var(--ink-soft,#667081)]">
                        {subject.teacherName}
                      </div>
                      <div className="font-mono-custom text-[10px] sm:text-[10.5px] text-[var(--ink-faint,#9BA3AF)] mt-1 uppercase tracking-wider">
                        {subject.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}