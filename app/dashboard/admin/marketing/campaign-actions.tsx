"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2, Pencil } from "lucide-react";

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
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline">
          <Link
            href={`/dashboard/admin/marketing/${campaignId}/edit`}
            className="flex items-center"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={handleToggle}
        >
          <Power className="mr-2 h-4 w-4" />
          {pending ? "Please wait..." : isActive ? "Deactivate" : "Activate"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {error && <p className="max-w-xs text-xs text-red-600">{error}</p>}
    </div>
  );
}
