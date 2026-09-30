import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { getActiveServiceCategoryTree } from "@/lib/services/categories";

export default async function ServicesPage() {
  const categories = await getActiveServiceCategoryTree();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Emirate ErrandHub
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Find the right service for your needs
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Browse trusted service providers across a wide range of household,
              repair, delivery, personal and professional services.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-400" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No services available yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Service categories will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => (
              <section key={category.id}>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {category.name}
                    </h2>

                    {category.description && (
                      <p className="mt-1 max-w-2xl text-sm text-slate-500">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/services/${category.slug}`}
                    className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900 sm:flex"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {category.children.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/services/${child.slug}`}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <BriefcaseBusiness className="h-5 w-5" />
                        </div>

                        <h3 className="mt-4 font-semibold text-slate-900">
                          {child.name}
                        </h3>

                        {child.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {child.description}
                          </p>
                        )}

                        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-600 transition group-hover:text-slate-900">
                          Explore service
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    href={`/services/${category.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:shadow-sm"
                  >
                    Explore {category.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
