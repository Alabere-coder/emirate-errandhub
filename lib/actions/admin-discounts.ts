"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export type DiscountCodeActionState = {
  error?: string;
};

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getText(formData, key);

  if (!value) return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function getDate(formData: FormData, key: string) {
  const value = getText(formData, key);

  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? NaN : date.toISOString();
}

function validateDiscountCode(formData: FormData) {
  const code = getText(formData, "code").toUpperCase();
  const description = getText(formData, "description") || null;
  const discountType = getText(formData, "discount_type");
  const discountValue = Number(getText(formData, "discount_value"));

  const maxDiscountAmount = getOptionalNumber(formData, "max_discount_amount");

  const minBookingAmount = Number(
    getText(formData, "min_booking_amount") || "0",
  );

  const usageLimit = getOptionalNumber(formData, "usage_limit");
  const perCustomerLimit = getOptionalNumber(formData, "per_customer_limit");

  const startsAt = getDate(formData, "starts_at");
  const expiresAt = getDate(formData, "expires_at");

  const firstBookingOnly = formData.get("first_booking_only") === "on";

  const isActive = formData.get("is_active") === "on";

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
    return {
      error:
        "Code must be 3–40 characters using letters, numbers, underscores or hyphens.",
    };
  }

  if (!["percentage", "fixed"].includes(discountType)) {
    return { error: "Select a valid discount type." };
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: "Enter a valid discount value greater than zero." };
  }

  if (discountType === "percentage" && discountValue > 100) {
    return { error: "Percentage discounts cannot exceed 100%." };
  }

  if (
    maxDiscountAmount !== null &&
    (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0)
  ) {
    return { error: "Maximum discount must be greater than zero." };
  }

  if (!Number.isFinite(minBookingAmount) || minBookingAmount < 0) {
    return { error: "Minimum booking amount cannot be negative." };
  }

  for (const [label, value] of [
    ["Usage limit", usageLimit],
    ["Per-customer limit", perCustomerLimit],
  ] as const) {
    if (value !== null && (!Number.isInteger(value) || value <= 0)) {
      return { error: `${label} must be a positive whole number.` };
    }
  }

  if (Number.isNaN(startsAt) || Number.isNaN(expiresAt)) {
    return { error: "Enter valid start and expiry dates." };
  }

  if (
    startsAt &&
    expiresAt &&
    new Date(startsAt).getTime() >= new Date(expiresAt).getTime()
  ) {
    return { error: "Expiry date must be later than the start date." };
  }

  return {
    data: {
      code,
      description,
      discount_type: discountType,
      discount_value: discountValue,
      max_discount_amount: maxDiscountAmount,
      min_booking_amount: minBookingAmount,
      usage_limit: usageLimit,
      per_customer_limit: perCustomerLimit,
      first_booking_only: firstBookingOnly,
      starts_at: startsAt,
      expires_at: expiresAt,
      is_active: isActive,
    },
  };
}

export async function createDiscountCode(
  _previousState: DiscountCodeActionState,
  formData: FormData,
): Promise<DiscountCodeActionState> {
  await requireRole(["admin", "super_admin"]);

  const validation = validateDiscountCode(formData);

  if ("error" in validation) {
    return { error: validation.error };
  }

  const admin = createAdminClient() as any;

  const { error } = await admin.from("discount_codes").insert(validation.data);

  if (error) {
    console.error("Create discount code failed:", error);

    if (error.code === "23505") {
      return { error: "A discount code with this code already exists." };
    }

    return { error: "Unable to create discount code. Please try again." };
  }

  revalidatePath("/dashboard/admin/discount-codes");
  redirect("/dashboard/admin/discount-codes");
}

