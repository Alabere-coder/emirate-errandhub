"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  UserX,
} from "lucide-react";
import type { AdminUser } from "./page";

type Props = {
  users: AdminUser[];
};

const PAGE_SIZE = 10;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function roleLabel(role: string) {
  switch (role) {
    case "customer":
      return "Customer";
    case "worker":
      return "Service provider";
    case "admin":
      return "Administrator";
    case "super_admin":
      return "Super Administrator";
    default:
      return role;
  }
}

function initials(user: AdminUser) {
  return (
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    "?"
  );
}

export function UsersPageClient({ users }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const stats = useMemo(
    () => ({
      total: users.length,
      customers: users.filter((user) => user.role === "customer").length,
      workers: users.filter((user) => user.role === "worker").length,
      admins: users.filter((user) => user.role === "admin").length,
      inactive: users.filter((user) => !user.is_active).length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();

        const matchesSearch =
          !query ||
          fullName.includes(query) ||
          (user.email ?? "").toLowerCase().includes(query) ||
          (user.phone ?? "").toLowerCase().includes(query);

        const matchesRole = roleFilter === "all" || user.role === roleFilter;

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && user.is_active) ||
          (statusFilter === "inactive" && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const difference =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

        return sortOrder === "newest" ? -difference : difference;
      });
  }, [users, search, roleFilter, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  function resetPage() {
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Administration
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              User management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              View customers, service providers and administrators across
              Emirate ErrandHub.
            </p>
          </div>

          <Link
            href="/dashboard/admin"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Admin dashboard
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total users"
            value={stats.total}
            icon={<Users className="h-5 w-5" />}
            description="Registered profiles"
          />
          <StatCard
            title="Customers"
            value={stats.customers}
            icon={<CircleUserRound className="h-5 w-5" />}
            description="Customer accounts"
          />
          <StatCard
            title="Service providers"
            value={stats.workers}
            icon={<UserRound className="h-5 w-5" />}
            description="Worker accounts"
          />
          <StatCard
            title="Administrators"
            value={stats.admins}
            icon={<ShieldCheck className="h-5 w-5" />}
            description="Admin accounts"
          />
          <StatCard
            title="Inactive accounts"
            value={stats.inactive}
            icon={<UserX className="h-5 w-5" />}
            description="Currently deactivated"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  All users
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search profiles and filter accounts by role or status.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    resetPage();
                  }}
                  placeholder="Search name, email or phone..."
                  aria-label="Search users"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  resetPage();
                }}
                aria-label="Filter by role"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="all">All roles</option>
                <option value="customer">Customers</option>
                <option value="worker">Service providers</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  resetPage();
                }}
                aria-label="Filter by account status"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="all">All account statuses</option>
                <option value="active">Active accounts</option>
                <option value="inactive">Inactive accounts</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSortOrder((current) =>
                    current === "newest" ? "oldest" : "newest",
                  );
                  resetPage();
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowDownUp className="h-4 w-4" />
                {sortOrder === "newest" ? "Newest first" : "Oldest first"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setSortOrder("newest");
                  resetPage();
                }}
                className="h-10 rounded-xl px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Clear filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5 text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Account status</th>
                  <th className="px-6 py-4">Date joined</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                          {initials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="mt-1 max-w-xs truncate text-sm text-slate-500">
                            {user.email ?? "No email available"}
                          </p>
                          {user.phone && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {roleLabel(user.role)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {user.is_active ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <UserX className="h-3.5 w-3.5" />
                        )}
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-slate-400" />
                        {formatDate(user.created_at)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}

                {visibleUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Search className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-900">
                        No users found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try a different search term or clear your filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              {filteredUsers.length === 0
                ? "No matching users"
                : `Showing ${startIndex + 1}–${Math.min(
                    startIndex + PAGE_SIZE,
                    filteredUsers.length,
                  )} of ${filteredUsers.length} users`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((current) => Math.max(1, current - 1))
                }
                disabled={safePage <= 1}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="px-2 text-sm text-slate-500">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={safePage >= totalPages}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString("en-NG")}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}
