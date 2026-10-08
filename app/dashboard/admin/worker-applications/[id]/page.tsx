import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { WorkerApplicationActions } from "../worker-application-actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkerApplicationReviewPage({
  params,
}: PageProps) {
  await requireRole(["admin"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("worker_applications")
    .select(
      `
      id,
      user_id,
      status,
      application_note,
      rejection_reason,
      reviewed_by,
      reviewed_at,
      created_at
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Load worker application error:", error);
  }

  if (!application) {
    notFound();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      first_name,
      last_name,
      phone,
      avatar_url,
      role,
      is_active
    `,
    )
    .eq("id", application.user_id)
    .maybeSingle();

  if (profileError) {
    console.error("Load applicant profile error:", profileError);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost">
          <Link href="/dashboard/admin/worker-applications">
            ← Applications
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Review Worker Application
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>
                {profile?.first_name} {profile?.last_name}
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {profile?.phone ?? "No phone number"}
              </p>
            </div>

            <Badge>{application.status}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium">Application statement</p>

            <div className="mt-2 rounded-lg border p-4">
              <p className="whitespace-pre-wrap text-sm">
                {application.application_note}
              </p>
            </div>
          </div>

          {application.rejection_reason && (
            <div>
              <p className="text-sm font-medium">Previous rejection reason</p>

              <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm">{application.rejection_reason}</p>
              </div>
            </div>
          )}

          {application.status === "pending" && (
            <WorkerApplicationActions applicationId={application.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
