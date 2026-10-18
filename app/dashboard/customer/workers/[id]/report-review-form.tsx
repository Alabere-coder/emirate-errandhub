"use client";

import { useActionState } from "react";
import { Flag } from "lucide-react";

import { submitReviewReport } from "@/lib/actions/review-reports";

type ReportReviewFormProps = {
  reviewId: string;
};

const initialState = {
  success: false,
  message: "",
};

export default function ReportReviewForm({ reviewId }: ReportReviewFormProps) {
  const [state, formAction, pending] = useActionState(
    submitReviewReport,
    initialState,
  );

  return (
    <details className="mt-3 rounded-lg border border-border p-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <Flag className="size-4" />
        Report review
      </summary>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="review_id" value={reviewId} />

        <div className="space-y-2">
          <label
            htmlFor={`report-reason-${reviewId}`}
            className="text-sm font-medium"
          >
            Why are you reporting this review?
          </label>

          <select
            id={`report-reason-${reviewId}`}
            name="reason"
            required
            defaultValue=""
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select a reason
            </option>
            <option value="abusive">Abusive or offensive</option>
            <option value="fraudulent">False or fraudulent</option>
            <option value="spam">Spam</option>
            <option value="irrelevant">Irrelevant to the service</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`report-details-${reviewId}`}
            className="text-sm font-medium"
          >
            Additional details (optional)
          </label>

          <textarea
            id={`report-details-${reviewId}`}
            name="details"
            rows={3}
            maxLength={1000}
            placeholder="Explain why you believe this review should be checked."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {state.message && (
          <p
            role="status"
            aria-live="polite"
            className={`text-sm ${
              state.success ? "text-green-600" : "text-destructive"
            }`}
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || state.success}
          className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </details>
  );
}
