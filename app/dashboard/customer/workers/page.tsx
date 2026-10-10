import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  MapPin,
  Star,
  Users,
} from "lucide-react";

export default async function CustomerWorkersPage() {
  await requireRole(["customer"]);

  const supabase = await createClient();

  const { data: workers, error } = await supabase
    .from("worker_profiles")
    .select(
      `
      id,
      user_id,
      bio,
      years_of_experience,
      starting_price,
      currency,
      verification_status,
      is_available,
      created_at,
      profiles!worker_profiles_user_id_fkey (
        first_name,
        last_name
      ),
      worker_categories (
        service_categories (
          id,
          name
        )
      ),
      worker_service_areas (
        service_areas (
          id,
          name
        )
      )
    `,
    )
    .eq("verification_status", "verified")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load verified workers:", error);
  }

  const workerList = workers ?? [];

  return (
    <div className="space-y-8 pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Find your professional
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Find a Worker
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Connect with verified, available workers who can help with your
                service needs.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border bg-background px-3.5 py-2 text-sm font-medium text-muted-foreground">
            <BadgeCheck className="h-4 w-4 text-green-600" />
            Verified professionals
          </div>
        </div>
      </div>

      {/* Empty state */}
      {workerList.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Users className="h-8 w-8 text-muted-foreground/60" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No verified workers available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            There are currently no verified workers accepting jobs. Please check
            again later.
          </p>
        </div>
      ) : (
        <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {workerList.map((worker) => {
            const profile = Array.isArray(worker.profiles)
              ? worker.profiles[0]
              : worker.profiles;

            const fullName =
              `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
              "Worker";

            const categories =
              worker.worker_categories
                ?.map((item) => {
                  const category = Array.isArray(item.service_categories)
                    ? item.service_categories[0]
                    : item.service_categories;

                  return category;
                })
                .filter(Boolean) ?? [];

            const serviceAreas =
              worker.worker_service_areas
                ?.map((item) => {
                  const area = Array.isArray(item.service_areas)
                    ? item.service_areas[0]
                    : item.service_areas;

                  return area;
                })
                .filter(Boolean) ?? [];

            return (
              <div
                key={worker.id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Worker header */}
                <div className="border-b bg-linear-to-br from-primary/6 via-transparent to-transparent p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-xl font-bold text-primary">
                        {fullName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate text-base font-semibold tracking-tight">
                            {fullName}
                          </h2>

                          <BadgeCheck
                            className="h-4 w-4 shrink-0 text-green-600"
                            aria-label="Verified worker"
                          />
                        </div>

                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-green-600">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/50" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                          </span>
                          Available for work
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-full border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      New
                    </div>
                  </div>
                </div>

                {/* Worker information */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="line-clamp-3 min-h-18 text-sm leading-6 text-muted-foreground">
                    {worker.bio || "No worker description available."}
                  </p>

                  {/* Experience */}
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted/50 p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                      <BriefcaseBusiness className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {worker.years_of_experience ?? 0}{" "}
                        {worker.years_of_experience === 1 ? "year" : "years"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Professional experience
                      </p>
                    </div>
                  </div>

                  {/* Service areas */}
                  {serviceAreas.length > 0 && (
                    <div className="mt-4 flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Service areas
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm leading-5">
                          {serviceAreas.map((area) => area?.name).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="mt-5">
                      <p className="mb-2.5 text-xs font-semibold text-muted-foreground">
                        Services offered
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 3).map((category) => (
                          <span
                            key={category?.id}
                            className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium"
                          >
                            {category?.name}
                          </span>
                        ))}

                        {categories.length > 3 && (
                          <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                            +{categories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    {/* Price */}
                    {worker.starting_price !== null &&
                      worker.starting_price !== undefined && (
                        <div className="mt-6 border-t pt-5">
                          <p className="text-xs text-muted-foreground">
                            Starting price
                          </p>

                          <p className="mt-1 text-xl font-bold tracking-tight">
                            {new Intl.NumberFormat("en-NG", {
                              style: "currency",
                              currency: worker.currency || "NGN",
                            }).format(worker.starting_price)}
                          </p>
                        </div>
                      )}

                    {/* Action */}
                    <Link
                      href={`/dashboard/customer/workers/${worker.id}`}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      View Worker
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
