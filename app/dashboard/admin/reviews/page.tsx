import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, MessageSquareText, Star } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { moderateReview } from "@/lib/actions/review-moderation";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  job_id: string;
  customer_id: string;
  worker_id: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback: string,
) {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || fallback;
}

export default async function AdminReviewsPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const [reviewsResult, logsResult] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, job_id, customer_id, worker_id, rating, comment, is_visible, created_at",
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("review_moderation_logs")
      .select(
        "id, review_id, admin_id, previous_visibility, new_visibility, reason, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (reviewsResult.error) {
    console.error("Unable to load reviews:", reviewsResult.error);
  }

  if (logsResult.error) {
    console.error(
      "Unable to load review moderation history:",
      logsResult.error,
    );
  }

  const reviews = (reviewsResult.data ?? []) as ReviewRow[];

  const customerIds = [...new Set(reviews.map((review) => review.customer_id))];

  const workerIds = [...new Set(reviews.map((review) => review.worker_id))];

  const [customersResult, workersResult] = await Promise.all([
    customerIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),

    workerIds.length > 0
      ? supabase
          .from("worker_profiles")
          .select("id, user_id")
          .in("id", workerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (customersResult.error) {
    console.error("Unable to load review customers:", customersResult.error);
  }

  if (workersResult.error) {
    console.error("Unable to load review workers:", workersResult.error);
  }

  const workerUserIds = [
    ...new Set((workersResult.data ?? []).map((worker) => worker.user_id)),
  ];

  const workerProfilesResult = workerUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", workerUserIds)
    : { data: [], error: null };

  if (workerProfilesResult.error) {
    console.error("Unable to load worker names:", workerProfilesResult.error);
  }

  const customerNames = new Map(
    (customersResult.data ?? []).map((customer) => [
      customer.id,
      getName(customer.first_name, customer.last_name, "Customer"),
    ]),
  );

  const workerUserByProfileId = new Map(
    (workersResult.data ?? []).map((worker) => [worker.id, worker.user_id]),
  );

  const workerNames = new Map(
    (workerProfilesResult.data ?? []).map((worker) => [
      worker.id,
      getName(worker.first_name, worker.last_name, "Service provider"),
    ]),
  );

  const visibleCount = reviews.filter((review) => review.is_visible).length;

  const hiddenCount = reviews.length - visibleCount;

  const averageRating =
    visibleCount > 0
      ? reviews
          .filter((review) => review.is_visible)
          .reduce((total, review) => total + review.rating, 0) / visibleCount
      : null;

  const moderationLogs = logsResult.data ?? [];

  return (
    <main className="min-h-full bg-muted/30">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>

          <div className="mt-5">
            <h1 className="text-3xl font-bold tracking-tight">
              Reviews Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review customer feedback, moderate inappropriate content, and
              maintain a record of moderation decisions.
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total reviews",
              value: reviews.length.toLocaleString("en-NG"),
              icon: MessageSquareText,
            },
            {
              label: "Public reviews",
              value: visibleCount.toLocaleString("en-NG"),
              icon: Eye,
            },
            {
              label: "Hidden reviews",
              value: hiddenCount.toLocaleString("en-NG"),
              icon: EyeOff,
            },
            {
              label: "Public average",
              value:
                averageRating !== null
                  ? `${averageRating.toFixed(1)} / 5`
                  : "—",
              icon: Star,
            },
          ].map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="rounded-2xl border bg-card p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">
                  {metric.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* Reviews list */}
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b p-5 sm:p-6">
            <h2 className="font-bold">All customer reviews</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hide reviews that violate your review policy or restore reviews
              that should be public.
            </p>
          </div>

          {reviewsResult.error ? (
            <div className="p-6 text-sm text-destructive">
              Unable to load reviews. Check your Supabase permissions and server
              logs.
            </div>
          ) : reviews.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <MessageSquareText className="mx-auto size-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">No reviews yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Customer reviews will appear here when they are submitted.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map((review) => {
                const workerUserId = workerUserByProfileId.get(
                  review.worker_id,
                );

                const workerName = workerUserId
                  ? (workerNames.get(workerUserId) ?? "Service provider")
                  : "Service provider";

                const customerName =
                  customerNames.get(review.customer_id) ?? "Customer";

                return (
                  <article key={review.id} className="space-y-5 p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{workerName}</h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              review.is_visible
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {review.is_visible ? "Public" : "Hidden"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Reviewed by {customerName}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Job: {review.job_id}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Submitted {formatDate(review.created_at)}
                        </p>
                      </div>

                      <div
                        className="flex shrink-0 items-center gap-1"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`size-4 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}

                        <span className="ml-1 text-sm font-semibold">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-4">
                      <p className="whitespace-pre-line text-sm leading-7">
                        {review.comment?.trim() ||
                          "No written comment provided."}
                      </p>
                    </div>

                    <form
                      action={moderateReview}
                      className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                    >
                      <input type="hidden" name="review_id" value={review.id} />

                      <input
                        type="hidden"
                        name="new_visibility"
                        value={review.is_visible ? "false" : "true"}
                      />

                      <div>
                        <label
                          htmlFor={`reason-${review.id}`}
                          className="mb-2 block text-sm font-medium"
                        >
                          {review.is_visible
                            ? "Reason for hiding this review"
                            : "Reason for restoring this review"}
                        </label>

                        <textarea
                          id={`reason-${review.id}`}
                          name="reason"
                          required
                          minLength={5}
                          maxLength={1000}
                          rows={2}
                          placeholder={
                            review.is_visible
                              ? "Explain the policy violation..."
                              : "Explain why this review should be restored..."
                          }
                          className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>

                      <button
                        type="submit"
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                          review.is_visible
                            ? "bg-destructive text-destructive-foreground hover:opacity-90"
                            : "bg-primary text-primary-foreground hover:opacity-90"
                        }`}
                      >
                        {review.is_visible ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}

                        {review.is_visible ? "Hide review" : "Restore review"}
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent moderation history */}
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b p-5 sm:p-6">
            <h2 className="font-bold">Recent moderation history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The latest recorded hide and restore actions.
            </p>
          </div>

          {logsResult.error ? (
            <p className="p-6 text-sm text-muted-foreground">
              Unable to load moderation history. Check your database
              permissions.
            </p>
          ) : moderationLogs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No moderation actions have been recorded yet.
            </p>
          ) : (
            <div className="divide-y">
              {moderationLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {log.new_visibility ? "Review restored" : "Review hidden"}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {log.reason}
                    </p>

                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      Review ID: {log.review_id}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Admin ID: {log.admin_id}
                    </p>
                  </div>

                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(log.created_at)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
