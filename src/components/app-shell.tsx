"use client";

import { GlobalToaster, Tabs, TabsList, TabsTrigger } from "@ciq-dev/ciq-design-system";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tab = pathname.startsWith("/feedback") ? "log" : pathname === "/" ? "overview" : "";

  return (
    <div className="relative flex h-screen overflow-hidden bg-canvas">
      <SidebarNav />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-default bg-surface px-4">
          <h1 className="type-title text-fg-primary">Agent feedback</h1>
          <Tabs value={tab}>
            <TabsList aria-label="Feedback portal">
              <TabsTrigger value="overview" asChild>
                <Link href="/">Overview</Link>
              </TabsTrigger>
              <TabsTrigger value="log" asChild>
                <Link href="/feedback">Feedback log</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>
        <div id="main-scroll" className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
      <GlobalToaster />
    </div>
  );
}
