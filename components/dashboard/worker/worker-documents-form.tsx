"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Uploading..." : "Upload Document"}
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
      return "border-green-500/30 bg-green-500/10 text-green-700";

    case "rejected":
      return "border-destructive/30 bg-destructive/10 text-destructive";

    default:
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-700";
  }
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
      <form
        action={formAction}
        // encType="multipart/form-data"
        className="space-y-6 rounded-xl border bg-card p-6"
      >
        <input type="hidden" name="worker_id" value={workerId} />

        <div>
          <h2 className="text-lg font-semibold">Upload Document</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Accepted formats: PDF, JPG, PNG, and WebP. Maximum size: 10MB.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Document Type</span>

            <select
              name="document_type"
              required
              defaultValue=""
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Document</span>

            <input
              type="file"
              name="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        {state.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700">
            {state.success}
          </div>
        )}

        <SubmitButton />
      </form>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">Submitted Documents</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Documents you have submitted for verification.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            You have not submitted any documents yet.
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {formatDocumentType(document.document_type)}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted{" "}
                    {new Date(document.created_at).toLocaleDateString("en-NG")}
                  </p>

                  {document.status === "rejected" &&
                    document.rejection_reason && (
                      <p className="mt-2 text-sm text-destructive">
                        Reason: {document.rejection_reason}
                      </p>
                    )}
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusClasses(
                    document.status,
                  )}`}
                >
                  {document.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
