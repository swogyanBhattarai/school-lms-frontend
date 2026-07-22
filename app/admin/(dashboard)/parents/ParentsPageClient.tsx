"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
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
  UserRound,
} from "lucide-react";
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
import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Mock Data ───────────────────────────────────────────────────────────────

interface MockChild {
  id: number;
  name: string;
  classLabel: string; // e.g. "Class 5-A"
}

interface MockParent {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  children: MockChild[];
}

const MOCK_PARENTS: MockParent[] = [
  {
    id: 1,
    name: "Ram Shrestha",
    phone: "9841234567",
    email: null,
    children: [
      { id: 101, name: "Aarav Shrestha", classLabel: "Class 5-A" },
      { id: 102, name: "Aayush Shrestha", classLabel: "Class 2-B" },
    ],
  },
  {
    id: 2,
    name: "Sita Devi Sharma",
    phone: "9856789012",
    email: "sita.sharma@email.com",
    children: [
      { id: 103, name: "Priya Sharma", classLabel: "Class 8-A" },
      { id: 104, name: "Rohan Sharma", classLabel: "Class 6-B" },
      { id: 105, name: "Nisha Sharma", classLabel: "Class 3-A" },
    ],
  },
  {
    id: 3,
    name: "Hari Prasad Adhikari",
    phone: "9801234567",
    email: "hari.adhikari@mail.com",
    children: [{ id: 106, name: "Bikash Adhikari", classLabel: "Class 10-A" }],
  },
  {
    id: 4,
    name: "Gita Kumari Gurung",
    phone: "9865432109",
    email: null,
    children: [
      { id: 107, name: "Anjana Gurung", classLabel: "Class 7-B" },
      { id: 108, name: "Suman Gurung", classLabel: "Class 4-A" },
      { id: 109, name: "Dipak Gurung", classLabel: "Class 1-A" },
      { id: 110, name: "Rita Gurung", classLabel: "Class 9-B" },
    ],
  },
  {
    id: 5,
    name: "Bhim Bahadur Tamang",
    phone: "9876543210",
    email: "bhim.tamang@domain.np",
    children: [
      { id: 111, name: "Mingmar Tamang", classLabel: "Class 11-A" },
      { id: 112, name: "Phurba Tamang", classLabel: "Class 9-A" },
    ],
  },
  {
    id: 6,
    name: "Laxmi Maharjan",
    phone: "9812345678",
    email: "laxmi.maharjan@mail.com",
    children: [{ id: 113, name: "Sujan Maharjan", classLabel: "Class 12-A" }],
  },
  {
    id: 7,
    name: "Krishna Prasad Karki",
    phone: "9823456789",
    email: null,
    children: [
      { id: 114, name: "Asha Karki", classLabel: "Class 5-B" },
      { id: 115, name: "Ramesh Karki", classLabel: "Class 5-B" },
      { id: 116, name: "Sunita Karki", classLabel: "Class 2-A" },
    ],
  },
  {
    id: 8,
    name: "Anita Rai",
    phone: "9834567890",
    email: "anita.rai@email.com",
    children: [
      { id: 117, name: "Nabin Rai", classLabel: "Class 8-B" },
      { id: 118, name: "Sabina Rai", classLabel: "Class 6-A" },
    ],
  },
  {
    id: 9,
    name: "Dil Bahadur Magar",
    phone: "9845678901",
    email: null,
    children: [
      { id: 119, name: "Kumar Magar", classLabel: "Class 3-B" },
      { id: 120, name: "Gita Magar", classLabel: "Class 1-B" },
      { id: 121, name: "Hari Magar", classLabel: "Class 7-A" },
    ],
  },
  {
    id: 10,
    name: "Pushpa Devi Poudel",
    phone: "9856789012",
    email: "pushpa.poudel@webmail.np",
    children: [{ id: 122, name: "Santosh Poudel", classLabel: "Class 10-B" }],
  },
  {
    id: 11,
    name: "Man Bahadur Thapa",
    phone: "9867890123",
    email: null,
    children: [
      { id: 123, name: "Deepa Thapa", classLabel: "Class 4-B" },
      { id: 124, name: "Rajesh Thapa", classLabel: "Class 11-B" },
      { id: 125, name: "Meena Thapa", classLabel: "Class 9-A" },
      { id: 126, name: "Gopal Thapa", classLabel: "Class 2-A" },
    ],
  },
  {
    id: 12,
    name: "Sarita Neupane",
    phone: "9878901234",
    email: "sarita.neupane@email.com",
    children: [
      { id: 127, name: "Arun Neupane", classLabel: "Class 12-B" },
      { id: 128, name: "Kamal Neupane", classLabel: "Class 8-A" },
    ],
  },
  {
    id: 13,
    name: "Bishnu Prasad Acharya",
    phone: "9802345678",
    email: "bishnu.acharya@domain.np",
    children: [{ id: 129, name: "Laxmi Acharya", classLabel: "Class 6-A" }],
  },
  {
    id: 14,
    name: "Kamala Devi Basnet",
    phone: "9813456789",
    email: null,
    children: [
      { id: 130, name: "Suresh Basnet", classLabel: "Class 7-B" },
      { id: 131, name: "Mohan Basnet", classLabel: "Class 5-A" },
      { id: 132, name: "Binita Basnet", classLabel: "Class 3-A" },
    ],
  },
  {
    id: 15,
    name: "Narayan Shrestha",
    phone: "9824567890",
    email: "narayan.shrestha@mail.com",
    children: [
      { id: 133, name: "Dipika Shrestha", classLabel: "Class 1-A" },
      { id: 134, name: "Nischal Shrestha", classLabel: "Class 10-A" },
    ],
  },
  {
    id: 16,
    name: "Maya Kumari Dahal",
    phone: "9835678901",
    email: null,
    children: [{ id: 135, name: "Rajan Dahal", classLabel: "Class 11-A" }],
  },
  {
    id: 17,
    name: "Ganesh Bahadur Pokharel",
    phone: "9846789012",
    email: "ganesh.pokharel@email.com",
    children: [
      { id: 136, name: "Srijana Pokharel", classLabel: "Class 4-A" },
      { id: 137, name: "Bibek Pokharel", classLabel: "Class 9-B" },
      { id: 138, name: "Anita Pokharel", classLabel: "Class 2-B" },
    ],
  },
  {
    id: 18,
    name: "Shanti Devi Bhatta",
    phone: "9857890123",
    email: null,
    children: [
      { id: 139, name: "Prakash Bhatta", classLabel: "Class 8-B" },
      { id: 140, name: "Kiran Bhatta", classLabel: "Class 6-B" },
    ],
  },
  {
    id: 19,
    name: "Ramesh Prasad Siwakoti",
    phone: "9868901234",
    email: "ramesh.siwakoti@webmail.np",
    children: [{ id: 141, name: "Rekha Siwakoti", classLabel: "Class 12-A" }],
  },
  {
    id: 20,
    name: "Binda Devi KC",
    phone: "9879012345",
    email: null,
    children: [
      { id: 142, name: "Rabi KC", classLabel: "Class 3-B" },
      { id: 143, name: "Shanti KC", classLabel: "Class 7-A" },
      { id: 144, name: "Bimal KC", classLabel: "Class 1-B" },
    ],
  },
  {
    id: 21,
    name: "Dipak Raj Joshi",
    phone: "9803456789",
    email: "dipak.joshi@domain.np",
    children: [
      { id: 145, name: "Sneha Joshi", classLabel: "Class 10-B" },
      { id: 146, name: "Amit Joshi", classLabel: "Class 5-B" },
    ],
  },
  {
    id: 22,
    name: "Nirmala Devi Subedi",
    phone: "9814567890",
    email: null,
    children: [{ id: 147, name: "Ujjwal Subedi", classLabel: "Class 11-B" }],
  },
  {
    id: 23,
    name: "Purna Bahadur Rijal",
    phone: "9825678901",
    email: "purna.rijal@email.com",
    children: [
      { id: 148, name: "Kanchi Rijal", classLabel: "Class 4-B" },
      { id: 149, name: "Dharma Rijal", classLabel: "Class 2-A" },
      { id: 150, name: "Bishnu Rijal", classLabel: "Class 8-A" },
    ],
  },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50];

