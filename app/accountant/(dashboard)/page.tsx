"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/lib/utils";
import { getFeeStats } from "@/lib/api/studentFee";
import { studentFeeKeys } from "@/lib/api/hooks/studentFee";
import useHasMounted from "@/lib/hooks/useHasMounted";

export default function AccountantDashboard() {
  const hasMounted = useHasMounted();
  const router = useRouter();

  const { data: feeStats, isLoading } = useQuery({
    queryKey: studentFeeKeys.adminStats,
    queryFn: () => getFeeStats(),
  });

  const stats = useMemo(() => {
    if (!feeStats) return null;
    return [
      {
        label: "Total Expected",
        value: `Rs. ${(feeStats.totalNeeded ?? 0).toLocaleString()}`,
        icon: TrendingUp,
        color: "text-blue-600",
      },
      {
        label: "Collected",
        value: `Rs. ${(feeStats.totalCollected ?? 0).toLocaleString()}`,
        icon: CheckCircle2,
        color: "text-emerald-600",
      },
      {
        label: "Overdue",
        value: `Rs. ${(feeStats.totalOverdue ?? 0).toLocaleString()}`,
        icon: AlertTriangle,
        color: "text-amber-600",
      },
      {
        label: "Total Students",
        value: `${feeStats.totalStudents ?? 0}`,
        icon: Users,
        color: "text-violet-600",
      },
    ];
  }, [feeStats]);

  const studentStatusCards = useMemo(() => {
    if (!feeStats) return [];
    return [
      {
        label: "Paid",
        value: feeStats.paidStudents ?? 0,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      },
      {
        label: "Unpaid",
        value: feeStats.unpaidStudents ?? 0,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
      },
      {
        label: "Partial",
        value: feeStats.partialStudents ?? 0,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      },
      {
        label: "Overdue",
        value: feeStats.overdueStudents ?? 0,
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
      },
    ];
  }, [feeStats]);

  if (!hasMounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of fee collection and student payment status.
        </p>
      </div>

      {/* Mini Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats ? (
          stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-white p-4">
              <div className={cn("flex items-center gap-2 mb-1", stat.color)}>
                <stat.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))
        ) : (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border bg-white p-4 animate-pulse">
                <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-8 w-28 bg-slate-200 rounded" />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Student Payment Status */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          Student Payment Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {studentStatusCards.map((card) => (
            <div
              key={card.label}
              className={cn(
                "rounded-xl border bg-white p-4",
                card.border
              )}
            >
              <p className={cn("text-2xl font-bold", card.color)}>
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-500" />
        </div>
      ) : !feeStats ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600">No fee data available</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Fee statistics will appear here once fees are configured.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Collection Overview Section */}
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Collection Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border bg-white overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          Collection Rate
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Overall fee collection progress
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0 text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {feeStats.totalNeeded && feeStats.totalNeeded > 0
                        ? `${Math.round((feeStats.totalCollected / feeStats.totalNeeded) * 100)}%`
                        : "N/A"}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{
                        width: feeStats.totalNeeded && feeStats.totalNeeded > 0
                          ? `${Math.min((feeStats.totalCollected / feeStats.totalNeeded) * 100, 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Rs. {(feeStats.totalCollected ?? 0).toLocaleString()} collected</span>
                    <span>of Rs. {(feeStats.totalNeeded ?? 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-between h-9 text-xs"
                    onClick={() => router.push("/accountant/fees")}
                  >
                    <span>View Fee Details</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border bg-white overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          Overdue Summary
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Students with overdue fees
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0 text-[10px] border bg-red-50 text-red-700 border-red-200">
                      {feeStats.overdueStudents ?? 0} students
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">
                    Rs. {(feeStats.totalOverdue ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total overdue amount across all classes
                  </p>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-between h-9 text-xs"
                    onClick={() => router.push("/accountant/students")}
                  >
                    <span>View Overdue Students</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
