import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboardShell } from "@/components/dashboard/admin-dashboard-shell";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuth();

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    redirect("/dashboard");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();

  const { data: branding } = await supabase.rpc("get_public_platform_settings");

  const platformName = branding?.[0]?.platform_name || "Emirate ErrandHub";

  const platformDescription =
    branding?.[0]?.platform_description || "Services made easier.";

  const platformLogoUrl = branding?.[0]?.platform_logo_url ?? null;

  return (
    <AdminDashboardShell
      role={profile.role}
      firstName={profile.first_name}
      lastName={profile.last_name}
      avatarUrl={profile.avatar_url}
      platformLogoUrl={platformLogoUrl}
      platformName={platformName}
      platformDescription={platformDescription}
    >
      {children}
    </AdminDashboardShell>
  );
}
