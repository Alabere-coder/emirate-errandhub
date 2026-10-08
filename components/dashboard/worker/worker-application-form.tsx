"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  submitWorkerApplication,
  type WorkerApplicationState,
} from "@/lib/actions/worker-applications";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type WorkerApplication = {
  id: string;
  status: string;
  application_note: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
} | null;

type WorkerApplicationFormProps = {
  application: WorkerApplication;
};

const initialState: WorkerApplicationState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit Application"}
    </Button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function WorkerApplicationForm({
  application,
}: WorkerApplicationFormProps) {
  const [state, action] = useActionState(submitWorkerApplication, initialState);

  if (application?.status === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Under Review</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your worker application has been submitted and is currently being
            reviewed by the admin.
          </p>

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Submitted</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(application.created_at)}
            </p>
          </div>

          {application.application_note && (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Your application</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {application.application_note}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (application?.status === "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Approved</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your worker application has been approved. You can now continue
            setting up your worker profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isResubmission = application?.status === "rejected";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isResubmission ? "Resubmit Your Application" : "Become a Worker"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isResubmission && application.rejection_reason && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium">Application rejected</p>

            <p className="mt-1 text-sm text-muted-foreground">
              {application.rejection_reason}
            </p>
          </div>
        )}

        {state.error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}

        {state.success && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
            <p className="text-sm text-green-700 dark:text-green-400">
              {state.success}
            </p>
          </div>
        )}

        <form action={action} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="application_note">Tell us about yourself</Label>

            <Textarea
              id="application_note"
              name="application_note"
              required
              minLength={30}
              rows={8}
              defaultValue={
                isResubmission ? (application.application_note ?? "") : ""
              }
              placeholder="Tell us about your experience, skills, the services you provide, and why you would like to work with Emirate ErrandHub."
            />

            <p className="text-xs text-muted-foreground">
              Please provide at least 30 characters.
            </p>
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
