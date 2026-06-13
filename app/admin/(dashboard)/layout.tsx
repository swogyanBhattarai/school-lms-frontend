"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import AdminSidebar from "@/app/_components/AdminSidebar";
import Topbar from "@/app/_components/Topbar";
import { UserProvider } from "@/lib/contexts/UserContext";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
    return (
      <UserProvider>
        <div className="flex h-screen overflow-hidden bg-background">
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
