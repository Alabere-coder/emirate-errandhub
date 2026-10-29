"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must contain at least 2 characters.")
    .max(50, "First name is too long."),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must contain at least 2 characters.")
    .max(50, "Last name is too long."),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long.")
    .refine(
      (value) => value === "" || /^\+?[0-9\s()-]{7,20}$/.test(value),
      "Enter a valid phone number.",
    ),
});

export type AdminProfileState = {
  error?: string;
  success?: string;
};

export async function updateAdminProfile(
  _previousState: AdminProfileState,
  formData: FormData,
): Promise<AdminProfileState> {
  const { supabase, user } = await requireRole(["admin"]);

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid profile information.",
    };
  }

  const { firstName, lastName, phone } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Admin profile update error:", error);
    return {
      error: "Unable to update your profile. Please try again.",
    };
  }

  revalidatePath("/dashboard/admin/profile");

  return {
    success: "Your profile has been updated successfully.",
  };
}
