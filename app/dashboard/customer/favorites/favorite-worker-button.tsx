"use client";

import { useState, useTransition } from "react";
import { Heart, LoaderCircle } from "lucide-react";
import { toast } from "@/components/ui/toast";

import { addFavoriteWorker, removeFavoriteWorker } from "../favorites/actions";

type FavoriteWorkerButtonProps = {
  workerId: string;
  initiallyFavorited: boolean;
};

export function FavoriteWorkerButton({
  workerId,
  initiallyFavorited,
}: FavoriteWorkerButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const previousValue = isFavorited;
    const nextValue = !previousValue;

    setIsFavorited(nextValue);

    startTransition(async () => {
      const result = nextValue
        ? await addFavoriteWorker(workerId)
        : await removeFavoriteWorker(workerId);

      if (!result.success) {
        setIsFavorited(previousValue);
        toast.add({
          type: "error",
          description: result.error,
          priority: "high",
        });

        return;
      }

      toast.add({
        type: "success",
        description: nextValue
          ? "Worker added to favourites."
          : "Worker removed from favourites.",
      });
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={
        isFavorited
          ? "Remove worker from favourites"
          : "Add worker to favourites"
      }
      aria-pressed={isFavorited}
      title={isFavorited ? "Remove from favourites" : "Add to favourites"}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={`h-5 w-5 ${
            isFavorited ? "fill-rose-500 text-rose-500" : ""
          }`}
        />
      )}
    </button>
  );
}
