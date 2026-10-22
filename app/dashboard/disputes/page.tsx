import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "rejected"
  | "closed";

type DisputeRow = {
  id: string;
  job_id: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  created_at: string;
  updated_at: string;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusVariant(
  status: DisputeStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "resolved":
      return "default";
    case "rejected":
      return "destructive";
    case "under_review":
      return "secondary";
    default:
      return "outline";
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function MyDisputesPage() {
  const { user, supabase } = await requireRole(["customer", "worker"]);

  const { data: disputes, error } = await supabase
    .from("disputes")
    .select(
      "id, job_id, reason, description, status, resolution, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("My disputes query failed:", error.message);

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Disputes</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-700">
              We couldn't load your disputes. Please refresh the page and try
              again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const disputeList = (disputes ?? []) as DisputeRow[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Disputes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your reported issues and see the latest decisions.
          </p>
        </div>

        <Button variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      {disputeList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <ShieldAlert className="h-10 w-10 text-slate-400" />

            <h2 className="text-lg font-semibold">No disputes yet</h2>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              Disputes you open for your jobs will appear here, along with their
              latest status and any recorded resolution.
            </p>

            <Button variant="outline">
              <Link href="/dashboard">Return to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputeList.map((dispute) => (
            <Card key={dispute.id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {dispute.reason}
                    </CardTitle>

                    <p className="text-xs text-slate-500">
                      Dispute reference: {dispute.id}
                    </p>
                  </div>

                  <Badge variant={statusVariant(dispute.status)}>
                    {formatStatus(dispute.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {dispute.description}
                </p>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Opened {formatDate(dispute.created_at)}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Updated {formatDate(dispute.updated_at)}
                  </span>
                </div>

                {dispute.resolution && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold">Admin resolution</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {dispute.resolution}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    <Link href={`/dashboard/disputes/${dispute.id}`}>
                      View details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
