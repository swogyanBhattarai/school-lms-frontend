"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  ClipboardList,
  Users,
  AlertTriangle,
  Clock,
  X,
  CheckCheck,
  Check,
} from "lucide-react";
import { cn, getApiErrorMessage, getLocalDateString } from "@/lib/utils";
import {
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api/notification";
import { notificationKeys } from "@/lib/api/hooks/notification";
import { useWebSocket } from "@/lib/contexts/WebSocketContext";
import type {
  NotificationResponse,
  NOTIFICATION_TYPE,
  AdminAttendanceData,
  ParentAttendanceData,
} from "@/types/lms";
import { toast } from "@/app/_components/ui/use-toast";
import { Button } from "@/app/_components/ui/button";

// Mocking the new 'isRead' property expected soon
type MockNotification = NotificationResponse & { isRead: boolean };

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

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: MockNotification;
  onMarkRead: (id: number) => void;
}) {
  const router = useRouter();
  const config =
    TYPE_CONFIG[notification.notificationType] ?? TYPE_CONFIG.NOTICE;
  const Icon = config.icon;
  const isRead = notification.isRead;

  const handleCardClick = () => {
    if (notification.notificationType === "MASS_ATTENDANCE") {
      const d = notification.data;
      const date = getLocalDateString(new Date(notification.createdAt));
      const url = `/admin/teachers/attendance/${d.sectionId}?subjectId=${d.subjectId}&teacherId=${d.teacherId}&attendanceDate=${date}&subjectName=${encodeURIComponent(d.subjectName)}&teacherName=${encodeURIComponent(d.teacherName)}`;
      router.push(url);
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border transition-all",
        isRead
          ? "bg-slate-50/50 border-slate-200/80 opacity-80 hover:opacity-100"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm",
        !isRead && "border-l-4 border-l-blue-500",
        notification.notificationType === "MASS_ATTENDANCE" && "cursor-pointer"
      )}
      onClick={notification.notificationType === "MASS_ATTENDANCE" ? handleCardClick : undefined}
    >
      <div className="p-4">
        {/* Mobile: Top-right check button */}
        {!isRead && (
          <button
            onClick={() => onMarkRead(notification.notificationId)}
            className="sm:hidden absolute top-3 right-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200 active:text-slate-700 z-10"
            aria-label="Mark as read"
          >
            <Check className="h-4 w-4" />
          </button>
        )}

        {/* Header: Icon + Title/Time (inline on both mobile and desktop) */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0",
              isRead ? "bg-slate-100" : config.bg
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isRead ? "text-slate-400" : config.color
              )}
            />
          </div>

          {/* Title & Time */}
          <div className="flex-1 min-w-0 pr-8 sm:pr-0">
            <div className="flex items-center gap-2">
              {!isRead && (
                <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-500 animate-pulse" />
              )}
              <h3
                className={cn(
                  "text-sm sm:text-[15px] font-semibold truncate",
                  isRead ? "text-slate-500" : "text-slate-900"
                )}
              >
                {notification.title}
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 flex items-center gap-1">
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

        {/* Type Specific UI */}
        <div className="mt-3">
          {notification.notificationType === "MASS_ATTENDANCE" && (
            <MassAttendanceContent data={notification.data} />
          )}
          {notification.notificationType === "STUDENT_ATTENDANCE" && (
            <StudentAttendanceContent data={notification.data} />
          )}
          {notification.notificationType === "NOTICE" && (
            <p className="text-sm text-slate-600 leading-relaxed mt-1">
              {notification.title}
            </p>
          )}
        </div>
      </div>

      {/* Desktop: Pill-shaped Mark as Read button */}
      {!isRead && (
        <div className="hidden sm:block absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMarkRead(notification.notificationId)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-colors"
            aria-label="Mark as read"
          >
            <X className="h-3 w-3" />
            Mark Read
          </button>
        </div>
      )}
    </div>
  );
}

