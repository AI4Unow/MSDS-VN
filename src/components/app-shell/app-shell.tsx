"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex">
      {/* Sidebar — hidden on mobile by default */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          user={user}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
