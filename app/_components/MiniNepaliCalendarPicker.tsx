"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Calendar,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import {
  NEPALI_MONTHS,
  NEPALI_WEEK_DAYS,
  ENGLISH_WEEK_DAYS,
  toNepaliNumber,
  getBSMonthDays,
  getBSMonthStartDay,
  getTodayBS,
  convertBSToAD,
  convertADToBS,
  formatBSDate,
} from "@/lib/nepali-calendar";
import React from "react";

interface MiniCalendarProps {
  value?: { year: number; month: number; day: number };
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MiniCalendar({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
}: MiniCalendarProps) {
  const today = getTodayBS();
  const [open, setOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(value?.year || today.year);
  const [currentMonth, setCurrentMonth] = useState(value?.month || today.month);
  const [selectedDate, setSelectedDate] = useState<{
    year: number;
    month: number;
    day: number;
  } | null>(value || null);
  const [showAD, setShowAD] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setCurrentYear(value.year);
      setCurrentMonth(value.month);
    }
  }, [value]);

  const monthDays = getBSMonthDays(currentYear, currentMonth);
  const startDay = getBSMonthStartDay(currentYear, currentMonth);
  const weekDays = showAD ? ENGLISH_WEEK_DAYS : NEPALI_WEEK_DAYS;

  // Generate year range based on supported BS years (1975-2099)
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
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let m = 0; m < 12; m++) {
      const daysInMonth = getBSMonthDays(currentYear, m);
      const firstDayAD = convertBSToAD(currentYear, m, 1);
      const lastDayAD = convertBSToAD(currentYear, m, daysInMonth);

      const startMonth = monthNames[firstDayAD.getUTCMonth()];
      const endMonth = monthNames[lastDayAD.getUTCMonth()];

      const label =
        startMonth !== endMonth ? `${startMonth}/${endMonth}` : startMonth;

      months.push({
        bsMonth: m,
        label: label,
      });
    }
    return months;
  }, [currentYear, showAD]);

  const calendarGrid = useMemo(() => {
    const grid: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= monthDays; day++) {
      grid.push(day);
    }
    while (grid.length % 7 !== 0) {
      grid.push(null);
    }
    return grid;
  }, [monthDays, startDay]);

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (
    day: number,
    year = currentYear,
    month = currentMonth,
  ) => {
    const date = { year, month, day };
    setSelectedDate(date);
    const adDate = convertBSToAD(date.year, date.month, date.day);
    const isoString = adDate.toISOString().split("T")[0];
    onChange?.(isoString);
    setOpen(false);
  };

  const handleYearSelect = (year: number) => {
    if (showAD) {
      const firstDayAD = convertBSToAD(currentYear, currentMonth, 1);
      const currentADYear = firstDayAD.getUTCFullYear();
      const diff = year - currentADYear;
      setCurrentYear(currentYear + diff);
    } else {
      setCurrentYear(year);
    }
    setShowYearSelector(false);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(month);
    setShowMonthSelector(false);
  };

  const isToday = (day: number): boolean => {
    return (
      currentYear === today.year &&
      currentMonth === today.month &&
      day === today.day
    );
  };

  const isSelected = (day: number): boolean => {
    return (
      selectedDate !== null &&
      currentYear === selectedDate.year &&
      currentMonth === selectedDate.month &&
      day === selectedDate.day
    );
  };

  // Get AD day number for a BS day in the current month
  const getADDay = (bsDay: number): number => {
    const adDate = convertBSToAD(currentYear, currentMonth, bsDay);
    return adDate.getUTCDate();
  };

  // Get formatted display value for the trigger button
  const getDisplayValue = () => {
    if (!selectedDate) return null;
    if (showAD) {
      const adDate = convertBSToAD(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
      );
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[adDate.getUTCMonth()]} ${adDate.getUTCDate()}, ${adDate.getUTCFullYear()}`;
    } else {
      return formatBSDate(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
      );
    }
  };

  // Get current display year for the header
  const getDisplayYear = () => {
    if (showAD) {
      const adDate = convertBSToAD(currentYear, currentMonth, 1);
      return adDate.getUTCFullYear();
    }
    return currentYear;
  };

  // Get today's display year for jump button
  const getTodayDisplayYear = () => {
    if (showAD) {
      const adDate = convertBSToAD(today.year, today.month, 1);
      return adDate.getUTCFullYear();
    }
    return today.year;
  };

  const yearSelectorRef = React.useRef<HTMLDivElement>(null);
  const currentYearRef = React.useRef<HTMLButtonElement>(null);
  const todayYearRef = React.useRef<HTMLButtonElement>(null);

  // Scroll to current year when year selector opens
  React.useEffect(() => {
    if (showYearSelector && currentYearRef.current) {
      setTimeout(() => {
        currentYearRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }, 0);
    }
  }, [showYearSelector, showAD]);

  // Get formatted footer date for selected date
  const getFooterDate = () => {
    if (!selectedDate) return null;
    if (showAD) {
      const adDate = convertBSToAD(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
      );
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[adDate.getUTCMonth()]} ${adDate.getUTCDate()}, ${adDate.getUTCFullYear()}`;
    } else {
      return formatBSDate(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 sm:h-11 text-sm",
            !selectedDate && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          {selectedDate ? (
            <span className={cn(!showAD && "font-noto-devanagari", "truncate")}>
              {getDisplayValue()}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] sm:w-auto p-0 shadow-lg border-2 mx-4 sm:mx-0"
        align="center"
        side="bottom"
        sideOffset={4}
      >
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 min-w-0 sm:min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                previousMonth();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center min-w-0">
              {/* Month Selector */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMonthSelector(!showMonthSelector);
                  setShowYearSelector(false);
                }}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg",
                  "hover:bg-muted transition-colors text-xs sm:text-sm font-semibold truncate",
                  showMonthSelector && "bg-muted",
                )}
              >
                <span className="truncate">
                  {showAD
                    ? (() => {
                        const firstDayAD = convertBSToAD(
                          currentYear,
                          currentMonth,
                          1,
                        );
                        const lastDayAD = convertBSToAD(
                          currentYear,
                          currentMonth,
                          monthDays,
                        );
                        const months = [
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ];
                        const startMonth = months[firstDayAD.getUTCMonth()];
                        const endMonth = months[lastDayAD.getUTCMonth()];
                        return startMonth !== endMonth
                          ? `${startMonth}/${endMonth}`
                          : startMonth;
                      })()
                    : NEPALI_MONTHS[currentMonth]}
                </span>
                <ChevronsUpDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
              </button>

              {/* Year Selector */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowYearSelector(!showYearSelector);
                  setShowMonthSelector(false);
                }}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg",
                  "hover:bg-muted transition-colors text-xs sm:text-sm font-semibold",
                  showYearSelector && "bg-muted",
                )}
              >
                <span className={!showAD ? "font-noto-devanagari" : ""}>
                  {showAD ? getDisplayYear() : toNepaliNumber(currentYear)}
                </span>
                <ChevronsUpDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
              </button>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 hover:bg-muted transition-colors",
                  showAD && "bg-muted text-primary",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAD(!showAD);
                }}
                title={
                  showAD ? "Switch to Bikram Sambat" : "Switch to Gregorian"
                }
              >
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  nextMonth();
                }}
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {/* Month Selector Dropdown */}
          {showMonthSelector && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 animate-in fade-in-0 zoom-in-95">
              {(showAD
                ? adMonthsForYear
                : NEPALI_MONTHS.map((name, idx) => ({
                    bsMonth: idx,
                    label: name,
                  }))
              ).map((item) => (
                <button
                  key={item.bsMonth}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMonthSelect(item.bsMonth);
                  }}
                  className={cn(
                    "px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg transition-all truncate",
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
          )}

          {/* Year Selector Dropdown */}
          {showYearSelector && (
            <div className="space-y-2 animate-in fade-in-0 zoom-in-95">
              {/* Quick jump button - always jumps to today's year */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (todayYearRef.current) {
                      todayYearRef.current.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                      });
                    } else if (currentYearRef.current) {
                      currentYearRef.current.scrollIntoView({
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
                className="h-[180px] sm:h-[200px] overflow-y-auto rounded-lg border"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor:
                    "hsl(var(--muted-foreground) / 0.2) transparent",
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                  const container = e.currentTarget;
                  container.scrollTop += e.deltaY;
                }}
              >
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-3">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleYearSelect(year);
                        }}
                        className={cn(
                          "px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-all",
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
          )}

          {/* Calendar Grid */}
          {!showMonthSelector && !showYearSelector && (
            <>
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1.5 sm:py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {calendarGrid.map((bsDay, index) => {
                  if (bsDay === null) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      />
                    );
                  }

                  const displayDay = showAD ? getADDay(bsDay) : bsDay;

                  return (
                    <button
                      key={`day-${bsDay}`}
                      onClick={() => handleDateSelect(bsDay)}
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-xs sm:text-sm flex items-center justify-center",
                        "transition-all duration-200",
                        "hover:bg-muted/80 hover:scale-105",
                        isToday(bsDay) &&
                          "bg-primary/10 text-primary font-bold ring-1 ring-primary/20",
                        isSelected(bsDay) &&
                          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md scale-105",
                        !isToday(bsDay) &&
                          !isSelected(bsDay) &&
                          "text-foreground",
                      )}
                    >
                      <span
                        className={
                          !showAD ? "font-noto-devanagari text-xs" : "text-xs"
                        }
                      >
                        {showAD ? displayDay : toNepaliNumber(displayDay)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 sm:pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 hover:bg-muted transition-colors"
                  onClick={() => {
                    setCurrentYear(today.year);
                    setCurrentMonth(today.month);
                    handleDateSelect(today.day, today.year, today.month);
                  }}
                >
                  Today
                </Button>
                {selectedDate && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                      {getFooterDate()}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
