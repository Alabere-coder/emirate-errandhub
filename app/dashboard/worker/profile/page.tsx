import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { WorkerProfileForm } from "@/components/dashboard/worker/profile/worker-profile-form";

export default async function WorkerProfilePage() {
  const { user, profile, supabase } = await requireRole(["worker"]);

  const { data: workerProfile, error } = await supabase
    .from("worker_profiles")
    .select(
      `
      id,
      bio,
      years_of_experience,
      starting_price,
      currency,
      verification_status,
      is_available
    `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Worker profile page error:", error);
  }

  if (!workerProfile) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/worker"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl border bg-card">
          <div className="border-b bg-muted/20 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-background text-primary">
                <UserRound className="size-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  My Profile
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Manage the professional information customers see about you.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <CircleAlert className="size-7" />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                Worker profile not found
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your worker profile has not been created yet. Please contact an
                administrator.
              </p>

              <Link
                href="/dashboard/worker"
                className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                <ArrowLeft className="size-4" />
                Return to dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Service Provider";

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Link
        href="/dashboard/worker"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      {/* Profile header */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 size-40 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl border bg-background text-primary shadow-sm">
            <UserRound className="size-9" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BriefcaseBusiness className="size-3.5 text-primary" />
              Worker account
            </span>

            <h1 className="mt-3 wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">
              My Profile
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Manage your professional information and the details customers see
              when considering your services.
            </p>
          </div>
        </div>

        <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border bg-background/80 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Profile name
              </p>
              <p className="mt-1 truncate font-semibold">{fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border bg-background/80 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Verification
              </p>
              <p className="mt-1 font-semibold">Account verification status</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Managed by the administrator
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Profile form section */}
      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-card text-primary">
            <BadgeCheck className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Professional details
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Keep your experience, pricing, and availability up to date.
            </p>
          </div>
        </div>

        <WorkerProfileForm profile={workerProfile} />
      </section>
    </div>
  );
}
