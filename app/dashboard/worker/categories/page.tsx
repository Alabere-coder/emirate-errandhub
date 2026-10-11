import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

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
              <BriefcaseBusiness className="size-8" />
            </div>

            <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
              Service categories
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
              <BriefcaseBusiness className="size-6 sm:size-7" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Worker profile
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Service categories
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Choose the services you provide so customers can find you when
                they need your skills. Select every category that matches the
                work you offer.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-muted/20 p-4 lg:max-w-60">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
              <CheckCircle2 className="size-5" />
            </div>

            <div>
              <p className="text-sm font-semibold">Your expertise</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Keep your service selection relevant to your skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Manage your services
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Update your selections whenever the services you offer change.
          </p>
        </div>

        <WorkerCategoryForm
          workerId={workerProfile.id}
          categories={categories ?? []}
          selectedCategoryIds={selectedCategoryIds}
        />
      </div>
    </div>
  );
}
