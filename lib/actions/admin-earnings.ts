"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/create-notification";

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

    const { data: earningId, error } = await supabase.rpc(
      "approve_and_release_job_earnings",
      {
        p_job_id: jobId,
      },
    );

    if (error || !earningId) {
      console.error("Earnings release failed:", error);

      return {
        error:
          "Earnings could not be released. Please verify the job, customer confirmation, and payment details.",
      };
    }

    // Retrieve the exact earnings record created by the database function.
    const { data: earning, error: earningError } = await supabase
      .from("worker_earnings")
      .select(
        "id, worker_id, job_id, gross_amount, commission_amount, net_amount, currency",
      )
      .eq("id", earningId)
      .single();

    if (earningError || !earning) {
      console.error("Released earnings lookup failed:", earningError);
    } else {
      // worker_id references worker_profiles.id, not profiles.id.
      const { data: worker, error: workerError } = await supabase
        .from("worker_profiles")
        .select("user_id")
        .eq("id", earning.worker_id)
        .single();

      if (workerError || !worker?.user_id) {
        console.error("Worker lookup failed:", workerError);
      } else {
        await createNotification({
          userId: worker.user_id,
          type: "earnings_released",
          title: "Your earnings have been released",
          message: `Your earnings of ${earning.currency} ${Number(earning.net_amount).toFixed(2)} are now available. The platform commission was ${earning.currency} ${Number(earning.commission_amount).toFixed(2)}.`,
          link: "/dashboard/worker/earnings",
          preference: "payment_notifications",
        });
      }
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

// function isValidJobId(value: FormDataEntryValue | null): value is string {
//   return (
//     typeof value === "string" &&
//     /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
//       value,
//     )
//   );
// }

// export async function approveAndReleaseEarnings(
//   _previousState: ReleaseEarningsState,
//   formData: FormData,
// ): Promise<ReleaseEarningsState> {
//   try {
//     await requireRole(["admin"]);

//     const jobId = formData.get("job_id");

//     if (!isValidJobId(jobId)) {
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
//           "Earnings could not be released. Please verify the job, customer confirmation, and payment details.",
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
