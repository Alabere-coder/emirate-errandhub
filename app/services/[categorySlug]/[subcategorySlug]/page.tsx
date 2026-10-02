import Link from "next/link";

import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { notFound } from "next/navigation";

import {
  getCategoryBySlug,
  getServicesByCategoryId,
} from "@/lib/services/categories";

import { ServiceMedia } from "@/components/services/service-media";

type ServiceSubcategoryPageProps = {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
  }>;
};

export default async function ServiceSubcategoryPage({
  params,
}: ServiceSubcategoryPageProps) {
  const { categorySlug, subcategorySlug } = await params;

  const subcategory = await getCategoryBySlug(subcategorySlug);

  if (!subcategory) {
    notFound();
  }

  // A subcategory must have a parent.
  if (!subcategory.parent_id) {
    notFound();
  }

  // Make sure the subcategory actually belongs
  // to the category in the URL.
  const parentCategory = await getCategoryBySlug(categorySlug);

  if (!parentCategory) {
    notFound();
  }

  if (subcategory.parent_id !== parentCategory.id) {
    notFound();
  }

  const services = await getServicesByCategoryId(subcategory.id);

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

            <Link
              href={`/services/${parentCategory.slug}`}
              className="font-medium text-slate-500 transition hover:text-slate-900"
            >
              {parentCategory.name}
            </Link>

            <span className="text-slate-300">/</span>

            <span className="font-medium text-slate-900">
              {subcategory.name}
            </span>
          </nav>

          {/* Heading */}
          <div className="mt-8 max-w-3xl">
            <ServiceMedia
              icon={subcategory.icon}
              imageUrl={subcategory.image_url}
              name={subcategory.name}
              size="lg"
            />

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {subcategory.name}
            </h1>

            {subcategory.description && (
              <p className="mt-4 text-base leading-7 text-slate-600">
                {subcategory.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Available services
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose the specific service you need.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-xl font-bold text-slate-900">
              No services available yet
            </h2>

            <p className="mt-2 max-w-2xl leading-7 text-slate-600">
              There are currently no services available in this category. Please
              check back later.
            </p>

            <Link
              href={`/services/${parentCategory.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {parentCategory.name}
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${parentCategory.slug}/${subcategory.slug}/${service.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                {/* Service image / icon */}
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ServiceMedia
                        icon={service.icon}
                        imageUrl={null}
                        name={service.name}
                        size="lg"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {service.name}
                    </h3>

                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                  </div>

                  {service.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {service.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <CheckCircle2 className="h-4 w-4" />
                    View service
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
