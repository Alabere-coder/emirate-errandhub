import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import ReviewForm from "./review-form";

type ReviewPageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function CustomerJobReviewPage({
  params,
}: ReviewPageProps) {
  const { jobId } = await params;
  const { user, supabase } = await requireRole(["customer"]);

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (jobError) {
    console.error("Load review job error:", jobError);
    throw new Error("Unable to load this job. Please try again.");
  }

  if (!job) {
    notFound();
  }

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, job_id, rating, comment, created_at")
    .eq("job_id", job.id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (reviewError) {
    console.error("Load existing review error:", reviewError);
    throw new Error("Unable to load your review. Please try again.");
  }

  const existingReview = review
    ? {
        rating: review.rating,
        comment: review.comment,
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-10">
      <div>
        <Button variant="ghost" className="mb-3 -ml-3">
          <Link href="/dashboard/customer/jobs">← Back to My Jobs</Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">
          {existingReview ? "Edit Your Review" : "Rate Your Service Provider"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {existingReview
            ? "Update your rating or comment below."
            : "Share honest feedback about your completed service."}
        </p>
      </div>

      {job.status !== "completed" ? (
        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-6">
            <h2 className="font-semibold">Review not available yet</h2>

            <p className="text-sm leading-6 text-muted-foreground">
              You can rate your service provider once this job is marked as
              completed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ReviewForm
          key={review?.id ?? `new-${job.id}`}
          jobId={job.id}
          existingReview={existingReview}
        />
      )}
    </div>
  );
}
