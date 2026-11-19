"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";

import { NotificationBell } from "@/components/notifications/notification-bell";

type UserRole = "customer" | "worker" | "admin" | "super_admin";

type DashboardNavbarProps = {
  role: UserRole;
  currentPage: string;
  onMenuClick: () => void;
  children: ReactNode;
};

function getRoleLabel(role: UserRole) {
  switch (role) {
    case "customer":
      return "Customer";
    case "worker":
      return "Service Provider";
    case "admin":
      return "Administrator";
    case "super_admin":
      return "Super Administrator";
  }
}

export function DashboardNavbar({
  role,
  currentPage,
  onMenuClick,
  children,
}: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">
            {getRoleLabel(role)} workspace
          </p>

          <h1 className="truncate text-sm font-bold text-foreground sm:mt-0.5 sm:text-base">
            {currentPage}
          </h1>
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationBell />

        <div className="hidden h-8 w-px bg-border sm:block" />

        {children}
      </div>
    </header>
  );
}
