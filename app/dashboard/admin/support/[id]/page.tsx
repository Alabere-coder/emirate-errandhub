import type { ElementType } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Headset,
  MessageSquareText,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";

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
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: string) {
  switch (status) {
    case "open":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300";

    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300";

    case "waiting_for_user":
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/70 dark:bg-purple-950/40 dark:text-purple-300";

    case "resolved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300";

    case "closed":
      return "border-border bg-muted text-muted-foreground";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getRoleLabel(role?: string) {
  if (!role) return "Unknown role";
  return role.replaceAll("_", " ");
}

function getFullName(profile?: Profile) {
  if (!profile) return "Unknown user";
  return `${profile.first_name} ${profile.last_name}`.trim();
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <div className="flex items-start gap-2 text-sm font-medium text-foreground">
        {Icon && (
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <span className="wrap-break-word">{value}</span>
      </div>
    </div>
  );
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
      ...(ticket.assigned_to ? [ticket.assigned_to] : []),
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
  const requesterName = getFullName(requester);

  const assignedAdmin = ticket.assigned_to
    ? profileMap.get(ticket.assigned_to)
    : undefined;

  const isFinal = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Ticket header */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative space-y-5">
          <Link
            href="/dashboard/admin/support"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-100/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to support center
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <Headset className="h-3.5 w-3.5" />
              Support ticket
            </span>

            <Badge
              variant="outline"
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(ticket.status)}`}
            >
              {formatStatus(ticket.status)}
            </Badge>
          </div>

          <div className="max-w-3xl">
            <p className="text-sm capitalize text-emerald-200">
              {ticket.category.replaceAll("_", " ")} enquiry
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {ticket.subject}
            </h1>

            <p className="mt-3 break-all text-xs text-emerald-100/65">
              Ticket reference: {ticket.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-4 text-xs text-emerald-100/80">
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              {requesterName}
            </span>

            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Submitted {formatDate(ticket.created_at)}
            </span>
          </div>
        </div>
      </section>

      {/* Main workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* Original request */}
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                Original request
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 p-5 sm:p-6">
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-foreground">
                {ticket.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Submitted {formatDate(ticket.created_at)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Last updated {formatDate(ticket.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Conversation */}
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquareText className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    Conversation
                  </CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Messages between the requester and support team.
                  </p>
                </div>

                <Badge variant="secondary" className="rounded-full">
                  {messages?.length ?? 0}{" "}
                  {(messages?.length ?? 0) === 1 ? "message" : "messages"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {!messages || messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <MessageSquareText className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 font-semibold text-foreground">
                    No replies yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    This conversation has not received a reply. Use the
                    management section below to respond to the requester.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message) => {
                    const sender = profileMap.get(message.sender_id);
                    const senderName = getFullName(sender);
                    const isAdmin = sender?.role === "admin";

                    return (
                      <div
                        key={message.id}
                        className={`rounded-xl border p-4 sm:p-5 ${
                          isAdmin
                            ? "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/15"
                            : "border-border/70 bg-muted/20"
                        }`}
                      >
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                isAdmin
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isAdmin ? (
                                <ShieldCheck className="h-4 w-4" />
                              ) : (
                                <UserRound className="h-4 w-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {senderName}
                              </p>

                              <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                                {isAdmin
                                  ? "Emirate ErrandHub Support"
                                  : getRoleLabel(sender?.role)}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.created_at)}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-foreground">
                          {message.message}
                        </p>

                        {isAdmin && (
                          <div className="mt-4 border-t border-emerald-200/70 pt-3 dark:border-emerald-900/50">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Support team response
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket controls */}
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <Headset className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                Manage ticket
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Respond to the requester and manage this ticket&apos;s status.
              </p>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              {isFinal && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />

                  <div>
                    <p className="text-sm font-semibold capitalize text-emerald-800 dark:text-emerald-300">
                      Ticket {ticket.status}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-emerald-800/80 dark:text-emerald-200/70">
                      Replies are disabled until the ticket is reopened. You can
                      use the controls below to manage its status.
                    </p>
                  </div>
                </div>
              )}

              <AdminSupportControls
                ticketId={ticket.id}
                currentStatus={ticket.status}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                Requester
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <UserRound className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {requesterName}
                  </p>

                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {getRoleLabel(requester?.role)}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  User ID
                </p>

                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                  {ticket.user_id}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-4">
              <CardTitle className="text-base">Ticket details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              <DetailItem
                label="Category"
                value={ticket.category.replaceAll("_", " ")}
              />

              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current status
                </p>

                <Badge
                  variant="outline"
                  className={`rounded-full border px-3 py-1 capitalize ${getStatusStyle(ticket.status)}`}
                >
                  {formatStatus(ticket.status)}
                </Badge>
              </div>

              <DetailItem
                label="Assigned admin"
                value={
                  ticket.assigned_to
                    ? assignedAdmin
                      ? getFullName(assignedAdmin)
                      : "Admin assigned"
                    : "Unassigned"
                }
                icon={ShieldCheck}
              />

              <DetailItem
                label="Submitted"
                value={formatDate(ticket.created_at)}
                icon={CalendarDays}
              />

              <DetailItem
                label="Last updated"
                value={formatDate(ticket.updated_at)}
                icon={Clock}
              />
            </CardContent>
          </Card>

          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/15">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Support responsibility
            </div>

            <p className="mt-2 text-xs leading-5 text-emerald-800/75 dark:text-emerald-200/70">
              Keep responses clear and professional. Update the ticket status as
              the conversation progresses so the support team can track
              outstanding requests.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
