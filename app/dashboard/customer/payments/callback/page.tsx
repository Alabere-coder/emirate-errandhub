import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { verifyJobPayment } from "@/lib/actions/payments";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CallbackPageProps = {
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
  }>;
};

export default async function PaymentCallbackPage({
  searchParams,
}: CallbackPageProps) {
  await requireRole(["customer"]);

  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  const result = reference
    ? await verifyJobPayment(reference)
    : { error: "No payment reference was provided." };

  const retryHref = reference
    ? `/dashboard/customer/payments/callback?reference=${encodeURIComponent(reference)}`
    : "/dashboard/customer/requests";

  return (
    <div className="mx-auto w-full max-w-xl p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {result.success ? "Payment confirmed" : "Payment verification"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {result.success ? (
            <p className="text-sm text-muted-foreground">{result.success}</p>
          ) : (
            <p className="text-sm text-destructive">{result.error}</p>
          )}

          <p className="text-sm text-muted-foreground">
            Your payment status is determined by server-side verification, not
            by the redirect from Paystack.
          </p>

          <div className="flex flex-wrap gap-3">
            {reference && !result.success && (
              <Button>
                <Link href={retryHref}>Try verification again</Link>
              </Button>
            )}

            <Button variant="outline">
              <Link href="/dashboard/customer/requests">View My Requests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
