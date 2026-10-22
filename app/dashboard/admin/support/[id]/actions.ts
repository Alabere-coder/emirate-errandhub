"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!UUID_REGEX.test(ticketId)) {
    return { error: "Invalid support ticket." };
  }

  if (message.length < 1 || message.length > 5000) {
    return { error: "Reply must be between 1 and 5,000 characters." };
  }

  const supabase = createAdminClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id, status")
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
    .select("id, status")
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

  revalidatePath(`/dashboard/admin/support/${ticketId}`);
  revalidatePath("/dashboard/admin/support");
  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");

  return { success: "Ticket status updated." };
}
