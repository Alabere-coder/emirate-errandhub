import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, MapPin, Wallet } from "lucide-react";
import { JobStatusActions } from "@/components/dashboard/worker/jobs/job-status-actions";
import { ChatBox } from "@/components/dashboard/shared/chat-box";

type WorkerJobPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function WorkerJobDetailPage({
  params,
}: WorkerJobPageProps) {
  const { id } = await params;

  const { user, supabase } = await requireRole(["worker"]);

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile lookup error:", workerProfileError);
  }

  if (!workerProfile) {
    notFound();
  }

  const { data: job, error } = await supabase
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
    .eq("id", id)
    .eq("worker_id", workerProfile.id)
    .maybeSingle();

  if (error) {
    console.error("Worker job lookup error:", error);
  }

  if (!job) {
    notFound();
  }

  const request = Array.isArray(job.service_requests)
    ? job.service_requests[0]
    : job.service_requests;

  const status = statusLabels[job.status] ?? job.status.replaceAll("_", " ");

  let conversation = null;
  let conversationMessages: Array<{
    id: string;
    message: string | null;
    sender_id: string;
    created_at: string;
  }> = [];

  const { data: conversationData, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("job_id", job.id)
    .maybeSingle();

  if (conversationError) {
    console.error("Conversation lookup error:", conversationError);
  }

  conversation = conversationData;

  if (conversation?.id) {
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(
        `
        id,
        message,
        sender_id,
        created_at
      `,
      )
      .eq("conversation_id", conversation.id)
      .order("created_at", {
        ascending: true,
      });

    if (messagesError) {
      console.error("Messages lookup error:", messagesError);
    } else {
      conversationMessages = messages ?? [];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" className="mb-4 -ml-3">
          <Link href="/dashboard/worker/jobs/my">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Jobs
          </Link>
        </Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {request?.title ?? "Service Job"}
            </h1>

            <p className="text-muted-foreground">
              Manage this assigned service job.
            </p>
          </div>

          <span className="w-fit rounded-full bg-muted px-4 py-2 text-sm font-medium capitalize">
            {status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Request</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {request?.description || "No description provided."}
                </p>
              </div>

              {request?.is_urgent && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  This is an urgent service request.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Location</p>

                  <div className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      {request?.address || "Address not provided"}
                      {request?.city && (
                        <>
                          <br />
                          {request.city}
                          {request.state ? `, ${request.state}` : ""}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Preferred Schedule</p>

                  <div className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      {request?.preferred_date || "Date not specified"}
                      {request?.preferred_time && (
                        <>
                          <br />
                          {request.preferred_time}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>

            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Job ID</dt>
                  <dd className="mt-1 break-all text-sm font-medium">
                    {job.id}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Request ID</dt>
                  <dd className="mt-1 break-all text-sm font-medium">
                    {job.request_id}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Assigned</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {new Date(job.created_at).toLocaleString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {new Date(job.updated_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Agreed Payment</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-3">
                  <Wallet className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-2xl font-bold">
                    {job.currency} {Number(job.agreed_amount).toLocaleString()}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Agreed job amount
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Job Actions</CardTitle>
            </CardHeader>

            <CardContent>
              <JobStatusActions jobId={job.id} status={job.status} />
            </CardContent>
          </Card>

          {conversation && (
            <ChatBox
              conversationId={conversation.id}
              currentUserId={user.id}
              initialMessages={conversationMessages}
            />
          )}
        </div>
      </div>
    </div>
  );
}
