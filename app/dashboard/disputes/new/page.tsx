import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import DisputeForm from "./dispute-form";

import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  searchParams: Promise<{ jobId?: string }>;
};

function isValidUuid(value: string | undefined): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export default async function NewDisputePage({ searchParams }: PageProps) {
  const { user, supabase } = await requireRole(["customer", "worker"]);
  const { jobId } = await searchParams;

  if (!isValidUuid(jobId)) {
    notFound();
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, request_id, customer_id, worker_id, status")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !job) {
    notFound();
  }

  let isParticipant = job.customer_id === user.id;
  let role: "customer" | "worker" = "customer";

  if (!isParticipant) {
    const { data: workerProfile } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    isParticipant = !!workerProfile && workerProfile.id === job.worker_id;

    if (isParticipant) {
      role = "worker";
    }
  }

  if (!isParticipant) {
    notFound();
  }

  const backHref =
    role === "customer"
      ? `/dashboard/customer/requests/${job.request_id}`
      : `/dashboard/worker/jobs/my/${job.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Navigation */}
      <Link
        href={backHref}
        className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to job
      </Link>

      {/* Page heading */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-teal-300/15 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-amber-200 shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">
              Support & Resolution Centre
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Open a dispute
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/80">
              Submit an issue for an administrator to review. Provide enough
              detail to help us understand what happened.
            </p>

            <div className="mt-5 border-t border-white/15 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100/70">
                Job reference
              </p>
              <p className="mt-1 break-all font-mono text-xs text-emerald-50/90">
                {job.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important information */}
      <Card className="overflow-hidden rounded-2xl border-amber-200 bg-amber-50/70 shadow-none dark:border-amber-900 dark:bg-amber-950/30">
        <CardContent className="flex gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-200">
              Before submitting your dispute
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-200/80">
              Please submit accurate information. Your dispute will be reviewed
              separately from any payment or earnings decision.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dispute form */}
      <DisputeForm jobId={job.id} backHref={backHref} />
    </div>
  );
}
