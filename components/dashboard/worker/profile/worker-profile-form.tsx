"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Coins,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  updateWorkerProfile,
  type WorkerProfileActionState,
} from "@/lib/actions/worker-profile";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type WorkerProfileFormProps = {
  profile: {
    bio: string | null;
    years_of_experience: number | null;
    starting_price: number | null;
    currency: string;
    is_available: boolean;
    verification_status: string;
  };
};

const initialState: WorkerProfileActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full gap-2 rounded-xl px-6 sm:w-auto"
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Saving changes...
        </>
      ) : (
        <>
          <Save className="size-4" />
          Save changes
        </>
      )}
    </Button>
  );
}

function FeedbackMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
        error
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
      }`}
    >
      {error ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      )}
      <p className="leading-5">{error || success}</p>
    </div>
  );
}

const verificationStyles: Record<string, string> = {
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "border-destructive/20 bg-destructive/5 text-destructive",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  under_review:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
};

export function WorkerProfileForm({ profile }: WorkerProfileFormProps) {
  const [state, formAction] = useActionState(updateWorkerProfile, initialState);

  const verificationStatus = profile.verification_status.toLowerCase();

  return (
    <form action={formAction} className="mx-auto w-full max-w-5xl space-y-6">
      {/* Professional information */}
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background text-primary">
              <UserRound className="size-5" />
            </div>

            <div>
              <CardTitle className="text-lg">
                Professional information
              </CardTitle>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Introduce yourself and highlight the experience you bring to
                each job.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="bio">Professional bio</Label>

            <Textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              placeholder="Tell customers about your experience, skills and the services you provide..."
              rows={6}
              maxLength={2000}
              className="min-h-36 resize-y rounded-xl leading-6"
            />

            <p className="text-xs leading-5 text-muted-foreground">
              Explain what you specialise in and what makes your service
              valuable to customers.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_of_experience">Years of experience</Label>

            <div className="relative">
              <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="years_of_experience"
                name="years_of_experience"
                type="number"
                min="0"
                step="1"
                defaultValue={profile.years_of_experience ?? 0}
                className="h-11 rounded-xl pl-10"
              />
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Enter the number of years you have worked in your field.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background text-primary">
              <Coins className="size-5" />
            </div>

            <div>
              <CardTitle className="text-lg">Pricing preferences</CardTitle>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Set a starting price to help customers understand your rates.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="starting_price">Starting price</Label>

            <Input
              id="starting_price"
              name="starting_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={profile.starting_price ?? 0}
              className="h-11 rounded-xl"
            />

            <p className="text-xs leading-5 text-muted-foreground">
              Your final quotation can vary depending on the job.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Preferred currency</Label>

            <select
              id="currency"
              name="currency"
              defaultValue={profile.currency || "NGN"}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>

            <p className="text-xs leading-5 text-muted-foreground">
              Choose the currency you use when quoting for work.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background text-primary">
              <Clock3 className="size-5" />
            </div>

            <div>
              <CardTitle className="text-lg">Work availability</CardTitle>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Let customers know whether you are open to new jobs.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <label
            htmlFor="is_available"
            className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/30 sm:p-5"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  profile.is_available
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <CheckCircle2 className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold">Available for new jobs</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  When enabled, customers can see that you are currently
                  available for work.
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                    profile.is_available
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {profile.is_available ? "Currently available" : "Unavailable"}
                </span>
              </div>
            </div>

            <input
              id="is_available"
              name="is_available"
              type="checkbox"
              value="true"
              defaultChecked={profile.is_available}
              className="size-5 shrink-0 cursor-pointer accent-primary"
            />
          </label>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background text-primary">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <CardTitle className="text-lg">Account verification</CardTitle>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Review your current verification status.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <BadgeCheck className="size-5 text-muted-foreground" />
              </div>

              <div>
                <p className="font-semibold">Verification status</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Your verification status is managed by the administrator.
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold capitalize ${
                verificationStyles[verificationStatus] ??
                "border-border bg-muted text-foreground"
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {profile.verification_status.replaceAll("_", " ")}
            </span>
          </div>
        </CardContent>
      </Card>

      <FeedbackMessage error={state.error} success={state.success} />

      {/* Save action */}
      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Keep your professional profile up to date.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
