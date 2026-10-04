import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, CalendarDays, MapPin } from "lucide-react";

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function WorkerMyJobsPage() {
  const { user, supabase } = await requireRole(["worker"]);

  // jobs.worker_id references worker_profiles.id,
  // not auth.users.id.
  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile lookup error:", workerProfileError);
  }

  if (!workerProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My Jobs</h1>
          <p className="text-muted-foreground">
            Jobs assigned to you will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Your worker profile has not been set up yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      request_id,
      quote_id,
      customer_id,
      worker_id,
      agreed_amount,
      currency,
      status,
      scheduled_at,
      started_at,
      completed_at,
      created_at,
      updated_at,
      service_requests (
        id,
        title,
        description,
        address,
        city,
        state,
        preferred_date,
        preferred_time,
        is_urgent
      )
    `,
    )
    .eq("worker_id", workerProfile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Worker jobs error:", error);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My Jobs</h1>
          <p className="text-muted-foreground">
            Jobs assigned to you will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Unable to load your jobs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Jobs</h1>
        <p className="text-muted-foreground">
          Manage the service jobs assigned to you.
        </p>
      </div>

      {!jobs || jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

            <h2 className="text-lg font-semibold">No assigned jobs yet</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              When a customer accepts one of your quotations, the job will
              appear here.
            </p>

            <Button className="mt-6">
              <Link href="/dashboard/worker/jobs">Browse Available Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const request = Array.isArray(job.service_requests)
              ? job.service_requests[0]
              : job.service_requests;

            const status =
              statusLabels[job.status] ?? job.status.replaceAll("_", " ");

            return (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {request?.title ?? "Service Job"}
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {request?.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {request?.city && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {request.city}
                              {request.state ? `, ${request.state}` : ""}
                            </span>
                          </div>
                        )}

                        {job.scheduled_at && (
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              {new Date(job.scheduled_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <div className="text-lg font-semibold">
                        {job.currency}{" "}
                        {Number(job.agreed_amount).toLocaleString()}
                      </div>

                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                        {status}
                      </span>

                      <Button>
                        <Link href={`/dashboard/worker/jobs/my/${job.id}`}>
                          View Job
                        </Link>
                      </Button>
                    </div>
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
