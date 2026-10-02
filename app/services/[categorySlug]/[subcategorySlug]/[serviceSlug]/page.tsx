import Link from "next/link";

import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

import { notFound } from "next/navigation";

import { getCategoryBySlug } from "@/lib/services/categories";
import { createClient } from "@/lib/supabase/server";
import { ServiceMedia } from "@/components/services/service-media";

type ServicePageProps = {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
    serviceSlug: string;
  }>;
};

export default async function ServicePage({ params }: ServicePageProps) {
  const { categorySlug, subcategorySlug, serviceSlug } = await params;

  const supabase = await createClient();

  // Get the top-level category.
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  // The first level must be a top-level category.
  if (category.parent_id) {
    notFound();
  }

  // Get the subcategory.
  const subcategory = await getCategoryBySlug(subcategorySlug);

  if (!subcategory) {
    notFound();
  }

  // The second level must be a subcategory.
  if (!subcategory.parent_id) {
    notFound();
  }

  // Make sure the subcategory belongs to the category
  // specified in the URL.
  if (subcategory.parent_id !== category.id) {
    notFound();
  }

  // Get the service.
  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", serviceSlug)
    .eq("category_id", subcategory.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error loading service:", error);
  }

  if (!service) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/services" className="transition hover:text-slate-900">
            Services
          </Link>

          <ChevronRight className="h-4 w-4" />

          <Link
            href={`/services/${category.slug}`}
            className="transition hover:text-slate-900"
          >
            {category.name}
          </Link>

          <ChevronRight className="h-4 w-4" />

          <Link
            href={`/services/${category.slug}/${subcategory.slug}`}
            className="transition hover:text-slate-900"
          >
            {subcategory.name}
          </Link>

          <ChevronRight className="h-4 w-4" />

          <span className="font-medium text-slate-900">{service.name}</span>
        </nav>

        {/* Back link */}
        <Link
          href={`/services/${category.slug}/${subcategory.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {subcategory.name}
        </Link>

        {/* Service card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Service image / icon */}
          {service.image_url ? (
            <div className="aspect-[21/9] overflow-hidden bg-slate-100">
              <img
                src={service.image_url}
                alt={service.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[21/9] items-center justify-center bg-slate-100">
              <ServiceMedia
                icon={service.icon}
                imageUrl={null}
                name={service.name}
                size="lg"
              />
            </div>
          )}

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              {/* Category */}
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {category.name} / {subcategory.name}
              </p>

              {/* Service name */}
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {service.name}
              </h1>

              {/* Description */}
              {service.description && (
                <p className="mt-5 text-base leading-8 text-slate-600">
                  {service.description}
                </p>
              )}
            </div>

            {/* Requirements */}
            {(service.requires_verification ||
              service.requires_certificate) && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-sm font-semibold text-slate-900">
                  Service requirements
                </h2>

                <div className="mt-4 space-y-3">
                  {service.requires_verification && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-slate-700" />

                      <span>Available workers must be verified.</span>
                    </div>
                  )}

                  {service.requires_certificate && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-slate-700" />

                      <span>
                        Workers may be required to provide relevant
                        certification.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/dashboard/customer/requests/new?service=${service.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Request this service
              </Link>

              <Link
                href={`/services/${category.slug}/${subcategory.slug}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View more services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
