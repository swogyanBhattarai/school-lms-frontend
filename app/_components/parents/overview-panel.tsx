// app/report-book/components/overview-panel.tsx
import { BookOpen, ArrowRight } from "lucide-react";
import { GlanceCard } from "./glance-card";
import { SectionBlock } from "./section-block";
import { PreviewCard } from "./preview-card";
import { ContactCard } from "./contact-card";
import type { Parent, Subject, DiaryEntry } from "./types";

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
  glanceData: GlanceData;
  todaysPreview: DiaryEntry | null;
  parents: Parent[];
  subjects: Subject[];
  onNavigateToClasswork: () => void;
  isActive: boolean;
}

export function OverviewPanel({
  glanceData,
  todaysPreview,
  parents,
  subjects,
  onNavigateToClasswork,
  isActive,
}: Props) {
  if (!isActive) return null;

  const previewSubject = todaysPreview
    ? subjects.find((s) => s.subjectName === todaysPreview.subjectName)
    : null;

  return (
    <div className="px-[14px] py-[18px] sm:px-[22px] sm:py-6 sm:pb-7 animate-in fade-in slide-in-from-bottom-1 duration-350">
      <div className="mb-[18px]">
        <h3 className="font-[Fraunces] font-semibold text-[21px] mb-[3px]">This month at a glance</h3>
        <p className="text-[13.5px] text-[#667081]">A quick summary of how Aarohi's month is going.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-[22px]">
        <GlanceCard
          variant="sage"
          value={`${glanceData.attendancePercent}%`}
          label="Attendance"
          subText={`${glanceData.presentDays} present · ${glanceData.absentDays} absent · ${glanceData.leaveDays} leave`}
          attendanceDots={glanceData.monthlyStatusPattern as any[]}
        />
        <GlanceCard
          variant="marigold"
          value={glanceData.subjectCount}
          label="Subjects"
          subText="Across 5 teachers this term"
        />
        <GlanceCard
          variant="brick"
          value={glanceData.attentionItems}
          label="Needs attention"
          subText={`${glanceData.absentDays} absences this month`}
        />
      </div>

      <SectionBlock
        title="Today's classwork"
        action={{
          label: "Open classwork",
          icon: ArrowRight,
          onClick: onNavigateToClasswork,
        }}
      >
        {todaysPreview && previewSubject ? (
          <PreviewCard
            icon={BookOpen}
            subjectName={todaysPreview.subjectName}
            subjectColor={previewSubject.color}
            title={todaysPreview.title}
            text={todaysPreview.content}
          />
        ) : (
          <p className="text-sm text-[#9BA3AF] italic">No classwork for today.</p>
        )}
      </SectionBlock>

      <SectionBlock title="Family on record">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {parents.map((parent) => (
            <ContactCard
              key={parent.parentName}
              name={parent.parentName}
              initials={parent.initials}
              role={parent.role}
            />
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}