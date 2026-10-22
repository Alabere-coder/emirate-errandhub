import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth/require-role";
import DisputeForm from "./dispute-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" className="-ml-3 mb-3">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to job
          </Link>
        </Button>

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Open a dispute
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Job reference: {job.id}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Submit an issue for an administrator to review. Provide enough
              detail to help us understand what happened.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/60 shadow-none">
        <CardContent className="flex gap-3 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-sm leading-6 text-amber-900">
            Please submit accurate information. Your dispute will be reviewed
            separately from any payment or earnings decision.
          </p>
        </CardContent>
      </Card>

      <DisputeForm jobId={job.id} backHref={backHref} />
    </div>
  );
}
