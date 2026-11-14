"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  BriefcaseBusiness,
  ClipboardList,
  Clock3,
  FileCheck,
  Heart,
  Home,
  Images,
  MapPin,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Star,
  StarCheck,
  WalletCards,
  Phone,
  ShieldAlert,
  FaceAngry,
  Headphones,
  User,
  CreditCard,
  ReceiptTurkishLira,
  Megaphone,
  TicketPercent,
} from "lucide-react";

import { AccountDropdown } from "./profile-menu";
import { DashboardNavbar } from "../navigation/dashboard-navbar";
import { SupportButton } from "./support-button";

type UserRole = "customer" | "worker" | "admin" | "super_admin";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type DashboardShellProps = {
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  platformLogoUrl?: string | null;
  platformName?: string;
  platformDescription?: string;
  applicationBadge?: string;
  documentsBadge?: string;
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
    {
      label: "Payments History",
      href: "/dashboard/customer/payments",
      icon: CreditCard,
    },
    {
      label: "Disputes",
      href: "/dashboard/disputes",
      icon: FaceAngry,
    },
    { label: "Addresses", href: "/dashboard/customer/addresses", icon: MapPin },
    { label: "Profile", href: "/dashboard/customer/profile", icon: UserRound },
    { label: "Settings", href: "/dashboard/customer/settings", icon: Settings },
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
      label: "Documents",
      href: "/dashboard/worker/documents",
      icon: FileCheck,
    },
    {
      label: "Phone Verification",
      href: "/dashboard/worker/phone-verification",
      icon: Phone,
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
    { label: "Earnings", href: "/dashboard/worker/earnings", icon: Wallet },
    {
      label: "Payout Account",
      href: "/dashboard/worker/payout-account",
      icon: WalletCards,
    },
    { label: "Portfolio", href: "/dashboard/worker/portfolio", icon: Images },
    {
      label: "My Reviews",
      href: "/dashboard/worker/reviews",
      icon: Star,
    },
    {
      label: "Disputes",
      href: "/dashboard/disputes",
      icon: FaceAngry,
    },
    { label: "Profile", href: "/dashboard/worker/profile", icon: UserRound },
    { label: "Settings", href: "/dashboard/worker/settings", icon: Settings },
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
      label: "Service Areas",
      href: "/dashboard/admin/service-areas",
      icon: MapPin,
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
    {
      label: "Supports",
      href: "/dashboard/admin/support",
      icon: Headphones,
    },
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
    {
      label: "Profile",
      href: "/dashboard/admin/profile",
      icon: User,
    },
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
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ],

  super_admin: [
    { label: "Overview", href: "/dashboard/admin", icon: Home },
    { label: "Users", href: "/dashboard/admin/users", icon: UserRound },
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
    {
      label: "Supports",
      href: "/dashboard/admin/support",
      icon: Headphones,
    },
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
    {
      label: "Profile",
      href: "/dashboard/admin/profile",
      icon: User,
    },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
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
    {
      label: "Admin Management",
      href: "/dashboard/admin/management",
      icon: Users,
    },
  ],
};

