"use server";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type EmailChangeState = {
  error?: string;
  success?: string;
};

export async function requestEmailChange(
  _prevState: EmailChangeState,
  formData: FormData,
): Promise<EmailChangeState> {
  const { user } = await requireRole(["admin"]);

  const newEmail = String(formData.get("newEmail") ?? "")
    .trim()
    .toLowerCase();

  if (!newEmail) {
    return { error: "Please enter your new email address." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(newEmail)) {
    return { error: "Please enter a valid email address." };
  }

  if (newEmail === user.email?.toLowerCase()) {
    return {
      error: "Your new email must be different from your current email.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "A confirmation link has been sent. Follow the instructions in your email to complete the change.",
  };
}
