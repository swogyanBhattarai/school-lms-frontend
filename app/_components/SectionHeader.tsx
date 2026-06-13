"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

type SectionHeaderProps = {
  grade: number | string;
  sectionName: string;
  studentCount: number;
  teacherCount: number;
  onBack: () => void;
};

export default function SectionHeader({
  grade,
  sectionName,
  studentCount,
  teacherCount,
  onBack,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-sm font-bold text-amber-600">
                {sectionName}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Grade {grade} - Section {sectionName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {studentCount} students - {teacherCount} teachers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
