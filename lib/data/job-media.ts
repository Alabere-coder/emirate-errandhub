import type { SupabaseClient } from "@supabase/supabase-js";

export type JobMedia = {
  id: string;
  file_url: string;
  file_type: string;
  media_type: "before" | "during" | "after" | "proof" | "other";
  created_at: string;
  signed_url: string;
};

export async function getJobMedia(
  supabase: SupabaseClient,
  jobId: string,
): Promise<JobMedia[]> {
  const { data, error } = await supabase
    .from("job_media")
    .select("id, file_url, file_type, media_type, created_at")
    .eq("job_id", jobId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error("Get job media error:", error);
    return [];
  }

  const media: JobMedia[] = [];

  for (const item of data ?? []) {
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("job-media")
        .createSignedUrl(item.file_url, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Create job media signed URL error:", {
        mediaId: item.id,
        path: item.file_url,
        error: signedUrlError,
      });

      continue;
    }

    media.push({
      ...item,
      media_type: item.media_type as JobMedia["media_type"],
      signed_url: signedUrlData.signedUrl,
    });
  }

  return media;
}
