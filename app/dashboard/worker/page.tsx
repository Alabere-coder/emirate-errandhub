import Link from "next/link";
import {
  BriefcaseBusiness,
  ClipboardList,
  Clock3,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

export default async function WorkerDashboardPage() {
  const { profile } = await requireRole(["worker"]);

  const firstName = profile.first_name || "there";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">Worker Dashboard</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {firstName}
          </h1>

          <p className="mt-2 text-slate-600">
            Find service requests, submit quotations, and manage your jobs.
          </p>
        </div>

        {/* Dashboard cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            href="/dashboard/worker/requests"
            icon={<ClipboardList className="h-5 w-5" />}
            title="Service requests"
            description="Browse customer requests and find jobs you can handle."
          />

          <DashboardCard
            href="/dashboard/worker/quotations"
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            title="My quotations"
            description="View quotations you have submitted and their statuses."
          />

          <DashboardCard
            href="/dashboard/worker/jobs"
            icon={<Clock3 className="h-5 w-5" />}
            title="My jobs"
            description="Manage jobs that have been assigned to you."
          />

          <DashboardCard
            href="/dashboard/worker/profile"
            icon={<UserRound className="h-5 w-5" />}
            title="My profile"
            description="Manage your worker profile and service information."
          />
        </div>

        {/* Main action */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Find your next job
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Browse customer service requests, review the task details, and
            submit a quotation for jobs you are qualified to handle.
          </p>

          <Link
            href="/dashboard/worker/requests"
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Browse service requests
          </Link>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>

      <h2 className="mt-5 font-semibold text-slate-900">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}