const workerNavigation: NavGroup[] = [
  {
    label: "Work",
    items: [
      { label: "Available Jobs", href: "/dashboard/worker/jobs", icon: Search },
      {
        label: "My Jobs",
        href: "/dashboard/worker/jobs/my",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "My Business",
    items: [
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
        label: "Portfolio",
        href: "/dashboard/worker/portfolio",
        icon: Images,
      },
      {
        label: "My Reviews",
        href: "/dashboard/worker/reviews",
        icon: Star,
      },
    ],
  },
  {
    label: "Verification",
    items: [
      {
        label: "Application",
        href: "/dashboard/worker/application",
        icon: FileCheck,
      },
      {
        label: "Documents",
        href: "/dashboard/worker/documents",
        icon: FileCheck,
      },
      {
        label: "Phone Verification",
        href: "/dashboard/worker/phone-verification",
        icon: Phone,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Earnings", href: "/dashboard/worker/earnings", icon: Wallet },
      {
        label: "Payout Account",
        href: "/dashboard/worker/payout-account",
        icon: WalletCards,
      },
    ],
  },
  {
    label: "Account & Support",
    items: [
      { label: "Profile", href: "/dashboard/worker/profile", icon: UserRound },
      { label: "Settings", href: "/dashboard/worker/settings", icon: Settings },
      { label: "Disputes", href: "/dashboard/disputes", icon: FaceAngry },
    ],
  },
];

const customerNavigation: NavGroup[] = [
  {
    label: "Services",
    items: [
      { label: "Find Services", href: "/services", icon: Search },
      {
        label: "Find Workers",
        href: "/dashboard/customer/workers",
        icon: Users,
      },
      {
        label: "Favorites",
        href: "/dashboard/customer/favorites",
        icon: Heart,
      },
    ],
  },
  {
    label: "Requests & Jobs",
    items: [
      {
        label: "My Requests",
        href: "/dashboard/customer/requests",
        icon: ClipboardList,
      },
      {
        label: "Jobs",
        href: "/dashboard/customer/jobs",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    label: "Payments & Support",
    items: [
      {
        label: "Payments History",
        href: "/dashboard/customer/payments",
        icon: CreditCard,
      },
      {
        label: "Disputes",
        href: "/dashboard/disputes",
        icon: FaceAngry,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Addresses",
        href: "/dashboard/customer/addresses",
        icon: MapPin,
      },
      {
        label: "Profile",
        href: "/dashboard/customer/profile",
        icon: UserRound,
      },
      {
        label: "Settings",
        href: "/dashboard/customer/settings",
        icon: Settings,
      },
    ],
  },
];

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

function getDashboardRoot(role: UserRole) {
  return role === "super_admin" ? "/dashboard/admin" : `/dashboard/${role}`;
}

function isPathActive(pathname: string, item: NavItem, role: UserRole) {
  return (
    pathname === item.href ||
    (item.href !== getDashboardRoot(role) &&
      pathname.startsWith(`${item.href}/`))
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

  const badgeStyles: Record<string, string> = {
    Approved: "bg-emerald-50 text-emerald-700",
    Pending: "bg-amber-50 text-amber-700",
    "Under review": "bg-blue-50 text-blue-700",
    Rejected: "bg-red-50 text-red-700",
    "Action required": "bg-red-50 text-red-700",
    "Not submitted": "bg-slate-100 text-slate-500",
  };

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

      {item.badge && (
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold leading-none ${
            badgeStyles[item.badge] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {item.badge}
        </span>
      )}

      {active && (
        <ChevronRight className="h-4 w-4 shrink-0 text-emerald-700/70" />
      )}
    </Link>
  );
}

export function DashboardShell({
  role,
  firstName,
  lastName,
  avatarUrl,
  platformLogoUrl,
  platformName = "Emirate ErrandHub",
  platformDescription = "Services made easier.",
  applicationBadge,
  documentsBadge,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Work: true,
  });

  const items = navigation[role];

  const groupedNavigation =
    role === "worker"
      ? workerNavigation
      : role === "customer"
        ? customerNavigation
        : role === "admin"
          ? adminNavigation
          : role === "super_admin"
            ? superAdminNavigation
            : [];

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const matchingItem = [...items]
    .filter((item) => isPathActive(pathname, item, role))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const currentPage = matchingItem?.label ?? "Dashboard";

  // Automatically expand the group containing the current page.
  useEffect(() => {
    if (
      role !== "worker" &&
      role !== "customer" &&
      role !== "admin" &&
      role !== "super_admin"
    ) {
      return;
    }

    const activeGroup = groupedNavigation.find((group) =>
      group.items.some((item) => isPathActive(pathname, item, role)),
    );

    if (activeGroup) {
      setOpenGroups((previous) => ({
        ...previous,
        [activeGroup.label]: true,
      }));
    }
  }, [pathname, role, groupedNavigation]);

  function toggleGroup(groupLabel: string) {
    setOpenGroups((previous) => ({
      ...previous,
      [groupLabel]: !previous[groupLabel],
    }));
  }

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
              {(role === "admin" || role === "super_admin") && avatarUrl ? (
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

          {role === "worker" ||
          role === "customer" ||
          role === "admin" ||
          role === "super_admin" ? (
            <div className="space-y-2">
              {/* Overview stays visible */}
              <SidebarLink
                item={items[0]}
                active={pathname === items[0].href}
                onNavigate={() => setMobileOpen(false)}
              />

              {groupedNavigation.map((group) => {
                const expanded = !!openGroups[group.label];

                const groupActive = group.items.some((item) =>
                  isPathActive(pathname, item, role),
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
                        {group.items.map((item) => {
                          const active = matchingItem?.href === item.href;

                          const itemWithBadge: NavItem = {
                            ...item,
                            badge:
                              role === "worker" &&
                              item.href === "/dashboard/worker/application"
                                ? applicationBadge
                                : role === "worker" &&
                                    item.href === "/dashboard/worker/documents"
                                  ? documentsBadge
                                  : undefined,
                          };

                          return (
                            <SidebarLink
                              key={item.href}
                              item={itemWithBadge}
                              active={active}
                              onNavigate={() => setMobileOpen(false)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => {
                const active = matchingItem?.href === item.href;

                return (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={active}
                    onNavigate={() => setMobileOpen(false)}
                  />
                );
              })}
            </div>
          )}
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

        {(role === "customer" || role === "worker") && <SupportButton />}
      </div>
    </div>
  );
}

// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { usePathname, useRouter } from "next/navigation";
// import {
//   Bell,
//   BriefcaseBusiness,
//   ClipboardList,
//   Clock3,
//   FileCheck,
//   Heart,
//   Home,
//   Images,
//   LogOut,
//   MapPin,
//   Menu,
//   Search,
//   Settings,
//   ShieldCheck,
//   UserRound,
//   Users,
//   Wallet,
//   X,
//   Sparkles,
//   ChevronRight,
//   Star,
//   StarCheck,
//   WalletCards,
//   Phone,
//   ShieldAlert,
//   FaceAngry,
//   Headphones,
//   User,
//   CreditCard,
//   ReceiptTurkishLira,
//   Megaphone,
//   TicketPercent,
// } from "lucide-react";
// import { useState } from "react";
// import { AccountDropdown } from "./profile-menu";
// import { DashboardNavbar } from "../navigation/dashboard-navbar";

// type UserRole = "customer" | "worker" | "admin" | "super_admin";

// type NavItem = {
//   label: string;
//   href: string;
//   icon: React.ComponentType<{ className?: string }>;
// };

// type DashboardShellProps = {
//   role: UserRole;
//   firstName: string;
//   lastName: string;
//   avatarUrl?: string | null;
//   platformLogoUrl?: string | null;
//   platformName?: string;
//   platformDescription?: string;
//   children: React.ReactNode;
// };

// const navigation: Record<UserRole, NavItem[]> = {
//   customer: [
//     { label: "Overview", href: "/dashboard/customer", icon: Home },
//     { label: "Find Services", href: "/services", icon: Search },
//     {
//       label: "My Requests",
//       href: "/dashboard/customer/requests",
//       icon: ClipboardList,
//     },
//     { label: "Find Workers", href: "/dashboard/customer/workers", icon: Users },
//     { label: "Favorites", href: "/dashboard/customer/favorites", icon: Heart },
//     {
//       label: "Jobs",
//       href: "/dashboard/customer/jobs",
//       icon: BriefcaseBusiness,
//     },
//     {
//       label: "Payments History",
//       href: "/dashboard/customer/payments",
//       icon: CreditCard,
//     },
//     {
//       label: "Disputes",
//       href: "/dashboard/disputes",
//       icon: FaceAngry,
//     },
//     { label: "Addresses", href: "/dashboard/customer/addresses", icon: MapPin },
//     { label: "Profile", href: "/dashboard/customer/profile", icon: UserRound },
//     { label: "Settings", href: "/dashboard/customer/settings", icon: Settings },
//   ],
//   worker: [
//     { label: "Overview", href: "/dashboard/worker", icon: Home },
//     { label: "Available Jobs", href: "/dashboard/worker/jobs", icon: Search },
//     {
//       label: "My Jobs",
//       href: "/dashboard/worker/jobs/my",
//       icon: ClipboardList,
//     },
//     {
//       label: "Application",
//       href: "/dashboard/worker/application",
//       icon: FileCheck,
//     },
//     {
//       label: "Documents",
//       href: "/dashboard/worker/documents",
//       icon: FileCheck,
//     },
//     {
//       label: "Phone-verification",
//       href: "/dashboard/worker/phone-verification",
//       icon: Phone,
//     },

//     {
//       label: "Service Categories",
//       href: "/dashboard/worker/categories",
//       icon: BriefcaseBusiness,
//     },
//     {
//       label: "Service Areas",
//       href: "/dashboard/worker/service-areas",
//       icon: MapPin,
//     },
//     {
//       label: "Availability",
//       href: "/dashboard/worker/availability",
//       icon: Clock3,
//     },

//     { label: "Earnings", href: "/dashboard/worker/earnings", icon: Wallet },
//     {
//       label: "Payout-account",
//       href: "/dashboard/worker/payout-account",
//       icon: WalletCards,
//     },
//     { label: "Portfolio", href: "/dashboard/worker/portfolio", icon: Images },
//     {
//       label: "My Reviews",
//       href: "/dashboard/worker/reviews",
//       icon: Star,
//     },
//     {
//       label: "Disputes",
//       href: "/dashboard/disputes",
//       icon: FaceAngry,
//     },
//     { label: "Profile", href: "/dashboard/worker/profile", icon: UserRound },
//     { label: "Settings", href: "/dashboard/worker/settings", icon: Settings },
//   ],
//   admin: [
//     { label: "Overview", href: "/dashboard/admin", icon: Home },
//     { label: "Users", href: "/dashboard/admin/users", icon: UserRound },
//     {
//       label: "Services",
//       href: "/dashboard/admin/services",
//       icon: BriefcaseBusiness,
//     },
//     {
//       label: "Service Areas",
//       href: "/dashboard/admin/service-areas",
//       icon: MapPin,
//     },
//     {
//       label: "Worker Verification",
//       href: "/dashboard/admin/worker-verification",
//       icon: ShieldCheck,
//     },
//     {
//       label: "Worker Applications",
//       href: "/dashboard/admin/worker-applications",
//       icon: FileCheck,
//     },
//     {
//       label: "Requests & Jobs",
//       href: "/dashboard/admin/jobs",
//       icon: ClipboardList,
//     },
//     {
//       label: "Reviews",
//       href: "/dashboard/admin/reviews",
//       icon: Star,
//     },
//     {
//       label: "Review-reports",
//       href: "/dashboard/admin/review-reports",
//       icon: StarCheck,
//     },

//     {
//       label: "Disputes",
//       href: "/dashboard/admin/disputes",
//       icon: ShieldAlert,
//     },

//     {
//       label: "Supports",
//       href: "/dashboard/admin/support",
//       icon: Headphones,
//     },

//     {
//       label: "Withdrawals",
//       href: "/dashboard/admin/withdrawals",
//       icon: WalletCards,
//     },

//     {
//       label: "Refunds",
//       href: "/dashboard/admin/refunds",
//       icon: ReceiptTurkishLira,
//     },

//     {
//       label: "Profile",
//       href: "/dashboard/admin/profile",
//       icon: User,
//     },

//     {
//       label: "Marketing",
//       href: "/dashboard/admin/marketing",
//       icon: Megaphone,
//     },

//     {
//       label: "Popups & Promotions",
//       href: "/dashboard/admin/popups",
//       icon: Sparkles,
//     },

//     {
//       label: "Discount Codes",
//       href: "/dashboard/admin/discount-codes",
//       icon: TicketPercent,
//     },

//     { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
//   ],
//   super_admin: [
//     ...[
//       { label: "Overview", href: "/dashboard/admin", icon: Home },
//       { label: "Users", href: "/dashboard/admin/users", icon: UserRound },
//       {
//         label: "Services",
//         href: "/dashboard/admin/services",
//         icon: BriefcaseBusiness,
//       },
//       {
//         label: "Service Areas",
//         href: "/dashboard/admin/service-areas",
//         icon: MapPin,
//       },
//       {
//         label: "Worker Verification",
//         href: "/dashboard/admin/worker-verification",
//         icon: ShieldCheck,
//       },
//       {
//         label: "Worker Applications",
//         href: "/dashboard/admin/worker-applications",
//         icon: FileCheck,
//       },
//       {
//         label: "Requests & Jobs",
//         href: "/dashboard/admin/jobs",
//         icon: ClipboardList,
//       },
//       {
//         label: "Reviews",
//         href: "/dashboard/admin/reviews",
//         icon: Star,
//       },
//       {
//         label: "Review-reports",
//         href: "/dashboard/admin/review-reports",
//         icon: StarCheck,
//       },
//       {
//         label: "Disputes",
//         href: "/dashboard/admin/disputes",
//         icon: ShieldAlert,
//       },
//       {
//         label: "Supports",
//         href: "/dashboard/admin/support",
//         icon: Headphones,
//       },
//       {
//         label: "Withdrawals",
//         href: "/dashboard/admin/withdrawals",
//         icon: WalletCards,
//       },
//       {
//         label: "Refunds",
//         href: "/dashboard/admin/refunds",
//         icon: ReceiptTurkishLira,
//       },
//       {
//         label: "Profile",
//         href: "/dashboard/admin/profile",
//         icon: User,
//       },
//       { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
//       {
//         label: "Marketing",
//         href: "/dashboard/admin/marketing",
//         icon: Megaphone,
//       },
//       {
//         label: "Popups & Promotions",
//         href: "/dashboard/admin/popups",
//         icon: Sparkles,
//       },
//       {
//         label: "Discount Codes",
//         href: "/dashboard/admin/discount-codes",
//         icon: TicketPercent,
//       },
//     ],

//     {
//       label: "Admin Management",
//       href: "/dashboard/admin/management",
//       icon: Users,
//     },
//   ],
// };

// function getRoleLabel(role: UserRole) {
//   switch (role) {
//     case "customer":
//       return "Customer";
//     case "worker":
//       return "Service Provider";
//     case "admin":
//       return "Administrator";
//     case "super_admin":
//       return "Super Administrator";
//   }
// }

// function getDashboardRoot(role: UserRole) {
//   return `/dashboard/${role}`;
// }

// export function DashboardShell({
//   role,
//   firstName,
//   lastName,
//   avatarUrl,
//   platformLogoUrl,
//   platformName = "Emirate ErrandHub",
//   platformDescription = "Services made easier.",
//   children,
// }: DashboardShellProps) {
//   const pathname = usePathname();
//   const router = useRouter();

//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [loggingOut, setLoggingOut] = useState(false);

//   const items = navigation[role];
//   const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
//   const currentPage =
//     [...items]
//       .sort((a, b) => b.href.length - a.href.length)
//       .find(
//         (item) =>
//           pathname === item.href ||
//           (item.href !== getDashboardRoot(role) &&
//             pathname.startsWith(`${item.href}/`)),
//       )?.label ?? "Dashboard";

//   async function handleLogout() {
//     setLoggingOut(true);

//     try {
//       const response = await fetch("/api/auth/logout", {
//         method: "POST",
//       });

//       if (response.ok) {
//         router.push("/login");
//         router.refresh();
//         return;
//       }
//     } catch {
//       // Keep the existing page in place if the request fails.
//     }

//     setLoggingOut(false);
//   }

//   return (
//     <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
//       {mobileOpen && (
//         <button
//           type="button"
//           aria-label="Close navigation"
//           className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
//           onClick={() => setMobileOpen(false)}
//         />
//       )}

//       <aside
//         className={`fixed inset-y-0 left-0 z-50 flex w-70 flex-col border-r border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 transition-transform duration-200 lg:translate-x-0 lg:shadow-none ${
//           mobileOpen ? "translate-x-0" : "-translate-x-full"
//         }`}
//       >
//         <div className="flex h-19 shrink-0 items-center justify-between border-b border-slate-100 px-5">
//           <Link
//             href="/"
//             className="group flex min-w-0 items-center gap-3"
//             onClick={() => setMobileOpen(false)}
//           >
//             <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50">
//               {platformLogoUrl ? (
//                 <Image
//                   src={platformLogoUrl}
//                   alt="Emirate ErrandHub logo"
//                   width={40}
//                   height={40}
//                   unoptimized
//                   className="h-full w-full object-contain"
//                 />
//               ) : (
//                 <span className="flex h-full w-full items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-900/15 transition group-hover:bg-emerald-800">
//                   <BriefcaseBusiness className="h-5 w-5" />
//                 </span>
//               )}
//             </span>
//             <span className="min-w-0">
//               <span className="block truncate text-[15px] font-bold tracking-tight text-slate-900">
//                 {platformName}
//               </span>
//               <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
//                 {platformDescription}
//               </span>
//             </span>
//           </Link>

//           <button
//             type="button"
//             onClick={() => setMobileOpen(false)}
//             className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
//             aria-label="Close navigation"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         <div className="mx-4 mt-5 rounded-2xl border border-slate-100 bg-slate-50/90 p-3.5">
//           <div className="flex items-center gap-3">
//             <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-emerald-700 to-emerald-900 text-sm font-bold text-white ring-4 ring-white">
//               {(role === "admin" || role === "super_admin") && avatarUrl ? (
//                 <Image
//                   src={avatarUrl}
//                   alt={`${firstName} ${lastName}`}
//                   fill
//                   unoptimized
//                   sizes="44px"
//                   className="object-cover"
//                 />
//               ) : (
//                 initials || "U"
//               )}
//             </div>
//             <div className="min-w-0 flex-1">
//               <p className="truncate text-sm font-semibold text-slate-900">
//                 {firstName} {lastName}
//               </p>
//               <p className="mt-0.5 truncate text-xs text-slate-500">
//                 {getRoleLabel(role)}
//               </p>
//             </div>
//             <span
//               className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100"
//               title="Account"
//             />
//           </div>
//         </div>

//         <nav className="flex-1 overflow-y-auto px-4 pb-5 pt-6">
//           <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
//             Workspace
//           </p>

//           <div className="space-y-1">
//             {items.map((item) => {
//               const Icon = item.icon;
//               const active =
//                 pathname === item.href ||
//                 (item.href !== getDashboardRoot(role) &&
//                   pathname.startsWith(`${item.href}/`));

//               return (
//                 <Link
//                   key={item.href}
//                   href={item.href}
//                   onClick={() => setMobileOpen(false)}
//                   aria-current={active ? "page" : undefined}
//                   className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150 ${
//                     active
//                       ? "bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-900/3"
//                       : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
//                   }`}
//                 >
//                   {active && (
//                     <span className="absolute bottom-2.5 left-0 top-2.5 w-0.75 rounded-r-full bg-emerald-700" />
//                   )}
//                   <Icon
//                     className={`h-4.5 w-4.5 shrink-0 transition-colors ${
//                       active
//                         ? "text-emerald-700"
//                         : "text-slate-400 group-hover:text-slate-700"
//                     }`}
//                   />
//                   <span className="flex-1">{item.label}</span>
//                   {active && (
//                     <ChevronRight className="h-4 w-4 text-emerald-700/70" />
//                   )}
//                 </Link>
//               );
//             })}
//           </div>
//         </nav>
//       </aside>

//       <div className="lg:pl-70">
//         <DashboardNavbar
//           role={role}
//           currentPage={currentPage}
//           onMenuClick={() => setMobileOpen(true)}
//         >
//           <AccountDropdown
//             role={role}
//             firstName={firstName}
//             lastName={lastName}
//             avatarUrl={avatarUrl}
//           />
//         </DashboardNavbar>

//         <main className="min-h-[calc(100vh-72px)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
//           <div className="mx-auto w-full max-w-360">{children}</div>
//         </main>
//       </div>
//     </div>
//   );
// }
