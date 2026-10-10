import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
import { notFound } from "next/navigation";

import {
  getCategoryBySlug,
  getChildCategories,
} from "@/lib/services/categories";
import { ServiceMedia } from "@/components/services/service-media";

type ServiceCategoryPageProps = {
  params: Promise<{
    categorySlug: string;
  }>;
};

export default async function ServiceCategoryPage({
  params,
}: ServiceCategoryPageProps) {
  const { categorySlug } = await params;

  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  // This route is specifically for top-level categories.
  // Subcategories must use the hierarchical URL.
  if (category.parent_id) {
    notFound();
  }

  const children = await getChildCategories(category.id);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Category hero */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-slate-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.2),transparent_50%)]"
        />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <Link
              href="/services"
              className="font-medium text-slate-300 transition hover:text-white"
            >
              All services
            </Link>

            <span aria-hidden="true" className="text-slate-600">
              /
            </span>

            <span aria-current="page" className="font-medium text-white">
              {category.name}
            </span>
          </nav>

          <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">
                Explore ErrandHub
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {category.name}
              </h1>

              {category.description ? (
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  {category.description}
                </p>
              ) : (
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Explore available options in {category.name} and choose the
                  service that best fits your needs.
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
                  <Layers3 className="h-4 w-4 text-teal-300" />
                  {children.length}{" "}
                  {children.length === 1 ? "subcategory" : "subcategories"}
                </span>

                <Link
                  href="/services/categories"
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  All categories
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex sm:justify-end">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-xl">
                <ServiceMedia
                  icon={category.icon}
                  imageUrl={category.image_url}
                  name={category.name}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subcategories */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              Find what you need
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Browse {category.name}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              {children.length > 0
                ? "Choose a subcategory to explore the services available."
                : "There are currently no subcategories listed here."}
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Layers3 className="h-7 w-7 text-slate-500" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              No subcategories available yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              New options may be added to this category later. You can browse
              other categories in the meantime.
            </p>

            <Link
              href="/services/categories"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse all categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/services/${category.slug}/${child.slug}`}
                className="group flex min-h-56 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-100 transition group-hover:bg-teal-50 group-hover:ring-teal-100">
                    <ServiceMedia
                      icon={child.icon}
                      imageUrl={child.image_url}
                      name={child.name}
                      size="md"
                    />
                  </div>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-teal-200 group-hover:bg-teal-50 group-hover:text-teal-800">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>

                <h3 className="mt-5 font-semibold text-slate-900 transition group-hover:text-teal-800">
                  {child.name}
                </h3>

                {child.description ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {child.description}
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Explore services in this subcategory.
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-slate-700 transition group-hover:text-teal-800">
                  <CheckCircle2 className="h-4 w-4" />
                  View services
                  <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
