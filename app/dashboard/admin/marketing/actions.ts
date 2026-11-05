"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type CampaignActionState = {
  error?: string;
  success?: string;
};

export async function createMarketingCampaign(
  formData: FormData,
): Promise<CampaignActionState> {
  await requireRole(["admin", "super_admin"]);

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const buttonText = String(formData.get("button_text") ?? "").trim();
  const buttonUrl = String(formData.get("button_url") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const placement = String(formData.get("placement") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") === "true";

  if (!title) {
    return { error: "Campaign title is required." };
  }

  if (title.length > 120 || subtitle.length > 250) {
    return { error: "The title or subtitle is too long." };
  }

  const allowedPlacements = [
    "homepage",
    "customer_dashboard",
    "worker_dashboard",
  ];

  if (!allowedPlacements.includes(placement)) {
    return { error: "Invalid campaign placement." };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return { error: "Display order must be a non-negative integer." };
  }

  const startDate = startsAt ? new Date(startsAt) : null;
  const endDate = endsAt ? new Date(endsAt) : null;

  if (
    (startDate && Number.isNaN(startDate.getTime())) ||
    (endDate && Number.isNaN(endDate.getTime()))
  ) {
    return { error: "Please provide valid campaign dates." };
  }

  if (startDate && endDate && endDate <= startDate) {
    return { error: "The end date must be later than the start date." };
  }

  if (buttonUrl) {
    try {
      const parsedUrl = new URL(buttonUrl, "https://example.com");

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return { error: "The button link must be a valid HTTP or HTTPS URL." };
      }
    } catch {
      return { error: "Please enter a valid button URL." };
    }
  }

  if (imageUrl) {
    try {
      const image = new URL(imageUrl);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (
        !supabaseUrl ||
        image.origin !== new URL(supabaseUrl).origin ||
        !image.pathname.includes("/storage/v1/object/public/marketing-banners/")
      ) {
        return { error: "Invalid marketing banner image URL." };
      }
    } catch {
      return { error: "Invalid marketing banner image URL." };
    }
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const { error } = await supabase.from("marketing_campaigns").insert({
    title,
    subtitle: subtitle || null,
    button_text: buttonText || null,
    button_url: buttonUrl || null,
    image_url: imageUrl || null,
    placement,
    is_active: isActive,
    starts_at: startDate?.toISOString() ?? null,
    ends_at: endDate?.toISOString() ?? null,
    sort_order: sortOrder,
    created_by: user.id,
  });

  if (error) {
    console.error("Create marketing campaign error:", error);
    return { error: "Could not create the campaign. Please try again." };
  }

  revalidatePath("/dashboard/admin/marketing");

  return { success: "Marketing campaign created successfully." };
}

export async function toggleMarketingCampaign(
  campaignId: string,
  isActive: boolean,
): Promise<CampaignActionState> {
  await requireRole(["admin", "super_admin"]);

  if (!campaignId) {
    return { error: "Invalid campaign." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("marketing_campaigns")
    .update({ is_active: isActive })
    .eq("id", campaignId);

  if (error) {
    console.error("Toggle campaign error:", error);
    return { error: "Unable to update campaign status." };
  }

  revalidatePath("/dashboard/admin/marketing");

  return {
    success: isActive
      ? "Campaign activated successfully."
      : "Campaign deactivated successfully.",
  };
}

export async function deleteMarketingCampaign(
  campaignId: string,
): Promise<CampaignActionState> {
  await requireRole(["admin", "super_admin"]);

  if (!campaignId) {
    return { error: "Invalid campaign." };
  }

  const supabase = await createClient();

  const { data: campaign, error: fetchError } = await supabase
    .from("marketing_campaigns")
    .select("id, image_url")
    .eq("id", campaignId)
    .single();

  if (fetchError || !campaign) {
    return { error: "Campaign not found." };
  }

  // Remove the associated banner image, if one exists.
  if (campaign.image_url) {
    try {
      const imageUrl = new URL(campaign.image_url);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl || imageUrl.origin !== new URL(supabaseUrl).origin) {
        return { error: "The campaign image URL is invalid." };
      }

      const prefix = "/storage/v1/object/public/marketing-banners/";

      if (imageUrl.pathname.startsWith(prefix)) {
        const imagePath = decodeURIComponent(
          imageUrl.pathname.slice(prefix.length),
        );

        if (imagePath) {
          const { error: storageError } = await supabase.storage
            .from("marketing-banners")
            .remove([imagePath]);

          if (storageError) {
            console.error("Banner deletion error:", storageError);
            return {
              error:
                "Unable to remove the campaign image. Campaign was not deleted.",
            };
          }
        }
      }
    } catch {
      return { error: "Unable to process the campaign image URL." };
    }
  }

  const { error: deleteError } = await supabase
    .from("marketing_campaigns")
    .delete()
    .eq("id", campaignId);

  if (deleteError) {
    console.error("Campaign deletion error:", deleteError);
    return { error: "Unable to delete the campaign." };
  }

  revalidatePath("/dashboard/admin/marketing");

  return { success: "Campaign deleted successfully." };
}

export async function updateMarketingCampaign(
  campaignId: string,
  formData: FormData,
): Promise<CampaignActionState> {
  await requireRole(["admin", "super_admin"]);

  if (!campaignId) {
    return { error: "Invalid campaign." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const buttonText = String(formData.get("button_text") ?? "").trim();
  const buttonUrl = String(formData.get("button_url") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const placement = String(formData.get("placement") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const isActive = formData.get("is_active") === "true";

  if (!title) {
    return { error: "Campaign title is required." };
  }

  if (title.length > 120 || subtitle.length > 250) {
    return { error: "The title or subtitle is too long." };
  }

  if (
    !["homepage", "customer_dashboard", "worker_dashboard"].includes(placement)
  ) {
    return { error: "Invalid campaign placement." };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return { error: "Display order must be a non-negative integer." };
  }

  const startDate = startsAt ? new Date(startsAt) : null;
  const endDate = endsAt ? new Date(endsAt) : null;

  if (
    (startDate && Number.isNaN(startDate.getTime())) ||
    (endDate && Number.isNaN(endDate.getTime()))
  ) {
    return { error: "Please provide valid campaign dates." };
  }

  if (startDate && endDate && endDate <= startDate) {
    return { error: "The end date must be later than the start date." };
  }

  if (buttonUrl) {
    try {
      const parsedUrl = new URL(buttonUrl, "https://example.com");

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return { error: "Invalid button URL." };
      }
    } catch {
      return { error: "Please enter a valid button URL." };
    }
  }

  if (imageUrl) {
    try {
      const image = new URL(imageUrl);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (
        !supabaseUrl ||
        image.origin !== new URL(supabaseUrl).origin ||
        !image.pathname.includes("/storage/v1/object/public/marketing-banners/")
      ) {
        return { error: "Invalid marketing banner image URL." };
      }
    } catch {
      return { error: "Invalid marketing banner image URL." };
    }
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("marketing_campaigns")
    .update({
      title,
      subtitle: subtitle || null,
      button_text: buttonText || null,
      button_url: buttonUrl || null,
      image_url: imageUrl || null,
      placement,
      is_active: isActive,
      starts_at: startDate?.toISOString() ?? null,
      ends_at: endDate?.toISOString() ?? null,
      sort_order: sortOrder,
    })
    .eq("id", campaignId);

  if (error) {
    console.error("Update campaign error:", error);
    return { error: "Unable to update campaign." };
  }

  revalidatePath("/dashboard/admin/marketing");
  revalidatePath(`/dashboard/admin/marketing/${campaignId}/edit`);

  return { success: "Campaign updated successfully." };
}
