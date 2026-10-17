"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAssignmentState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function assignProviderWithAdminQuote(
  _previousState: AdminAssignmentState,
  formData: FormData,
): Promise<AdminAssignmentState> {
  await requireRole(["admin"]);

  const requestId = getString(formData, "request_id");
  const workerProfileId = getString(formData, "worker_id");
  const amountValue = getString(formData, "amount");
  const currency = getString(formData, "currency") || "NGN";
  const message = getString(formData, "message");

  if (!requestId || !workerProfileId) {
    return { error: "Select a request and a provider." };
  }

  const amount = Number(amountValue);

  if (!amountValue || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid price greater than zero." };
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    return { error: "Enter a valid three-letter currency code." };
  }

  const supabase = createAdminClient();

  // Confirm the request exists and is still accepting quotations.
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id, customer_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    return { error: "Unable to find this service request." };
  }

  if (["completed", "cancelled", "rejected"].includes(request.status)) {
    return {
      error: "This request is no longer accepting assignments.",
    };
  }

  // The selected ID must be a worker_profiles.id.
  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id, user_id, verification_status, is_available")
    .eq("id", workerProfileId)
    .maybeSingle();

  if (workerError || !worker) {
    return { error: "Unable to find the selected provider." };
  }

  if (worker.verification_status !== "verified") {
    return {
      error: "This provider has not been verified and approved.",
    };
  }

  if (!worker.is_available) {
    return {
      error: "This provider is currently unavailable.",
    };
  }

  // Prevent duplicate jobs for the request.
  const { data: existingJob, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("request_id", requestId)
    .limit(1)
    .maybeSingle();

  if (jobError) {
    return { error: "Unable to check existing jobs. Please try again." };
  }

  if (existingJob) {
    return {
      error: "A job already exists for this request.",
    };
  }

  // Prevent a second active quote from the same provider.
  const { data: existingQuote, error: quoteCheckError } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("request_id", requestId)
    .eq("worker_id", workerProfileId)
    .in("status", ["pending", "accepted"])
    .limit(1)
    .maybeSingle();

  if (quoteCheckError) {
    return {
      error: "Unable to check existing quotations. Please try again.",
    };
  }

  if (existingQuote) {
    return {
      error: "This provider already has an active quotation for the request.",
    };
  }

  const adminMessage = [
    "[Created by administrator]",
    message || "Quotation prepared by an administrator for customer review.",
  ].join(" ");

  const { error: insertError } = await supabase.from("quotes").insert({
    request_id: requestId,
    worker_id: workerProfileId,
    amount,
    currency,
    message: adminMessage,
    status: "pending",
  });

  if (insertError) {
    console.error("Admin-created quotation error:", insertError);

    return {
      error: "Unable to create the quotation. Please try again.",
    };
  }

  // Reflect the quoted state without creating or accepting a job.
  if (request.status === "pending") {
    const { error: updateError } = await supabase
      .from("service_requests")
      .update({ status: "quoted" })
      .eq("id", requestId)
      .eq("status", "pending");

    if (updateError) {
      console.error("Request status update error:", updateError);
      // The quotation was created; don't report that creation failed.
    }
  }

  revalidatePath("/dashboard/admin/requests-jobs");
  revalidatePath("/dashboard/customer/requests");
  revalidatePath("/dashboard/worker/jobs");

  return {
    success:
      "Pending quotation created. The customer must approve it before a job is created.",
  };
}

export async function reassignServiceProvider(
  _previousState: { error?: string; success?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  await requireRole(["admin"]);

  const requestId = formData.get("requestId");
  const workerProfileId = formData.get("workerProfileId");

  if (
    typeof requestId !== "string" ||
    !requestId.trim() ||
    typeof workerProfileId !== "string" ||
    !workerProfileId.trim()
  ) {
    return { error: "Select a valid request and replacement provider." };
  }

  const supabase = createAdminClient();

  // Confirm that this request already has an accepted quotation.
  const { data: acceptedQuote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, request_id, worker_id, amount, currency, status")
    .eq("request_id", requestId)
    .eq("status", "accepted")
    .maybeSingle();

  if (quoteError) {
    console.error("Reassignment quote lookup failed:", quoteError.message);
    return { error: "Unable to verify the accepted quotation." };
  }

  if (!acceptedQuote) {
    return {
      error: "This request has no accepted quotation to reassign.",
    };
  }

  // Locate the existing job. Never create another job here.
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, request_id, worker_id, status")
    .eq("request_id", requestId)
    .maybeSingle();

  if (jobError) {
    console.error("Reassignment job lookup failed:", jobError.message);
    return { error: "Unable to load the existing job." };
  }

  if (!job) {
    return {
      error: "No existing job was found. Reassignment cannot proceed.",
    };
  }

  const currentStatus = (job.status ?? "").toLowerCase();

  if (["completed", "cancelled", "canceled"].includes(currentStatus)) {
    return {
      error: "Completed or cancelled jobs cannot be reassigned.",
    };
  }

  if (["in_progress", "started"].includes(currentStatus)) {
    return {
      error:
        "This job is already in progress. Resolve the current job before reassignment.",
    };
  }

  if (job.worker_id === workerProfileId) {
    return {
      error: "Choose a provider different from the current provider.",
    };
  }

  // Confirm that the replacement provider is approved and available.
  const { data: replacement, error: providerError } = await supabase
    .from("worker_profiles")
    .select("id, verification_status, is_available")
    .eq("id", workerProfileId)
    .maybeSingle();

  if (providerError) {
    console.error("Replacement provider lookup failed:", providerError.message);
    return { error: "Unable to verify the replacement provider." };
  }

  if (!replacement) {
    return { error: "The selected provider could not be found." };
  }

  if (replacement.verification_status !== "verified") {
    return {
      error: "The replacement provider has not been verified.",
    };
  }

  if (!replacement.is_available) {
    return {
      error: "The replacement provider is not currently available.",
    };
  }

  // Update the existing job only. Preserve its agreed price,
  // currency, schedule, status, and original accepted quotation.
  const { data: updatedJob, error: updateError } = await supabase
    .from("jobs")
    .update({
      worker_id: replacement.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("worker_id", job.worker_id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Provider reassignment failed:", updateError.message);
    return { error: "Unable to reassign the provider." };
  }

  if (!updatedJob) {
    return {
      error:
        "The job assignment changed while you were processing it. Refresh and try again.",
    };
  }

  revalidatePath("/dashboard/admin/requests-jobs");
  revalidatePath("/dashboard/admin/jobs");
  revalidatePath("/dashboard/customer/requests");
  revalidatePath("/dashboard/worker");

  return { success: "The service provider has been reassigned successfully." };
}
