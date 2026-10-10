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

  /*
   * ---------------------------------------------------------
   * FORM VALUES
   * ---------------------------------------------------------
   */

  const categoryId = getString(formData, "category_id");

  const serviceId = getOptionalString(formData, "service_id");

  const workerId = getOptionalString(formData, "worker_id");

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

  const savedAddressId = getOptionalString(formData, "saved_address_id");

  if (savedAddressId) {
    const { data: savedAddress, error: addressError } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("id", savedAddressId)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (addressError) {
      console.error("Saved address lookup error:", addressError);

      return {
        error: "Unable to verify your saved address. Please try again.",
      };
    }

    if (!savedAddress) {
      return {
        error:
          "The selected address is invalid. Please choose another address.",
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * MEDIA
   * ---------------------------------------------------------
   */

  const mediaFiles = formData
    .getAll("media")
    .filter((value): value is File => value instanceof File && value.size > 0);

  /*
   * ---------------------------------------------------------
   * BASIC VALIDATION
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * VERIFY CATEGORY
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * VERIFY SERVICE
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * VERIFY SELECTED WORKER
   * ---------------------------------------------------------
   *
   * Never trust the hidden worker_id field.
   *
   * We verify that:
   *
   * 1. The worker exists.
   * 2. The worker is verified.
   * 3. The worker is currently available.
   *
   * We also verify that the worker handles the selected
   * service category.
   */

  if (workerId) {
    const { data: worker, error: workerError } = await supabase
      .from("worker_profiles")
      .select(
        `
        id,
        verification_status,
        is_available
      `,
      )
      .eq("id", workerId)
      .maybeSingle();

    if (workerError) {
      console.error("Worker lookup error:", workerError);

      return {
        error: "Unable to verify the selected worker.",
      };
    }

    if (!worker) {
      return {
        error: "The selected worker does not exist.",
      };
    }

    if (worker.verification_status !== "verified") {
      return {
        error: "The selected worker is not verified.",
      };
    }

    if (!worker.is_available) {
      return {
        error: "The selected worker is currently unavailable.",
      };
    }

    /*
     * Make sure the worker actually offers this category.
     */

    const { data: workerCategory, error: workerCategoryError } = await supabase
      .from("worker_categories")
      .select("worker_id")
      .eq("worker_id", workerId)
      .eq("category_id", categoryId)
      .maybeSingle();

    if (workerCategoryError) {
      console.error("Worker category lookup error:", workerCategoryError);

      return {
        error: "Unable to verify the worker's service category.",
      };
    }

    if (!workerCategory) {
      return {
        error: "This worker does not provide the selected service category.",
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * CREATE SERVICE REQUEST
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * ASSIGN SELECTED WORKER
   * ---------------------------------------------------------
   */

  if (workerId) {
    const { error: assignmentError } = await supabase
      .from("service_request_workers")
      .insert({
        request_id: request.id,
        worker_id: workerId,
        status: "assigned",
      });

    if (assignmentError) {
      console.error("Create worker assignment error:", assignmentError);

      /*
       * Remove the request if the worker assignment fails.
       * This prevents a request from being created while
       * appearing to have been sent to a worker.
       */

      await supabase
        .from("service_requests")
        .delete()
        .eq("id", request.id)
        .eq("customer_id", user.id);

      return {
        error:
          "Unable to assign the selected worker to your request. Please try again.",
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * UPLOAD REQUEST MEDIA
   * ---------------------------------------------------------
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
       * Save storage path in database.
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

  /*
   * ---------------------------------------------------------
   * SUCCESS
   * ---------------------------------------------------------
   */

  console.log("SERVICE REQUEST CREATED SUCCESSFULLY:", {
    requestId: request.id,
    customerId: user.id,
    workerId,
    mediaCount: mediaFiles.length,
  });

  revalidatePath("/dashboard/customer/requests");

  revalidatePath(`/dashboard/customer/requests/${request.id}`);

  revalidatePath("/dashboard/worker/requests");

  redirect(`/dashboard/customer/requests/${request.id}`);
}

export async function updateServiceRequest(
  requestId: string,
  _previousState: ServiceRequestActionState,
  formData: FormData,
): Promise<ServiceRequestActionState> {
  const { user } = await requireRole(["customer"]);
  const supabase = await createClient();

  // Validate the request ID.
  if (!requestId) {
    return { error: "Invalid service request." };
  }

  // Only the customer who owns a pending request may edit it.
  const { data: existingRequest, error: existingRequestError } = await supabase
    .from("service_requests")
    .select("id, status")
    .eq("id", requestId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (existingRequestError) {
    console.error("Load request for update error:", existingRequestError);
    return { error: "Unable to load your request. Please try again." };
  }

  if (!existingRequest) {
    return {
      error: "This request was not found or does not belong to you.",
    };
  }

  if (existingRequest.status !== "pending") {
    return {
      error: "Only pending requests can be edited.",
    };
  }

  // Read submitted fields.
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
  const savedAddressId = getOptionalString(formData, "saved_address_id");

  // Validate basic fields.
  if (!categoryId) {
    return { error: "Please select a service category." };
  }

  if (title.length < 3) {
    return {
      error: "The request title must be at least 3 characters.",
    };
  }

  if (description.length < 10) {
    return {
      error: "Please provide at least 10 characters describing the task.",
    };
  }

  if (budget !== null && budget < 0) {
    return { error: "Budget cannot be negative." };
  }

  if (!["NGN", "USD", "GBP", "EUR"].includes(currency)) {
    return { error: "Please select a supported currency." };
  }

  // Validate that a saved address belongs to this customer.
  // The address itself is optional; the customer may enter one manually.
  if (savedAddressId) {
    const { data: savedAddress, error: addressError } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("id", savedAddressId)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (addressError) {
      console.error("Saved address lookup error:", addressError);
      return {
        error: "Unable to verify your saved address. Please try again.",
      };
    }

    if (!savedAddress) {
      return {
        error:
          "The selected address is invalid. Please choose another address.",
      };
    }
  }

  // Validate the category.
  const { data: category, error: categoryError } = await supabase
    .from("service_categories")
    .select("id, is_active")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError || !category) {
    console.error("Category validation error:", categoryError);
    return { error: "Unable to verify the selected service category." };
  }

  if (!category.is_active) {
    return {
      error: "The selected service category is no longer available.",
    };
  }

  // Validate the optional service and its category.
  if (serviceId) {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, category_id, is_active")
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError || !service) {
      console.error("Service validation error:", serviceError);
      return { error: "Unable to verify the selected service." };
    }

    if (!service.is_active || service.category_id !== categoryId) {
      return {
        error: "Please choose an active service in the selected category.",
      };
    }
  }

  // Collect IDs of existing attachments the customer wants to remove.
  const mediaIdsToRemove = [
    ...new Set(
      formData
        .getAll("remove_media_ids")
        .filter((value): value is string => typeof value === "string")
        .filter((value) => value.length > 0),
    ),
  ];

  // Verify every selected attachment belongs to this request.
  let mediaToRemove: { id: string; file_url: string }[] = [];

  if (mediaIdsToRemove.length > 0) {
    const { data, error: removalLookupError } = await supabase
      .from("service_request_media")
      .select("id, file_url")
      .eq("request_id", requestId)
      .in("id", mediaIdsToRemove);

    if (removalLookupError) {
      console.error("Validate media removal error:", removalLookupError);
      return { error: "Unable to verify the selected attachments." };
    }

    if (!data || data.length !== mediaIdsToRemove.length) {
      return {
        error:
          "One or more selected attachments are invalid. Please refresh and try again.",
      };
    }

    mediaToRemove = data;
  }

  // Collect any newly added media.
  const mediaFiles = formData
    .getAll("media")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (mediaFiles.length > 10) {
    return { error: "You can upload a maximum of 10 files at a time." };
  }

  const invalidFile = mediaFiles.find(
    (file) =>
      (!file.type.startsWith("image/") && !file.type.startsWith("video/")) ||
      file.size > 50 * 1024 * 1024,
  );

  if (invalidFile) {
    return {
      error: `"${invalidFile.name}" is unsupported or exceeds the 50 MB file limit.`,
    };
  }

  // Upload new media first. Existing media is left untouched.
  const uploadedPaths: string[] = [];

  try {
    for (const file of mediaFiles) {
      const { path } = await uploadRequestMedia({
        supabase,
        file,
        userId: user.id,
        requestId,
      });

      uploadedPaths.push(path);
    }
  } catch (error) {
    console.error("Upload media for request update error:", error);
    await deleteRequestMedia(supabase, uploadedPaths);

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to upload your files. Please try again.",
    };
  }

  // Update the existing request. Do not insert a new row.
  const { data: updatedRequest, error: updateError } = await supabase
    .from("service_requests")
    .update({
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
    .eq("id", requestId)
    .eq("customer_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedRequest) {
    console.error("Update service request error:", updateError);
    await deleteRequestMedia(supabase, uploadedPaths);

    return {
      error: "Your request could not be updated. It may no longer be pending.",
    };
  }

  // Save the uploaded media paths in the database.
  if (mediaFiles.length > 0) {
    const mediaRows = mediaFiles.map((file, index) => ({
      request_id: requestId,
      file_url: uploadedPaths[index],
      file_type: file.type,
    }));

    const { error: mediaError } = await supabase
      .from("service_request_media")
      .insert(mediaRows);

    if (mediaError) {
      console.error("Save updated request media error:", mediaError);

      // Remove any newly uploaded files and their database records.
      await supabase
        .from("service_request_media")
        .delete()
        .eq("request_id", requestId)
        .in("file_url", uploadedPaths);

      await deleteRequestMedia(supabase, uploadedPaths);

      return {
        error:
          "Your request details were updated, but the new media could not be saved. Please try uploading the files again.",
      };
    }
  }

  // Remove existing attachments selected by the customer.
  if (mediaToRemove.length > 0) {
    const { error: deleteRowsError } = await supabase
      .from("service_request_media")
      .delete()
      .eq("request_id", requestId)
      .in(
        "id",
        mediaToRemove.map((media) => media.id),
      );

    if (deleteRowsError) {
      console.error("Delete request media records error:", deleteRowsError);

      return {
        error:
          "Your request was updated, but some attachments could not be removed. Please try again.",
      };
    }

    // Remove the corresponding files from the private Storage bucket.
    await deleteRequestMedia(
      supabase,
      mediaToRemove.map((media) => media.file_url),
    );
  }

  revalidatePath("/dashboard/customer/requests");
  revalidatePath(`/dashboard/customer/requests/${requestId}`);
  revalidatePath(`/dashboard/customer/requests/${requestId}/edit`);
  revalidatePath("/dashboard/worker/requests");

  redirect(`/dashboard/customer/requests/${requestId}`);
}
