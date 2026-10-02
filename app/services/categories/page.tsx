import Link from "next/link";

import { ArrowLeft, ArrowRight, BriefcaseBusiness } from "lucide-react";

import { ServiceMedia } from "@/components/services/service-media";
import { getActiveServiceCategories } from "@/lib/services/categories";

export default async function ServiceCategoriesPage() {
  const categories = await getActiveServiceCategories();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>

          <div className="mt-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Emirate ErrandHub
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              All service categories
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Explore all the service categories available on Emirate ErrandHub.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-400" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No categories available
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Service categories will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/services/${category.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* =================================================
                      DATABASE IMAGE / ICON
                  ================================================= */}
                  <ServiceMedia
                    icon={category.icon}
                    imageUrl={category.image_url}
                    name={category.name}
                    size="md"
                  />

                  <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {category.name}
                </h2>

                {category.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {category.description}
                  </p>
                )}

                <div className="mt-5 text-sm font-medium text-slate-600 transition group-hover:text-slate-900">
                  Explore category
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
