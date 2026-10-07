"use client";

import { CheckCircle2, Circle } from "lucide-react";

type JobStatusHistoryItem = {
  id: string;
  status: string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

type JobStatusTimelineProps = {
  history: JobStatusHistoryItem[];
};

const STATUS_LABELS: Record<string, string> = {
  assigned: "Job assigned",
  in_progress: "Worker started the job",
  completed: "Job completed",
  cancelled: "Job cancelled",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function JobStatusTimeline({ history }: JobStatusTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm font-medium">No status history yet</p>

        <p className="mt-1 text-sm text-muted-foreground">
          Job activity will appear here as the job progresses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((item, index) => {
        const isLast = index === history.length - 1;

        return (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>

            <div className="pb-6">
              <p className="font-medium">
                {STATUS_LABELS[item.status] ?? item.status}
              </p>

              {item.note && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.note}
                </p>
              )}

              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(item.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
