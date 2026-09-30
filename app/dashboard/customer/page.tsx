import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Heart,
  Search,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

export default async function CustomerDashboardPage() {
  const { profile } = await requireRole(["customer"]);

  const firstName = profile.first_name || "there";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Customer Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {firstName}
          </h1>

          <p className="mt-2 text-slate-600">
            Find trusted professionals and get help with your everyday tasks.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            href="/services"
            icon={<Search className="h-5 w-5" />}
            title="Find a service"
            description="Browse available services and professionals."
          />

          <DashboardCard
            href="/dashboard/customer/requests"
            icon={<ClipboardList className="h-5 w-5" />}
            title="My requests"
            description="View and manage your service requests."
          />

          <DashboardCard
            href="/dashboard/customer/favorites"
            icon={<Heart className="h-5 w-5" />}
            title="Favorites"
            description="View your saved service providers."
          />

          <DashboardCard
            href="/dashboard/customer/profile"
            icon={<UserRound className="h-5 w-5" />}
            title="My profile"
            description="Manage your account and personal details."
          />
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Need something done?
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Tell us what you need help with, choose your preferred schedule and
            location, and receive quotations from available professionals.
          </p>

          <Link
            href="/dashboard/customer/requests/new"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Request a service
            <ArrowRight className="h-4 w-4" />
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
