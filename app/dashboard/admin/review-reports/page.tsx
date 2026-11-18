import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  MessageSquareText,
  ShieldCheck,
  ShieldX,
  Star,
  Users,
} from "lucide-react";

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

const statusStyles: Record<string, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
  under_review:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400",
  resolved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  dismissed:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const reasonLabels: Record<string, string> = {
  abusive: "Abusive or offensive",
  fraudulent: "False or fraudulent",
  spam: "Spam",
  irrelevant: "Irrelevant",
  other: "Other",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

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
      <div className="space-y-5 p-4 md:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600 dark:text-red-400" />
            <div>
              <h1 className="font-semibold text-red-800 dark:text-red-300">
                Unable to load review reports
              </h1>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                Please refresh the page or try again later.
              </p>
            </div>
          </div>
        </div>
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

  const totalCount = reports?.length ?? 0;

  const pendingCount = (reports ?? []).filter(
    (report) => report.status === "pending",
  ).length;

  const underReviewCount = (reports ?? []).filter(
    (report) => report.status === "under_review",
  ).length;

  const completedCount = (reports ?? []).filter(
    (report) => report.status === "resolved" || report.status === "dismissed",
  ).length;

  return (
    <div className="space-y-7 p-4 md:p-6">
      {/* Page heading */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 size-56 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <ShieldCheck className="size-3.5" />
              Trust & Safety
            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Review reports
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80 md:text-base">
              Investigate reported reviews, protect the integrity of your
              marketplace, and keep track of moderation decisions.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="rounded-xl bg-white/10 p-3">
              <FileWarning className="size-6 text-emerald-200" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{pendingCount}</p>
              <p className="text-xs text-emerald-100/80">Awaiting attention</p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total reports"
          value={totalCount}
          description="All submitted reports"
          icon={FileWarning}
          iconClass="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
        />

        <SummaryCard
          label="Pending"
          value={pendingCount}
          description="Waiting for investigation"
          icon={Clock3}
          iconClass="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
        />

        <SummaryCard
          label="Under review"
          value={underReviewCount}
          description="Currently being investigated"
          icon={AlertCircle}
          iconClass="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
        />

        <SummaryCard
          label="Completed"
          value={completedCount}
          description="Resolved or dismissed"
          icon={CheckCircle2}
          iconClass="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
        />
      </section>

      {/* Reports */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Submitted reports
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review each report and record the appropriate action.
            </p>
          </div>

          <p className="text-xs font-medium text-muted-foreground">
            {totalCount} {totalCount === 1 ? "report" : "reports"} found
          </p>
        </div>

        {!reports?.length ? (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ShieldCheck className="size-7" />
            </div>

            <h3 className="mt-4 font-semibold">No reports yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Reports submitted by users will appear here. There is nothing
              requiring your attention right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const review = reviewMap.get(report.review_id);
              const reporter =
                reporterMap.get(report.reporter_id) || "Unknown user";

              const statusStyle =
                statusStyles[report.status] ??
                "border-border bg-muted text-muted-foreground";

              const isClosed =
                report.status === "resolved" || report.status === "dismissed";

              return (
                <article
                  key={report.id}
                  className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  {/* Report header */}
                  <div className="flex flex-col justify-between gap-4 border-b bg-muted/20 p-4 sm:flex-row sm:items-start md:p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        <FileWarning className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold leading-6">
                          {reasonLabels[report.reason] ?? report.reason}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3.5" />
                            Reported by {reporter}
                          </span>
                          <span className="hidden sm:inline">·</span>
                          <span>{formatDate(report.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyle}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {statusLabels[report.status] ?? report.status}
                    </span>
                  </div>

                  <div className="space-y-5 p-4 md:p-5">
                    {/* Report details */}
                    {report.details && (
                      <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/10">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
                          <MessageSquareText className="size-4" />
                          Report details
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                          {report.details}
                        </p>
                      </div>
                    )}

                    {/* Reported review */}
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="flex items-center gap-2 text-sm font-semibold">
                          <MessageSquareText className="size-4 text-emerald-700 dark:text-emerald-400" />
                          Reported review
                        </h4>

                        {review && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              review.is_visible
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {review.is_visible ? "Public" : "Hidden"}
                          </span>
                        )}
                      </div>

                      {review ? (
                        <div className="mt-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star
                                key={index}
                                className={`size-4 ${
                                  index < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/25"
                                }`}
                              />
                            ))}

                            <span className="ml-2 text-sm font-semibold tabular-nums">
                              {review.rating}/5
                            </span>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {review.comment || "No written comment."}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          The associated review could not be loaded.
                        </p>
                      )}
                    </div>

                    {/* Previous admin notes */}
                    {report.admin_notes && (
                      <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/10">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-400">
                          Previous admin notes
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {report.admin_notes}
                        </p>
                      </div>
                    )}

                    {/* Moderation actions */}
                    {!isClosed && (
                      <form
                        action={manageReviewReport}
                        className="space-y-4 border-t pt-5"
                      >
                        <input
                          type="hidden"
                          name="report_id"
                          value={report.id}
                        />

                        <div className="space-y-2">
                          <label
                            htmlFor={`notes-${report.id}`}
                            className="text-sm font-semibold"
                          >
                            Admin notes
                          </label>

                          <textarea
                            id={`notes-${report.id}`}
                            name="admin_notes"
                            maxLength={1000}
                            defaultValue={report.admin_notes ?? ""}
                            rows={3}
                            className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-600/20"
                            placeholder="Record your findings, investigation or decision..."
                          />

                          <p className="text-xs text-muted-foreground">
                            These notes help maintain a record of moderation
                            decisions.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            name="status"
                            value="under_review"
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/60"
                          >
                            <Clock3 className="size-4" />
                            Mark under review
                          </button>

                          <button
                            name="status"
                            value="resolved"
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                          >
                            <CheckCircle2 className="size-4" />
                            Resolve report
                          </button>

                          <button
                            name="status"
                            value="dismissed"
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <ShieldX className="size-4" />
                            Dismiss report
                          </button>
                        </div>
                      </form>
                    )}

                    {isClosed && (
                      <div className="flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        This report has been{" "}
                        {report.status === "resolved"
                          ? "resolved"
                          : "dismissed"}
                        .
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
