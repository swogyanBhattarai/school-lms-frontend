"use client";

import { Button } from "@/app/_components/ui/button";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface QuickActionsProps {
  onMarkAllPresent: () => void;
  onMarkAllAbsent: () => void;
  onReset: () => void;
}

export function QuickActions({
  onMarkAllPresent,
  onMarkAllAbsent,
  onReset,
}: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Quick actions:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onMarkAllPresent}
        className="gap-1.5 text-success border-success/30 hover:bg-success/10 hover:text-success hover:border-success/50"
      >
        <CheckCircle2 className="h-4 w-4" />
        Mark All Present
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onMarkAllAbsent}
        className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
      >
        <XCircle className="h-4 w-4" />
        Mark All Absent
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-1.5"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
