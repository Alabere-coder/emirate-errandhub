"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

export type AvatarUploadState = {
  error?: string;
  success?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadCustomerAvatar(
  _previousState: AvatarUploadState,
  formData: FormData,
): Promise<AvatarUploadState> {
  const { user, supabase } = await requireRole(["customer"]);

  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select a photo to upload." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Choose a JPG, PNG, or WebP image." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "Your photo must be 5 MB or smaller." };
  }

  const extension = EXTENSION_BY_TYPE[file.type];
  const path = `${user.id}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("Customer avatar upload error:", uploadError);
    return {
      error:
        "Unable to upload your photo. Check the avatars bucket and its access policies.",
    };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .eq("role", "customer");

  if (updateError) {
    console.error("Customer avatar profile update error:", updateError);
    return {
      error: "Your photo uploaded, but the profile could not be updated.",
    };
  }

  revalidatePath("/dashboard/customer/profile");
  revalidatePath("/dashboard/customer");

  return { success: "Your profile photo has been updated." };
}
