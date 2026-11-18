import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  ShieldX,
  Users,
  UserRound,
  AlertCircle,
  ClipboardCheck,
} from "lucide-react";

export default async function WorkerVerificationPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: workers, error } = await supabase
    .from("worker_profiles")
    .select(
      `
      id,
      user_id,
      verification_status,
      created_at,
      profiles!worker_profiles_user_id_fkey (
        first_name,
        last_name,
        phone
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load workers:", error);
  }

  const workerList = workers ?? [];

  const verifiedCount = workerList.filter(
    (worker) => worker.verification_status === "verified",
  ).length;

  const pendingCount = workerList.filter(
    (worker) => worker.verification_status === "pending",
  ).length;

  const rejectedCount = workerList.filter(
    (worker) => worker.verification_status === "rejected",
  ).length;

  const stats = [
    {
      label: "Total Workers",
      value: workerList.length,
      description: "Registered worker profiles",
      icon: Users,
      iconStyle:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      accent: "text-slate-900 dark:text-white",
    },
    {
      label: "Verified",
      value: verifiedCount,
      description: "Approved worker profiles",
      icon: CheckCircle2,
      iconStyle:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Pending Review",
      value: pendingCount,
      description: "Awaiting verification",
      icon: Clock3,
      iconStyle:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      description: "Not approved",
      icon: ShieldX,
      iconStyle: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
      accent: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-7 pb-8">
      {/* PAGE HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-5 -top-12 h-52 w-52 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Worker Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Worker Verification
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80">
              Review worker profiles, inspect submitted documents, and manage
              verification decisions to maintain a trusted service network.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-sm">
            <ClipboardCheck className="h-8 w-8 text-emerald-100" />
          </div>
        </div>

        <div className="relative z-10 mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-emerald-100/80">
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            {workerList.length} worker profiles
          </span>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {verifiedCount} verified
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {pendingCount} awaiting review
          </span>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-3 text-3xl font-bold tracking-tight ${stat.accent}`}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {stat.description}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* WORKER LIST */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                All Workers
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                {workerList.length}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select a worker to inspect their profile and submitted documents.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <CalendarDays className="h-4 w-4" />
            Newest applications first
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
              Unable to load workers
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Something went wrong while retrieving worker verification records.
              Please refresh the page and try again.
            </p>
          </div>
        ) : workerList.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Users className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              No workers found
            </h3>

            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              There are currently no worker profiles available for verification
              review. New worker applications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {workerList.map((worker) => {
              const profile = Array.isArray(worker.profiles)
                ? worker.profiles[0]
                : worker.profiles;

              const firstName = profile?.first_name ?? "";
              const lastName = profile?.last_name ?? "";

              const fullName =
                `${firstName} ${lastName}`.trim() || "Unnamed Worker";

              const status = worker.verification_status ?? "pending";

              const statusConfig =
                status === "verified"
                  ? {
                      label: "Verified",
                      icon: CheckCircle2,
                      style:
                        "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-400/20",
                    }
                  : status === "rejected"
                    ? {
                        label: "Rejected",
                        icon: ShieldX,
                        style:
                          "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-400/20",
                      }
                    : {
                        label: status.replaceAll("_", " "),
                        icon: Clock3,
                        style:
                          "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-400/20",
                      };

              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={worker.id}
                  className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-950 dark:to-teal-950 dark:text-emerald-400">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {fullName}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusConfig.style}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                        {profile?.phone || "No phone number provided"}
                      </p>

                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Applied{" "}
                        {new Intl.DateTimeFormat("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "Africa/Lagos",
                        }).format(new Date(worker.created_at))}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/admin/worker-verification/${worker.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                  >
                    Review Worker
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
