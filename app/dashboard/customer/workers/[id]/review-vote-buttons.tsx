"use client";

import { useState, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { voteOnReview } from "@/lib/actions/review-votes";

type ReviewVoteButtonsProps = {
  reviewId: string;
  helpfulCount: number;
  notHelpfulCount: number;
  currentVote: 1 | -1 | null;
};

export default function ReviewVoteButtons({
  reviewId,
  helpfulCount,
  notHelpfulCount,
  currentVote,
}: ReviewVoteButtonsProps) {
  const [vote, setVote] = useState<1 | -1 | null>(currentVote);
  const [helpful, setHelpful] = useState(helpfulCount);
  const [notHelpful, setNotHelpful] = useState(notHelpfulCount);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleVote(nextVote: 1 | -1) {
    if (isPending) return;

    const previousVote = vote;
    const updatedVote = previousVote === nextVote ? null : nextVote;

    // Update the UI immediately.
    setVote(updatedVote);
    setHelpful(
      helpfulCountForVote(helpful, notHelpful, previousVote, updatedVote)
        .helpful,
    );
    setNotHelpful(
      helpfulCountForVote(helpful, notHelpful, previousVote, updatedVote)
        .notHelpful,
    );
    setErrorMessage("");

    startTransition(async () => {
      try {
        const result = await voteOnReview(reviewId, updatedVote);

        if (!result.success) {
          setVote(previousVote);
          setHelpful(helpful);
          setNotHelpful(notHelpful);
          setErrorMessage(result.error ?? "Unable to save your vote.");
        }
      } catch {
        setVote(previousVote);
        setHelpful(helpful);
        setNotHelpful(notHelpful);
        setErrorMessage("Unable to save your vote. Please try again.");
      }
    });
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => handleVote(1)}
          disabled={isPending}
          aria-pressed={vote === 1}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            vote === 1
              ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950"
              : "hover:bg-muted"
          }`}
        >
          <ThumbsUp className="size-4" />
          Helpful to
          <span className="font-semibold">{helpful}</span>
        </button>

        <button
          type="button"
          onClick={() => handleVote(-1)}
          disabled={isPending}
          aria-pressed={vote === -1}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            vote === -1
              ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950"
              : "hover:bg-muted"
          }`}
        >
          <ThumbsDown className="size-4" />
          Not helpful to
          <span className="font-semibold">{notHelpful}</span>
        </button>
      </div>

      {/* {isPending && (
        <p className="mt-2 text-xs text-muted-foreground">
          Saving your vote...
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )} */}
    </div>
  );
}

function helpfulCountForVote(
  helpful: number,
  notHelpful: number,
  previousVote: 1 | -1 | null,
  updatedVote: 1 | -1 | null,
) {
  return {
    helpful:
      helpful + (updatedVote === 1 ? 1 : 0) - (previousVote === 1 ? 1 : 0),
    notHelpful:
      notHelpful + (updatedVote === -1 ? 1 : 0) - (previousVote === -1 ? 1 : 0),
  };
}

// "use client";

// import { ThumbsDown, ThumbsUp } from "lucide-react";

// import { voteOnReview } from "@/lib/actions/review-votes";

// type ReviewVoteButtonsProps = {
//   reviewId: string;
//   helpfulCount: number;
//   notHelpfulCount: number;
//   currentVote: 1 | -1 | null;
// };

// export default function ReviewVoteButtons({
//   reviewId,
//   helpfulCount,
//   notHelpfulCount,
//   currentVote,
// }: ReviewVoteButtonsProps) {
//   return (
//     <form action={voteOnReview} className="mt-4 flex flex-wrap gap-2">
//       <input type="hidden" name="review_id" value={reviewId} />

//       <button
//         type="submit"
//         name="vote"
//         value={currentVote === 1 ? "remove" : "1"}
//         aria-pressed={currentVote === 1}
//         className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
//           currentVote === 1
//             ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950"
//             : "hover:bg-muted"
//         }`}
//       >
//         <ThumbsUp className="size-4" />
//         Helpful
//         <span className="font-semibold">{helpfulCount}</span>
//       </button>

//       <button
//         type="submit"
//         name="vote"
//         value={currentVote === -1 ? "remove" : "-1"}
//         aria-pressed={currentVote === -1}
//         className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
//           currentVote === -1
//             ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950"
//             : "hover:bg-muted"
//         }`}
//       >
//         <ThumbsDown className="size-4" />
//         Not helpful
//         <span className="font-semibold">{notHelpfulCount}</span>
//       </button>
//     </form>
//   );
// }
