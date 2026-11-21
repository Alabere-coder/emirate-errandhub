import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Search } from "lucide-react";

import { ServiceMedia } from "@/components/services/service-media";
import { getActiveServiceCategories } from "@/lib/services/categories";
import { PublicNavbar } from "@/components/navigation/public-navbar";

export default async function ServiceCategoriesPage() {
  const categories = await getActiveServiceCategories();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      {/* Header */}
      <section className="relative isolate overflow-hidden border-b border-border bg-slate-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.2),transparent_50%)]"
        />

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>

          <div className="mt-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">
              Emirate ErrandHub
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Find the right service for every need.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Explore our complete directory of service categories and find the
              help you need for everyday tasks, home maintenance, repairs,
              deliveries and more.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <BriefcaseBusiness className="h-4 w-4 text-teal-300" />
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"} available
            </div>
          </div>
        </div>
      </section>

      {/* Category directory */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Browse all categories
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Select a category to explore its available services.
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <BriefcaseBusiness className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-foreground">
              No categories available yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Service categories will appear here once they are added. Please
              check back soon.
            </p>

            <Link
              href="/services"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Return to services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />

              <p className="text-sm leading-6 text-muted-foreground">
                Looking for a particular service? Use your browser&apos;s Find
                feature to locate a category by name, or browse the directory
                below.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/services/${category.slug}`}
                  className="group flex min-h-56 flex-col rounded-2xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:border-emerald-800 dark:hover:shadow-black/20 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl bg-muted p-1 ring-1 ring-border transition-colors group-hover:bg-emerald-50 group-hover:ring-emerald-200 dark:group-hover:bg-emerald-400/10 dark:group-hover:ring-emerald-800">
                      <ServiceMedia
                        icon={category.icon}
                        imageUrl={category.image_url}
                        name={category.name}
                        size="md"
                      />
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-800 dark:group-hover:border-emerald-800 dark:group-hover:bg-emerald-400/10 dark:group-hover:text-emerald-300">
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  <h3 className="mt-5 font-semibold text-foreground transition-colors group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                    {category.name}
                  </h3>

                  {category.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {category.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Explore services in this category.
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-foreground transition-colors group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                    Explore category
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Bottom call to action */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Ready to get started?
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Choose a service category and discover the options available to
                you.
              </p>
            </div>

            <Link
              href="/services"
              className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:mt-0"
            >
              Explore services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
