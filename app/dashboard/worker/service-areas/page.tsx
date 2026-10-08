import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerServiceAreaForm } from "@/components/dashboard/worker/worker-service-area-form";

export default async function WorkerServiceAreasPage() {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError) {
    throw new Error("Unable to load your worker profile.");
  }

  if (!workerProfile) {
    return (
      <div className="rounded-xl border border-dashed p-6">
        <h1 className="text-xl font-semibold">Service Areas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your worker profile has not been created yet. Your application must be
          approved first.
        </p>
      </div>
    );
  }

  const { data: serviceAreas, error: areasError } = await supabase
    .from("service_areas")
    .select(
      `
      id,
      name,
      parent_id,
      is_active
    `,
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (areasError) {
    throw new Error("Unable to load service areas.");
  }

  const { data: workerAreas, error: workerAreasError } = await supabase
    .from("worker_service_areas")
    .select("service_area_id")
    .eq("worker_id", workerProfile.id);

  if (workerAreasError) {
    throw new Error("Unable to load your selected service areas.");
  }

  const selectedAreaIds =
    workerAreas?.map((area) => area.service_area_id) ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Service Areas</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Select the areas where you are available to provide services.
        </p>
      </div>

      <WorkerServiceAreaForm
        workerId={workerProfile.id}
        serviceAreas={serviceAreas ?? []}
        selectedAreaIds={selectedAreaIds}
      />
    </div>
  );
}
