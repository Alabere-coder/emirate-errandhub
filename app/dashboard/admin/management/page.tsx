import {
  ShieldCheck,
  ShieldPlus,
  Users,
  UserPlus,
  LockKeyhole,
  Phone,
  CalendarDays,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateAdminForm } from "./create-admin-form";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAdminDialog } from "./create-admin-dialog";

export const dynamic = "force-dynamic";

type AdminProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function getInitials(firstName: string | null, lastName: string | null) {
  const first = firstName?.trim().charAt(0) ?? "";
  const last = lastName?.trim().charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "AD";
}

function getFullName(admin: AdminProfile) {
  const name = `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim();
  return name || "Unnamed administrator";
}

export default async function AdminManagementPage() {
  await requireRole(["super_admin"]);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, role, is_active, created_at")
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load administrator accounts:", error);
    throw new Error("Unable to load administrator accounts.");
  }

  const admins = (data ?? []) as AdminProfile[];

  const activeAdmins = admins.filter((admin) => admin.is_active).length;
  const inactiveAdmins = admins.length - activeAdmins;
  const superAdmins = admins.filter(
    (admin) => admin.role === "super_admin",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <ShieldCheck className="size-6" />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Platform administration
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Admin Management
            </h1>

            <p className="mt-3 text-sm leading-6 text-emerald-50/80 sm:text-base">
              Manage administrator accounts and access for Emirate ErrandHub.
              Review existing administrators or create new accounts.
            </p>
          </div>

          <div className="hidden shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/10 p-5 sm:flex">
            <Users className="size-16 text-emerald-100" strokeWidth={1.2} />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total administrators"
          value={admins.length}
          icon={Users}
          description="All administrator accounts"
        />
        <StatCard
          label="Active accounts"
          value={activeAdmins}
          icon={ShieldCheck}
          description="Currently enabled accounts"
        />
        <StatCard
          label="Inactive accounts"
          value={inactiveAdmins}
          icon={LockKeyhole}
          description="Currently disabled accounts"
        />
        <StatCard
          label="Super administrators"
          value={superAdmins}
          icon={ShieldPlus}
          description="Highest-level administrators"
        />
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Administrator Accounts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new administrator account or review the existing
            administrators listed below.
          </p>
        </div>

        <CreateAdminDialog />
      </section>

      {/* Existing administrators */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="size-5" />
              </div>

              <h2 className="text-lg font-semibold tracking-tight">
                Existing Administrators
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              All administrator and super administrator accounts registered on
              the platform.
            </p>
          </div>

          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            {admins.length} {admins.length === 1 ? "account" : "accounts"}
          </Badge>
        </div>

        {admins.length === 0 ? (
          <Card className="rounded-2xl border-dashed shadow-none">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
                <Users className="size-7 text-muted-foreground" />
              </div>

              <h3 className="font-semibold">No administrators found</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Administrator accounts will appear here after they have been
                created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {admins.map((admin) => {
              const fullName = getFullName(admin);
              const isSuperAdmin = admin.role === "super_admin";

              return (
                <Card
                  key={admin.id}
                  className="overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {getInitials(admin.first_name, admin.last_name)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{fullName}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {admin.phone || "No phone number provided"}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={admin.is_active ? "default" : "secondary"}
                        className={
                          admin.is_active
                            ? "shrink-0 bg-emerald-600 hover:bg-emerald-600"
                            : "shrink-0"
                        }
                      >
                        {admin.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isSuperAdmin
                            ? "border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-400"
                            : "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400"
                        }
                      >
                        {isSuperAdmin ? (
                          <ShieldCheck className="mr-1 size-3" />
                        ) : (
                          <UserRound className="mr-1 size-3" />
                        )}
                        {isSuperAdmin ? "Super Admin" : "Administrator"}
                      </Badge>
                    </div>

                    <div className="mt-5 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      <span>Added {formatDate(admin.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ShieldPlus className="size-5" />
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            Protect administrator accounts
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Ensure administrator credentials are shared securely and that each
            account belongs to an authorized person.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Icon className="size-4" />
          </div>
        </div>

        <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
