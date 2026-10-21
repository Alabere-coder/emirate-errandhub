"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";

const DEV_OTP = "123456";

function isOtpSimulationEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ERRANDHUB_PHONE_OTP_SIMULATION === "true"
  );
}

function normalizeNigerianPhone(value: string): string | null {
  const phone = value.replace(/[\s()-]/g, "");

  if (/^0[789]\d{9}$/.test(phone)) {
    return `+234${phone.slice(1)}`;
  }

  if (/^234[789]\d{9}$/.test(phone)) {
    return `+${phone}`;
  }

  if (/^\+234[789]\d{9}$/.test(phone)) {
    return phone;
  }

  return null;
}

export async function sendWorkerPhoneOtp(formData: FormData) {
  const { supabase } = await requireRole(["worker"]);

  const phone = normalizeNigerianPhone(
    String(formData.get("phone") ?? "").trim(),
  );

  if (!phone) {
    redirect("/dashboard/worker/phone-verification?status=invalid-phone");
  }

  // Local UI testing only: never sends SMS or updates Supabase Auth.
  if (isOtpSimulationEnabled()) {
    redirect("/dashboard/worker/phone-verification?status=dev-otp-sent");
  }

  const { error } = await supabase.auth.updateUser({ phone });

  if (error) {
    console.error("Worker phone OTP request failed:", {
      code: error.code,
      message: error.message,
    });

    redirect("/dashboard/worker/phone-verification?status=send-failed");
  }

  redirect("/dashboard/worker/phone-verification?status=otp-sent");
}

export async function verifyWorkerPhoneOtp(formData: FormData) {
  const { supabase } = await requireRole(["worker"]);

  const phone = normalizeNigerianPhone(
    String(formData.get("phone") ?? "").trim(),
  );
  const token = String(formData.get("token") ?? "").trim();

  if (!phone) {
    redirect("/dashboard/worker/phone-verification?status=invalid-phone");
  }

  if (!/^\d{6}$/.test(token)) {
    redirect("/dashboard/worker/phone-verification?status=invalid-code");
  }

  // This only tests the form flow. It does NOT verify the real phone.
  if (isOtpSimulationEnabled()) {
    redirect(
      token === DEV_OTP
        ? "/dashboard/worker/phone-verification?status=dev-test-passed"
        : "/dashboard/worker/phone-verification?status=dev-test-failed",
    );
  }

  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "phone_change",
  });

  if (error) {
    console.error("Worker phone OTP verification failed:", {
      code: error.code,
      message: error.message,
    });

    redirect("/dashboard/worker/phone-verification?status=verification-failed");
  }

  revalidatePath("/dashboard/worker/phone-verification");
  revalidatePath("/dashboard/worker/earnings");

  redirect("/dashboard/worker/phone-verification?status=verified");
}

// "use server";

// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";

// import { requireRole } from "@/lib/auth/require-role";

// function normalizeNigerianPhone(value: string): string | null {
//   const phone = value.replace(/[\s()-]/g, "");

//   if (/^0[789]\d{9}$/.test(phone)) {
//     return `+234${phone.slice(1)}`;
//   }

//   if (/^234[789]\d{9}$/.test(phone)) {
//     return `+${phone}`;
//   }

//   if (/^\+234[789]\d{9}$/.test(phone)) {
//     return phone;
//   }

//   return null;
// }

// export async function sendWorkerPhoneOtp(formData: FormData) {
//   await requireRole(["worker"]);

//   const rawPhone = String(formData.get("phone") ?? "").trim();
//   const phone = normalizeNigerianPhone(rawPhone);

//   if (!phone) {
//     redirect("/dashboard/worker/phone-verification?status=invalid-phone");
//   }

//   const { supabase } = await requireRole(["worker"]);

//   const { error } = await supabase.auth.updateUser({ phone });

//   if (error) {
//     console.error("Worker phone OTP request failed:", {
//       code: error.code,
//       message: error.message,
//     });

//     redirect("/dashboard/worker/phone-verification?status=send-failed");
//   }

//   redirect("/dashboard/worker/phone-verification?status=otp-sent");
// }

// export async function verifyWorkerPhoneOtp(formData: FormData) {
//   await requireRole(["worker"]);

//   const rawPhone = String(formData.get("phone") ?? "").trim();
//   const phone = normalizeNigerianPhone(rawPhone);
//   const token = String(formData.get("token") ?? "").trim();

//   if (!phone) {
//     redirect("/dashboard/worker/phone-verification?status=invalid-phone");
//   }

//   if (!/^\d{6}$/.test(token)) {
//     redirect("/dashboard/worker/phone-verification?status=invalid-code");
//   }

//   const { supabase } = await requireRole(["worker"]);

//   const { error } = await supabase.auth.verifyOtp({
//     phone,
//     token,
//     type: "phone_change",
//   });

//   if (error) {
//     console.error("Worker phone OTP verification failed:", {
//       code: error.code,
//       message: error.message,
//     });

//     redirect("/dashboard/worker/phone-verification?status=verification-failed");
//   }

//   revalidatePath("/dashboard/worker/phone-verification");
//   revalidatePath("/dashboard/worker/earnings");

//   redirect("/dashboard/worker/phone-verification?status=verified");
// }
