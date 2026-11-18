import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Headset,
  MessageSquareText,
  Ticket,
  Users,
} from "lucide-react";

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
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
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
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "waiting_for_user":
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300";
    case "resolved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "closed":
      return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getRoleLabel(role?: string) {
  if (!role) return "Unknown role";

  return role.replaceAll("_", " ");
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconClassName: string;
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <Headset className="h-3.5 w-3.5" />
              Customer care management
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Support Center
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80 sm:text-base">
              Manage customer and worker enquiries, follow up on outstanding
              requests, and keep every support conversation moving.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <MessageSquareText className="h-5 w-5 text-emerald-100" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{activeCount}</p>
              <p className="text-xs text-emerald-100/75">Active tickets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="All tickets"
          value={tickets.length}
          description="Total support requests"
          icon={Ticket}
          iconClassName="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        />

        <StatCard
          title="Open"
          value={openCount}
          description="Awaiting support"
          icon={MessageSquareText}
          iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
        />

        <StatCard
          title="In progress"
          value={inProgressCount}
          description="Currently being handled"
          icon={Clock}
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
        />

        <StatCard
          title="Waiting for user"
          value={waitingCount}
          description="Awaiting requester response"
          icon={Users}
          iconClassName="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
        />
      </section>

      {/* Ticket list */}
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Support tickets</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Review and manage the latest support conversations.
              </p>
            </div>

            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <MessageSquareText className="h-7 w-7" />
              </div>

              <h2 className="mt-5 font-semibold">No support tickets yet</h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Tickets submitted by customers and workers will appear here. You
                can manage conversations from this page once requests come in.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const requester = profileMap.get(ticket.user_id);

                const requesterName = requester
                  ? `${requester.first_name} ${requester.last_name}`.trim()
                  : "Unknown user";

                return (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/admin/support/${ticket.id}`}
                    className="group block rounded-xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-sm dark:hover:border-emerald-800 dark:hover:bg-emerald-950/10 sm:p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold leading-6 transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                              {ticket.subject}
                            </h3>

                            <Badge
                              variant="outline"
                              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusStyle(ticket.status)}`}
                            >
                              {formatStatus(ticket.status)}
                            </Badge>
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-700 transition-all group-hover:gap-2.5 dark:text-emerald-400">
                          View ticket
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground/80">
                            {requesterName}
                          </span>
                        </span>

                        <span className="capitalize">
                          {getRoleLabel(requester?.role)}
                        </span>

                        <span className="rounded-md bg-muted px-2 py-1 capitalize">
                          {ticket.category.replaceAll("_", " ")}
                        </span>

                        <span className="ml-auto inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Updated {formatDate(ticket.updated_at)}
                        </span>
                      </div>
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
