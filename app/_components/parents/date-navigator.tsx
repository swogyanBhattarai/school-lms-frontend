// app/report-book/components/date-navigator.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  bsDate: string;
  fullDate: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function DateNavigator({ bsDate, fullDate, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex items-center justify-between bg-[#F1E7D4] border border-[#EFE6D2] rounded-[18px] px-3 py-2.5 mb-5">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onPrev}
          className="w-[30px] h-[30px] rounded-full border border-[#EFE6D2] bg-[#FFFDF8] flex items-center justify-center text-[#667081] hover:bg-[#FBEACD] hover:text-[#C67E1B] hover:border-transparent transition-all duration-150"
        >
          <ChevronLeft className="w-[15px] h-[15px]" strokeWidth={2.4} />
        </button>
        <div className="flex flex-col">
          <span className="font-mono text-[11px] text-[#9BA3AF]">{bsDate}</span>
          <span className="font-bold text-[14.5px]">{fullDate}</span>
        </div>
        <button
          onClick={onNext}
          className="w-[30px] h-[30px] rounded-full border border-[#EFE6D2] bg-[#FFFDF8] flex items-center justify-center text-[#667081] hover:bg-[#FBEACD] hover:text-[#C67E1B] hover:border-transparent transition-all duration-150"
        >
          <ChevronRight className="w-[15px] h-[15px]" strokeWidth={2.4} />
        </button>
      </div>
      <button
        onClick={onToday}
        className="border border-[#EFE6D2] bg-[#FFFDF8] text-[#667081] font-semibold text-xs px-3 py-1.5 rounded-full hover:border-[#E39A2D] hover:text-[#C67E1B] transition-all duration-150"
      >
        Today
      </button>
    </div>
  );
}