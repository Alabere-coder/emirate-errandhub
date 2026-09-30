import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";

export default async function DashboardPage() {
  const { profile } = await requireAuth();

  switch (profile.role) {
    case "customer":
      redirect("/dashboard/customer");

    case "worker":
      redirect("/dashboard/worker");

    case "admin":
      redirect("/dashboard/admin");

    default:
      redirect("/login");
  }
}
