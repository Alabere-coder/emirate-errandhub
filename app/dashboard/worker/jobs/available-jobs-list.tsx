"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  Wallet,
  Wrench,
} from "lucide-react";

type AvailableJob = {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  currency: string;
  status: string;
  is_urgent: boolean;
  preferred_date: string | null;
  preferred_time: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  category: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  directAssignment: { id: string; status: string } | null;
};

type Props = {
  jobs: AvailableJob[];
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(date);
}

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null) return "No budget specified";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "NGN"} ${amount.toLocaleString()}`;
  }
}

export default function AvailableJobsList({ jobs }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          jobs
            .filter((job) => job.category)
            .map((job) => [
              job.category!.id,
              {
                id: job.category!.id,
                name: job.category!.name,
              },
            ]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        (job.description ?? "").toLowerCase().includes(query) ||
        (job.category?.name ?? "").toLowerCase().includes(query) ||
        (job.service?.name ?? "").toLowerCase().includes(query) ||
        [job.city, job.state]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "all" || job.category?.id === categoryFilter;

      const matchesUrgency =
        urgencyFilter === "all" ||
        (urgencyFilter === "urgent" && job.is_urgent) ||
        (urgencyFilter === "standard" && !job.is_urgent);

      return matchesSearch && matchesCategory && matchesUrgency;
    });
  }, [jobs, search, categoryFilter, urgencyFilter]);

  const urgentCount = jobs.filter((job) => job.is_urgent).length;
  const directCount = jobs.filter((job) => job.directAssignment).length;

  const hasFilters =
    search.trim() !== "" || categoryFilter !== "all" || urgencyFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setUrgencyFilter("all");
  }

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Customer requests</p>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <Wrench className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {jobs.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Requests returned by the current query
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Urgent requests</p>
            <span className="rounded-lg bg-rose-50 p-2 text-rose-700">
              <Clock3 className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {urgentCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Marked urgent by customers
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Direct requests</p>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <MapPin className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {directCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Requests assigned directly to you
          </p>
        </div>
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-emerald-700" />
          <h2 className="font-semibold text-slate-900">Find the right job</h2>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="relative block">
            <span className="sr-only">Search jobs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, service or location..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </label>

          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-slate-500">Priority:</span>

          {[
            { value: "all", label: "All requests" },
            { value: "urgent", label: "Urgent" },
            { value: "standard", label: "Standard" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setUrgencyFilter(option.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                urgencyFilter === option.value
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Results heading */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Customer requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredJobs.length}{" "}
            {filteredJobs.length === 1 ? "request" : "requests"} found
          </p>
        </div>
      </div>

      {/* Request cards */}
      {filteredJobs.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredJobs.map((job) => (
            <article
              key={job.id}
              className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Wrench className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="wrap-break-word text-base font-semibold text-slate-900">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.category?.name ?? "Service request"}
                    {job.service?.name ? ` · ${job.service.name}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {job.is_urgent && (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                      Urgent
                    </span>
                  )}

                  {job.directAssignment && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      Direct request
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                {job.description || "No additional description provided."}
              </p>

              <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <div className="flex min-w-0 items-start gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Customer budget</p>
                    <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-900">
                      {formatCurrency(job.budget, job.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="mt-1 wrap-break-word text-sm font-medium text-slate-800">
                      {[job.city, job.state].filter(Boolean).join(", ") ||
                        "Location not specified"}
                    </p>
                  </div>
                </div>

                {(job.preferred_date || job.preferred_time) && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">
                        Customer preference
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {job.preferred_date
                          ? formatDate(job.preferred_date)
                          : "Date flexible"}
                        {job.preferred_time ? ` · ${job.preferred_time}` : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Posted {formatDate(job.created_at)}
                </p>

                <Link
                  href={`/dashboard/worker/jobs/${job.id}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  View request
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Search className="h-6 w-6" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            {jobs.length === 0
              ? "No customer requests yet"
              : "No matching requests"}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {jobs.length === 0
              ? "New requests will appear here when customers submit service requests."
              : "Try a different search, choose another category, or clear your filters."}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
