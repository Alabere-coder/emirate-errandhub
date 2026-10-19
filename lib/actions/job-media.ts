"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import {
  deleteJobMedia,
  JOB_MEDIA_TYPES,
  uploadJobMedia,
  type JobMediaType,
} from "@/lib/storage/job-media";

export type JobMediaActionState = {
  error?: string;
  success?: string;
};

export async function uploadJobMediaAction(
  _previousState: JobMediaActionState,
  formData: FormData,
): Promise<JobMediaActionState> {
  const { user, supabase } = await requireRole(["worker"]);

  const jobId = formData.get("jobId");
  const mediaType = formData.get("mediaType");
  const files = formData.getAll("files");

  /* =========================================================
     VALIDATE INPUT
  ========================================================= */

  if (typeof jobId !== "string" || !jobId) {
    return {
      error: "Invalid job.",
    };
  }

  if (
    typeof mediaType !== "string" ||
    !JOB_MEDIA_TYPES.includes(mediaType as JobMediaType)
  ) {
    return {
      error: "Invalid media type.",
    };
  }

  const mediaFiles = files.filter(
    (file): file is File => file instanceof File && file.size > 0,
  );

  if (mediaFiles.length === 0) {
    return {
      error: "Please select at least one image or video.",
    };
  }

  /* =========================================================
     VERIFY WORKER OWNS THE JOB
  ========================================================= */

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      `
    id,
    worker_id,
    request_id,
    worker_profiles!inner (
      user_id
    )
  `,
    )
    .eq("id", jobId)
    .eq("worker_profiles.user_id", user.id)
    .maybeSingle();

  if (jobError) {
    console.error("Job lookup error:", jobError);

    return {
      error: "Unable to verify this job.",
    };
  }

  if (!job) {
    return {
      error: "You are not assigned to this job.",
    };
  }

  /* =========================================================
     UPLOAD FILES
  ========================================================= */

  const uploadedPaths: string[] = [];
  const insertedMediaIds: string[] = [];

  try {
    for (const file of mediaFiles) {
      const { path } = await uploadJobMedia({
        supabase,
        file,
        jobId: job.id,
        userId: user.id,
      });

      uploadedPaths.push(path);

      /* =====================================================
         INSERT DATABASE RECORD
      ===================================================== */

      const { data: mediaRecord, error: insertError } = await supabase
        .from("job_media")
        .insert({
          job_id: job.id,
          uploaded_by: user.id,
          file_url: path,
          file_type: file.type,
          media_type: mediaType,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Job media database error:", {
          error: insertError,
          jobId: job.id,
          path,
          mediaType,
          fileType: file.type,
        });

        throw new Error(`Unable to save "${file.name}" to the job.`);
      }

      insertedMediaIds.push(mediaRecord.id);
    }

    /* =======================================================
       REVALIDATE
    ======================================================= */

    revalidatePath(`/dashboard/worker/jobs/${job.id}`);

    revalidatePath(`/dashboard/customer/requests/${job.request_id}`);

    return {
      success: `${mediaFiles.length} media file${
        mediaFiles.length === 1 ? "" : "s"
      } uploaded successfully.`,
    };
  } catch (error) {
    console.error("Upload job media failed:", error);

    /* =======================================================
       CLEAN UP DATABASE RECORDS
    ======================================================= */

    if (insertedMediaIds.length > 0) {
      const { error: deleteDbError } = await supabase
        .from("job_media")
        .delete()
        .in("id", insertedMediaIds);

      if (deleteDbError) {
        console.error("Job media database cleanup error:", deleteDbError);
      }
    }

    /* =======================================================
       CLEAN UP STORAGE FILES
    ======================================================= */

    await deleteJobMedia(supabase, uploadedPaths);

    return {
      error:
        error instanceof Error ? error.message : "Unable to upload job media.",
    };
  }
}
