"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WebSocketProvider } from "@/lib/contexts/WebSocketContext";
import NotificationsPage from "@/app/_components/NotificationsPage";

export default function ParentNotifications() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/parent"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
            <p className="text-xs text-slate-500">Stay updated</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <WebSocketProvider>
          <NotificationsPage hideHeader />
        </WebSocketProvider>
      </div>
    </div>
  );
}
