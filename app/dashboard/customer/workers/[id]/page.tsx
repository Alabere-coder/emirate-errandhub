import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerWorkerProfilePage({ params }: PageProps) {
  await requireRole(["customer"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: worker, error } = await supabase
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
        last_name,
        phone
      ),
      worker_categories (
        service_categories (
          id,
          name,
          description
        )
      ),
      worker_service_areas (
        service_areas (
          id,
          name
        )
      ),
      worker_availability (
        id,
        day_of_week,
        start_time,
        end_time,
        is_available
      ),
      worker_portfolio (
        id,
        title,
        description,
        image_url,
        sort_order
      )
    `,
    )
    .eq("id", id)
    .eq("verification_status", "verified")
    .maybeSingle();

  if (error) {
    console.error("Failed to load worker:", error);
    notFound();
  }

  if (!worker) {
    notFound();
  }

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

  const portfolio = [...(worker.worker_portfolio ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const availability =
    worker.worker_availability?.filter((item) => item.is_available) ?? [];

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/dashboard/customer/workers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workers
      </Link>

      {/* Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              {fullName.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{fullName}</h1>

                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    worker.is_available ? "bg-green-500" : "bg-muted-foreground"
                  }`}
                />

                <span className="text-muted-foreground">
                  {worker.is_available
                    ? "Currently accepting jobs"
                    : "Currently unavailable"}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/customer/requests/new?worker=${worker.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Request This Worker
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* About */}
        <div className="rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">About</h2>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {worker.bio || "This worker has not added a biography yet."}
          </p>
        </div>

        {/* Verification */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />

            <h2 className="font-semibold">Verified Worker</h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This worker has completed the platform verification process.
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Experience */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />

            <h2 className="font-semibold">Experience</h2>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {worker.years_of_experience ?? 0}{" "}
            {(worker.years_of_experience ?? 0) === 1 ? "year" : "years"} of
            experience
          </p>
        </div>

        {/* Starting price */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Starting Price</h2>

          <p className="mt-3 text-2xl font-semibold">
            {worker.starting_price !== null &&
            worker.starting_price !== undefined
              ? new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: worker.currency || "NGN",
                }).format(worker.starting_price)
              : "Contact worker"}
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold">Services</h2>

        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No services listed.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <div key={category?.id} className="rounded-lg border p-4">
                <h3 className="font-medium">{category?.name}</h3>

                {category?.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service areas */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />

          <h2 className="font-semibold">Service Areas</h2>
        </div>

        {serviceAreas.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No service areas listed.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {serviceAreas.map((area) => (
              <span
                key={area?.id}
                className="rounded-full bg-muted px-3 py-1.5 text-sm"
              >
                {area?.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-muted-foreground" />

          <h2 className="font-semibold">Availability</h2>
        </div>

        {availability.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No weekly availability has been provided.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {availability
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <span className="text-sm font-medium">
                    {dayNames[schedule.day_of_week]}
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {schedule.start_time.slice(0, 5)} -{" "}
                    {schedule.end_time.slice(0, 5)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Portfolio</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border">
                <img
                  src={item.image_url}
                  alt={item.title || "Worker portfolio"}
                  className="aspect-video w-full object-cover"
                />

                <div className="p-4">
                  {item.title && <h3 className="font-medium">{item.title}</h3>}

                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
