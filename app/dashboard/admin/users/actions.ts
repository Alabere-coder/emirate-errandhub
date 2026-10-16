"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserStatusActionResult = {
  success: boolean;
  message: string;
};

export async function setUserActive(
  userId: string,
  nextIsActive: boolean,
): Promise<UserStatusActionResult> {
  const { profile: adminProfile } = await requireRole(["admin"]);

  if (
    typeof userId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    ) ||
    typeof nextIsActive !== "boolean"
  ) {
    return {
      success: false,
      message: "Invalid account status request.",
    };
  }

  if (!nextIsActive && userId === adminProfile.id) {
    return {
      success: false,
      message: "You cannot deactivate your own administrator account.",
    };
  }

  const adminClient = createAdminClient();

  const { data: target, error: targetError } = await adminClient
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (targetError || !target) {
    return {
      success: false,
      message: "The requested user could not be found.",
    };
  }

  if (!nextIsActive && target.role === "admin" && target.is_active) {
    const { data: activeAdmins, error: adminsError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);

    if (adminsError) {
      console.error(
        "Failed to check active administrators:",
        adminsError.message,
      );

      return {
        success: false,
        message: "Unable to verify administrator safety rules.",
      };
    }

    if ((activeAdmins ?? []).length <= 1) {
      return {
        success: false,
        message: "The last active administrator cannot be deactivated.",
      };
    }
  }

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ is_active: nextIsActive })
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to update account status:", updateError.message);

    return {
      success: false,
      message: "Unable to update this account. Please try again.",
    };
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  revalidatePath("/dashboard/admin");

  return {
    success: true,
    message: nextIsActive
      ? "The account has been activated."
      : "The account has been deactivated.",
  };
}
