import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";
import {
  getCategoryBySlug,
  getChildCategories,
} from "@/lib/services/categories";
import { notFound } from "next/navigation";

type ServiceCategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ServiceCategoryPage({
  params,
}: ServiceCategoryPageProps) {
  const { slug } = await params;

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const children = await getChildCategories(category.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/services"
              className="font-medium text-slate-500 hover:text-slate-900"
            >
              All services
            </Link>

            {category.parent && (
              <>
                <span className="text-slate-300">/</span>

                <Link
                  href={`/services/${category.parent.slug}`}
                  className="font-medium text-slate-500 hover:text-slate-900"
                >
                  {category.parent.name}
                </Link>
              </>
            )}

            <span className="text-slate-300">/</span>

            <span className="font-medium text-slate-900">{category.name}</span>
          </div>

          <div className="mt-8 max-w-3xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <BriefcaseBusiness className="h-7 w-7" />
            </div>

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

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {children.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Services available
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose the specific service you need.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/services/${child.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>

                    <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {child.name}
                  </h3>

                  {child.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {child.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Find providers
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-slate-900">
                Need {category.name.toLowerCase()}?
              </h2>

              <p className="mt-2 leading-7 text-slate-600">
                Tell us what you need and we'll help connect you with an
                available service provider.
              </p>

              <Link
                href={`/dashboard/customer/requests/new?category=${category.id}`}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Request this service
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
