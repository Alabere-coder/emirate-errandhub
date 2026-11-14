"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileCheck,
  Headphones,
  Home,
  MapPin,
  Megaphone,
  ReceiptTurkishLira,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  StarCheck,
  TicketPercent,
  User,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { AccountDropdown } from "./profile-menu";
import { DashboardNavbar } from "../navigation/dashboard-navbar";
import { SupportButton } from "./support-button";

type AdminRole = "admin" | "super_admin";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type AdminDashboardShellProps = {
  role: AdminRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  platformLogoUrl?: string | null;
  platformName?: string;
  platformDescription?: string;
  children: React.ReactNode;
};

const overviewItem: NavItem = {
  label: "Overview",
  href: "/dashboard/admin",
  icon: Home,
};

const adminNavigation: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        label: "Services",
        href: "/dashboard/admin/services",
        icon: BriefcaseBusiness,
      },
      {
        label: "Service Areas",
        href: "/dashboard/admin/service-areas",
        icon: MapPin,
      },
      {
        label: "Requests & Jobs",
        href: "/dashboard/admin/jobs",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "User Management",
    items: [
      {
        label: "Users",
        href: "/dashboard/admin/users",
        icon: UserRound,
      },
    ],
  },
  {
    label: "Worker Management",
    items: [
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
    ],
  },
  {
    label: "Quality & Safety",
    items: [
      {
        label: "Reviews",
        href: "/dashboard/admin/reviews",
        icon: Star,
      },
      {
        label: "Review-reports",
        href: "/dashboard/admin/review-reports",
        icon: StarCheck,
      },
      {
        label: "Disputes",
        href: "/dashboard/admin/disputes",
        icon: ShieldAlert,
      },
    ],
  },
  {
    label: "Customer Support",
    items: [
      {
        label: "Supports",
        href: "/dashboard/admin/support",
        icon: Headphones,
      },
      {
        label: "Public Supports",
        href: "/dashboard/admin/public-support",
        icon: Headphones,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Withdrawals",
        href: "/dashboard/admin/withdrawals",
        icon: WalletCards,
      },
      {
        label: "Refunds",
        href: "/dashboard/admin/refunds",
        icon: ReceiptTurkishLira,
      },
    ],
  },
  {
    label: "Marketing & Promotions",
    items: [
      {
        label: "Marketing",
        href: "/dashboard/admin/marketing",
        icon: Megaphone,
      },
      {
        label: "Popups & Promotions",
        href: "/dashboard/admin/popups",
        icon: Sparkles,
      },
      {
        label: "Discount Codes",
        href: "/dashboard/admin/discount-codes",
        icon: TicketPercent,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Profile",
        href: "/dashboard/admin/profile",
        icon: User,
      },
      {
        label: "Settings",
        href: "/dashboard/admin/settings",
        icon: Settings,
      },
    ],
  },
];

const superAdminNavigation: NavGroup[] = [
  ...adminNavigation.filter((group) => group.label !== "Account"),
  {
    label: "Platform Management",
    items: [
      {
        label: "Admin Management",
        href: "/dashboard/admin/management",
        icon: Users,
      },
    ],
  },
  adminNavigation.find((group) => group.label === "Account")!,
];

function isPathActive(pathname: string, item: NavItem) {
  return (
    pathname === item.href ||
    (item.href !== "/dashboard/admin" && pathname.startsWith(`${item.href}/`))
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
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

      <span className="min-w-0 flex-1">{item.label}</span>

      {active && (
        <ChevronRight className="h-4 w-4 shrink-0 text-emerald-700/70" />
      )}
    </Link>
  );
}

export function AdminDashboardShell({
  role,
  firstName,
  lastName,
  avatarUrl,
  platformLogoUrl,
  platformName = "Emirate ErrandHub",
  platformDescription = "Services made easier.",
  children,
}: AdminDashboardShellProps) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Operations: true,
  });

  const navigation =
    role === "super_admin" ? superAdminNavigation : adminNavigation;

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const allItems = [
    overviewItem,
    ...navigation.flatMap((group) => group.items),
  ];

  const matchingItem = [...allItems]
    .filter((item) => isPathActive(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const currentPage = matchingItem?.label ?? "Dashboard";

  const roleLabel =
    role === "super_admin" ? "Super Administrator" : "Administrator";

  useEffect(() => {
    const activeGroup = navigation.find((group) =>
      group.items.some((item) => isPathActive(pathname, item)),
    );

    if (activeGroup) {
      setOpenGroups((previous) => ({
        ...previous,
        [activeGroup.label]: true,
      }));
    }
  }, [pathname, navigation]);

  function toggleGroup(groupLabel: string) {
    setOpenGroups((previous) => ({
      ...previous,
      [groupLabel]: !previous[groupLabel],
    }));
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
            href="/"
            className="group flex min-w-0 items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50">
              {platformLogoUrl ? (
                <Image
                  src={platformLogoUrl}
                  alt="Emirate ErrandHub logo"
                  width={40}
                  height={40}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-900/15 transition group-hover:bg-emerald-800">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
              )}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold tracking-tight text-slate-900">
                {platformName}
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                {platformDescription}
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
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-emerald-700 to-emerald-900 text-sm font-bold text-white ring-4 ring-white">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`${firstName} ${lastName}`}
                  fill
                  unoptimized
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                initials || "U"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {firstName} {lastName}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {roleLabel}
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

          <div className="space-y-2">
            <SidebarLink
              item={overviewItem}
              active={pathname === overviewItem.href}
              onNavigate={() => setMobileOpen(false)}
            />

            {navigation.map((group) => {
              const expanded = !!openGroups[group.label];

              const groupActive = group.items.some((item) =>
                isPathActive(pathname, item),
              );

              return (
                <div key={group.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    aria-expanded={expanded}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition ${
                      groupActive
                        ? "text-emerald-800"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span className="flex-1">{group.label}</span>

                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expanded && (
                    <div className="ml-2 mt-1 space-y-1 border-l border-slate-100 pl-3">
                      {group.items.map((item) => (
                        <SidebarLink
                          key={item.href}
                          item={item}
                          active={matchingItem?.href === item.href}
                          onNavigate={() => setMobileOpen(false)}
                        />
                      ))}
                    </div>
                  )}
                </div>
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
            avatarUrl={avatarUrl}
          />
        </DashboardNavbar>

        <main className="min-h-[calc(100vh-72px)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <div className="mx-auto w-full max-w-360">{children}</div>
        </main>

        <SupportButton />
      </div>
    </div>
  );
}
