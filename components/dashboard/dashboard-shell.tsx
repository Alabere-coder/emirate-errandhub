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
  Images,
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
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { AccountDropdown } from "./profile-menu";
import { DashboardNavbar } from "../navigation/dashboard-navbar";

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
    { label: "Overview", href: "/dashboard/customer", icon: Home },
    { label: "Find Services", href: "/services", icon: Search },
    {
      label: "My Requests",
      href: "/dashboard/customer/requests",
      icon: ClipboardList,
    },
    { label: "Find Workers", href: "/dashboard/customer/workers", icon: Users },
    { label: "Favorites", href: "/dashboard/customer/favorites", icon: Heart },
    {
      label: "Jobs",
      href: "/dashboard/customer/jobs",
      icon: BriefcaseBusiness,
    },
    { label: "Addresses", href: "/dashboard/customer/addresses", icon: MapPin },
    { label: "Profile", href: "/dashboard/customer/profile", icon: UserRound },
  ],
  worker: [
    { label: "Overview", href: "/dashboard/worker", icon: Home },
    { label: "Available Jobs", href: "/dashboard/worker/jobs", icon: Search },
    {
      label: "My Jobs",
      href: "/dashboard/worker/jobs/my",
      icon: ClipboardList,
    },
    {
      label: "Application",
      href: "/dashboard/worker/application",
      icon: FileCheck,
    },
    {
      label: "Service Categories",
      href: "/dashboard/worker/categories",
      icon: BriefcaseBusiness,
    },
    {
      label: "Service Areas",
      href: "/dashboard/worker/service-areas",
      icon: MapPin,
    },
    {
      label: "Availability",
      href: "/dashboard/worker/availability",
      icon: Clock3,
    },
    {
      label: "Documents",
      href: "/dashboard/worker/documents",
      icon: FileCheck,
    },
    { label: "Earnings", href: "/dashboard/worker/earnings", icon: Wallet },
    { label: "Portfolio", href: "/dashboard/worker/portfolio", icon: Images },
    { label: "Profile", href: "/dashboard/worker/profile", icon: UserRound },
  ],
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: Home },
    { label: "Users", href: "/dashboard/admin/users", icon: UserRound },
    {
      label: "Services",
      href: "/dashboard/admin/services",
      icon: BriefcaseBusiness,
    },
    {
      label: "Worker Verification",
      href: "/dashboard/admin/worker-verification",
      icon: ShieldCheck,
    },
    {
      label: "Worker Applications",
      href: "/dashboard/admin/worker-applications",
      icon: FileCheck,
    },
    {
      label: "Requests & Jobs",
      href: "/dashboard/admin/jobs",
      icon: ClipboardList,
    },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
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

function getDashboardRoot(role: UserRole) {
  return `/dashboard/${role}`;
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
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const currentPage =
    [...items]
      .sort((a, b) => b.href.length - a.href.length)
      .find(
        (item) =>
          pathname === item.href ||
          (item.href !== getDashboardRoot(role) &&
            pathname.startsWith(`${item.href}/`)),
      )?.label ?? "Dashboard";

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
        router.refresh();
        return;
      }
    } catch {
      // Keep the existing page in place if the request fails.
    }

    setLoggingOut(false);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-70 flex-col border-r border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 transition-transform duration-200 lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-19 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/dashboard"
            className="group flex min-w-0 items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-900/15 transition group-hover:bg-emerald-800">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold tracking-tight text-slate-900">
                Emirate ErrandHub
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                Services made easier
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mt-5 rounded-2xl border border-slate-100 bg-slate-50/90 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-700 to-emerald-900 text-sm font-bold text-white ring-4 ring-white">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {firstName} {lastName}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {getRoleLabel(role)}
              </p>
            </div>
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100"
              title="Account"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-5 pt-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== getDashboardRoot(role) &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-900/3"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {active && (
                    <span className="absolute bottom-2.5 left-0 top-2.5 w-0.75 rounded-r-full bg-emerald-700" />
                  )}
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                      active
                        ? "text-emerald-700"
                        : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <ChevronRight className="h-4 w-4 text-emerald-700/70" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      <div className="lg:pl-70">
        <DashboardNavbar
          role={role}
          currentPage={currentPage}
          onMenuClick={() => setMobileOpen(true)}
        >
          <AccountDropdown
            role={role}
            firstName={firstName}
            lastName={lastName}
          />
        </DashboardNavbar>

        <main className="min-h-[calc(100vh-72px)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <div className="mx-auto w-full max-w-360">{children}</div>
        </main>
      </div>
    </div>
  );
}
