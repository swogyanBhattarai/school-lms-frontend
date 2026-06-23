"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  NEPALI_MONTHS,
  toNepaliNumber,
  getBSMonthDays,
  convertBSToAD,
  getTodayBS,
} from "@/lib/nepali-calendar";

interface MonthYearNavigatorProps {
  value?: { year: number; month: number };
  onChange?: (year: number, month: number) => void;
  className?: string;
  disabled?: boolean;
}

export function MonthYearNavigator({
  value,
  onChange,
  className,
  disabled = false,
}: MonthYearNavigatorProps) {
  const today = getTodayBS();
  const [currentYear, setCurrentYear] = useState(value?.year || today.year);
  const [currentMonth, setCurrentMonth] = useState(value?.month || today.month);
  const [showAD, setShowAD] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      setCurrentYear(value.year);
      setCurrentMonth(value.month);
    }
  }, [value]);

  const monthDays = getBSMonthDays(currentYear, currentMonth);

  // Generate year range
  const yearRange = useMemo(() => {
    const years = [];
    if (showAD) {
      const startAD = convertBSToAD(1975, 0, 1).getUTCFullYear();
      const endAD = convertBSToAD(2099, 11, 1).getUTCFullYear();
      for (let y = startAD; y <= endAD; y++) {
        years.push(y);
      }
    } else {
      for (let y = 1975; y <= 2099; y++) {
        years.push(y);
      }
    }
    return years;
  }, [showAD]);

  // Get AD months for BS month selector
  const adMonthsForYear = useMemo(() => {
    if (!showAD) return [];
    const months = [];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    for (let m = 0; m < 12; m++) {
      const daysInMonth = getBSMonthDays(currentYear, m);
      const firstDayAD = convertBSToAD(currentYear, m, 1);
      const lastDayAD = convertBSToAD(currentYear, m, daysInMonth);

      const startMonth = monthNames[firstDayAD.getUTCMonth()];
      const endMonth = monthNames[lastDayAD.getUTCMonth()];

      months.push({
        bsMonth: m,
        label: startMonth !== endMonth ? `${startMonth}/${endMonth}` : startMonth,
      });
    }
    return months;
  }, [currentYear, showAD]);

  const previousMonth = () => {
    let newMonth: number;
    let newYear: number;
    if (currentMonth === 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    } else {
      newMonth = currentMonth - 1;
      newYear = currentYear;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onChange?.(newYear, newMonth);
  };

  const nextMonth = () => {
    let newMonth: number;
    let newYear: number;
    if (currentMonth === 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    } else {
      newMonth = currentMonth + 1;
      newYear = currentYear;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onChange?.(newYear, newMonth);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(month);
    setShowMonthSelector(false);
    onChange?.(currentYear, month);
  };

  const handleYearSelect = (year: number) => {
    if (showAD) {
      const firstDayAD = convertBSToAD(currentYear, currentMonth, 1);
      const currentADYear = firstDayAD.getUTCFullYear();
      const diff = year - currentADYear;
      const newYear = currentYear + diff;
      setCurrentYear(newYear);
      onChange?.(newYear, currentMonth);
    } else {
      setCurrentYear(year);
      onChange?.(year, currentMonth);
    }
    setShowYearSelector(false);
  };

  const getDisplayMonth = () => {
    if (showAD) {
      const firstDayAD = convertBSToAD(currentYear, currentMonth, 1);
      const lastDayAD = convertBSToAD(currentYear, currentMonth, monthDays);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const startMonth = months[firstDayAD.getUTCMonth()];
      const endMonth = months[lastDayAD.getUTCMonth()];
      return startMonth !== endMonth ? `${startMonth}/${endMonth}` : startMonth;
    }
    return NEPALI_MONTHS[currentMonth];
  };

  const getDisplayYear = () => {
    if (showAD) {
      const adDate = convertBSToAD(currentYear, currentMonth, 1);
      return adDate.getUTCFullYear();
    }
    return currentYear;
  };

  const getTodayDisplayYear = () => {
    if (showAD) {
      const adDate = convertBSToAD(today.year, today.month, 1);
      return adDate.getUTCFullYear();
    }
    return today.year;
  };

  const yearSelectorRef = useRef<HTMLDivElement>(null);
  const currentYearRef = useRef<HTMLButtonElement>(null);
  const todayYearRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showYearSelector && currentYearRef.current) {
      setTimeout(() => {
        currentYearRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }, 0);
    }
  }, [showYearSelector, showAD]);

  // Close selectors when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".month-year-navigator")) {
        setShowMonthSelector(false);
        setShowYearSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("month-year-navigator relative", className)}>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Previous Month Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-muted transition-colors flex-shrink-0"
          onClick={previousMonth}
          disabled={disabled}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
          {/* Month Button - Full width on mobile */}
          <button
            onClick={() => {
              setShowMonthSelector(!showMonthSelector);
              setShowYearSelector(false);
            }}
            disabled={disabled}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg",
              "hover:bg-muted transition-colors text-sm sm:text-base font-semibold truncate",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              showMonthSelector && "bg-muted",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="truncate">{getDisplayMonth()}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </button>

          {/* Year Button - Compact on mobile */}
          <button
            onClick={() => {
              setShowYearSelector(!showYearSelector);
              setShowMonthSelector(false);
            }}
            disabled={disabled}
            className={cn(
              "flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1.5 rounded-lg",
              "hover:bg-muted transition-colors text-sm sm:text-base font-semibold",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              showYearSelector && "bg-muted",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className={!showAD ? "font-noto-devanagari" : ""}>
              {showAD ? getDisplayYear() : toNepaliNumber(currentYear)}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </button>
        </div>

        {/* Next Month Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-muted transition-colors flex-shrink-0"
          onClick={nextMonth}
          disabled={disabled}
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        {/* AD/BS Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted transition-colors flex-shrink-0",
            showAD && "bg-muted text-primary",
          )}
          onClick={() => {
            setShowAD(!showAD);
            setShowMonthSelector(false);
            setShowYearSelector(false);
          }}
          title={showAD ? "Switch to Bikram Sambat" : "Switch to Gregorian"}
          disabled={disabled}
        >
          <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Month Selector Dropdown */}
      {showMonthSelector && (
        <div className="absolute z-50 mt-2 left-0 sm:left-0 p-2 sm:p-2.5 bg-popover border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="grid grid-cols-3 gap-1.5 w-[220px] sm:w-[260px]">
            {(showAD
              ? adMonthsForYear
              : NEPALI_MONTHS.map((name, idx) => ({ bsMonth: idx, label: name }))
            ).map((item) => (
              <button
                key={item.bsMonth}
                onClick={() => handleMonthSelect(item.bsMonth)}
                className={cn(
                  "px-2 py-1.5 sm:px-2.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-all truncate",
                  "hover:bg-muted/80",
                  currentMonth === item.bsMonth
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "hover:shadow-sm",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Year Selector Dropdown */}
      {showYearSelector && (
        <div className="absolute z-50 mt-2 left-0 sm:left-0 p-2 sm:p-2.5 bg-popover border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 w-[220px] sm:w-[260px]">
          <div className="space-y-1.5 sm:space-y-2">
            {/* Quick jump button */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  if (todayYearRef.current) {
                    todayYearRef.current.scrollIntoView({
                      block: "center",
                      behavior: "smooth",
                    });
                  }
                }}
              >
                Jump to{" "}
                {showAD ? getTodayDisplayYear() : toNepaliNumber(today.year)}
              </Button>
            </div>

            {/* Year grid */}
            <div
              ref={yearSelectorRef}
              className="h-[185px] sm:h-[220px] overflow-y-auto rounded-lg border"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "hsl(var(--muted-foreground) / 0.2) transparent",
              }}
              onWheel={(e) => {
                e.stopPropagation();
                const container = e.currentTarget;
                container.scrollTop += e.deltaY;
              }}
            >
              <div className="grid grid-cols-3 gap-1.5 p-1.5 sm:p-2">
                {yearRange.map((year) => {
                  const isCurrentYear = showAD
                    ? getDisplayYear() === year
                    : currentYear === year;
                  const isTodayYear = showAD
                    ? getTodayDisplayYear() === year
                    : today.year === year;

                  return (
                    <button
                      key={year}
                      ref={
                        isCurrentYear
                          ? currentYearRef
                          : isTodayYear
                            ? todayYearRef
                            : null
                      }
                      onClick={() => handleYearSelect(year)}
                      className={cn(
                        "px-1.5 py-1.5 sm:px-2 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-all",
                        "hover:bg-muted/80",
                        isCurrentYear
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          : isTodayYear
                            ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/20"
                            : "hover:shadow-sm",
                      )}
                    >
                      <span className={!showAD ? "font-noto-devanagari" : ""}>
                        {showAD ? year : toNepaliNumber(year)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}