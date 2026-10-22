import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MessageSquareText, UserRound } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdminSupportControls } from "./admin-support-controls";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select(
      "id, user_id, category, subject, description, status, assigned_to, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (ticketError || !ticket) {
    notFound();
  }

  const { data: messages, error: messagesError } = await supabase
    .from("support_ticket_messages")
    .select("id, ticket_id, sender_id, message, created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error("Unable to load support ticket messages.");
  }

  const senderIds = [
    ...new Set([
      ticket.user_id,
      ...(messages ?? []).map((message) => message.sender_id),
    ]),
  ];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .in("id", senderIds);

  if (profilesError) {
    throw new Error("Unable to load support ticket participants.");
  }

  const profileMap = new Map<string, Profile>(
    ((profiles ?? []) as Profile[]).map((profile) => [profile.id, profile]),
  );

  const requester = profileMap.get(ticket.user_id);
  const requesterName = requester
    ? `${requester.first_name} ${requester.last_name}`
    : "Unknown user";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/dashboard/admin/support"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to support tickets
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm capitalize text-muted-foreground">
            {ticket.category.replaceAll("_", " ")} support request
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {ticket.subject}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ticket ID: {ticket.id}
          </p>
        </div>

        <Badge variant="secondary" className="w-fit capitalize">
          {formatStatus(ticket.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Original request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                {ticket.description}
              </p>

              <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                Submitted {formatDate(ticket.created_at)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5" />
                Conversation
              </CardTitle>
            </CardHeader>

            <CardContent>
              {!messages || messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No replies yet. Send a reply below to assist the user.
                </p>
              ) : (
                <div className="space-y-5">
                  {messages.map((message) => {
                    const sender = profileMap.get(message.sender_id);
                    const senderName = sender
                      ? `${sender.first_name} ${sender.last_name}`
                      : "Unknown user";
                    const isAdmin = sender?.role === "admin";

                    return (
                      <div key={message.id} className="rounded-lg border p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {senderName}
                            </span>
                            <Badge variant="outline" className="capitalize">
                              {isAdmin
                                ? "Support team"
                                : (sender?.role ?? "User")}
                            </Badge>
                          </div>

                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.created_at)}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                          {message.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.status !== "resolved" && ticket.status !== "closed" && (
            <Card>
              <CardHeader>
                <CardTitle>Manage ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminSupportControls
                  ticketId={ticket.id}
                  currentStatus={ticket.status}
                />
              </CardContent>
            </Card>
          )}

          {(ticket.status === "resolved" || ticket.status === "closed") && (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <p className="text-sm text-muted-foreground">
                  This ticket is {ticket.status}. Replies are disabled until the
                  ticket is reopened.
                </p>

                <AdminSupportControls
                  ticketId={ticket.id}
                  currentStatus={ticket.status}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Requester
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="font-medium">{requesterName}</p>
              <p className="text-sm capitalize text-muted-foreground">
                {requester?.role ?? "Unknown role"}
              </p>
              <p className="break-all text-xs text-muted-foreground">
                User ID: {ticket.user_id}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="mt-1 capitalize">
                  {ticket.category.replaceAll("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="mt-1 capitalize">{formatStatus(ticket.status)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Last updated</p>
                <p className="mt-1">{formatDate(ticket.updated_at)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Assigned admin</p>
                <p className="mt-1">
                  {ticket.assigned_to
                    ? profileMap.get(ticket.assigned_to)
                      ? `${profileMap.get(ticket.assigned_to)?.first_name} ${profileMap.get(ticket.assigned_to)?.last_name}`
                      : "Admin assigned"
                    : "Unassigned"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
