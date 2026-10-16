import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  UserX,
  BriefcaseBusiness,
  FileText,
  ExternalLink,
} from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserStatusControl } from "../_components/user-status-control";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleLabel(role: string) {
  switch (role) {
    case "customer":
      return "Customer";
    case "worker":
      return "Service provider";
    case "admin":
      return "Administrator";
    default:
      return role;
  }
}

export default async function AdminUserDetailsPage({ params }: Props) {
  await requireRole(["admin"]);

  const { id } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    notFound();
  }

  const adminClient = createAdminClient();

  const [
    { data: authResult, error: authError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    adminClient.auth.admin.getUserById(id),
    adminClient
      .from("profiles")
      .select(
        "id, first_name, last_name, phone, avatar_url, role, is_active, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (authError || profileError) {
    console.error("Failed to load user details:", {
      authError: authError?.message,
      profileError: profileError?.message,
    });
    throw new Error("Unable to load user details. Please try again.");
  }

  if (!authResult.user || !profile) {
    notFound();
  }

  const isWorker = profile.role === "worker";

  const { data: workerProfile, error: workerProfileError } = isWorker
    ? await adminClient
        .from("worker_profiles")
        .select(
          "id, user_id, verification_status, bio, years_of_experience, starting_price, currency",
        )
        .eq("user_id", id)
        .maybeSingle()
    : { data: null, error: null };

  if (workerProfileError) {
    console.error("Failed to load worker profile:", workerProfileError.message);
    throw new Error("Unable to load worker verification information.");
  }

  const { data: workerDocuments, error: workerDocumentsError } = workerProfile
    ? await adminClient
        .from("worker_documents")
        .select("id, document_type, status, rejection_reason, created_at")
        .eq("worker_id", workerProfile.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (workerDocumentsError) {
    console.error(
      "Failed to load worker documents:",
      workerDocumentsError.message,
    );
    throw new Error("Unable to load worker documents.");
  }

  const documents = workerDocuments ?? [];

  const pendingDocuments = documents.filter(
    (document) => document.status === "pending",
  ).length;

  const approvedDocuments = documents.filter(
    (document) => document.status === "approved",
  ).length;

  const rejectedDocuments = documents.filter(
    (document) => document.status === "rejected",
  ).length;

  //   const isWorker = profile.role === "worker";

  const { data: workerApplications, error: workerApplicationsError } = isWorker
    ? await adminClient
        .from("worker_applications")
        .select(
          `
        id,
        user_id,
        status,
        application_note,
        rejection_reason,
        reviewed_at,
        created_at
      `,
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (workerApplicationsError) {
    console.error(
      "Load worker applications for admin user details error:",
      workerApplicationsError,
    );

    throw new Error("Failed to load worker applications.");
  }

  const authUser = authResult.user;
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CircleUserRound className="h-8 w-8" />
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-emerald-700">
                  User profile
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {fullName || "Unnamed user"}
                </h1>
                <p className="mt-1 break-all text-sm text-slate-500">
                  {authUser.email ?? "No email address"}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                profile.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {profile.is_active ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <UserX className="h-4 w-4" />
              )}
              {profile.is_active ? "Active account" : "Inactive account"}
            </span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Account information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Identity and registration details.
            </p>

            <div className="mt-6 space-y-5">
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="Full name"
                value={fullName || "Not provided"}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email address"
                value={authUser.email ?? "Not provided"}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone number"
                value={profile.phone ?? "Not provided"}
              />
              <InfoRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Account role"
                value={roleLabel(profile.role)}
              />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Registered"
                value={formatDate(profile.created_at)}
              />
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Last profile update"
                value={formatDate(profile.updated_at)}
              />
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Email verification
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Confirmation status recorded by Supabase Auth.
              </p>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                {authUser.email_confirmed_at ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : (
                  <Mail className="mt-0.5 h-5 w-5 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {authUser.email_confirmed_at
                      ? "Email confirmed"
                      : "Email not confirmed"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {authUser.email_confirmed_at
                      ? `Confirmed ${formatDate(authUser.email_confirmed_at)}`
                      : "This account has not confirmed its email address."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Account status
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Deactivation should be used for routine account restrictions.
                Permanent deletion is a separate, protected operation.
              </p>

              <div className="mt-5">
                <UserStatusControl
                  userId={profile.id}
                  userName={fullName || authUser.email || "this user"}
                  isActive={profile.is_active}
                  role={profile.role}
                />
              </div>
            </section>
          </div>
        </div>

        {profile.role === "worker" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Worker verification
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the worker profile and submitted verification
                    documents.
                  </p>
                </div>
              </div>

              {workerProfile && (
                <Link
                  href={`/dashboard/admin/worker-verification/${workerProfile.id}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Review worker
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>

            {!workerProfile ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-medium text-amber-900">
                  No worker profile found
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  This account has the service provider role but does not have a
                  corresponding worker profile.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Verification status
                    </p>
                    <p className="mt-2 font-semibold capitalize text-slate-900">
                      {(
                        workerProfile.verification_status ?? "pending"
                      ).replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Documents submitted
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {documents.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Approved documents</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">
                      {approvedDocuments}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Pending / rejected</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {pendingDocuments} / {rejectedDocuments}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-5">
                    <h3 className="font-semibold text-slate-900">
                      Professional information
                    </h3>

                    <div className="mt-4 space-y-4">
                      <InfoRow
                        icon={<BriefcaseBusiness className="h-4 w-4" />}
                        label="Experience"
                        value={
                          workerProfile.years_of_experience == null
                            ? "Not provided"
                            : `${workerProfile.years_of_experience} years`
                        }
                      />

                      <InfoRow
                        icon={<ShieldCheck className="h-4 w-4" />}
                        label="Starting price"
                        value={
                          workerProfile.starting_price == null
                            ? "Not provided"
                            : `${workerProfile.currency ?? "NGN"} ${workerProfile.starting_price}`
                        }
                      />
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Professional bio
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {workerProfile.bio || "No professional bio provided."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">
                        Submitted documents
                      </h3>
                      <span className="text-sm text-slate-500">
                        {documents.length} total
                      </span>
                    </div>

                    {documents.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center">
                        <FileText className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-3 text-sm font-medium text-slate-700">
                          No documents submitted
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          This worker has not submitted any verification
                          documents.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {documents.map((document) => (
                          <div
                            key={document.id}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                <div className="min-w-0">
                                  <p className="wrap-break-word text-sm font-semibold capitalize text-slate-900">
                                    {document.document_type.replaceAll(
                                      "_",
                                      " ",
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Submitted {formatDate(document.created_at)}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                  document.status === "approved" ||
                                  document.status === "verified"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : document.status === "rejected"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {document.status.replaceAll("_", " ")}
                              </span>
                            </div>

                            {document.rejection_reason && (
                              <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                                Rejection reason: {document.rejection_reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {documents.length > 0 && (
                      <Link
                        href={`/dashboard/admin/worker-verification/${workerProfile.id}`}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Inspect documents and review pending submissions
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>

                <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  Worker verification is separate from account activation.
                  Activating this account does not approve the worker or
                  authorize them to accept jobs.
                </p>
              </>
            )}
          </section>
        )}
        {isWorker && (
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Worker Application</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Application history and administrative review.
                </p>
              </div>

              <Link
                href="/dashboard/admin/worker-applications"
                className="text-sm font-medium text-primary hover:underline"
              >
                All applications
              </Link>
            </div>

            {!workerApplications || workerApplications.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed p-5 text-center">
                <p className="font-medium">No worker application found</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  This account does not currently have an application recorded
                  in the worker applications table.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {workerApplications.map((application) => {
                  const statusClasses =
                    application.status === "approved"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : application.status === "rejected"
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-border bg-muted text-muted-foreground";

                  return (
                    <div key={application.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">Application submitted</p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(application.created_at)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusClasses}`}
                        >
                          {application.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-sm font-medium">
                            Application note
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {application.application_note?.trim() ||
                              "No application note provided."}
                          </p>
                        </div>

                        {application.rejection_reason && (
                          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                            <p className="text-sm font-medium">
                              Rejection reason
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                              {application.rejection_reason}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium">Reviewed at</p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(application.reviewed_at)}
                          </p>
                        </div>

                        <div className="pt-1">
                          <Link
                            href={`/dashboard/admin/worker-applications/${application.id}`}
                            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                          >
                            Review application
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 wrap-break-word text-sm font-medium text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}
