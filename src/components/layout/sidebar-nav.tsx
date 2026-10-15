"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Lightbulb,
  Mail,
  MessageSquare,
  MessagesSquare,
  Orbit,
  Settings2,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  isNew?: boolean;
  isActive?: (pathname: string) => boolean;
};

const workspaceNavItems: NavItem[] = [
  { label: "Command Center", href: "#", icon: Orbit },
  { label: "Business Overview", href: "#", icon: Building2 },
  { label: "Recommendations", href: "#", icon: Lightbulb },
  { label: "Agentspace", href: "#", icon: Wand2 },
  { label: "Optimizer", href: "#", icon: Mail },
  { label: "Ask Ally", href: "#", icon: MessageSquare, isNew: true },
  { label: "Reports", href: "#", icon: FileText, isNew: true },
  {
    label: "Feedback portal",
    href: "/",
    icon: MessagesSquare,
    isActive: (pathname) =>
      pathname === "/" || pathname.startsWith("/feedback"),
  },
];

function NavItemLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = item.isActive
    ? item.isActive(pathname)
    : item.href !== "#" &&
      (item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-brand text-action-primary-fg"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon
        className={cn(
          "size-4.5 shrink-0",
          isActive
            ? "text-action-primary-fg"
            : "text-slate-400 group-hover:text-white",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.isNew ? (
        <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold tracking-wide text-action-primary-fg uppercase">
          New
        </span>
      ) : null}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className={cn(
        "relative z-20 h-full shrink-0 overflow-visible transition-[width] duration-200 ease-in-out",
        collapsed ? "w-8" : "w-62",
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className="absolute top-4 left-full z-50 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-brand text-action-primary-fg shadow-md transition-colors hover:bg-action-primary-hover"
      >
        {collapsed ? (
          <ChevronsRight className="size-3.5" aria-hidden />
        ) : (
          <ChevronsLeft className="size-3.5" aria-hidden />
        )}
      </button>

      <nav
        aria-label="Main navigation"
        className="flex h-full flex-col overflow-hidden border-r border-slate-800 bg-[#0f172a]"
      >
        {!collapsed ? (
          <>
            <div className="flex shrink-0 items-center px-4 pt-4 pb-3">
              <Link
                href="/"
                className="text-lg font-semibold tracking-tight text-white"
              >
                Commerce<span className="text-brand">IQ</span>
              </Link>
            </div>

            <div className="space-y-2 px-3 pt-4">
              <p className="px-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                Region &amp; Retailer
              </p>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10"
              >
                <span className="text-base leading-none" aria-hidden>
                  🇺🇸
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  US Amazon
                </span>
                <Settings2
                  className="size-3.5 shrink-0 text-slate-400"
                  aria-hidden
                />
                <ChevronDown
                  className="size-3.5 shrink-0 text-slate-400"
                  aria-hidden
                />
              </button>
            </div>

            <div className="mt-5 px-3">
              <p className="px-1 text-[10px] font-semibold tracking-wider text-brand uppercase">
                My Workspace
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
              {workspaceNavItems.map((item) => (
                <NavItemLink key={item.label} item={item} pathname={pathname} />
              ))}
            </div>
          </>
        ) : null}
      </nav>
    </div>
  );
}
