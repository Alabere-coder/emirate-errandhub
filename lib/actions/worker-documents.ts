"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type WorkerDocumentActionState = {
  error?: string;
  success?: string;
};

export type WorkerDocumentReviewState = {
  error?: string;
  success?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const ALLOWED_DOCUMENT_TYPES = ["identity", "certificate", "license", "other"];

export async function uploadWorkerDocument(
  _previousState: WorkerDocumentActionState,
  formData: FormData,
): Promise<WorkerDocumentActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const documentType = formData.get("document_type");
  const file = formData.get("file");

  if (
    typeof documentType !== "string" ||
    !ALLOWED_DOCUMENT_TYPES.includes(documentType)
  ) {
    return {
      error: "Please select a valid document type.",
    };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "Please select a document to upload.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      error: "The document must be 10MB or smaller.",
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      error: "Only PDF, JPG, PNG, and WebP files are allowed.",
    };
  }

  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError) {
    return {
      error: "Unable to load your worker profile.",
    };
  }

  if (!workerProfile) {
    return {
      error: "Your worker profile has not been created yet.",
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";

  const fileName = `${crypto.randomUUID()}.${extension}`;

  const filePath = `${workerProfile.id}/${documentType}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("worker-documents")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Worker document upload error:", uploadError);

    return {
      error: "Unable to upload the document.",
    };
  }

  const { error: documentError } = await supabase
    .from("worker_documents")
    .insert({
      worker_id: workerProfile.id,
      document_type: documentType,
      file_url: filePath,
      status: "pending",
    });

  if (documentError) {
    await supabase.storage.from("worker-documents").remove([filePath]);

    console.error("Worker document database error:", documentError);

    return {
      error: "Unable to save the uploaded document.",
    };
  }

  revalidatePath("/dashboard/worker/documents");

  return {
    success: "Your document has been uploaded and submitted for review.",
  };
}

export async function approveWorkerDocument(
  _previousState: WorkerDocumentReviewState,
  formData: FormData,
): Promise<WorkerDocumentReviewState> {
  const { user } = await requireRole(["admin"]);
  const supabase = await createClient();

  const documentId = formData.get("document_id");
  const workerId = formData.get("worker_id");

  if (typeof documentId !== "string" || typeof workerId !== "string") {
    return {
      error: "Invalid document information.",
    };
  }

  const { data: document, error: documentError } = await supabase
    .from("worker_documents")
    .select("id, worker_id, status")
    .eq("id", documentId)
    .eq("worker_id", workerId)
    .maybeSingle();

  if (documentError) {
    return {
      error: "Unable to load the document.",
    };
  }

  if (!document) {
    return {
      error: "Document not found.",
    };
  }

  if (document.status !== "pending") {
    return {
      error: "This document has already been reviewed.",
    };
  }

  const { error: updateError } = await supabase
    .from("worker_documents")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", documentId)
    .eq("worker_id", workerId);

  if (updateError) {
    return {
      error: "Unable to approve the document.",
    };
  }

  await updateWorkerVerificationStatus(supabase, workerId);

  revalidatePath(`/dashboard/admin/worker-verification/${workerId}`);

  revalidatePath("/dashboard/admin/worker-verification");

  return {
    success: "Document approved.",
  };
}

export async function rejectWorkerDocument(
  _previousState: WorkerDocumentReviewState,
  formData: FormData,
): Promise<WorkerDocumentReviewState> {
  const { user } = await requireRole(["admin"]);
  const supabase = await createClient();

  const documentId = formData.get("document_id");
  const workerId = formData.get("worker_id");
  const rejectionReason = formData.get("rejection_reason");

  if (typeof documentId !== "string" || typeof workerId !== "string") {
    return {
      error: "Invalid document information.",
    };
  }

  if (typeof rejectionReason !== "string") {
    return {
      error: "Please provide a rejection reason.",
    };
  }

  const reason = rejectionReason.trim();

  if (reason.length < 10) {
    return {
      error: "The rejection reason must be at least 10 characters.",
    };
  }

  const { data: document, error: documentError } = await supabase
    .from("worker_documents")
    .select("id, worker_id, status")
    .eq("id", documentId)
    .eq("worker_id", workerId)
    .maybeSingle();

  if (documentError) {
    return {
      error: "Unable to load the document.",
    };
  }

  if (!document) {
    return {
      error: "Document not found.",
    };
  }

  if (document.status !== "pending") {
    return {
      error: "This document has already been reviewed.",
    };
  }

  const { error: updateError } = await supabase
    .from("worker_documents")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("worker_id", workerId);

  if (updateError) {
    return {
      error: "Unable to reject the document.",
    };
  }

  // A rejected document means the worker cannot currently be verified.
  const { error: workerError } = await supabase
    .from("worker_profiles")
    .update({
      verification_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", workerId);

  if (workerError) {
    return {
      error: "Document was rejected, but worker status could not be updated.",
    };
  }

  revalidatePath(`/dashboard/admin/worker-verification/${workerId}`);

  revalidatePath("/dashboard/admin/worker-verification");

  return {
    success: "Document rejected.",
  };
}

async function updateWorkerVerificationStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workerId: string,
) {
  const { data: documents } = await supabase
    .from("worker_documents")
    .select("document_type, status")
    .eq("worker_id", workerId);

  if (!documents || documents.length === 0) {
    return;
  }

  const identityApproved = documents.some(
    (document) =>
      document.document_type === "identity" && document.status === "approved",
  );

  if (!identityApproved) {
    await supabase
      .from("worker_profiles")
      .update({
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    return;
  }

  const hasPendingDocuments = documents.some(
    (document) => document.status === "pending",
  );

  const hasRejectedDocuments = documents.some(
    (document) => document.status === "rejected",
  );

  if (hasRejectedDocuments) {
    await supabase
      .from("worker_profiles")
      .update({
        verification_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    return;
  }

  if (!hasPendingDocuments) {
    await supabase
      .from("worker_profiles")
      .update({
        verification_status: "verified",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);
  }
}
