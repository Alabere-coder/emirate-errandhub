import Link from "next/link";
import { MessageSquare, PlusCircle, Clock } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { createSupportTicket } from "./actions";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SupportTicket = {
  id: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default async function SupportPage() {
  const { user } = await requireRole(["customer", "worker"]);
  const supabase = await createClient();

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select("id, category, subject, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Unable to load support tickets:", error);
  }

  const supportTickets = (tickets ?? []) as SupportTicket[];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Help and assistance
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Contact our support team and track your support requests.
          </p>
        </div>

        <a href="#new-ticket">
          <Button type="button">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create support ticket
          </Button>
        </a>
      </div>

      <Card id="new-ticket">
        <CardHeader>
          <CardTitle>How can we help?</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={createSupportTicket} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Support category
              </label>

              <select
                id="category"
                name="category"
                required
                defaultValue="technical"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="account">Account</option>
                <option value="payments">Payments</option>
                <option value="jobs">Jobs</option>
                <option value="worker">Worker support</option>
                <option value="customer">Customer support</option>
                <option value="technical">Technical issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>

              <input
                id="subject"
                name="subject"
                required
                minLength={5}
                maxLength={150}
                placeholder="Briefly describe your issue"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Describe your issue
              </label>

              <textarea
                id="description"
                name="description"
                required
                minLength={20}
                maxLength={5000}
                rows={5}
                placeholder="Explain what happened and how we can help..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Please provide at least 20 characters.
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Submit support request
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Your support requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View your requests and continue conversations with our team.
          </p>
        </div>

        {supportTickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold">No support tickets yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Submit the form above if you need help.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {supportTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{ticket.subject}</h3>

                    <p className="text-sm capitalize text-muted-foreground">
                      {ticket.category.replaceAll("_", " ")}
                    </p>

                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Created {formatDate(ticket.created_at)}
                    </p>
                  </div>

                  <Badge variant="secondary" className="w-fit capitalize">
                    {formatStatus(ticket.status)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
