import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { WorkerProfileForm } from "@/components/dashboard/worker/profile/worker-profile-form";

export default async function WorkerProfilePage() {
  const { user, profile, supabase } = await requireRole(["worker"]);

  const { data: workerProfile, error } = await supabase
    .from("worker_profiles")
    .select(
      `
      id,
      bio,
      years_of_experience,
      starting_price,
      currency,
      verification_status,
      is_available
    `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Worker profile page error:", error);
  }

  if (!workerProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>

          <p className="mt-1 text-muted-foreground">
            Manage your professional worker profile.
          </p>
        </div>

        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
          <h2 className="font-semibold">Worker profile not found</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your worker profile has not been created yet. Please contact an
            administrator.
          </p>
        </div>
      </div>
    );
  }

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Service Provider";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/worker"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-semibold">My Profile</h1>

        <p className="mt-1 text-muted-foreground">
          Manage the professional information customers see about you.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="font-medium">{fullName}</span>
        <span className="mx-2 text-muted-foreground">•</span>
        <span className="text-muted-foreground">Worker / Service Provider</span>
      </div>

      <WorkerProfileForm profile={workerProfile} />
    </div>
  );
}
