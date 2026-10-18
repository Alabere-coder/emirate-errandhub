"use client";

import { useActionState, useEffect, useState } from "react";
import { Star } from "lucide-react";

import { submitReview, type ReviewActionState } from "@/lib/actions/reviews";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExistingReview = {
  rating: number;
  comment: string | null;
};

type ReviewFormProps = {
  jobId: string;
  existingReview?: ExistingReview | null;
};

const initialState: ReviewActionState = {};

export default function ReviewForm({
  jobId,
  existingReview = null,
}: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(
    submitReview,
    initialState,
  );

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");

  useEffect(() => {
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? "");
  }, [existingReview?.rating, existingReview?.comment]);

  const isEditing = Boolean(existingReview);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Your Review" : "Rate Your Experience"}
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          {isEditing
            ? "Update your rating or comment below."
            : "Your feedback helps other customers choose a service provider."}
        </p>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="rating" value={rating} />

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              How would you rate this service?
            </legend>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || rating);

                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                    aria-pressed={rating === star}
                    disabled={pending || Boolean(state.success)}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onFocus={() => setHoverRating(star)}
                    onBlur={() => setHoverRating(0)}
                    className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        active
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
              {rating === 0
                ? "Select a star rating."
                : `${rating} out of 5 stars`}
            </p>
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Share your experience (optional)
            </label>

            <textarea
              id="comment"
              name="comment"
              rows={5}
              maxLength={1000}
              value={comment}
              disabled={pending || Boolean(state.success)}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What went well? What should future customers know?"
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="text-xs text-muted-foreground">
              {comment.length}/1000 characters
            </p>
          </div>

          {state.error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {state.error}
            </p>
          )}

          {state.success && (
            <p role="status" className="text-sm font-medium text-emerald-600">
              {state.success}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending || rating === 0 || Boolean(state.success)}
            className="w-full rounded-xl sm:w-auto"
          >
            {pending
              ? isEditing
                ? "Saving Changes..."
                : "Submitting Review..."
              : isEditing
                ? "Save Changes"
                : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// "use client";

// import { useActionState, useState } from "react";
// import { Star } from "lucide-react";

// import { submitReview, type ReviewActionState } from "@/lib/actions/reviews";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// const initialState: ReviewActionState = {};

// export default function ReviewForm({ jobId }: { jobId: string }) {
//   const [state, formAction, pending] = useActionState(
//     submitReview,
//     initialState,
//   );
//   const [rating, setRating] = useState(0);
//   const [hoverRating, setHoverRating] = useState(0);

//   return (
//     <Card className="rounded-2xl">
//       <CardHeader>
//         <CardTitle>Rate your experience</CardTitle>
//         <p className="text-sm text-muted-foreground">
//           Your feedback helps other customers choose a service provider.
//         </p>
//       </CardHeader>

//       <CardContent>
//         <form action={formAction} className="space-y-6">
//           <input type="hidden" name="jobId" value={jobId} />
//           <input type="hidden" name="rating" value={rating} />

//           <fieldset className="space-y-3">
//             <legend className="text-sm font-medium">
//               How would you rate this service?
//             </legend>

//             <div className="flex items-center gap-1">
//               {[1, 2, 3, 4, 5].map((star) => {
//                 const active = star <= (hoverRating || rating);

//                 return (
//                   <button
//                     key={star}
//                     type="button"
//                     aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
//                     aria-pressed={rating === star}
//                     onClick={() => setRating(star)}
//                     onMouseEnter={() => setHoverRating(star)}
//                     onMouseLeave={() => setHoverRating(0)}
//                     onFocus={() => setHoverRating(star)}
//                     onBlur={() => setHoverRating(0)}
//                     className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                   >
//                     <Star
//                       className={`h-8 w-8 transition-colors ${
//                         active
//                           ? "fill-amber-400 text-amber-400"
//                           : "text-muted-foreground/40"
//                       }`}
//                     />
//                   </button>
//                 );
//               })}
//             </div>

//             <p className="text-sm text-muted-foreground" aria-live="polite">
//               {rating === 0
//                 ? "Select a star rating."
//                 : `${rating} out of 5 stars`}
//             </p>
//           </fieldset>

//           <div className="space-y-2">
//             <label htmlFor="comment" className="text-sm font-medium">
//               Share your experience (optional)
//             </label>

//             <textarea
//               id="comment"
//               name="comment"
//               rows={5}
//               maxLength={1000}
//               placeholder="What went well? Is there anything future customers should know?"
//               className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
//             />

//             <p className="text-xs text-muted-foreground">
//               Please keep your review respectful and relevant to the service.
//             </p>
//           </div>

//           {state.error && (
//             <p role="alert" className="text-sm font-medium text-destructive">
//               {state.error}
//             </p>
//           )}

//           {state.success && (
//             <p role="status" className="text-sm font-medium text-emerald-600">
//               {state.success}
//             </p>
//           )}

//           <Button
//             type="submit"
//             disabled={pending || rating === 0 || Boolean(state.success)}
//             className="w-full rounded-xl sm:w-auto"
//           >
//             {pending ? "Submitting review..." : "Submit Review"}
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }
