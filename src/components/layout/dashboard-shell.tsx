"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main
        className={`pt-14 lg:pt-0 transition-all duration-300 ${
          collapsed ? "lg:pl-[68px]" : "lg:pl-60"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
