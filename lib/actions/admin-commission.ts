"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type CommissionSettingsState = {
  error?: string;
  success?: string;
};

export async function updatePlatformCommission(
  _previousState: CommissionSettingsState,
  formData: FormData,
): Promise<CommissionSettingsState> {
  try {
    await requireRole(["admin"]);

    const commissionType = formData.get("commission_type");
    const rawValue = formData.get("commission_value");

    if (commissionType !== "percentage" && commissionType !== "fixed") {
      return { error: "Choose a valid commission type." };
    }

    if (typeof rawValue !== "string" || rawValue.trim() === "") {
      return { error: "Enter a commission value." };
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value) || value < 0) {
      return {
        error: "Enter a valid non-negative commission value.",
      };
    }

    if (commissionType === "percentage" && value > 100) {
      return {
        error: "Percentage commission cannot exceed 100%.",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.rpc("update_platform_commission", {
      p_commission_type: commissionType,
      p_commission_value: value,
    });

    if (error) {
      console.error("Commission update failed:", error);
      return {
        error: "Unable to update the commission setting. Please try again.",
      };
    }

    revalidatePath("/dashboard/admin/settings");
    revalidatePath("/dashboard/admin/settings/commission");

    return {
      success: "Platform commission updated successfully.",
    };
  } catch (error) {
    console.error("Commission settings action failed:", error);

    return {
      error: "Unable to update commission settings. Please try again.",
    };
  }
}
