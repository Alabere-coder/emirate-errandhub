"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  deleteRequestMedia,
  uploadRequestMedia,
} from "@/lib/storage/request-media";

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
   * Get uploaded media files.
   */
  const mediaFiles = formData
    .getAll("media")
    .filter((value): value is File => value instanceof File && value.size > 0);

  /*
   * Basic validation.
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
   * Verify category.
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
   * Verify service if supplied.
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
   * Create the service request.
   */
  const { data: request, error: requestError } = await supabase
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

  if (requestError || !request) {
    console.error("Create service request error:", requestError);

    return {
      error: "Unable to create your service request. Please try again.",
    };
  }

  /*
   * Upload request media.
   */
  const uploadedPaths: string[] = [];

  for (const file of mediaFiles) {
    try {
      const { path } = await uploadRequestMedia({
        supabase,
        file,
        userId: user.id,
        requestId: request.id,
      });

      uploadedPaths.push(path);

      /*
       * Save the storage path in the database.
       */
      const { error: mediaError } = await supabase
        .from("service_request_media")
        .insert({
          request_id: request.id,
          file_url: path,
          file_type: file.type,
        });

      if (mediaError) {
        console.error("Request media database error:", mediaError);

        await deleteRequestMedia(supabase, uploadedPaths);

        await supabase
          .from("service_requests")
          .delete()
          .eq("id", request.id)
          .eq("customer_id", user.id);

        return {
          error: `Unable to save "${file.name}". Please try again.`,
        };
      }
    } catch (error) {
      console.error("Request media processing error:", error);

      await deleteRequestMedia(supabase, uploadedPaths);

      await supabase
        .from("service_requests")
        .delete()
        .eq("id", request.id)
        .eq("customer_id", user.id);

      return {
        error:
          error instanceof Error
            ? error.message
            : `Unable to upload "${file.name}". Please try again.`,
      };
    }
  }

  console.log("SERVICE REQUEST CREATED SUCCESSFULLY:", {
    requestId: request.id,
    customerId: user.id,
    mediaCount: mediaFiles.length,
  });

  /*
   * Everything succeeded.
   */
  revalidatePath("/dashboard/customer/requests");

  redirect(`/dashboard/customer/requests/${request.id}`);
}
