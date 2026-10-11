"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  FileUp,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

import {
  uploadWorkerDocument,
  type WorkerDocumentActionState,
} from "@/lib/actions/worker-documents";

type Document = {
  id: string;
  document_type: string;
  file_url: string;
  status: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type WorkerDocumentsFormProps = {
  workerId: string;
  documents: Document[];
};

const initialState: WorkerDocumentActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Uploading document...
        </>
      ) : (
        <>
          <Upload className="size-4" />
          Upload document
        </>
      )}
    </button>
  );
}

function formatDocumentType(type: string) {
  switch (type) {
    case "identity":
      return "Identity Document";
    case "certificate":
      return "Certificate";
    case "license":
      return "License";
    default:
      return "Other Document";
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "approved":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "rejected":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") {
    return <CheckCircle2 className="size-4" />;
  }

  if (status === "rejected") {
    return <XCircle className="size-4" />;
  }

  return <Clock3 className="size-4" />;
}

export function WorkerDocumentsForm({
  workerId,
  documents,
}: WorkerDocumentsFormProps) {
  const [state, formAction] = useActionState(
    uploadWorkerDocument,
    initialState,
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/20 px-5 py-6 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                Upload verification document
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Submit your identity document, professional certificate, or
                license for review by the Emirate ErrandHub admin team.
              </p>
            </div>
          </div>
        </div>

        <form action={formAction} className="space-y-6 p-5 sm:p-7">
          <input type="hidden" name="worker_id" value={workerId} />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Document type</span>

              <select
                name="document_type"
                required
                defaultValue=""
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <option value="" disabled>
                  Select document type
                </option>
                <option value="identity">Identity Document</option>
                <option value="certificate">Certificate</option>
                <option value="license">License</option>
                <option value="license">Passport</option>
                <option value="other">Other</option>
              </select>

              <span className="block text-xs leading-5 text-muted-foreground">
                Choose the type that best describes your document.
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">Choose a file</span>

              <span className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-input bg-background px-3 py-2 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <FileUp className="size-5 shrink-0 text-primary" />
                <input
                  type="file"
                  name="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="min-w-0 flex-1 text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
                />
              </span>

              <span className="block text-xs leading-5 text-muted-foreground">
                PDF, JPG, PNG, or WebP. Maximum file size: 10 MB.
              </span>
            </label>
          </div>

          <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Document security</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Upload a clear, readable document so the review team can verify
                the information.
              </p>
            </div>
          </div>

          {state.error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <p className="leading-6">{state.error}</p>
            </div>
          )}

          {state.success && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p className="leading-6">{state.success}</p>
            </div>
          )}

          <div className="flex justify-end border-t pt-5">
            <SubmitButton />
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-muted/20 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheck2 className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Submitted documents
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Review the documents you have submitted for verification.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-medium">
            <FileText className="size-4 text-primary" />
            {documents.length}{" "}
            {documents.length === 1 ? "document" : "documents"}
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="size-6" />
            </div>

            <h3 className="mt-4 font-semibold">No documents submitted yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Your uploaded documents will appear here, along with their
              verification status.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((document) => (
              <article
                key={document.id}
                className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-start sm:justify-between sm:px-7"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background text-primary">
                    <FileText className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold leading-5">
                      {formatDocumentType(document.document_type)}
                    </h3>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Submitted{" "}
                      {new Date(document.created_at).toLocaleDateString(
                        "en-NG",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>

                    {document.status === "rejected" &&
                      document.rejection_reason && (
                        <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                          <p className="text-xs font-semibold text-destructive">
                            Reason for rejection
                          </p>
                          <p className="mt-1 text-sm leading-5 text-destructive">
                            {document.rejection_reason}
                          </p>
                        </div>
                      )}

                    {document.reviewed_at && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Reviewed{" "}
                        {new Date(document.reviewed_at).toLocaleDateString(
                          "en-NG",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusClasses(
                      document.status,
                    )}`}
                  >
                    <StatusIcon status={document.status} />
                    {document.status}
                  </span>

                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    View document
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
