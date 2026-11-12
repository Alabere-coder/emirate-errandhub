"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = {
  error?: string;
  success?: string;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Please enter your email address." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    const requestHeaders = await headers();

    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

    const forwardedHost =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    const forwardedProtocol =
      requestHeaders.get("x-forwarded-proto") ?? "https";

    const origin =
      configuredUrl?.replace(/\/$/, "") ??
      (forwardedHost
        ? `${forwardedProtocol}://${forwardedHost}`
        : "http://localhost:3000");

    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", "/reset-password");

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl.toString(),
    });

    if (error) {
      console.error("Password recovery request error:", error);

      return {
        error:
          "We couldn't send the recovery email right now. Please try again.",
      };
    }

    return {
      success:
        "If an account exists with that email address, a password recovery link will be sent shortly. Please check your inbox and spam folder.",
    };
  } catch (error) {
    console.error("Forgot password action error:", error);

    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
