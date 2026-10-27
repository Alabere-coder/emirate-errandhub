"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create-notification";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_STATUSES = [
  "open",
  "in_progress",
  "waiting_for_user",
  "resolved",
  "closed",
] as const;

type ActionState = {
  error?: string;
  success?: string;
};

export async function sendAdminSupportReply(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireRole(["admin"]);

  const supabase = createAdminClient();

  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  if (adminProfileError || !adminProfile) {
    console.error("Failed to load admin profile:", adminProfileError);
    return { error: "Could not identify the responding administrator." };
  }

  const adminName =
    [adminProfile.first_name, adminProfile.last_name]
      .filter(Boolean)
      .join(" ") || "An administrator";

  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!UUID_REGEX.test(ticketId)) {
    return { error: "Invalid support ticket." };
  }

  if (message.length < 1 || message.length > 5000) {
    return { error: "Reply must be between 1 and 5,000 characters." };
  }

  // const supabase = createAdminClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id, status, user_id, subject")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    console.error("Failed to load support ticket:", ticketError);
    return { error: "Ticket not found." };
  }

  if (ticket.status === "resolved" || ticket.status === "closed") {
    return {
      error: "This ticket is closed. Reopen it before replying.",
    };
  }

  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    message,
  });

  if (error) {
    console.error("Failed to send admin support reply:", error);
    return { error: "Could not send your reply. Please try again." };
  }

  const { error: updateError } = await supabase
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (updateError) {
    console.error("Failed to update ticket timestamp:", updateError);
  }

  // await createNotification({
  //   userId: ticket.user_id,
  //   type: "support_admin_reply",
  //   title: "Support has replied to your ticket",
  //   message: `Our support team has replied to "${ticket.subject}". Open your ticket to view the response.`,
  //   link: `/dashboard/support/${ticket.id}`,
  // });
  await createNotification({
    userId: ticket.user_id,
    type: "support_admin_reply",

    // Customer or worker notification
    title: "Support has replied to your ticket",
    message: `Our support team has replied to "${ticket.subject}". Open your ticket to view the response.`,

    // Administrator notification
    adminTitle: "Support ticket response sent",
    // adminMessage: `An administrator has replied to support ticket "${ticket.subject}" (${ticket.id}).`,
    adminMessage: `Admin ${adminName} replied to support ticket "${ticket.subject}" (${ticket.id}).`,

    link: `/dashboard/support/${ticket.id}`,
  });

  revalidatePath(`/dashboard/admin/support/${ticketId}`);
  revalidatePath("/dashboard/admin/support");
  revalidatePath(`/dashboard/support/${ticketId}`);

  return { success: "Reply sent successfully." };
}

export async function updateSupportTicketStatus(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["admin"]);

  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!UUID_REGEX.test(ticketId)) {
    return { error: "Invalid support ticket." };
  }

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: "Please select a valid status." };
  }

  const supabase = createAdminClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id, status, user_id, subject")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    return { error: "Ticket not found." };
  }

  if (
    (ticket.status === "resolved" || ticket.status === "closed") &&
    status !== ticket.status &&
    status !== "open"
  ) {
    return {
      error: "Reopen this ticket before moving it to another status.",
    };
  }

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) {
    console.error("Failed to update support ticket status:", error);
    return { error: "Could not update ticket status." };
  }

  if (ticket.status !== status) {
    // await createNotification({
    //   userId: ticket.user_id,
    //   type: "support_status_updated",
    //   title: "Your support ticket status has changed",
    //   message: `Your ticket "${ticket.subject}" is now ${status.replace(/_/g, " ")}.`,
    //   link: `/dashboard/support/${ticket.id}`,
    // });
    if (ticket.status !== status) {
      await createNotification({
        userId: ticket.user_id,
        type: "support_status_updated",

        // Customer or worker notification
        title: "Your support ticket status has changed",
        message: `Your ticket "${ticket.subject}" is now ${status.replace(/_/g, " ")}.`,

        // Administrator notification
        adminTitle: "Support ticket status updated",
        adminMessage: `Support ticket "${ticket.subject}" (${ticket.id}) was changed from ${ticket.status.replace(/_/g, " ")} to ${status.replace(/_/g, " ")}.`,

        link: `/dashboard/support/${ticket.id}`,
      });
    }
  }

  revalidatePath(`/dashboard/admin/support/${ticketId}`);
  revalidatePath("/dashboard/admin/support");
  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");

  return { success: "Ticket status updated." };
}
