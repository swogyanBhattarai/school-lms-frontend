"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { AttendanceToggle, AttendanceStatus } from "./attendance-toggle";

interface StudentRowProps {
  id: string;
  name: string;
  rollNumber: string;
  avatarUrl?: string;
  status: AttendanceStatus;
  onStatusChange: (id: string, status: AttendanceStatus) => void;
}

export function StudentRow({
  id,
  name,
  rollNumber,
  avatarUrl,
  status,
  onStatusChange,
}: StudentRowProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between py-4 px-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-11 w-11 border-2 border-secondary">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">Roll No: {rollNumber}</p>
        </div>
      </div>
      <AttendanceToggle
        status={status}
        onChange={(newStatus) => onStatusChange(id, newStatus)}
      />
    </div>
  );
}
