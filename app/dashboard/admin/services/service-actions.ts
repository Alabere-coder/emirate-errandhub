"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  deleteServiceImage,
  uploadServiceImage,
} from "@/lib/services/upload-service-image";

export type ServiceActionState = {
  error?: string;
  success?: string;
};

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getSortOrder(formData: FormData) {
  const value = Number(getString(formData, "sortOrder"));

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function getImageFile(formData: FormData): File | null {
  const value = formData.get("image");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

export async function createService(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const name = getString(formData, "name");
  const categoryId = getString(formData, "categoryId");
  const description = getString(formData, "description");
  const icon = getString(formData, "icon");
  const sortOrder = getSortOrder(formData);
  const isActive = getBoolean(formData, "isActive");
  const requiresVerification = getBoolean(formData, "requiresVerification");
  const requiresCertificate = getBoolean(formData, "requiresCertificate");

  const imageFile = getImageFile(formData);

  if (!name) {
    return {
      error: "Service name is required.",
    };
  }

  if (!categoryId) {
    return {
      error: "Please select a subcategory.",
    };
  }

  const slug = createSlug(name);

  if (!slug) {
    return {
      error: "Unable to generate a valid service slug.",
    };
  }

  /*
   * Verify that the selected category exists
   * and is actually a subcategory.
   */
  const { data: category, error: categoryError } = await supabase
    .from("service_categories")
    .select("id, parent_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError) {
    console.error("Service category lookup error:", categoryError);

    return {
      error: "Unable to verify the selected subcategory.",
    };
  }

  if (!category) {
    return {
      error: "Selected subcategory does not exist.",
    };
  }

  if (category.parent_id === null) {
    return {
      error: "Services must belong to a subcategory.",
    };
  }

  const { data: existingService } = await supabase
    .from("services")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingService) {
    return {
      error: "A service with this name already exists.",
    };
  }

  /*
   * Upload image first, if one was selected.
   */
  let imageUrl: string | null = null;

  if (imageFile) {
    try {
      const uploaded = await uploadServiceImage({
        supabase,
        file: imageFile,
        folder: "services",
        slug,
      });

      imageUrl = uploaded.url;
    } catch (error) {
      console.error("Create service image error:", error);

      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the service image.",
      };
    }
  }

  const { error } = await supabase.from("services").insert({
    category_id: categoryId,
    name,
    slug,
    description: description || null,
    icon: icon || null,
    image_url: imageUrl,
    sort_order: sortOrder,
    is_active: isActive,
    requires_verification: requiresVerification,
    requires_certificate: requiresCertificate,
  });

  if (error) {
    console.error("Create service error:", error);

    /*
     * If the database insert fails after the image was uploaded,
     * remove the uploaded image so we don't leave an orphaned file.
     */
    if (imageUrl) {
      await deleteServiceImage(supabase, imageUrl);
    }

    return {
      error: "Unable to create service. Please try again.",
    };
  }

  revalidatePath("/services");
  revalidatePath("/dashboard/admin/services");

  return {
    success: "Service created successfully.",
  };
}

export async function updateService(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const categoryId = getString(formData, "categoryId");
  const description = getString(formData, "description");
  const icon = getString(formData, "icon");
  const sortOrder = getSortOrder(formData);
  const isActive = getBoolean(formData, "isActive");
  const requiresVerification = getBoolean(formData, "requiresVerification");
  const requiresCertificate = getBoolean(formData, "requiresCertificate");

  const imageFile = getImageFile(formData);

  if (!id) {
    return {
      error: "Service ID is missing.",
    };
  }

  if (!name) {
    return {
      error: "Service name is required.",
    };
  }

  if (!categoryId) {
    return {
      error: "Please select a subcategory.",
    };
  }

  const slug = createSlug(name);

  if (!slug) {
    return {
      error: "Unable to generate a valid service slug.",
    };
  }

  /*
   * Verify that the selected category exists
   * and is actually a subcategory.
   */
  const { data: category, error: categoryError } = await supabase
    .from("service_categories")
    .select("id, parent_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError) {
    console.error("Service category lookup error:", categoryError);

    return {
      error: "Unable to verify the selected subcategory.",
    };
  }

  if (!category) {
    return {
      error: "Selected subcategory does not exist.",
    };
  }

  if (category.parent_id === null) {
    return {
      error: "Services must belong to a subcategory.",
    };
  }

  const { data: existingService } = await supabase
    .from("services")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();

  if (existingService) {
    return {
      error: "Another service with this name already exists.",
    };
  }

  /*
   * Get the existing image before updating.
   */
  const { data: currentService, error: currentServiceError } = await supabase
    .from("services")
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (currentServiceError) {
    console.error("Current service lookup error:", currentServiceError);

    return {
      error: "Unable to load the existing service.",
    };
  }

  if (!currentService) {
    return {
      error: "Service not found.",
    };
  }

  const oldImageUrl = currentService.image_url;

  /*
   * Only upload a new image if the admin selected one.
   *
   * If no new image was selected, keep the existing image.
   */
  let newImageUrl = oldImageUrl;

  if (imageFile) {
    try {
      const uploaded = await uploadServiceImage({
        supabase,
        file: imageFile,
        folder: "services",
        slug,
      });

      newImageUrl = uploaded.url;
    } catch (error) {
      console.error("Update service image error:", error);

      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the service image.",
      };
    }
  }

  const { error } = await supabase
    .from("services")
    .update({
      category_id: categoryId,
      name,
      slug,
      description: description || null,
      icon: icon || null,
      image_url: newImageUrl,
      sort_order: sortOrder,
      is_active: isActive,
      requires_verification: requiresVerification,
      requires_certificate: requiresCertificate,
    })
    .eq("id", id);

  if (error) {
    console.error("Update service error:", error);

    /*
     * If we uploaded a new image but the database update failed,
     * remove the newly uploaded image.
     */
    if (imageFile && newImageUrl && newImageUrl !== oldImageUrl) {
      await deleteServiceImage(supabase, newImageUrl);
    }

    return {
      error: "Unable to update service. Please try again.",
    };
  }

  /*
   * Delete the old image only after the database update succeeds.
   */
  if (imageFile && oldImageUrl && newImageUrl && oldImageUrl !== newImageUrl) {
    await deleteServiceImage(supabase, oldImageUrl);
  }

  revalidatePath("/services");
  revalidatePath(`/services/${slug}`);
  revalidatePath("/dashboard/admin/services");

  return {
    success: "Service updated successfully.",
  };
}

