import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import ServiceAreaManager from "./service-area-manager";

export const dynamic = "force-dynamic";

export default async function AdminServiceAreasPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: serviceAreas, error } = await supabase
    .from("service_areas")
    .select("id, name, parent_id, is_active, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Load service areas error:", error);

    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Unable to load service areas. Please refresh the page and try again.
      </div>
    );
  }

  return <ServiceAreaManager serviceAreas={serviceAreas ?? []} />;
}
