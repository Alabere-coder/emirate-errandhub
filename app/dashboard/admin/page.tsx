import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  Users,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

export default async function AdminDashboardPage() {
  const { profile } = await requireRole(["admin"]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">Administration</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {profile.first_name}
          </h1>

          <p className="mt-2 text-slate-600">
            Manage ErrandHub users, services, jobs and platform operations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            icon={<Users className="h-5 w-5" />}
            title="Users"
            description="Manage customers, workers and administrators."
          />

          <DashboardCard
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            title="Services"
            description="Manage service categories and availability."
          />

          <DashboardCard
            icon={<ClipboardList className="h-5 w-5" />}
            title="Requests & jobs"
            description="Monitor service requests and active jobs."
          />

          <DashboardCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Analytics"
            description="View platform activity and performance."
          />
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>

      <h2 className="mt-5 font-semibold text-slate-900">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
