"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";

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
      <Card>
        <CardHeader>
          <CardTitle>Decision recorded</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            This dispute is in a final state. The decision cannot be changed
            using this form.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrator decision</CardTitle>
        <p className="text-sm text-slate-500">
          Record the review status or a final decision. A written note is
          required for every action.
        </p>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="dispute_id" value={disputeId} />

          <div className="space-y-2">
            <label
              htmlFor="decision"
              className="text-sm font-medium text-slate-700"
            >
              Decision
            </label>
            <select
              id="decision"
              name="decision"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
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
              className="text-sm font-medium text-slate-700"
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
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
            <p className="text-xs text-slate-500">
              Enter between 10 and 3,000 characters. Be specific and
              professional.
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
              <span>{state.success}</span>
            </div>
          )}

          <Button type="submit" disabled={pending}>
            {pending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? "Saving decision..." : "Save decision"}
          </Button>

          <p className="text-xs leading-5 text-slate-500">
            This action does not issue refunds, release earnings, or change the
            related job status.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
