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
      <div className="rounded-xl border p-6">
        <h1 className="text-xl font-semibold">My Portfolio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your worker profile must be created before you can manage your
          portfolio.
        </p>
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
      <div className="rounded-xl border p-6">
        <h1 className="text-xl font-semibold">My Portfolio</h1>
        <p className="mt-2 text-sm text-destructive">
          Unable to load your portfolio. Check your database permissions.
        </p>
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Portfolio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Show customers examples of your previous work to help them choose you.
        </p>
      </div>

      <WorkerPortfolioForm />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Your projects</h2>
          <p className="text-sm text-muted-foreground">
            {portfolioItems.length} portfolio{" "}
            {portfolioItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        {portfolioItems.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <h3 className="font-medium">Your portfolio is empty</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first project using the form above.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioItems.map((item) => (
              <WorkerPortfolioItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