export async function toggleService(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const id = getString(formData, "id");

  if (!id) {
    console.error("Service ID is missing.");
    return;
  }

  const { data: service, error: fetchError } = await supabase
    .from("services")
    .select("id, is_active")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !service) {
    console.error("Service not found:", fetchError);
    return;
  }

  const { error } = await supabase
    .from("services")
    .update({
      is_active: !service.is_active,
    })
    .eq("id", id);

  if (error) {
    console.error("Toggle service error:", error);
    return;
  }

  revalidatePath("/services");
  revalidatePath("/dashboard/admin/services");
}

export async function deleteService(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const id = getString(formData, "id");

  if (!id) {
    console.error("Service ID is missing.");
    return;
  }

  /*
   * Get the image before deleting the database record.
   */
  const { data: service, error: fetchError } = await supabase
    .from("services")
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !service) {
    console.error("Service not found:", fetchError);
    return;
  }

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    console.error("Delete service error:", error);
    return;
  }

  /*
   * Delete the associated Storage image after
   * the database record has been deleted.
   */
  if (service.image_url) {
    await deleteServiceImage(supabase, service.image_url);
  }

  revalidatePath("/services");
  revalidatePath("/dashboard/admin/services");
}

// "use server";

// import { revalidatePath } from "next/cache";

// import { requireRole } from "@/lib/auth/require-role";
// import { createClient } from "@/lib/supabase/server";

// export type ServiceActionState = {
//   error?: string;
//   success?: string;
// };

// function createSlug(value: string) {
//   return value
//     .trim()
//     .toLowerCase()
//     .replace(/[^a-z0-9\s-]/g, "")
//     .replace(/\s+/g, "-")
//     .replace(/-+/g, "-");
// }

// function getString(formData: FormData, key: string) {
//   const value = formData.get(key);

//   return typeof value === "string" ? value.trim() : "";
// }

// function getBoolean(formData: FormData, key: string) {
//   return formData.get(key) === "on";
// }

// function getSortOrder(formData: FormData) {
//   const value = Number(getString(formData, "sortOrder"));

//   if (!Number.isFinite(value)) {
//     return 0;
//   }

//   return Math.max(0, Math.floor(value));
// }

// export async function createService(
//   _previousState: ServiceActionState,
//   formData: FormData,
// ): Promise<ServiceActionState> {
//   await requireRole(["admin"]);

//   const supabase = await createClient();

//   const name = getString(formData, "name");
//   const categoryId = getString(formData, "categoryId");
//   const description = getString(formData, "description");
//   const icon = getString(formData, "icon");
//   const imageUrl = getString(formData, "imageUrl");
//   const sortOrder = getSortOrder(formData);
//   const isActive = getBoolean(formData, "isActive");
//   const requiresVerification = getBoolean(formData, "requiresVerification");
//   const requiresCertificate = getBoolean(formData, "requiresCertificate");

//   if (!name) {
//     return { error: "Service name is required." };
//   }

//   if (!categoryId) {
//     return { error: "Please select a subcategory." };
//   }

//   const slug = createSlug(name);

//   if (!slug) {
//     return {
//       error: "Unable to generate a valid service slug.",
//     };
//   }

//   /*
//    * Verify that the selected category exists
//    * and is actually a subcategory.
//    */
//   const { data: category, error: categoryError } = await supabase
//     .from("service_categories")
//     .select("id, parent_id")
//     .eq("id", categoryId)
//     .maybeSingle();

//   if (categoryError) {
//     console.error("Service category lookup error:", categoryError);

//     return {
//       error: "Unable to verify the selected subcategory.",
//     };
//   }

//   if (!category) {
//     return {
//       error: "Selected subcategory does not exist.",
//     };
//   }

