// app/report-book/components/attendance-panel.tsx
import { FilterChipRow } from "./filter-chip-row";
import { Calendar } from "./calendar";
import { SubjectBarChart } from "./subject-bar-chart";
import type { Subject, CalendarMonth, SubjectAttendance } from "./types";

interface Props {
  subjects: Subject[];
  calendarMonths: CalendarMonth[];
  calendarMonthIdx: number;
  onCalendarMonthChange: (idx: number) => void;
  subjectAttendance: SubjectAttendance[];
  filterSubject: string;
  onFilterChange: (subject: string) => void;
  todayDay: number;
  isActive: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function AttendancePanel({
  subjects,
  calendarMonths,
  calendarMonthIdx,
  onCalendarMonthChange,
  subjectAttendance,
  filterSubject,
  onFilterChange,
  todayDay,
  isActive,
  onPrev,
  onNext,
}: Props) {
  if (!isActive) return null;

  const filterItems = ["All subjects", ...subjects.map((s) => s.subjectName)];

  return (
    <div className="px-[14px] py-[18px] sm:px-[22px] sm:py-6 sm:pb-7 animate-in fade-in slide-in-from-bottom-1 duration-350">
      <div className="mb-[18px]">
        <h3 className="font-[Fraunces] font-semibold text-[21px] mb-[3px]">Attendance</h3>
        <p className="text-[13.5px] text-[#667081]">Every school day this month, at a glance.</p>
      </div>

      <FilterChipRow
        items={filterItems}
        activeItem={filterSubject}
        onSelect={onFilterChange}
      />

      <Calendar
        month={calendarMonths[calendarMonthIdx]}
        todayDay={calendarMonthIdx === 1 ? todayDay : null}
        onPrev={onPrev}
        onNext={onNext}
        canGoPrev={calendarMonthIdx > 0}
        canGoNext={calendarMonthIdx < calendarMonths.length - 1}
      />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-[Fraunces] text-base font-semibold">By subject this month</h4>
        </div>
        <SubjectBarChart data={subjectAttendance} />
      </div>
    </div>
  );
}