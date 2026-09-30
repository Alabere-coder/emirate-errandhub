"use server";

import { createClient } from "@/lib/supabase/server";

export type SignUpState = {
  error?: string;
  success?: boolean;
};

export async function signUp(
  _previousState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return {
      error: "Please provide all required fields.",
    };
  }

  if (!firstName.trim() || !lastName.trim()) {
    return {
      error: "First name and last name are required.",
    };
  }

  if (!email.trim()) {
    return {
      error: "Email address is required.",
    };
  }

  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match.",
    };
  }

  const supabase = await createClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      },
    },
  });

  if (error) {
    console.error("Signup error:", error);

    return {
      error: error.message,
    };
  }

  return {
    success: true,
  };
}
