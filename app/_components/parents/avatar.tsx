// app/report-book/components/avatar.tsx
import { cn } from "@/lib/utils";

interface Props {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-[26px] h-[26px] text-[11px] rounded-full",
  md: "w-[34px] h-[34px] text-xs rounded-full",
  lg: "w-16 h-16 sm:w-[76px] sm:h-[76px] text-[22px] sm:text-[28px] rounded-[18px] sm:rounded-[22px]",
};

export function Avatar({ initials, size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-[Fraunces] font-semibold text-white flex-shrink-0",
        "shadow-[0_8px_30px_-12px_rgba(196,126,27,0.35)]",
        sizeClasses[size],
        className
      )}
      style={{
        background: "linear-gradient(150deg, #E39A2D, #D6892A 55%, #B14A3F)",
      }}
    >
      {initials}
    </div>
  );
}