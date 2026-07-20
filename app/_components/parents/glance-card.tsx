// app/report-book/components/glance-card.tsx
import { cn } from "@/lib/utils";

type DayStatus = "present" | "absent" | "leave" | "holiday";

interface Props {
  variant: "sage" | "marigold" | "brick";
  value: string | number;
  label: string;
  subText: string;
  attendanceDots?: DayStatus[];
}

const variantStyles = {
  sage: "text-[#4C7A5E]",
  marigold: "text-[#C67E1B]",
  brick: "text-[#B14A3F]",
};

export function GlanceCard({ variant, value, label, subText, attendanceDots }: Props) {
  return (
    <div className="bg-[#F1E7D4] border border-[#EFE6D2] rounded-[18px] p-3 sm:p-4 sm:flex sm:flex-col">
      {/* Mobile: flex row with space-between; Desktop: block */}
      <div className="flex items-center justify-between sm:block">
        <div>
          <div className={cn("font-[Fraunces] font-bold text-[22px] sm:text-[26px] leading-none", variantStyles[variant])}>
            {value}
          </div>
          <div className="text-[11.5px] uppercase tracking-[0.05em] text-[#9BA3AF] font-semibold mt-1.5">
            {label}
          </div>
        </div>
        <div className="text-[12.5px] text-[#667081] mt-0 sm:mt-1">{subText}</div>
      </div>

      {attendanceDots && (
        <div className="flex gap-[3px] mt-2.5 flex-wrap">
          {attendanceDots.map((status, i) => (
            <span
              key={i}
              className={cn("w-[7px] h-[7px] rounded-full", {
                "bg-[#4C7A5E]": status === "present",
                "bg-[#B14A3F]": status === "absent",
                "bg-[#E39A2D]": status === "leave",
                "bg-[#E6D9BE]": status === "holiday",
              })}
            />
          ))}
        </div>
      )}
    </div>
  );
}