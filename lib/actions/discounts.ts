"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type DiscountActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  code?: string;
  originalAmount?: number;
  discountAmount?: number;
  payableAmount?: number;
};

type DiscountRpcPayload = {
  success?: boolean;
  error?: string;
  message?: string;
  code?: string;
  original_amount?: number | string;
  discount_amount?: number | string;
  payable_amount?: number | string;
};

type DiscountRpcResponse = {
  data: unknown;
  error: { message: string } | null;
};

async function callDiscountRpc(
  functionName: string,
  args: Record<string, string>,
): Promise<DiscountRpcResponse> {
  const supabase = await createClient();

  // Allows this action to work even if generated database types
  // have not yet been regenerated with the new RPC functions.
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    params: Record<string, string>,
  ) => Promise<DiscountRpcResponse>;

  return rpc(functionName, args);
}

function parseDiscountResult(data: unknown): DiscountActionResult {
  if (!data || typeof data !== "object") {
    return {
      success: false,
      error: "The server returned an invalid discount response.",
    };
  }

  const result = data as DiscountRpcPayload;

  if (result.success !== true) {
    return {
      success: false,
      error: result.error || "Unable to process the discount code.",
    };
  }

  return {
    success: true,
    message: result.message,
    code: result.code,
    originalAmount:
      result.original_amount !== undefined
        ? Number(result.original_amount)
        : undefined,
    discountAmount:
      result.discount_amount !== undefined
        ? Number(result.discount_amount)
        : undefined,
    payableAmount:
      result.payable_amount !== undefined
        ? Number(result.payable_amount)
        : undefined,
  };
}

export async function applyJobDiscountCode(
  jobId: string,
  code: string,
): Promise<DiscountActionResult> {
  await requireRole(["customer"]);

  if (!jobId?.trim()) {
    return {
      success: false,
      error: "Invalid job reference.",
    };
  }

  if (!code?.trim()) {
    return {
      success: false,
      error: "Enter a discount code.",
    };
  }

  try {
    const { data, error } = await callDiscountRpc("apply_job_discount_code", {
      p_job_id: jobId,
      p_code: code.trim().toUpperCase(),
    });

    if (error) {
      console.error("Apply discount error:", error.message);

      return {
        success: false,
        error: "Unable to apply this discount code. Please try again.",
      };
    }

    const result = parseDiscountResult(data);

    if (result.success) {
      revalidatePath("/dashboard/customer/requests");
      revalidatePath("/dashboard/customer/jobs");
    }

    return result;
  } catch (error) {
    console.error("Apply discount exception:", error);

    return {
      success: false,
      error: "Something went wrong while applying the discount code.",
    };
  }
}

export async function removeJobDiscountCode(
  jobId: string,
): Promise<DiscountActionResult> {
  await requireRole(["customer"]);

  if (!jobId?.trim()) {
    return {
      success: false,
      error: "Invalid job reference.",
    };
  }

  try {
    const { data, error } = await callDiscountRpc("remove_job_discount_code", {
      p_job_id: jobId,
    });

    if (error) {
      console.error("Remove discount error:", error.message);

      return {
        success: false,
        error: "Unable to remove the discount. Please try again.",
      };
    }

    const result = parseDiscountResult(data);

    if (result.success) {
      revalidatePath("/dashboard/customer/requests");
      revalidatePath("/dashboard/customer/jobs");
    }

    return result;
  } catch (error) {
    console.error("Remove discount exception:", error);

    return {
      success: false,
      error: "Something went wrong while removing the discount.",
    };
  }
}
