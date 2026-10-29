import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();

  const { data: branding } = await supabase.rpc("get_public_platform_settings");

  const platformName = branding?.[0]?.platform_name || "Emirate ErrandHub";

  const platformDescription =
    branding?.[0]?.platform_description || "Services made easier.";

  const platformLogoUrl = branding?.[0]?.platform_logo_url ?? null;

  return (
    <DashboardShell
      role={profile.role}
      firstName={profile.first_name}
      lastName={profile.last_name}
      avatarUrl={profile.avatar_url}
      platformLogoUrl={platformLogoUrl}
      platformName={platformName}
      platformDescription={platformDescription}
    >
      {children}
    </DashboardShell>
  );
}

// import { DashboardShell } from "@/components/dashboard/dashboard-shell";
// import { requireAuth } from "@/lib/auth/require-auth";
// import { redirect } from "next/navigation";

// export default async function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { profile } = await requireAuth();

//   if (
//     profile.must_change_password &&
//     (profile.role === "admin" || profile.role === "super_admin")
//   ) {
//     redirect("/change-password");
//   }

//   return (
//     <DashboardShell
//       role={profile.role}
//       firstName={profile.first_name}
//       lastName={profile.last_name}
//       avatarUrl={profile.avatar_url}
//     >
//       {children}
//     </DashboardShell>
//   );
// }
