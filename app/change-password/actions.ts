"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export type ChangePasswordState = {
  error?: string;
  success?: string;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const { profile } = await requireAuth();

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    return { error: "You are not authorized to use this page." };
  }

  if (!profile.must_change_password) {
    redirect("/dashboard");
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();

  const { error: passwordError } = await supabase.auth.updateUser({
    password,
  });

  if (passwordError) {
    return { error: passwordError.message };
  }

  const adminClient = createAdminClient();

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", profile.id);

  if (profileError) {
    return {
      error:
        "Your password was changed, but we could not update your account status. Please contact support.",
    };
  }

  redirect("/dashboard");
}
