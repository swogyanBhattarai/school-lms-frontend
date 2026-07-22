// app/_components/ui/ClearFiltersButton.tsx
"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ClearFiltersButtonProps {
  /** Number of active filters. When <= 0 the button is hidden. */
  activeFiltersCount: number;
  /** Called when the button is clicked. */
  onClick: () => void;
  /** Optional label override (default "Clear"). */
  label?: string;
  /** Optional className for the button. */
  className?: string;
}

export default function ClearFiltersButton({
  activeFiltersCount,
  onClick,
  label = "Clear",
  className,
}: ClearFiltersButtonProps) {
  if (activeFiltersCount <= 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("h-10 px-3 rounded-xl shrink-0", className)}
    >
      <RotateCcw className="h-4 w-4 mr-1.5" />
      {label}
    </Button>
  );
}
