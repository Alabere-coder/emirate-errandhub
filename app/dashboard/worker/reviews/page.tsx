import { Star, MessageSquareText, ThumbsUp, ThumbsDown } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkerReviewsPage() {
  await requireRole(["worker"]);

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <p className="p-6">Please sign in to view your reviews.</p>;
  }

  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError) {
    throw new Error("Unable to load your worker profile.");
  }

  if (!worker) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">My Reviews</h1>
        <p className="mt-2 text-muted-foreground">
          Your worker profile has not been created yet.
        </p>
      </div>
    );
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, customer_id")
    .eq("worker_id", worker.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    throw new Error("Unable to load your reviews.");
  }

  const reviewList = reviews ?? [];

  const reviewIds = reviewList.map((review) => review.id);

  const { data: votes, error: votesError } = reviewIds.length
    ? await supabase
        .from("review_votes")
        .select("review_id, vote")
        .in("review_id", reviewIds)
    : { data: [], error: null };

  if (votesError) {
    throw new Error("Unable to load review vote counts.");
  }

  const voteCounts = new Map(
    reviewIds.map((reviewId) => {
      const reviewVotes = (votes ?? []).filter(
        (vote) => vote.review_id === reviewId,
      );

      return [
        reviewId,
        {
          helpful: reviewVotes.filter((vote) => vote.vote === 1).length,
          notHelpful: reviewVotes.filter((vote) => vote.vote === -1).length,
        },
      ];
    }),
  );

  const totalReviews = reviewList.length;

  const averageRating =
    totalReviews > 0
      ? reviewList.reduce((sum, review) => sum + review.rating, 0) /
        totalReviews
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviewList.filter((review) => review.rating === rating).length,
  }));

  const customerIds = [
    ...new Set(reviewList.map((review) => review.customer_id)),
  ];

  const { data: customers } = customerIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", customerIds)
    : { data: [] };

  const customerNames = new Map(
    (customers ?? []).map((customer) => [
      customer.id,
      `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
    ]),
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See your customer feedback and service ratings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Average rating</p>

          <div className="mt-2 flex items-center gap-2">
            <Star className="size-7 fill-amber-400 text-amber-400" />
            <span className="text-3xl font-bold">
              {totalReviews ? averageRating.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            From published reviews
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Total reviews</p>
          <p className="mt-2 text-3xl font-bold">{totalReviews}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Visible to customers
          </p>
        </div>
      </div>

      <section className="rounded-xl border p-5">
        <h2 className="font-semibold">Rating breakdown</h2>

        <div className="mt-4 space-y-3">
          {ratingCounts.map(({ rating, count }) => {
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="w-12 text-sm">{rating} star</span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-8 text-right text-sm text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Customer feedback</h2>

        {totalReviews === 0 ? (
          <div className="rounded-xl border p-8 text-center">
            <MessageSquareText className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No published reviews yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Reviews from customers will appear here when available.
            </p>
          </div>
        ) : (
          reviewList.map((review) => (
            <article key={review.id} className="rounded-xl border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {customerNames.get(review.customer_id) ||
                      "ErrandHub customer"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div
                  className="flex items-center gap-1"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold">
                    {review.rating}/5
                  </span>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
                {review.comment || "No written comment was provided."}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-12 border-t pt-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <ThumbsUp className="size-4" />
                  Helpful to
                  <span className="font-semibold text-foreground">
                    {voteCounts.get(review.id)?.helpful ?? 0}
                  </span>
                </span>

                <span className="inline-flex items-center gap-2">
                  <ThumbsDown className="size-4" />
                  Not helpful to
                  <span className="font-semibold text-foreground">
                    {voteCounts.get(review.id)?.notHelpful ?? 0}
                  </span>
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
