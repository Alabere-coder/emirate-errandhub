import { ArrowLeft, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerApplicationForm } from "@/components/dashboard/worker/worker-application-form";

export default async function WorkerApplicationPage() {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("worker_applications")
    .select(
      `
        id,
        status,
        application_note,
        rejection_reason,
        reviewed_at,
        created_at
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Load worker application error:", error);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/dashboard/worker"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <div className="relative flex flex-col gap-6 p-5 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-14">
              <BriefcaseBusiness className="size-6 sm:size-7" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Worker onboarding
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Worker application
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Apply to become a service provider on Emirate ErrandHub and take
                the next step toward offering your services to customers.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-muted/30 p-4 md:max-w-52">
            <ShieldCheck className="size-5 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-semibold">Application review</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your application will be reviewed by the admin team.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl">
        <WorkerApplicationForm application={application} />
      </div>
    </div>
  );
}
