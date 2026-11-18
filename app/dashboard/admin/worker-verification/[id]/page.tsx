import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  ShieldCheck,
  ShieldX,
  UserRound,
  BriefcaseBusiness,
  Phone,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerDocumentActions } from "@/components/dashboard/admin/worker-verification/worker-document-actions";
import { DocumentPreview } from "@/components/dashboard/admin/worker-verification/document-preview";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

function getVerificationStyle(status: string) {
  switch (status) {
    case "verified":
    case "approved":
      return {
        label: status.replaceAll("_", " "),
        icon: CheckCircle2,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
      };

    case "rejected":
      return {
        label: "Rejected",
        icon: ShieldX,
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400",
      };

    default:
      return {
        label: status.replaceAll("_", " "),
        icon: Clock3,
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
      };
  }
}

function getDocumentStyle(status: string) {
  switch (status) {
    case "approved":
      return {
        icon: CheckCircle2,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
      };

    case "rejected":
      return {
        icon: ShieldX,
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400",
      };

    default:
      return {
        icon: Clock3,
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
      };
  }
}

export default async function WorkerVerificationDetailPage({
  params,
}: PageProps) {
  await requireRole(["admin"]);

  const { id: workerId } = await params;

  const supabase = await createClient();

  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select(
      `
      id,
      user_id,
      verification_status,
      bio,
      years_of_experience,
      starting_price,
      currency,
      profiles!worker_profiles_user_id_fkey (
        first_name,
        last_name,
        phone
      )
    `,
    )
    .eq("id", workerId)
    .maybeSingle();

  if (workerError) {
    throw new Error("Unable to load worker.");
  }

  if (!worker) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/dashboard/admin/worker-verification"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Worker Verification
        </Link>

        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800">
            <UserRound className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-xl font-bold">Worker Not Found</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            This worker profile could not be found or may no longer be
            available.
          </p>
        </div>
      </div>
    );
  }

  const { data: documents, error: documentsError } = await supabase
    .from("worker_documents")
    .select(
      `
        id,
        document_type,
        file_url,
        status,
        rejection_reason,
        reviewed_by,
        reviewed_at,
        created_at
      `,
    )
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });

  if (documentsError) {
    throw new Error("Unable to load worker documents.");
  }

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (document) => {
      const { data } = await supabase.storage
        .from("worker-documents")
        .createSignedUrl(document.file_url, 60 * 10);

      return {
        ...document,
        signed_url: data?.signedUrl ?? null,
      };
    }),
  );

  const profile = Array.isArray(worker.profiles)
    ? worker.profiles[0]
    : worker.profiles;

  const workerName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Unnamed Worker";

  const verificationStyle = getVerificationStyle(worker.verification_status);

  const VerificationIcon = verificationStyle.icon;

  const approvedDocuments = documentsWithUrls.filter(
    (document) => document.status === "approved",
  ).length;

  const pendingDocuments = documentsWithUrls.filter(
    (document) => document.status === "pending",
  ).length;

  const rejectedDocuments = documentsWithUrls.filter(
    (document) => document.status === "rejected",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg shadow-emerald-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-inner">
              <UserRound className="h-7 w-7" />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Worker Verification
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {workerName}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80">
                Review the worker&apos;s profile and submitted documents to
                assess their verification application.
              </p>
            </div>
          </div>

          <div
            className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold capitalize ${
              worker.verification_status === "verified" ||
              worker.verification_status === "approved"
                ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                : worker.verification_status === "rejected"
                  ? "border-red-300/30 bg-red-400/15 text-red-100"
                  : "border-amber-300/30 bg-amber-400/15 text-amber-100"
            }`}
          >
            <VerificationIcon className="h-4 w-4" />
            {verificationStyle.label}
          </div>
        </div>
      </div>

      {/* Worker information */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">Worker Information</h2>
              <p className="text-xs text-muted-foreground">
                Personal and professional details
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Full Name
              </p>
              <p className="mt-1.5 text-sm font-semibold">{workerName}</p>
            </div>

            {profile?.phone && (
              <div>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  Phone Number
                </p>
                <p className="mt-1.5 text-sm font-semibold">{profile.phone}</p>
              </div>
            )}

            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Experience
              </p>
              <p className="mt-1.5 text-sm font-semibold">
                {worker.years_of_experience} years
              </p>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verification Status
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${verificationStyle.className}`}
              >
                <VerificationIcon className="h-3.5 w-3.5" />
                {verificationStyle.label}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
              <FileCheck2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">Worker Bio</h2>
              <p className="text-xs text-muted-foreground">
                About this service provider
              </p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {worker.bio || "No bio provided."}
          </p>
        </div>
      </div>

      {/* Submitted documents */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <FileCheck2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold">Submitted Documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review each document individually before making a decision.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <FileText className="h-3.5 w-3.5" />
            {documentsWithUrls.length}{" "}
            {documentsWithUrls.length === 1 ? "document" : "documents"}
          </span>
        </div>

        {documentsWithUrls.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800">
              <FileText className="h-8 w-8" />
            </div>

            <h3 className="mt-5 font-semibold">No Documents Submitted</h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              This worker has not submitted any verification documents yet.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {documentsWithUrls.map((document) => {
              const documentStyle = getDocumentStyle(document.status);
              const DocumentStatusIcon = documentStyle.icon;

              return (
                <div key={document.id} className="space-y-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="font-semibold capitalize">
                          {document.document_type.replaceAll("_", " ")}
                        </h3>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Submitted {formatDate(document.created_at)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${documentStyle.className}`}
                    >
                      <DocumentStatusIcon className="h-3.5 w-3.5" />
                      {document.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  {document.signed_url ? (
                    /\.(jpg|jpeg|png|webp)$/i.test(document.file_url) ? (
                      <DocumentPreview
                        url={document.signed_url}
                        documentType={document.document_type}
                      />
                    ) : /\.pdf$/i.test(document.file_url) ? (
                      <div className="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b bg-card px-4 py-3">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-4 w-4 text-red-500" />
                            PDF Document
                          </span>

                          <a
                            href={document.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                          >
                            Open in new tab
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>

                        <iframe
                          src={document.signed_url}
                          title={`${document.document_type} document`}
                          className="h-176 w-full bg-white"
                        />
                      </div>
                    ) : (
                      <a
                        href={document.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Document
                      </a>
                    )
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="text-sm">
                        This document could not be previewed. Its signed link
                        may have expired or the file may be unavailable.
                      </p>
                    </div>
                  )}

                  {document.rejection_reason && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                      <ShieldX className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">
                          Rejection Reason
                        </p>
                        <p className="mt-1 text-sm leading-6">
                          {document.rejection_reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {document.status === "pending" && (
                    <div className="border-t pt-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Review Decision
                      </p>

                      <WorkerDocumentActions
                        documentId={document.id}
                        workerId={worker.id}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
