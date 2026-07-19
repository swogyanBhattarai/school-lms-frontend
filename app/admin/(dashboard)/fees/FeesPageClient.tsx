// app/admin/(dashboard)/fees/FeesOverviewPageClient.tsx
"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  GraduationCap,
  X,
  Download,
  Loader2,
  ArrowRight,
  Banknote,
  Filter,
  Layers,
  BookOpen,
  ChevronDown,
  Calendar,
  Receipt,
  CreditCard,
  ChevronUp,
  Info,
  ChevronLeft,
  RotateCcw,
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
import { Badge } from "@/app/_components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getTodayBS } from "@/lib/nepali-calendar";
import {
  getFeeStats,
  getClassFeeStat,
  getOverdueStudents,
  getFeeTypeStats,
} from "@/lib/api/studentFee";
import { getActiveSchoolClasses } from "@/lib/api/schoolClass";
import { getSectionsBySchoolClassId } from "@/lib/api/section";
import { studentFeeKeys } from "@/lib/api/hooks/studentFee";
import type {
  FeeStats,
  FeeStatus,
  ClassCollection,
  SectionCollection,
  FeeTypeStatResponse,
  SectionFeeStat,
  SummaryFeeStats,
  SectionResponse,
  OverdueStudentResponse,
} from "@/types/lms";

// --- All hooks and utilities remain the same ---
// Fee stats — real API
const useFeeStats = (params: any) => {
  return useQuery({
    queryKey: [...studentFeeKeys.adminStats, params],
    queryFn: async (): Promise<FeeStats> => {
      const data = await getFeeStats(
        params.feeStatus,
        params.classId,
        params.sectionId,
      );
      const totalExpected = data.totalNeeded;
      const totalPending = totalExpected - data.totalCollected - data.totalOverdue;
      const collectionRate =
        totalExpected > 0
          ? Math.round((data.totalCollected / totalExpected) * 100)
          : 0;
      return {
        totalExpected,
        totalCollected: data.totalCollected,
        totalPending,
        totalOverdue: data.totalOverdue,
        collectionRate,
        overdueCount: data.overdueCount,
        totalStudents: data.totalStudents,
        paidStudents: data.paidStudents,
        unpaidStudents: data.unpaidStudents,
        partialStudents: data.partialStudents,
        pendingStudents: data.unpaidStudents + data.partialStudents,
        overdueStudents: data.overdueStudents,
      };
    },
  });
};

const mapSectionFeeStat = (item: SectionFeeStat): SectionCollection => ({
  sectionId: item.sectionId,
  sectionName: item.sectionName,
  totalStudents: item.totalStudents,
  totalExpected: item.expectedAmount,
  totalCollected: item.collectedAmount,
  overdueAmount: item.overdueAmount,
  collectionRate:
    item.expectedAmount > 0
      ? Math.round((item.collectedAmount / item.expectedAmount) * 100)
      : 0,
});

const mapSummaryFeeStats = (item: SummaryFeeStats): ClassCollection => ({
  classId: item.classId,
  className: `Grade ${item.grade}`,
  grade: item.grade,
  totalStudents: item.totalStudents,
  totalExpected: item.expectedAmount,
  totalCollected: item.collectedAmount,
  pendingAmount: item.expectedAmount - item.collectedAmount,
  overdueAmount: item.overdueAmount,
  collectionRate:
    item.expectedAmount > 0
      ? Math.round((item.collectedAmount / item.expectedAmount) * 100)
      : 0,
  sections: item.sectionFeeStats.map(mapSectionFeeStat),
});

const useClassCollection = (params: any) => {
  return useQuery({
    queryKey: [...studentFeeKeys.adminClassStats, params],
    queryFn: async (): Promise<ClassCollection[]> => {
      const data: SummaryFeeStats[] = await getClassFeeStat(
        params.feeStatus,
        params.classId,
        params.sectionId,
      );
      return data.map(mapSummaryFeeStats);
    },
  });
};

// --- Grouped overdue student (grouped by student from API response) ---
interface GroupedOverdueStudent {
  id: number;
  name: string;
  grade: string;
  section: string;
  totalOverdueAmount: number;
  totalRemainingAmount: number;
  totalOverduePaid: number;
  overdueCount: number;
  oldestDueDate: string;
  feeTypes: string[];
  items: OverdueStudentResponse[];
}

const FEE_TYPE_ICONS: Record<string, React.ReactNode> = {
  MONTHLY_FEE: <Calendar className="h-4 w-4" />,
  ADMISSION_FEE: <GraduationCap className="h-4 w-4" />,
  ANNUAL_FEE: <Banknote className="h-4 w-4" />,
  EXAMINATION_FEE: <BookOpen className="h-4 w-4" />,
  EXTRACURRICULAR_FEE: <Users className="h-4 w-4" />,
  LIBRARY_FEE: <BookOpen className="h-4 w-4" />,
  LAB_FEE: <Layers className="h-4 w-4" />,
  TRANSPORT_FEE: <ArrowRight className="h-4 w-4" />,
  OTHER: <Info className="h-4 w-4" />,
};

