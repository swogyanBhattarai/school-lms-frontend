"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  ClipboardList,
  Users,
  AlertTriangle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUnreadNotifications } from "@/lib/api/notification";
import { notificationKeys } from "@/lib/api/hooks/notification";
import type { NotificationResponse, NOTIFICATION_TYPE } from "@/types/lms";

const TYPE_CONFIG: Record<
  NOTIFICATION_TYPE,
  { icon: typeof Bell; bg: string; color: string; label: string }
> = {
  STUDENT_ATTENDANCE: {
    icon: ClipboardList,
    bg: "bg-blue-100",
    color: "text-blue-600",
    label: "Attendance",
  },
  MASS_ATTENDANCE: {
    icon: Users,
    bg: "bg-emerald-100",
    color: "text-emerald-600",
    label: "Bulk Attendance",
  },
  NOTICE: {
    icon: AlertTriangle,
    bg: "bg-amber-100",
    color: "text-amber-600",
    label: "Notice",
  },
};

function NotificationCard({ notification }: { notification: NotificationResponse }) {
  const config = TYPE_CONFIG[notification.notificationType] ?? TYPE_CONFIG.NOTICE;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0",
          config.bg,
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {notification.title}
          </h3>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
              config.bg,
              config.color,
            )}
          >
            {config.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {notification.message}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(notification.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default function NotificationsPage({ hideHeader }: { hideHeader?: boolean }) {
  const { data: notifications = [], isLoading, isError, error } = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: getUnreadNotifications,
  });

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated with the latest activity.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-100 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/50 px-4 py-12 text-center">
          <BellOff className="h-10 w-10 text-red-400" />
          <h3 className="mt-3 font-semibold text-red-700">
            Failed to load notifications
          </h3>
          <p className="mt-1 text-sm text-red-500">
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center">
          <Bell className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 font-semibold text-slate-600">
            No notifications yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        /* Notification list */
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.notificationId}
              notification={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
