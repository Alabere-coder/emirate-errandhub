import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
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

  // Verify that the subcategory belongs to the category in the URL.
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
      {/* Hero */}
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

            <Link
              href={`/services/${parentCategory.slug}`}
              className="font-medium text-slate-300 transition hover:text-white"
            >
              {parentCategory.name}
            </Link>

            <span aria-hidden="true" className="text-slate-600">
              /
            </span>

            <span aria-current="page" className="font-medium text-white">
              {subcategory.name}
            </span>
          </nav>

          <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">
                Explore available services
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {subcategory.name}
              </h1>

              {subcategory.description ? (
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  {subcategory.description}
                </p>
              ) : (
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Explore the services available under {subcategory.name} and
                  choose the option that fits your needs.
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
                  <Layers3 className="h-4 w-4 text-teal-300" />
                  {services.length}{" "}
                  {services.length === 1 ? "service" : "services"}
                </span>

                <Link
                  href={`/services/${parentCategory.slug}`}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {parentCategory.name}
                </Link>
              </div>
            </div>

            <div className="flex sm:justify-end">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-xl">
                <ServiceMedia
                  icon={subcategory.icon}
                  imageUrl={subcategory.image_url}
                  name={subcategory.name}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Choose your service
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Available services
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Compare the available options and select the service you need.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Layers3 className="h-7 w-7 text-slate-500" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              No services available yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Services will appear here when they become available. You can
              return to the parent category to explore other options.
            </p>

            <Link
              href={`/services/${parentCategory.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {parentCategory.name}
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${parentCategory.slug}/${subcategory.slug}/${service.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  {service.image_url ? (
                    <Image
                      src={service.image_url}
                      alt={service.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ServiceMedia
                        icon={service.icon}
                        imageUrl={null}
                        name={service.name}
                        size="lg"
                      />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-slate-950/20 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-900 transition group-hover:text-teal-800">
                      {service.name}
                    </h3>

                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-800" />
                  </div>

                  {service.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {service.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Explore this service to learn more.
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-slate-700 transition group-hover:text-teal-800">
                    <CheckCircle2 className="h-4 w-4" />
                    View service details
                    <ArrowRight className="ml-auto h-4 w-4" />
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
