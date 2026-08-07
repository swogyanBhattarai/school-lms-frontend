"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  Menu,
  Search,
} from "lucide-react";
import CommandPalette from "@/app/_components/CommandPalette";
import { cn } from "@/lib/utils";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { useUser } from "@/lib/contexts/UserContext";
import { useWebSocket } from "@/lib/contexts/WebSocketContext";
import { getUnreadNotificationCount } from "@/lib/api/notification";
import { notificationKeys } from "@/lib/api/hooks/notification";
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
  const { user } = useUser();
  const { latestNotifications } = useWebSocket();
  const username = user?.username || "";
  const userRole = user?.userRole || "";
  const roleBadgeClasses = getRoleBadgeClasses(userRole);

  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadNotificationCount,
  });

  // Refetch unread count when a new WebSocket notification arrives
  useEffect(() => {
    if (latestNotifications.length > 0) {
      refetchUnreadCount();
    }
  }, [latestNotifications.length, refetchUnreadCount]);

  const crumbs = useMemo(() => {
    if (pathname === "/") return [{ label: "Dashboard", to: undefined }];

    return pathname
      .split("/")
      .filter(Boolean)
      .map((segment, index, segments) => ({
        label: segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()),
        to:
          index < segments.length - 1
            ? "/" + segments.slice(0, index + 1).join("/")
            : undefined,
      }));
  }, [pathname]);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCommandPaletteOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const initials = username
    ? username
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const getNotificationBasePath = () => {
    if (/ADMIN/i.test(userRole)) return "/admin";
    if (/TEACHER/i.test(userRole)) return "/teacher";
    return "/accountant";
  };

  return (
    <header
      className="flex h-[60px] shrink-0 items-center gap-3 px-4 sm:px-6 overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        borderBottom: "1px solid hsl(var(--border))",
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile — compact search trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="sm:hidden flex-1 flex items-center gap-2 h-9 px-3 rounded-lg bg-muted/60 text-sm text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Search pages"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Search…</span>
      </button>

      {/* Breadcrumbs — hidden on mobile */}
      <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0 flex-shrink min-w-0">
        {crumbs.map((crumb, index) => (
          <span
            key={crumb.label}
            className="flex items-center gap-1.5 min-w-0"
          >
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            )}
            <span
              className={cn(
                "truncate",
                index === crumbs.length - 1
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground/80 transition-colors cursor-pointer"
              )}
              onClick={() => crumb.to && router.push(crumb.to)}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Desktop — centered search bar */}
      <div className="hidden sm:flex flex-1 justify-center px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full max-w-md lg:max-w-lg xl:max-w-xl flex items-center justify-between gap-2 text-muted-foreground text-sm font-normal h-9 pl-3.5 pr-2.5 rounded-lg border-dashed hover:border-solid transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Search className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">Search pages, actions…</span>
          </span>
          <kbd className="hidden md:inline-flex text-[10px] bg-muted/80 text-muted-foreground/70 px-1.5 py-0.5 rounded-md font-mono shrink-0 border border-border/50">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Right section — actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notification bell — navigates directly to notifications page */}
        <button
          onClick={() => router.push(`${getNotificationBasePath()}/notifications`)}
          className={cn(
            "group relative flex items-center gap-2 h-9 rounded-lg transition-all duration-200",
            "hover:bg-muted/80 active:scale-[0.97]",
            "px-2.5",
            unreadCount > 0
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          {/* Bell with subtle pulse when unread */}
          <span className="relative">
            <Bell className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-105" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
            )}
          </span>

          {/* Unread count text — visible on sm+ screens */}
          {unreadCount > 0 && (
            <span className="hidden sm:inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 rounded-md px-2 py-0.5 leading-none">
              {unreadCount} unread
            </span>
          )}

          {/* Mobile: just a small badge number */}
          {unreadCount > 0 && (
            <span className="sm:hidden flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-blue-500 text-[10px] font-bold text-white leading-none px-1">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Separator on desktop */}
        <div className="hidden sm:block h-6 w-px bg-border/60 mx-0.5" />

        {/* Avatar / Account dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="group flex items-center gap-2.5 rounded-full pr-1.5 pl-0.5 py-0.5 transition-colors hover:bg-muted/60 active:scale-[0.97]"
              aria-label={`Open account menu for ${username}`}
              title={username}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200"
                style={{
                  background: "hsl(var(--primary))",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {initials || "?"}
              </div>
              <div className="hidden min-w-0 sm:flex flex-col items-start leading-tight">
                <span
                  className="max-w-40 lg:max-w-56 truncate text-sm font-semibold text-foreground"
                  title={username}
                >
                  {username}
                </span>
                {userRole && (
                  <Badge
                    className={cn(
                      "mt-0.5 h-[18px] rounded-full border px-2 py-0 text-[10px] font-semibold leading-none",
                      roleBadgeClasses
                    )}
                  >
                    {formatRoleLabel(userRole)}
                  </Badge>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5 py-0.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {initials || "?"}
                </div>
                <div className="min-w-0 flex flex-col">
                  <p
                    className="truncate text-sm font-semibold"
                    title={username}
                  >
                    {username}
                  </p>
                  {userRole && (
                    <Badge
                      className={cn(
                        "mt-0.5 h-[18px] w-fit rounded-full border px-2 py-0 text-[10px] font-semibold leading-none",
                        roleBadgeClasses
                      )}
                    >
                      {formatRoleLabel(userRole)}
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                router.replace("/login");
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </header>
  );
}