export async function updateDiscountCode(
  id: string,
  _previousState: DiscountCodeActionState,
  formData: FormData,
): Promise<DiscountCodeActionState> {
  await requireRole(["admin", "super_admin"]);

  if (!id) {
    return { error: "Invalid discount code." };
  }

  const validation = validateDiscountCode(formData);

  if ("error" in validation) {
    return { error: validation.error };
  }

  const admin = createAdminClient() as any;

  const { data, error } = await admin
    .from("discount_codes")
    .update(validation.data)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Update discount code failed:", error);

    if (error.code === "23505") {
      return { error: "A discount code with this code already exists." };
    }

    return { error: "Unable to update discount code. Please try again." };
  }

  if (!data) {
    return { error: "Discount code not found." };
  }

  revalidatePath("/dashboard/admin/discount-codes");
  revalidatePath(`/dashboard/admin/discount-codes/${id}/edit`);

  redirect("/dashboard/admin/discount-codes");
}

/**
 * Activate or deactivate a discount code.
 */
export async function toggleDiscountCodeStatus(
  id: string,
  isActive: boolean,
): Promise<{ error?: string }> {
  await requireRole(["admin", "super_admin"]);

  if (!id || typeof isActive !== "boolean") {
    return { error: "Invalid discount code request." };
  }

  const admin = createAdminClient() as any;

  const { data, error } = await admin
    .from("discount_codes")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Toggle discount code status failed:", error);
    return { error: "Unable to update discount code status." };
  }

  if (!data) {
    return { error: "Discount code not found." };
  }

  revalidatePath("/dashboard/admin/discount-codes");
  revalidatePath(`/dashboard/admin/discount-codes/${id}/edit`);

  redirect("/dashboard/admin/discount-codes");
}

/**
 * Permanently delete a discount code only when it has no redemption history.
 */
export async function deleteDiscountCode(
  id: string,
): Promise<{ error?: string }> {
  await requireRole(["admin", "super_admin"]);

  if (!id) {
    return { error: "Invalid discount code." };
  }

  const admin = createAdminClient() as any;

  const { count, error: redemptionError } = await admin
    .from("discount_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("discount_code_id", id);

  if (redemptionError) {
    console.error("Check discount redemptions failed:", redemptionError);
    return {
      error: "Unable to verify discount-code history. Please try again.",
    };
  }

  if ((count ?? 0) > 0) {
    return {
      error:
        "This discount code has redemption history and cannot be deleted. Deactivate it instead.",
    };
  }

  const { data, error } = await admin
    .from("discount_codes")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Delete discount code failed:", error);

    if (error.code === "23503") {
      return {
        error:
          "This discount code is linked to existing records and cannot be deleted. Deactivate it instead.",
      };
    }

    return { error: "Unable to delete discount code. Please try again." };
  }

  if (!data) {
    return { error: "Discount code not found." };
  }

  revalidatePath("/dashboard/admin/discount-codes");

  redirect("/dashboard/admin/discount-codes");
}

// "use server";

// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";

// import { requireRole } from "@/lib/auth/require-role";
// import { createAdminClient } from "@/lib/supabase/admin";

// export type DiscountCodeActionState = {
//   error?: string;
// };

// function getText(formData: FormData, key: string) {
//   return String(formData.get(key) ?? "").trim();
// }

// function getOptionalNumber(formData: FormData, key: string) {
//   const value = getText(formData, key);

//   if (!value) return null;

//   const number = Number(value);
//   return Number.isFinite(number) ? number : NaN;
// }

// function getDate(formData: FormData, key: string) {
//   const value = getText(formData, key);

//   if (!value) return null;

//   const date = new Date(value);
//   return Number.isNaN(date.getTime()) ? NaN : date.toISOString();
// }

// function validateDiscountCode(formData: FormData) {
//   const code = getText(formData, "code").toUpperCase();
//   const description = getText(formData, "description") || null;
//   const discountType = getText(formData, "discount_type");
//   const discountValue = Number(getText(formData, "discount_value"));

//   const maxDiscountAmount = getOptionalNumber(formData, "max_discount_amount");

//   const minBookingAmount = Number(
//     getText(formData, "min_booking_amount") || "0",
//   );

//   const usageLimit = getOptionalNumber(formData, "usage_limit");
//   const perCustomerLimit = getOptionalNumber(formData, "per_customer_limit");

//   const startsAt = getDate(formData, "starts_at");
//   const expiresAt = getDate(formData, "expires_at");

