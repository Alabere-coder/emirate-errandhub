"use server";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";

import {
  sendPublicSupportAdminNotification,
  sendPublicSupportConfirmation,
} from "@/lib/email/public-support";

import { createAdminClient } from "@/lib/supabase/admin";

export type PublicSupportActionState = {
  success?: string;
  error?: string;
  emailWarning?: string;
};

const allowedCategories = [
  "customer_support",
  "service_provider_support",
  "general_enquiry",
] as const;

const SHORT_WINDOW_SECONDS = 15 * 60;
const SHORT_WINDOW_LIMIT = 5;

const DAILY_WINDOW_SECONDS = 24 * 60 * 60;
const DAILY_WINDOW_LIMIT = 20;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createRateLimitHash(secret: string, scope: string, ip: string) {
  return createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
}

async function getVisitorIp() {
  const requestHeaders = await headers();

  const forwardedFor = requestHeaders.get("x-forwarded-for")?.trim();

  // Local development fallback only.
  if (process.env.NODE_ENV === "development" && !forwardedFor) {
    return "127.0.0.1";
  }

  if (!forwardedFor || forwardedFor.includes(",")) {
    return null;
  }

  const normalizedIp = forwardedFor.replace(/^\[|\]$/g, "");

  return isIP(normalizedIp) ? normalizedIp : null;
}

async function checkSubmissionRateLimit(
  supabase: ReturnType<typeof createAdminClient>,
  ip: string,
  secret: string,
) {
  const shortWindowHash = createRateLimitHash(
    secret,
    "public-support-short",
    ip,
  );

  const { data: shortWindowAllowed, error: shortWindowError } =
    await supabase.rpc("check_public_support_rate_limit", {
      p_key_hash: shortWindowHash,
      p_window_seconds: SHORT_WINDOW_SECONDS,
      p_max_requests: SHORT_WINDOW_LIMIT,
    });

  if (shortWindowError) {
    console.error("Short-window rate limit check failed:", shortWindowError);
    throw new Error("Rate limit service unavailable.");
  }

  if (!shortWindowAllowed) {
    return false;
  }

  const dailyWindowHash = createRateLimitHash(
    secret,
    "public-support-daily",
    ip,
  );

  const { data: dailyWindowAllowed, error: dailyWindowError } =
    await supabase.rpc("check_public_support_rate_limit", {
      p_key_hash: dailyWindowHash,
      p_window_seconds: DAILY_WINDOW_SECONDS,
      p_max_requests: DAILY_WINDOW_LIMIT,
    });

  if (dailyWindowError) {
    console.error("Daily rate limit check failed:", dailyWindowError);
    throw new Error("Rate limit service unavailable.");
  }

  return dailyWindowAllowed === true;
}

export async function submitPublicSupportEnquiry(
  _previousState: PublicSupportActionState,
  formData: FormData,
): Promise<PublicSupportActionState> {
  // Honeypot: genuine visitors should leave this field empty.
  const website = getText(formData, "website");

  if (website) {
    return {
      success: "Thank you. Your enquiry has been submitted.",
    };
  }

  const fullName = getText(formData, "fullName");
  const email = getText(formData, "email").toLowerCase();
  const category = getText(formData, "category");
  const subject = getText(formData, "subject");
  const message = getText(formData, "message");

  if (!fullName || !email || !category || !subject || !message) {
    return { error: "Please complete all required fields." };
  }

  if (fullName.length < 2 || fullName.length > 100) {
    return {
      error: "Please enter a name between 2 and 100 characters.",
    };
  }

  if (!isValidEmail(email) || email.length > 254) {
    return { error: "Please enter a valid email address." };
  }

  if (
    !allowedCategories.includes(category as (typeof allowedCategories)[number])
  ) {
    return { error: "Please select a valid enquiry category." };
  }

  if (subject.length < 3 || subject.length > 150) {
    return {
      error: "Your subject must be between 3 and 150 characters.",
    };
  }

  if (message.length < 10 || message.length > 5000) {
    return {
      error: "Your message must be between 10 and 5,000 characters.",
    };
  }

  try {
    const secret = process.env.SUPPORT_RATE_LIMIT_SECRET;

    if (!secret || secret.length < 64) {
      console.error("SUPPORT_RATE_LIMIT_SECRET is missing or too short.");

      return {
        error:
          "Our support form is temporarily unavailable. Please try again later.",
      };
    }

    const ip = await getVisitorIp();

    if (!ip) {
      console.error("Unable to determine a valid visitor IP address.");

      return {
        error:
          "Our support form is temporarily unavailable. Please try again later.",
      };
    }

    const supabase = createAdminClient();

    const withinLimit = await checkSubmissionRateLimit(supabase, ip, secret);

    if (!withinLimit) {
      return {
        error: "You've submitted too many enquiries. Please try again later.",
      };
    }

    const turnstileToken = getText(formData, "cf-turnstile-response");

    const verified = await verifyTurnstileToken(turnstileToken, ip);

    if (!verified) {
      return {
        error:
          "Security verification failed. Please complete the verification and try again.",
      };
    }

    const { data: enquiry, error: insertError } = await supabase
      .from("public_support_messages")
      .insert({
        full_name: fullName,
        email,
        category,
        subject,
        message,
      })
      .select("id")
      .single();

    if (insertError || !enquiry) {
      console.error("Public support enquiry insert failed:", insertError);

      return {
        error: "We couldn't submit your enquiry. Please try again.",
      };
    }

    const emailInput = {
      fullName,
      email,
      category,
      subject,
      message,
    };

    const [confirmation, adminNotification] = await Promise.all([
      sendPublicSupportConfirmation(emailInput),
      sendPublicSupportAdminNotification(emailInput),
    ]);

    if (!confirmation.success || !adminNotification.success) {
      console.error("Public support email delivery was incomplete.", {
        enquiryId: enquiry.id,
        confirmationSent: confirmation.success,
        adminNotificationSent: adminNotification.success,
      });

      return {
        success: "Your enquiry has been received by our support team.",
        emailWarning:
          "Your message was saved, but an email notification could not be sent. Our team can still review your enquiry.",
      };
    }

    return {
      success:
        "Thank you! Your enquiry has been submitted. We've sent a confirmation email to you.",
    };
  } catch (error) {
    console.error("Public support submission error:", error);

    return {
      error:
        "Something went wrong while submitting your enquiry. Please try again.",
    };
  }
}

