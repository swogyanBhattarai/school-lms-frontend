"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Receipt,
  School,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/contexts/UserContext";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/academic-years", icon: CalendarDays, label: "Academic Years" },
  { href: "/admin/students", icon: GraduationCap, label: "Students" },
  { href: "/admin/fees", icon: Receipt, label: "Fees" },
  { href: "/admin/teachers", icon: Users, label: "Teachers" },
  { href: "/admin/subjects", icon: BookOpen, label: "Subjects" },
];

const NAV_BOTTOM = [{ href: "/settings", icon: Settings, label: "Settings" }];

type SidebarProps = {
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
};

export default function AdminSidebar({
  open,
  collapsed,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const username = user?.username || "";
  const schoolName = user?.schoolName || "";

  const initials = username
    ? username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <>
      {open ? (
        <button
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col transition-[transform,width] duration-200 lg:static lg:translate-x-0 overflow-x-hidden",
          collapsed ? "lg:w-16" : "lg:w-60 min-w-[15rem]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "hsl(var(--sidebar-bg))" }}
      >
        <div
          className={cn(
            "flex h-[60px] items-center gap-3 px-4",
            collapsed && "lg:justify-between"
          )}
          style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
        >
          {collapsed ? null : (
            <>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "hsl(var(--primary))",
                  boxShadow: "0 0 0 3px hsl(var(--primary) / 0.18)",
                }}
              >
                <School className="h-4 w-4 text-white" />
              </div>
              <div className="leading-tight overflow-hidden">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "hsl(var(--sidebar-active-fg))" }}
                >
                  EduManage
                </p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: "hsl(var(--sidebar-fg-muted))" }}
                >
                  School Management
                </p>
              </div>
            </>
          )}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "ml-auto hidden lg:flex h-8 w-8 items-center justify-center rounded-md",
              "hover:bg-[hsl(var(--sidebar-hover-bg))]"
            )}
            style={{ color: "hsl(var(--sidebar-fg))" }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1 rounded"
            style={{ color: "hsl(var(--sidebar-fg-muted))" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          className={cn(
            "flex flex-col flex-1 gap-0.5 overflow-y-auto p-3",
            collapsed && "lg:items-center"
          )}
        >
          <p
            className={cn(
              "px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest",
              collapsed && "lg:hidden"
            )}
            style={{ color: "hsl(var(--sidebar-section-fg))" }}
          >
            Menu
          </p>
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 select-none",
                  collapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? "text-white shadow-md"
                    : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover-bg))]"
                )}
                style={
                  isActive
                    ? {
                        background: "hsl(var(--sidebar-active-bg))",
                        color: "hsl(var(--sidebar-active-fg))",
                        boxShadow:
                          "0 2px 10px hsl(var(--sidebar-active-bg) / 0.45)",
                      }
                    : undefined
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                <span className={cn("whitespace-nowrap", collapsed && "lg:hidden")}>{label}</span>
              </Link>
            );
          })}

          <div className="flex-1" />

          <div
            className="my-2 h-px"
            style={{ background: "hsl(var(--sidebar-border))" }}
          />

          {NAV_BOTTOM.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 select-none",
                  collapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? "text-white shadow-md"
                    : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover-bg))]"
                )}
                style={
                  isActive
                    ? {
                        background: "hsl(var(--sidebar-active-bg))",
                        color: "hsl(var(--sidebar-active-fg))",
                        boxShadow:
                          "0 2px 10px hsl(var(--sidebar-active-bg) / 0.45)",
                      }
                    : undefined
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                <span className={cn("whitespace-nowrap", collapsed && "lg:hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="p-3"
          style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
        >
          {loading ? (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 animate-pulse",
                collapsed && "lg:justify-center lg:px-2"
              )}
              style={{ background: "hsl(var(--sidebar-hover-bg))" }}
            >
              <div className="h-7 w-7 rounded-full bg-muted/20" />
              {!collapsed && (
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-3 w-20 rounded bg-muted/20" />
                  <div className="h-2 w-12 rounded bg-muted/20" />
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5",
                collapsed && "lg:justify-center lg:px-2"
              )}
              style={{ background: "hsl(var(--sidebar-hover-bg))" }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: "hsl(var(--primary))",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {initials}
              </div>
              <div
                className={cn(
                  "overflow-hidden leading-tight",
                  collapsed && "lg:hidden"
                )}
              >
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "hsl(var(--sidebar-active-fg))" }}
                >
                  {username}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: "hsl(var(--sidebar-fg-muted))" }}
                >
                  {schoolName}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
