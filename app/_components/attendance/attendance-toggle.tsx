"use client";

import { cn } from "@/lib/utils";
import { Check, X, Clock } from "lucide-react";

export type AttendanceStatus = "present" | "absent" | "leave" | null;

interface AttendanceToggleProps {
  status: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
}

export function AttendanceToggle({ status, onChange }: AttendanceToggleProps) {
  const options = [
    {
      value: "present" as const,
      label: "Present",
      icon: Check,
      activeClasses: "bg-success text-success-foreground border-success",
      hoverClasses: "hover:bg-success/10 hover:text-success hover:border-success/50",
    },
    {
      value: "absent" as const,
      label: "Absent",
      icon: X,
      activeClasses: "bg-destructive text-destructive-foreground border-destructive",
      hoverClasses: "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50",
    },
    {
      value: "leave" as const,
      label: "Leave",
      icon: Clock,
      activeClasses: "bg-warning text-warning-foreground border-warning",
      hoverClasses: "hover:bg-warning/10 hover:text-warning hover:border-warning/50",
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = status === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(isActive ? null : option.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200",
              isActive
                ? option.activeClasses
                : cn("bg-transparent text-muted-foreground border-border", option.hoverClasses)
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
