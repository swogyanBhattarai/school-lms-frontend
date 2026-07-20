// app/report-book/components/diary-grid.tsx
import type { DiaryEntry } from "./types";

interface Props {
  entries: DiaryEntry[];
  getSubjectColor: (subjectName: string) => string;
}

export function DiaryGrid({ entries, getSubjectColor }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
      {entries.map((entry) => {
        const color = getSubjectColor(entry.subjectName);
        return (
          <div
            key={entry.diaryId}
            className="bg-[#FFFDF8] border border-[#E6D9BE] rounded-[18px] p-4 relative overflow-hidden"
            style={{
              backgroundImage: `repeating-linear-gradient(#FFFDF8 0 30px, #EFE6D2 30px 31px)`,
            }}
          >
            {/* Red margin line */}
            <div className="absolute left-[22px] inset-y-0 w-px bg-[rgba(177,74,63,0.18)]" />

            <div className="relative pl-1.5">
              <span
                className="inline-flex items-center gap-[5px] text-[11px] font-bold px-[9px] py-[3px] rounded-full mb-[9px]"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {entry.subjectName}
              </span>

              <h4 className="font-[Fraunces] italic font-medium text-[17px] mb-2">
                {entry.title}
              </h4>

              <p className="text-[13px] text-[#667081] leading-[1.6] mb-3.5">
                {entry.content}
              </p>

              <div className="flex items-center gap-2 pt-2.5 border-t border-dashed border-[#E6D9BE]">
                <div className="w-[26px] h-[26px] rounded-full bg-[#E5ECF2] text-[#4E6E8E] flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {entry.teacherInitials}
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold">{entry.teacherName}</div>
                  <div className="text-[10.5px] text-[#9BA3AF] font-mono">Teacher</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}