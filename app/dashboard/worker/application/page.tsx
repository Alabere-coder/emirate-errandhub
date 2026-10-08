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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Worker Application
        </h1>

        <p className="mt-1 text-muted-foreground">
          Apply to become a service provider on Emirate ErrandHub.
        </p>
      </div>

      <WorkerApplicationForm application={application} />
    </div>
  );
}
