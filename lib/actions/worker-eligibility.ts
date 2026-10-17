import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type EligibilityResult = {
  allowed: boolean;
  error?: string;
};

export async function checkWorkerEligibility(
  supabase: SupabaseClient,
  workerId: string,
  categoryId: string,
): Promise<EligibilityResult> {
  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id, verification_status, is_available")
    .eq("id", workerId)
    .maybeSingle();

  if (workerError || !worker) {
    return {
      allowed: false,
      error: "Unable to verify the service provider.",
    };
  }

  if (worker.verification_status !== "verified") {
    return {
      allowed: false,
      error:
        "This service provider must complete identity verification before proceeding.",
    };
  }

  if (!worker.is_available) {
    return {
      allowed: false,
      error: "This service provider is currently unavailable.",
    };
  }

  const { data: category, error: categoryError } = await supabase
    .from("service_categories")
    .select("id, requires_certificate")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError || !category) {
    return {
      allowed: false,
      error: "Unable to verify the service category.",
    };
  }

  if (category.requires_certificate) {
    const { data: certificate, error: certificateError } = await supabase
      .from("worker_documents")
      .select("id")
      .eq("worker_id", workerId)
      .eq("document_type", "certificate")
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (certificateError) {
      return {
        allowed: false,
        error: "Unable to verify the required certificate.",
      };
    }

    if (!certificate) {
      return {
        allowed: false,
        error:
          "This service requires an approved certificate from the service provider.",
      };
    }
  }

  return { allowed: true };
}