//   const firstBookingOnly = formData.get("first_booking_only") === "on";

//   const isActive = formData.get("is_active") === "on";

//   if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
//     return {
//       error:
//         "Code must be 3–40 characters using letters, numbers, underscores or hyphens.",
//     };
//   }

//   if (!["percentage", "fixed"].includes(discountType)) {
//     return { error: "Select a valid discount type." };
//   }

//   if (!Number.isFinite(discountValue) || discountValue <= 0) {
//     return { error: "Enter a valid discount value greater than zero." };
//   }

//   if (discountType === "percentage" && discountValue > 100) {
//     return { error: "Percentage discounts cannot exceed 100%." };
//   }

//   if (
//     maxDiscountAmount !== null &&
//     (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0)
//   ) {
//     return { error: "Maximum discount must be greater than zero." };
//   }

//   if (!Number.isFinite(minBookingAmount) || minBookingAmount < 0) {
//     return { error: "Minimum booking amount cannot be negative." };
//   }

//   for (const [label, value] of [
//     ["Usage limit", usageLimit],
//     ["Per-customer limit", perCustomerLimit],
//   ] as const) {
//     if (value !== null && (!Number.isInteger(value) || value <= 0)) {
//       return { error: `${label} must be a positive whole number.` };
//     }
//   }

//   if (Number.isNaN(startsAt) || Number.isNaN(expiresAt)) {
//     return { error: "Enter valid start and expiry dates." };
//   }

//   if (
//     startsAt &&
//     expiresAt &&
//     new Date(startsAt).getTime() >= new Date(expiresAt).getTime()
//   ) {
//     return { error: "Expiry date must be later than the start date." };
//   }

//   return {
//     data: {
//       code,
//       description,
//       discount_type: discountType,
//       discount_value: discountValue,
//       max_discount_amount: maxDiscountAmount,
//       min_booking_amount: minBookingAmount,
//       usage_limit: usageLimit,
//       per_customer_limit: perCustomerLimit,
//       first_booking_only: firstBookingOnly,
//       starts_at: startsAt,
//       expires_at: expiresAt,
//       is_active: isActive,
//     },
//   };
// }

// export async function createDiscountCode(
//   _previousState: DiscountCodeActionState,
//   formData: FormData,
// ): Promise<DiscountCodeActionState> {
//   await requireRole(["admin", "super_admin"]);

//   const validation = validateDiscountCode(formData);

//   if ("error" in validation) {
//     return { error: validation.error };
//   }

//   const admin = createAdminClient() as any;

//   const { error } = await admin.from("discount_codes").insert(validation.data);

//   if (error) {
//     console.error("Create discount code failed:", error);

//     if (error.code === "23505") {
//       return { error: "A discount code with this code already exists." };
//     }

//     return { error: "Unable to create discount code. Please try again." };
//   }

//   revalidatePath("/dashboard/admin/discount-codes");
//   redirect("/dashboard/admin/discount-codes");
// }

// export async function updateDiscountCode(
//   id: string,
//   _previousState: DiscountCodeActionState,
//   formData: FormData,
// ): Promise<DiscountCodeActionState> {
//   await requireRole(["admin", "super_admin"]);

//   if (!id) {
//     return { error: "Invalid discount code." };
//   }

//   const validation = validateDiscountCode(formData);

//   if ("error" in validation) {
//     return { error: validation.error };
//   }

//   const admin = createAdminClient() as any;

//   const { data, error } = await admin
//     .from("discount_codes")
//     .update(validation.data)
//     .eq("id", id)
//     .select("id")
//     .maybeSingle();

//   if (error) {
//     console.error("Update discount code failed:", error);

//     if (error.code === "23505") {
//       return { error: "A discount code with this code already exists." };
//     }

//     return { error: "Unable to update discount code. Please try again." };
//   }

//   if (!data) {
//     return { error: "Discount code not found." };
//   }

//   revalidatePath("/dashboard/admin/discount-codes");
//   revalidatePath(`/dashboard/admin/discount-codes/${id}/edit`);

//   redirect("/dashboard/admin/discount-codes");
// }
