"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type ServiceQuotationActionState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalNumber(formData: FormData, name: string) {
  const value = getString(formData, name);

  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export async function createServiceQuotation(
  _previousState: ServiceQuotationActionState,
  formData: FormData,
): Promise<ServiceQuotationActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const serviceRequestId = getString(formData, "service_request_id");
  const amount = getOptionalNumber(formData, "amount");
  const currency = getString(formData, "currency") || "NGN";
  const message = getString(formData, "message") || null;
  const estimatedDuration = getOptionalNumber(formData, "estimated_duration");

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile lookup error:", workerProfileError);
    return { error: "Unable to load your worker profile." };
  }

  if (!workerProfile) {
    return {
      error: "Your worker profile has not been created yet.",
    };
  }

  if (!serviceRequestId) {
    return { error: "Service request is required." };
  }

  if (amount === null || amount <= 0) {
    return { error: "Please enter a valid quotation amount." };
  }

  if (estimatedDuration !== null && estimatedDuration <= 0) {
    return {
      error: "Estimated duration must be greater than zero.",
    };
  }

  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id, status")
    .eq("id", serviceRequestId)
    .maybeSingle();

  if (requestError) {
    console.error("Service request lookup error:", requestError);

    return {
      error: "Unable to verify the service request.",
    };
  }

  if (!request) {
    return {
      error: "This service request no longer exists.",
    };
  }

  if (request.status === "completed" || request.status === "cancelled") {
    return {
      error: "This service request is no longer accepting quotations.",
    };
  }

  const { data: existingQuote, error: existingError } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("request_id", serviceRequestId)
    .eq("worker_id", workerProfile.id)
    .maybeSingle();

  if (existingError) {
    console.error("Existing quote lookup error:", existingError);

    return {
      error: "Unable to check your existing quotation.",
    };
  }

  if (existingQuote) {
    return {
      error: "You have already submitted a quotation for this request.",
    };
  }

  const estimatedDurationMinutes =
    estimatedDuration !== null ? Math.round(estimatedDuration * 60) : null;

  const { error: insertError } = await supabase.from("quotes").insert({
    request_id: serviceRequestId,
    worker_id: workerProfile.id,
    amount,
    currency,
    message,
    estimated_duration_minutes: estimatedDurationMinutes,
    status: "pending",
  });

  if (insertError) {
    console.error("Create quote error:", insertError);

    return {
      error: "Unable to submit your quotation. Please try again.",
    };
  }

  revalidatePath(`/dashboard/worker/jobs/${serviceRequestId}`);

  return {
    success: "Your quotation has been submitted successfully.",
  };
}
