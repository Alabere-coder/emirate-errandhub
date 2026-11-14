import { redirect } from "next/navigation";

import { CustomerDashboardShell } from "@/components/dashboard/customer-dashboard-shell";
import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuth();

  // Only customers can access the customer dashboard.
  if (profile.role !== "customer") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: branding } = await supabase.rpc("get_public_platform_settings");

  const platformName = branding?.[0]?.platform_name || "Emirate ErrandHub";

  const platformDescription =
    branding?.[0]?.platform_description || "Services made easier.";

  const platformLogoUrl = branding?.[0]?.platform_logo_url ?? null;

  return (
    <CustomerDashboardShell
      firstName={profile.first_name}
      lastName={profile.last_name}
      avatarUrl={profile.avatar_url}
      platformLogoUrl={platformLogoUrl}
      platformName={platformName}
      platformDescription={platformDescription}
    >
      {children}
    </CustomerDashboardShell>
  );
}
