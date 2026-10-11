import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ImagePlus,
  Images,
  ShieldCheck,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerPortfolioForm } from "@/components/dashboard/worker/worker-portfolio-form";
import { WorkerPortfolioItem } from "@/components/dashboard/worker/worker-portfolio-item";

export default async function WorkerPortfolioPage() {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const { data: workerProfile, error: profileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !workerProfile) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/worker"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-muted/40 text-primary">
              <BriefcaseBusiness className="size-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                My Portfolio
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Showcase your previous projects and help customers understand
                the quality of your work.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-dashed bg-muted/20 px-5 py-10 text-center sm:px-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-background">
              <Images className="size-6 text-muted-foreground" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Worker profile unavailable
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your worker profile must be created before you can manage your
              portfolio.
            </p>

            <Link
              href="/dashboard/worker"
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Return to dashboard
              <ArrowLeft className="size-4 rotate-180" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const { data: items, error: itemsError } = await supabase
    .from("worker_portfolio")
    .select("id, title, description, image_url, sort_order, created_at")
    .eq("worker_id", workerProfile.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (itemsError) {
    console.error("Failed to load worker portfolio:", itemsError);

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/worker"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Images className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                My Portfolio
              </h1>
              <p className="mt-1 text-sm text-destructive">
                Unable to load your portfolio. Check your database permissions.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const portfolioItems = await Promise.all(
    (items ?? []).map(async (item) => {
      const { data, error: imageError } = await supabase.storage
        .from("worker-portfolio")
        .createSignedUrl(item.image_url, 60 * 30);

      if (imageError) {
        console.error("Failed to generate portfolio image URL:", imageError);
      }

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        imageSrc: data?.signedUrl ?? null,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Link
        href="/dashboard/worker"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      {/* Page header */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 size-40 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BriefcaseBusiness className="size-3.5 text-primary" />
              Your professional showcase
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              My Portfolio
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Let your work speak for itself. Add photos and descriptions of
              completed projects to help customers choose you with confidence.
            </p>
          </div>

          <div className="flex size-20 shrink-0 items-center justify-center self-start rounded-3xl border bg-background shadow-sm sm:self-center">
            <Images className="size-9 text-primary" />
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border bg-background/80 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Images className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Your projects</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {portfolioItems.length} portfolio{" "}
                {portfolioItems.length === 1 ? "item" : "items"} added
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border bg-background/80 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Build customer confidence</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Use clear photos and useful project descriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Add portfolio item */}
      <section id="add-portfolio-item" className="scroll-mt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-card text-primary">
            <ImagePlus className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Add to your portfolio
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Share another example of your work.
            </p>
          </div>
        </div>

        <WorkerPortfolioForm />
      </section>

      {/* Existing portfolio items */}
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-card text-primary">
                <BriefcaseBusiness className="size-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Your projects
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Examples of your experience and completed work.
                </p>
              </div>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
            <Images className="size-4 text-muted-foreground" />
            {portfolioItems.length}{" "}
            {portfolioItems.length === 1 ? "project" : "projects"}
          </span>
        </div>

        {portfolioItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-muted/10 px-5 py-12 text-center sm:px-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
              <ImagePlus className="size-7 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Your portfolio starts here
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              You haven&apos;t added any projects yet. Upload your first project
              above to give customers a better idea of your work.
            </p>

            <a
              href="#add-portfolio-item"
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ImagePlus className="size-4" />
              Add your first project
            </a>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {portfolioItems.map((item) => (
              <WorkerPortfolioItem key={item.id} item={item} />
            ))}
          </div>
        )}

        {portfolioItems.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Keep your portfolio current by adding strong examples of your
              completed work and updating project details when needed.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
