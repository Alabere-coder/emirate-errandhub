import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
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
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Unable to load services
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            We could not load the available service categories and services.
            Please refresh the page and try again.
          </p>

          <Link
            href="/services"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse services
          </Link>
        </div>
      </div>
    );
  }

  // Load the selected worker for a direct worker request.
  let selectedWorker: { id: string; name: string } | null = null;
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

      // Load the categories this worker provides.
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

  // Normal requests show all active categories.
  // Direct worker requests show only that worker's categories.
  const availableCategories =
    selectedWorker && workerId
      ? (categories ?? []).filter((category) =>
          workerCategoryIds.includes(category.id),
        )
      : (categories ?? []);

  // Preselect a valid service and its category, if supplied.
  let initialCategoryId: string | null = null;
  let initialServiceId: string | null = null;

  if (serviceId) {
    const selectedService = (services ?? []).find(
      (service) => service.id === serviceId,
    );

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

  // For direct worker requests, select the first supported category
  // when there is no valid service preselection.
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
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <Link
            href="/dashboard/customer/requests"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to my requests
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-teal-300 sm:flex">
              <ClipboardList className="h-7 w-7" />
            </div>

            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                EMIRATE ERRANDHUB
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Request a service
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                Tell us what you need, where you need it, and when you need it.
                Provide enough detail to help workers understand your request
                and send suitable quotations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Direct worker notice */}
      {workerId && !selectedWorker && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

          <div>
            <p className="font-semibold text-amber-900">
              This worker is no longer available
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              You can still submit a normal service request and receive
              quotations from available workers.
            </p>

            <Link
              href="/services"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 underline underline-offset-4"
            >
              Explore services
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {selectedWorker && (
        <div className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm">
          <div className="flex items-start gap-4 p-5 sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
              <UserRound className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">
                  Direct worker request
                </p>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified worker
                </span>
              </div>

              <h2 className="mt-2 text-lg font-bold text-slate-900">
                {selectedWorker.name}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Your request will be directed to this worker. Choose one of
                their available service categories below.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedWorker && availableCategories.length === 0 && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-semibold text-red-900">
              No service categories assigned
            </p>

            <p className="mt-1 text-sm leading-6 text-red-800">
              This worker has no service categories available for direct
              requests. Please choose another worker or create a normal service
              request.
            </p>

            <Link
              href="/services"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-900 underline underline-offset-4"
            >
              Browse services
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Form section */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
              <Wrench className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Request details</h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete the form below to describe the work you need.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <NewRequestForm
            categories={availableCategories}
            services={services ?? []}
            initialCategoryId={initialCategoryId}
            initialServiceId={initialServiceId}
            selectedWorkerId={selectedWorker?.id ?? null}
            selectedWorkerName={selectedWorker?.name ?? null}
          />
        </div>
      </section>

      {/* Helpful note */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />

        <p className="text-sm leading-6 text-slate-600">
          <span className="font-semibold text-slate-800">Helpful tip:</span>{" "}
          Include clear job details, your location, and any important scheduling
          preferences. This helps workers assess your request and provide more
          relevant quotations.
        </p>
      </div>
    </div>
  );
}
