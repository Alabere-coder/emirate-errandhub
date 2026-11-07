import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TicketPercent } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { updateDiscountCode } from "@/lib/actions/admin-discounts";
import { createAdminClient } from "@/lib/supabase/admin";

import { DiscountCodeForm } from "../../discount-code-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDiscountCodePage({ params }: PageProps) {
  await requireRole(["admin", "super_admin"]);

  const { id } = await params;
  const admin = createAdminClient() as any;

  const { data: code, error } = await admin
    .from("discount_codes")
    .select(
      "id, code, description, discount_type, discount_value, max_discount_amount, min_booking_amount, usage_limit, per_customer_limit, first_booking_only, starts_at, expires_at, is_active",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Discount code lookup failed:", error);
    throw new Error("Unable to load discount code.");
  }

  if (!code) {
    notFound();
  }

  const updateAction = updateDiscountCode.bind(null, code.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/dashboard/admin/discount-codes"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to discount codes
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <TicketPercent className="size-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Edit Discount Code
            </h1>
            <p className="text-sm text-muted-foreground">
              Update the settings for {code.code}.
            </p>
          </div>
        </div>
      </div>

      <DiscountCodeForm
        action={updateAction}
        initialData={code}
        submitLabel="Save Changes"
      />
    </div>
  );
}
