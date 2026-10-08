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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Find a Worker
            </h1>

            <p className="text-sm text-muted-foreground">
              Browse verified workers available to help with your service needs.
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {workerList.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />

          <h2 className="mt-4 font-semibold">No verified workers available</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            There are currently no verified workers accepting jobs. Please check
            again later.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                className="flex flex-col overflow-hidden rounded-xl border bg-card"
              >
                {/* Worker header */}
                <div className="border-b p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                        {fullName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate font-semibold">{fullName}</h2>

                          <BadgeCheck className="h-4 w-4 shrink-0 text-green-600" />
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Available
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-current" />
                      <span>New</span>
                    </div>
                  </div>
                </div>

                {/* Worker information */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="line-clamp-3 min-h-15 text-sm leading-6 text-muted-foreground">
                    {worker.bio || "No worker description available."}
                  </p>

                  {/* Experience */}
                  <div className="mt-5 flex items-center gap-2 text-sm">
                    <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />

                    <span>
                      {worker.years_of_experience ?? 0}{" "}
                      {worker.years_of_experience === 1 ? "year" : "years"}{" "}
                      experience
                    </span>
                  </div>

                  {/* Service areas */}
                  {serviceAreas.length > 0 && (
                    <div className="mt-3 flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                      <span className="line-clamp-2 text-muted-foreground">
                        {serviceAreas.map((area) => area?.name).join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {categories.slice(0, 3).map((category) => (
                        <span
                          key={category?.id}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                        >
                          {category?.name}
                        </span>
                      ))}

                      {categories.length > 3 && (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          +{categories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  {worker.starting_price !== null &&
                    worker.starting_price !== undefined && (
                      <div className="mt-auto pt-6">
                        <p className="text-xs text-muted-foreground">
                          Starting from
                        </p>

                        <p className="text-lg font-semibold">
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
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    View Worker
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
