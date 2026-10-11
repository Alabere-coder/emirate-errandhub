import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  FileCheck2,
  FileText,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerDocumentsForm } from "@/components/dashboard/worker/worker-documents-form";

export default async function WorkerDocumentsPage() {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id, verification_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError) {
    throw new Error("Unable to load your worker profile.");
  }

  if (!workerProfile) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/worker"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileCheck2 className="size-7" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Worker verification
              </span>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Documents & Verification
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Keep your verification documents organised so your account can
                be reviewed when your worker profile is ready.
              </p>
            </div>
          </div>

          <div className="relative mt-8 rounded-2xl border border-dashed bg-muted/20 p-6 sm:p-8">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
                <FileText className="size-6 text-muted-foreground" />
              </div>

              <h2 className="text-lg font-semibold">
                Worker profile not available
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your worker profile has not been created yet. Your application
                must be approved first.
              </p>

              <Link
                href="/dashboard/worker"
                className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Return to dashboard
                <ArrowLeft className="size-4 rotate-180" />
              </Link>
            </div>
          </div>
        </section>
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
      reviewed_at,
      created_at
    `,
    )
    .eq("worker_id", workerProfile.id)
    .order("created_at", { ascending: false });

  if (documentsError) {
    throw new Error("Unable to load your documents.");
  }

  const verificationStatus = workerProfile.verification_status.replace(
    "_",
    " ",
  );

  const statusStyles: Record<string, string> = {
    approved:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    rejected: "border-destructive/20 bg-destructive/10 text-destructive",
    pending:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    under_review:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  };

  const normalizedStatus = workerProfile.verification_status.toLowerCase();

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Link
        href="/dashboard/worker"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      {/* Page heading */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 size-40 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Account verification
            </span>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Documents & Verification
            </h1>

            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Upload and manage your verification documents to help establish
              trust with customers and keep your worker profile up to date.
            </p>
          </div>

          <div className="flex size-20 shrink-0 items-center justify-center self-start rounded-3xl border bg-background shadow-sm lg:self-center">
            <FileCheck2 className="size-9 text-primary" />
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="size-4 text-primary" />
              Verification status
            </div>

            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold capitalize ${
                  statusStyles[normalizedStatus] ??
                  "border-border bg-muted text-foreground"
                }`}
              >
                {verificationStatus}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4 text-primary" />
              Submitted documents
            </div>

            <p className="mt-3 text-2xl font-bold tabular-nums">
              {documents?.length ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Documents on your profile
            </p>
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="size-4 text-primary" />
              Document management
            </div>

            <p className="mt-3 text-base font-semibold">One place to manage</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload and review your submissions
            </p>
          </div>
        </div>
      </section>

      {/* Verification information */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-5 sm:flex-row sm:items-start sm:p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
          <ShieldCheck className="size-5 text-primary" />
        </div>

        <div className="space-y-1">
          <h2 className="font-semibold">How verification works</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Upload the relevant documents using the form below. An administrator
            will review your submissions, and their review status will appear
            alongside each document.
          </p>
        </div>
      </section>

      {/* Existing upload form */}
      <WorkerDocumentsForm
        workerId={workerProfile.id}
        documents={documents ?? []}
      />
    </div>
  );
}
