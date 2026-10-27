"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateAdminState = {
  error?: string;
  success?: string;
  temporaryPassword?: string;
  email?: string;
};

export async function createAdministrator(
  _prevState: CreateAdminState,
  formData: FormData,
): Promise<CreateAdminState> {
  // Enforce authorization on the server.
  await requireRole(["super_admin"]);

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!firstName || !lastName || !email) {
    return { error: "First name, last name, and email are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const temporaryPassword = randomBytes(18).toString("base64url");
  const supabaseAdmin = createAdminClient();

  const { data, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
    });

  if (createError || !data.user) {
    return {
      error:
        createError?.message ?? "Could not create the administrator account.",
    };
  }

  // The auth trigger initially creates a customer profile.
  // Assign the admin role here using the server-only service-role client.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      role: "admin",
      must_change_password: true,
    })
    .eq("id", data.user.id);

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);

    return {
      error:
        "The account could not be configured as an administrator. The incomplete account was removed. Please try again.",
    };
  }

  revalidatePath("/dashboard/admin/management");

  return {
    success: "Administrator account created successfully.",
    email,
    temporaryPassword,
  };
}
