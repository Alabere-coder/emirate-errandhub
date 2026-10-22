import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MessageSquareText } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupportReplyForm } from "./support-reply-form";

export const dynamic = "force-dynamic";

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

type SupportMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRole(["customer", "worker"]);
  const { id } = await params;

  const supabase = await createClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select(
      "id, user_id, category, subject, description, status, created_at, updated_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ticketError) {
    console.error("Failed to load support ticket:", ticketError);
  }

  if (!ticket) notFound();

  const { data: messages, error: messagesError } = await supabase
    .from("support_ticket_messages")
    .select("id, ticket_id, sender_id, message, created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Failed to load support messages:", messagesError);
  }

  const supportTicket = ticket as SupportTicket;
  const ticketMessages = (messages ?? []) as SupportMessage[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Support Center
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Support ticket</p>
              <CardTitle className="mt-1 text-xl">
                {supportTicket.subject}
              </CardTitle>
            </div>
            <Badge
              variant={
                supportTicket.status === "resolved"
                  ? "default"
                  : supportTicket.status === "open"
                    ? "secondary"
                    : "outline"
              }
            >
              {formatStatus(supportTicket.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="capitalize">
              Category: {supportTicket.category.replaceAll("_", " ")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(supportTicket.created_at).toLocaleString()}
            </span>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium">Your original message</p>
            <p className="whitespace-pre-wrap text-sm leading-6">
              {supportTicket.description}
            </p>
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
          {ticketMessages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">No replies yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Our support team can reply here once they review your ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ticketMessages.map((message) => {
                const isOwnMessage = message.sender_id === user.id;

                return (
                  <div
                    key={message.id}
                    className={`rounded-lg border p-4 ${
                      isOwnMessage ? "bg-primary/5" : "bg-muted/50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {isOwnMessage ? "You" : "Support team"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {supportTicket.status === "resolved" ||
      supportTicket.status === "closed" ? (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          This ticket is {supportTicket.status}. Create a new ticket if you need
          further assistance.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Reply to support</CardTitle>
          </CardHeader>
          <CardContent>
            <SupportReplyForm ticketId={supportTicket.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
