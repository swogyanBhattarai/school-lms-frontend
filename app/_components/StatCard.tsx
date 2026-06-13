import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconFg?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "bg-primary/10",
  iconFg = "text-primary",
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground leading-tight">
          {label}
        </p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
            iconColor
          )}
        >
          <Icon
            className={cn("h-[18px] w-[18px]", iconFg)}
            aria-hidden="true"
          />
        </span>
      </div>

      <div>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-md",
                trend.positive
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          ) : null}
          {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
        </div>
      </div>
    </div>
  );
}
