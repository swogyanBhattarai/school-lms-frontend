// app/_components/ui/MobileFilterBar.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Filter,
  ChevronUp,
  ChevronDown,
  GraduationCap,
  BookOpen,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw,
  UserCheck,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import DebouncedSearchInput from "./DebouncedSearchInput";
import FilterDropdown from "./FilterDropdown";
import type { FilterOption } from "./FilterDropdown";

interface MobileFilterBarProps {
  // ── Search (always rendered) ──────────────────────────────────────
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // ── Optional date picker slot ─────────────────────────────────────
  /** Anything you want in the date-picker position (e.g. MiniCalendar). When omitted the slot is hidden. */
  datePicker?: React.ReactNode;

  // ── Optional grade filter ─────────────────────────────────────────
  gradeValue?: string;
  onGradeChange?: (value: string) => void;
  gradeOptions?: FilterOption[];

  // ── Optional section filter ───────────────────────────────────────
  sectionValue?: string;
  onSectionChange?: (value: string) => void;
  sectionOptions?: FilterOption[];
  /** Disables the section dropdown, e.g. when no class is selected. */
  sectionDisabled?: boolean;

  // ── Optional subject filter ───────────────────────────────────────
  subjectValue?: string;
  onSubjectChange?: (value: string) => void;
  subjectOptions?: FilterOption[];

  // ── Optional status filter ────────────────────────────────────────
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  /** Icon for the status trigger. Defaults to UserCheck. */
  statusIcon?: LucideIcon;

  // ── Optional sort ─────────────────────────────────────────────────
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: FilterOption[];
  /** When provided, a direction toggle button appears next to the sort dropdown. */
  sortDirValue?: string;
  onSortDirChange?: (value: string) => void;

  // ── Clear ─────────────────────────────────────────────────────────
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export default function MobileFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  datePicker,
  gradeValue,
  onGradeChange,
  gradeOptions,
  sectionValue,
  onSectionChange,
  sectionOptions,
  sectionDisabled = false,
  subjectValue,
  onSubjectChange,
  subjectOptions,
  statusValue,
  onStatusChange,
  statusOptions,
  statusIcon = UserCheck,
  sortValue,
  onSortChange,
  sortOptions,
  sortDirValue,
  onSortDirChange,
  activeFiltersCount,
  onClearFilters,
}: MobileFilterBarProps) {
  const [open, setOpen] = useState(false);

  const hasSort = sortOptions !== undefined;
  const hasSortDir = sortDirValue !== undefined && onSortDirChange !== undefined;

  // Build filter items array, then pair them so solos get full width
  const filterItemRows = useMemo(() => {
    const items: React.ReactNode[] = [];

    if (datePicker) items.push(datePicker);
    if (gradeOptions) {
      items.push(
        <FilterDropdown
          key="grade"
          icon={GraduationCap}
          placeholder="Grade"
          value={gradeValue ?? "all"}
          onValueChange={(v) => onGradeChange?.(v)}
          options={gradeOptions}
          className="w-full h-10 text-xs"
        />,
      );
    }
    if (sectionOptions) {
      items.push(
        <FilterDropdown
          key="section"
          icon={Layers}
          placeholder="Section"
          value={sectionValue ?? "all"}
          onValueChange={(v) => onSectionChange?.(v)}
          options={sectionOptions}
          disabled={sectionDisabled}
          className="w-full h-10 text-xs"
        />,
      );
    }
    if (subjectOptions) {
      items.push(
        <FilterDropdown
          key="subject"
          icon={BookOpen}
          placeholder="Subject"
          value={subjectValue ?? "all"}
          onValueChange={(v) => onSubjectChange?.(v)}
          options={subjectOptions}
          className="w-full h-10 text-xs"
        />,
      );
    }
    if (statusOptions) {
      items.push(
        <FilterDropdown
          key="status"
          icon={statusIcon}
          placeholder="Status"
          value={statusValue ?? "all"}
          onValueChange={(v) => onStatusChange?.(v)}
          options={statusOptions}
          className="w-full h-10 text-xs"
        />,
      );
    }

    // Group into rows: 2 per row, last row takes full width if solo
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < items.length; i += 2) {
      const pair = items.slice(i, i + 2);
      rows.push(
        <div
          key={i}
          className={pair.length === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-1"}
        >
          {pair[0]}
          {pair[1]}
        </div>,
      );
    }
    return rows;
  }, [
    datePicker,
    gradeOptions, gradeValue, onGradeChange,
    sectionOptions, sectionValue, onSectionChange, sectionDisabled,
    subjectOptions, subjectValue, onSubjectChange,
    statusOptions, statusValue, onStatusChange, statusIcon,
  ]);

  return (
    <div className="sm:hidden space-y-2">
      {/* Collapsible Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="w-full justify-between rounded-xl h-10 text-sm border-slate-300"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span>Filters & Search</span>
          {activeFiltersCount > 0 && (
            <Badge className="bg-slate-800 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center p-0">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </Button>

      {/* Filter Content */}
      <div className={cn("space-y-2", open ? "block" : "hidden")}>
        {/* Search */}
        <DebouncedSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />

        {/* Filter rows: each row is either 1 (full width) or 2 (shared) */}
        {filterItemRows.length > 0 && (
          <div className="space-y-2">{filterItemRows}</div>
        )}

        {/* Sort */}
        {hasSort && (
          <div className="flex gap-2">
            <FilterDropdown
              icon={ArrowUpDown}
              placeholder="Sort by"
              value={sortValue ?? ""}
              onValueChange={(v) => onSortChange?.(v)}
              options={sortOptions!}
              className="flex-1 h-10 text-xs"
            />
            {hasSortDir && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onSortDirChange?.(sortDirValue === "ASC" ? "DESC" : "ASC")
                }
                className="h-10 w-10 rounded-xl border-slate-200 flex-shrink-0"
              >
                {sortDirValue === "ASC" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="w-full h-9 rounded-xl text-xs border-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
