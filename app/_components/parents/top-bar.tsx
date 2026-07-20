// app/report-book/components/top-bar.tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  backHref: string;
}

export function TopBar({ backHref }: Props) {
  return (
    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
      <Link
        href={backHref}
        className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-[13.5px] font-semibold text-[#667081] hover:text-[#23303D] hover:bg-[rgba(35,48,61,0.05)] py-2 px-2.5 sm:px-3 rounded-full transition-colors duration-150 no-underline"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to my children</span>
        <span className="sm:hidden">Back</span>
      </Link>
      <div className="flex items-center gap-2 font-mono text-[10.5px] sm:text-[11px] tracking-[0.06em] uppercase text-[#9BA3AF]">
        <span className="w-[6px] h-[6px] rounded-full bg-[#E39A2D]" />
        GyanJyoti School
      </div>
    </div>
  );
}