// Extracted Component for Mass Attendance UI
function MassAttendanceContent({ data }: { data: AdminAttendanceData }) {
  return (
    <div className="space-y-3 border-t border-slate-100 pt-3">
      {/* Message - extra small on mobile, small on desktop */}
      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
        <span className="font-semibold text-slate-900">{data.teacherName}</span>{" "}
        marked attendance for{" "}
        <span className="font-semibold text-slate-900">{data.subjectName}</span>{" "}
        in{" "}
        <span className="font-semibold text-slate-900">
          {data.grade} - {data.sectionName}
        </span>
      </p>

      {/* Attendance Stats Pills */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center bg-emerald-50 rounded-lg py-2 px-1 border border-emerald-100">
          <span className="text-sm sm:text-base font-bold text-emerald-600">
            {data.presentStudents}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-emerald-700/80 uppercase tracking-wide">
            Present
          </span>
        </div>
        <div className="flex flex-col items-center justify-center bg-red-50 rounded-lg py-2 px-1 border border-red-100">
          <span className="text-sm sm:text-base font-bold text-red-500">
            {data.absentStudents}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-red-600/80 uppercase tracking-wide">
            Absent
          </span>
        </div>
        <div className="flex flex-col items-center justify-center bg-amber-50 rounded-lg py-2 px-1 border border-amber-100">
          <span className="text-sm sm:text-base font-bold text-amber-600">
            {data.leaveStudents}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-amber-700/80 uppercase tracking-wide">
            Leave
          </span>
        </div>
      </div>
    </div>
  );
}

// Extracted Component for Student Attendance UI
function StudentAttendanceContent({ data }: { data: ParentAttendanceData }) {
  const statusConfig = {
    PRESENT: { label: "Present", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    ABSENT: { label: "Absent", classes: "bg-red-50 text-red-700 border-red-200" },
    LEAVE: { label: "On Leave", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  };

  const config = statusConfig[data.attendanceStatus] || statusConfig.PRESENT;

  return (
    <div className="border-t border-slate-100 pt-3">
      {/* Desktop Layout - Horizontal */}
      <div className="hidden sm:flex items-center gap-3 bg-slate-50/80 border border-slate-100 rounded-lg p-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">Student</p>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {data.studentName}
          </p>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">Subject</p>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {data.subjectName}
          </p>
        </div>
        <span
          className={cn(
            "ml-auto flex-shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
            config.classes
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Mobile Layout - Stacked vertically with beautiful UI */}
      <div className="sm:hidden space-y-3 bg-slate-50/80 border border-slate-100 rounded-lg p-3">
        {/* Student Row */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
            Student
          </p>
          <p className="ml-auto text-sm font-semibold text-slate-800">
            {data.studentName}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200/60" />

        {/* Subject Row */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400" />
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
            Subject
          </p>
          <p className="ml-auto text-sm font-semibold text-slate-800">
            {data.subjectName}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200/60" />

        {/* Status Row */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400" />
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
            Status
          </p>
          <span
            className={cn(
              "ml-auto inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
              config.classes
            )}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage({
  hideHeader,
}: {
  hideHeader?: boolean;
}) {
  const queryClient = useQueryClient();
  const { clearNotifications } = useWebSocket();

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: getUnreadNotifications,
    // MOCK DATA INJECTION: Simulating isRead boolean for UI demonstration
    // Remove this select function once backend returns isRead
    select: (data: NotificationResponse[]) => {
      return data.map((n, i) => ({
        ...n,
        // Mocking first item as read if there are multiple, rest as unread
        isRead: i === 0 && data.length > 1 ? true : false,
      })) as MockNotification[];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      clearNotifications();
    },
    onError: (err) => {
      toast({
        title: "Failed to mark as read",
        description: getApiErrorMessage(err, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      clearNotifications();
      toast({
        title: "All notifications marked as read",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to mark all as read",
        description: getApiErrorMessage(err, "Please try again."),
        variant: "destructive",
      });
    },
  });

  const handleMarkRead = (notificationId: number) => {
    markReadMutation.mutate(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stay updated with the latest activity.
            </p>
          </div>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="gap-1.5 shadow-sm"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all as read</span>
              <span className="sm:hidden">Read all</span>
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="h-12 rounded-lg bg-slate-100" />
                    <div className="h-12 rounded-lg bg-slate-100" />
                    <div className="h-12 rounded-lg bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        /* Error State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/50 px-4 py-12 text-center">
          <BellOff className="h-10 w-10 text-red-400" />
          <h3 className="mt-3 font-semibold text-red-700">
            Failed to load notifications
          </h3>
          <p className="mt-1 text-sm text-red-500">
            {error instanceof Error
              ? error.message
              : "Please try again later."}
          </p>
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
            <Bell className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-700">
            No notifications yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            You&apos;re all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Unread count summary */}
          {!hideHeader && unreadCount > 0 && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              You have{" "}
              <span className="font-semibold text-blue-600">
                {unreadCount} unread
              </span>{" "}
              notification{unreadCount !== 1 ? "s" : ""}.
            </p>
          )}

          {/* Notification list */}
          <div className="space-y-3 sm:space-y-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.notificationId}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}