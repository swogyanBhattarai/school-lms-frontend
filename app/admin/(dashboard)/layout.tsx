"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import AdminSidebar from "@/app/_components/AdminSidebar";
import Topbar from "@/app/_components/Topbar";
import { UserProvider } from "@/lib/contexts/UserContext";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Lock body scroll when mobile sidebar is open.
    // The sidebar only opens via a hamburger button that is hidden on desktop
    // (lg:hidden), so this effect is effectively mobile-only. The width check
    // prevents a stale lock if the user resizes to desktop while the sidebar
    // is still open.
    useEffect(() => {
      if (sidebarOpen && window.innerWidth < 1024) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [sidebarOpen]);
  
    return (
      <UserProvider>
        <div className="flex h-dvh overflow-hidden bg-background">
          <AdminSidebar
            open={sidebarOpen}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-6xl px-6 py-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </UserProvider>
    );
}
