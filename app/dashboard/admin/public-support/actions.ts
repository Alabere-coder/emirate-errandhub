"use server";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPublicSupportReply } from "@/lib/email/public-support";
import { revalidatePath } from "next/cache";

export type PublicSupportReplyState = {
  success?: string;
  error?: string;
  emailWarning?: string;
};

const initialMessageLength = 10;
const maximumMessageLength = 5000;

export async function sendPublicSupportAdminReply(
  _previousState: PublicSupportReplyState,
  formData: FormData,
): Promise<PublicSupportReplyState> {
  try {
    // Require an authenticated, active admin or super admin.
    const { supabase } = await requireRole(["admin", "super_admin"]);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Your session could not be verified. Please sign in again.",
      };
    }

    const enquiryId = String(formData.get("enquiryId") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(enquiryId)) {
      return { error: "Invalid enquiry reference." };
    }

    if (
      message.length < initialMessageLength ||
      message.length > maximumMessageLength
    ) {
      return {
        error: "Your reply must be between 10 and 5,000 characters.",
      };
    }

    // Service-role access is used only after the admin authorization check.
    const adminClient = createAdminClient();

    const { data: enquiry, error: enquiryError } = await adminClient
      .from("public_support_messages")
      .select("id, full_name, email, subject, status")
      .eq("id", enquiryId)
      .maybeSingle();

    if (enquiryError) {
      console.error("Failed to retrieve public support enquiry:", enquiryError);
      return { error: "Unable to retrieve this enquiry." };
    }

    if (!enquiry) {
      return { error: "This enquiry could not be found." };
    }

    if (enquiry.status === "closed") {
      return {
        error: "This enquiry is closed. Reopen it before sending a reply.",
      };
    }

    // Save the reply before attempting email delivery.
    const { data: reply, error: insertError } = await adminClient
      .from("public_support_replies")
      .insert({
        enquiry_id: enquiry.id,
        admin_id: user.id,
        message,
        email_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !reply) {
      console.error("Failed to save public support reply:", insertError);
      return { error: "Unable to save your reply. Please try again." };
    }

    // Send the response to the visitor.
    const emailResult = await sendPublicSupportReply({
      visitorName: enquiry.full_name,
      visitorEmail: enquiry.email,
      originalSubject: enquiry.subject,
      message,
    });

    if (!emailResult.success) {
      const { error: updateError } = await adminClient
        .from("public_support_replies")
        .update({
          email_status: "failed",
          email_error: emailResult.error ?? "Email delivery failed.",
        })
        .eq("id", reply.id);

      if (updateError) {
        console.error(
          "Failed to update public support reply delivery status:",
          updateError,
        );
      }

      return {
        success: "Your reply has been saved in the support history.",
        emailWarning:
          "The email could not be delivered. Your reply is saved, but the visitor has not been notified. You can retry delivery later.",
      };
    }

    // Record successful email submission.
    const { error: replyUpdateError } = await adminClient
      .from("public_support_replies")
      .update({
        email_status: "sent",
        resend_email_id: emailResult.id ?? null,
        email_error: null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", reply.id);

    if (replyUpdateError) {
      console.error(
        "Email was accepted but reply status update failed:",
        replyUpdateError,
      );

      return {
        success: "Your reply email was accepted by the email service.",
        emailWarning:
          "The email was accepted, but its delivery status could not be saved. Please check the reply history before attempting another send.",
      };
    }

    // Only mark the enquiry as responded after successful email submission.
    const { error: enquiryUpdateError } = await adminClient
      .from("public_support_messages")
      .update({ status: "responded" })
      .eq("id", enquiry.id);

    if (enquiryUpdateError) {
      console.error(
        "Failed to update public support enquiry status:",
        enquiryUpdateError,
      );
    }

    return {
      success: "Your response has been sent to the visitor's email address.",
      ...(enquiryUpdateError
        ? {
            emailWarning:
              "The email was sent, but the enquiry status could not be updated. Please refresh the page.",
          }
        : {}),
    };
  } catch (error) {
    console.error("Public support reply action failed:", error);

    return {
      error: "Something went wrong while processing your reply.",
    };
  }
}

export async function retryPublicSupportReplyEmail(
  _previousState: PublicSupportReplyState,
  formData: FormData,
): Promise<PublicSupportReplyState> {
  try {
    const { supabase } = await requireRole(["admin", "super_admin"]);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Your session could not be verified. Please sign in again.",
      };
    }

    const replyId = String(formData.get("replyId") ?? "").trim();

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(replyId)) {
      return { error: "Invalid reply reference." };
    }

    const adminClient = createAdminClient();

    const { data: reply, error: replyError } = await adminClient
      .from("public_support_replies")
      .select("id, enquiry_id, message, email_status")
      .eq("id", replyId)
      .maybeSingle();

    if (replyError) {
      console.error("Failed to retrieve support reply:", replyError);
      return { error: "Unable to retrieve this reply." };
    }

    if (!reply) {
      return { error: "This reply could not be found." };
    }

    if (reply.email_status === "sent") {
      return { error: "This reply has already been sent successfully." };
    }

    const { data: enquiry, error: enquiryError } = await adminClient
      .from("public_support_messages")
      .select("id, full_name, email, subject, status")
      .eq("id", reply.enquiry_id)
      .maybeSingle();

    if (enquiryError) {
      console.error("Failed to retrieve support enquiry:", enquiryError);
      return { error: "Unable to retrieve the original enquiry." };
    }

    if (!enquiry) {
      return { error: "The original enquiry could not be found." };
    }

    if (enquiry.status === "closed") {
      return {
        error: "This enquiry is closed. Reopen it before retrying delivery.",
      };
    }

    const { error: pendingError } = await adminClient
      .from("public_support_replies")
      .update({
        email_status: "pending",
        email_error: null,
      })
      .eq("id", reply.id);

    if (pendingError) {
      console.error("Failed to prepare reply retry:", pendingError);
      return { error: "Unable to prepare the email retry." };
    }

    const emailResult = await sendPublicSupportReply({
      visitorName: enquiry.full_name,
      visitorEmail: enquiry.email,
      originalSubject: enquiry.subject,
      message: reply.message,
    });

    if (!emailResult.success) {
      const { error: updateError } = await adminClient
        .from("public_support_replies")
        .update({
          email_status: "failed",
          email_error: emailResult.error ?? "Email delivery failed.",
        })
        .eq("id", reply.id);

      if (updateError) {
        console.error("Failed to record retry failure:", updateError);
      }

      revalidatePath(`/dashboard/admin/public-support/${enquiry.id}`);

      return {
        error:
          "The email could not be delivered again. The reply remains saved. Please check your email configuration.",
      };
    }

    const { error: updateError } = await adminClient
      .from("public_support_replies")
      .update({
        email_status: "sent",
        resend_email_id: emailResult.id ?? null,
        email_error: null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", reply.id);

    if (updateError) {
      console.error(
        "Retry email was accepted but status update failed:",
        updateError,
      );

      revalidatePath(`/dashboard/admin/public-support/${enquiry.id}`);

      return {
        success: "The email was accepted by the email service.",
        emailWarning:
          "The delivery status could not be saved. Check the reply history before retrying again to avoid duplicate emails.",
      };
    }

    const { error: enquiryUpdateError } = await adminClient
      .from("public_support_messages")
      .update({ status: "responded" })
      .eq("id", enquiry.id);

    if (enquiryUpdateError) {
      console.error(
        "Failed to update enquiry after retry:",
        enquiryUpdateError,
      );
    }

    revalidatePath(`/dashboard/admin/public-support/${enquiry.id}`);
    revalidatePath("/dashboard/admin/public-support");

    return {
      success: "The reply email has been sent successfully.",
      ...(enquiryUpdateError
        ? {
            emailWarning:
              "The email was sent, but the enquiry status could not be updated. Please refresh the page.",
          }
        : {}),
    };
  } catch (error) {
    console.error("Public support email retry failed:", error);

    return {
      error: "Something went wrong while retrying the email.",
    };
  }
}
