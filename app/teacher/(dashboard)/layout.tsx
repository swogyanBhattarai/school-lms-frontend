"use client";
import { ReactNode, useState } from "react";
import { UserProvider } from "@/lib/contexts/UserContext";
import Topbar from "@/app/_components/Topbar";
import { TeacherSidebar } from "@/app/_components/teacher/TeacherSidebar";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
      const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
      return (
        <UserProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            <TeacherSidebar
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
