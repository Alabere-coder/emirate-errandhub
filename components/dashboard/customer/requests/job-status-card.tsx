import { CheckCircle2, Clock3, LoaderCircle, XCircle } from "lucide-react";

type JobStatusCardProps = {
  status: string;
  agreedAmount: number;
  currency: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(value: string | null) {
  if (!value) return "Not yet";

  return new Date(value).toLocaleString();
}

export function JobStatusCard({
  status,
  agreedAmount,
  currency,
  scheduledAt,
  startedAt,
  completedAt,
}: JobStatusCardProps) {
  const label = statusLabels[status] ?? status.replaceAll("_", " ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Job status</p>

          <h2 className="text-xl font-semibold capitalize">{label}</h2>
        </div>

        <div className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium capitalize">
          {label}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-muted-foreground" />

            <span className="text-sm font-medium">Scheduled</span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(scheduledAt)}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 text-muted-foreground" />

            <span className="text-sm font-medium">Started</span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(startedAt)}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />

            <span className="text-sm font-medium">Completed</span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(completedAt)}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Agreed Amount</p>

          <p className="mt-2 text-lg font-semibold">
            {currency} {Number(agreedAmount).toLocaleString()}
          </p>
        </div>
      </div>

      {status === "assigned" && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm">
          Your quotation has been accepted. The worker has been assigned to your
          request.
        </div>
      )}

      {status === "in_progress" && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
          The worker has started working on your request.
        </div>
      )}

      {status === "completed" && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm">
          This job has been completed.
        </div>
      )}

      {status === "cancelled" && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
          <XCircle className="h-4 w-4" />
          This job has been cancelled.
        </div>
      )}
    </div>
  );
}
