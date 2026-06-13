// components/calendar/nepali-calendar.tsx
"use client";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Globe,
} from "lucide-react";
import { Button } from "./ui/button";
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
  formatBSDate,
  type CalendarEvent,
} from "@/lib/nepali-calendar";

interface NepaliCalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: string) => void;
  className?: string;
}

export function NepaliCalendar({
  events = [],
  onDateClick,
  onEventClick,
  onAddEvent,
  className,
}: NepaliCalendarProps) {
  const today = getTodayBS();
  const [currentYear, setCurrentYear] = useState(today.year);
  const [currentMonth, setCurrentMonth] = useState(today.month);
  const [selectedDate, setSelectedDate] = useState<{
    year: number;
    month: number;
    day: number;
  } | null>(null);
  const [showAD, setShowAD] = useState(false);

  const monthDays = getBSMonthDays(currentYear, currentMonth);
  const startDay = getBSMonthStartDay(currentYear, currentMonth);
  const weekDays = showAD ? ENGLISH_WEEK_DAYS : NEPALI_WEEK_DAYS;

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    const grid: (number | null)[] = [];
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < startDay; i++) {
      grid.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= monthDays; day++) {
      grid.push(day);
    }
    
    // Pad to complete the last row
    while (grid.length % 7 !== 0) {
      grid.push(null);
    }
    
    return grid;
  }, [monthDays, startDay]);

  // Get events for a specific date
  const toAdYmd = (year: number, month: number, day: number) => {
    const adDate = convertBSToAD(year, month, day);
    return adDate.toISOString().split("T")[0];
  };

  const getEventsForDate = (day: number): CalendarEvent[] => {
    const dateStr = toAdYmd(currentYear, currentMonth, day);
    return events.filter((event) => event.date === dateStr);
  };

  // Navigate months
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

  const goToToday = () => {
    setCurrentYear(today.year);
    setCurrentMonth(today.month);
    setSelectedDate(today);
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

  // Get AD date for display
  const getADDate = (day: number): string => {
    const adDate = convertBSToAD(currentYear, currentMonth, day);
    return adDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get the header display
  // In nepali-calendar.tsx, replace getHeaderDisplay:

const getHeaderDisplay = () => {
  if (showAD) {
    const firstDayAD = convertBSToAD(currentYear, currentMonth, 1);
    const monthDays = getBSMonthDays(currentYear, currentMonth);
    const lastDayAD = convertBSToAD(currentYear, currentMonth, monthDays);
    
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    
    const startMonth = months[firstDayAD.getUTCMonth()];
    const endMonth = months[lastDayAD.getUTCMonth()];
    const year = lastDayAD.getUTCFullYear();
    
    if (startMonth !== endMonth) {
      return `${startMonth} / ${endMonth} ${year}`;
    }
    
    return `${startMonth} ${year}`;
  }
  return `${NEPALI_MONTHS[currentMonth]} ${toNepaliNumber(currentYear)}`;
};

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "holiday": return "bg-red-500";
      case "event": return "bg-blue-500";
      case "exam": return "bg-amber-500";
      case "meeting": return "bg-purple-500";
      case "other": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getEventTypeBg = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "holiday": return "bg-red-50 border-red-200 text-red-700";
      case "event": return "bg-blue-50 border-blue-200 text-blue-700";
      case "exam": return "bg-amber-50 border-amber-200 text-amber-700";
      case "meeting": return "bg-purple-50 border-purple-200 text-purple-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm", className)}>
      {/* Calendar Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={previousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className={cn(
              "text-lg font-semibold min-w-[200px] text-center",
              !showAD && "font-noto-devanagari"
            )}>
              {getHeaderDisplay()}
            </h2>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAD(!showAD)}
              className="text-xs gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              {showAD ? "BS" : "AD"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Today
            </Button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-px">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {calendarGrid.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="bg-card p-2 min-h-[80px] sm:min-h-[100px]" />;
            }

            const dateEvents = getEventsForDate(day);
            const isCurrentDay = isToday(day);
            const isSelectedDay = isSelected(day);

            return (
              <div
                key={`day-${day}`}
                onClick={() => {
                  const date = { year: currentYear, month: currentMonth, day };
                  setSelectedDate(date);
                  onDateClick?.(toAdYmd(date.year, date.month, date.day));
                }}
                className={cn(
                  "bg-card p-1.5 sm:p-2 min-h-[80px] sm:min-h-[100px] cursor-pointer transition-all",
                  "border border-transparent hover:border-primary/20 hover:bg-muted/30",
                  isSelectedDay && "border-primary bg-primary/5 ring-1 ring-primary",
                  isCurrentDay && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-medium",
                      isCurrentDay
                        ? "flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground"
                        : showAD
                        ? ""
                        : "font-noto-devanagari"
                    )}
                  >
                    {showAD ? day : toNepaliNumber(day)}
                  </span>
                  {dateEvents.length > 0 && (
                    <div className="flex gap-0.5">
                      {dateEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            getEventTypeColor(event.type)
                          )}
                          title={event.title}
                        />
                      ))}
                      {dateEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dateEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dateEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={cn(
                        "text-[10px] sm:text-xs px-1 py-0.5 rounded truncate border",
                        getEventTypeBg(event.type),
                        "cursor-pointer hover:opacity-80"
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
                {onAddEvent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEvent(toAdYmd(currentYear, currentMonth, day));
                    }}
                    className="mt-1 w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-0.5 rounded hover:bg-muted/50 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 pb-4 border-t pt-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Holiday
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Event
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            Exam
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            Meeting
          </div>
        </div>
      </div>
    </div>
  );
}