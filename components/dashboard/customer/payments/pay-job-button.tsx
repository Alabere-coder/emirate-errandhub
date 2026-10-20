"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, Wallet } from "lucide-react";

import { initializeJobPayment } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";

type PayJobButtonProps = {
  jobId: string;
};

export function PayJobButton({ jobId }: PayJobButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handlePayment() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await initializeJobPayment(jobId);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.authorizationUrl) {
        setError("Checkout could not be started. Please try again.");
        return;
      }

      window.location.assign(result.authorizationUrl);
    } catch {
      setError("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className="w-full rounded-xl bg-teal-600 text-white hover:bg-teal-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing secure checkout...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Pay for this Job
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5" />
        Secure checkout powered by Paystack
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
          <button
            type="button"
            onClick={() => router.refresh()}
            className="ml-2 font-semibold underline"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
