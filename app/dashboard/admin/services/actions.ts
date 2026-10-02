"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  deleteServiceImage,
  uploadServiceImage,
} from "@/lib/services/upload-service-image";

export type ServiceCategoryActionState = {
  error?: string;
  success?: string;
};

/* =========================================================
   HELPERS
========================================================= */

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

function getImageFile(formData: FormData) {
  const value = formData.get("image");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getImageFolder(parentId: string) {
  return parentId ? "subcategories" : "categories";
}

/* =========================================================
   CREATE CATEGORY / SUBCATEGORY
========================================================= */

export async function createServiceCategory(
  _previousState: ServiceCategoryActionState,
  formData: FormData,
): Promise<ServiceCategoryActionState> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const slugInput = getString(formData, "slug");
  const parentId = getString(formData, "parentId");
  const icon = getString(formData, "icon");
  const sortOrder = getSortOrder(formData);
  const isActive = getBoolean(formData, "isActive");
  const requiresVerification = getBoolean(formData, "requiresVerification");
  const requiresCertificate = getBoolean(formData, "requiresCertificate");

  const imageFile = getImageFile(formData);

  if (!name) {
    return {
      error: "Category name is required.",
    };
  }

  const slug = createSlug(slugInput || name);

  if (!slug) {
    return {
      error: "Please provide a valid category name or slug.",
    };
  }

  /* =======================================================
     VERIFY PARENT
  ======================================================= */

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("service_categories")
      .select("id, parent_id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError) {
      console.error("Parent category verification error:", parentError);

      return {
        error: "Unable to verify the parent category.",
      };
    }

    if (!parent) {
      return {
        error: "The selected parent category does not exist.",
      };
    }

    if (parent.parent_id !== null) {
      return {
        error: "Only top-level categories can have subcategories.",
      };
    }
  }

  /* =======================================================
     UPLOAD IMAGE
  ======================================================= */

  let uploadedImageUrl: string | null = null;

  if (imageFile) {
    try {
      const upload = await uploadServiceImage({
        supabase,
        file: imageFile,
        folder: getImageFolder(parentId),
        slug,
      });

      uploadedImageUrl = upload.url;
    } catch (error) {
      console.error("Service category image upload error:", error);

      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the category image.",
      };
    }
  }

  /* =======================================================
     INSERT
  ======================================================= */

  const { error } = await supabase.from("service_categories").insert({
    name,
    slug,
    description: description || null,
    icon: icon || null,
    image_url: uploadedImageUrl,
    parent_id: parentId || null,
    sort_order: sortOrder,
    is_active: isActive,
    requires_verification: requiresVerification,
    requires_certificate: requiresCertificate,
  });

  if (error) {
    console.error("Create service category error:", error);

    /*
     * If the database insert failed after the image upload,
     * remove the uploaded image so we do not leave an orphaned
     * file in Storage.
     */
    if (uploadedImageUrl) {
      await deleteServiceImage(supabase, uploadedImageUrl);
    }

    if (error.code === "23505") {
      return {
        error: "A service category with this name or slug already exists.",
      };
    }

    return {
      error: "Unable to create the service category.",
    };
  }

  revalidatePath("/services");
  revalidatePath("/services/categories");
  revalidatePath("/dashboard/admin/services");

  return {
    success: parentId
      ? "Subcategory created successfully."
      : "Service category created successfully.",
  };
}

/* =========================================================
   UPDATE CATEGORY / SUBCATEGORY
========================================================= */

