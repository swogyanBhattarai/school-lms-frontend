"use client";
import useHasMounted from "@/lib/hooks/useHasMounted";
import { useState } from "react";
import {
  Users,
  UserCheck,
  GraduationCap,
  Clock,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import Link from "next/link";

// Mock data - replace with actual API calls
const activityLogs = [
  { id: 1, action: "New student enrolled", user: "John Doe", time: "2 minutes ago", type: "student" },
  { id: 2, action: "Attendance marked for Grade 10-A", user: "Sarah Smith", time: "15 minutes ago", type: "attendance" },
  { id: 3, action: "Teacher profile updated", user: "Mike Johnson", time: "1 hour ago", type: "teacher" },
  { id: 4, action: "Grade report generated", user: "Admin", time: "2 hours ago", type: "report" },
  { id: 5, action: "New section added: Grade 9-C", user: "Principal", time: "3 hours ago", type: "class" },
  { id: 6, action: "Parent meeting scheduled", user: "Emma Wilson", time: "4 hours ago", type: "event" },
  { id: 7, action: "Student record updated", user: "Lisa Brown", time: "5 hours ago", type: "student" },
  { id: 8, action: "Attendance report exported", user: "Admin", time: "6 hours ago", type: "report" },
  { id: 9, action: "New teacher onboarded", user: "HR Department", time: "7 hours ago", type: "teacher" },
  { id: 10, action: "Term calendar finalized", user: "Principal", time: "8 hours ago", type: "admin" },
];

const attendanceData = [
  { class: "Grade 10-A", attendance: 95, color: "bg-emerald-500" },
  { class: "Grade 10-B", attendance: 88, color: "bg-blue-500" },
  { class: "Grade 9-A", attendance: 92, color: "bg-violet-500" },
  { class: "Grade 9-B", attendance: 85, color: "bg-amber-500" },
  { class: "Grade 8-A", attendance: 90, color: "bg-rose-500" },
  { class: "Grade 8-B", attendance: 87, color: "bg-cyan-500" },
];

const topAttendanceData = [...attendanceData]
  .sort((a, b) => b.attendance - a.attendance)
  .slice(0, 5);

const getActivityIcon = (type: string) => {
  switch (type) {
    case "student": return <Users className="w-4 h-4" />;
    case "attendance": return <UserCheck className="w-4 h-4" />;
    case "teacher": return <GraduationCap className="w-4 h-4" />;
    case "report": return <BarChart3 className="w-4 h-4" />;
    case "class": return <CalendarDays className="w-4 h-4" />;
    case "event": return <Clock className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "student": return "bg-blue-100 text-blue-600";
    case "attendance": return "bg-emerald-100 text-emerald-600";
    case "teacher": return "bg-violet-100 text-violet-600";
    case "report": return "bg-amber-100 text-amber-600";
    case "class": return "bg-rose-100 text-rose-600";
    case "event": return "bg-cyan-100 text-cyan-600";
    default: return "bg-gray-100 text-gray-600";
  }
};

export default function DashboardPage() {
  const hasMounted = useHasMounted();
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  if (!hasMounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, Admin. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold">1,248</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
              <p className="text-3xl font-bold">86</p>
            </div>
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Today's Attendance</p>
              <p className="text-3xl font-bold">94.8%</p>
              <div className="flex items-center gap-1 text-xs">
                <ArrowDownRight className="w-3 h-3 text-rose-600" />
                <span className="text-rose-600 font-medium">-1.2%</span>
                <span className="text-muted-foreground">vs yesterday</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Active Classes */}
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Active Classes</p>
              <p className="text-3xl font-bold">42</p>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">Across</span>
                <span className="font-medium">6 grades</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance Bar Chart - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Attendance by Class</h2>
              <p className="text-sm text-muted-foreground mt-1">Today's attendance comparison across sections</p>
            </div>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {topAttendanceData.map((item) => (
              <div key={item.class} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.class}</span>
                  <span className="text-muted-foreground">{item.attendance}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${item.attendance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Excellent (&gt;90%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Good (85-90%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Needs Attention (&lt;85%)</span>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Quick Insights</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Highest Attendance</p>
                  <p className="text-xs text-muted-foreground">Grade 10-A</p>
                </div>
                <span className="text-emerald-600 font-bold">95%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Lowest Attendance</p>
                  <p className="text-xs text-muted-foreground">Grade 9-B</p>
                </div>
                <span className="text-rose-600 font-bold">85%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">New Enrollments</p>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
                <span className="text-blue-600 font-bold">8</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-sm">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Check our documentation or contact support for assistance.
            </p>
            <button className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition">
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground mt-1">Latest actions across the system</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y">
          {activityLogs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActivityColor(log.type)}`}>
                {getActivityIcon(log.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{log.action}</p>
                <p className="text-xs text-muted-foreground">by {log.user}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</span>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t bg-gray-50/50">
          <Link
            href="/dashboard/activity-logs"
            className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 font-medium py-2 rounded-lg hover:bg-primary/5 transition"
          >
            View all activities
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}