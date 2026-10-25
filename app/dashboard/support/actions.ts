"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/create-notification";

const VALID_CATEGORIES = [
  "account",
  "payments",
  "jobs",
  "worker",
  "customer",
  "technical",
  "other",
] as const;

export async function createSupportTicket(formData: FormData): Promise<void> {
  const { user } = await requireRole(["customer", "worker"]);

  const category = String(formData.get("category") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (
    !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])
  ) {
    throw new Error("Please select a valid support category.");
  }

  if (subject.length < 5 || subject.length > 150) {
    throw new Error("Subject must be between 5 and 150 characters.");
  }

  if (description.length < 20 || description.length > 5000) {
    throw new Error("Description must be between 20 and 5,000 characters.");
  }

  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      category,
      subject,
      description,
    })
    .select("id")
    .single();

  if (error || !ticket) {
    console.error("Failed to create support ticket:", error);
    throw new Error("We couldn't submit your ticket. Please try again.");
  }

  await createNotification({
    userId: user.id,
    type: "support_ticket_created",
    title: "New support ticket",
    message: `A new support ticket has been submitted: ${subject}`,
    link: `/dashboard/admin/support/${ticket.id}`,
    adminOnly: true,
  });

  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard/admin/support");

  redirect(`/dashboard/support/${ticket.id}`);
}

export async function sendSupportTicketMessage(
  _prevState: { error?: string; success?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const { user } = await requireRole(["customer", "worker"]);

  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(ticketId)) {
    return { error: "Invalid support ticket." };
  }

  if (message.length < 1 || message.length > 5000) {
    return {
      error: "Your reply must be between 1 and 5,000 characters.",
    };
  }

  const supabase = await createClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id, status")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ticketError || !ticket) {
    return {
      error: "Ticket not found or you don't have access to it.",
    };
  }

  if (ticket.status === "resolved" || ticket.status === "closed") {
    return {
      error: "This ticket is closed to replies. Please create a new ticket.",
    };
  }

  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    message,
  });

  if (error) {
    console.error("Failed to send support reply:", error);
    return {
      error: "We couldn't send your reply. Please try again.",
    };
  }

  await createNotification({
    userId: user.id,
    type: "support_ticket_reply",
    title: "New support ticket reply",
    message: `A customer or worker has replied to support ticket ${ticket.id}.`,
    link: `/dashboard/admin/support/${ticket.id}`,
    adminOnly: true,
  });

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");

  return { success: "Your reply has been sent." };
}
