"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Eye,
  Trash2,
  Users,
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import FilterDropdown from "@/app/_components/ui/FilterDropdown";
import { Button } from "@/app/_components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import DebouncedSearchInput from "@/app/_components/ui/DebouncedSearchInput";
import ClearFiltersButton from "@/app/_components/ui/ClearFiltersButton";
import MobileFilterBar from "@/app/_components/ui/MobileFilterBar";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParentDashboard, removeParentFromStudent } from "@/lib/api/parent";
import { DeleteConfirmationDialog } from "@/app/_components/DeleteConfirmationDialog";
import { useToast } from "@/app/_components/ui/use-toast";
import { getApiErrorMessage } from "@/lib/utils";
import type { ParentListResponse, PageResponse } from "@/types/lms";

// --- Constants -----------------------------------------------------------------

const PAGE_SIZE_OPTIONS = [10, 20, 50];

type SortField = "name" | "phone" | "childrenCount";
type SortDir = "ASC" | "DESC";

const sortByMap: Record<SortField, string> = {
  name: "parentName",
  phone: "parentNumber",
  childrenCount: "children",
};

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
];

const CHILD_CHIP_COLORS = [
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
];

// --- Component -----------------------------------------------------------------

export default function ParentsPageClient() {
  // Filter / sort state
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("ASC");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState<ParentListResponse | null>(null);

  // Fetch parents from API
  const { data, isLoading } = useQuery({
    queryKey: ["parents", "dashboard", debouncedSearch, sortBy, sortDir, pageNum, pageSize],
    queryFn: () =>
      getParentDashboard({
        search: debouncedSearch || undefined,
        sortBy: sortByMap[sortBy],
        sortDir,
        pageSize,
        pageNum,
      }),
  });

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteParentMutation = useMutation({
    mutationFn: (parentId: number) => removeParentFromStudent(parentId),
    onSuccess: () => {
      setDeleteDialog(null);
      queryClient.invalidateQueries({ queryKey: ["parents", "dashboard"] });
      toast({
        title: "Parent removed",
        description: "Parent has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove parent",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const parents = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const currentPage = pageNum;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const hasContent = parents.length > 0;

  // Active filters count
  const activeFiltersCount = [
    debouncedSearch.trim(),
    sortBy !== "name" ? sortBy : "",
    sortDir !== "ASC" ? sortDir : "",
  ].filter(Boolean).length;

  // Handlers
  const handleSort = (column: SortField) => {
    if (sortBy === column) {
      setSortDir(sortDir === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDir("ASC");
    }
    setPageNum(1);
  };

  const handleClearFilters = () => {
    setDebouncedSearch("");
    setSortBy("name");
    setSortDir("ASC");
    setPageNum(1);
  };

  const getSortIcon = (column: SortField) => {
    if (sortBy !== column)
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "ASC" ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  // --- Child chips renderer ----------------------------------------------------
  const MAX_VISIBLE_CHIPS = 2;

  const renderChildChips = (childrenNames: string[], compact = false) => {
    const visible = childrenNames.slice(0, MAX_VISIBLE_CHIPS);
    const remaining = childrenNames.length - MAX_VISIBLE_CHIPS;

    return (
      <div className="flex flex-wrap gap-1">
        {visible.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0.5 font-medium whitespace-nowrap",
              CHILD_CHIP_COLORS[i % CHILD_CHIP_COLORS.length],
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {name.split(" ")[0]}
          </span>
        ))}
        {remaining > 0 && (
          <span
            className={cn(
              "inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 font-semibold",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            +{remaining} more
          </span>
        )}
      </div>
    );
  };

  // --- Mobile filter content ---------------------------------------------------
  // --- Render ------------------------------------------------------------------

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Parents
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Manage parent contacts and view linked students
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <h2 className="text-base sm:text-lg font-semibold">
            All Parents
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-2">
              {totalElements} total
            </span>
          </h2>
        </div>

        {/* Mobile filter bar */}
        <div className="w-full sm:hidden">
          <MobileFilterBar
            searchValue={debouncedSearch}
            onSearchChange={(val) => {
              setDebouncedSearch(val);
              setPageNum(1);
            }}
            searchPlaceholder="Search parents or children..."
            sortValue={sortBy}
            onSortChange={(v) => {
              setSortBy(v as SortField);
              setPageNum(1);
            }}
            sortOptions={[
              { value: "name", label: "Name" },
              { value: "phone", label: "Phone" },
              { value: "childrenCount", label: "Children" },
            ]}
            sortDirValue={sortDir}
            onSortDirChange={(v) => setSortDir(v as SortDir)}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Desktop Filters */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <DebouncedSearchInput
            value={debouncedSearch}
            placeholder="Search parents or children..."
            onChange={(val) => {
              setDebouncedSearch(val);
              setPageNum(1);
            }}
            className="w-64 lg:w-80"
            inputClassName="h-9"
          />

          <FilterDropdown
            icon={ArrowUpDown}
            placeholder="Sort by"
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v as SortField);
              setPageNum(1);
            }}
            options={[
              { value: "name", label: "Name" },
              { value: "phone", label: "Phone" },
              { value: "childrenCount", label: "Children" },
            ]}
            className="h-9 w-[140px] text-xs sm:text-sm"
          />

          <ClearFiltersButton
            activeFiltersCount={activeFiltersCount}
            onClick={handleClearFilters}
            className="h-9 px-2 text-xs"
          />
        </div>
      </div>

      {/* Search hint */}
      {debouncedSearch.trim() && (
        <div className="text-xs text-muted-foreground px-1">
          Showing results for &quot;{debouncedSearch.trim()}&quot; - matches
          parent name, phone, or child name
        </div>
      )}

      {/* --- Desktop Table ------------------------------------------------------ */}
      {hasContent ? (
        <div className="hidden sm:block rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors w-1/3"
                    onClick={() => handleSort("name")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Name {getSortIcon("name")}
                    </span>
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors w-1/4"
                    onClick={() => handleSort("phone")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Phone {getSortIcon("phone")}
                    </span>
                  </th>
                  <th
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("childrenCount")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Children {getSortIcon("childrenCount")}
                    </span>
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parents.map((parent) => {
                  const initials = parent.parentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const avatarColor =
                    AVATAR_COLORS[(parent.parentId - 1) % AVATAR_COLORS.length];

                  return (
                    <tr
                      key={parent.parentId}
                      className="hover:bg-muted/20 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/admin/parents/${parent.parentId}`)}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                              avatarColor.bg,
                              avatarColor.text,
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {parent.parentName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {parent.totalChildren}{" "}
                              {parent.totalChildren === 1 ? "child" : "children"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {parent.parentPhoneNumber}
                        </span>
                      </td>

                      {/* Children Chips */}
                      <td className="px-5 py-3.5">
                        {renderChildChips(parent.childrenNames)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-[#185FA5] hover:bg-[#185FA5]/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/parents/${parent.parentId}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog(parent);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="hidden sm:block rounded-xl border bg-card py-16 sm:py-20 text-center">
          {isLoading ? (
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground/50" />
          ) : (
            <>
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No parents found
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try adjusting your search or clear filters
              </p>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* --- Mobile Cards ------------------------------------------------------- */}
      <div className="sm:hidden space-y-3">
        {hasContent ? (
          parents.map((parent) => {
            const initials = parent.parentName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const avatarColor =
              AVATAR_COLORS[(parent.parentId - 1) % AVATAR_COLORS.length];

            return (
              <div
                key={parent.parentId}
                className="rounded-xl border bg-card shadow-sm p-4 space-y-3 cursor-pointer"
                onClick={() => router.push(`/admin/parents/${parent.parentId}`)}
              >
                {/* Parent header row */}
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      avatarColor.bg,
                      avatarColor.text,
                    )}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {parent.parentName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {parent.parentPhoneNumber}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-[#185FA5] hover:bg-[#185FA5]/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/parents/${parent.parentId}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog(parent);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Children */}
                <div className="border-t pt-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Children ({parent.totalChildren})
                  </p>
                  {renderChildChips(parent.childrenNames, true)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border bg-card py-16 text-center">
            {isLoading ? (
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground/50" />
            ) : (
              <>
                <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No parents found
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Try adjusting your search
                </p>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* --- Pagination --------------------------------------------------------- */}
      {hasContent && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 border rounded-xl bg-card shadow-sm">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalElements)} of {totalElements}
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={currentPage <= 1}
              onClick={() => setPageNum((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNumber: number;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 text-xs",
                    pageNumber === currentPage &&
                      "bg-[#185FA5] hover:bg-[#0C447C]",
                  )}
                  onClick={() => setPageNum(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={currentPage >= totalPages}
              onClick={() => setPageNum((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPageNum(1);
              }}
            >
              <SelectTrigger className="h-8 w-[60px] sm:w-[65px] text-xs ml-1 sm:ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─────────────────────────────────────────── */}
      <DeleteConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        title="Remove Parent?"
        description={
          <>
            This will permanently remove{" "}
            <strong>{deleteDialog?.parentName}</strong> and unlink them from
            all students. This action cannot be undone.
          </>
        }
        onConfirm={() => {
          if (deleteDialog?.parentId) {
            deleteParentMutation.mutate(deleteDialog.parentId);
          }
        }}
        isPending={deleteParentMutation.isPending}
      />
    </div>
  );
}
