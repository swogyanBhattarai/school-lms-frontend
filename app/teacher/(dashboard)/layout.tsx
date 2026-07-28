"use client";
import { ReactNode, useState, useEffect } from "react";
import { UserProvider } from "@/lib/contexts/UserContext";
import { WebSocketProvider } from "@/lib/contexts/WebSocketContext";
import Topbar from "@/app/_components/Topbar";
import { TeacherSidebar } from "@/app/_components/teacher/TeacherSidebar";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
      const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

      // Lock body scroll when mobile sidebar is open.
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
        <WebSocketProvider>
        <div className="flex h-dvh overflow-hidden bg-background">
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
        </WebSocketProvider>
      </UserProvider>
      );
}
