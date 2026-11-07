"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Save, TicketPercent } from "lucide-react";

import type { DiscountCodeActionState } from "@/lib/actions/admin-discounts";

import { Button } from "@/components/ui/button";

type DiscountCodeFormData = {
  code?: string;
  description?: string | null;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  max_discount_amount?: number | null;
  min_booking_amount?: number;
  usage_limit?: number | null;
  per_customer_limit?: number | null;
  first_booking_only?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
};

type DiscountCodeFormProps = {
  action: (
    previousState: DiscountCodeActionState,
    formData: FormData,
  ) => Promise<DiscountCodeActionState>;
  initialData?: DiscountCodeFormData;
  submitLabel: string;
};

const initialState: DiscountCodeActionState = {};

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const inputClassName =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15";

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

export function DiscountCodeForm({
  action,
  initialData,
  submitLabel,
}: DiscountCodeFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <TicketPercent className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">Discount details</h2>
            <p className="text-sm text-muted-foreground">
              Set the code customers will enter at checkout.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="code" className={labelClassName}>
              Discount code *
            </label>
            <input
              id="code"
              name="code"
              required
              minLength={3}
              maxLength={40}
              pattern="[A-Za-z0-9_-]{3,40}"
              defaultValue={initialData?.code ?? ""}
              placeholder="WELCOME10"
              className={inputClassName}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Letters, numbers, underscores and hyphens only.
            </p>
          </div>

          <div>
            <label htmlFor="description" className={labelClassName}>
              Description
            </label>
            <input
              id="description"
              name="description"
              defaultValue={initialData?.description ?? ""}
              placeholder="10% off your first booking"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="discount_type" className={labelClassName}>
              Discount type *
            </label>
            <select
              id="discount_type"
              name="discount_type"
              required
              defaultValue={initialData?.discount_type ?? "percentage"}
              className={inputClassName}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (₦)</option>
            </select>
          </div>

          <div>
            <label htmlFor="discount_value" className={labelClassName}>
              Discount value *
            </label>
            <input
              id="discount_value"
              name="discount_value"
              type="number"
              required
              min="0.01"
              step="0.01"
              defaultValue={initialData?.discount_value ?? ""}
              placeholder="10"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="max_discount_amount" className={labelClassName}>
              Maximum discount amount (₦)
            </label>
            <input
              id="max_discount_amount"
              name="max_discount_amount"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={initialData?.max_discount_amount ?? ""}
              placeholder="Leave empty for no cap"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="min_booking_amount" className={labelClassName}>
              Minimum booking amount (₦)
            </label>
            <input
              id="min_booking_amount"
              name="min_booking_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initialData?.min_booking_amount ?? 0}
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 font-semibold">Usage restrictions</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Control how often this discount can be used.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="usage_limit" className={labelClassName}>
              Total usage limit
            </label>
            <input
              id="usage_limit"
              name="usage_limit"
              type="number"
              min="1"
              step="1"
              defaultValue={initialData?.usage_limit ?? ""}
              placeholder="Unlimited"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="per_customer_limit" className={labelClassName}>
              Per-customer usage limit
            </label>
            <input
              id="per_customer_limit"
              name="per_customer_limit"
              type="number"
              min="1"
              step="1"
              defaultValue={initialData?.per_customer_limit ?? ""}
              placeholder="Unlimited"
              className={inputClassName}
            />
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
          <input
            type="checkbox"
            name="first_booking_only"
            value="on"
            defaultChecked={initialData?.first_booking_only ?? false}
            className="mt-0.5 size-4 accent-emerald-600"
          />
          <span>
            <span className="block text-sm font-medium">
              First booking only
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Restrict this code to eligible customers making their first
              booking.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 font-semibold">Schedule and availability</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Optionally schedule when customers can use this code.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="starts_at" className={labelClassName}>
              Starts at
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initialData?.starts_at)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="expires_at" className={labelClassName}>
              Expires at
            </label>
            <input
              id="expires_at"
              name="expires_at"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initialData?.expires_at)}
              className={inputClassName}
            />
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
          <input
            type="checkbox"
            name="is_active"
            value="on"
            defaultChecked={initialData?.is_active ?? true}
            className="mt-0.5 size-4 accent-emerald-600"
          />
          <span>
            <span className="block text-sm font-medium">
              Activate discount code
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Inactive codes cannot be applied by customers.
            </span>
          </span>
        </label>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600"
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isPending}>
          <Link href="/dashboard/admin/discount-codes">Cancel</Link>
        </Button>

        <Button
          type="submit"
          disabled={isPending}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
