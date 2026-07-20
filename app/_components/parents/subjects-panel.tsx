// app/report-book/components/subjects-panel.tsx
import type { Subject } from "./types";

interface Props {
  subjects: Subject[];
  isActive: boolean;
}

export function SubjectsPanel({ subjects, isActive }: Props) {
  if (!isActive) return null;

  return (
    <div className="px-[14px] py-[18px] sm:px-[22px] sm:py-6 sm:pb-7 animate-in fade-in slide-in-from-bottom-1 duration-350">
      <div className="mb-[18px]">
        <h3 className="font-[Fraunces] font-semibold text-[21px] mb-[3px]">Subjects & teachers</h3>
        <p className="text-[13.5px] text-[#667081]">Everyone teaching Aarohi this term.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {subjects.map((subject) => (
          <div
            key={subject.subjectId}
            className="bg-[#F1E7D4] border border-[#EFE6D2] rounded-[18px] p-[15px] flex gap-3 items-start transition-all duration-150 hover:border-[#E39A2D] hover:-translate-y-0.5 cursor-default"
          >
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: subject.color }}
            >
              <subject.icon className="w-[19px] h-[19px]" strokeWidth={2} />
            </div>
            <div>
              <div className="font-bold text-[14.5px] mb-[3px]">{subject.subjectName}</div>
              <div className="text-[12.5px] text-[#667081]">{subject.teacher}</div>
              <div className="text-[10.5px] font-mono text-[#9BA3AF] mt-1">{subject.role.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}