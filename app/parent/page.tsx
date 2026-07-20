// app/report-book/report-book-client.tsx
"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { BookOpen, Calendar, GraduationCap, LayoutGrid, NotebookPen } from "lucide-react";
import { TopBar } from "@/app/_components/parents/top-bar";
import { HeroCard } from "@/app/_components/parents/hero-card";
import { TabBar } from "@/app/_components/parents/tab-bar";
import { TabPanelShell } from "@/app/_components/parents/tab-panel-shell";
import { OverviewPanel } from "@/app/_components/parents/overview-panel";
import { AttendancePanel } from "@/app/_components/parents/attendance-panel";
import { ClassworkPanel } from "@/app/_components/parents/classwork-panel";
import { SubjectsPanel } from "@/app/_components/parents/subjects-panel";
import type { Student, Parent, Subject, CalendarMonth, SubjectAttendance, DiaryEntry } from "@/app/_components/parents/types";

type TabId = "overview" | "attendance" | "classwork" | "subjects";

interface GlanceData {
  attendancePercent: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  subjectCount: number;
  attentionItems: number;
  monthlyStatusPattern: string[];
}

interface Props {
  student: Student;
  parents: Parent[];
  glanceData: GlanceData;
  subjects: Subject[];
  calendarMonths: CalendarMonth[];
  subjectAttendance: SubjectAttendance[];
  diaryEntries: Record<string, DiaryEntry[]>;
  summaryNote: React.ReactNode;
}

const TABS = [
  { id: "overview" as TabId, icon: LayoutGrid, label: "Overview" },
  { id: "attendance" as TabId, icon: Calendar, label: "Attendance" },
  { id: "classwork" as TabId, icon: NotebookPen, label: "Classwork" },
  { id: "subjects" as TabId, icon: GraduationCap, label: "Subjects & teachers" },
];

export function ReportBookClient({
  student = {} as Student,
  parents = [],
  glanceData = {
    attendancePercent: 0,
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    subjectCount: 0,
    attentionItems: 0,
    monthlyStatusPattern: [],
  },
  subjects = [],
  calendarMonths = [],
  subjectAttendance = [],
  diaryEntries = {},
  summaryNote = "",
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [calendarMonthIdx, setCalendarMonthIdx] = useState(1);
  const [diaryDayOffset, setDiaryDayOffset] = useState(0);
  const [attendanceFilter, setAttendanceFilter] = useState("All subjects");

  const baseDate = new Date(2026, 6, 20);

  const todaysPreview = diaryEntries["0"]?.[0] || null;

  const handleCalendarPrev = () => {
    if (calendarMonthIdx > 0) setCalendarMonthIdx(calendarMonthIdx - 1);
  };

  const handleCalendarNext = () => {
    if (calendarMonthIdx < calendarMonths.length - 1) setCalendarMonthIdx(calendarMonthIdx + 1);
  };

  return (
    <div className="max-w-[980px] mx-auto px-[14px] sm:px-[18px] pb-16 pt-[18px]">
      <TopBar backHref="/children" />

      <HeroCard
        student={student}
        summaryNote={summaryNote}
      />

      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
      />

      <TabPanelShell>
        <OverviewPanel
          glanceData={glanceData}
          todaysPreview={todaysPreview}
          parents={parents}
          subjects={subjects}
          onNavigateToClasswork={() => setActiveTab("classwork")}
          isActive={activeTab === "overview"}
        />

        <AttendancePanel
          subjects={subjects}
          calendarMonths={calendarMonths}
          calendarMonthIdx={calendarMonthIdx}
          onCalendarMonthChange={setCalendarMonthIdx}
          subjectAttendance={subjectAttendance}
          filterSubject={attendanceFilter}
          onFilterChange={setAttendanceFilter}
          todayDay={20}
          isActive={activeTab === "attendance"}
          onPrev={handleCalendarPrev}
          onNext={handleCalendarNext}
        />

        <ClassworkPanel
          diaryEntries={diaryEntries}
          dayOffset={diaryDayOffset}
          onDayOffsetChange={setDiaryDayOffset}
          baseDate={baseDate}
          subjects={subjects}
          isActive={activeTab === "classwork"}
        />

        <SubjectsPanel
          subjects={subjects}
          isActive={activeTab === "subjects"}
        />
      </TabPanelShell>
    </div>
  );
}

export default ReportBookClient;