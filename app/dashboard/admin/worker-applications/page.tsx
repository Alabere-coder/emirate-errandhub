import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getStatusVariant(status: string) {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

export default async function AdminWorkerApplicationsPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: applications, error } = await supabase
    .from("worker_applications")
    .select(
      `
      id,
      user_id,
      status,
      application_note,
      rejection_reason,
      reviewed_at,
      created_at,
      profiles!worker_applications_user_id_fkey (
        first_name,
        last_name,
        phone
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load worker applications error:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Worker Applications
        </h1>

        <p className="mt-1 text-muted-foreground">
          Review and manage applications from people who want to become workers.
        </p>
      </div>

      {!applications || applications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">No worker applications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New worker applications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => {
            const profile = Array.isArray(application.profiles)
              ? application.profiles[0]
              : application.profiles;

            return (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>
                        {profile?.first_name} {profile?.last_name}
                      </CardTitle>

                      {profile?.phone && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {profile.phone}
                        </p>
                      )}
                    </div>

                    <Badge variant={getStatusVariant(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Application</p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {application.application_note}
                    </p>
                  </div>

                  {application.rejection_reason && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                      <p className="text-sm font-medium">Rejection reason</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {application.rejection_reason}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button>
                      <Link
                        href={`/dashboard/admin/worker-applications/${application.id}`}
                      >
                        Review Application
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
