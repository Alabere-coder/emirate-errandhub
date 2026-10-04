"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

export function WorkerProfileForm({ profile }: WorkerProfileFormProps) {
  const [state, formAction] = useActionState(updateWorkerProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>

            <Textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              placeholder="Tell customers about your experience, skills and the services you provide..."
              rows={6}
              maxLength={2000}
            />

            <p className="text-sm text-muted-foreground">
              Tell customers what you specialize in and why they should choose
              you.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_of_experience">Years of experience</Label>

            <Input
              id="years_of_experience"
              name="years_of_experience"
              type="number"
              min="0"
              step="1"
              defaultValue={profile.years_of_experience ?? 0}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="starting_price">Starting price</Label>

              <Input
                id="starting_price"
                name="starting_price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={profile.starting_price ?? 0}
              />

              <p className="text-sm text-muted-foreground">
                This is your starting price. Final quotations can differ
                depending on the job.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>

              <select
                id="currency"
                name="currency"
                defaultValue={profile.currency || "NGN"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>

        <CardContent>
          <label
            htmlFor="is_available"
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              id="is_available"
              name="is_available"
              type="checkbox"
              value="true"
              defaultChecked={profile.is_available}
              className="mt-1 h-4 w-4 rounded border-input"
            />

            <div>
              <p className="font-medium">Available for new jobs</p>

              <p className="text-sm text-muted-foreground">
                When enabled, customers can see that you are currently available
                for work.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Verification status</p>

              <p className="text-sm text-muted-foreground">
                Your verification status is managed by the administrator.
              </p>
            </div>

            <span className="rounded-full bg-muted px-3 py-1 text-sm capitalize">
              {profile.verification_status.replaceAll("_", " ")}
            </span>
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
