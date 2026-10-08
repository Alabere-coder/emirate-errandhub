"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  Clock3,
  FileCheck,
  Heart,
  Home,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

type UserRole = "customer" | "worker" | "admin";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type DashboardShellProps = {
  role: UserRole;
  firstName: string;
  lastName: string;
  children: React.ReactNode;
};

const navigation: Record<UserRole, NavItem[]> = {
  customer: [
    {
      label: "Overview",
      href: "/dashboard/customer",
      icon: Home,
    },
    {
      label: "Find Services",
      href: "/services",
      icon: Search,
    },
    {
      label: "My Requests",
      href: "/dashboard/customer/requests",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/customer/workers",
      label: "Find Workers",
      icon: Users,
    },
    {
      label: "Favorites",
      href: "/dashboard/customer/favorites",
      icon: Heart,
    },
    {
      label: "Jobs",
      href: "/dashboard/customer/jobs",
      icon: BriefcaseBusiness,
    },
    {
      label: "Profile",
      href: "/dashboard/customer/profile",
      icon: UserRound,
    },
  ],

  worker: [
    {
      label: "Overview",
      href: "/dashboard/worker",
      icon: Home,
    },
    {
      label: "Available Jobs",
      href: "/dashboard/worker/jobs",
      icon: Search,
    },
    {
      label: "My Jobs",
      href: "/dashboard/worker/jobs/my",
      icon: ClipboardList,
    },

    {
      label: "Application",
      href: "/dashboard/worker/application",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/worker/categories",
      label: "Service Categories",
      icon: BriefcaseBusiness,
    },
    {
      href: "/dashboard/worker/service-areas",
      label: "Service Areas",
      icon: MapPin,
    },
    {
      href: "/dashboard/worker/availability",
      label: "Availability",
      icon: Clock3,
    },
    {
      href: "/dashboard/worker/documents",
      label: "Documents",
      icon: FileCheck,
    },
    {
      label: "Earnings",
      href: "/dashboard/worker/earnings",
      icon: Wallet,
    },
    {
      label: "Profile",
      href: "/dashboard/worker/profile",
      icon: UserRound,
    },
  ],

  admin: [
    {
      label: "Overview",
      href: "/dashboard/admin",
      icon: Home,
    },
    {
      label: "Users",
      href: "/dashboard/admin/users",
      icon: UserRound,
    },
    {
      label: "Services",
      href: "/dashboard/admin/services",
      icon: BriefcaseBusiness,
    },
    {
      href: "/dashboard/admin/worker-verification",
      label: "Worker Verification",
      icon: ShieldCheck,
    },
    {
      href: "/dashboard/admin/worker-applications",
      label: "Worker Applications",
      icon: ShieldCheck,
    },
    {
      label: "Requests & Jobs",
      href: "/dashboard/admin/jobs",
      icon: ClipboardList,
    },
    {
      label: "Settings",
      href: "/dashboard/admin/settings",
      icon: Settings,
    },
  ],
};

function getRoleLabel(role: UserRole) {
  switch (role) {
    case "customer":
      return "Customer";

    case "worker":
      return "Service Provider";

    case "admin":
      return "Administrator";
  }
}

export function DashboardShell({
  role,
  firstName,
  lastName,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const items = navigation[role];

  async function handleLogout() {
    setLoggingOut(true);

    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (response.ok) {
      router.push("/login");
      router.refresh();
      return;
    }

    setLoggingOut(false);
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            Emirate ErrandHub
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {firstName} {lastName}
              </p>

              <p className="text-xs text-slate-500">{getRoleLabel(role)}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>

          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/dashboard/customer" &&
                  item.href !== "/dashboard/worker" &&
                  item.href !== "/dashboard/admin" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />

            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Link>

            <Link
              href={
                role === "customer"
                  ? "/dashboard/customer/profile"
                  : role === "worker"
                    ? "/dashboard/worker/profile"
                    : "/dashboard/admin/settings"
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              {initials}
            </Link>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