async function verifyTurnstileToken(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured.");
    return false;
  }

  if (!token || token.length > 2048) {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip: ip,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      console.error("Turnstile verification request failed.");
      return false;
    }

    const result = (await response.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
      ["error-codes"]?: string[];
    };

    if (!result.success) {
      console.error("Turnstile verification rejected:", result["error-codes"]);
      return false;
    }

    const allowedHostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);

    if (
      allowedHostnames.length > 0 &&
      (!result.hostname ||
        !allowedHostnames.includes(result.hostname.toLowerCase()))
    ) {
      console.error("Turnstile hostname validation failed.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Turnstile verification request error:", error);
    return false;
  }
}

// "use server";

// import {
//   sendPublicSupportAdminNotification,
//   sendPublicSupportConfirmation,
// } from "@/lib/email/public-support";
// import { createAdminClient } from "@/lib/supabase/admin";

// export type PublicSupportActionState = {
//   success?: string;
//   error?: string;
//   emailWarning?: string;
// };

// const allowedCategories = [
//   "customer_support",
//   "service_provider_support",
//   "general_enquiry",
// ] as const;

// function getText(formData: FormData, key: string) {
//   const value = formData.get(key);

//   return typeof value === "string" ? value.trim() : "";
// }

// function isValidEmail(email: string) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }

// export async function submitPublicSupportEnquiry(
//   _previousState: PublicSupportActionState,
//   formData: FormData,
// ): Promise<PublicSupportActionState> {
//   const fullName = getText(formData, "fullName");
//   const email = getText(formData, "email").toLowerCase();
//   const category = getText(formData, "category");
//   const subject = getText(formData, "subject");
//   const message = getText(formData, "message");

//   // Honeypot: genuine visitors should leave this field empty.
//   const website = getText(formData, "website");

//   if (website) {
//     // Return a generic response rather than revealing spam detection.
//     return {
//       success: "Thank you. Your enquiry has been submitted.",
//     };
//   }

//   if (!fullName || !email || !category || !subject || !message) {
//     return { error: "Please complete all required fields." };
//   }

//   if (fullName.length < 2 || fullName.length > 100) {
//     return { error: "Please enter a name between 2 and 100 characters." };
//   }

//   if (!isValidEmail(email) || email.length > 254) {
//     return { error: "Please enter a valid email address." };
//   }

//   if (
//     !allowedCategories.includes(category as (typeof allowedCategories)[number])
//   ) {
//     return { error: "Please select a valid enquiry category." };
//   }

//   if (subject.length < 3 || subject.length > 150) {
//     return {
//       error: "Your subject must be between 3 and 150 characters.",
//     };
//   }

//   if (message.length < 10 || message.length > 5000) {
//     return {
//       error: "Your message must be between 10 and 5,000 characters.",
//     };
//   }

//   try {
//     const supabase = createAdminClient();

//     const { data: enquiry, error: insertError } = await supabase
//       .from("public_support_messages")
//       .insert({
//         full_name: fullName,
//         email,
//         category,
//         subject,
//         message,
//       })
//       .select("id")
//       .single();

//     if (insertError || !enquiry) {
//       console.error("Public support enquiry insert failed:", insertError);

//       return {
//         error: "We couldn't submit your enquiry. Please try again.",
//       };
//     }

//     const emailInput = {
//       fullName,
//       email,
//       category,
//       subject,
//       message,
//     };

//     // The enquiry is already safely stored. Email failures must not
//     // cause the visitor to lose their submitted message.
//     const [confirmation, adminNotification] = await Promise.all([
//       sendPublicSupportConfirmation(emailInput),
//       sendPublicSupportAdminNotification(emailInput),
//     ]);

//     if (!confirmation.success || !adminNotification.success) {
//       console.error("Public support email delivery was incomplete.", {
//         enquiryId: enquiry.id,
//         confirmationSent: confirmation.success,
//         adminNotificationSent: adminNotification.success,
//       });

//       return {
//         success: "Your enquiry has been received by our support team.",
//         emailWarning:
//           "Your message was saved, but an email notification could not be sent. Our team can still review your enquiry.",
//       };
//     }

//     return {
//       success:
//         "Thank you! Your enquiry has been submitted. We've sent a confirmation email to you.",
//     };
//   } catch (error) {
//     console.error("Public support submission error:", error);

//     return {
//       error:
//         "Something went wrong while submitting your enquiry. Please try again.",
//     };
//   }
// }
