"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type ReleaseEarningsState = {
  error?: string;
  success?: string;
};

function isValidJobId(value: FormDataEntryValue | null): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function approveAndReleaseEarnings(
  _previousState: ReleaseEarningsState,
  formData: FormData,
): Promise<ReleaseEarningsState> {
  try {
    await requireRole(["admin"]);

    const jobId = formData.get("job_id");

    if (!isValidJobId(jobId)) {
      return { error: "A valid job ID is required." };
    }

    const supabase = await createClient();

    const { error } = await supabase.rpc("approve_and_release_job_earnings", {
      p_job_id: jobId,
    });

    if (error) {
      console.error("Earnings release failed:", error);

      return {
        error:
          "Earnings could not be released. Please verify the job, customer confirmation, and payment details.",
      };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/requests-jobs");
    revalidatePath("/dashboard/worker");
    revalidatePath("/dashboard/worker/earnings");

    return {
      success:
        "Earnings released successfully. The platform commission has been applied.",
    };
  } catch (error) {
    console.error("Admin earnings action failed:", error);

    return {
      error: "Unable to process the earnings release. Please try again.",
    };
  }
}

// "use server";

// import { revalidatePath } from "next/cache";
// import { requireRole } from "@/lib/auth/require-role";
// import { createClient } from "@/lib/supabase/server";

// export type ReleaseEarningsState = {
//   error?: string;
//   success?: string;
// };

// export async function approveAndReleaseEarnings(
//   _previousState: ReleaseEarningsState,
//   formData: FormData,
// ): Promise<ReleaseEarningsState> {
//   await requireRole(["admin"]);

//   try {
//     const jobId = formData.get("job_id");

//     if (typeof jobId !== "string" || !jobId.trim()) {
//       return { error: "A valid job ID is required." };
//     }

//     const supabase = await createClient();

//     const { error } = await supabase.rpc("approve_and_release_job_earnings", {
//       p_job_id: jobId,
//     });

//     if (error) {
//       console.error("Earnings release failed:", error);

//       return {
//         error:
//           error.message ||
//           "Earnings could not be released. Please verify the job and payment details.",
//       };
//     }

//     revalidatePath("/dashboard/admin");
//     revalidatePath("/dashboard/admin/requests-jobs");
//     revalidatePath("/dashboard/worker");
//     revalidatePath("/dashboard/worker/earnings");

//     return {
//       success:
//         "Earnings released successfully. The platform commission has been applied.",
//     };
//   } catch (error) {
//     console.error("Admin earnings action failed:", error);

//     return {
//       error: "Unable to process the earnings release. Please try again.",
//     };
//   }
// }
