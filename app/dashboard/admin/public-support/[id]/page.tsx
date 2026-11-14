import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MessageSquareText,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { PublicSupportReplyForm } from "@/components/dashboard/admin/public-support-reply-form";
import { PublicSupportRetryButton } from "@/components/dashboard/admin/public-support-retry-button";

const statusStyles: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  responded: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
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

const emailStatusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function PublicSupportEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { id } = await params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    notFound();
  }

  const { data: enquiry, error: enquiryError } = await supabase
    .from("public_support_messages")
    .select(
      "id, full_name, email, category, subject, message, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (enquiryError) {
    console.error("Failed to load public support enquiry:", enquiryError);
    throw new Error("Unable to load this public support enquiry.");
  }

  if (!enquiry) {
    notFound();
  }

  const { data: replies, error: repliesError } = await supabase
    .from("public_support_replies")
    .select(
      "id, admin_id, message, email_status, resend_email_id, email_error, sent_at, created_at",
    )
    .eq("enquiry_id", id)
    .order("created_at", { ascending: true });

  if (repliesError) {
    console.error("Failed to load public support replies:", repliesError);
    throw new Error("Unable to load the enquiry reply history.");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href="/dashboard/admin/public-support"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public Support
        </Link>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Public Support Enquiry
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {enquiry.subject}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Submitted {formatDate(enquiry.created_at)}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${
              statusStyles[enquiry.status] ?? "bg-slate-100 text-slate-600"
            }`}
          >
            {statusLabels[enquiry.status] ?? enquiry.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <MessageSquareText className="h-5 w-5 text-emerald-700" />
              <h2 className="font-bold text-slate-950">s Visitor's message</h2>
            </div>

            <div className="mt-6 whitespace-pre-wrap wrap-break-word text-sm leading-8 text-slate-700">
              {enquiry.message}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-700" />
                <h2 className="font-bold text-slate-950">Reply history</h2>
              </div>

              <span className="text-xs font-medium text-slate-500">
                {replies?.length ?? 0}{" "}
                {(replies?.length ?? 0) === 1 ? "reply" : "replies"}
              </span>
            </div>

            {!replies?.length ? (
              <div className="py-10 text-center">
                <MessageSquareText className="mx-auto h-8 w-8 text-slate-300" />

                <h3 className="mt-3 font-semibold text-slate-800">
                  No replies yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your team's email responses will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {replies.map((reply) => (
                  <div key={reply.id} className="py-5 first:pt-5 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Admin response
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          emailStatusStyles[reply.email_status] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Email: {reply.email_status}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700">
                      {reply.message}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p>Created: {formatDate(reply.created_at)}</p>

                      {reply.sent_at && (
                        <p>Sent: {formatDate(reply.sent_at)}</p>
                      )}

                      {reply.resend_email_id && (
                        <p className="break-all">
                          Resend ID: {reply.resend_email_id}
                        </p>
                      )}

                      {reply.email_status === "failed" && (
                        <div className="mt-3 space-y-2">
                          {reply.email_error && (
                            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                              Delivery error: {reply.email_error}
                            </p>
                          )}

                          <PublicSupportRetryButton replyId={reply.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <h2 className="font-bold text-slate-950">
                Reply to this enquiry
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Send your response directly to the visitor's email address. They
                can reply using their normal email client.
              </p>
            </div>

            <PublicSupportReplyForm enquiryId={enquiry.id} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-950">Visitor information</h2>

            <div className="mt-5 space-y-5">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Full name
                  </p>
                  <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">
                    {enquiry.full_name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Email address
                  </p>
                  <a
                    href={`mailto:${enquiry.email}`}
                    className="mt-1 block break-all text-sm font-semibold text-emerald-800 hover:underline"
                  >
                    {enquiry.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Category</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {categoryLabels[enquiry.category] ?? enquiry.category}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Last updated
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(enquiry.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-950">Enquiry details</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Reference</span>
                <span className="max-w-40 break-all text-right font-medium text-slate-700">
                  {enquiry.id}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-800">
                  {statusLabels[enquiry.status] ?? enquiry.status}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
