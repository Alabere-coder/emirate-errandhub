"use client";

import { useActionState } from "react";
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
          <CardTitle>Review completed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This refund is currently marked as {status.replaceAll("_", " ")}. No
            further review decisions are available here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review refund request</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="refundId" value={refundId} />

          <div className="space-y-2">
            <label htmlFor="adminNote" className="text-sm font-medium">
              Admin note
            </label>
            <Textarea
              id="adminNote"
              name="adminNote"
              placeholder="Add your review notes or reason for rejection..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              A note of at least 5 characters is required when rejecting.
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {state.success && (
            <p className="text-sm text-green-600">{state.success}</p>
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

          <p className="text-xs text-muted-foreground">
            Approval does not transfer money. Paystack refund processing will be
            handled separately.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
