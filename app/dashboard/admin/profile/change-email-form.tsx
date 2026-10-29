"use client";

import { useActionState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

import { requestEmailChange, type EmailChangeState } from "./email-actions";

const initialState: EmailChangeState = {};

export default function ChangeEmailForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [state, formAction, pending] = useActionState(
    requestEmailChange,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Current email address</label>
        <input
          type="email"
          value={currentEmail}
          readOnly
          className="flex h-11 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="newEmail" className="text-sm font-medium">
          New email address
        </label>
        <input
          id="newEmail"
          name="newEmail"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="Enter your new email address"
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending confirmation...
          </>
        ) : (
          <>
            <Mail className="size-4" />
            Request email change
          </>
        )}
      </button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        You may need to confirm the change using the email addresses required by
        your Supabase Auth configuration. Your current email remains active
        until confirmation is complete.
      </p>
    </form>
  );
}
