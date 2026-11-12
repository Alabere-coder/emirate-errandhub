"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Power,
  Trash2,
  X,
} from "lucide-react";

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

  function closeModal() {
    if (pending) return;
    setDialogAction(null);
    setMessage("");
  }

  function handleConfirm() {
    if (!dialogAction) return;

    const action = dialogAction;
    setMessage("");

    startTransition(async () => {
      try {
        const result =
          action === "delete"
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
          action === "delete"
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
          <p role="status" className="w-full text-xs text-red-600">
            {message}
          </p>
        )}
      </div>

      {dialogAction && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`popup-confirm-title-${campaignId}`}
            aria-describedby={`popup-confirm-description-${campaignId}`}
            className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200 rounded-2xl border bg-background p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={closeModal}
              disabled={pending}
              aria-label="Close confirmation"
              className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex size-14 items-center justify-center rounded-full ${
                  isDelete
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isDelete ? (
                  <Trash2 className="size-7" />
                ) : (
                  <AlertTriangle className="size-7" />
                )}
              </div>

              <h2
                id={`popup-confirm-title-${campaignId}`}
                className="text-lg font-semibold tracking-tight"
              >
                {isDelete
                  ? "Delete popup campaign?"
                  : "Deactivate popup campaign?"}
              </h2>

              <p
                id={`popup-confirm-description-${campaignId}`}
                className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground"
              >
                {isDelete
                  ? "This popup campaign will be permanently deleted. This action cannot be undone."
                  : "This popup will stop appearing to visitors. You can activate it again whenever you need it."}
              </p>

              {message && (
                <p
                  role="alert"
                  className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 p-3 text-left text-sm text-red-700"
                >
                  {message}
                </p>
              )}

              <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={closeModal}
                  className="sm:min-w-28"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  disabled={pending}
                  onClick={handleConfirm}
                  className={`sm:min-w-36 ${
                    isDelete
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-amber-600 text-white hover:bg-amber-700"
                  }`}
                >
                  {pending ? (
                    "Please wait..."
                  ) : isDelete ? (
                    <>
                      <Trash2 className="mr-2 size-4" />
                      Delete campaign
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 size-4" />
                      Deactivate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// "use client";

// import { useState, useTransition } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Pencil, Power, Trash2 } from "lucide-react";

// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// import { Button } from "@/components/ui/button";

// import { togglePopupCampaign, deletePopupCampaign } from "./actions";

// type DialogAction = "deactivate" | "delete" | null;

// export function PopupActions({
//   campaignId,
//   isActive,
// }: {
//   campaignId: string;
//   isActive: boolean;
// }) {
//   const router = useRouter();

//   const [pending, startTransition] = useTransition();
//   const [dialogAction, setDialogAction] = useState<DialogAction>(null);
//   const [message, setMessage] = useState("");

//   const isDelete = dialogAction === "delete";

//   function handleConfirm() {
//     if (!dialogAction) return;

//     setMessage("");

//     startTransition(async () => {
//       try {
//         const result =
//           dialogAction === "delete"
//             ? await deletePopupCampaign(campaignId)
//             : await togglePopupCampaign(campaignId, false);

//         if (result.error) {
//           setMessage(result.error);
//           return;
//         }

//         setDialogAction(null);
//         setMessage("");

//         router.refresh();
//       } catch (error) {
//         console.error("Popup action failed:", error);

//         setMessage(
//           dialogAction === "delete"
//             ? "Unable to delete popup. Please try again."
//             : "Unable to deactivate popup. Please try again.",
//         );
//       }
//     });
//   }

//   function handleActivate() {
//     setMessage("");

//     startTransition(async () => {
//       try {
//         const result = await togglePopupCampaign(campaignId, true);

//         if (result.error) {
//           setMessage(result.error);
//           return;
//         }

//         router.refresh();
//       } catch (error) {
//         console.error("Popup activation failed:", error);
//         setMessage("Unable to activate popup. Please try again.");
//       }
//     });
//   }

//   return (
//     <>
//       <div className="flex flex-wrap items-center gap-2">
//         <Button size="sm" variant="outline" disabled={pending}>
//           <Link
//             href={`/dashboard/admin/popups/${campaignId}/edit`}
//             className="flex items-center gap-1"
//           >
//             <Pencil className="mr-1 size-3.5" />
//             Edit
//           </Link>
//         </Button>

//         {isActive ? (
//           <Button
//             type="button"
//             size="sm"
//             variant="outline"
//             disabled={pending}
//             onClick={() => {
//               setMessage("");
//               setDialogAction("deactivate");
//             }}
//           >
//             <Power className="mr-1 size-3.5" />
//             Deactivate
//           </Button>
//         ) : (
//           <Button
//             type="button"
//             size="sm"
//             variant="outline"
//             disabled={pending}
//             onClick={handleActivate}
//           >
//             <Power className="mr-1 size-3.5" />
//             Activate
//           </Button>
//         )}

//         <Button
//           type="button"
//           size="sm"
//           variant="destructive"
//           disabled={pending}
//           onClick={() => {
//             setMessage("");
//             setDialogAction("delete");
//           }}
//         >
//           <Trash2 className="mr-1 size-3.5" />
//           Delete
//         </Button>

//         {message && !dialogAction && (
//           <p
//             role="status"
//             aria-live="polite"
//             className="w-full text-xs text-red-600 sm:text-right"
//           >
//             {message}
//           </p>
//         )}
//       </div>

//       <Dialog
//         open={dialogAction !== null}
//         onOpenChange={(open) => {
//           if (!pending && !open) {
//             setDialogAction(null);
//             setMessage("");
//           }
//         }}
//       >
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               {isDelete
//                 ? "Delete popup campaign?"
//                 : "Deactivate popup campaign?"}
//             </DialogTitle>

//             <DialogDescription>
//               {isDelete
//                 ? "Are you sure you want to delete this popup campaign? This action cannot be undone."
//                 : "This popup will no longer be displayed to visitors. You can activate it again later."}
//             </DialogDescription>
//           </DialogHeader>

//           {message && (
//             <p
//               role="alert"
//               className="rounded-md bg-red-50 p-3 text-sm text-red-600"
//             >
//               {message}
//             </p>
//           )}

//           <DialogFooter>
//             <Button
//               type="button"
//               variant="outline"
//               disabled={pending}
//               onClick={() => {
//                 setDialogAction(null);
//                 setMessage("");
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               type="button"
//               variant="destructive"
//               disabled={pending}
//               onClick={handleConfirm}
//             >
//               {pending
//                 ? "Please wait..."
//                 : isDelete
//                   ? "Yes, delete"
//                   : "Yes, deactivate"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
