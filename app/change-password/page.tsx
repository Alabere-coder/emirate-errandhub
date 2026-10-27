import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-user";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const result = await getCurrentUser();

  if (!result) {
    redirect("/login");
  }

  const { profile } = result;

  // Only administrators marked for a first-login password change use this page.
  if (
    (profile.role !== "admin" && profile.role !== "super_admin") ||
    !profile.must_change_password
  ) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Change your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Set a new password before continuing to your administrator
            dashboard.
          </p>
        </div>

        <ChangePasswordForm />
      </div>
    </main>
  );
}
