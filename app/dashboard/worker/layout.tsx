import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import { WorkerDashboardShell } from "@/components/dashboard/worker-dashboard-shell";

type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected";

type DocumentStatus = "pending" | "approved" | "rejected";

function getApplicationBadge(status: ApplicationStatus | null): string {
  if (!status) return "Not submitted";

  const labels: Record<ApplicationStatus, string> = {
    pending: "Pending",
    under_review: "Under review",
    approved: "Approved",
    rejected: "Rejected",
  };

  return labels[status];
}

function getDocumentsBadge(statuses: DocumentStatus[]): string {
  if (statuses.length === 0) return "Not submitted";

  if (statuses.some((status) => status === "rejected")) {
    return "Action required";
  }

  if (statuses.some((status) => status === "pending")) {
    return "Pending";
  }

  if (statuses.every((status) => status === "approved")) {
    return "Approved";
  }

  return "Under review";
}

export default async function WorkerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuth();

  if (profile.role !== "worker") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: branding } = await supabase.rpc("get_public_platform_settings");

  const platformName = branding?.[0]?.platform_name || "Emirate ErrandHub";

  const platformDescription =
    branding?.[0]?.platform_description || "Services made easier.";

  const platformLogoUrl = branding?.[0]?.platform_logo_url ?? null;

  let applicationBadge: string | undefined;
  let documentsBadge: string | undefined;

  const { data: application, error: applicationError } = await supabase
    .from("worker_applications")
    .select("status")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (applicationError) {
    console.error("Load worker application badge error:", applicationError);
  } else {
    applicationBadge = getApplicationBadge(
      (application?.status as ApplicationStatus | undefined) ?? null,
    );
  }

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error(
      "Load worker profile for document badge error:",
      workerProfileError,
    );
  } else if (!workerProfile) {
    documentsBadge = "Not submitted";
  } else {
    const { data: documents, error: documentsError } = await supabase
      .from("worker_documents")
      .select("status")
      .eq("worker_id", workerProfile.id);

    if (documentsError) {
      console.error("Load worker document badge error:", documentsError);
    } else {
      const statuses = (documents ?? []).map(
        (document) => document.status as DocumentStatus,
      );

      documentsBadge = getDocumentsBadge(statuses);
    }
  }

  return (
    <WorkerDashboardShell
      firstName={profile.first_name}
      lastName={profile.last_name}
      avatarUrl={profile.avatar_url}
      platformLogoUrl={platformLogoUrl}
      platformName={platformName}
      platformDescription={platformDescription}
      applicationBadge={applicationBadge}
      documentsBadge={documentsBadge}
    >
      {children}
    </WorkerDashboardShell>
  );
}
