"use client";

import { Button } from "@/app/_components/ui/button";
import { ArrowLeft, Calendar, Save, Users } from "lucide-react";

interface AttendanceHeaderProps {
  className: string;
  subject: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  onBack: () => void;
  onSave: () => void;
}

export function AttendanceHeader({
  className,
  subject,
  date,
  totalStudents,
  presentCount,
  absentCount,
  leaveCount,
  onBack,
  onSave,
}: AttendanceHeaderProps) {
  const unmarkedCount = totalStudents - presentCount - absentCount - leaveCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm font-medium text-primary">{subject}</p>
            <h1 className="text-2xl font-bold text-foreground">{className}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{date}</span>
          </div>
          <Button onClick={onSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Attendance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-success/10">
            <span className="text-lg font-bold text-success">{presentCount}</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-destructive/10">
            <span className="text-lg font-bold text-destructive">{absentCount}</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-warning/10">
            <span className="text-lg font-bold text-warning">{leaveCount}</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{leaveCount}</p>
            <p className="text-xs text-muted-foreground">On Leave</p>
          </div>
        </div>
      </div>

      {unmarkedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <p className="text-sm text-primary">
            <span className="font-semibold">{unmarkedCount}</span> student{unmarkedCount !== 1 ? "s" : ""} still unmarked
          </p>
        </div>
      )}
    </div>
  );
}
