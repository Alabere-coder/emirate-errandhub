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

// "use server";

// import { revalidatePath } from "next/cache";

// import { requireRole } from "@/lib/auth/require-role";
// import { createClient } from "@/lib/supabase/server";

// import {
//   deleteJobMedia,
//   uploadJobMedia,
// } from "@/lib/storage/job-media";

// export type JobMediaActionState = {
//   error?: string;
//   success?: string;
// };

// const MAX_MEDIA_FILES = 10;

// const ALLOWED_UPLOAD_STATUSES = new Set([
//   "assigned",
//   "in_progress",
// ]);

// export async function uploadJobMediaAction(
//   _previousState: JobMediaActionState,
//   formData: FormData,
// ): Promise<JobMediaActionState> {
//   const { user } = await requireRole(["worker"]);

//   const supabase = await createClient();

//   const jobIdValue = formData.get("job_id");

//   if (typeof jobIdValue !== "string" || !jobIdValue) {
//     return {
//       error: "Invalid job.",
//     };
//   }

//   const jobId = jobIdValue;

//   const mediaFiles = formData
//     .getAll("media")
//     .filter(
//       (value): value is File =>
//         value instanceof File && value.size > 0,
//     );

//   if (mediaFiles.length === 0) {
//     return {
//       error: "Please select at least one photo or video.",
//     };
//   }

//   if (mediaFiles.length > MAX_MEDIA_FILES) {
//     return {
//       error: `You can upload a maximum of ${MAX_MEDIA_FILES} files at a time.`,
//     };
//   }

//   /*
//    * Verify that the job exists and belongs to
//    * the currently authenticated worker.
//    */
//   const { data: workerProfile, error: workerProfileError } =
//     await supabase
//       .from("worker_profiles")
//       .select("id")
//       .eq("user_id", user.id)
//       .maybeSingle();

//   if (workerProfileError) {
//     console.error(
//       "Load worker profile for media upload error:",
//       workerProfileError,
//     );

//     return {
//       error: "Unable to verify your worker account.",
//     };
//   }

//   if (!workerProfile) {
//     return {
//       error: "Worker profile not found.",
//     };
//   }

//   const { data: job, error: jobError } = await supabase
//     .from("jobs")
//     .select(`
//       id,
//       request_id,
//       worker_id,
//       status
//     `)
//     .eq("id", jobId)
//     .eq("worker_id", workerProfile.id)
//     .maybeSingle();

//   if (jobError) {
//     console.error(
//       "Load job for media upload error:",
//       jobError,
//     );

//     return {
//       error: "Unable to verify the job.",
//     };
//   }

//   if (!job) {
//     return {
//       error: "Job not found or you are not assigned to this job.",
//     };
//   }

//   /*
//    * Job media is intended for active work.
//    *
//    * Workers can upload while the job is:
//    * - assigned
//    * - in_progress
//    */
//   if (!ALLOWED_UPLOAD_STATUSES.has(job.status)) {
//     return {
//       error:
//         "Media can only be uploaded while the job is assigned or in progress.",
//     };
//   }

//   /*
//    * Upload each file and create its database record.
//    *
//    * If any database insert fails, remove all files
//    * uploaded during this request.
//    */
//   const uploadedPaths: string[] = [];

//   for (const file of mediaFiles) {
//     try {
//       const { path } = await uploadJobMedia({
//         supabase,
//         file,
//         jobId,
//         userId: user.id,
//       });

//       uploadedPaths.push(path);

//       const mediaType = file.type.startsWith("video/")
//         ? "video"
//         : "image";

//       const { error: mediaError } = await supabase
//         .from("job_media")
//         .insert({
//           job_id: jobId,
//           uploaded_by: user.id,
//           file_url: path,
//           file_type: file.type,
//           media_type: mediaType,
//         });

//       if (mediaError) {
//         console.error("Job media database error:", mediaError);

//         await deleteJobMedia(supabase, uploadedPaths);

//         return {
//           error: `Unable to save "${file.name}". Please try again.`,
//         };
//       }
//     } catch (error) {
//       console.error("Job media processing error:", error);

//       await deleteJobMedia(supabase, uploadedPaths);

//       return {
//         error:
//           error instanceof Error
//             ? error.message
//             : `Unable to upload "${file.name}". Please try again.`,
//       };
//     }
//   }

//   /*
//    * The customer sees this media on:
//    * /dashboard/customer/requests/[requestId]
//    */
//   revalidatePath(
//     `/dashboard/customer/requests/${job.request_id}`,
//   );

//   /*
//    * The worker sees this media on:
//    * /dashboard/worker/jobs/my/[jobId]
//    */
//   revalidatePath(
//     `/dashboard/worker/jobs/my/${jobId}`,
//   );

//   return {
//     success:
//       mediaFiles.length === 1
//         ? "Media uploaded successfully."
//         : `${mediaFiles.length} media files uploaded successfully.`,
//   };
// }
