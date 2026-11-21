"use client";

import { useActionState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";

import { updateDisputeStatus } from "../actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DisputeActionResult = {
  success?: string;
  error?: string;
};

const initialState: DisputeActionResult = {};

type DisputeDecisionFormProps = {
  disputeId: string;
  currentStatus: string;
};

export default function DisputeDecisionForm({
  disputeId,
  currentStatus,
}: DisputeDecisionFormProps) {
  const [state, formAction, pending] = useActionState(
    updateDisputeStatus,
    initialState,
  );

  const isFinal = ["resolved", "rejected", "closed"].includes(currentStatus);

  if (isFinal) {
    return (
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <LockKeyhole className="size-5" />
            </div>

            <div>
              <CardTitle className="text-base">Decision recorded</CardTitle>

              <p className="mt-1 text-xs text-muted-foreground">
                This dispute has reached a final status.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />

            <p className="text-sm leading-6 text-foreground/80">
              This dispute is in a final state. The decision cannot be changed
              using this form.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <CardTitle className="text-base">Administrator decision</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Record the review status or a final decision.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 md:p-6">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="dispute_id" value={disputeId} />

          <div className="space-y-2">
            <label
              htmlFor="decision"
              className="text-sm font-medium text-foreground"
            >
              Decision
            </label>

            <select
              id="decision"
              name="decision"
              required
              defaultValue=""
              className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            >
              <option value="" disabled>
                Choose an action
              </option>

              <option value="under_review">Mark as under review</option>
              <option value="resolved">Resolve dispute</option>
              <option value="rejected">Reject dispute</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="resolution"
              className="text-sm font-medium text-foreground"
            >
              Decision note
            </label>

            <textarea
              id="resolution"
              name="resolution"
              required
              minLength={10}
              maxLength={3000}
              rows={5}
              placeholder="Explain the review status or the reasons for your decision..."
              className="w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />

            <p className="text-xs leading-5 text-muted-foreground">
              Enter between 10 and 3,000 characters. Be specific and
              professional.
            </p>
          </div>

          {state.error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />

              <span className="leading-6">{state.error}</span>
            </div>
          )}

          {state.success && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

              <span className="leading-6">{state.success}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              This action does not issue refunds, release earnings, or change
              the related job status.
            </p>

            <Button type="submit" disabled={pending} className="shrink-0">
              {pending ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Saving decision...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 size-4" />
                  Save decision
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
