"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { setUserActive } from "../actions";

type Props = {
  userId: string;
  userName: string;
  isActive: boolean;
  role: string;
};

export function UserStatusControl({ userId, userName, isActive, role }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activating = !isActive;

  function confirmStatusChange() {
    setFeedback("");

    startTransition(async () => {
      const result = await setUserActive(userId, activating);

      setFeedback(result.message);
      setFeedbackSuccess(result.success);

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div>
      {feedback && (
        <div
          role={feedbackSuccess ? "status" : "alert"}
          className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
            feedbackSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedbackSuccess ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{feedback}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setFeedback("");
          setDialogOpen(true);
        }}
        className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${
          activating
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
        }`}
      >
        {activating ? (
          <ShieldCheck className="h-4 w-4" />
        ) : (
          <UserX className="h-4 w-4" />
        )}
        {activating ? "Activate account" : "Deactivate account"}
      </button>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isPending) {
              setDialogOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-status-title"
            aria-describedby="user-status-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                activating
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {activating ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>

            <h2
              id="user-status-title"
              className="mt-5 text-xl font-bold text-slate-900"
            >
              {activating
                ? "Activate this account?"
                : "Deactivate this account?"}
            </h2>

            <p
              id="user-status-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              You are about to {activating ? "activate" : "deactivate"}{" "}
              <strong className="wrap-break-word text-slate-900">
                {userName}
              </strong>
              .
              {activating
                ? " The account will be marked as active."
                : " The account will be marked inactive. Access restrictions must also be enforced by your server-side authorization checks and database policies."}
            </p>

            {role === "admin" && !activating && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                Administrator accounts require extra care. The server will
                prevent deactivating the last active administrator.
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDialogOpen(false)}
                className="min-h-10 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={confirmStatusChange}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  activating
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {isPending
                  ? "Updating..."
                  : activating
                    ? "Confirm activation"
                    : "Confirm deactivation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
