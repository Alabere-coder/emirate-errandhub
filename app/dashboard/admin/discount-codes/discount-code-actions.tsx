"use client";

import { useState, useTransition } from "react";
import { Trash2, Power, PowerOff, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  deleteDiscountCode,
  toggleDiscountCodeStatus,
} from "@/lib/actions/admin-discounts";

type Props = {
  id: string;
  isActive: boolean;
};

type ActionType = "toggle" | "delete" | null;

export function DiscountCodeActions({ id, isActive }: Props) {
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<ActionType>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const isDeleting = isPending && actionType === "delete";
  const isToggling = isPending && actionType === "toggle";

  function openConfirmation(action: Exclude<ActionType, null>) {
    setError("");
    setActionType(action);
    setDialogOpen(true);
  }

  function handleConfirm() {
    if (!actionType) return;

    const selectedAction = actionType;

    startTransition(async () => {
      const result =
        selectedAction === "delete"
          ? await deleteDiscountCode(id)
          : await toggleDiscountCodeStatus(id, !isActive);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setDialogOpen(false);
      setActionType(null);
    });
  }

  function handleDialogChange(open: boolean) {
    if (isPending) return;

    setDialogOpen(open);

    if (!open) {
      setActionType(null);
      setError("");
    }
  }

  const isDeleteAction = actionType === "delete";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openConfirmation("toggle")}
          disabled={isPending}
        >
          {isToggling ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isActive ? (
            <PowerOff className="mr-2 h-4 w-4" />
          ) : (
            <Power className="mr-2 h-4 w-4" />
          )}

          {isActive ? "Deactivate" : "Activate"}
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => openConfirmation("delete")}
          disabled={isPending}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {isDeleteAction
                ? "Delete discount code?"
                : isActive
                  ? "Deactivate discount code?"
                  : "Activate discount code?"}
            </DialogTitle>

            <DialogDescription>
              {isDeleteAction
                ? "Are you sure you want to permanently delete this discount code? Codes with redemption history cannot be deleted."
                : isActive
                  ? "Customers will no longer be able to apply this discount code. Existing redemption and payment records will be preserved."
                  : "This discount code will become available to eligible customers, subject to its dates and usage limits."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant={isDeleteAction ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

              {isDeleteAction
                ? "Yes, Delete"
                : isActive
                  ? "Yes, Deactivate"
                  : "Yes, Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