const formatFeeTypeLabel = (feeType: string): string => {
  return feeType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const getFeeTypeIcon = (feeType: string): React.ReactNode => {
  return FEE_TYPE_ICONS[feeType] || <Info className="h-4 w-4" />;
};

const groupOverdueStudents = (
  items: OverdueStudentResponse[],
): GroupedOverdueStudent[] => {
  const map = new Map<number, GroupedOverdueStudent>();
  for (const item of items) {
    const existing = map.get(item.studentId);
    if (existing) {
      existing.totalOverdueAmount += item.overdueAmount;
      existing.totalRemainingAmount += item.remainingAmount;
      existing.totalOverduePaid += item.overduePaid;
      existing.overdueCount += 1;
      existing.items.push(item);
      if (!existing.feeTypes.includes(item.feeType)) {
        existing.feeTypes.push(item.feeType);
      }
      if (item.dueDate < existing.oldestDueDate) {
        existing.oldestDueDate = item.dueDate;
      }
    } else {
      map.set(item.studentId, {
        id: item.studentId,
        name: item.studentName,
        grade: item.grade,
        section: item.sectionName,
        totalOverdueAmount: item.overdueAmount,
        totalRemainingAmount: item.remainingAmount,
        totalOverduePaid: item.overduePaid,
        overdueCount: 1,
        oldestDueDate: item.dueDate,
        feeTypes: [item.feeType],
        items: [item],
      });
    }
  }
  return Array.from(map.values());
};

const useOverdueStudents = (params: any) => {
  return useQuery({
    queryKey: [...studentFeeKeys.adminOverdueStudents, params],
    queryFn: async (): Promise<GroupedOverdueStudent[]> => {
      const data = await getOverdueStudents(
        undefined,
        params.classId,
        params.sectionId,
      );
      return groupOverdueStudents(data);
    },
  });
};

const useFeeTypeBreakdown = (params: any) => {
  return useQuery({
    queryKey: ["fee-type-breakdown", params],
    queryFn: async () => {
      return await getFeeTypeStats(params.classId, params.sectionId);
    },
  });
};

// Helpers
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompactCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `NPR ${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `NPR ${(amount / 1000).toFixed(0)}K`;
  }
  return `NPR ${amount}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatDateFull = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getProgressColor = (rate: number) => {
  if (rate >= 80)
    return {
      bg: "bg-emerald-500",
      text: "text-emerald-600",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      light: "bg-emerald-50",
    };
  if (rate >= 60)
    return {
      bg: "bg-amber-500",
      text: "text-amber-600",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      light: "bg-amber-50",
    };
  return {
    bg: "bg-red-500",
    text: "text-red-600",
    badge: "bg-red-50 text-red-700 border-red-200",
    light: "bg-red-50",
  };
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// --- Animated Progress Bar Component ---
function AnimatedProgressBar({
  value,
  colorClass,
  height = "h-2",
  className,
}: {
  value: number;
  colorClass: string;
  height?: string;
  className?: string;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const prevValue = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const targetValue = Math.min(Math.max(value, 0), 100);
    const startValue = prevValue.current;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * eased;

      setAnimatedValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = targetValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <div
      className={cn(
        "bg-slate-100 rounded-full overflow-hidden",
        height,
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-colors duration-500",
          colorClass,
        )}
        style={{ width: `${animatedValue}%`, transition: "width 0s" }}
      />
    </div>
  );
}

// Skeleton Components
function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-100 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
      </div>
      <div className="h-8 w-28 bg-slate-200 rounded mb-1" />
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-12 bg-slate-200 rounded" />
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function FeeTypeCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
      <div className="h-6 w-20 bg-slate-200 rounded mb-3" />
      <div className="h-2.5 bg-slate-200 rounded-full mb-2" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div className="h-3 w-16 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

// Stat card configuration based on fee status filter
interface StatCardConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  subValue?: string;
  color: string;
}

function getStatCards(
  stats: FeeStats | undefined,
  feeStatus: string,
): StatCardConfig[] {
  const allCards: StatCardConfig[] = [
    {
      key: "expected",
      label: "Expected",
      icon: <Banknote className="h-4 w-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      value: formatCurrency(stats?.totalExpected ?? 0),
      subValue: `${stats?.totalStudents ?? 0} students`,
      color: "blue",
    },
    {
      key: "collected",
      label: "Collected",
      icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
      iconBg: "bg-emerald-100",
      value: `${stats?.collectionRate ?? 0}% | ${formatCurrency(stats?.totalCollected ?? 0)}`,
      subValue:
        stats && stats.totalStudents > 0
          ? `${stats.paidStudents}/${stats.totalStudents} paid`
          : undefined,
      color: "emerald",
    },
    {
      key: "pending",
      label: "Pending",
      icon: <Clock className="h-4 w-4 text-amber-600" />,
      iconBg: "bg-amber-100",
      value: formatCurrency(stats?.totalPending ?? 0),
      subValue:
        stats && stats.totalStudents > 0
          ? `${stats.unpaidStudents} unpaid · ${stats.partialStudents} partial`
          : undefined,
      color: "amber",
    },
    {
      key: "overdue",
      label: "Overdue",
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      iconBg: "bg-red-100",
      value: formatCurrency(stats?.totalOverdue ?? 0),
      subValue: `${stats?.overdueStudents ?? 0} students · ${stats?.overdueCount ?? 0} items`,
      color: "red",
    },
  ];

  if (feeStatus === "all") return allCards;

  switch (feeStatus) {
    case "PAID":
      return allCards.filter((c) => ["expected", "collected"].includes(c.key));
    case "UNPAID":
      return allCards.filter((c) => ["expected", "pending"].includes(c.key));
    case "PARTIAL":
      return allCards.filter((c) =>
        ["expected", "collected", "pending"].includes(c.key),
      );
    case "OVERDUE":
      return allCards.filter((c) =>
        ["expected", "collected", "overdue"].includes(c.key),
      );
    default:
      return allCards;
  }
}

// --- Desktop Overdue Card Component ---
function DesktopOverdueCard({
  student,
  router,
}: {
  student: GroupedOverdueStudent;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <button
      onClick={() => router.push(`/admin/students/${student.id}?tab=fees`)}
      className="bg-white rounded-xl p-4 hover:shadow-md transition-all text-left group border border-red-100 flex flex-col"
    >
      {/* Header: Avatar + Name + Grade/Section */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-red-600">
            {getInitials(student.name)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h5 className="text-sm font-bold text-slate-900 truncate">
            {student.name}
          </h5>
          <p className="text-xs text-slate-400 truncate">
            Grade {student.grade} • Section {student.section}
          </p>
        </div>
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
        <span className="text-xs text-red-500 font-medium">
          Due: {formatDateFull(student.oldestDueDate)}
        </span>
      </div>

      {/* Fee Types */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(student.feeTypes || []).map((ft) => (
          <Badge
            key={ft}
            className="bg-red-100 text-red-700 text-[10px] border-red-200 font-medium"
          >
            {formatFeeTypeLabel(ft)}
          </Badge>
        ))}
        <Badge className="bg-red-100 text-red-700 text-[10px] border-red-200">
          {student.overdueCount} {student.overdueCount === 1 ? "item" : "items"}
        </Badge>
      </div>

      {/* Amount Details */}
      <div className="space-y-1.5 mt-auto pt-2 border-t border-red-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Overdue</span>
          <span className="text-sm font-bold text-red-600">
            {formatCurrency(student.totalOverdueAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Remaining</span>
          <span className="text-xs font-semibold text-red-500">
            {formatCurrency(student.totalRemainingAmount)}
          </span>
        </div>
        {student.totalOverduePaid > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Paid</span>
            <span className="text-xs font-medium text-emerald-600">
              {formatCurrency(student.totalOverduePaid)}
            </span>
          </div>
        )}
      </div>

      {/* View Link */}
      <div className="flex items-center justify-end mt-2 pt-2 border-t border-red-50">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1 group-hover:text-slate-700">
          View Details <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

// --- Mobile Overdue Card Component ---
function MobileOverdueCard({
  student,
  router,
}: {
  student: GroupedOverdueStudent;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <button
      onClick={() => router.push(`/admin/students/${student.id}?tab=fees`)}
      className="bg-white rounded-xl p-3.5 hover:shadow-sm transition-all text-left w-full border border-red-100 active:bg-red-50/50"
    >
      {/* Top Row: Avatar + Name + Grade */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-red-600">
            {getInitials(student.name)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h5 className="text-sm font-bold text-slate-900 truncate">
            {student.name}
          </h5>
          <p className="text-xs text-slate-400">
            Grade {student.grade} • Section {student.section}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
      </div>

      {/* Due Date + Fee Type Tags */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Calendar className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
        <span className="text-xs text-red-500 font-medium">
          Due {formatDate(student.oldestDueDate)}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(student.feeTypes || []).map((ft) => (
          <Badge
            key={ft}
            className="bg-red-100 text-red-700 text-[10px] border-red-200 font-medium px-2 py-0.5"
          >
            {formatFeeTypeLabel(ft)}
          </Badge>
        ))}
        <Badge className="bg-red-100 text-red-700 text-[10px] border-red-200 px-2 py-0.5">
          {student.overdueCount} {student.overdueCount === 1 ? "item" : "items"}
        </Badge>
      </div>

      {/* Amount Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-red-50/50 rounded-lg p-2.5">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
            Overdue
          </p>
          <p className="text-sm font-bold text-red-600">
            {formatCurrency(student.totalOverdueAmount)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
            Remaining
          </p>
          <p className="text-sm font-semibold text-red-500">
            {formatCurrency(student.totalRemainingAmount)}
          </p>
        </div>
        {student.totalOverduePaid > 0 && (
          <div className="col-span-2 pt-1.5 mt-0.5 border-t border-red-100">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
              Paid So Far
            </p>
            <p className="text-xs font-semibold text-emerald-600">
              {formatCurrency(student.totalOverduePaid)}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// --- Mobile Overdue Section with Horizontal Infinite Scroll ---
function MobileOverdueSection({
  students,
  router,
}: {
  students: GroupedOverdueStudent[];
  router: ReturnType<typeof useRouter>;
}) {
  const MOBILE_PAGE_SIZE = 3;
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleStudents = students.slice(0, visibleCount);
  const hasMore = visibleCount < students.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) =>
        Math.min(prev + MOBILE_PAGE_SIZE, students.length),
      );
    }
  }, [hasMore, students.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  // Track current visible card index
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardEl = container.children[0];
      if (!cardEl) return;

      const cardWidth = cardEl.getBoundingClientRect().width;
      const scrollLeft = container.scrollLeft;
      const index = Math.round(scrollLeft / cardWidth);

      setCurrentIndex(Math.min(index, students.length - 1));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [visibleStudents.length]);

  // Snap exactly one card at a time on touch end
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchStartX - touchEndX;
      const threshold = 50;

      const cardEl = container.children[0];
      if (!cardEl) return;

      const cardWidth = cardEl.getBoundingClientRect().width;
      const currentScrollLeft = container.scrollLeft;
      const currentIdx = Math.round(currentScrollLeft / cardWidth);

      let targetIndex = currentIdx;

      if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
          targetIndex = Math.min(currentIdx + 1, visibleStudents.length - 1);
        } else {
          targetIndex = Math.max(currentIdx - 1, 0);
        }
      }

      const targetScrollLeft = targetIndex * cardWidth;
      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [visibleStudents.length]);

  return (
    <div>
      <div
        ref={scrollContainerRef}
        className="flex item-start overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "x mandatory",
        }}
      >
        {visibleStudents.map((student) => (
          <div
            key={student.id}
            className="flex-shrink-0 w-full scroll-snap-align-start px-1"
          >
            <MobileOverdueCard student={student} router={router} />
          </div>
        ))}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="flex-shrink-0 w-full flex items-center justify-center px-1"
          >
            <div className="bg-white/60 rounded-xl p-6 border border-red-100 border-dashed w-full flex items-center justify-center">
              <span className="text-xs text-red-400 animate-pulse">
                Loading more...
              </span>
            </div>
          </div>
        )}
      </div>

      {students.length > 1 && (
        <div className="flex items-center justify-center mt-2">
          <span className="text-[10px] font-medium text-red-400 bg-red-50 rounded-full px-2.5 py-0.5">
            {Math.min(currentIndex + 1, students.length)} / {students.length}
          </span>
        </div>
      )}
    </div>
  );
}

// --- Mobile Fee Type Card (Enhanced) ---
function MobileFeeTypeCard({ type }: { type: FeeTypeStatResponse }) {
  const rate =
    type.expectedAmount > 0
      ? Math.round((type.collectedAmount / type.expectedAmount) * 100)
      : 0;
  const feeType = type.feeType;
  const progressColor = getProgressColor(rate);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 active:bg-slate-50 transition-colors">
      {/* Header with icon, label, and rate badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              progressColor.light,
            )}
          >
            <span className={cn("text-sm", progressColor.text)}>
              {getFeeTypeIcon(feeType)}
            </span>
          </div>
          <span className="text-sm font-semibold text-slate-800">
            {formatFeeTypeLabel(feeType)}
          </span>
        </div>
        <Badge
          className={cn(
            "text-xs font-bold border px-2 py-0.5",
            progressColor.badge,
          )}
        >
          {rate}%
        </Badge>
      </div>

      {/* Main amount */}
      <div className="mb-3">
        <p className="text-lg font-bold text-slate-900">
          {formatCurrency(type.collectedAmount)}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          of {formatCurrency(type.expectedAmount)} expected ·{" "}
          {type.totalStudents} students
        </p>
      </div>

      {/* Progress bar */}
      <AnimatedProgressBar
        value={rate}
        colorClass={progressColor.bg}
        height="h-2.5"
        className="mb-3"
      />

      {/* Detailed stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-[11px] text-slate-500">Collected</span>
          </div>
          <span className="text-xs font-semibold text-emerald-600">
            {formatCompactCurrency(type.collectedAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3 w-3 text-blue-500" />
            <span className="text-[11px] text-slate-500">Partial</span>
          </div>
          <span className="text-xs font-semibold text-blue-600">
            {formatCompactCurrency(type.partialAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-amber-500" />
            <span className="text-[11px] text-slate-500">Unpaid</span>
          </div>
          <span className="text-xs font-semibold text-amber-600">
            {formatCompactCurrency(type.unpaidAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span className="text-[11px] text-slate-500">Overdue</span>
          </div>
          <span className="text-xs font-semibold text-red-600">
            {formatCompactCurrency(type.overdueAmount)}
          </span>
        </div>
      </div>

      {/* Remaining amount */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Remaining to collect</span>
        <span className="text-xs font-semibold text-slate-700">
          {formatCompactCurrency(type.remainingAmount)}
        </span>
      </div>
    </div>
  );
}

// --- Desktop Fee Type Carousel ---
function DesktopFeeTypeCarousel({
  feeTypes,
}: {
  feeTypes: FeeTypeStatResponse[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = feeTypes.length;

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const currentType = feeTypes[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalSlides - 1;

  if (!currentType) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Carousel Content */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {feeTypes.map((type) => {
            const rate =
              type.expectedAmount > 0
                ? Math.round((type.collectedAmount / type.expectedAmount) * 100)
                : 0;
            const feeType = type.feeType;
            const progressColor = getProgressColor(rate);

            return (
              <div key={type.feeType} className="w-full flex-shrink-0">
                {/* Row 1: Icon + Label + Badge + Student count */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        progressColor.light,
                      )}
                    >
                      <span className={cn("text-sm", progressColor.text)}>
                        {getFeeTypeIcon(feeType)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800 block">
                        {formatFeeTypeLabel(feeType)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {type.totalStudents} student
                        {type.totalStudents !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "text-xs font-bold border px-2.5 py-1",
                      progressColor.badge,
                    )}
                  >
                    {rate}%
                  </Badge>
                </div>

                {/* Row 2: Amount + Progress */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(type.collectedAmount)}
                    </span>
                    <span className="text-xs text-slate-400">
                      collected of {formatCurrency(type.expectedAmount)}
                    </span>
                  </div>
                  <AnimatedProgressBar
                    value={rate}
                    colorClass={progressColor.bg}
                    height="h-2.5"
                  />
                </div>

                {/* Row 3: 4-column breakdown */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Partial</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatCompactCurrency(type.partialAmount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Unpaid</p>
                    <p className="text-sm font-semibold text-amber-600">
                      {formatCompactCurrency(type.unpaidAmount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Overdue</p>
                    <p className="text-sm font-semibold text-red-600">
                      {formatCompactCurrency(type.overdueAmount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Remaining</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatCompactCurrency(type.remainingAmount)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-1.5">
          {feeTypes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-5 bg-slate-600"
                  : "w-1.5 bg-slate-200 hover:bg-slate-300",
              )}
              aria-label={`Go to fee type ${index + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrev}
            disabled={!hasPrev}
            className={cn(
              "h-8 w-8 p-0 rounded-lg",
              hasPrev
                ? "text-slate-600 hover:bg-slate-100"
                : "text-slate-300 cursor-not-allowed",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-slate-400 font-medium min-w-[40px] text-center">
            {currentIndex + 1}/{totalSlides}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={!hasNext}
            className={cn(
              "h-8 w-8 p-0 rounded-lg",
              hasNext
                ? "text-slate-600 hover:bg-slate-100"
                : "text-slate-300 cursor-not-allowed",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Mobile Fee Type Section with Horizontal Full-Width Scroll ---
function MobileFeeTypeSection({
  feeTypes,
}: {
  feeTypes: FeeTypeStatResponse[];
}) {
  const MOBILE_PAGE_SIZE = 3;
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleTypes = feeTypes.slice(0, visibleCount);
  const hasMore = visibleCount < feeTypes.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) =>
        Math.min(prev + MOBILE_PAGE_SIZE, feeTypes.length),
      );
    }
  }, [hasMore, feeTypes.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  // Track current visible card index
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardEl = container.children[0];
      if (!cardEl) return;

      const cardWidth = cardEl.getBoundingClientRect().width;
      const scrollLeft = container.scrollLeft;
      const index = Math.round(scrollLeft / cardWidth);

      setCurrentIndex(Math.min(index, visibleTypes.length - 1));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [visibleTypes.length]);

  // Snap exactly one card at a time on touch end
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchStartX - touchEndX;
      const threshold = 50;

      const cardEl = container.children[0];
      if (!cardEl) return;

      const cardWidth = cardEl.getBoundingClientRect().width;
      const currentScrollLeft = container.scrollLeft;
      const currentIdx = Math.round(currentScrollLeft / cardWidth);

      let targetIndex = currentIdx;

      if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
          targetIndex = Math.min(currentIdx + 1, visibleTypes.length - 1);
        } else {
          targetIndex = Math.max(currentIdx - 1, 0);
        }
      }

      const targetScrollLeft = targetIndex * cardWidth;
      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [visibleTypes.length]);

  const totalVisible = visibleTypes.length;

  return (
    <div>
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "x mandatory",
        }}
      >
        {visibleTypes.map((type) => {
          const rate =
            type.expectedAmount > 0
              ? Math.round((type.collectedAmount / type.expectedAmount) * 100)
              : 0;
          const feeType = type.feeType;
          const progressColor = getProgressColor(rate);

          return (
            <div
              key={type.feeType}
              className="w-full flex-shrink-0 scroll-snap-align-start px-1"
            >
              {/* Header with icon, label, and rate badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      progressColor.light,
                    )}
                  >
                    <span className={cn("text-sm", progressColor.text)}>
                      {getFeeTypeIcon(feeType)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatFeeTypeLabel(feeType)}
                  </span>
                </div>
                <Badge
                  className={cn(
                    "text-xs font-bold border px-2 py-0.5",
                    progressColor.badge,
                  )}
                >
                  {rate}%
                </Badge>
              </div>

              {/* Main amount */}
              <div className="mb-3">
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(type.collectedAmount)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  of {formatCurrency(type.expectedAmount)} expected ·{" "}
                  {type.totalStudents} students
                </p>
              </div>

              {/* Progress bar */}
              <AnimatedProgressBar
                value={rate}
                colorClass={progressColor.bg}
                height="h-2.5"
                className="mb-3"
              />

              {/* Detailed stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-[11px] text-slate-500">
                      Collected
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">
                    {formatCompactCurrency(type.collectedAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-blue-500" />
                    <span className="text-[11px] text-slate-500">Partial</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-600">
                    {formatCompactCurrency(type.partialAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span className="text-[11px] text-slate-500">Unpaid</span>
                  </div>
                  <span className="text-xs font-semibold text-amber-600">
                    {formatCompactCurrency(type.unpaidAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-[11px] text-slate-500">Overdue</span>
                  </div>
                  <span className="text-xs font-semibold text-red-600">
                    {formatCompactCurrency(type.overdueAmount)}
                  </span>
                </div>
              </div>

              {/* Remaining amount */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Remaining to collect
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {formatCompactCurrency(type.remainingAmount)}
                </span>
              </div>
            </div>
          );
        })}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="w-full flex-shrink-0 flex items-center justify-center px-1"
          >
            <div className="w-full flex items-center justify-center p-6">
              <span className="text-xs text-slate-400 animate-pulse">
                Loading more...
              </span>
            </div>
          </div>
        )}
      </div>

      {totalVisible > 1 && (
        <div className="flex items-center justify-center mt-2">
          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 rounded-full px-2.5 py-0.5">
            {currentIndex + 1} / {totalVisible}
          </span>
        </div>
      )}
    </div>
  );
}

export default function FeesOverviewPageClient() {
  const router = useRouter();
  const todayBS = getTodayBS();

  const [selectedYear, setSelectedYear] = useState(todayBS.year);
  const [selectedMonth, setSelectedMonth] = useState(todayBS.month);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string>("all");
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const DESKTOP_OVERDUE_INITIAL = 4;
const DESKTOP_OVERDUE_INCREMENT = 8; // 2 rows × 4 columns
const [desktopOverdueVisibleCount, setDesktopOverdueVisibleCount] =
  useState(DESKTOP_OVERDUE_INITIAL);

  const queryParams = useMemo(
    () => ({
      month: selectedMonth,
      year: selectedYear,
      classId: selectedClassId !== "all" ? Number(selectedClassId) : undefined,
      sectionId:
        selectedSectionId !== "all" ? Number(selectedSectionId) : undefined,
      feeStatus:
        selectedFeeStatus !== "all"
          ? (selectedFeeStatus as FeeStatus)
          : undefined,
    }),
    [
      selectedMonth,
      selectedYear,
      selectedClassId,
      selectedSectionId,
      selectedFeeStatus,
    ],
  );

  const { data: stats, isLoading: statsLoading } = useFeeStats(queryParams);
  const { data: classCollection = [], isLoading: classLoading } =
    useClassCollection(queryParams);
  const { data: feeTypes = [], isLoading: typesLoading } =
    useFeeTypeBreakdown(queryParams);
  const { data: displayedOverdueStudents = [], isLoading: overdueLoading } =
    useOverdueStudents(queryParams);

  const { data: classes = [] } = useQuery({
    queryKey: ["school-classes"],
    queryFn: () => getActiveSchoolClasses(),
  });

  const { data: sections = [] } = useQuery<SectionResponse[]>({
    queryKey: ["class-sections", selectedClassId],
    queryFn: () => getSectionsBySchoolClassId(Number(selectedClassId)),
    enabled: selectedClassId !== "all",
  });

  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
    setSelectedSectionId("all");
  };

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classCollection;
    return classCollection.filter(
      (c) =>
        c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.grade.includes(searchQuery),
    );
  }, [classCollection, searchQuery]);

  useEffect(() => {
    setDesktopOverdueVisibleCount(DESKTOP_OVERDUE_INITIAL);
  }, [queryParams]);

  const showOverdueStudents = true;

  const totalStudentsForPct = stats?.totalStudents ?? 0;
  const paidPercent =
    totalStudentsForPct > 0
      ? Math.round((stats!.paidStudents / totalStudentsForPct) * 100)
      : 0;
  const pendingPercent =
    totalStudentsForPct > 0
      ? Math.round((stats!.pendingStudents / totalStudentsForPct) * 100)
      : 0;
  const overduePercent =
    totalStudentsForPct > 0
      ? Math.round((stats!.overdueStudents / totalStudentsForPct) * 100)
      : 0;
  const activeFiltersCount = [
    selectedClassId !== "all" ? 1 : 0,
    selectedFeeStatus !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const statCards = useMemo(
    () => getStatCards(stats, selectedFeeStatus),
    [stats, selectedFeeStatus],
  );

  // Filter chips for mobile
  const activeFilters = useMemo(() => {
    const filters: { label: string; onClear: () => void }[] = [];

    if (selectedClassId !== "all") {
      const cls = classes.find(
        (c) => String(c.schoolClassId) === selectedClassId,
      );
      filters.push({
        label: cls ? `Grade ${cls.grade}` : "Class",
        onClear: () => setSelectedClassId("all"),
      });
    }

    if (selectedSectionId !== "all") {
      const sec = sections.find(
        (s) => String(s.sectionId) === selectedSectionId,
      );
      filters.push({
        label: sec ? `Section ${sec.sectionName}` : "Section",
        onClear: () => setSelectedSectionId("all"),
      });
    }

    if (selectedFeeStatus !== "all") {
      filters.push({
        label:
          selectedFeeStatus.charAt(0) +
          selectedFeeStatus.slice(1).toLowerCase(),
        onClear: () => setSelectedFeeStatus("all"),
      });
    }

    return filters;
  }, [
    selectedClassId,
    selectedSectionId,
    selectedFeeStatus,
    classes,
    sections,
  ]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Fee Collection
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {statsLoading
              ? "..."
              : selectedFeeStatus === "PAID"
                ? `${stats?.paidStudents ?? 0} students fully paid`
                : selectedFeeStatus === "UNPAID"
                  ? `${stats?.unpaidStudents ?? 0} students unpaid`
                  : selectedFeeStatus === "PARTIAL"
                    ? `${stats?.partialStudents ?? 0} students partially paid`
                    : selectedFeeStatus === "OVERDUE"
                      ? `${stats?.overdueStudents ?? 0} students with overdue`
                      : `${stats?.paidStudents ?? 0}/${stats?.totalStudents ?? 0} students paid`}
          </p>
        </div>
      </div>

      {/* Stats Cards - Dynamic based on feeStatus filter */}
      <div
        className={cn(
          "grid gap-3",
          statCards.length <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : statCards.length === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          statCards.map((card) => (
            <div
              key={card.key}
              className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    card.iconBg,
                  )}
                >
                  {card.icon}
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {card.value}
              </p>
              {card.subValue && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subValue}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* ===== OVERDUE STUDENTS ALERT ===== */}
      {showOverdueStudents &&
        !overdueLoading &&
        displayedOverdueStudents.length > 0 && (
          <div className="rounded-2xl bg-red-50/60 border-2 border-red-200 p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-red-800">
                  Overdue Fees Alert
                </h4>
                <p className="text-xs text-red-500 mt-0.5">
                  {displayedOverdueStudents.length} student
                  {displayedOverdueStudents.length !== 1 ? "s" : ""} with
                  outstanding payments
                </p>
              </div>
            </div>

                          {/* Desktop: 4-col grid with Show More */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-4 gap-3">
                  {displayedOverdueStudents
                    .slice(0, desktopOverdueVisibleCount)
                    .map((student) => (
                      <DesktopOverdueCard
                        key={student.id}
                        student={student}
                        router={router}
                      />
                    ))}
                </div>
                {desktopOverdueVisibleCount <
                  displayedOverdueStudents.length && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDesktopOverdueVisibleCount((prev) =>
                          Math.min(
                            prev + DESKTOP_OVERDUE_INCREMENT,
                            displayedOverdueStudents.length,
                          ),
                        )
                      }
                      className="text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1.5 rounded-lg px-4"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                      Show More Overdue Students
                      <span className="text-[10px] text-red-400 ml-0.5">
                        (
                        {displayedOverdueStudents.length -
                          desktopOverdueVisibleCount}{" "}
                        remaining)
                      </span>
                    </Button>
                  </div>
                )}
              </div>

            {/* Mobile: Infinite scroll full-width cards */}
            <div className="sm:hidden">
              <MobileOverdueSection
                students={displayedOverdueStudents}
                router={router}
              />
            </div>
          </div>
        )}

      {/* Filters - Mobile Collapsible / Desktop Row */}
      <div>
        {/* Mobile: Collapsible Filter Toggle */}
        <div className="sm:hidden mb-3">
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
        </div>

        {/* Filter Content */}
        <div
          className={cn(
            "space-y-3",
            showMobileFilters ? "block" : "hidden sm:block",
          )}
        >
          {/* Mobile: Month & Search in vertical stack */}
          <div className="sm:hidden space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl border-slate-200 bg-white text-sm w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedClassId} onValueChange={handleClassChange}>
                <SelectTrigger className="h-10 rounded-xl text-sm bg-white">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="All Classes" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
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
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
                disabled={selectedClassId === "all"}
              >
                <SelectTrigger className="h-10 rounded-xl text-sm bg-white">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="All Sections" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((sec) => (
                    <SelectItem
                      key={sec.sectionId}
                      value={String(sec.sectionId)}
                    >
                      Section {sec.sectionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select
              value={selectedFeeStatus}
              onValueChange={setSelectedFeeStatus}
            >
              <SelectTrigger className="h-10 rounded-xl text-sm bg-white w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="All Statuses" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            {activeFiltersCount > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedClassId("all");
                    setSelectedSectionId("all");
                    setSelectedFeeStatus("all");
                  }}
                  className="w-full h-9 rounded-xl text-xs border-slate-300"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Desktop: Horizontal filters row */}
          <div className="hidden sm:flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl border-slate-200 bg-white text-sm w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            <Select value={selectedClassId} onValueChange={handleClassChange}>
              <SelectTrigger className="h-10 rounded-xl text-sm w-[140px] bg-white">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="All Classes" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
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
              value={selectedSectionId}
              onValueChange={setSelectedSectionId}
              disabled={selectedClassId === "all"}
            >
              <SelectTrigger className="h-10 rounded-xl text-sm w-[140px] bg-white">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="All Sections" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec.sectionId} value={String(sec.sectionId)}>
                    Section {sec.sectionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedFeeStatus}
              onValueChange={setSelectedFeeStatus}
            >
              <SelectTrigger className="h-10 rounded-xl text-sm w-[140px] bg-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="All Statuses" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedClassId("all");
                  setSelectedSectionId("all");
                  setSelectedFeeStatus("all");
                }}
                className="h-10 px-3 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Changed to single column with better hierarchy */}
      <div className="space-y-5 sm:space-y-6">
        {/* Class-wise Collection - Full width */}
        <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              Class-wise Collection
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {filteredClasses.length} classes
            </span>
          </div>

          {classLoading ? (
            <ListSkeleton />
          ) : filteredClasses.length === 0 ? (
            <div className="py-16 text-center">
              <GraduationCap className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                No classes found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredClasses.map((cls) => {
                const colors = getProgressColor(cls.collectionRate);
                const isExpanded = expandedClassId === cls.classId;

                return (
                  <div key={cls.classId}>
                    {/* Class Row */}
                    <div
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedClassId(isExpanded ? null : cls.classId)
                      }
                    >
                      <div className="px-4 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                              colors.light,
                            )}
                          >
                            <span
                              className={cn("text-sm font-bold", colors.text)}
                            >
                              {cls.grade}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                  {cls.className}
                                </h4>
                                <p className="text-xs text-slate-400">
                                  {cls.totalStudents} students
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {/* Desktop: Show full amount info */}
                                <div className="text-right hidden sm:block">
                                  <p className="text-base font-bold text-foreground">
                                    {formatCurrency(cls.totalCollected)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    of {formatCurrency(cls.totalExpected)}
                                  </p>
                                </div>
                                <Badge
                                  className={cn(
                                    "text-xs font-bold border px-2.5 py-1",
                                    colors.badge,
                                  )}
                                >
                                  {cls.collectionRate}%
                                </Badge>
                                <ChevronRight
                                  className={cn(
                                    "h-5 w-5 text-slate-300 transition-transform",
                                    isExpanded && "rotate-90",
                                  )}
                                />
                              </div>
                            </div>

                            <AnimatedProgressBar
                              value={cls.collectionRate}
                              colorClass={colors.bg}
                              height="h-2"
                            />

                            {/* Mobile: Show collected / total + overdue */}
                            <div className="sm:hidden flex items-center justify-between mt-1.5">
                              <span className="text-xs font-medium text-slate-700">
                                {formatCurrency(cls.totalCollected)} /{" "}
                                {formatCurrency(cls.totalExpected)}
                              </span>
                              {cls.overdueAmount > 0 && (
                                <span className="text-[10px] font-medium text-red-500">
                                  {formatCurrency(cls.overdueAmount)} overdue
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Sections */}
                    {isExpanded && (
                      <div className="border-t bg-muted/5 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-border/30">
                          <div>
                            <p className="text-xs sm:text-sm font-semibold">Sections</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              Fee collection by section
                            </p>
                          </div>
                        </div>
                        {cls.sections.length === 0 ? (
                          <div className="px-4 sm:px-5 py-6 sm:py-8 text-center">
                            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No sections yet
                            </p>
                          </div>
                        ) : (
                          <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-1.5">
                            {cls.sections.map((section) => {
                              const secColors = getProgressColor(
                                section.collectionRate,
                              );
                              return (
                                <div
                                  key={section.sectionId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/admin/sections/${section.sectionId}`,
                                    );
                                  }}
                                  className="flex items-center gap-2 sm:gap-3 rounded-lg border bg-background px-3 sm:px-3 py-2.5 sm:py-2.5 hover:bg-muted/30 transition-all cursor-pointer hover:shadow-sm group/section"
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      router.push(
                                        `/admin/sections/${section.sectionId}`,
                                      );
                                    }
                                  }}
                                >
                                  {/* Mobile Layout */}
                                  <div className="sm:hidden flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <span className="text-[11px] font-bold text-amber-700">
                                            {section.sectionName}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-sm font-medium">
                                            Section {section.sectionName}
                                          </span>
                                          <span className="text-xs text-muted-foreground ml-1.5">
                                            {section.totalStudents} students
                                          </span>
                                        </div>
                                      </div>
                                      <Badge
                                        className={cn(
                                          "text-[10px] font-bold border px-2 py-0.5 flex-shrink-0",
                                          secColors.badge,
                                        )}
                                      >
                                        {section.collectionRate}%
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 ml-9">
                                      <span className="text-xs font-semibold text-slate-700">
                                        {formatCurrency(section.totalCollected)}{" "}
                                        /{" "}
                                        {formatCurrency(section.totalExpected)}
                                      </span>
                                      {section.overdueAmount > 0 && (
                                        <span className="text-[11px] font-medium text-red-500">
                                          {formatCurrency(
                                            section.overdueAmount,
                                          )}{" "}
                                          overdue
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Desktop Layout */}
                                  <div className="hidden sm:flex flex-1 items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-bold text-amber-700">
                                        {section.sectionName}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium truncate">
                                          Section {section.sectionName}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                          {section.totalStudents} students
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Desktop: Amount + badge */}
                                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                                    <div className="w-20">
                                      <AnimatedProgressBar
                                        value={section.collectionRate}
                                        colorClass={secColors.bg}
                                        height="h-1.5"
                                      />
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-bold text-foreground">
                                        {formatCurrency(section.totalCollected)}
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-1">
                                        /{" "}
                                        {formatCurrency(section.totalExpected)}
                                      </span>
                                      {section.overdueAmount > 0 && (
                                        <div className="text-[10px] font-medium text-red-500 text-right">
                                          {formatCurrency(
                                            section.overdueAmount,
                                          )}{" "}
                                          overdue
                                        </div>
                                      )}
                                    </div>
                                    <Badge
                                      className={cn(
                                        "text-xs font-bold border px-2 py-0.5",
                                        secColors.badge,
                                      )}
                                    >
                                      {section.collectionRate}%
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Grid: Fee Type + Payment Status - Side by side on larger screens */}
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 items-start">
          {/* Fee Type Breakdown - Enhanced */}
          <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-600" />
                By Fee Type
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {feeTypes.length} types
              </span>
            </div>
            <div className="p-4 sm:p-5">
              {typesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <FeeTypeCardSkeleton key={i} />
                  ))}
                </div>
              ) : feeTypes.length === 0 ? (
                <div className="py-16 text-center">
                  <BookOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">
                    No fee types found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile: Horizontal scroll with latching */}
                  <div className="sm:hidden">
                    <MobileFeeTypeSection feeTypes={feeTypes} />
                  </div>
                  {/* Desktop: Horizontal Carousel */}
                  <div className="hidden sm:block">
                    <DesktopFeeTypeCarousel feeTypes={feeTypes} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Status Summary */}
          <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm h-fit">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Payment Status
              </h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Students Paid</span>
                <span className="text-base font-bold text-slate-900">
                  {stats?.paidStudents ?? 0} / {stats?.totalStudents ?? 0}
                </span>
              </div>
              <AnimatedProgressBar
                value={paidPercent}
                colorClass="bg-emerald-500"
                height="h-3"
              />
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-emerald-50 rounded-xl py-3">
                  <p className="text-lg font-bold text-emerald-600">
                    {paidPercent}%
                  </p>
                  <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                    Paid
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl py-3">
                  <p className="text-lg font-bold text-amber-600">
                    {pendingPercent}%
                  </p>
                  <p className="text-[10px] text-amber-500 font-medium mt-0.5">
                    Pending
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl py-3">
                  <p className="text-lg font-bold text-red-600">
                    {overduePercent}%
                  </p>
                  <p className="text-[10px] text-red-500 font-medium mt-0.5">
                    Overdue
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
