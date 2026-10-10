import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
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

  if (!category || category.parent_id) {
    notFound();
  }

  // Get the subcategory and verify its parent.
  const subcategory = await getCategoryBySlug(subcategorySlug);

  if (
    !subcategory ||
    !subcategory.parent_id ||
    subcategory.parent_id !== category.id
  ) {
    notFound();
  }

  // Get the active service belonging to this subcategory.
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

  const requirements = [
    ...(service.requires_verification
      ? [
          {
            title: "Verified workers",
            description:
              "Workers offering this service must meet the applicable verification requirements.",
            icon: ShieldCheck,
          },
        ]
      : []),
    ...(service.requires_certificate
      ? [
          {
            title: "Relevant certification",
            description:
              "Workers may need to provide relevant professional certificates.",
            icon: BadgeCheck,
          },
        ]
      : []),
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-500"
        >
          <Link
            href="/services"
            className="transition-colors hover:text-teal-700"
          >
            Services
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            href={`/services/${category.slug}`}
            className="transition-colors hover:text-teal-700"
          >
            {category.name}
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            href={`/services/${category.slug}/${subcategory.slug}`}
            className="transition-colors hover:text-teal-700"
          >
            {subcategory.name}
          </Link>

          <span aria-hidden="true">/</span>

          <span aria-current="page" className="font-medium text-slate-900">
            {service.name}
          </span>
        </nav>

        {/* Back navigation */}
        <Link
          href={`/services/${category.slug}/${subcategory.slug}`}
          className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition-colors hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {subcategory.name}
        </Link>

        {/* Main service panel */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Service image */}
          <div className="relative aspect-16/7 min-h-56 overflow-hidden bg-slate-100 sm:aspect-21/8">
            {service.image_url ? (
              <Image
                src={service.image_url}
                alt={service.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-linear-to-br from-slate-100 via-slate-50 to-teal-50">
                <ServiceMedia
                  icon={service.icon}
                  imageUrl={null}
                  name={service.name}
                  size="lg"
                />
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/90 sm:text-sm">
                <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                  {category.name}
                </span>

                <span aria-hidden="true">/</span>

                <span>{subcategory.name}</span>
              </div>

              <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {service.name}
              </h1>
            </div>
          </div>

          <div className="grid gap-10 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12 lg:p-10">
            {/* Main information */}
            <div className="min-w-0">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Service overview
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Get the help you need
                </h2>

                <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">
                  {service.description ||
                    `Explore ${service.name.toLowerCase()} through Emirate ErrandHub. Submit your request with the details of the job, your preferred schedule, and location so that suitable workers can assess your needs.`}
                </p>
              </div>

              {/* Requirements */}
              {requirements.length > 0 && (
                <div className="mt-9 rounded-2xl border border-teal-100 bg-teal-50/60 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-teal-100">
                      <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        Service requirements
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        These requirements help customers understand the
                        qualifications expected for this service.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {requirements.map((requirement) => {
                      const Icon = requirement.icon;

                      return (
                        <div key={requirement.title} className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />

                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              {requirement.title}
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {requirement.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="mt-9">
                <h2 className="text-lg font-bold text-slate-900">
                  How it works
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      number: "01",
                      title: "Submit a request",
                      description:
                        "Describe the service you need and provide your preferred details.",
                    },
                    {
                      number: "02",
                      title: "Review quotations",
                      description:
                        "Compare worker quotations and choose the offer that suits you.",
                    },
                    {
                      number: "03",
                      title: "Get it done",
                      description:
                        "Confirm your choice and follow the job through to completion.",
                    },
                  ].map((step) => (
                    <div
                      key={step.number}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <span className="text-xs font-bold tracking-widest text-teal-700">
                        {step.number}
                      </span>

                      <h3 className="mt-3 text-sm font-bold text-slate-900">
                        {step.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Request sidebar */}
            <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 lg:sticky lg:top-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
                <ClipboardList className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                Need this service?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tell us what you need, where you need it, and when you prefer
                the work to be done. You can review quotations before deciding
                which worker to hire.
              </p>

              <Link
                href={`/dashboard/customer/requests/new?service=${service.id}`}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                Request this service
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="mt-4 flex items-start gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <p>You can review quotations before accepting an offer.</p>
              </div>

              <Link
                href={`/services/${category.slug}/${subcategory.slug}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                Explore more services
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </section>

        {/* Bottom navigation */}
        <div className="mt-8 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <p className="font-semibold text-slate-900">
              Looking for something else?
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Browse our categories to find another service.
            </p>
          </div>

          <Link
            href="/services/categories"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-50"
          >
            Browse categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
