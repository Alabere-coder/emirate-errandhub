import Link from "next/link";
import { Clock, MessageSquareText, Ticket, Users } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

type SupportTicket = {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function AdminSupportPage() {
  await requireRole(["admin"]);

  const supabase = createAdminClient();

  const { data: ticketData, error: ticketError } = await supabase
    .from("support_tickets")
    .select(
      "id, user_id, category, subject, description, status, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (ticketError) {
    console.error("Failed to load support tickets:", ticketError);
    throw new Error("Unable to load support tickets.");
  }

  const tickets = (ticketData ?? []) as SupportTicket[];

  const userIds = [...new Set(tickets.map((ticket) => ticket.user_id))];

  let profiles: Profile[] = [];

  if (userIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .in("id", userIds);

    if (profileError) {
      console.error("Failed to load support requester profiles:", profileError);
      throw new Error("Unable to load requester details.");
    }

    profiles = (profileData ?? []) as Profile[];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const openCount = tickets.filter((ticket) => ticket.status === "open").length;

  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "in_progress",
  ).length;

  const waitingCount = tickets.filter(
    (ticket) => ticket.status === "waiting_for_user",
  ).length;

  const activeCount = tickets.filter(
    (ticket) =>
      ticket.status === "open" ||
      ticket.status === "in_progress" ||
      ticket.status === "waiting_for_user",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review user support requests, respond to messages, and manage ticket
          statuses.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">All tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tickets.length}</p>
            <p className="text-xs text-muted-foreground">
              Total support requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openCount}</p>
            <p className="text-xs text-muted-foreground">Awaiting support</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Waiting for user
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{waitingCount}</p>
            <p className="text-xs text-muted-foreground">
              Active tickets: {activeCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support tickets</CardTitle>
        </CardHeader>

        <CardContent>
          {tickets.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <h2 className="font-semibold">No support tickets yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tickets submitted by customers and workers will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const requester = profileMap.get(ticket.user_id);

                const requesterName = requester
                  ? `${requester.first_name} ${requester.last_name}`
                  : "Unknown user";

                return (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/admin/support/${ticket.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <h3 className="font-semibold">{ticket.subject}</h3>

                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {ticket.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span>{requesterName}</span>
                          <span className="capitalize">
                            {requester?.role ?? "Unknown role"}
                          </span>
                          <span className="capitalize">
                            {ticket.category.replaceAll("_", " ")}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className="w-fit shrink-0 capitalize"
                      >
                        {formatStatus(ticket.status)}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Updated {formatDate(ticket.updated_at)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
