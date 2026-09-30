import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuth();

  return (
    <DashboardShell
      role={profile.role}
      firstName={profile.first_name}
      lastName={profile.last_name}
    >
      {children}
    </DashboardShell>
  );
}
