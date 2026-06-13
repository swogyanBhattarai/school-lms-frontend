import { cn } from "@/lib/utils";

type Status =
  | "active"
  | "inactive"
  | "draft"
  | "archived"
  | "upcoming"
  | "completed";

const MAP: Record<Status, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 ring-green-600/20",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-gray-500/20",
  },
  draft: {
    label: "Draft",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20",
  },
  archived: {
    label: "Archived",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-500/20",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20",
  },
  completed: {
    label: "Completed",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-600/20",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = MAP[status] ?? MAP.inactive;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        cfg.className,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}
