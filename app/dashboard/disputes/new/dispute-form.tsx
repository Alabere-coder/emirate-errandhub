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
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Describe the dispute</CardTitle>
        <p className="text-sm text-slate-500">
          Explain what happened and what you would like the administrator to
          review. Please keep your description factual and specific.
        </p>
      </CardHeader>

      <CardContent>
        <form
          action={formAction}
          encType="multipart/form-data"
          className="space-y-5"
        >
          <input type="hidden" name="job_id" value={jobId} />

          <div className="space-y-2">
            <label
              htmlFor="reason"
              className="text-sm font-medium text-slate-700"
            >
              Reason
            </label>
            <input
              id="reason"
              name="reason"
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g. Incomplete service"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-slate-700"
            >
              What happened?
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={20}
              maxLength={3000}
              rows={7}
              placeholder="Describe the issue, relevant dates, and any steps already taken to resolve it..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
            <p className="text-xs text-slate-500">
              Include at least 20 characters. Do not include passwords or other
              sensitive account credentials.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="evidence"
              className="text-sm font-medium text-slate-700"
            >
              Evidence images (optional)
            </label>

            <input
              id="evidence"
              name="evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />

            <p className="text-xs leading-5 text-slate-500">
              Attach up to 3 JPEG, PNG, or WebP images. Each image must be 5 MB
              or smaller. Avoid uploading passwords or other sensitive
              information.
            </p>
          </div>

          {state.error && (
            <div
              role="alert"
              className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {state.success && (
            <div
              role="status"
              className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p>{state.success}</p>
                {state.disputeId && (
                  <p className="mt-1 break-all text-xs">
                    Reference: {state.disputeId}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline">
              <Link href={backHref}>Cancel</Link>
            </Button>

            <Button type="submit" disabled={pending}>
              {pending && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {pending ? "Submitting..." : "Submit dispute"}
            </Button>
          </div>

          <p className="text-xs leading-5 text-slate-500">
            Submitting a dispute does not automatically refund a payment,
            release worker earnings, or change the job status.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
