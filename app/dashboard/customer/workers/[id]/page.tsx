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

  console.log(
    "Worker service areas:",
    JSON.stringify(worker?.worker_service_areas, null, 2),
  );

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

  const portfolioWithUrls = await Promise.all(
    portfolio.map(async (item) => {
      // Keep externally hosted images working.
      if (/^https?:\/\//i.test(item.image_url)) {
        return {
          ...item,
          displayImageUrl: item.image_url,
        };
      }

      // Generate a temporary URL for private portfolio images.
      const { data, error } = await supabase.storage
        .from("worker-portfolio")
        .createSignedUrl(item.image_url, 60 * 10);

      if (error) {
        console.error("Failed to load portfolio image:", error.message);
      }

      return {
        ...item,
        displayImageUrl: data?.signedUrl ?? null,
      };
    }),
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
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Back */}
      <Link
        href="/dashboard/customer/workers"
        className="group inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Workers
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-2xl font-bold text-primary sm:h-20 sm:w-20 sm:text-3xl">
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {fullName}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-600/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      worker.is_available
                        ? "bg-green-500"
                        : "bg-muted-foreground"
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
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-auto"
            >
              Request This Worker
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* About */}
        <div className="rounded-2xl border bg-card p-6 sm:p-7 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">About</h2>
              <p className="text-xs text-muted-foreground">
                Professional background
              </p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {worker.bio || "This worker has not added a biography yet."}
          </p>
        </div>

        {/* Verification */}
        <div className="rounded-2xl border bg-card p-6 sm:p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h2 className="mt-4 font-semibold">Verified Worker</h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This worker has completed the platform verification process.
          </p>

          <div className="mt-5 flex items-center gap-2 border-t pt-4 text-xs font-medium text-green-700 dark:text-green-400">
            <BadgeCheck className="h-4 w-4" />
            Verification confirmed
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Experience */}
        <div className="rounded-2xl border bg-card p-6 transition-colors hover:border-primary/20 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">Experience</h2>
              <p className="text-xs text-muted-foreground">
                Years in the field
              </p>
            </div>
          </div>

          <p className="mt-5 text-2xl font-bold tracking-tight">
            {worker.years_of_experience ?? 0}{" "}
            <span className="text-base font-medium text-muted-foreground">
              {(worker.years_of_experience ?? 0) === 1 ? "year" : "years"} of
              experience
            </span>
          </p>
        </div>

        {/* Starting price */}
        <div className="rounded-2xl border bg-card p-6 transition-colors hover:border-primary/20 sm:p-7">
          <p className="text-sm font-medium text-muted-foreground">
            Starting Price
          </p>

          <p className="mt-4 text-3xl font-bold tracking-tight">
            {worker.starting_price !== null &&
            worker.starting_price !== undefined
              ? new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: worker.currency || "NGN",
                }).format(worker.starting_price)
              : "Contact worker"}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Final pricing may depend on your service requirements.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-2xl border bg-card p-6 sm:p-7">
        <div>
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Services this worker offers
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            No services listed.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <div
                key={category?.id}
                className="rounded-xl border p-4 transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BriefcaseBusiness className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="font-semibold">{category?.name}</h3>

                    {category?.description && (
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service areas */}
      <div className="rounded-2xl border bg-card p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Service Areas</h2>
            <p className="text-sm text-muted-foreground">
              Locations this worker serves
            </p>
          </div>
        </div>

        {serviceAreas.length === 0 ? (
          <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            No service areas listed.
          </p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            {serviceAreas.map((area) => (
              <span
                key={area?.id}
                className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3.5 py-2 text-sm font-medium"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {area?.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="rounded-2xl border bg-card p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock3 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Availability</h2>
            <p className="text-sm text-muted-foreground">
              Weekly working schedule
            </p>
          </div>
        </div>

        {availability.length === 0 ? (
          <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            No weekly availability has been provided.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {availability
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between gap-4 rounded-xl border px-4 py-4 transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />

                    <span className="text-sm font-semibold">
                      {dayNames[schedule.day_of_week]}
                    </span>
                  </div>

                  <span className="whitespace-nowrap text-sm text-muted-foreground">
                    {schedule.start_time.slice(0, 5)} -{" "}
                    {schedule.end_time.slice(0, 5)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Portfolio */}
      <div className="rounded-2xl border bg-card p-6 sm:p-7">
        <div>
          <h2 className="text-lg font-semibold">Portfolio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Examples of this worker&apos;s previous work
          </p>
        </div>

        {portfolioWithUrls.length === 0 ? (
          <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            This worker has not uploaded any work samples yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioWithUrls.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-xl border transition-all duration-200 hover:border-primary/30 hover:shadow-md"
              >
                {item.displayImageUrl ? (
                  <img
                    src={item.displayImageUrl}
                    alt={item.title || "Worker portfolio"}
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
                    Image unavailable
                  </div>
                )}

                {(item.title || item.description) && (
                  <div className="p-4">
                    {item.title && (
                      <h3 className="font-semibold">{item.title}</h3>
                    )}

                    {item.description && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <h2 className="font-semibold">Ready to get started?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit a request to this worker for your service needs.
          </p>
        </div>

        <Link
          href={`/dashboard/customer/requests/new?worker=${worker.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Request This Worker
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
