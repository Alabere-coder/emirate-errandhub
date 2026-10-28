"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createNotification } from "@/lib/notifications/create-notification";

export type MessageActionState = {
  error?: string;
  success?: string;
};

export async function sendMessage(
  _previousState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const { supabase, user } = await requireRole(["customer", "worker"]);

  const conversationId = formData.get("conversationId");
  const message = formData.get("message");

  if (typeof conversationId !== "string" || !conversationId) {
    return {
      error: "Conversation not found.",
    };
  }

  if (typeof message !== "string" || !message.trim()) {
    return {
      error: "Message cannot be empty.",
    };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length > 5000) {
    return {
      error: "Message is too long.",
    };
  }

  // Verify that the current user belongs to this conversation.
  const { data: participant, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (participantError) {
    console.error("Conversation participant lookup error:", participantError);

    return {
      error: "Unable to verify this conversation.",
    };
  }

  if (!participant) {
    return {
      error: "You do not have access to this conversation.",
    };
  }

  // Find the other participant in this conversation.
  const { data: otherParticipants, error: recipientsError } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id);

  if (recipientsError) {
    console.error("Conversation recipients lookup error:", recipientsError);

    return {
      error: "Unable to identify the message recipient.",
    };
  }

  const recipientIds = [
    ...new Set((otherParticipants ?? []).map((item) => item.user_id)),
  ];

  const { data: insertedMessage, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message: trimmedMessage,
    })
    .select("id")
    .single();

  if (messageError || !insertedMessage) {
    console.error("Send message error:", messageError);

    return {
      error: "Unable to send message.",
    };
  }

  const { data: conversationJob, error: conversationJobError } = await supabase
    .from("conversations")
    .select(
      `
      job_id,
      jobs (
        request_id
      )
    `,
    )
    .eq("id", conversationId)
    .maybeSingle();

  const requestId = Array.isArray(conversationJob?.jobs)
    ? conversationJob.jobs[0]?.request_id
    : conversationJob?.jobs?.request_id;

  if (conversationJobError || !conversationJob?.job_id || !requestId) {
    console.error("Conversation job lookup error:", conversationJobError);

    return {
      error: "Message sent, but the related request could not be identified.",
    };
  }

  // Notify the other conversation participant(s).
  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        userId: recipientId,
        type: "new_message",
        title: "New message",
        message: "You have received a new message.",
        link:
          user.role === "customer"
            ? `/dashboard/worker/jobs/${conversationJob.job_id}`
            : `/dashboard/customer/requests/${requestId}`,
        preference: "message_notifications",
        notifyAdmins: false,
      }),
    ),
  );

  // Keep the conversation's updated_at current.
  const { error: conversationError } = await supabase
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (conversationError) {
    console.error("Conversation update error:", conversationError);
  }

  revalidatePath("/dashboard/customer/requests");
  revalidatePath("/dashboard/worker/jobs/my");

  return {
    success: "Message sent.",
  };
}
