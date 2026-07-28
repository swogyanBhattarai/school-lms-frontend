"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/contexts/UserContext";
import {
  Search,
  LayoutDashboard,
  GraduationCap,
  Users,
  Calculator,
  UsersRound,
  BookOpen,
  PanelTop,
  CalendarDays,
  Banknote,
  Bell,
  Settings,
  ClipboardList,
  BookText,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent } from "@/app/_components/ui/dialog";
import { Input } from "@/app/_components/ui/input";
import { cn } from "@/lib/utils";

// ─── Navigation item definition ───────────────────────────────────────────

interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  keywords: string[];
}

type RoleNavItems = Partial<Record<string, NavItem[]>>;

const NAV_ITEMS: RoleNavItems = {
  ADMIN: [
    { id: "admin-dashboard", title: "Dashboard", href: "/admin", icon: LayoutDashboard, keywords: ["home", "main", "overview"] },
    { id: "admin-students", title: "Students", href: "/admin/students", icon: GraduationCap, keywords: ["pupil", "learner", "child"] },
    { id: "admin-teachers", title: "Teachers", href: "/admin/teachers", icon: Users, keywords: ["staff", "faculty", "instructor"] },
    { id: "admin-accountants", title: "Accountants", href: "/admin/accountants", icon: Calculator, keywords: ["finance", "accounts"] },
    { id: "admin-parents", title: "Parents", href: "/admin/parents", icon: UsersRound, keywords: ["guardian", "family"] },
    { id: "admin-subjects", title: "Subjects", href: "/admin/subjects", icon: BookOpen, keywords: ["course", "class", "topic"] },
    { id: "admin-academic-years", title: "Academic Years", href: "/admin/academic-years", icon: CalendarDays, keywords: ["session", "term", "year"] },
    { id: "admin-fees", title: "Fees", href: "/admin/fees", icon: Banknote, keywords: ["payment", "finance", "collection", "due"] },
    { id: "admin-notifications", title: "Notifications", href: "/admin/notifications", icon: Bell, keywords: ["alerts", "notice"] },
    { id: "admin-settings", title: "Settings", href: "/admin/settings", icon: Settings, keywords: ["preferences", "config", "profile"] },
  ],
  TEACHER: [
    { id: "teacher-dashboard", title: "Dashboard", href: "/teacher", icon: LayoutDashboard, keywords: ["home", "main", "overview"] },
    { id: "teacher-attendance", title: "Attendance", href: "/teacher/attendance", icon: ClipboardList, keywords: ["register", "roll call", "present"] },
    { id: "teacher-diary", title: "Diary", href: "/teacher/diary", icon: BookText, keywords: ["notes", "lesson plan", "journal"] },
    { id: "teacher-students", title: "Students", href: "/teacher/students", icon: GraduationCap, keywords: ["pupil", "learner", "child"] },
    { id: "teacher-notifications", title: "Notifications", href: "/teacher/notifications", icon: Bell, keywords: ["alerts", "notice"] },
  ],
  ACCOUNTANT: [
    { id: "accountant-dashboard", title: "Dashboard", href: "/accountant", icon: LayoutDashboard, keywords: ["home", "main", "overview"] },
    { id: "accountant-notifications", title: "Notifications", href: "/accountant/notifications", icon: Bell, keywords: ["alerts", "notice"] },
  ],
};

// ─── Component ─────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalise the role key (handle both "ADMIN" and "ROLE_ADMIN")
  const rawRole = user?.userRole || "";
  const roleKey = rawRole.replace(/^ROLE_/, "");

  // Get the navigation items for the current user's role
  const allItems = useMemo<NavItem[]>(
    () => NAV_ITEMS[roleKey as keyof typeof NAV_ITEMS] ?? [],
    [roleKey],
  );

  // Filter items against the search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;

    const lower = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.href.toLowerCase().includes(lower) ||
        item.keywords.some((kw) => kw.includes(lower)),
    );
  }, [allItems, query]);

  // ── Reset internal state when the dialog opens or closes ──
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);

      // Prefetch every available page so navigation is instant
      allItems.forEach((item) => router.prefetch(item.href));

      // Auto-focus the input after the dialog has mounted
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [open, allItems, router]);

  // ── Navigate to the selected item ──
  const navigate = useCallback(
    (item: NavItem) => {
      router.push(item.href);
      onOpenChange(false);
    },
    [router, onOpenChange],
  );

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            navigate(filteredItems[selectedIndex]);
          }
          break;
      }
    },
    [filteredItems, selectedIndex, navigate],
  );

  // ── Clicking the overlay / pressing Escape calls onOpenChange(false) ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl p-0 gap-0 top-[15%] translate-y-0 rounded-xl overflow-hidden w-[calc(100%-2rem)] sm:w-full"
        // Prevent Escape from propagating twice (Dialog already handles it)
        onKeyDown={handleKeyDown}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 border-b">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search pages…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="border-0 h-12 px-0 text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto scrollbar-hide p-2" role="listbox" aria-label="Search results">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No results found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredItems.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === selectedIndex}>
                  <button
                    type="button"
                    onClick={() => navigate(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                      index === selectedIndex
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{item.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground truncate max-w-[200px]">
                      {item.href}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer keyboard-hint bar */}
        <div className="border-t px-4 py-2 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono">↵</kbd> Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono">Esc</kbd> Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
