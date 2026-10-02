import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ServiceCategoryManager } from "./service-category-manager";

export default async function AdminServicesPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const [
    { data: categories, error: categoriesError },
    { data: services, error: servicesError },
  ] = await Promise.all([
    supabase
      .from("service_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),

    supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (categoriesError || servicesError) {
    console.error("Error loading service management data:", {
      categoriesError,
      servicesError,
    });

    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-semibold text-red-900">
            Unable to load service management
          </h1>

          <p className="mt-1 text-sm text-red-700">Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <ServiceCategoryManager
        categories={categories ?? []}
        services={services ?? []}
      />
    </div>
  );
}
