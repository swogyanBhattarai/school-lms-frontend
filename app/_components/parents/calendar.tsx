// app/report-book/components/calendar.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarMonth } from "./types";

interface Props {
  month: CalendarMonth;
  todayDay: number | null;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Calendar({ month, todayDay, onPrev, onNext }: Props) {
  return (
    <div className="bg-[#FFFDF8] border border-[#E6D9BE] rounded-[18px] p-[18px] relative">
      {/* Binder rings */}
      <div className="absolute top-0 inset-x-0 flex justify-center gap-[26px] -translate-y-[9px]">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className="w-[10px] h-[10px] rounded-full bg-[#FAF4E8] border-[2.5px] border-[#E6D9BE]"
          />
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="font-[Fraunces] italic font-medium text-[19px]">{month.label}</div>
        <div className="flex gap-[6px]">
          <button
            onClick={onPrev}
            className="w-[30px] h-[30px] rounded-full border border-[#EFE6D2] bg-[#F1E7D4] flex items-center justify-center text-[#667081] hover:bg-[#FBEACD] hover:text-[#C67E1B] hover:border-transparent transition-all duration-150"
          >
            <ChevronLeft className="w-[15px] h-[15px]" strokeWidth={2.4} />
          </button>
          <button
            onClick={onNext}
            className="w-[30px] h-[30px] rounded-full border border-[#EFE6D2] bg-[#F1E7D4] flex items-center justify-center text-[#667081] hover:bg-[#FBEACD] hover:text-[#C67E1B] hover:border-transparent transition-all duration-150"
          >
            <ChevronRight className="w-[15px] h-[15px]" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[6px]">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center font-mono text-[10.5px] text-[#9BA3AF] font-medium pb-1.5">
            {wd}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: month.startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square bg-transparent" />
        ))}

        {/* Day cells */}
        {Array.from({ length: month.days }).map((_, i) => {
          const day = i + 1;
          const status = month.statuses[i] || "future";
          const isToday = todayDay !== null && day === todayDay;

          if (status === "future") {
            return (
              <div
                key={day}
                className={`aspect-square rounded-[9px] sm:rounded-[11px] flex flex-col items-center justify-center bg-transparent font-mono text-[11px] sm:text-xs text-[#9BA3AF] opacity-55 ${
                  isToday ? "border border-[#E39A2D] shadow-[0_0_0_3px_rgba(227,154,45,0.2)] font-bold text-[#23303D] opacity-100" : ""
                }`}
              >
                {day}
              </div>
            );
          }

          if (status === "holiday") {
            return (
              <div
                key={day}
                className={`aspect-square rounded-[9px] sm:rounded-[11px] flex flex-col items-center justify-center font-mono text-[11px] sm:text-xs text-[#9BA3AF] relative ${
                  isToday ? "border border-[#E39A2D] shadow-[0_0_0_3px_rgba(227,154,45,0.2)] font-bold text-[#23303D]" : ""
                }`}
                style={{
                  background: `repeating-linear-gradient(135deg, #F1E7D4, #F1E7D4 4px, #EFE6D2 4px, #EFE6D2 5px)`,
                }}
              >
                {day}
              </div>
            );
          }

          return (
            <div
              key={day}
              className={`aspect-square rounded-[9px] sm:rounded-[11px] flex flex-col items-center justify-center bg-[#F1E7D4] border border-transparent font-mono text-[11px] sm:text-xs text-[#667081] transition-transform duration-[120ms] hover:scale-[1.06] cursor-default ${
                isToday ? "!border-[#E39A2D] !shadow-[0_0_0_3px_rgba(227,154,45,0.2)] !font-bold !text-[#23303D]" : ""
              }`}
            >
              {day}
              {(status === "present" || status === "absent" || status === "leave") && (
                <span
                  className={`w-[7px] h-[7px] rounded-full mt-[3px] ${
                    status === "present"
                      ? "bg-[#4C7A5E]"
                      : status === "absent"
                      ? "bg-[#B14A3F]"
                      : "bg-[#E39A2D]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-[14px] mt-4">
        {[
          { label: "Present", color: "bg-[#4C7A5E]" },
          { label: "Absent", color: "bg-[#B14A3F]" },
          { label: "Leave", color: "bg-[#E39A2D]" },
          { label: "Holiday", color: "bg-[#E6D9BE]" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-[#667081] font-medium">
            <span className={`w-[9px] h-[9px] rounded-full ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}