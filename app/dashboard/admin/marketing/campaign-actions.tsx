"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2, Pencil, AlertCircle } from "lucide-react";

import { deleteMarketingCampaign, toggleMarketingCampaign } from "./actions";

import { Button } from "@/components/ui/button";

type Props = {
  campaignId: string;
  isActive: boolean;
};

export function CampaignActions({ campaignId, isActive }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleToggle() {
    setError("");

    startTransition(async () => {
      const result = await toggleMarketingCampaign(campaignId, !isActive);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this campaign and its banner image?",
    );

    if (!confirmed) return;

    setError("");

    startTransition(async () => {
      const result = await deleteMarketingCampaign(campaignId);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          className="border-border bg-background hover:bg-muted"
        >
          <Link
            href={`/dashboard/admin/marketing/${campaignId}/edit`}
            className="flex items-center gap-2"
          >
            <Pencil className="size-4" />
            Edit
          </Link>
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={handleToggle}
          className="border-border bg-background hover:bg-muted"
        >
          <Power className="mr-2 size-4" />
          {pending ? "Please wait..." : isActive ? "Deactivate" : "Activate"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex max-w-sm items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
