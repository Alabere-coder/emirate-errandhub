import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerDocumentActions } from "@/components/dashboard/admin/worker-verification/worker-document-actions";
import { DocumentPreview } from "@/components/dashboard/admin/worker-verification/document-preview";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkerVerificationDetailPage({
  params,
}: PageProps) {
  await requireRole(["admin"]);

  const { id: workerId } = await params;

  const supabase = await createClient();

  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select(
      `
      id,
      user_id,
      verification_status,
      bio,
      years_of_experience,
      starting_price,
      currency,
      profiles!worker_profiles_user_id_fkey (
        first_name,
        last_name,
        phone
      )
    `,
    )
    .eq("id", workerId)
    .maybeSingle();

  if (workerError) {
    throw new Error("Unable to load worker.");
  }

  if (!worker) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Worker Not Found</h1>

        <Link
          href="/dashboard/admin/worker-verification"
          className="text-sm underline"
        >
          Back to Worker Verification
        </Link>
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
        reviewed_by,
        reviewed_at,
        created_at
      `,
    )
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });

  if (documentsError) {
    throw new Error("Unable to load worker documents.");
  }

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (document) => {
      const { data } = await supabase.storage
        .from("worker-documents")
        .createSignedUrl(document.file_url, 60 * 10);

      return {
        ...document,
        signed_url: data?.signedUrl ?? null,
      };
    }),
  );

  const profile = Array.isArray(worker.profiles)
    ? worker.profiles[0]
    : worker.profiles;

  const workerName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Unnamed Worker";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <Link
          href="/dashboard/admin/worker-verification"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to Worker Verification
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold">{workerName}</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Review this worker's documents and verification status.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Worker Information</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Name</span>

              <p className="font-medium">{workerName}</p>
            </div>

            {profile?.phone && (
              <div>
                <span className="text-muted-foreground">Phone</span>

                <p className="font-medium">{profile.phone}</p>
              </div>
            )}

            <div>
              <span className="text-muted-foreground">Experience</span>

              <p className="font-medium">{worker.years_of_experience} years</p>
            </div>

            <div>
              <span className="text-muted-foreground">Verification</span>

              <p className="font-medium capitalize">
                {worker.verification_status.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="font-semibold">Worker Bio</h2>

          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {worker.bio || "No bio provided."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">Submitted Documents</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review each document individually.
          </p>
        </div>

        {documentsWithUrls.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            This worker has not submitted any documents yet.
          </div>
        ) : (
          <div className="divide-y">
            {documentsWithUrls.map((document) => (
              <div key={document.id} className="space-y-4 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium capitalize">
                      {document.document_type}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted{" "}
                      {new Date(document.created_at).toLocaleDateString(
                        "en-NG",
                      )}
                    </p>
                  </div>

                  <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize">
                    {document.status}
                  </span>
                </div>

                {document.signed_url && (
                  <>
                    {/\.(jpg|jpeg|png|webp)$/i.test(document.file_url) ? (
                      <DocumentPreview
                        url={document.signed_url}
                        documentType={document.document_type}
                      />
                    ) : /\.pdf$/i.test(document.file_url) ? (
                      <div className="overflow-hidden rounded-xl border">
                        <iframe
                          src={document.signed_url}
                          title={`${document.document_type} document`}
                          className="h-175 w-full"
                        />
                      </div>
                    ) : (
                      <a
                        href={document.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        Open Document
                      </a>
                    )}
                  </>
                )}

                {document.rejection_reason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    Rejection reason: {document.rejection_reason}
                  </div>
                )}

                {document.status === "pending" && (
                  <WorkerDocumentActions
                    documentId={document.id}
                    workerId={worker.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
