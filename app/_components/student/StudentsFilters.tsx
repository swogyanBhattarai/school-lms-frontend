import { Filter, Search, X } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { cn } from "@/lib/utils";
import type { SchoolClassResponse, SectionResponse } from "@/types/lms";

type SortOption = {
  value: string;
  label: string;
};

type StudentsFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedClassId: string;
  onSelectedClassIdChange: (value: string) => void;
  selectedSectionId: string;
  onSelectedSectionIdChange: (value: string) => void;
  classes: SchoolClassResponse[];
  sections: SectionResponse[];
  activeFiltersCount: number;
  onClearFilters: () => void;
  selectedClassGrade?: string;
  selectedSectionName?: string;
  sortBy: string;
  sortDir: string;
  onSortChange: (sortBy: string, sortDir: string) => void;
  sortOptions: SortOption[];
};

export default function StudentsFilters({
  search,
  onSearchChange,
  selectedClassId,
  onSelectedClassIdChange,
  selectedSectionId,
  onSelectedSectionIdChange,
  classes,
  sections,
  activeFiltersCount,
  onClearFilters,
  selectedClassGrade,
  selectedSectionName,
  sortBy,
  sortDir,
  onSortChange,
  sortOptions,
}: StudentsFiltersProps) {
  return (
    <div className="p-4 border-b">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students by name..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-9 pl-9 text-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-2 h-9",
                  activeFiltersCount > 0 && "border-primary text-primary"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={onClearFilters}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select value={selectedClassId} onValueChange={onSelectedClassIdChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {classes.map((schoolClass) => (
                        <SelectItem
                          key={schoolClass.schoolClassId}
                          value={String(schoolClass.schoolClassId)}
                        >
                          Grade {schoolClass.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Section</label>
                  <Select
                    value={selectedSectionId}
                    onValueChange={onSelectedSectionIdChange}
                    disabled={!selectedClassId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={
                          selectedClassId ? "All sections" : "Select a class first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sections</SelectItem>
                      {sections.map((section) => (
                        <SelectItem
                          key={section.sectionId}
                          value={String(section.sectionId)}
                        >
                          Section {section.sectionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Select
            value={`${sortBy}-${sortDir}`}
            onValueChange={(value) => {
              const [nextSortBy, nextSortDir] = value.split("-");
              onSortChange(nextSortBy, nextSortDir);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem
                  key={`${option.value}-ASC`}
                  value={`${option.value}-ASC`}
                >
                  {option.label} (A-Z)
                </SelectItem>
              ))}
              {sortOptions.map((option) => (
                <SelectItem
                  key={`${option.value}-DESC`}
                  value={`${option.value}-DESC`}
                >
                  {option.label} (Z-A)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {selectedClassId && selectedClassGrade && (
            <Badge className="gap-1">
              Class: Grade {selectedClassGrade}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSelectedClassIdChange("")} />
            </Badge>
          )}
          {selectedSectionId && selectedSectionName && (
            <Badge className="gap-1">
              Section: {selectedSectionName}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSelectedSectionIdChange("")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
