import Link from "next/link";
import { ArrowRight, Inbox, Mail, MessageSquareText } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

const statusStyles: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  responded: "bg-emerald-50 text-emerald-700",
  closed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  responded: "Responded",
  closed: "Closed",
};

const categoryLabels: Record<string, string> = {
  customer_support: "Customer Support",
  service_provider_support: "Service Provider Support",
  general_enquiry: "General Enquiry",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function PublicSupportPage() {
  const { supabase } = await requireRole(["admin", "super_admin"]);

  const { data: enquiries, error } = await supabase
    .from("public_support_messages")
    .select(
      "id, full_name, email, category, subject, message, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load public support enquiries:", error);

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-bold text-red-900">
          Unable to load public enquiries
        </h2>
        <p className="mt-2 text-sm text-red-700">
          Something went wrong while loading the support inbox. Please refresh
          the page and try again.
        </p>
      </div>
    );
  }

  const allEnquiries = enquiries ?? [];

  const openCount = allEnquiries.filter(
    (item) => item.status === "open",
  ).length;

  const inProgressCount = allEnquiries.filter(
    (item) => item.status === "in_progress",
  ).length;

  const respondedCount = allEnquiries.filter(
    (item) => item.status === "responded",
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Inbox className="h-4 w-4" />
            Admin / Public Support
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Public Support Inbox
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage enquiries submitted by visitors through the public Contact
            page. Replies are sent directly to visitors by email.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border   border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground">
          <MessageSquareText className="h-4 w-4 text-emerald-700" />
          {allEnquiries.length}{" "}
          {allEnquiries.length === 1 ? "Enquiry" : "Enquiries"}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border   border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Total enquiries
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {allEnquiries.length}
          </p>
        </div>

        <div className="rounded-2xl border   border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Open</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{openCount}</p>
        </div>

        <div className="rounded-2xl border   border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            In progress
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-2xl border   border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Responded</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {respondedCount}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border   border-border bg-card">
        <div className="border-b   border-border px-5 py-5 sm:px-6">
          <h2 className="font-bold text-slate-950">All enquiries</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Newest enquiries appear first.
          </p>
        </div>

        {allEnquiries.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-bold text-slate-950">No enquiries yet</h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Public messages submitted through your Contact page will appear
              here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allEnquiries.map((enquiry) => (
              <Link
                key={enquiry.id}
                href={`/dashboard/admin/public-support/${enquiry.id}`}
                className="group block px-5 py-5 transition hover:bg-muted sm:px-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-950 transition group-hover:text-emerald-800">
                        {enquiry.subject}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusStyles[enquiry.status] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {statusLabels[enquiry.status] ?? enquiry.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {enquiry.full_name}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {enquiry.email}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {enquiry.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {categoryLabels[enquiry.category] ?? enquiry.category}
                      </span>
                      <span>•</span>
                      <span>{formatDate(enquiry.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-800">
                    View enquiry
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
