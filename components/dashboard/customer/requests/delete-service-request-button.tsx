"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteServiceRequest } from "@/lib/actions/service-requests";

type Props = {
  requestId: string;
};

export function DeleteServiceRequestButton({ requestId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteServiceRequest(requestId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      router.push("/dashboard/customer/requests");
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="rounded-xl"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Request
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-request-title"
            aria-describedby="delete-request-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h2
                  id="delete-request-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Delete this request?
                </h2>

                <p
                  id="delete-request-description"
                  className="mt-2 text-sm leading-6 text-slate-600"
                >
                  Are you sure you want to delete this service request? This
                  action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close confirmation"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-black text-white"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={handleDelete}
                className="rounded-lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Yes, delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
