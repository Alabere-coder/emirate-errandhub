import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { manageReviewReport } from "@/lib/actions/manage-review-report";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  under_review: "Under review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const reasonLabels: Record<string, string> = {
  abusive: "Abusive or offensive",
  fraudulent: "False or fraudulent",
  spam: "Spam",
  irrelevant: "Irrelevant",
  other: "Other",
};

export default async function AdminReviewReportsPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from("review_reports")
    .select(
      "id, review_id, reporter_id, reason, details, status, admin_notes, reviewed_by, reviewed_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Loading review reports failed:", error.code);

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Review reports</h1>
        <p className="mt-3 text-destructive">
          Unable to load reports. Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  const reviewIds = [...new Set((reports ?? []).map((r) => r.review_id))];

  const { data: reviews } = reviewIds.length
    ? await supabase
        .from("reviews")
        .select("id, rating, comment, is_visible, worker_id")
        .in("id", reviewIds)
    : { data: [] };

  const reviewMap = new Map(
    (reviews ?? []).map((review) => [review.id, review]),
  );

  const reporterIds = [...new Set((reports ?? []).map((r) => r.reporter_id))];

  const { data: reporters } = reporterIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", reporterIds)
    : { data: [] };

  const reporterMap = new Map(
    (reporters ?? []).map((profile) => [
      profile.id,
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
    ]),
  );

  const pendingCount = (reports ?? []).filter(
    (report) => report.status === "pending",
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Investigate reported reviews and record your decisions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Total reports</p>
          <p className="mt-2 text-3xl font-bold">{reports?.length ?? 0}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Awaiting review</p>
          <p className="mt-2 text-3xl font-bold">{pendingCount}</p>
        </div>
      </div>

      {!reports?.length ? (
        <div className="rounded-xl border p-8 text-center">
          <h2 className="font-semibold">No reports yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reports submitted by users will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const review = reviewMap.get(report.review_id);
            const reporter =
              reporterMap.get(report.reporter_id) || "Unknown user";

            return (
              <article
                key={report.id}
                className="space-y-4 rounded-xl border p-4 md:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      {reasonLabels[report.reason] ?? report.reason}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reported by {reporter}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleString("en-NG")}
                    </p>
                  </div>

                  <span className="rounded-full border px-3 py-1 text-xs font-medium">
                    {statusLabels[report.status] ?? report.status}
                  </span>
                </div>

                {report.details && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Report details
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {report.details}
                    </p>
                  </div>
                )}

                <div className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Reported review
                  </p>

                  {review ? (
                    <>
                      <p className="mt-2">Rating: {review.rating}/5</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {review.comment || "No written comment."}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Public visibility:{" "}
                        {review.is_visible ? "Visible" : "Hidden"}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      The associated review could not be loaded.
                    </p>
                  )}
                </div>

                {report.admin_notes && (
                  <p className="text-sm">
                    <span className="font-medium">Previous admin notes:</span>{" "}
                    {report.admin_notes}
                  </p>
                )}

                {report.status !== "resolved" &&
                  report.status !== "dismissed" && (
                    <form
                      action={manageReviewReport}
                      className="space-y-3 border-t pt-4"
                    >
                      <input type="hidden" name="report_id" value={report.id} />

                      <div className="space-y-1">
                        <label
                          htmlFor={`notes-${report.id}`}
                          className="text-sm font-medium"
                        >
                          Admin notes
                        </label>
                        <textarea
                          id={`notes-${report.id}`}
                          name="admin_notes"
                          maxLength={1000}
                          defaultValue={report.admin_notes ?? ""}
                          rows={3}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Record your findings or decision."
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          name="status"
                          value="under_review"
                          type="submit"
                          className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                          Mark under review
                        </button>

                        <button
                          name="status"
                          value="resolved"
                          type="submit"
                          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
                        >
                          Resolve report
                        </button>

                        <button
                          name="status"
                          value="dismissed"
                          type="submit"
                          className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                          Dismiss report
                        </button>
                      </div>
                    </form>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
