import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerDocumentsForm } from "@/components/dashboard/worker/worker-documents-form";

export default async function WorkerDocumentsPage() {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id, verification_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError) {
    throw new Error("Unable to load your worker profile.");
  }

  if (!workerProfile) {
    return (
      <div className="rounded-xl border border-dashed p-6">
        <h1 className="text-xl font-semibold">Documents & Verification</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your worker profile has not been created yet. Your application must be
          approved first.
        </p>
      </div>
    );
  }

  const { data: documents, error: documentsError } = await supabase
    .from("worker_documents")
    .select(
      `
      id,
      document_type,
      file_url,
      status,
      rejection_reason,
      reviewed_at,
      created_at
    `,
    )
    .eq("worker_id", workerProfile.id)
    .order("created_at", { ascending: false });

  if (documentsError) {
    throw new Error("Unable to load your documents.");
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Documents & Verification
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Upload the documents required to verify your worker account.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Verification Status</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Your documents will be reviewed by an administrator.
            </p>
          </div>

          <span className="rounded-full border px-3 py-1 text-sm font-medium capitalize">
            {workerProfile.verification_status.replace("_", " ")}
          </span>
        </div>
      </div>

      <WorkerDocumentsForm
        workerId={workerProfile.id}
        documents={documents ?? []}
      />
    </div>
  );
}
