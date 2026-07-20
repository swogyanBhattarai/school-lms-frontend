// app/report-book/components/section-block.tsx
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  action?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
  children: React.ReactNode;
}

export function SectionBlock({ title, action, children }: Props) {
  return (
    <div className="mt-[26px] first:mt-0">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-[Fraunces] text-base font-semibold">{title}</h4>
        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1 text-[12.5px] font-semibold text-[#C67E1B] hover:underline bg-transparent border-none cursor-pointer py-1"
          >
            {action.label}
            <action.icon className="w-3 h-3" strokeWidth={3} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}