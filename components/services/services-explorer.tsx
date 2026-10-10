"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { ServiceIcon } from "@/components/services/service-icon";

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  children: ServiceCategory[];
};

type ServicesExplorerProps = {
  categories: ServiceCategory[];
};

export default function ServicesExplorer({
  categories,
}: ServicesExplorerProps) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!query) return categories.slice(0, 4);

    return categories
      .map((category) => {
        const parentMatches = [
          category.name,
          category.description ?? "",
          category.slug,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

        const matchingChildren = category.children.filter((child) =>
          [child.name, child.description ?? "", child.slug, category.name]
            .join(" ")
            .toLowerCase()
            .includes(query),
        );

        if (parentMatches) return category;

        if (matchingChildren.length > 0) {
          return { ...category, children: matchingChildren };
        }

        return null;
      })
      .filter((category): category is ServiceCategory => category !== null);
  }, [categories, query]);

  const resultCount = filteredCategories.reduce(
    (total, category) =>
      total + (category.children.length > 0 ? category.children.length : 1),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.22),transparent_48%)]"
        />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-teal-200">
              <Sparkles className="h-3.5 w-3.5" />
              Everyday tasks, made easier
            </div>

            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              The right help,
              <span className="block text-teal-300">
                right when you need it.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Find services for your home, repairs, errands, deliveries and
              everyday needs — all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-300" />
                Browse service categories
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-300" />
                Find help for your needs
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="mb-4">
              <p className="text-lg font-semibold text-white">
                What do you need help with?
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Search for a service or browse the categories below.
              </p>
            </div>

            <label htmlFor="service-search" className="sr-only">
              Search service categories
            </label>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-2 pl-4 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-teal-400">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />

              <input
                id="service-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="e.g. cleaning, plumbing, delivery"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear service search"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Search matches category names and descriptions. Select a category
              below to explore its services.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section
        id="service-categories"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              Explore ErrandHub
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {query ? "Search results" : "Explore service categories"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {query
                ? `Results for "${search.trim()}".`
                : "Choose a category to find the service that suits your needs."}
            </p>
          </div>

          {query ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
              Clear search
            </button>
          ) : (
            <Link
              href="/services/categories"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-teal-700"
            >
              All categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-6 w-6 text-slate-500" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              No matching categories found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try a different search term, such as cleaning, repairs, shopping
              or delivery.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse categories
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {query && (
              <p className="mb-5 text-sm text-slate-500">
                {resultCount} {resultCount === 1 ? "result" : "results"} found
              </p>
            )}

            <div className="space-y-10">
              {filteredCategories.map((category) => {
                const childrenToShow = query
                  ? category.children
                  : category.children.slice(0, 4);

                return (
                  <section key={category.id}>
                    <div className="mb-5 flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100">
                        {category.image_url ? (
                          <Image
                            src={category.image_url}
                            alt={category.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ServiceIcon
                            name={category.icon}
                            className="h-6 w-6"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-slate-950 sm:text-xl">
                          {category.name}
                        </h3>

                        {category.description && (
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/services/${category.slug}`}
                        className="hidden shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-teal-700 sm:inline-flex"
                      >
                        View all
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {childrenToShow.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {childrenToShow.map((child) => (
                          <Link
                            key={child.id}
                            href={`/services/${category.slug}/${child.slug}`}
                            className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-200/60"
                          >
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-teal-50 group-hover:text-teal-800">
                              {child.image_url ? (
                                <Image
                                  src={child.image_url}
                                  alt={child.name}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ServiceIcon
                                  name={child.icon}
                                  className="h-6 w-6"
                                />
                              )}
                            </div>

                            <h4 className="mt-4 font-semibold text-slate-900">
                              {child.name}
                            </h4>

                            {child.description && (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                {child.description}
                              </p>
                            )}

                            <div className="mt-auto flex items-center justify-between pt-5 text-sm font-semibold text-teal-800">
                              <span className="pt-3">Explore service</span>
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        href={`/services/${category.slug}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 transition hover:border-teal-200 hover:text-teal-800"
                      >
                        Explore {category.name}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}

                    <div className="mt-4 sm:hidden">
                      <Link
                        href={`/services/${category.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-800"
                      >
                        View all {category.name}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </section>
                );
              })}
            </div>

            {!query && (
              <div className="mt-12 rounded-3xl bg-slate-900 px-6 py-8 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-8">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Looking for something specific?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Explore the full category directory to find more options.
                  </p>
                </div>

                <Link
                  href="/services/categories"
                  className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-50 sm:mt-0"
                >
                  Browse all categories
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