type SortField = "name" | "phone" | "childrenCount";
type SortDir = "ASC" | "DESC";

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function ParentsPageClient() {
  // Filter / sort state
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("ASC");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // Filtered + sorted data
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return MOCK_PARENTS;

    return MOCK_PARENTS.filter((p) => {
      // Parent fields
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.phone.includes(q)) return true;
      // Child name search
      if (p.children.some((c) => c.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [debouncedSearch]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "phone":
          cmp = a.phone.localeCompare(b.phone);
          break;
        case "childrenCount":
          cmp = a.children.length - b.children.length;
          break;
      }
      return sortDir === "ASC" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  // Pagination
  const totalParents = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalParents / pageSize));
  const currentPage = Math.min(pageNum, totalPages);
  const paged = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasContent = paged.length > 0;

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

  // ─── Child chips renderer ────────────────────────────────────────────────
  const MAX_VISIBLE_CHIPS = 2;

  const renderChildChips = (children: MockChild[], compact = false) => {
    const visible = children.slice(0, MAX_VISIBLE_CHIPS);
    const remaining = children.length - MAX_VISIBLE_CHIPS;

    return (
      <div className="flex flex-wrap gap-1">
        {visible.map((child, i) => (
          <span
            key={child.id}
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0.5 font-medium whitespace-nowrap",
              CHILD_CHIP_COLORS[i % CHILD_CHIP_COLORS.length],
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {child.name.split(" ")[0]}
            {!compact && (
              <span className="ml-1 text-[10px] opacity-60">
                {child.classLabel}
              </span>
            )}
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

  // ─── Mobile filter content ───────────────────────────────────────────────
  // ─── Render ─────────────────────────────────────────────────────────────

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
              {totalParents} total
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

          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v as SortField);
              setPageNum(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px] text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="childrenCount">Children</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5 gap-1.5 text-xs sm:text-sm"
            onClick={() => setSortDir(sortDir === "ASC" ? "DESC" : "ASC")}
          >
            {sortDir === "ASC" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
            {sortDir === "ASC" ? "Asc" : "Desc"}
          </Button>

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
          Showing results for &quot;{debouncedSearch.trim()}&quot; — matches
          parent name, phone, or child name
        </div>
      )}

      {/* ─── Desktop Table ───────────────────────────────────────────────── */}
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
                {paged.map((parent, index) => {
                  const initials = parent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const avatarColor =
                    AVATAR_COLORS[(parent.id - 1) % AVATAR_COLORS.length];

                  return (
                    <tr
                      key={parent.id}
                      className="hover:bg-muted/20 transition-colors group"
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
                              {parent.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {parent.children.length}{" "}
                              {parent.children.length === 1 ? "child" : "children"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {parent.phone}
                        </span>
                      </td>

                      {/* Children Chips */}
                      <td className="px-5 py-3.5">
                        {renderChildChips(parent.children)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-[#185FA5] hover:bg-[#185FA5]/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
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
        </div>
      )}

      {/* ─── Mobile Cards ────────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {hasContent ? (
          paged.map((parent) => {
            const initials = parent.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const avatarColor =
              AVATAR_COLORS[(parent.id - 1) % AVATAR_COLORS.length];

            return (
              <div
                key={parent.id}
                className="rounded-xl border bg-card shadow-sm p-4 space-y-3"
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
                      {parent.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {parent.phone}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-[#185FA5] hover:bg-[#185FA5]/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Children */}
                <div className="border-t pt-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Children ({parent.children.length})
                  </p>
                  {renderChildChips(parent.children, true)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border bg-card py-16 text-center">
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
          </div>
        )}
      </div>

      {/* ─── Pagination ──────────────────────────────────────────────────── */}
      {hasContent && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 border rounded-xl bg-card shadow-sm">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalParents)} of {totalParents}
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
    </div>
  );
}