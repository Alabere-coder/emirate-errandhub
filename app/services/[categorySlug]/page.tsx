import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
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
  // If someone tries to access a subcategory through this route,
  // send them to the proper hierarchical URL.
  if (category.parent_id) {
    notFound();
  }

  const children = await getChildCategories(category.id);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/services"
              className="font-medium text-slate-500 transition hover:text-slate-900"
            >
              All services
            </Link>

            <span className="text-slate-300">/</span>

            <span className="font-medium text-slate-900">{category.name}</span>
          </nav>

          {/* Category heading */}
          <div className="mt-8 max-w-3xl">
            <ServiceMedia
              icon={category.icon}
              imageUrl={category.image_url}
              name={category.name}
              size="lg"
            />

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {category.name}
            </h1>

            {category.description && (
              <p className="mt-4 text-base leading-7 text-slate-600">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Subcategories */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {children.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-xl font-bold text-slate-900">
              No subcategories available
            </h2>

            <p className="mt-2 max-w-2xl leading-7 text-slate-600">
              There are currently no subcategories available under this
              category. Please check back later.
            </p>

            <Link
              href="/services"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Browse all services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Browse categories
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose a category to find the specific service you need.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/services/${category.slug}/${child.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  {/* Icon / image + arrow */}
                  <div className="flex items-start justify-between gap-4">
                    <ServiceMedia
                      icon={child.icon}
                      imageUrl={child.image_url}
                      name={child.name}
                      size="md"
                    />

                    <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                  </div>

                  {/* Name */}
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {child.name}
                  </h3>

                  {/* Description */}
                  {child.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {child.description}
                    </p>
                  )}

                  {/* View services */}
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <CheckCircle2 className="h-4 w-4" />
                    View services
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
