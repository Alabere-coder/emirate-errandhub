"use server";

import { createClient } from "@/lib/supabase/server";

export type ResetPasswordState = {
  error?: string;
  success?: string;
};

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return {
      error: "Please complete both password fields.",
    };
  }

  if (password.length < 8) {
    return {
      error: "Your password must contain at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Your passwords do not match.",
    };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error:
          "Your password recovery session is invalid or has expired. Please request a new recovery link.",
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);

      return {
        error: "We couldn't update your password. Please try again.",
      };
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Password update sign-out error:", signOutError);
    }

    return {
      success:
        "Your password has been updated successfully. You can now sign in with your new password.",
    };
  } catch (error) {
    console.error("Reset password action error:", error);

    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
