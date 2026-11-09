"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type PopupActionState = {
  error?: string;
  success?: string;
};

const POPUP_PATH = "/dashboard/admin/popups";
const ALLOWED_AUDIENCES = [
  "everyone",
  "visitors",
  "customers",
  "workers",
] as const;
const ALLOWED_FREQUENCIES = [
  "once_per_visitor",
  "once_per_session",
  "every_visit",
] as const;

type PopupAudience = (typeof ALLOWED_AUDIENCES)[number];
type PopupFrequency = (typeof ALLOWED_FREQUENCIES)[number];

function validateButtonUrl(value: string): string | null {
  if (!value) return null;

  if (value.startsWith("/") && !value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "The button link must use HTTP or HTTPS.";
    }

    return null;
  } catch {
    return "Please enter a valid button URL.";
  }
}

function validateImage(
  imageUrl: string,
  imagePath: string,
  userId: string,
): string | null {
  if (!imageUrl && !imagePath) return null;

  if (!imageUrl || !imagePath) {
    return "The popup image information is incomplete.";
  }

  // Images uploaded through this form use the uploader's user ID
  // as the first folder in the storage path.
  const validImagePath =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i;

  if (!validImagePath.test(imagePath)) {
    return "Invalid popup image path.";
  }

  if (
    imagePath.includes("..") ||
    imagePath.startsWith("/") ||
    imagePath.includes("\\")
  ) {
    return "Invalid popup image path.";
  }

  try {
    const image = new URL(imageUrl);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || image.origin !== new URL(supabaseUrl).origin) {
      return "Invalid popup image URL.";
    }

    const prefix = "/storage/v1/object/public/popup-media/";
    const decodedPath = decodeURIComponent(image.pathname);

    if (
      !decodedPath.startsWith(prefix) ||
      decodedPath.slice(prefix.length) !== imagePath
    ) {
      return "The popup image must come from the popup-media bucket.";
    }
  } catch {
    return "Invalid popup image URL.";
  }

  return null;
}

function parseDates(startsAt: string, endsAt: string) {
  const startDate = startsAt ? new Date(startsAt) : null;
  const endDate = endsAt ? new Date(endsAt) : null;

  if (
    (startDate && Number.isNaN(startDate.getTime())) ||
    (endDate && Number.isNaN(endDate.getTime()))
  ) {
    return { error: "Please provide valid popup dates." as const };
  }

  if (startDate && endDate && endDate <= startDate) {
    return {
      error: "The end date must be later than the start date." as const,
    };
  }

  return {
    startsAt: startDate?.toISOString() ?? null,
    endsAt: endDate?.toISOString() ?? null,
  };
}

