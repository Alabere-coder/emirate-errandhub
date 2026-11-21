"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";

import { createDispute, type DisputeActionState } from "../actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: DisputeActionState = {};

type DisputeFormProps = {
  jobId: string;
  backHref: string;
};

export default function DisputeForm({ jobId, backHref }: DisputeFormProps) {
  const [state, formAction, pending] = useActionState(
    createDispute,
    initialState,
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border bg-muted/30 px-5 py-5 sm:px-6">
        <CardTitle className="text-xl font-bold text-foreground">
          Describe the dispute
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Explain what happened and what you would like the administrator to
          review. Please keep your description factual and specific.
        </p>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="job_id" value={jobId} />

          {/* Reason */}
          <div className="space-y-2">
            <label
              htmlFor="reason"
              className="text-sm font-semibold text-foreground"
            >
              Reason
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="reason"
              name="reason"
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g. Incomplete service"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/15"
            />
            <p className="text-xs text-muted-foreground">
              Briefly summarise the issue in 3–120 characters.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-foreground"
            >
              What happened?
              <span className="ml-1 text-red-500">*</span>
            </label>

            <textarea
              id="description"
              name="description"
              required
              minLength={20}
              maxLength={3000}
              rows={7}
              placeholder="Describe the issue, relevant dates, and any steps already taken to resolve it..."
              className="w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-sm leading-6 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/15"
            />

            <p className="text-xs leading-5 text-muted-foreground">
              Include at least 20 characters. Do not include passwords or other
              sensitive account credentials.
            </p>
          </div>

          {/* Evidence */}
          <div className="space-y-2">
            <label
              htmlFor="evidence"
              className="text-sm font-semibold text-foreground"
            >
              Evidence images
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Optional)
              </span>
            </label>

            <input
              id="evidence"
              name="evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="block w-full cursor-pointer rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground shadow-sm transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
            />

            <p className="text-xs leading-5 text-muted-foreground">
              Attach up to 3 JPEG, PNG, or WebP images. Each image must be 5 MB
              or smaller. Avoid uploading passwords or other sensitive
              information.
            </p>
          </div>

          {/* Error feedback */}
          {state.error && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-6">{state.error}</span>
            </div>
          )}

          {/* Success feedback */}
          {state.success && (
            <div
              role="status"
              className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

              <div className="min-w-0">
                <p className="font-medium">{state.success}</p>

                {state.disputeId && (
                  <p className="mt-1 break-all text-xs opacity-80">
                    Reference: {state.disputeId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Link
              href={backHref}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
            >
              Cancel
            </Link>

            <Button
              type="submit"
              disabled={pending}
              className="h-10 rounded-xl bg-emerald-700 px-5 text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {pending && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {pending ? "Submitting..." : "Submit dispute"}
            </Button>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Submitting a dispute does not automatically refund a payment,
            release worker earnings, or change the job status.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
