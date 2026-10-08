import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerCategoryForm } from "@/components/dashboard/worker/worker-category-form";

export default async function WorkerCategoriesPage() {
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
        <h1 className="text-xl font-semibold">Service Categories</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your worker profile has not been created yet. Your application must be
          approved first.
        </p>
      </div>
    );
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("service_categories")
    .select(
      `
      id,
      name,
      description,
      parent_id
    `,
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error("Unable to load service categories.");
  }

  const { data: workerCategories, error: workerCategoriesError } =
    await supabase
      .from("worker_categories")
      .select("category_id")
      .eq("worker_id", workerProfile.id);

  if (workerCategoriesError) {
    throw new Error("Unable to load your selected categories.");
  }

  const selectedCategoryIds =
    workerCategories?.map((item) => item.category_id) ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Service Categories
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Select the types of services you provide. Customers will be matched
          with workers based on their selected service categories.
        </p>
      </div>

      <WorkerCategoryForm
        workerId={workerProfile.id}
        categories={categories ?? []}
        selectedCategoryIds={selectedCategoryIds}
      />
    </div>
  );
}
