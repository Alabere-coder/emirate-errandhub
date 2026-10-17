"use client";

import { useActionState } from "react";
import { LoaderCircle, UserRoundCog } from "lucide-react";

import { reassignServiceProvider } from "../actions";
import type { ProviderOption } from "./provider-assignment-form";

type ReassignProviderFormProps = {
  requestId: string;
  currentWorkerId: string | null;
  providers: ProviderOption[];
};

const initialState: {
  error?: string;
  success?: string;
} = {};

export default function ReassignProviderForm({
  requestId,
  currentWorkerId,
  providers,
}: ReassignProviderFormProps) {
  const [state, formAction, isPending] = useActionState(
    reassignServiceProvider,
    initialState,
  );

  const eligibleProviders = providers.filter(
    (provider) =>
      provider.verification_status === "verified" &&
      provider.is_available &&
      provider.id !== currentWorkerId,
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
          <UserRoundCog className="size-5" />
        </div>

        <div>
          <h3 className="font-semibold text-foreground">
            Reassign service provider
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Replace the provider on the existing job. The accepted quotation
            amount will not be changed.
          </p>
        </div>
      </div>

      {eligibleProviders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No other verified and available providers are currently eligible.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="requestId" value={requestId} />

          <div className="space-y-2">
            <label
              htmlFor={`replacement-provider-${requestId}`}
              className="text-sm font-medium"
            >
              Replacement provider
            </label>

            <select
              id={`replacement-provider-${requestId}`}
              name="workerProfileId"
              required
              defaultValue=""
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>
                Select a replacement provider
              </option>

              {eligibleProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                  {provider.phone ? ` — ${provider.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          {state.error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {state.error}
            </p>
          )}

          {state.success && (
            <p
              role="status"
              className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700"
            >
              {state.success}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <LoaderCircle className="size-4 animate-spin" />}
            {isPending ? "Reassigning..." : "Reassign provider"}
          </button>

          <p className="text-xs text-muted-foreground">
            This changes the provider on the existing job. It does not create
            another job or change the agreed price.
          </p>
        </form>
      )}
    </section>
  );
}
