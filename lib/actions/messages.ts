"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

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
