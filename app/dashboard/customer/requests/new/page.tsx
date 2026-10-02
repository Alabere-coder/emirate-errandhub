import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import NewRequestForm from "@/components/dashboard/customer/requests/new-request-form";

type NewRequestPageProps = {
  searchParams: Promise<{
    service?: string;
  }>;
};

export default async function NewRequestPage({
  searchParams,
}: NewRequestPageProps) {
  await requireRole(["customer"]);

  const supabase = await createClient();

  const { service: serviceId } = await searchParams;

  const [
    { data: categories, error: categoriesError },
    { data: services, error: servicesError },
  ] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, name, description, icon")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),

    supabase
      .from("services")
      .select("id, category_id, name, description, icon")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (categoriesError) {
    console.error("Load service categories error:", categoriesError);
  }

  if (servicesError) {
    console.error("Load services error:", servicesError);
  }

  if (categoriesError || servicesError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <h1 className="text-lg font-semibold">Unable to load services</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          We could not load the available services. Please try again later.
        </p>
      </div>
    );
  }

  let initialCategoryId: string | null = null;
  let initialServiceId: string | null = null;

  if (serviceId) {
    const selectedService = services?.find(
      (service) => service.id === serviceId,
    );

    if (selectedService) {
      initialServiceId = selectedService.id;
      initialCategoryId = selectedService.category_id;
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Request a Service
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Tell us what you need help with and provide the details needed to
          connect you with the right service provider.
        </p>
      </div>

      <NewRequestForm
        categories={categories ?? []}
        services={services ?? []}
        initialCategoryId={initialCategoryId}
        initialServiceId={initialServiceId}
      />
    </div>
  );
}
