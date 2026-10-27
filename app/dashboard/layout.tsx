import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAuth } from "@/lib/auth/require-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuth();

  if (
    profile.must_change_password &&
    (profile.role === "admin" || profile.role === "super_admin")
  ) {
    redirect("/change-password");
  }

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
