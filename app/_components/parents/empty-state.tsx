// app/report-book/components/empty-state.tsx
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="text-center py-[46px] px-5 bg-[#F1E7D4] border-[1.5px] border-dashed border-[#E6D9BE] rounded-[18px]">
      <div className="w-[52px] h-[52px] rounded-full bg-[#FFFDF8] border border-[#EFE6D2] flex items-center justify-center mx-auto mb-3.5 text-[#9BA3AF]">
        <Icon className="w-6 h-6" strokeWidth={2} />
      </div>
      <p className="font-bold text-[14.5px] mb-1">{title}</p>
      <p className="text-[12.5px] text-[#9BA3AF]">{description}</p>
    </div>
  );
}