// app/report-book/components/hero-card.tsx
import { Calendar, Clock, GraduationCap } from "lucide-react";
import { Avatar } from "./avatar";
import { MetaPill } from "./meta-pill";
import type { Student } from "./types";

interface Props {
  student: Student;
  summaryNote: React.ReactNode;
}

export function HeroCard({ student, summaryNote }: Props) {
  return (
    <div className="relative mt-2.5 rounded-[26px] border border-[#E6D9BE] bg-[#FFFDF8] px-4 py-[22px] sm:px-6 sm:py-7 shadow-[0_1px_2px_rgba(35,48,61,0.04),0_10px_26px_-14px_rgba(35,48,61,0.18)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-600">
      {/* Gradient top border - marigold to sage to sky */}
      <div 
        className="absolute inset-x-0 top-0 h-[5px] opacity-90"
        style={{
          background: "linear-gradient(90deg, #E39A2D, #4C7A5E 60%, #4E6E8E)",
        }}
      />

      <div className="flex items-start gap-[18px] flex-wrap">
        <Avatar
          initials={student.initials}
          size="lg"
          className="w-16 h-16 sm:w-[76px] sm:h-[76px] text-[22px] sm:text-[28px] rounded-[18px] sm:rounded-[22px] flex-shrink-0"
        />

        <div className="flex-1 min-w-[200px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#C67E1B] font-medium mb-1">
            Report Book
          </p>
          <h1 className="font-[Fraunces] font-semibold text-2xl sm:text-[clamp(26px,4.5vw,34px)] leading-[1.05] text-[#23303D] mb-2">
            {student.studentName}
          </h1>

          <div className="flex flex-wrap gap-x-2.5 gap-y-2 items-center">
            <MetaPill icon={GraduationCap} label={`${student.schoolClassName} · Section ${student.sectionName}`} isActive />
            <MetaPill icon={Calendar} label={`Born ${student.dateOfBirth}`} />
            <MetaPill icon={Clock} label={`Roll No. ${student.rollNumber}`} />
          </div>
        </div>
      </div>

      <p className="mt-[18px] pt-4 border-t border-dashed border-[#E6D9BE] font-[Fraunces] italic font-normal text-[15.5px] text-[#667081] leading-[1.5]">
        {summaryNote}
      </p>
    </div>
  );
}