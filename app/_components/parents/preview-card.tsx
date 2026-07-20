// app/report-book/components/preview-card.tsx
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  subjectName: string;
  subjectColor: string;
  title: string;
  text: string;
}

export function PreviewCard({ icon: Icon, subjectName, subjectColor, title, text }: Props) {
  return (
    <div className="flex gap-3.5 items-start bg-[#F1E7D4] border border-[#EFE6D2] rounded-[18px] p-[15px] sm:p-4">
      <div
        className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${subjectColor}22`, color: subjectColor }}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
      </div>
      <div>
        <span
          className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1.5"
          style={{ backgroundColor: `${subjectColor}22`, color: subjectColor }}
        >
          {subjectName}
        </span>
        <p className="font-bold text-sm mb-[3px]">{title}</p>
        <p className="text-[13px] text-[#667081] leading-[1.5]">{text}</p>
      </div>
    </div>
  );
}