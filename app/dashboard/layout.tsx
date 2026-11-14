import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";

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

  return <>{children}</>;
}
