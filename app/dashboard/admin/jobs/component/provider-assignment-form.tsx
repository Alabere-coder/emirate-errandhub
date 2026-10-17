"use client";

import { useActionState } from "react";
import { LoaderCircle, UserRoundCheck } from "lucide-react";

import { assignProviderWithAdminQuote } from "../actions";

export type ProviderOption = {
  id: string;
  name: string;
  phone: string | null;
  verification_status: string;
  is_available: boolean;
};

type ProviderAssignmentFormProps = {
  requestId: string;
  providers: ProviderOption[];
};

const initialState: {
  error?: string;
  success?: string;
} = {};

export default function ProviderAssignmentForm({
  requestId,
  providers,
}: ProviderAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(
    assignProviderWithAdminQuote,
    initialState,
  );

  const eligibleProviders = providers.filter(
    (provider) =>
      provider.verification_status === "verified" && provider.is_available,
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <UserRoundCheck className="size-5" />
        </div>

        <div>
          <h3 className="font-semibold text-foreground">
            Create provider quotation
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select an approved provider and submit a quotation for the customer
            to review.
          </p>
        </div>
      </div>

      {eligibleProviders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No verified and available providers are currently eligible for this
          request.
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="requestId" value={requestId} />

          <div className="space-y-2">
            <label
              htmlFor={`provider-${requestId}`}
              className="text-sm font-medium"
            >
              Service provider
            </label>

            <select
              id={`provider-${requestId}`}
              name="workerProfileId"
              required
              defaultValue=""
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>
                Select a provider
              </option>

              {eligibleProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                  {provider.phone ? ` — ${provider.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor={`amount-${requestId}`}
                className="text-sm font-medium"
              >
                Quotation amount
              </label>

              <input
                id={`amount-${requestId}`}
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="e.g. 15000"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`currency-${requestId}`}
                className="text-sm font-medium"
              >
                Currency
              </label>

              <select
                id={`currency-${requestId}`}
                name="currency"
                defaultValue="NGN"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`message-${requestId}`}
              className="text-sm font-medium"
            >
              Message to customer
              <span className="ml-1 font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <textarea
              id={`message-${requestId}`}
              name="message"
              rows={3}
              maxLength={1000}
              placeholder="Explain the proposed price, work scope, or other relevant details..."
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isPending && <LoaderCircle className="size-4 animate-spin" />}

            {isPending ? "Submitting quotation..." : "Create pending quotation"}
          </button>

          <p className="text-xs text-muted-foreground">
            Creating this quotation does not create a job or automatically
            assign the provider. The customer must accept the quotation first.
          </p>
        </form>
      )}
    </section>
  );
}