export async function updateServiceCategory(
  _previousState: ServiceCategoryActionState,
  formData: FormData,
): Promise<ServiceCategoryActionState> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const slugInput = getString(formData, "slug");
  const parentId = getString(formData, "parentId");
  const icon = getString(formData, "icon");
  const sortOrder = getSortOrder(formData);
  const isActive = getBoolean(formData, "isActive");
  const requiresVerification = getBoolean(formData, "requiresVerification");
  const requiresCertificate = getBoolean(formData, "requiresCertificate");

  const imageFile = getImageFile(formData);

  if (!id) {
    return {
      error: "Category ID is missing.",
    };
  }

  if (!name) {
    return {
      error: "Category name is required.",
    };
  }

  const slug = createSlug(slugInput || name);

  if (!slug) {
    return {
      error: "Please provide a valid category name or slug.",
    };
  }

  if (parentId === id) {
    return {
      error: "A category cannot be its own parent.",
    };
  }

  /* =======================================================
     GET EXISTING CATEGORY
  ======================================================= */

  const { data: existingCategory, error: existingError } = await supabase
    .from("service_categories")
    .select("id, parent_id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    console.error("Unable to load existing service category:", existingError);

    return {
      error: "Unable to load the existing category.",
    };
  }

  if (!existingCategory) {
    return {
      error: "The service category no longer exists.",
    };
  }

  /* =======================================================
     VERIFY PARENT
  ======================================================= */

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("service_categories")
      .select("id, parent_id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError) {
      console.error("Parent category verification error:", parentError);

      return {
        error: "Unable to verify the parent category.",
      };
    }

    if (!parent) {
      return {
        error: "The selected parent category does not exist.",
      };
    }

    if (parent.parent_id !== null) {
      return {
        error: "Only top-level categories can have subcategories.",
      };
    }
  }

  /* =======================================================
     PREVENT MOVING A CATEGORY WITH CHILDREN
  ======================================================= */

  if (parentId) {
    const { count, error: childrenError } = await supabase
      .from("service_categories")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("parent_id", id);

    if (childrenError) {
      console.error(
        "Unable to check existing child categories:",
        childrenError,
      );

      return {
        error: "Unable to verify the category hierarchy.",
      };
    }

    if ((count ?? 0) > 0) {
      return {
        error:
          "This category has subcategories and cannot be moved under another category.",
      };
    }
  }

  /* =======================================================
     UPLOAD NEW IMAGE
  ======================================================= */

  let uploadedImageUrl: string | null = null;

  if (imageFile) {
    try {
      const upload = await uploadServiceImage({
        supabase,
        file: imageFile,
        folder: getImageFolder(parentId),
        slug,
      });

      uploadedImageUrl = upload.url;
    } catch (error) {
      console.error("Service category image upload error:", error);

      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the category image.",
      };
    }
  }

  /*
   * Keep the existing image when the admin does not select
   * a replacement.
   */
  const imageUrl = uploadedImageUrl ?? existingCategory.image_url ?? null;

  /* =======================================================
     UPDATE DATABASE
  ======================================================= */

  const { error } = await supabase
    .from("service_categories")
    .update({
      name,
      slug,
      description: description || null,
      icon: icon || null,
      image_url: imageUrl,
      parent_id: parentId || null,
      sort_order: sortOrder,
      is_active: isActive,
      requires_verification: requiresVerification,
      requires_certificate: requiresCertificate,
    })
    .eq("id", id);

  if (error) {
    console.error("Update service category error:", error);

    /*
     * Database update failed, so remove the newly uploaded
     * image. Keep the old image untouched.
     */
    if (uploadedImageUrl) {
      await deleteServiceImage(supabase, uploadedImageUrl);
    }

    if (error.code === "23505") {
      return {
        error: "A service category with this name or slug already exists.",
      };
    }

    return {
      error: "Unable to update the service category.",
    };
  }

  /* =======================================================
     DELETE OLD IMAGE AFTER SUCCESSFUL UPDATE
  ======================================================= */

  if (
    uploadedImageUrl &&
    existingCategory.image_url &&
    existingCategory.image_url !== uploadedImageUrl
  ) {
    await deleteServiceImage(supabase, existingCategory.image_url);
  }

  /* =======================================================
     REVALIDATE
  ======================================================= */

  revalidatePath("/services");
  revalidatePath("/services/categories");
  revalidatePath("/dashboard/admin/services");

  return {
    success: parentId
      ? "Subcategory updated successfully."
      : "Service category updated successfully.",
  };
}

/* =========================================================
   TOGGLE CATEGORY
========================================================= */

export async function toggleServiceCategory(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const id = getString(formData, "id");

  if (!id) {
    console.error("Category ID is missing.");
    return;
  }

  const { data: category, error: fetchError } = await supabase
    .from("service_categories")
    .select("id, is_active")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !category) {
    console.error("Service category not found:", fetchError);
    return;
  }

  const { error } = await supabase
    .from("service_categories")
    .update({
      is_active: !category.is_active,
    })
    .eq("id", id);

  if (error) {
    console.error("Toggle service category error:", error);
    return;
  }

  revalidatePath("/services");
  revalidatePath("/services/categories");
  revalidatePath("/dashboard/admin/services");
}

/* =========================================================
   DELETE CATEGORY
========================================================= */

export async function deleteServiceCategory(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const id = getString(formData, "id");

  if (!id) {
    console.error("Category ID is missing.");
    return;
  }

  /* =======================================================
     CHECK CHILD CATEGORIES
  ======================================================= */

  const { data: children, error: childrenError } = await supabase
    .from("service_categories")
    .select("id")
    .eq("parent_id", id)
    .limit(1);

  if (childrenError) {
    console.error("Unable to check for child categories:", childrenError);
    return;
  }

  if (children && children.length > 0) {
    console.error("Cannot delete category because it has subcategories.");
    return;
  }

  /* =======================================================
     GET IMAGE BEFORE DELETE
  ======================================================= */

  const { data: category, error: fetchError } = await supabase
    .from("service_categories")
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("Unable to load category before deletion:", fetchError);
    return;
  }

  if (!category) {
    console.error("Service category not found.");
    return;
  }

  /* =======================================================
     DELETE DATABASE RECORD
  ======================================================= */

  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete service category error:", error);
    return;
  }

  /* =======================================================
     DELETE STORAGE IMAGE
  ======================================================= */

  if (category.image_url) {
    await deleteServiceImage(supabase, category.image_url);
  }

  /* =======================================================
     REVALIDATE
  ======================================================= */

  revalidatePath("/services");
  revalidatePath("/services/categories");
  revalidatePath("/dashboard/admin/services");
}
