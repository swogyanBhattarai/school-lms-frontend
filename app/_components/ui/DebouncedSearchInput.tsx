// app/_components/ui/DebouncedSearchInput.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface DebouncedSearchInputProps {
  /** Placeholder text shown inside the input. */
  placeholder?: string;
  /**
   * External control of the input value.
   * - If provided → controlled mode: the input displays this value.
   * - If undefined → uncontrolled mode: the component owns its own state (default).
   * The debounce delay still governs when `onChange` is called.
   */
  value?: string;
  /** Called with the debounced value after the user stops typing. */
  onChange?: (value: string) => void;
  /** Debounce delay in milliseconds. Default 300. */
  debounceMs?: number;
  /** Optional className for the wrapper div. */
  className?: string;
  /** Optional className passed directly to the Input element. */
  inputClassName?: string;
}

export default function DebouncedSearchInput({
  placeholder = "Search...",
  value: externalValue,
  onChange,
  debounceMs = 300,
  className,
  inputClassName,
}: DebouncedSearchInputProps) {
  const isControlled = externalValue !== undefined;
  const [internalValue, setInternalValue] = useState(externalValue ?? "");

  // Sync from external value when in controlled mode
  useEffect(() => {
    if (isControlled) setInternalValue(externalValue);
  }, [externalValue, isControlled]);

  // Debounce the internal value and notify parent
  useEffect(() => {
    if (debounceMs <= 0) {
      onChange?.(internalValue);
      return;
    }

    const timer = setTimeout(() => {
      onChange?.(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalValue, debounceMs]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setInternalValue(next);
      // When debounce is 0 (instant), fire immediately
      if (debounceMs <= 0) onChange?.(next);
    },
    [debounceMs, onChange],
  );

  const handleClear = useCallback(() => {
    setInternalValue("");
    onChange?.("");
  }, [onChange]);

  // Always display the immediate internal value so typing feels instant.
  // The `value` prop is only used for external sync (e.g. reset on "Clear filters")
  // via the useEffect above.
  const displayValue = internalValue;

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={cn(
          "pl-9 h-10 rounded-xl border-slate-200 bg-white text-sm w-full",
          inputClassName,
        )}
      />
      {displayValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
