import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "service-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type UploadServiceImageOptions = {
  supabase: SupabaseClient;
  file: File;
  folder: "categories" | "subcategories" | "services";
  slug: string;
};

export async function uploadServiceImage({
  supabase,
  file,
  folder,
  slug,
}: UploadServiceImageOptions): Promise<{
  url: string;
  path: string;
}> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No image was selected.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      "Invalid image type. Please upload a JPG, PNG, WebP, or GIF image.",
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const extension = getExtension(file.type);

  const safeSlug =
    slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image";

  const path = `${folder}/${safeSlug}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Service image upload error:", uploadError);
    throw new Error("Unable to upload the image.");
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  if (!data.publicUrl) {
    throw new Error("Unable to generate the image URL.");
  }

  return {
    url: data.publicUrl,
    path,
  };
}

export async function deleteServiceImage(
  supabase: SupabaseClient,
  imageUrl: string | null | undefined,
): Promise<void> {
  if (!imageUrl) {
    return;
  }

  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;

  const markerIndex = imageUrl.indexOf(marker);

  if (markerIndex === -1) {
    return;
  }

  const path = imageUrl.slice(markerIndex + marker.length);

  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    console.error("Delete service image error:", error);
  }
}

function getExtension(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/gif":
      return "gif";

    default:
      return "jpg";
  }
}
