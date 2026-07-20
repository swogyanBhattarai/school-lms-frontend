// app/report-book/components/meta-pill.tsx
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
}

export function MetaPill({ icon: Icon, label, isActive }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs sm:text-[12.5px] font-semibold px-3 py-1.5 rounded-full border ${
        isActive
          ? "bg-[#E3EEE6] text-[#4C7A5E] border-transparent"
          : "bg-[#F1E7D4] text-[#667081] border-[#EFE6D2]"
      }`}
    >
      <Icon className="w-[13px] h-[13px]" strokeWidth={2.4} />
      {label}
    </span>
  );
}