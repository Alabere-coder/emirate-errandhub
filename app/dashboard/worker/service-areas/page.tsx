import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerServiceAreaForm } from "@/components/dashboard/worker/worker-service-area-form";

export default async function WorkerServiceAreasPage() {
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
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <Link
          href="/dashboard/worker"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="h-1 bg-primary" />

          <div className="flex flex-col items-center px-5 py-12 text-center sm:px-10 sm:py-16">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPinned className="size-8" />
            </div>

            <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
              Service areas
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Your worker profile has not been created yet. Your application
              must be approved first.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4" />
              Worker profile required
            </div>
          </div>
        </section>
      </div>
    );
  }

  const { data: serviceAreas, error: areasError } = await supabase
    .from("service_areas")
    .select(
      `
        id,
        name,
        parent_id,
        is_active
      `,
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (areasError) {
    throw new Error("Unable to load service areas.");
  }

  const { data: workerAreas, error: workerAreasError } = await supabase
    .from("worker_service_areas")
    .select("service_area_id")
    .eq("worker_id", workerProfile.id);

  if (workerAreasError) {
    throw new Error("Unable to load your selected service areas.");
  }

  const selectedAreaIds =
    workerAreas?.map((area) => area.service_area_id) ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:py-8">
      <Link
        href="/dashboard/worker"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-14">
              <MapPinned className="size-6 sm:size-7" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Worker profile
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Service areas
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Choose the locations where you are available to provide
                services. Setting your coverage helps customers find workers who
                serve their area.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-muted/20 p-4 lg:max-w-60">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
              <MapPin className="size-5" />
            </div>

            <div>
              <p className="text-sm font-semibold">Your coverage</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {selectedAreaIds.length}
                </span>{" "}
                {selectedAreaIds.length === 1 ? "area" : "areas"} selected
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px border-t bg-border sm:grid-cols-2">
          <div className="flex items-start gap-3 bg-card px-5 py-4 sm:px-8">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Choose your coverage</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Select the areas where you can accept jobs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-card px-5 py-4 sm:px-8">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Keep it accurate</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Choose locations you can realistically serve.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Manage your coverage
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Update your service areas as your availability changes.
          </p>
        </div>

        <WorkerServiceAreaForm
          workerId={workerProfile.id}
          serviceAreas={serviceAreas ?? []}
          selectedAreaIds={selectedAreaIds}
        />
      </div>
    </div>
  );
}
