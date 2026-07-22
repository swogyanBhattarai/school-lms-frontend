// app/_components/ui/FilterDropdown.tsx
"use client";

import type { LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  /** The Lucide icon to show inside the trigger (e.g. GraduationCap, Layers, Filter). */
  icon?: LucideIcon;
  /** Placeholder / "all" label shown when no specific value is selected. */
  placeholder: string;
  /** Currently selected value. */
  value: string;
  /** Called when the user selects an option. */
  onValueChange: (value: string) => void;
  /** Available options — the first should typically be the "all" option. */
  options: FilterOption[];
  /** Disables the dropdown, making it appear greyed out and non-interactive. */
  disabled?: boolean;
  /** Optional className for the SelectTrigger. */
  className?: string;
}

export default function FilterDropdown({
  icon: Icon,
  placeholder,
  value,
  onValueChange,
  options,
  disabled = false,
  className,
}: FilterDropdownProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-10 rounded-xl text-sm bg-white border-slate-200",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />}
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
