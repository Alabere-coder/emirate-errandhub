import Link from "next/link";

import { ArrowLeft, ArrowRight, BriefcaseBusiness, Search } from "lucide-react";

import { ServiceMedia } from "@/components/services/service-media";
import { getActiveServiceCategories } from "@/lib/services/categories";

export default async function ServiceCategoriesPage() {
  const categories = await getActiveServiceCategories();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-slate-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.2),transparent_50%)]"
        />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-300 transition hover:text-white"
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
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Browse all categories
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Select a category to explore its available services.
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <BriefcaseBusiness className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No categories available yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Service categories will appear here once they are added. Please
              check back soon.
            </p>

            <Link
              href="/services"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Return to services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />

              <p className="text-sm leading-6 text-slate-600">
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
                  className="group flex min-h-56 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-100 transition group-hover:bg-teal-50 group-hover:ring-teal-100">
                      <ServiceMedia
                        icon={category.icon}
                        imageUrl={category.image_url}
                        name={category.name}
                        size="md"
                      />
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-teal-200 group-hover:bg-teal-50 group-hover:text-teal-800">
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  <h3 className="mt-5 font-semibold text-slate-900 transition group-hover:text-teal-800">
                    {category.name}
                  </h3>

                  {category.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {category.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Explore services in this category.
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-slate-700 transition group-hover:text-teal-800">
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
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Ready to get started?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose a service category and discover the options available to
                you.
              </p>
            </div>

            <Link
              href="/services"
              className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:mt-0"
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