//   if (category.parent_id === null) {
//     return {
//       error: "Services must belong to a subcategory.",
//     };
//   }

//   const { data: existingService } = await supabase
//     .from("services")
//     .select("id")
//     .eq("slug", slug)
//     .maybeSingle();

//   if (existingService) {
//     return {
//       error: "A service with this name already exists.",
//     };
//   }

//   const { error } = await supabase.from("services").insert({
//     category_id: categoryId,
//     name,
//     slug,
//     description: description || null,
//     icon: icon || null,
//     image_url: imageUrl || null,
//     sort_order: sortOrder,
//     is_active: isActive,
//     requires_verification: requiresVerification,
//     requires_certificate: requiresCertificate,
//   });

//   if (error) {
//     console.error("Create service error:", error);

//     return {
//       error: "Unable to create service. Please try again.",
//     };
//   }

//   revalidatePath("/services");
//   revalidatePath("/dashboard/admin/services");

//   return {
//     success: "Service created successfully.",
//   };
// }

// export async function updateService(
//   _previousState: ServiceActionState,
//   formData: FormData,
// ): Promise<ServiceActionState> {
//   await requireRole(["admin"]);

//   const supabase = await createClient();

//   const id = getString(formData, "id");
//   const name = getString(formData, "name");
//   const categoryId = getString(formData, "categoryId");
//   const description = getString(formData, "description");
//   const icon = getString(formData, "icon");
//   const imageUrl = getString(formData, "imageUrl");
//   const sortOrder = getSortOrder(formData);
//   const isActive = getBoolean(formData, "isActive");
//   const requiresVerification = getBoolean(formData, "requiresVerification");
//   const requiresCertificate = getBoolean(formData, "requiresCertificate");

//   if (!id) {
//     return {
//       error: "Service ID is missing.",
//     };
//   }

//   if (!name) {
//     return {
//       error: "Service name is required.",
//     };
//   }

//   if (!categoryId) {
//     return {
//       error: "Please select a subcategory.",
//     };
//   }

//   const slug = createSlug(name);

//   if (!slug) {
//     return {
//       error: "Unable to generate a valid service slug.",
//     };
//   }

//   /*
//    * Verify that the selected category exists
//    * and is actually a subcategory.
//    */
//   const { data: category, error: categoryError } = await supabase
//     .from("service_categories")
//     .select("id, parent_id")
//     .eq("id", categoryId)
//     .maybeSingle();

//   if (categoryError) {
//     console.error("Service category lookup error:", categoryError);

//     return {
//       error: "Unable to verify the selected subcategory.",
//     };
//   }

//   if (!category) {
//     return {
//       error: "Selected subcategory does not exist.",
//     };
//   }

//   if (category.parent_id === null) {
//     return {
//       error: "Services must belong to a subcategory.",
//     };
//   }

//   const { data: existingService } = await supabase
//     .from("services")
//     .select("id")
//     .eq("slug", slug)
//     .neq("id", id)
//     .maybeSingle();

//   if (existingService) {
//     return {
//       error: "Another service with this name already exists.",
//     };
//   }

//   const { error } = await supabase
//     .from("services")
//     .update({
//       category_id: categoryId,
//       name,
//       slug,
//       description: description || null,
//       icon: icon || null,
//       image_url: imageUrl || null,
//       sort_order: sortOrder,
//       is_active: isActive,
//       requires_verification: requiresVerification,
//       requires_certificate: requiresCertificate,
//     })
//     .eq("id", id);

//   if (error) {
//     console.error("Update service error:", error);

//     return {
//       error: "Unable to update service. Please try again.",
//     };
//   }

//   revalidatePath("/services");
//   revalidatePath(`/services/${slug}`);
//   revalidatePath("/dashboard/admin/services");

//   return {
//     success: "Service updated successfully.",
//   };
// }

// export async function toggleService(formData: FormData): Promise<void> {
//   await requireRole(["admin"]);

//   const supabase = await createClient();

//   const id = getString(formData, "id");

//   if (!id) {
//     console.error("Service ID is missing.");
//     return;
//   }

//   const { data: service, error: fetchError } = await supabase
//     .from("services")
//     .select("id, is_active")
//     .eq("id", id)
//     .maybeSingle();

//   if (fetchError || !service) {
//     console.error("Service not found:", fetchError);
//     return;
//   }

//   const { error } = await supabase
//     .from("services")
//     .update({
//       is_active: !service.is_active,
//     })
//     .eq("id", id);

//   if (error) {
//     console.error("Toggle service error:", error);
//     return;
//   }

//   revalidatePath("/services");
//   revalidatePath("/dashboard/admin/services");
// }

// export async function deleteService(formData: FormData): Promise<void> {
//   await requireRole(["admin"]);

//   const supabase = await createClient();

//   const id = getString(formData, "id");

//   if (!id) {
//     console.error("Service ID is missing.");
//     return;
//   }

//   const { error } = await supabase.from("services").delete().eq("id", id);

//   if (error) {
//     console.error("Delete service error:", error);
//     return;
//   }

//   revalidatePath("/services");
//   revalidatePath("/dashboard/admin/services");
// }
