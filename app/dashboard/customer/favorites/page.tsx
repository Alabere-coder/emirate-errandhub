import Link from "next/link";
import { ArrowRight, Heart, Users } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { FavoriteWorkerButton } from "./favorite-worker-button";

export const dynamic = "force-dynamic";

export default async function CustomerFavoritesPage() {
  await requireRole(["customer"]);

  const supabase = await createClient();

  const { data: favorites, error } = await supabase
    .from("favorite_workers")
    .select(
      `
      worker_id,
      created_at,
      worker_profiles!favorite_workers_worker_id_fkey (
        id,
        user_id,
        bio,
        years_of_experience,
        starting_price,
        currency,
        verification_status,
        is_available,
        profiles!worker_profiles_user_id_fkey (
          first_name,
          last_name
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load favorite workers:", error);
  }

  const favoriteList = (favorites ?? []).filter((favorite) => {
    const worker = Array.isArray(favorite.worker_profiles)
      ? favorite.worker_profiles[0]
      : favorite.worker_profiles;

    return worker?.verification_status === "verified";
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
            <Heart className="h-6 w-6 fill-rose-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              My Favourite Workers
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Keep your preferred professionals close at hand and revisit their
              profiles whenever you need a service.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center">
          <h2 className="font-semibold">Unable to load favourites</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh the page and try again.
          </p>
        </div>
      ) : favoriteList.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Users className="h-8 w-8 text-muted-foreground/60" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No favourite workers yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Browse verified workers and tap the heart to save professionals you
            may want to hire again.
          </p>

          <Link
            href="/dashboard/customer/workers"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Find Workers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favoriteList.map((favorite) => {
            const worker = Array.isArray(favorite.worker_profiles)
              ? favorite.worker_profiles[0]
              : favorite.worker_profiles;

            if (!worker) return null;

            const profile = Array.isArray(worker.profiles)
              ? worker.profiles[0]
              : worker.profiles;

            const fullName =
              `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
              "Worker";

            return (
              <article
                key={favorite.worker_id}
                className="flex flex-col rounded-2xl border bg-card p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                      {fullName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{fullName}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {worker.is_available
                          ? "Available for work"
                          : "Currently unavailable"}
                      </p>
                    </div>
                  </div>

                  <FavoriteWorkerButton
                    workerId={worker.id}
                    initiallyFavorited={true}
                  />
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {worker.bio || "No worker description available."}
                </p>

                <div className="mt-4 text-sm">
                  <span className="font-medium">
                    {worker.years_of_experience ?? 0}{" "}
                    {(worker.years_of_experience ?? 0) === 1 ? "year" : "years"}
                  </span>{" "}
                  <span className="text-muted-foreground">of experience</span>
                </div>

                {worker.starting_price !== null &&
                  worker.starting_price !== undefined && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-xs text-muted-foreground">
                        Starting price
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: worker.currency || "NGN",
                        }).format(worker.starting_price)}
                      </p>
                    </div>
                  )}

                <Link
                  href={`/dashboard/customer/workers/${worker.id}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  View Worker
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
