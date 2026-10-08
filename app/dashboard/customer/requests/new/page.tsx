import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import NewRequestForm from "@/components/dashboard/customer/requests/new-request-form";

type NewRequestPageProps = {
  searchParams: Promise<{
    service?: string;
    worker?: string;
  }>;
};

export default async function NewRequestPage({
  searchParams,
}: NewRequestPageProps) {
  await requireRole(["customer"]);

  const supabase = await createClient();

  const { service: serviceId, worker: workerId } = await searchParams;

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

  /*
   * ---------------------------------------------------------
   * LOAD SELECTED WORKER
   * ---------------------------------------------------------
   */

  let selectedWorker: {
    id: string;
    name: string;
  } | null = null;

  let workerCategoryIds: string[] = [];

  if (workerId) {
    const { data: worker, error: workerError } = await supabase
      .from("worker_profiles")
      .select(
        `
          id,
          verification_status,
          is_available,
          profiles!worker_profiles_user_id_fkey (
            first_name,
            last_name
          )
        `,
      )
      .eq("id", workerId)
      .eq("verification_status", "verified")
      .eq("is_available", true)
      .maybeSingle();

    if (workerError) {
      console.error("Load selected worker error:", workerError);
    }

    if (worker) {
      const profile = Array.isArray(worker.profiles)
        ? worker.profiles[0]
        : worker.profiles;

      const fullName = `${profile?.first_name ?? ""} ${
        profile?.last_name ?? ""
      }`.trim();

      selectedWorker = {
        id: worker.id,
        name: fullName || "Selected Worker",
      };

      /*
       * Load the categories this worker provides.
       */
      const { data: workerCategories, error: workerCategoriesError } =
        await supabase
          .from("worker_categories")
          .select("category_id")
          .eq("worker_id", worker.id);

      if (workerCategoriesError) {
        console.error(
          "Load selected worker categories error:",
          workerCategoriesError,
        );
      } else {
        workerCategoryIds =
          workerCategories?.map((item) => item.category_id) ?? [];
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * FILTER CATEGORIES FOR DIRECT WORKER REQUEST
   * ---------------------------------------------------------
   *
   * Normal request:
   *   Show every active category.
   *
   * Direct worker request:
   *   Show only categories that belong to the selected worker.
   */

  const availableCategories =
    selectedWorker && workerId
      ? (categories ?? []).filter((category) =>
          workerCategoryIds.includes(category.id),
        )
      : (categories ?? []);

  /*
   * ---------------------------------------------------------
   * PRESELECT SERVICE / CATEGORY
   * ---------------------------------------------------------
   */

  let initialCategoryId: string | null = null;
  let initialServiceId: string | null = null;

  if (serviceId) {
    const selectedService = (services ?? []).find(
      (service) => service.id === serviceId,
    );

    /*
     * Only preselect the service if:
     *
     * 1. It exists.
     * 2. It belongs to an allowed category.
     *
     * For a direct worker request, this prevents selecting a
     * service outside the worker's categories.
     */
    if (
      selectedService &&
      availableCategories.some(
        (category) => category.id === selectedService.category_id,
      )
    ) {
      initialServiceId = selectedService.id;
      initialCategoryId = selectedService.category_id;
    }
  }

  /*
   * If a worker was selected but there was no valid service
   * preselection, use the worker's first available category.
   */
  if (selectedWorker && availableCategories.length > 0) {
    const categoryStillValid =
      initialCategoryId &&
      availableCategories.some((category) => category.id === initialCategoryId);

    if (!categoryStillValid) {
      initialCategoryId = availableCategories[0].id;
      initialServiceId = null;
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

      {workerId && !selectedWorker && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            This worker is no longer available.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            You can continue by creating a normal service request instead.
          </p>
        </div>
      )}

      {selectedWorker && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Requesting a specific worker
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{selectedWorker.name}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                This request will be directed to this verified worker.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedWorker && availableCategories.length === 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            This worker has no service categories assigned.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Please choose another worker or create a normal service request.
          </p>
        </div>
      )}

      <NewRequestForm
        categories={availableCategories}
        services={services ?? []}
        initialCategoryId={initialCategoryId}
        initialServiceId={initialServiceId}
        selectedWorkerId={selectedWorker?.id ?? null}
        selectedWorkerName={selectedWorker?.name ?? null}
      />
    </div>
  );
}

// import { createClient } from "@/lib/supabase/server";
// import { requireRole } from "@/lib/auth/require-role";
// import NewRequestForm from "@/components/dashboard/customer/requests/new-request-form";

// type NewRequestPageProps = {
//   searchParams: Promise<{
//     service?: string;
//   }>;
// };

// export default async function NewRequestPage({
//   searchParams,
// }: NewRequestPageProps) {
//   await requireRole(["customer"]);

//   const supabase = await createClient();

//   const { service: serviceId } = await searchParams;

//   const [
//     { data: categories, error: categoriesError },
//     { data: services, error: servicesError },
//   ] = await Promise.all([
//     supabase
//       .from("service_categories")
//       .select("id, name, description, icon")
//       .eq("is_active", true)
//       .order("sort_order", { ascending: true })
//       .order("name", { ascending: true }),

//     supabase
//       .from("services")
//       .select("id, category_id, name, description, icon")
//       .eq("is_active", true)
//       .order("sort_order", { ascending: true })
//       .order("name", { ascending: true }),
//   ]);

//   if (categoriesError) {
//     console.error("Load service categories error:", categoriesError);
//   }

//   if (servicesError) {
//     console.error("Load services error:", servicesError);
//   }

//   if (categoriesError || servicesError) {
//     return (
//       <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
//         <h1 className="text-lg font-semibold">Unable to load services</h1>

//         <p className="mt-2 text-sm text-muted-foreground">
//           We could not load the available services. Please try again later.
//         </p>
//       </div>
//     );
//   }

//   let initialCategoryId: string | null = null;
//   let initialServiceId: string | null = null;

//   if (serviceId) {
//     const selectedService = services?.find(
//       (service) => service.id === serviceId,
//     );

//     if (selectedService) {
//       initialServiceId = selectedService.id;
//       initialCategoryId = selectedService.category_id;
//     }
//   }

//   return (
//     <div className="mx-auto w-full max-w-4xl space-y-8">
//       <div>
//         <h1 className="text-2xl font-semibold tracking-tight">
//           Request a Service
//         </h1>

//         <p className="mt-2 text-sm text-muted-foreground">
//           Tell us what you need help with and provide the details needed to
//           connect you with the right service provider.
//         </p>
//       </div>

//       <NewRequestForm
//         categories={categories ?? []}
//         services={services ?? []}
//         initialCategoryId={initialCategoryId}
//         initialServiceId={initialServiceId}
//       />
//     </div>
//   );
// }
