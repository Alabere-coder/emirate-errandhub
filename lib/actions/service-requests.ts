"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type ServiceRequestActionState = {
  error?: string;
};

function getString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, name: string) {
  const value = getString(formData, name);

  return value || null;
}

function getOptionalNumber(formData: FormData, name: string) {
  const value = getString(formData, name);

  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function createServiceRequest(
  _previousState: ServiceRequestActionState,
  formData: FormData,
): Promise<ServiceRequestActionState> {
  const { user } = await requireRole(["customer"]);

  const supabase = await createClient();

  const categoryId = getString(formData, "category_id");
  const serviceId = getOptionalString(formData, "service_id");
  const title = getString(formData, "title");
  const description = getString(formData, "description");

  const budget = getOptionalNumber(formData, "budget");
  const currency = getString(formData, "currency") || "NGN";

  const preferredDate = getOptionalString(formData, "preferred_date");
  const preferredTime = getOptionalString(formData, "preferred_time");

  const isUrgent = getBoolean(formData, "is_urgent");

  const address = getOptionalString(formData, "address");
  const city = getOptionalString(formData, "city");
  const state = getOptionalString(formData, "state");

  const latitude = getOptionalNumber(formData, "latitude");
  const longitude = getOptionalNumber(formData, "longitude");

  /*
   * Basic validation
   */

  if (!categoryId) {
    return {
      error: "Please select a service category.",
    };
  }

  if (!title) {
    return {
      error: "Please enter a title for your request.",
    };
  }

  if (title.length < 3) {
    return {
      error: "The request title must be at least 3 characters.",
    };
  }

  if (!description) {
    return {
      error: "Please describe what you need help with.",
    };
  }

  if (description.length < 10) {
    return {
      error: "Please provide a little more detail about the task.",
    };
  }

  if (budget !== null && budget < 0) {
    return {
      error: "Budget cannot be negative.",
    };
  }

  /*
   * Verify that the selected category exists and is active.
   */

  const { data: category, error: categoryError } = await supabase
    .from("service_categories")
    .select("id, is_active")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError) {
    console.error("Category lookup error:", categoryError);

    return {
      error: "Unable to verify the selected service category.",
    };
  }

  if (!category) {
    return {
      error: "The selected service category does not exist.",
    };
  }

  if (!category.is_active) {
    return {
      error: "The selected service category is no longer available.",
    };
  }

  /*
   * If a specific service was selected, verify that it:
   * 1. exists
   * 2. is active
   * 3. belongs to the selected category
   */

  if (serviceId) {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, category_id, is_active")
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError) {
      console.error("Service lookup error:", serviceError);

      return {
        error: "Unable to verify the selected service.",
      };
    }

    if (!service) {
      return {
        error: "The selected service does not exist.",
      };
    }

    if (!service.is_active) {
      return {
        error: "The selected service is no longer available.",
      };
    }

    if (service.category_id !== categoryId) {
      return {
        error: "The selected service does not belong to the selected category.",
      };
    }
  }

  /*
   * Create the request.
   *
   * customer_id comes from the authenticated user.
   * It is never trusted from FormData.
   */

  const { data: request, error } = await supabase
    .from("service_requests")
    .insert({
      customer_id: user.id,
      category_id: categoryId,
      service_id: serviceId,
      title,
      description,
      budget,
      currency,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      is_urgent: isUrgent,
      address,
      city,
      state,
      latitude,
      longitude,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Create service request error:", error);

    return {
      error: "Unable to create your service request. Please try again.",
    };
  }

  revalidatePath("/dashboard/customer/requests");

  redirect(`/dashboard/customer/requests/${request.id}`);
}
