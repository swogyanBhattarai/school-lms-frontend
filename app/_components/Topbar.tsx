"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { useUser } from "@/lib/contexts/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";

type TopbarProps = {
  onMenuClick: () => void;
};

const formatRoleLabel = (role: string) =>
  role
    .replace(/^ROLE_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getRoleBadgeClasses = (role: string) => {
  if (/ADMIN/i.test(role)) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm";
  }

  if (role) {
    return "bg-gray-100 text-gray-700 border-gray-200 shadow-sm";
  }

  return "bg-gray-100 text-gray-500 border-gray-200";
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const username = user?.username || "";
  const userRole = user?.userRole || "";
  const roleBadgeClasses = getRoleBadgeClasses(userRole);

  const crumbs = useMemo(() => {
    if (pathname === "/") return [{ label: "Dashboard" }];

    return pathname.split("/").filter(Boolean).map((segment, index, segments) => ({
      label: segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      to: index < segments.length - 1 ? "/" + segments.slice(0, index + 1).join("/") : undefined,
    }));
  }, [pathname]);

  const initials = username
    ? username
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <header
      className="flex h-[60px] shrink-0 items-center gap-4 px-6"
      style={{
        background: "hsl(var(--card))",
        borderBottom: "1px solid hsl(var(--border))",
      }}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav className="flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.map((crumb, index) => (
          <span key={crumb.label} className="flex items-center gap-1.5 min-w-0">
            {index > 0 ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : null}
            <span
              className={cn(
                "truncate",
                index === crumbs.length - 1
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground text-sm font-normal h-8 px-3"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-muted-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Notifications
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2.5">
              <span className="text-sm font-medium">New enrollment request</span>
              <span className="text-xs text-muted-foreground">
                Grade 8 · 2 minutes ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2.5">
              <span className="text-sm font-medium">Attendance report ready</span>
              <span className="text-xs text-muted-foreground">
                October 2024 · 1 hour ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-center text-primary font-medium justify-center">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {loading ? (
          <div className="flex items-center gap-3 animate-pulse px-2 py-1">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="hidden sm:flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 rounded-full pr-1 transition-colors hover:bg-muted/60"
                aria-label={`Open account menu for ${username}`}
                title={username}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {initials}
                </div>
                <div className="hidden min-w-0 sm:flex flex-col items-start leading-tight">
                  <span
                    className="max-w-48 truncate text-sm font-semibold text-foreground lg:max-w-64"
                    title={username}
                  >
                    {username}
                  </span>
                  {userRole ? (
                    <Badge
                      className={cn(
                        "mt-1 h-5 rounded-full border px-2 py-0 text-[10px] font-semibold",
                        roleBadgeClasses,
                      )}
                    >
                      {formatRoleLabel(userRole)}
                    </Badge>
                  ) : null}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <p className="max-w-[150px] truncate text-sm font-semibold" title={username}>
                    {username}
                  </p>
                  {userRole ? (
                    <Badge
                      className={cn(
                        "h-5 rounded-full border px-2 py-0 text-[10px] font-semibold",
                        roleBadgeClasses,
                      )}
                    >
                      {formatRoleLabel(userRole)}
                    </Badge>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Account settings</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  router.replace("/login");
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
