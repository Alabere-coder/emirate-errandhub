import Link from "next/link";
import { ArrowLeft, TicketPercent } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createDiscountCode } from "@/lib/actions/admin-discounts";

import { DiscountCodeForm } from "../discount-code-form";

export const dynamic = "force-dynamic";

export default async function NewDiscountCodePage() {
  await requireRole(["admin", "super_admin"]);

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
              Create Discount Code
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure a promotional discount customers can use when booking
              services.
            </p>
          </div>
        </div>
      </div>

      <DiscountCodeForm
        action={createDiscountCode}
        submitLabel="Create Discount Code"
      />
    </div>
  );
}
