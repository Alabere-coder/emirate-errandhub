"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Search,
  Users,
} from "lucide-react";

type RequestRecord = {
  id: string;
  customer_id: string;
  category_id: string | null;
  service_id: string | null;
  title: string;
  description: string | null;
  budget: number | null;
  currency: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  is_urgent: boolean;
  address: string | null;
  city: string | null;
  state: string | null;
  status: string;
  created_at: string;
  customerName: string;
  customerPhone: string | null;
  categoryName: string;
  serviceName: string;
};

type JobRecord = {
  id: string;
  request_id: string;
  customer_id: string;
  worker_id: string | null;
  agreed_amount: number | null;
  currency: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  created_at: string;
  customerName: string;
  workerName: string;
  workerPhone: string | null;
  requestTitle: string;
};

type Props = {
  requests: RequestRecord[];
  jobs: JobRecord[];
};

type Tab = "requests" | "jobs";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(date);
}

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || amount === undefined) return "Not set";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function readableStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (["completed", "approved", "verified", "paid"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (["cancelled", "rejected", "failed", "inactive"].includes(normalized)) {
    return "bg-rose-50 text-rose-700 ring-rose-600/20";
  }

  if (["in_progress", "assigned", "accepted", "quoted"].includes(normalized)) {
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }

  return "bg-amber-50 text-amber-700 ring-amber-600/20";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(status)}`}
    >
      {readableStatus(status)}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof ClipboardList;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value.toLocaleString("en-NG")}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export function RequestsJobsClient({ requests, jobs }: Props) {
  const [tab, setTab] = useState<Tab>("requests");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeRecords = tab === "requests" ? requests : jobs;

  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(activeRecords.map((record) => record.status).filter(Boolean)),
      ).sort(),
    [activeRecords],
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      const searchable = [
        request.title,
        request.id,
        request.customerName,
        request.customerPhone,
        request.categoryName,
        request.serviceName,
        request.city,
        request.state,
        request.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [requests, search, statusFilter]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;

      const searchable = [
        job.id,
        job.request_id,
        job.requestTitle,
        job.customerName,
        job.workerName,
        job.workerPhone,
        job.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [jobs, search, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <ClipboardList className="size-4" />
            Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Requests &amp; Jobs
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor customer service requests, track job assignments, and review
            progress across Emirate ErrandHub.
          </p>
        </div>

        <Link
          href="/dashboard/admin"
          className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total requests"
          value={requests.length}
          detail="Loaded service requests"
          icon={ClipboardList}
        />
        <SummaryCard
          label="Open requests"
          //   value={
          //     requests.filter((request) =>
          //       ["open", "pending"].includes(request.status.toLowerCase()),
          //     ).length
          //   }
          value={
            requests.filter(
              (request) =>
                !["completed", "cancelled", "rejected"].includes(
                  request.status.toLowerCase(),
                ),
            ).length
          }
          detail="Awaiting further action"
          icon={Clock3}
        />
        <SummaryCard
          label="Total jobs"
          value={jobs.length}
          detail="Created job records"
          icon={BriefcaseBusiness}
        />
        {/* <SummaryCard
          label="Unassigned jobs"
          value={jobs.filter((job) => !job.worker_id).length}
          detail="No worker linked to job"
          icon={Users}
        /> */}
        <SummaryCard
          label="Unassigned requests"
          value={
            requests.filter((request) => {
              const relatedJobs = jobs.filter(
                (job) => job.request_id === request.id,
              );

              return (
                relatedJobs.length === 0 ||
                relatedJobs.every((job) => !job.worker_id)
              );
            }).length
          }
          detail="Requests without an assigned worker"
          icon={Users}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Operations overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and inspect requests or jobs.
              </p>
            </div>

            <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("requests");
                  setStatusFilter("all");
                  setExpandedId(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === "requests"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Requests ({requests.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("jobs");
                  setStatusFilter("all");
                  setExpandedId(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === "jobs"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Jobs ({jobs.length})
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  tab === "requests"
                    ? "Search title, customer, category, location..."
                    : "Search job, request, customer, or worker..."
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {readableStatus(status)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </div>

        {tab === "requests" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Request</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Service</th>
                  <th className="px-5 py-4 font-semibold">Budget</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Submitted</th>
                  <th className="px-5 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <Fragment key={request.id}>
                    <tr
                      key={request.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                            <ClipboardList className="size-4" />
                          </div>
                          <div className="max-w-57.5">
                            <p className="font-semibold text-slate-900">
                              {request.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              ID: {request.id.slice(0, 8)}…
                            </p>
                            {request.is_urgent && (
                              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                                <AlertCircle className="size-3" />
                                Urgent
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {request.customerName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.customerPhone || "No phone"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {request.serviceName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.categoryName}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                        {formatMoney(request.budget, request.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === request.id ? null : request.id,
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {expandedId === request.id ? "Hide" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === request.id && (
                      <tr key={`${request.id}-details`} className="bg-slate-50">
                        <td colSpan={7} className="px-5 py-5">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Description
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {request.description ||
                                  "No description provided."}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Location
                              </p>
                              <p className="mt-2 flex items-start gap-2 text-sm text-slate-700">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                                {[request.address, request.city, request.state]
                                  .filter(Boolean)
                                  .join(", ") || "No location provided"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Preferred schedule
                              </p>
                              <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                                <CalendarDays className="size-4 text-slate-400" />
                                {[
                                  request.preferred_date,
                                  request.preferred_time,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "No preference provided"}
                              </p>
                              <p className="mt-2 break-all text-xs text-slate-500">
                                Request ID: {request.id}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <EmptyState message="No service requests match these filters." />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Job</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Worker</th>
                  <th className="px-5 py-4 font-semibold">Agreed amount</th>
                  <th className="px-5 py-4 font-semibold">Scheduled</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <Fragment key={job.id}>
                    <tr
                      key={job.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {job.requestTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Job ID: {job.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {job.customerName}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {job.workerName}
                        </p>
                        {job.workerPhone && (
                          <p className="mt-1 text-xs text-slate-500">
                            {job.workerPhone}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                        {formatMoney(job.agreed_amount, job.currency)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(job.scheduled_at)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expandedId === job.id ? null : job.id)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {expandedId === job.id ? "Hide" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === job.id && (
                      <tr key={`${job.id}-details`} className="bg-slate-50">
                        <td colSpan={7} className="px-5 py-5">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Related request
                              </p>
                              <p className="mt-2 break-all text-sm text-slate-700">
                                {job.request_id}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Job created
                              </p>
                              <p className="mt-2 text-sm text-slate-700">
                                {formatDate(job.created_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Started
                              </p>
                              <p className="mt-2 text-sm text-slate-700">
                                {formatDate(job.started_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Completed
                              </p>
                              <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                                <CheckCircle2 className="size-4 text-slate-400" />
                                {formatDate(job.completed_at)}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {filteredJobs.length === 0 && (
              <EmptyState message="No jobs match these filters." />
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing{" "}
            {tab === "requests" ? filteredRequests.length : filteredJobs.length}{" "}
            of {tab === "requests" ? requests.length : jobs.length}{" "}
            {tab === "requests" ? "requests" : "jobs"}
          </span>
          <span>Latest records appear first.</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
        <Search className="size-6" />
      </div>
      <p className="mt-4 font-semibold text-slate-800">{message}</p>
      <p className="mt-1 text-sm text-slate-500">
        Try a different search term or clear the filters.
      </p>
    </div>
  );
}
