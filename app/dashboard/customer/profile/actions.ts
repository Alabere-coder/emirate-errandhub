"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

export type CustomerProfileState = {
  error?: string;
  success?: string;
};

export async function updateCustomerProfile(
  _previousState: CustomerProfileState,
  formData: FormData,
): Promise<CustomerProfileState> {
  const { user, supabase } = await requireRole(["customer"]);

  const firstName = formData.get("first_name");
  const lastName = formData.get("last_name");
  const phoneValue = formData.get("phone");

  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof phoneValue !== "string"
  ) {
    return { error: "Please complete all required fields." };
  }

  const first_name = firstName.trim();
  const last_name = lastName.trim();
  const phone = phoneValue.trim();

  if (!first_name || !last_name) {
    return { error: "First name and last name are required." };
  }

  if (first_name.length > 100 || last_name.length > 100) {
    return { error: "Names must not exceed 100 characters." };
  }

  if (phone.length > 30) {
    return { error: "Phone number must not exceed 30 characters." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name,
      last_name,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .eq("role", "customer");

  if (error) {
    console.error("Update customer profile error:", error);
    return { error: "Unable to update your profile. Please try again." };
  }

  revalidatePath("/dashboard/customer/profile");
  revalidatePath("/dashboard/customer");

  return { success: "Your profile has been updated successfully." };
}