function getPopupFormValues(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const buttonText = String(formData.get("button_text") ?? "").trim();
  const buttonUrl = String(formData.get("button_url") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const imagePath = String(formData.get("image_path") ?? "").trim();
  const audience = String(formData.get("audience") ?? "");
  const frequency = String(formData.get("frequency") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const priority = Number(formData.get("priority") ?? 0);
  const isActive = formData.get("is_active") === "true";

  return {
    title,
    description,
    buttonText,
    buttonUrl,
    imageUrl,
    imagePath,
    audience,
    frequency,
    startsAt,
    endsAt,
    priority,
    isActive,
  };
}

function validatePopupValues(
  values: ReturnType<typeof getPopupFormValues>,
  userId: string,
) {
  if (!values.title) {
    return "Popup title is required.";
  }

  if (values.title.length > 120 || values.description.length > 1000) {
    return "The title or description is too long.";
  }

  if (!ALLOWED_AUDIENCES.includes(values.audience as PopupAudience)) {
    return "Please select a valid audience.";
  }

  if (!ALLOWED_FREQUENCIES.includes(values.frequency as PopupFrequency)) {
    return "Please select a valid display frequency.";
  }

  if (!Number.isInteger(values.priority) || values.priority < 0) {
    return "Priority must be a non-negative whole number.";
  }

  const buttonError = validateButtonUrl(values.buttonUrl);
  if (buttonError) return buttonError;

  const imageError = validateImage(values.imageUrl, values.imagePath, userId);
  if (imageError) return imageError;

  const dates = parseDates(values.startsAt, values.endsAt);
  if ("error" in dates) return dates.error;

  return null;
}

async function getAdminUser() {
  await requireRole(["admin", "super_admin"]);

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  return { supabase, user };
}

export async function createPopupCampaign(
  formData: FormData,
): Promise<PopupActionState> {
  const auth = await getAdminUser();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const values = getPopupFormValues(formData);
  const validationError = validatePopupValues(values, auth.user.id);

  if (validationError) {
    return { error: validationError };
  }

  const dates = parseDates(values.startsAt, values.endsAt);

  if ("error" in dates) {
    return { error: dates.error };
  }

  const { error } = await auth.supabase.from("popup_campaigns").insert({
    title: values.title,
    description: values.description || null,
    image_url: values.imageUrl || null,
    image_path: values.imagePath || null,
    button_text: values.buttonText || null,
    button_url: values.buttonUrl || null,
    audience: values.audience,
    frequency: values.frequency,
    starts_at: dates.startsAt,
    ends_at: dates.endsAt,
    priority: values.priority,
    is_active: values.isActive,
    created_by: auth.user.id,
  });

  if (error) {
    console.error("Create popup campaign error:", error);
    return { error: "Could not create the popup. Please try again." };
  }

  revalidatePath(POPUP_PATH);

  return { success: "Popup campaign created successfully." };
}

export async function togglePopupCampaign(
  campaignId: string,
  isActive: boolean,
): Promise<PopupActionState> {
  const auth = await getAdminUser();

  if ("error" in auth) {
    return { error: auth.error };
  }

  if (!campaignId) {
    return { error: "Invalid popup campaign." };
  }

  const { error } = await auth.supabase
    .from("popup_campaigns")
    .update({ is_active: isActive })
    .eq("id", campaignId);

  if (error) {
    console.error("Toggle popup campaign error:", error);
    return { error: "Unable to update the popup status." };
  }

  revalidatePath(POPUP_PATH);

  return {
    success: isActive
      ? "Popup activated successfully."
      : "Popup deactivated successfully.",
  };
}

export async function deletePopupCampaign(
  campaignId: string,
): Promise<PopupActionState> {
  const auth = await getAdminUser();

  if ("error" in auth) {
    return { error: auth.error };
  }

  if (!campaignId) {
    return { error: "Invalid popup campaign." };
  }

  const { data: campaign, error: fetchError } = await auth.supabase
    .from("popup_campaigns")
    .select("id, image_path")
    .eq("id", campaignId)
    .single();

  if (fetchError || !campaign) {
    return { error: "Popup campaign not found." };
  }

  // Remove the image before deleting the database record.
  if (campaign.image_path) {
    const { error: storageError } = await auth.supabase.storage
      .from("popup-media")
      .remove([campaign.image_path]);

    if (storageError) {
      console.error("Popup image deletion error:", storageError);
      return {
        error:
          "Unable to remove the popup image. The campaign was not deleted.",
      };
    }
  }

  const { error: deleteError } = await auth.supabase
    .from("popup_campaigns")
    .delete()
    .eq("id", campaignId);

  if (deleteError) {
    console.error("Delete popup campaign error:", deleteError);
    return { error: "Unable to delete the popup campaign." };
  }

  revalidatePath(POPUP_PATH);

  return { success: "Popup campaign deleted successfully." };
}

export async function updatePopupCampaign(
  campaignId: string,
  formData: FormData,
): Promise<PopupActionState> {
  const auth = await getAdminUser();

  if ("error" in auth) {
    return { error: auth.error };
  }

  if (!campaignId) {
    return { error: "Invalid popup campaign." };
  }

  const values = getPopupFormValues(formData);
  const validationError = validatePopupValues(values, auth.user.id);

  if (validationError) {
    return { error: validationError };
  }

  const dates = parseDates(values.startsAt, values.endsAt);

  if ("error" in dates) {
    return { error: dates.error };
  }

  const { data: existing, error: fetchError } = await auth.supabase
    .from("popup_campaigns")
    .select("id, image_path")
    .eq("id", campaignId)
    .single();

  if (fetchError || !existing) {
    return { error: "Popup campaign not found." };
  }

  const { error: updateError } = await auth.supabase
    .from("popup_campaigns")
    .update({
      title: values.title,
      description: values.description || null,
      image_url: values.imageUrl || null,
      image_path: values.imagePath || null,
      button_text: values.buttonText || null,
      button_url: values.buttonUrl || null,
      audience: values.audience,
      frequency: values.frequency,
      starts_at: dates.startsAt,
      ends_at: dates.endsAt,
      priority: values.priority,
      is_active: values.isActive,
    })
    .eq("id", campaignId);

  if (updateError) {
    console.error("Update popup campaign error:", updateError);
    return { error: "Unable to update the popup campaign." };
  }

  // Remove the previous image if it was replaced or cleared.
  if (existing.image_path && existing.image_path !== values.imagePath) {
    const { error: storageError } = await auth.supabase.storage
      .from("popup-media")
      .remove([existing.image_path]);

    if (storageError) {
      console.error("Old popup image cleanup error:", storageError);
    }
  }

  revalidatePath(POPUP_PATH);
  revalidatePath(`${POPUP_PATH}/${campaignId}/edit`);

  return { success: "Popup campaign updated successfully." };
}
