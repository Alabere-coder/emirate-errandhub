"use client";

import { useActionState } from "react";
import { updateCustomerProfile, type CustomerProfileState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";

const initialState: CustomerProfileState = {};

type CustomerProfileFormProps = {
  firstName: string;
  lastName: string;
  phone: string;
};

export function CustomerProfileForm({
  firstName,
  lastName,
  phone,
}: CustomerProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCustomerProfile,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            name="first_name"
            defaultValue={firstName}
            placeholder="Enter your first name"
            maxLength={100}
            required
            autoComplete="given-name"
            className="h-11 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            name="last_name"
            defaultValue={lastName}
            placeholder="Enter your last name"
            maxLength={100}
            required
            autoComplete="family-name"
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          placeholder="Enter your phone number"
          maxLength={30}
          autoComplete="tel"
          className="h-11 rounded-xl"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          Use a number where service providers can reach you.
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {state.success}
        </div>
      )}

      <div className="flex justify-end border-t border-border/60 pt-5">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-xl px-5 sm:w-auto"
        >
          {pending ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {pending ? "Saving changes..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
