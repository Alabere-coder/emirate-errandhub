"use client";

import { useActionState, useState } from "react";

import { createAdministrator, type CreateAdminState } from "./actions";

const initialState: CreateAdminState = {};

export function CreateAdminForm() {
  const [state, formAction, pending] = useActionState(
    createAdministrator,
    initialState,
  );

  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    if (!state.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(state.temporaryPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            disabled={pending}
            placeholder="Enter first name"
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            disabled={pending}
            placeholder="Enter last name"
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={pending}
          placeholder="admin@example.com"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone number <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          disabled={pending}
          placeholder="Enter phone number"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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

      {state.success && state.temporaryPassword && (
        <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {state.success}
          </p>

          <p className="text-sm">
            Administrator: <strong>{state.email}</strong>
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Temporary password</label>

            <div className="flex gap-2">
              <input
                readOnly
                value={state.temporaryPassword}
                className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm"
              />

              <button
                type="button"
                onClick={copyPassword}
                className="h-11 shrink-0 rounded-md border border-input px-3 text-sm font-medium hover:bg-muted"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Copy and securely share this password with the administrator. It
            will not be shown again after you leave or refresh this page. The
            administrator must change it on first login.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating administrator..." : "Create administrator"}
      </button>
    </form>
  );
}
