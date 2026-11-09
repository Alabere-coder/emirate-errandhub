"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Power, Trash2 } from "lucide-react";

import { togglePopupCampaign, deletePopupCampaign } from "./actions";

import { Button } from "@/components/ui/button";

export function PopupActions({
  campaignId,
  isActive,
}: {
  campaignId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleToggle() {
    setMessage("");

    startTransition(async () => {
      const result = await togglePopupCampaign(campaignId, !isActive);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setMessage(result.success ?? "Status updated.");
      router.refresh();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this popup campaign? This cannot be undone.",
    );

    if (!confirmed) return;

    setMessage("");

    startTransition(async () => {
      const result = await deletePopupCampaign(campaignId);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline">
        <Link href={`/dashboard/admin/popups/${campaignId}/edit`}>
          <Pencil className="mr-1 size-3.5" />
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
        <Power className="mr-1 size-3.5" />
        {isActive ? "Deactivate" : "Activate"}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={handleDelete}
      >
        <Trash2 className="mr-1 size-3.5" />
        Delete
      </Button>

      {message && (
        <p
          role="status"
          className="w-full text-xs text-muted-foreground sm:text-right"
        >
          {message}
        </p>
      )}
    </div>
  );
}
