"use client";

import { useActionState } from "react";
import { ClipboardCheck, CheckCircle2, AlertTriangle } from "lucide-react";

import { reviewRefund, type RefundReviewState } from "./actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const initialState: RefundReviewState = {};

type RefundReviewFormProps = {
  refundId: string;
  status: string;
};

export function RefundReviewForm({ refundId, status }: RefundReviewFormProps) {
  const [state, formAction, isPending] = useActionState(
    reviewRefund,
    initialState,
  );

  const canReview = ["requested", "under_review"].includes(status);

  if (!canReview) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-muted-foreground" />
            <CardTitle>Review completed</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This refund is currently marked as{" "}
            <span className="font-medium text-foreground">
              {status.replaceAll("_", " ")}
            </span>
            . No further review decisions are available here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
          <CardTitle>Review refund request</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="refundId" value={refundId} />

          <div className="space-y-2">
            <label
              htmlFor="adminNote"
              className="text-sm font-medium text-foreground"
            >
              Admin note
            </label>

            <Textarea
              id="adminNote"
              name="adminNote"
              placeholder="Add your review notes or reason for rejection..."
              rows={4}
              maxLength={2000}
              disabled={isPending}
              className="resize-y"
            />

            <p className="text-xs text-muted-foreground">
              A note of at least 5 characters is required when rejecting.
            </p>
          </div>

          {state.error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          {state.success && (
            <div
              role="status"
              className="flex gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="size-4 shrink-0" />
              {state.success}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {status === "requested" && (
              <Button
                type="submit"
                name="decision"
                value="under_review"
                variant="outline"
                disabled={isPending}
              >
                {isPending ? "Updating..." : "Mark under review"}
              </Button>
            )}

            <Button
              type="submit"
              name="decision"
              value="approved"
              disabled={isPending}
            >
              {isPending ? "Updating..." : "Approve refund"}
            </Button>

            <Button
              type="submit"
              name="decision"
              value="rejected"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? "Updating..." : "Reject refund"}
            </Button>
          </div>

          <div className="flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />
            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
              Approval does not transfer money. Paystack refund processing will
              be handled separately.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
