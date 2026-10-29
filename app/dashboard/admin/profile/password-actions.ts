"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type ProfilePasswordState = {
  error?: string;
  success?: string;
};

export async function updateProfilePassword(
  _prevState: ProfilePasswordState,
  formData: FormData,
): Promise<ProfilePasswordState> {
  const { user } = await requireRole(["admin"]);

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Please complete all password fields." };
  }

  if (newPassword.length < 8) {
    return { error: "Your new password must be at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "The new passwords do not match." };
  }

  if (currentPassword === newPassword) {
    return {
      error: "Your new password must be different from your current password.",
    };
  }

  if (!user.email) {
    return { error: "Your account does not have an email address." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { error: "Password verification is temporarily unavailable." };
  }

  const verificationClient = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { error: verificationError } =
    await verificationClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

  if (verificationError) {
    return { error: "Your current password is incorrect." };
  }

  const supabase = await createClient();

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: "Your password has been updated successfully." };
}
