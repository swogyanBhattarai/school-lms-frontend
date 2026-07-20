// app/report-book/components/classwork-panel.tsx
import { BookOpen } from "lucide-react";
import { DateNavigator } from "./date-navigator";
import { DiaryGrid } from "./diary-grid";
import { EmptyState } from "./empty-state";
import type { Subject, DiaryEntry } from "./types";

interface Props {
  diaryEntries: Record<string, DiaryEntry[]>;
  dayOffset: number;
  onDayOffsetChange: (offset: number) => void;
  baseDate: Date;
  subjects: Subject[];
  isActive: boolean;
}

export function ClassworkPanel({
  diaryEntries,
  dayOffset,
  onDayOffsetChange,
  baseDate,
  subjects,
  isActive,
}: Props) {
  if (!isActive) return null;

  const d = new Date(baseDate);
  d.setDate(d.getDate() + dayOffset);

  const fullDate = d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bsDay = 5 + dayOffset;
  const bsDate = `Poush ${bsDay}, 2082`;

  const entries = diaryEntries[String(dayOffset)] || [];

  const getSubjectColor = (subjectName: string) => {
    return subjects.find((s) => s.subjectName === subjectName)?.color || "#4E6E8E";
  };

  return (
    <div className="px-[14px] py-[18px] sm:px-[22px] sm:py-6 sm:pb-7 animate-in fade-in slide-in-from-bottom-1 duration-350">
      <div className="mb-[18px]">
        <h3 className="font-[Fraunces] font-semibold text-[21px] mb-[3px]">Classwork & diary</h3>
        <p className="text-[13.5px] text-[#667081]">What Aarohi's teachers noted down, day by day.</p>
      </div>

      <DateNavigator
        bsDate={bsDate}
        fullDate={fullDate}
        onPrev={() => onDayOffsetChange(dayOffset - 1)}
        onNext={() => onDayOffsetChange(dayOffset + 1)}
        onToday={() => onDayOffsetChange(0)}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classwork noted for this day"
          description="Try another date, or check back once teachers add today's notes."
        />
      ) : (
        <DiaryGrid entries={entries} getSubjectColor={getSubjectColor} />
      )}
    </div>
  );
}