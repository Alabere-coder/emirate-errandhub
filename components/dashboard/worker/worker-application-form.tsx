"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";

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
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full gap-2 sm:w-auto"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Submitting application...
        </>
      ) : (
        <>
          Submit application
          <Send className="size-4" />
        </>
      )}
    </Button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ApplicationStatusCard({
  title,
  description,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Clock3;
  tone: "pending" | "approved";
  children?: React.ReactNode;
}) {
  const styles =
    tone === "approved"
      ? {
          icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
          border: "border-emerald-200 dark:border-emerald-900",
          banner: "bg-emerald-50 dark:bg-emerald-950/30",
        }
      : {
          icon: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
          border: "border-amber-200 dark:border-amber-900",
          banner: "bg-amber-50 dark:bg-amber-950/30",
        };

  return (
    <Card className={`overflow-hidden rounded-2xl shadow-sm ${styles.border}`}>
      <div
        className={`h-1 ${tone === "approved" ? "bg-emerald-500" : "bg-amber-500"}`}
      />

      <CardContent className="p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}
          >
            <Icon className="size-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {children && <div className="mt-6 space-y-4">{children}</div>}
      </CardContent>
    </Card>
  );
}

export function WorkerApplicationForm({
  application,
}: WorkerApplicationFormProps) {
  const [state, action] = useActionState(submitWorkerApplication, initialState);

  if (application?.status === "pending") {
    return (
      <ApplicationStatusCard
        title="Application under review"
        description="Your application has been submitted successfully. Our admin team is reviewing your details, and your application status will be updated once a decision is made."
        icon={Clock3}
        tone="pending"
      >
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Application submitted</p>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(application.created_at)}
          </p>
        </div>

        {application.application_note && (
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium">Your application statement</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {application.application_note}
            </p>
          </div>
        )}

        <div
          className={`flex items-start gap-3 rounded-xl p-4 ${"bg-muted/40"}`}
        >
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p className="text-sm leading-6 text-muted-foreground">
            You can check back here to see your application status.
          </p>
        </div>
      </ApplicationStatusCard>
    );
  }

  if (application?.status === "approved") {
    return (
      <ApplicationStatusCard
        title="Application approved"
        description="Congratulations! Your worker application has been approved. You can now continue setting up your worker profile."
        icon={CheckCircle2}
        tone="approved"
      >
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Your application has been approved.
          </p>
        </div>
      </ApplicationStatusCard>
    );
  }

  const isResubmission = application?.status === "rejected";

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <div className="h-1 bg-primary" />

      <CardHeader className="border-b bg-muted/20 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BriefcaseBusiness className="size-6" />
          </div>

          <div className="min-w-0">
            <CardTitle className="text-xl tracking-tight sm:text-2xl">
              {isResubmission ? "Resubmit your application" : "Become a worker"}
            </CardTitle>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isResubmission
                ? "Review the feedback below and update your application before submitting it again."
                : "Introduce yourself, share your experience, and tell us how you can help customers through Emirate ErrandHub."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Application review</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your details will be reviewed by the admin team.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border bg-background p-3">
            <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Your experience matters</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Explain your skills and the services you offer.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-7">
        {isResubmission && application.rejection_reason && (
          <div className="mb-6 rounded-xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

              <div className="min-w-0">
                <p className="text-sm font-semibold">Application feedback</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {application.rejection_reason}
                </p>

                {application.reviewed_at && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Reviewed on {formatDate(application.reviewed_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {state.error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4"
          >
            <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm leading-6 text-destructive">{state.error}</p>
          </div>
        )}

        {state.success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm leading-6 text-emerald-700 dark:text-emerald-400">
              {state.success}
            </p>
          </div>
        )}

        <form action={action} className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="application_note"
                className="text-sm font-semibold"
              >
                Tell us about yourself
              </Label>

              <span className="text-xs text-muted-foreground">Required</span>
            </div>

            <Textarea
              id="application_note"
              name="application_note"
              required
              minLength={30}
              rows={8}
              defaultValue={
                isResubmission ? (application.application_note ?? "") : ""
              }
              placeholder="Describe your experience, skills, services you provide, and why you would like to work with Emirate ErrandHub."
              className="min-h-48 resize-y rounded-xl leading-6"
            />

            <div className="flex items-start justify-between gap-3">
              <p className="text-xs leading-5 text-muted-foreground">
                A clear, detailed introduction helps the admin team understand
                your experience and suitability.
              </p>

              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                Min. 30 characters
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">Before you submit</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Make sure your application accurately describes your skills
                  and the services you can provide.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              {isResubmission
                ? "Your updated application will be submitted for review."
                : "By submitting, you are requesting to join as a worker."}
            </p>

            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
