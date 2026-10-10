"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type WorkerPortfolioActionState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function revalidatePortfolioPaths(workerId: string) {
  revalidatePath("/dashboard/worker/portfolio");
  revalidatePath("/dashboard/worker");
  revalidatePath("/dashboard/customer/workers");
  revalidatePath(`/dashboard/customer/workers/${workerId}`);
}

export async function addWorkerPortfolioItem(
  _previousState: WorkerPortfolioActionState,
  formData: FormData,
): Promise<WorkerPortfolioActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select an image of your work." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "The image must not exceed 5 MB." };
  }

  const allowedTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extension = allowedTypes[file.type];

  if (!extension) {
    return { error: "Upload a JPG, PNG, or WebP image." };
  }

  const { data: workerProfile, error: profileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !workerProfile) {
    return { error: "Unable to find your worker profile." };
  }

  const { data: existingItems, error: existingError } = await supabase
    .from("worker_portfolio")
    .select("id")
    .eq("worker_id", workerProfile.id);

  if (existingError) {
    return { error: "Unable to load your existing portfolio." };
  }

  const imagePath = `${workerProfile.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("worker-portfolio")
    .upload(imagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Portfolio image upload error:", uploadError);
    return {
      error: "Unable to upload the image. Please try again.",
    };
  }

  const { error: insertError } = await supabase
    .from("worker_portfolio")
    .insert({
      worker_id: workerProfile.id,
      title: title || null,
      description: description || null,
      image_url: imagePath,
      sort_order: existingItems.length,
    });

  if (insertError) {
    console.error("Portfolio database insert error:", insertError);

    await supabase.storage.from("worker-portfolio").remove([imagePath]);

    return {
      error: "Unable to save the portfolio item. Please try again.",
    };
  }

  revalidatePortfolioPaths(workerProfile.id);

  return { success: "Portfolio item added successfully." };
}

export async function editWorkerPortfolioItem(
  _previousState: WorkerPortfolioActionState,
  formData: FormData,
): Promise<WorkerPortfolioActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const itemId = getString(formData, "item_id");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const file = formData.get("image");

  if (!itemId) {
    return { error: "Portfolio item ID is required." };
  }

  const { data: workerProfile, error: profileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !workerProfile) {
    return { error: "Unable to find your worker profile." };
  }

  const { data: item, error: itemError } = await supabase
    .from("worker_portfolio")
    .select("id, image_url")
    .eq("id", itemId)
    .eq("worker_id", workerProfile.id)
    .maybeSingle();

  if (itemError || !item) {
    return { error: "Portfolio item not found or access denied." };
  }

  let newImagePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: "The image must not exceed 5 MB." };
    }

    const allowedTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = allowedTypes[file.type];

    if (!extension) {
      return { error: "Upload a JPG, PNG, or WebP image." };
    }

    newImagePath = `${workerProfile.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("worker-portfolio")
      .upload(newImagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Portfolio image replacement upload error:", uploadError);
      return { error: "Unable to upload the replacement image." };
    }
  }

  const updateData = {
    title: title || null,
    description: description || null,
    ...(newImagePath ? { image_url: newImagePath } : {}),
  };

  const { error: updateError } = await supabase
    .from("worker_portfolio")
    .update(updateData)
    .eq("id", item.id)
    .eq("worker_id", workerProfile.id);

  if (updateError) {
    if (newImagePath) {
      await supabase.storage.from("worker-portfolio").remove([newImagePath]);
    }

    console.error("Portfolio update error:", updateError);
    return { error: "Unable to update the portfolio item." };
  }

  // Only remove the old image after the database update succeeds.
  if (newImagePath) {
    const { error: cleanupError } = await supabase.storage
      .from("worker-portfolio")
      .remove([item.image_url]);

    if (cleanupError) {
      console.error("Old portfolio image cleanup error:", cleanupError);
    }
  }

  revalidatePortfolioPaths(workerProfile.id);

  return { success: "Portfolio item updated successfully." };
}

export async function deleteWorkerPortfolioItem(
  formData: FormData,
): Promise<void> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const itemId = getString(formData, "item_id");

  if (!itemId) {
    throw new Error("Portfolio item ID is required.");
  }

  const { data: workerProfile, error: profileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !workerProfile) {
    throw new Error("Unable to find your worker profile.");
  }

  const { data: item, error: itemError } = await supabase
    .from("worker_portfolio")
    .select("id, image_url")
    .eq("id", itemId)
    .eq("worker_id", workerProfile.id)
    .maybeSingle();

  if (itemError || !item) {
    throw new Error("Portfolio item not found or access denied.");
  }

  const { error: deleteError } = await supabase
    .from("worker_portfolio")
    .delete()
    .eq("id", item.id)
    .eq("worker_id", workerProfile.id);

  if (deleteError) {
    throw new Error("Unable to delete the portfolio item.");
  }

  const { error: storageError } = await supabase.storage
    .from("worker-portfolio")
    .remove([item.image_url]);

  if (storageError) {
    console.error("Portfolio image cleanup error:", storageError);
  }

  revalidatePortfolioPaths(workerProfile.id);
}
