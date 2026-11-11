"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Power, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { togglePopupCampaign, deletePopupCampaign } from "./actions";

type DialogAction = "deactivate" | "delete" | null;

export function PopupActions({
  campaignId,
  isActive,
}: {
  campaignId: string;
  isActive: boolean;
}) {
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [message, setMessage] = useState("");

  const isDelete = dialogAction === "delete";

  function handleConfirm() {
    if (!dialogAction) return;

    setMessage("");

    startTransition(async () => {
      try {
        const result =
          dialogAction === "delete"
            ? await deletePopupCampaign(campaignId)
            : await togglePopupCampaign(campaignId, false);

        if (result.error) {
          setMessage(result.error);
          return;
        }

        setDialogAction(null);
        setMessage("");

        router.refresh();
      } catch (error) {
        console.error("Popup action failed:", error);

        setMessage(
          dialogAction === "delete"
            ? "Unable to delete popup. Please try again."
            : "Unable to deactivate popup. Please try again.",
        );
      }
    });
  }

  function handleActivate() {
    setMessage("");

    startTransition(async () => {
      try {
        const result = await togglePopupCampaign(campaignId, true);

        if (result.error) {
          setMessage(result.error);
          return;
        }

        router.refresh();
      } catch (error) {
        console.error("Popup activation failed:", error);
        setMessage("Unable to activate popup. Please try again.");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={pending}>
          <Link
            href={`/dashboard/admin/popups/${campaignId}/edit`}
            className="flex items-center gap-1"
          >
            <Pencil className="mr-1 size-3.5" />
            Edit
          </Link>
        </Button>

        {isActive ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setMessage("");
              setDialogAction("deactivate");
            }}
          >
            <Power className="mr-1 size-3.5" />
            Deactivate
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={handleActivate}
          >
            <Power className="mr-1 size-3.5" />
            Activate
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            setMessage("");
            setDialogAction("delete");
          }}
        >
          <Trash2 className="mr-1 size-3.5" />
          Delete
        </Button>

        {message && !dialogAction && (
          <p
            role="status"
            aria-live="polite"
            className="w-full text-xs text-red-600 sm:text-right"
          >
            {message}
          </p>
        )}
      </div>

      <Dialog
        open={dialogAction !== null}
        onOpenChange={(open) => {
          if (!pending && !open) {
            setDialogAction(null);
            setMessage("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isDelete
                ? "Delete popup campaign?"
                : "Deactivate popup campaign?"}
            </DialogTitle>

            <DialogDescription>
              {isDelete
                ? "Are you sure you want to delete this popup campaign? This action cannot be undone."
                : "This popup will no longer be displayed to visitors. You can activate it again later."}
            </DialogDescription>
          </DialogHeader>

          {message && (
            <p
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-600"
            >
              {message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setDialogAction(null);
                setMessage("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleConfirm}
            >
              {pending
                ? "Please wait..."
                : isDelete
                  ? "Yes, delete"
                  : "Yes, deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
