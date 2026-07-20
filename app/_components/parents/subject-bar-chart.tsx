// app/report-book/components/subject-bar-chart.tsx
import type { SubjectAttendance } from "./types";

interface Props {
  data: SubjectAttendance[];
}

export function SubjectBarChart({ data }: Props) {
  return (
    <div>
      {data.map((item) => {
        const percent = Math.round((item.presentStudents / item.totalStudents) * 100);
        const bgColor =
          percent >= 90 ? "bg-[#4C7A5E]" : percent >= 75 ? "bg-[#E39A2D]" : "bg-[#B14A3F]";
        const textColor =
          percent >= 90 ? "text-[#4C7A5E]" : percent >= 75 ? "text-[#E39A2D]" : "text-[#B14A3F]";

        return (
          <div key={item.subjectId} className="mb-3.5 last:mb-0">
            <div className="flex justify-between mb-1.5 text-[13px]">
              <span className="font-semibold">{item.subjectName}</span>
              <span className={`font-mono font-semibold ${textColor}`}>{percent}%</span>
            </div>
            <div className="h-[7px] bg-[#F1E7D4] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-[700ms] ease-[cubic-bezier(.2,.7,.3,1)] ${bgColor}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}