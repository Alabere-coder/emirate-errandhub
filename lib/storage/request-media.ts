import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "request-media";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

type UploadRequestMediaOptions = {
  supabase: SupabaseClient;
  file: File;
  userId: string;
  requestId: string;
};

export async function uploadRequestMedia({
  supabase,
  file,
  userId,
  requestId,
}: UploadRequestMediaOptions): Promise<{
  path: string;
}> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No media file was selected.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`"${file.name}" is not a supported image or video.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is too large. Maximum size is 50MB.`);
  }

  const extension = getExtension(file.type);

  const path = `${userId}/${requestId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Request media upload error:", {
      error,
      fileName: file.name,
      path,
    });

    throw new Error(`Unable to upload "${file.name}".`);
  }

  return {
    path,
  };
}

export async function deleteRequestMedia(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    console.error("Delete request media error:", error);
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

    case "video/mp4":
      return "mp4";

    case "video/webm":
      return "webm";

    case "video/quicktime":
      return "mov";

    default:
      return "bin";
  }
}
